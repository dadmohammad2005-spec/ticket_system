from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from .models import SupportTicket, SupportMessage, SupportStatus
from .serializers import SupportTicketSerializer, CreateSupportTicketSerializer, SupportMessageSerializer
from apps.accounts.permissions import IsOperatorOrAdmin

class SupportTicketViewSet(viewsets.ModelViewSet):
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'category', 'priority']
    search_fields = ['ticket_number', 'subject', 'user__email']
    ordering_fields = ['updated_at', 'created_at', 'priority']

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return SupportTicket.objects.none()
        if user.is_staff or getattr(user, 'role', '') in ['ADMIN', 'OPERATOR']:
            return SupportTicket.objects.select_related('user', 'booking').prefetch_related('messages', 'messages__sender').all()
        return SupportTicket.objects.select_related('user', 'booking').prefetch_related('messages', 'messages__sender').filter(user=user)

    def get_serializer_class(self):
        if self.action == 'create':
            return CreateSupportTicketSerializer
        return SupportTicketSerializer

    def get_permissions(self):
        return [permissions.IsAuthenticated()]

    def create(self, request, *args, **kwargs):
        serializer = CreateSupportTicketSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        initial_msg = serializer.validated_data.pop('initial_message')
        ticket = serializer.save(user=request.user)

        # Create first message
        SupportMessage.objects.create(
            ticket=ticket,
            sender=request.user,
            message=initial_msg,
            is_staff_reply=False
        )

        return Response(SupportTicketSerializer(ticket).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def reply(self, request, pk=None):
        ticket = self.get_object()
        msg_text = request.data.get('message', '').strip()
        if not msg_text:
            return Response({'error': 'Message content cannot be empty.'}, status=status.HTTP_400_BAD_REQUEST)

        is_staff = request.user.is_staff or getattr(request.user, 'role', '') in ['ADMIN', 'OPERATOR']
        
        message = SupportMessage.objects.create(
            ticket=ticket,
            sender=request.user,
            message=msg_text,
            is_staff_reply=is_staff
        )

        # Update status if staff replied
        if is_staff and ticket.status == SupportStatus.OPEN:
            ticket.status = SupportStatus.IN_PROGRESS
            ticket.save()

        return Response(SupportMessageSerializer(message).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], permission_classes=[IsOperatorOrAdmin])
    def update_status(self, request, pk=None):
        ticket = self.get_object()
        new_status = request.data.get('status')
        if new_status in SupportStatus.values:
            ticket.status = new_status
            ticket.save()
            return Response({'message': f"Ticket status changed to {new_status}"}, status=status.HTTP_200_OK)
        return Response({'error': 'Invalid status choice.'}, status=status.HTTP_400_BAD_REQUEST)
