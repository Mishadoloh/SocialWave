from celery import shared_task
from PIL import Image
import os

@shared_task
def compress_image_task(file_path, max_width, max_height):
    if not file_path or not os.path.exists(file_path):
        return
    try:
        img = Image.open(file_path)
        if img.height > max_height or img.width > max_width:
            output_size = (max_width, max_height)
            img.thumbnail(output_size)
            img.save(file_path, quality=85)
    except Exception as e:
        import logging
        logging.error(f"Failed to compress image {file_path}: {e}")

@shared_task
def cleanup_reports():
    from posts.models import Report
    from django.utils import timezone
    from datetime import timedelta
    
    # Delete resolved reports older than 30 days
    old_reports = Report.objects.filter(
        is_resolved=True, 
        created_at__lt=timezone.now() - timedelta(days=30)
    )
    count = old_reports.count()
    old_reports.delete()
    return f"Deleted {count} old resolved reports."
