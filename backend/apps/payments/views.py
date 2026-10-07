from django.db import transaction
from django.utils import timezone
from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from .models import Payment, PaymentRefund, PaymentStatus, PaymentProvider
from .serializers import PaymentSerializer, CheckoutRequestSerializer, RefundRequestSerializer, PaymentRefundSerializer
from .gateways import get_payment_gateway
from apps.bookings.models import Booking, BookingStatus, PaymentStatus as BookingPaymentStatus
from apps.tickets.models import DigitalTicket
from apps.tickets.generator import generate_qr_for_ticket
from apps.trips.models import SeatLock
from apps.notifications.models import Notification, NotificationType
from apps.accounts.permissions import IsAdminUserRole

class PaymentViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'provider']
    search_fields = ['transaction_id', 'booking__booking_reference', 'user__email']
    ordering_fields = ['created_at', 'amount']

    def get_queryset(self):
        user = self.request.user
        if user.is_staff or getattr(user, 'role', '') in ['ADMIN', 'OPERATOR']:
            return Payment.objects.select_related('booking', 'user').all()
        return Payment.objects.select_related('booking', 'user').filter(user=user)

class CheckoutView(APIView):
    permission_classes = [permissions.AllowAny]

    @transaction.atomic
    def post(self, request):
        serializer = CheckoutRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        booking_ref = serializer.validated_data['booking_reference']
        provider_name = serializer.validated_data['provider'].upper()
        payment_details = serializer.validated_data['payment_details']

        booking = Booking.objects.select_for_update().filter(booking_reference=booking_ref).first()
        if not booking:
            return Response({'error': 'Booking reference not found.'}, status=status.HTTP_404_NOT_FOUND)

        paying_user = request.user if (request.user and request.user.is_authenticated) else booking.user

        if booking.status == BookingStatus.CONFIRMED and booking.payment_status == BookingPaymentStatus.PAID:
            return Response({'message': 'This booking has already been paid and confirmed.'}, status=status.HTTP_200_OK)

        if booking.status in [BookingStatus.CANCELLED, BookingStatus.REFUNDED]:
            return Response({'error': f"Cannot process payment for a {booking.status} booking."}, status=status.HTTP_400_BAD_REQUEST)

        # Create or fetch pending Payment record
        payment = Payment.objects.create(
            booking=booking,
            user=paying_user,
            provider=provider_name if provider_name in PaymentProvider.values else PaymentProvider.SANDBOX_MOCK,
            amount=booking.final_amount,
            currency='USD',
            status=PaymentStatus.PROCESSING
        )

        gateway = get_payment_gateway(payment.provider)
        success, tx_data, err_msg = gateway.process_payment(payment, payment_details)

        if success:
            payment.status = PaymentStatus.PAID
            payment.provider_response = tx_data
            payment.save()

            booking.status = BookingStatus.CONFIRMED
            booking.payment_status = BookingPaymentStatus.PAID
            booking.save()

            # Release any temporary checkout seat locks for this trip
            SeatLock.objects.filter(trip=booking.trip, seat__in=[p.seat for p in booking.passengers.all()]).delete()

            # Automatically generate digital tickets with QR code
            for passenger in booking.passengers.all():
                ticket, _ = DigitalTicket.objects.get_or_create(booking=booking, passenger=passenger)
                try:
                    generate_qr_for_ticket(ticket)
                except Exception:
                    pass

            # Create in-app notification
            Notification.objects.create(
                user=request.user,
                title=f"Booking Confirmed: {booking.booking_reference}",
                message=f"Your journey from {booking.trip.route.origin_city.name} to {booking.trip.route.destination_city.name} is confirmed. Digital tickets are ready!",
                notification_type=NotificationType.BOOKING_CONFIRMED,
                metadata={'booking_reference': booking.booking_reference, 'trip_id': booking.trip.id}
            )

            return Response({
                'success': True,
                'message': 'Payment successful! Your booking is confirmed.',
                'transaction_id': payment.transaction_id,
                'booking_reference': booking.booking_reference,
                'amount_paid': float(payment.amount),
                'status': 'CONFIRMED'
            }, status=status.HTTP_200_OK)
        else:
            payment.status = PaymentStatus.FAILED
            payment.error_message = err_msg
            payment.provider_response = tx_data
            payment.save()

            return Response({
                'success': False,
                'error': err_msg or 'Payment failed. Please check payment credentials and retry.',
                'transaction_id': payment.transaction_id
            }, status=status.HTTP_400_BAD_REQUEST)

class ProcessRefundView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        serializer = RefundRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        booking_ref = serializer.validated_data['booking_reference']
        reason = serializer.validated_data['reason']

        booking = Booking.objects.select_for_update().filter(booking_reference=booking_ref).first()
        if not booking:
            return Response({'error': 'Booking not found.'}, status=status.HTTP_404_NOT_FOUND)

        if booking.user != request.user and not (request.user.is_staff or getattr(request.user, 'role', '') == 'ADMIN'):
            return Response({'error': 'Unauthorized.'}, status=status.HTTP_403_FORBIDDEN)

        if booking.payment_status != BookingPaymentStatus.PAID:
            return Response({'error': 'Booking does not have a completed payment to refund.'}, status=status.HTTP_400_BAD_REQUEST)

        # Calculate refund percentage based on operator policy and hours before departure
        hours_to_departure = (booking.trip.departure_time - timezone.now()).total_seconds() / 3600.0
        if hours_to_departure >= 24:
            refund_rate = 1.0  # 100% full refund
            policy_msg = "Full 100% refund applied (cancelled >24h prior)."
        elif hours_to_departure >= 12:
            refund_rate = 0.5  # 50% refund
            policy_msg = "50% refund applied (cancelled between 12-24h prior)."
        else:
            refund_rate = 0.0  # 0% refund
            policy_msg = "No refund permitted within 12 hours of departure."

        refund_amount = round(float(booking.final_amount) * refund_rate, 2)

        last_paid_payment = booking.payments.filter(status=PaymentStatus.PAID).first()
        if not last_paid_payment:
            return Response({'error': 'Original paid transaction record not found.'}, status=status.HTTP_400_BAD_REQUEST)

        refund_record = PaymentRefund.objects.create(
            payment=last_paid_payment,
            booking=booking,
            amount=refund_amount,
            reason=f"{reason} ({policy_msg})",
            status='APPROVED',
            processed_by=request.user
        )

        booking.status = BookingStatus.CANCELLED
        booking.payment_status = BookingPaymentStatus.REFUNDED if refund_rate == 1.0 else BookingPaymentStatus.PARTIALLY_REFUNDED
        booking.cancelled_at = timezone.now()
        booking.cancellation_reason = reason
        booking.save()

        # In-app notification
        Notification.objects.create(
            user=booking.user,
            title=f"Booking Cancelled: {booking.booking_reference}",
            message=f"Booking {booking.booking_reference} has been cancelled. {policy_msg} Refund amount: ${refund_amount}.",
            notification_type=NotificationType.TRIP_CANCELLED,
            metadata={'booking_reference': booking.booking_reference, 'refund_amount': refund_amount}
        )

        return Response({
            'success': True,
            'message': f"Booking cancelled. {policy_msg}",
            'refund_amount': refund_amount,
            'refund_reference': refund_record.refund_transaction_id,
            'booking_status': booking.status
        }, status=status.HTTP_200_OK)
