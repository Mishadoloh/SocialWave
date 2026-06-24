import os
import django
import random

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth import get_user_model
from posts.models import Post, Like
from notifications.models import Notification

User = get_user_model()

def run_seed():
    print("Починаємо генерацію даних...")

    # Clear old data (optional, but let's keep existing user to not break their login)
    # Just add new ones.
    
    names = [
        "alex_dev", "maria_designer", "john_hacker", "ukraine_coder", 
        "neon_cyber", "frontend_guru", "backend_master", "crypto_bro",
        "ui_ux_fan", "startup_founder"
    ]
    
    avatars = [
        "https://i.pravatar.cc/150?u=1",
        "https://i.pravatar.cc/150?u=2",
        "https://i.pravatar.cc/150?u=3",
        "https://i.pravatar.cc/150?u=4",
        "https://i.pravatar.cc/150?u=5"
    ]

    users = []
    for name in names:
        user, created = User.objects.get_or_create(username=name)
        if created:
            user.set_password('12345')
            user.avatar_url = random.choice(avatars)
            user.save()
            print(f"Створено користувача: {name}")
        users.append(user)

    # Get the real user if exists to add followers to them too
    # Assuming user is running app
    all_users = list(User.objects.all())

    post_contents = [
        "Сьогодні вивчив новий фреймворк! Це просто космос 🚀",
        "Як вам мій новий дизайн? Працював над ним всю ніч 🎨",
        "Шукаю команду для стартапу! Пишіть в ПП",
        "Next.js + Django = ідеальний стек для будь-якого проекту 🔥",
        "Не можу повірити, що це працює з першого разу...",
        "Glassmorphism знову в тренді! Що думаєте?",
        "Який ваш улюблений редактор коду? VS Code чи Cursor?",
        "Щойно доробив фічу оптимістичного UI для лайків, дуже круто відчувається!",
        "Всім гарного дня і продуктивного кодінгу! 💻",
        "Хто знає, як правильно налаштувати WebSocket в Django Channels?",
        "TypeScript рятує стільки нервів! Статична типізація - це база.",
        "П'ю каву і фікшу баги. Класичний ранок айтішника ☕🐛"
    ]

    print("Створення постів...")
    for _ in range(30):
        author = random.choice(all_users)
        content = random.choice(post_contents)
        Post.objects.create(author=author, content=content)

    print("Генерація підписок та лайків...")
    posts = list(Post.objects.all())
    for u1 in all_users:
        # Follow random 3-5 users
        targets = random.sample(all_users, k=random.randint(3, 5))
        for u2 in targets:
            if u1 != u2 and not u1.following.filter(id=u2.id).exists():
                u1.following.add(u2)
                # Create notification
                Notification.objects.create(
                    recipient=u2,
                    actor=u1,
                    verb='followed'
                )

        # Like random 5-10 posts
        liked_posts = random.sample(posts, k=min(len(posts), random.randint(5, 10)))
        for p in liked_posts:
            if not Like.objects.filter(post=p, user=u1).exists():
                Like.objects.create(post=p, user=u1)
                if p.author != u1:
                    Notification.objects.create(
                        recipient=p.author,
                        actor=u1,
                        verb='liked',
                        post=p
                    )

    print("Готово! База даних наповнена 🚀")

if __name__ == '__main__':
    run_seed()
