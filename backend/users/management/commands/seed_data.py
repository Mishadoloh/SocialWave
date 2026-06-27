import random
import os
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from django.conf import settings
from PIL import Image, ImageDraw

User = get_user_model()

UKRAINIAN_NAMES = [
    'Олексій', 'Михайло', 'Іван', 'Дмитро', 'Андрій', 'Сергій', 'Василь', 'Богдан',
    'Тарас', 'Юрій', 'Ігор', 'Роман', 'Максим', 'Артем', 'Денис', 'Олег',
    'Петро', 'Володимир', 'Микола', 'Євген', 'Назар', 'Антон', 'Кирило', 'Захар',
    'Анна', 'Марія', 'Ольга', 'Наталія', 'Тетяна', 'Ірина', 'Юлія', 'Катерина',
    'Вікторія', 'Людмила', 'Валентина', 'Світлана', 'Надія', 'Галина', 'Оксана', 'Лариса',
    'Аліна', 'Дарина', 'Поліна', 'Софія', 'Карина', 'Альона', 'Лілія', 'Ася'
]

SURNAMES = [
    'Шевченко', 'Бондаренко', 'Коваленко', 'Олійник', 'Кравченко', 'Лисенко',
    'Марченко', 'Поліщук', 'Савченко', 'Романенко', 'Лук\'яненко', 'Хмара',
    'Стеценко', 'Лevченко', 'Гриценко', 'Мороз', 'Мельник', 'Василенко',
    'Бойко', 'Павленко', 'Тимченко', 'Лещенко', 'Клименко', 'Руденко'
]

POST_TEXTS = [
    "Сьогодні чудовий день! ☀️ Насолоджуюсь кожним моментом.",
    "Щойно приготував смачний борщ. Класика завжди в моді! 🍲",
    "Читаю цікаву книгу. Рекомендую всім любителям фантастики 📚",
    "Прогулявся по місту — стільки нових вражень! 🏙️",
    "Вчора була неймовірна вечірка з друзями 🎉 Найкращі спогади!",
    "Починаю вивчати нову мову. Хто зі мною? 🌍",
    "Весна нарешті прийшла! Природа просто казкова 🌸",
    "Зробив нові фото на природі. Дуже задоволений результатом 📷",
    "Тренування пройшло на ура! 💪 Продовжую рухатися до мети.",
    "Сьогодні спробував нову страву. Неочікувано смачно! 😋",
    "Розпочинаю новий проект — дуже хвилююся та радію одночасно!",
    "Дивлюся захід сонця і думаю про важливі речі 🌅",
    "Українська культура — це наш скарб. Пишаюся нею! 🇺🇦",
    "Щойно пробіг 10 кілометрів! Особистий рекорд 🏃‍♂️",
    "Збираю гриби в лісі — найкраща терапія від стресу 🍄",
    "Вивчив нову пісню на гітарі. Практика — ключ до успіху 🎸",
    "Сьогодні зустрів старого друга якого не бачив 5 років! Час летить ⏰",
    "Приготував каву і сів писати плани на тиждень ☕ Продуктивність понад усе!",
    "Нова стрижка — новий я! Змінюватись — це прекрасно ✂️",
    "Їздив у гори на вихідних. Краєвиди неймовірні! ⛰️",
    "Допоміг сусіду з ремонтом. Взаємодопомога — це важливо 🤝",
    "Зранку медитував 20 хвилин. Голова стає яснішою 🧘",
    "Переглянув новий фильм — рекомендую всім! Сильна драма 🎬",
    "Посіяв перші насіння на городі. Чекаю на врожай 🌱",
    "Написав вірш сьогодні — давно не творив. Приємне відчуття ✍️",
    "Займаюся фотографією вже рік. Помітний прогрес! 📸",
    "Мова — душа народу. Говорю і пишу тільки українською! 🗣️",
    "Відвідав художню виставку. Натхнення переповнює! 🎨",
    "Зустрів схід сонця на березі річки. Ніколи не забуду цей момент 🌊",
    "Кіт прийшов і ліг на клавіатуру. Робота зупинена 🐱",
    "Сьогодні зрозумів важливу істину: треба менше планувати і більше діяти!",
    "Готую до марафону — 3 місяці тренувань позаду 🏁",
    "Наш місто таке красиве влітку! Люблю гуляти алеями 🌳",
    "Дала собі слово читати хоча б 30 сторінок щодня 📖",
    "Зробила генеральне прибирання — відчуваю полегшення і свіжість! 🧹",
    "Навчилася плести вінки. Традиції наших предків живуть! 🌼",
    "Підписалася на онлайн-курс з програмування. Час вчитися! 💻",
    "Влаштувала пікнік з сім'єю. Найщасливіші моменти — з рідними 🧺",
    "Зустрічаю кожен ранок з подякою. Це змінює ставлення до дня ☀️",
    "Написала листа бабусі від руки. Вона так зраділа! 💌",
    "Освоїла новий рецепт пирогів. Найкращий тиждень! 🥧",
    "Слухаю українську музику і серце радіє. Наш рок — найкращий 🎵",
    "Пішла вперше на йогу. Скрипіло все але відчуваю себе краще 😅",
    "Зробила благодійний внесок. Маленькі кроки — великі зміни 💙",
    "Бачила веселку після дощу. Природа — найкращий художник 🌈",
    "Завершила складний проєкт на роботі. Гордість за команду! 🏆",
    "Посадила квіти на балконі — тепер маю свій мінісад 🌺",
    "Зустрілася з подругою якої не бачила пів року. Нарешті! 🤗",
    "Сьогодні день народження мами. Найкраща людина у моєму житті! ❤️",
    "Їла вареники зі сметаною. Класика незмінна 🥟",
]

