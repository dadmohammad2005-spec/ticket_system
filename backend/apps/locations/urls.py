from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CountryViewSet, CityViewSet, StationViewSet

router = DefaultRouter()
router.register(r'countries', CountryViewSet, basename='country')
router.register(r'cities', CityViewSet, basename='city')
router.register(r'stations', StationViewSet, basename='station')

urlpatterns = [
    path('', include(router.urls)),
]
