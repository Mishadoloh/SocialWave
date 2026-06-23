from django.urls import path
from . import views

urlpatterns = [
    path('rooms', views.RoomListView.as_view(), name='room-list'),
    path('rooms/open', views.get_or_create_room, name='open-room'),
    path('rooms/<int:room_id>/messages', views.MessageListView.as_view(), name='message-list'),
]
