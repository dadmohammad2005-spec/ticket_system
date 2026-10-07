from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter
from .models import Coupon
from .serializers import CouponSerializer, ValidateCouponSerializer
from apps.accounts.permissions import IsAdminUserRole

class CouponViewSet(viewsets.ModelViewSet):
    queryset = Coupon.objects.all()
    serializer_class = CouponSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['is_active', 'discount_type']
    search_fields = ['code']

    def get_permissions(self):
        if self.action in ['validate_coupon']:
            return [permissions.AllowAny()]
        return [IsAdminUserRole()]

    @action(detail=False, methods=['post'])
    def validate_coupon(self, request):
        serializer = ValidateCouponSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        code = serializer.validated_data['code'].strip().upper()
        amount = serializer.validated_data['amount']

        coupon = Coupon.objects.filter(code__iexact=code).first()
        if not coupon:
            return Response({'valid': False, 'message': 'Invalid coupon code.'}, status=status.HTTP_404_NOT_FOUND)

        discount, msg = coupon.calculate_discount(amount)
        if discount <= 0:
            return Response({'valid': False, 'message': msg}, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            'valid': True,
            'code': coupon.code,
            'discount_amount': float(discount),
            'final_amount': float(max(0, amount - discount)),
            'message': msg
        }, status=status.HTTP_200_OK)
