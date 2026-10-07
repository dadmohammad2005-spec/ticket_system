from datetime import timedelta
from django.utils import timezone
from django.db.models import Sum, Count, F
from django.contrib.auth import get_user_model
from rest_framework.views import APIView
from rest_framework.response import Response
from apps.bookings.models import Booking, BookingStatus, PaymentStatus
from apps.routes.models import Route
from apps.operators.models import Operator
from apps.vehicles.models import Vehicle
from apps.trips.models import Trip
from apps.payments.models import Payment
from apps.accounts.permissions import IsAdminUserRole

User = get_user_model()

class AdminDashboardStatsView(APIView):
    permission_classes = [IsAdminUserRole]

    def get(self, request):
        now = timezone.now()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        thirty_days_ago = now - timedelta(days=30)
        seven_days_ago = now - timedelta(days=7)

        # Overview counters
        total_users = User.objects.count()
        total_bookings = Booking.objects.count()
        today_bookings = Booking.objects.filter(created_at__gte=today_start).count()
        
        # Revenue
        total_revenue = Booking.objects.filter(
            payment_status=PaymentStatus.PAID
        ).aggregate(Sum('final_amount'))['final_amount__sum'] or 0.0

        cancelled_bookings = Booking.objects.filter(status=BookingStatus.CANCELLED).count()
        active_routes = Route.objects.filter(is_active=True).count()
        active_operators = Operator.objects.filter(is_active=True).count()
        available_vehicles = Vehicle.objects.filter(is_active=True).count()
        active_trips = Trip.objects.filter(departure_time__gte=now, status='SCHEDULED').count()

        # Daily bookings for the last 7 days
        daily_bookings = []
        for i in range(6, -1, -1):
            day_dt = now.date() - timedelta(days=i)
            cnt = Booking.objects.filter(created_at__date=day_dt).count()
            daily_bookings.append({
                'date': day_dt.strftime('%b %d'),
                'count': cnt
            })

        # Monthly revenue breakdown (last 6 months)
        monthly_revenue = []
        for m in range(5, -1, -1):
            target_month = (now.month - m - 1) % 12 + 1
            # Simple month name representation
            label = (now.replace(day=1) - timedelta(days=m * 30)).strftime('%b %Y')
            m_rev = Booking.objects.filter(
                payment_status=PaymentStatus.PAID,
                created_at__year=now.year if target_month <= now.month else now.year - 1,
                created_at__month=target_month
            ).aggregate(Sum('final_amount'))['final_amount__sum'] or 0.0
            monthly_revenue.append({
                'month': label,
                'revenue': float(m_rev)
            })

        # Popular routes
        popular_routes = (
            Route.objects.annotate(bookings_count=Count('trips__bookings'))
            .order_by('-bookings_count')[:5]
        )
        popular_routes_data = [
            {
                'id': r.id,
                'name': f"{r.origin_city.name} → {r.destination_city.name}",
                'bookings_count': r.bookings_count,
                'distance': float(r.distance_km),
                'duration': r.duration_formatted
            }
            for r in popular_routes
        ]

        # Booking status distribution
        status_distribution = [
            {'status': 'Confirmed', 'count': Booking.objects.filter(status=BookingStatus.CONFIRMED).count(), 'color': '#10B981'},
            {'status': 'Pending', 'count': Booking.objects.filter(status=BookingStatus.PENDING).count(), 'color': '#F59E0B'},
            {'status': 'Cancelled', 'count': Booking.objects.filter(status=BookingStatus.CANCELLED).count(), 'color': '#EF4444'},
            {'status': 'Refunded', 'count': Booking.objects.filter(status=BookingStatus.REFUNDED).count(), 'color': '#6B7280'},
        ]

        # User growth (last 4 weeks)
        user_growth = []
        for w in range(3, -1, -1):
            w_start = now - timedelta(weeks=w + 1)
            w_end = now - timedelta(weeks=w)
            w_count = User.objects.filter(date_joined__gte=w_start, date_joined__lt=w_end).count()
            user_growth.append({
                'week': f"Week -{w}",
                'new_users': w_count
            })

        return Response({
            'kpis': {
                'total_users': total_users,
                'total_bookings': total_bookings,
                'today_bookings': today_bookings,
                'total_revenue': float(total_revenue),
                'cancelled_bookings': cancelled_bookings,
                'active_routes': active_routes,
                'active_operators': active_operators,
                'available_vehicles': available_vehicles,
                'active_trips': active_trips,
            },
            'daily_bookings': daily_bookings,
            'monthly_revenue': monthly_revenue,
            'popular_routes': popular_routes_data,
            'status_distribution': status_distribution,
            'user_growth': user_growth,
        })
