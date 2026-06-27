from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.db.models import Q, Count
from django.utils import timezone
from datetime import timedelta
from .models import Post, Like, Comment, Hashtag, Bookmark, Report
from .serializers import PostSerializer, CommentSerializer, HashtagSerializer, ReportSerializer
from notifications.models import Notification
from core.permissions import IsAuthorOrReadOnly
from core.pagination import FeedCursorPagination


class FeedView(generics.ListAPIView):
    serializer_class = PostSerializer
    pagination_class = FeedCursorPagination

    def get_queryset(self):
        user = self.request.user
        following_ids = user.following.values_list('id', flat=True)
        return Post.objects.filter(
            Q(author__in=following_ids) | Q(author=user)
        ).select_related('author').prefetch_related('likes', 'comments__author')


class PostListCreateView(generics.ListCreateAPIView):
    serializer_class = PostSerializer

    def get_queryset(self):
        username = self.request.query_params.get('username')
        tag = self.request.query_params.get('tag')
        queryset = Post.objects.all().select_related('author').prefetch_related('likes', 'comments__author')
        if username:
            queryset = queryset.filter(author__username=username)
        if tag:
            queryset = queryset.filter(hashtags__name=tag)
        return queryset

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)


class PostDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = PostSerializer
    queryset = Post.objects.all().select_related('author').prefetch_related('likes', 'comments__author')
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsAuthorOrReadOnly]


@api_view(['POST'])
def like_toggle(request, pk):
    try:
        post = Post.objects.get(pk=pk)
    except Post.DoesNotExist:
        return Response({'error': 'Пост не знайдено'}, status=404)

    like, created = Like.objects.get_or_create(user=request.user, post=post)
    if not created:
        like.delete()
        liked = False
    else:
        liked = True
        if post.author != request.user:
            Notification.objects.create(
                recipient=post.author,
                actor=request.user,
                verb='liked',
                post=post
            )

    return Response({'liked': liked, 'likes_count': post.likes.count()})


class CommentListCreateView(generics.ListCreateAPIView):
    serializer_class = CommentSerializer

    def get_queryset(self):
        return Comment.objects.filter(post_id=self.kwargs['pk']).select_related('author')

    def perform_create(self, serializer):
        post = Post.objects.get(pk=self.kwargs['pk'])
        comment = serializer.save(author=self.request.user, post=post)
        if post.author != self.request.user:
            Notification.objects.create(
                recipient=post.author,
                actor=self.request.user,
                verb='commented',
                post=post
            )


@api_view(['GET'])
def search_posts(request):
    from rest_framework.pagination import PageNumberPagination
    from django.db.models.functions import Lower
    q = request.query_params.get('q', '')
    if not q:
        return Response([])
    posts = Post.objects.annotate(
        lower_content=Lower('content')
    ).filter(
        lower_content__contains=q.lower()
    ).select_related('author').prefetch_related('likes', 'comments__author')
    
    paginator = PageNumberPagination()
    paginator.page_size = 20
    result_page = paginator.paginate_queryset(posts, request)
    serializer = PostSerializer(result_page, many=True, context={'request': request})
    return paginator.get_paginated_response(serializer.data)


@api_view(['GET'])
def trending_hashtags(request):
    time_threshold = timezone.now() - timedelta(hours=48)
    hashtags = Hashtag.objects.filter(
        posts__created_at__gte=time_threshold
    ).annotate(
        posts_count=Count('posts')
    ).order_by('-posts_count')[:10]
    serializer = HashtagSerializer(hashtags, many=True)
    return Response(serializer.data)


@api_view(['POST'])
def bookmark_toggle(request, pk):
    try:
        post = Post.objects.get(pk=pk)
    except Post.DoesNotExist:
        return Response({'error': 'Пост не знайдено'}, status=404)

    bookmark, created = Bookmark.objects.get_or_create(user=request.user, post=post)
    if not created:
        bookmark.delete()
        bookmarked = False
    else:
        bookmarked = True

    return Response({'bookmarked': bookmarked})


class UserBookmarksView(generics.ListAPIView):
    serializer_class = PostSerializer
    
    def get_queryset(self):
        post_ids = Bookmark.objects.filter(user=self.request.user).values_list('post_id', flat=True)
        return Post.objects.filter(id__in=post_ids).select_related('author').prefetch_related('likes', 'comments__author')


@api_view(['POST'])
def report_post(request, pk):
    try:
        post = Post.objects.get(pk=pk)
    except Post.DoesNotExist:
        return Response({'error': 'Пост не знайдено'}, status=404)

    reason = request.data.get('reason', '')
    if not reason:
        return Response({'error': 'Reason is required'}, status=400)
        
    Report.objects.create(reporter=request.user, post=post, reason=reason)
    return Response({'status': 'Report submitted successfully'}, status=201)

@api_view(['POST'])
def repost_post(request, pk):
    try:
        original_post = Post.objects.get(pk=pk)
    except Post.DoesNotExist:
        return Response({'error': 'Пост не знайдено'}, status=404)

    # Check if already reposted
    if Post.objects.filter(author=request.user, reposted_from=original_post).exists():
        return Response({'error': 'Ви вже зробили репост цього запису'}, status=400)

    repost = Post.objects.create(
        author=request.user,
        content='',  # Reposts usually don't have their own content initially, or we could accept some text
        reposted_from=original_post
    )

    if original_post.author != request.user:
        Notification.objects.create(
            recipient=original_post.author,
            actor=request.user,
            verb='reposted',
            post=original_post
        )

    return Response({'status': 'Репост успішно створено', 'repost_id': repost.id}, status=201)
