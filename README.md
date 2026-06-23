# 🌊 SocialWave — Соціальна мережа

Full-stack соціальна мережа з real-time чатом, стрічкою постів, підписками та сповіщеннями.

## Стек

| Шар | Технологія |
|-----|------------|
| Frontend | Next.js 15 + TypeScript |
| Backend | Django 6 + DRF + Django Channels |
| БД | SQLite (dev) |
| Real-time | WebSockets (in-memory) |
| Auth | JWT (SimpleJWT) |

## Структура

```
проект/
├── backend/          # Django API
│   ├── core/         # settings, urls, asgi
│   ├── users/        # auth, profiles, follow
│   ├── posts/        # posts, likes, comments
│   ├── chat/         # WebSocket chat
│   └── notifications/
└── frontend/         # Next.js
    └── src/
        ├── app/      # Pages (App Router)
        ├── components/
        └── lib/      # API client, AuthContext
```

## Запуск

### Backend (Django) — порт 8000
```powershell
cd backend
python manage.py runserver
```

### Frontend (Next.js) — порт 3000
```powershell
cd frontend
npm run dev
```

## API Endpoints

| Method | URL | Опис |
|--------|-----|------|
| POST | `/api/users/register/` | Реєстрація |
| POST | `/api/auth/token/` | Логін (JWT) |
| GET | `/api/users/me/` | Поточний юзер |
| GET | `/api/users/<username>/` | Профіль |
| POST | `/api/users/<username>/follow/` | Підписка |
| GET | `/api/users/search/?q=` | Пошук юзерів |
| GET | `/api/posts/feed/` | Стрічка постів |
| POST | `/api/posts/` | Створити пост |
| POST | `/api/posts/<id>/like/` | Лайк |
| GET/POST | `/api/posts/<id>/comments/` | Коментарі |
| GET | `/api/chat/rooms/` | Чати |
| POST | `/api/chat/rooms/open/` | Відкрити чат |
| GET | `/api/notifications/` | Сповіщення |

## WebSockets

- `ws://localhost:8000/ws/chat/<room_id>/` — real-time чат
- `ws://localhost:8000/ws/notifications/` — live сповіщення

## Адмін панель

```powershell
cd backend
python manage.py createsuperuser
# → http://localhost:8000/admin/
```
