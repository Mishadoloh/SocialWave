from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    bio = models.TextField(blank=True, default='')
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    is_bot = models.BooleanField(default=False, db_index=True)
    bot_type = models.CharField(max_length=50, blank=True, null=True)
    followers = models.ManyToManyField(
        'self',
        symmetrical=False,
        related_name='following',
        blank=True
    )

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        if self.avatar:
            try:
                from users.tasks import compress_avatar_task
                compress_avatar_task.delay(self.avatar.path, 300, 300)
            except Exception:
                try:
                    from PIL import Image as PILImage
                    img = PILImage.open(self.avatar.path)
                    img.thumbnail((300, 300), PILImage.LANCZOS)
                    img.save(self.avatar.path, optimize=True, quality=85)
                except Exception:
                    pass

    def followers_count(self):
        return self.followers.count()

    def following_count(self):
        return self.following.count()

    def __str__(self):
        return self.username