BIO_TEMPLATES = [
    "Люблю подорожувати та фотографувати 📷",
    "Програміст | Кавоман | Мрійник ☕",
    "Студентка | Книголюб | Оптиміст 📚",
    "Спорт та здоровий спосіб життя 💪",
    "Художник душею і руками 🎨",
    "Музикант | Гітарист | Меломан 🎸",
    "Мандрівник у пошуку пригод 🌍",
    "Фотограф-аматор. Ловлю моменти 📸",
    "Кулінар-ентузіаст | Люблю готувати 🍳",
    "IT-спеціаліст | Геймер | Тато 👨‍💻",
    "Вчителька | Творча особистість ✏️",
    "Психолог | Слухаю і допомагаю 🧠",
    "Бігун | 42 км і далі 🏃",
    "Дизайнер | Роблю красиве 🎭",
    "Відеограф | Розповідаю історії 🎬",
]

COMMENT_TEMPLATES = [
    "Круто! 👍", "Дуже гарно! 😍", "Згоден на всі 100%!", "Неймовірно!",
    "Цікава думка 🤔", "Дякую за пост!", "Вау! 😮", "Прекрасне фото/відео!",
    "Супер!", "Успіхів у починаннях! 💪", "Оце так так!", "Слава Україні! 🇺🇦",
    "Схоже на правду", "Дуже мотивує!", "Дякую, збережу собі", "Неймовірні кольори!",
    "Шикарно!", "Гарного дня! ☀️", "Разом до перемоги! 🇺🇦", "Справжній шедевр!"
]

GRADIENT_PALETTES = [
    ((79, 70, 229), (147, 51, 234)),   # Indigo to Purple
    ((236, 72, 153), (239, 68, 68)),   # Pink to Red
    ((16, 185, 129), (5, 150, 105)),   # Emerald to Green
    ((245, 158, 11), (217, 119, 6)),   # Amber to Orange
    ((6, 182, 212), (59, 130, 246)),   # Cyan to Blue
    ((139, 92, 246), (99, 102, 241)),  # Purple to Indigo
    ((244, 63, 94), (225, 29, 72)),    # Rose
    ((20, 184, 166), (13, 148, 136)),  # Teal
]


