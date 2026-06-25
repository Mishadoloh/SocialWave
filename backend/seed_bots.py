import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from users.models import User

BOTS = [
    {
        'username': 'FriendlyBot',
        'email': 'friendly@bot.com',
        'bio': 'Привіт! Я завжди радий поспілкуватися та підтримати дружню бесіду. 😊',
        'bot_type': 'friendly'
    },
    {
        'username': 'JokeBot',
        'email': 'joke@bot.com',
        'bio': 'Знаю мільйон жартів. Напиши мені, якщо сумно! 🤡',
        'bot_type': 'joker'
    },
    {
        'username': 'PhilosopherBot',
        'email': 'philosopher@bot.com',
        'bio': 'Розмірковую про сенс життя та штучний інтелект. 🧐',
        'bot_type': 'philosopher'
    }
]

def seed_bots():
    print("Seeding bots...")
    for bot_data in BOTS:
        bot, created = User.objects.get_or_create(
            username=bot_data['username'],
            defaults={
                'email': bot_data['email'],
                'bio': bot_data['bio'],
                'is_bot': True,
                'bot_type': bot_data['bot_type']
            }
        )
        if created:
            bot.set_password('botpassword123')
            bot.save()
            print(f"Created bot: {bot.username}")
        else:
            print(f"Bot {bot.username} already exists")

if __name__ == '__main__':
    seed_bots()
