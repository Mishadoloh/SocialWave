from celery import shared_task
from PIL import Image
import os

@shared_task
def compress_avatar_task(file_path, max_width, max_height):
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
        logging.error(f"Failed to compress avatar {file_path}: {e}")
