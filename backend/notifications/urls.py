from django.urls import path
from . import views

urlpatterns = [
    path('', views.NotificationListView.as_view(), name='notifications'),
    path('mark-read', views.mark_all_read, name='mark-read'),
    path('<int:pk>/mark-read', views.mark_read, name='mark-read-single'),
    path('unread-count', views.unread_count, name='unread-count'),
]
