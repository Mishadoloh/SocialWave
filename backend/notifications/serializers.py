from rest_framework import serializers
from .models import Notification
from users.serializers import UserSerializer


class NotificationSerializer(serializers.ModelSerializer):
    actor = UserSerializer(read_only=True)
    post_id = serializers.IntegerField(source='post.id', read_only=True, allow_null=True)

    class Meta:
        model = Notification
        fields = ['id', 'actor', 'verb', 'post_id', 'is_read', 'created_at']
