import re
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Post, Hashtag

@receiver(post_save, sender=Post)
def extract_hashtags(sender, instance, created, **kwargs):
    # Find all hashtags in the content
    hashtags = re.findall(r'#(\w+)', instance.content)
    
    # Clear existing tags if it's an update
    if not created:
        instance.hashtags.clear()
        
    for tag in hashtags:
        tag_name = tag.lower()
        hashtag_obj, _ = Hashtag.objects.get_or_create(name=tag_name)
        hashtag_obj.posts.add(instance)
