from django.http import HttpResponse, Http404
from django.utils import timezone
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import DigitalTicket
from .serializers import DigitalTicketSerializer
from .generator import generate_booking_pdf
from apps.bookings.models import Booking
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiTypes
from apps.accounts.permissions import IsOperatorOrAdmin

class TicketViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = DigitalTicketSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return DigitalTicket.objects.none()
        user = getattr(self.request, 'user', None)
        if not user or not user.is_authenticated:
            return DigitalTicket.objects.none()
        if user.is_staff or getattr(user, 'role', '') in ['ADMIN', 'OPERATOR']:
            return DigitalTicket.objects.select_related('booking', 'passenger', 'booking__trip').all()
        return DigitalTicket.objects.select_related('booking', 'passenger', 'booking__trip').filter(booking__user=user)

    @extend_schema(
        summary="Verify ticket QR code",
        description="Public gate scanner endpoint to verify authenticity of ticket QR code",
        parameters=[OpenApiParameter("ticket_code", OpenApiTypes.STR, OpenApiParameter.PATH, description="The unique ticket code from QR scan")]
    )
    @action(detail=False, methods=['get'], url_path=r'verify/(?P<ticket_code>[^/.]+)', permission_classes=[permissions.AllowAny])
    def verify_ticket(self, request, ticket_code=None):
        """Public or Gate Scanner endpoint to verify authenticity of ticket QR code"""
        ticket = DigitalTicket.objects.select_related(
            'booking', 'passenger', 'booking__trip', 'booking__trip__operator',
            'booking__trip__route__origin_city', 'booking__trip__route__destination_city'
        ).filter(ticket_code=ticket_code).first()

        if not ticket:
            return Response({'valid': False, 'message': 'Ticket not found or invalid.'}, status=status.HTTP_404_NOT_FOUND)

        trip = ticket.booking.trip
        return Response({
            'valid': True,
            'ticket_code': ticket.ticket_code,
            'booking_reference': ticket.booking.booking_reference,
            'passenger_name': ticket.passenger.full_name,
            'id_card': ticket.passenger.id_card_number,
            'seat_number': ticket.passenger.seat_number,
            'route': f"{trip.route.origin_city.name} → {trip.route.destination_city.name}",
            'departure_time': trip.departure_time,
            'operator': trip.operator.name,
            'booking_status': ticket.booking.status,
            'is_validated': ticket.is_validated,
            'validated_at': ticket.validated_at
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], url_path='validate-gate/(?P<ticket_code>[^/.]+)', permission_classes=[IsOperatorOrAdmin])
    def validate_gate(self, request, ticket_code=None):
        """Boarding gate operator marks passenger as boarded"""
        ticket = DigitalTicket.objects.filter(ticket_code=ticket_code).first()
        if not ticket:
            return Response({'error': 'Ticket not found.'}, status=status.HTTP_404_NOT_FOUND)
        
        if ticket.is_validated:
            return Response({
                'message': f"Ticket was already validated on {ticket.validated_at.strftime('%Y-%m-%d %H:%M')}",
                'already_validated': True
            }, status=status.HTTP_200_OK)

        ticket.is_validated = True
        ticket.validated_at = timezone.now()
        ticket.save()
        return Response({
            'message': f"Passenger {ticket.passenger.full_name} successfully checked-in and validated for boarding!",
            'validated_at': ticket.validated_at
        }, status=status.HTTP_200_OK)

    @extend_schema(
        summary="Download PDF Boarding Pass",
        description="Generates and serves high-res PDF boarding pass for printing and physical validation",
        parameters=[OpenApiParameter("booking_ref", OpenApiTypes.STR, OpenApiParameter.PATH, description="PNR Booking reference (e.g. APX-DEMO2026)")]
    )
    @action(detail=False, methods=['get'], url_path=r'download-pdf/(?P<booking_ref>[^/.]+)', permission_classes=[permissions.AllowAny])
    def download_pdf(self, request, booking_ref=None):
        """Generates and serves high-res PDF boarding pass for printing"""
        booking = Booking.objects.select_related(
            'trip', 'trip__operator', 'trip__vehicle', 'trip__route',
            'trip__route__origin_city', 'trip__route__destination_city'
        ).prefetch_related('passengers').filter(booking_reference=booking_ref).first()

        if not booking:
            raise Http404("Booking not found.")

        # If user is authenticated, ensure permission unless staff or owner
        if request.user.is_authenticated and not (request.user.is_staff or getattr(request.user, 'role', '') == 'ADMIN'):
            if booking.user != request.user:
                return Response({'error': 'Unauthorized to download this ticket.'}, status=status.HTTP_403_FORBIDDEN)

        pdf_bytes = generate_booking_pdf(booking)
        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        response['Content-Disposition'] = f'inline; filename="Ticket_{booking.booking_reference}.pdf"'
        return response
