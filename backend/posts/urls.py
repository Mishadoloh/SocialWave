from django.urls import path
from . import views

urlpatterns = [
    path('', views.PostListCreateView.as_view(), name='post-list'),
    path('feed', views.FeedView.as_view(), name='feed'),
    path('search', views.search_posts, name='search-posts'),
    path('<int:pk>', views.PostDetailView.as_view(), name='post-detail'),
    path('<int:pk>/like', views.like_toggle, name='like-toggle'),
    path('<int:pk>/comments', views.CommentListCreateView.as_view(), name='comments'),
]