class Command(BaseCommand):
    help = 'Seed database with fake users, follows, likes, comments, and media files'

    def add_arguments(self, parser):
        parser.add_argument('--users', type=int, default=1000)
        parser.add_argument('--posts', type=int, default=1500)

    def handle(self, *args, **options):
        from posts.models import Post, Comment, Like

        num_users = options['users']
        num_posts = options['posts']

        # Ensure media directories exist
        posts_dir = os.path.join(settings.MEDIA_ROOT, 'posts')
        videos_dir = os.path.join(posts_dir, 'videos')
        avatars_dir = os.path.join(settings.MEDIA_ROOT, 'avatars')
        os.makedirs(videos_dir, exist_ok=True)
        os.makedirs(avatars_dir, exist_ok=True)

        # Generate sample image using PIL
        sample_img_path = os.path.join(posts_dir, 'seeded_photo.jpg')
        if not os.path.exists(sample_img_path):
            img = Image.new('RGB', (800, 600), color=(110, 68, 255))
            d = ImageDraw.Draw(img)
            d.text((100, 250), "SocialWave Seeded Photo", fill=(255, 255, 255))
            img.save(sample_img_path)

        # Download sample video
        sample_vid_path = os.path.join(videos_dir, 'seeded_video.mp4')
        if not os.path.exists(sample_vid_path):
            try:
                import urllib.request
                urllib.request.urlretrieve('https://www.w3schools.com/html/mov_bbb.mp4', sample_vid_path)
            except Exception:
                with open(sample_vid_path, 'wb') as f:
                    f.write(b'\x00\x00\x00\x18ftypmp42\x00\x00\x00\x00mp42isom')

        # Generate 30 beautiful avatar templates
        self.stdout.write('[AVATARS] Creating avatar gradient templates...')
        avatar_paths = []
        for i in range(30):
            avatar_filename = f'avatar_{i}.jpg'
            avatar_filepath = os.path.join(avatars_dir, avatar_filename)
            if not os.path.exists(avatar_filepath):
                img = Image.new('RGB', (120, 120))
                draw = ImageDraw.Draw(img)
                color1, color2 = random.choice(GRADIENT_PALETTES)
                for y in range(120):
                    r = int(color1[0] + (color2[0] - color1[0]) * y / 120)
                    g = int(color1[1] + (color2[1] - color1[1]) * y / 120)
                    b = int(color1[2] + (color2[2] - color1[2]) * y / 120)
                    draw.line((0, y, 120, y), fill=(r, g, b))
                draw.ellipse((15, 15, 105, 105), outline=(255, 255, 255), width=2)
                img.save(avatar_filepath, quality=90)
            avatar_paths.append(f'avatars/{avatar_filename}')

        self.stdout.write(f'[START] Creating {num_users} users...')

        created_users = []
        for i in range(num_users):
            name = random.choice(UKRAINIAN_NAMES)
            surname = random.choice(SURNAMES)
            username = f"{name.lower().replace(chr(39), '')}_{surname.lower().replace(chr(39), '')}_{i}"[:30]
            email = f"user{i}_{random.randint(10000, 99999)}@socialwave.ua"

            existing_user = User.objects.filter(username=username).first()
            if existing_user:
                if not existing_user.avatar:
                    existing_user.avatar = random.choice(avatar_paths)
                    existing_user.save()
                continue

            user = User.objects.create_user(
                username=username,
                email=email,
                password='Password123!',
                first_name=name,
                last_name=surname,
                bio=random.choice(BIO_TEMPLATES),
                avatar=random.choice(avatar_paths)
            )
            created_users.append(user)

            if (i + 1) % 100 == 0:
                self.stdout.write(f'  [OK] {i + 1}/{num_users} users created')

        # Update all existing users who don't have an avatar
        self.stdout.write('[AVATARS] Updating existing empty avatars...')
        empty_avatars = User.objects.filter(avatar='')
        updated_avatars_count = 0
        for u in empty_avatars:
            u.avatar = random.choice(avatar_paths)
            u.save()
            updated_avatars_count += 1
        self.stdout.write(f'  [OK] Assigned avatars to {updated_avatars_count} users')

        self.stdout.write(f'[OK] Created {len(created_users)} new users!')

        # Add follows between random users
        all_users = list(User.objects.all())
        self.stdout.write('[LINKS] Setting up follows...')
        for user in random.sample(all_users, min(500, len(all_users))):
            if user.following.count() < 3:
                follow_count = random.randint(3, 15)
                to_follow = random.sample([u for u in all_users if u.id != user.id], min(follow_count, len(all_users) - 1))
                for target in to_follow:
                    user.following.add(target)

        # Create posts
        self.stdout.write(f'[POSTS] Creating {num_posts} posts...')
        all_users_for_posts = list(User.objects.all())

        for i in range(num_posts):
            author = random.choice(all_users_for_posts)
            content = random.choice(POST_TEXTS)
            
            if random.random() < 0.3:
                extra_tags = random.choice(['#ukraine', '#life', '#love', '#photo', '#nature', '#sport', '#music', '#kyiv'])
                content += f'\n\n{extra_tags}'

            days_ago = random.randint(0, 90)
            created = timezone.now() - timedelta(days=days_ago, hours=random.randint(0, 23))

            post = Post(author=author, content=content)
            
            rand_val = random.random()
            if rand_val < 0.25:
                post.image = 'posts/seeded_photo.jpg'
            elif rand_val < 0.45:
                post.video = 'posts/videos/seeded_video.mp4'

            post.save()
            Post.objects.filter(pk=post.pk).update(created_at=created)

            if (i + 1) % 100 == 0:
                self.stdout.write(f'  [OK] {i + 1}/{num_posts} posts created')

        # Add likes
        self.stdout.write('[LIKES] Adding likes...')
        all_posts = list(Post.objects.all())
        for post in random.sample(all_posts, min(1000, len(all_posts))):
            likers = random.sample(all_users_for_posts, random.randint(1, min(20, len(all_users_for_posts))))
            for liker in likers:
                Like.objects.get_or_create(user=liker, post=post)

        # Add comments
        self.stdout.write('[COMMENTS] Adding comments...')
        for post in random.sample(all_posts, min(800, len(all_posts))):
            num_comments = random.randint(1, 4)
            commenters = random.sample(all_users_for_posts, num_comments)
            for commenter in commenters:
                Comment.objects.create(
                    author=commenter,
                    post=post,
                    content=random.choice(COMMENT_TEMPLATES),
                    created_at=timezone.now() - timedelta(days=random.randint(0, 5))
                )

        self.stdout.write(self.style.SUCCESS(
            f'\n[DONE] Seeding complete!\n'
            f'   Users created: {len(created_users)}\n'
            f'   Posts created: {num_posts}\n'
            f'   Follows set up\n'
            f'   Likes and comments added\n'
        ))
