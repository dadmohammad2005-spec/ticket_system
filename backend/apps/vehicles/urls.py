from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import VehicleViewSet, SeatViewSet

router = DefaultRouter()
router.register(r'vehicles', VehicleViewSet, basename='vehicle')
router.register(r'seats', SeatViewSet, basename='seat')

urlpatterns = [
    path('', include(router.urls)),
]
