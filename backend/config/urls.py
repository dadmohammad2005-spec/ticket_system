"""
URL configuration for online ticket booking platform.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView
from config.views import api_root_view, health_check_view, real_ticket_view

urlpatterns = [
    # API Landing Hub & System Health
    path('', api_root_view, name='home'),
    path('health/', health_check_view, name='health_check'),
    path('api/health/', health_check_view, name='api_health_check'),

    # Real Printable Boarding Pass & E-Ticket
    path('ticket/', real_ticket_view, name='real_ticket_default'),
    path('ticket/<str:booking_ref>/', real_ticket_view, name='real_ticket'),
    path('print-ticket/', real_ticket_view, name='print_ticket_default'),
    path('print-ticket/<str:booking_ref>/', real_ticket_view, name='print_ticket'),

    # Django Admin Interface
    path('admin/', admin.site.urls),

    # OpenAPI 3 Schema & Interactive Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),

    # REST API endpoints
    path('api/', include('apps.accounts.urls')),
    path('api/', api_root_view, name='api_hub'),
    path('api/locations/', include('apps.locations.urls')),
    path('api/operators/', include('apps.operators.urls')),
    path('api/transport/', include('apps.vehicles.urls')),
    path('api/routes/', include('apps.routes.urls')),
    path('api/trips/', include('apps.trips.urls')),
    path('api/bookings/', include('apps.bookings.urls')),
    path('api/payments/', include('apps.payments.urls')),
    path('api/tickets/', include('apps.tickets.urls')),
    path('api/coupons/', include('apps.coupons.urls')),
    path('api/reviews/', include('apps.reviews.urls')),
    path('api/notifications/', include('apps.notifications.urls')),
    path('api/support/', include('apps.support.urls')),
    path('api/analytics/', include('apps.analytics.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
