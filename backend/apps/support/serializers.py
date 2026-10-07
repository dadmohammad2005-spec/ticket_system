from rest_framework import serializers
from .models import SupportTicket, SupportMessage

class SupportMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.get_full_name', read_only=True)
    sender_email = serializers.CharField(source='sender.email', read_only=True)

    class Meta:
        model = SupportMessage
        fields = ('id', 'ticket', 'sender', 'sender_name', 'sender_email', 'message', 'is_staff_reply', 'created_at')
        read_only_fields = ('ticket', 'sender', 'is_staff_reply', 'created_at')

class SupportTicketSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', read_only=True)
    booking_reference = serializers.CharField(source='booking.booking_reference', read_only=True)
    messages = SupportMessageSerializer(many=True, read_only=True)

    class Meta:
        model = SupportTicket
        fields = (
            'id', 'ticket_number', 'user', 'user_email', 'booking', 'booking_reference',
            'subject', 'category', 'priority', 'status', 'created_at', 'updated_at', 'messages'
        )
        read_only_fields = ('ticket_number', 'user', 'created_at', 'updated_at')

class CreateSupportTicketSerializer(serializers.ModelSerializer):
    initial_message = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = SupportTicket
        fields = ('booking', 'subject', 'category', 'priority', 'initial_message')
