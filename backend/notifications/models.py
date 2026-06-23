from django.db import models
from django.conf import settings


class Notification(models.Model):
    VERB_CHOICES = [
        ('liked', 'liked'),
        ('commented', 'commented'),
        ('followed', 'followed'),
    ]
    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='actions')
    verb = models.CharField(max_length=20, choices=VERB_CHOICES)
    post = models.ForeignKey('posts.Post', on_delete=models.CASCADE, null=True, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.actor.username} {self.verb} → {self.recipient.username}'
