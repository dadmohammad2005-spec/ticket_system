from rest_framework import serializers
from .models import Review

class ReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    operator_name = serializers.CharField(source='operator.name', read_only=True)
    route_name = serializers.CharField(source='trip.route.__str__', read_only=True)

    class Meta:
        model = Review
        fields = (
            'id', 'user', 'user_name', 'trip', 'operator', 'operator_name', 'route_name',
            'rating', 'cleanliness_rating', 'punctuality_rating', 'staff_rating',
            'comment', 'is_verified_purchase', 'created_at'
        )
        read_only_fields = ('user', 'operator', 'is_verified_purchase', 'created_at')

class CreateReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = ('trip', 'rating', 'cleanliness_rating', 'punctuality_rating', 'staff_rating', 'comment')
