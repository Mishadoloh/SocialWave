from django.urls import path
from . import views

urlpatterns = [
    path('/register', views.RegisterView.as_view(), name='register'),
    path('/me', views.MeView.as_view(), name='me'),
    path('/search', views.search_users, name='search-users'),
    path('/suggested', views.suggested_users, name='suggested-users'),
    path('/<str:username>', views.ProfileView.as_view(), name='profile'),
    path('/<str:username>/follow', views.follow_toggle, name='follow-toggle'),
    path('/<str:username>/followers', views.followers_list, name='followers'),
    path('/<str:username>/following', views.following_list, name='following'),
]
