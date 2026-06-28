# SocialWave Social Network

Full stack social network platform with live chat feed posts followers and notifications.

## Tech Stack

Frontend: Next.js 15 with TypeScript
Backend: Django 6 with DRF and Django Channels
Go Service: Go explore and metrics API
Database: SQLite
Realtime communication: WebSockets
Auth: SimpleJWT

## Architecture Structure

proekt/
* backend/ (Django API and Go microservice)
  * core/ (settings urls asgi)
  * users/ (auth profiles follow)
  * posts/ (posts likes comments)
  * chat/ (WebSocket chat)
  * go_service/ (Go microservice)
* frontend/ (Next.js)
  * src/
    * app/ (Pages App Router)
    * components/
    * lib/ (API client AuthContext)

## How to Run

1. Start Redis Server
Ensure Redis is running locally or in Docker.

2. Start Django Backend (Port 8000)
cd backend
python manage.py runserver

3. Start Go Service (Port 8080)
cd backend/go_service
go run main.go

4. Start Frontend (Port 3000)
cd frontend
npm run dev

## API Endpoints List

* Registration: POST /api/users/register/
* Login: POST /api/auth/token/
* User Profile: GET /api/users/username/
* Follow Toggle: POST /api/users/username/follow/
* Search Users: GET /api/users/search/?q=
* Feed Posts: GET /api/posts/feed/
* Create Post: POST /api/posts/
* Like Post: POST /api/posts/id/like/
* Comments: GET or POST /api/posts/id/comments/
* Go Metrics: GET /api/go/metrics (served on port 8080)
* Go Explore Feed: GET /api/go/explore (served on port 8080)

## WebSockets Endpoints

* Live Chat: ws://localhost:8000/ws/chat/room_id/
* Live Notifications: ws://localhost:8000/ws/notifications/

## Admin Dashboard Creation

cd backend
python manage.py createsuperuser
Open http://localhost:8000/admin/
