from django.urls import path
from . import views

urlpatterns = [
    path('', views.PostListCreateView.as_view(), name='post-list'),
    path('/feed', views.FeedView.as_view(), name='feed'),
    path('/search', views.search_posts, name='search-posts'),
    path('/trending', views.trending_hashtags, name='trending-hashtags'),
    path('/bookmarks', views.UserBookmarksView.as_view(), name='bookmarks'),
    path('/<int:pk>', views.PostDetailView.as_view(), name='post-detail'),
    path('/<int:pk>/like', views.like_toggle, name='like-toggle'),
    path('/<int:pk>/bookmark', views.bookmark_toggle, name='bookmark-toggle'),
    path('/<int:pk>/report', views.report_post, name='report-post'),
    path('/<int:pk>/comments', views.CommentListCreateView.as_view(), name='comments'),
]
