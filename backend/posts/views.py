from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.db.models import Q
from .models import Post, Like, Comment
from .serializers import PostSerializer, CommentSerializer
from notifications.models import Notification


class FeedView(generics.ListAPIView):
    serializer_class = PostSerializer

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
        if username:
            return Post.objects.filter(author__username=username)
        return Post.objects.all()

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)


class PostDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = PostSerializer
    queryset = Post.objects.all()

    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticatedOrReadOnly()]


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
        return Comment.objects.filter(post_id=self.kwargs['pk'])

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
    q = request.query_params.get('q', '')
    if not q:
        return Response([])
    posts = Post.objects.filter(content__icontains=q)[:20]
    serializer = PostSerializer(posts, many=True, context={'request': request})
    return Response(serializer.data)
