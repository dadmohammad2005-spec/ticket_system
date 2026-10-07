from rest_framework import serializers
from .models import Operator

class OperatorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Operator
        fields = '__all__'
        read_only_fields = ('rating', 'total_reviews', 'created_at', 'updated_at')
