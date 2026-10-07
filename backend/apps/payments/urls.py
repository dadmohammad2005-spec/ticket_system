from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PaymentViewSet, CheckoutView, ProcessRefundView

router = DefaultRouter()
router.register(r'history', PaymentViewSet, basename='payment')

urlpatterns = [
    path('checkout/', CheckoutView.as_view(), name='payment_checkout'),
    path('refund/', ProcessRefundView.as_view(), name='payment_refund'),
    path('', include(router.urls)),
]
