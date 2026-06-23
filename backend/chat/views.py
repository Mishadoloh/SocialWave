from rest_framework import generics
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import ChatRoom, Message
from .serializers import ChatRoomSerializer, MessageSerializer


class RoomListView(generics.ListAPIView):
    serializer_class = ChatRoomSerializer

    def get_queryset(self):
        return ChatRoom.objects.filter(participants=self.request.user)


@api_view(['POST'])
def get_or_create_room(request):
    username = request.data.get('username')
    if not username:
        return Response({'error': 'username required'}, status=400)
    from django.contrib.auth import get_user_model
    User = get_user_model()
    try:
        other = User.objects.get(username=username)
    except User.DoesNotExist:
        return Response({'error': 'Користувача не знайдено'}, status=404)

    room, created = ChatRoom.get_or_create_room(request.user, other)
    serializer = ChatRoomSerializer(room, context={'request': request})
    return Response(serializer.data)


class MessageListView(generics.ListAPIView):
    serializer_class = MessageSerializer

    def get_queryset(self):
        room_id = self.kwargs['room_id']
        # Mark as read
        Message.objects.filter(
            room_id=room_id,
            is_read=False
        ).exclude(sender=self.request.user).update(is_read=True)
        return Message.objects.filter(room_id=room_id)
