from django.db import models
from django.conf import settings


class ChatRoom(models.Model):
    participants = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='chat_rooms')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    @classmethod
    def get_or_create_room(cls, user1, user2):
        rooms = cls.objects.filter(participants=user1).filter(participants=user2)
        if rooms.exists():
            return rooms.first(), False
        room = cls.objects.create()
        room.participants.add(user1, user2)
        return room, True

    def __str__(self):
        return f'Room {self.id}'


class Message(models.Model):
    room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sent_messages')
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f'{self.sender.username}: {self.content[:40]}'
