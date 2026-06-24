from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.db.models import Q
from .models import User
from .serializers import UserSerializer, RegisterSerializer


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user, context={'request': request}).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_201_CREATED)


class MeView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return super().update(request, *args, **kwargs)


from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from rest_framework.pagination import PageNumberPagination

class ProfileView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    lookup_field = 'username'
    queryset = User.objects.all()

    @method_decorator(cache_page(60 * 15))  # Cache for 15 minutes
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)


@api_view(['POST'])
def follow_toggle(request, username):
    try:
        target = User.objects.get(username=username)
    except User.DoesNotExist:
        return Response({'error': 'Користувача не знайдено'}, status=404)

    if target == request.user:
        return Response({'error': 'Не можна підписатися на себе'}, status=400)

    if target.followers.filter(id=request.user.id).exists():
        target.followers.remove(request.user)
        following = False
    else:
        target.followers.add(request.user)
        following = True
        # Create notification
        from notifications.models import Notification
        Notification.objects.get_or_create(
            recipient=target,
            actor=request.user,
            verb='followed'
        )

    return Response({
        'following': following,
        'followers_count': target.followers.count()
    })


@api_view(['GET'])
def search_users(request):
    q = request.query_params.get('q', '')
    if not q:
        return Response([])
    users = User.objects.filter(
        Q(username__icontains=q) | Q(bio__icontains=q)
    ).exclude(id=request.user.id)
    
    paginator = PageNumberPagination()
    paginator.page_size = 20
    result_page = paginator.paginate_queryset(users, request)
    serializer = UserSerializer(result_page, many=True, context={'request': request})
    return paginator.get_paginated_response(serializer.data)


@api_view(['GET'])
def followers_list(request, username):
    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        return Response({'error': 'Not found'}, status=404)
    
    paginator = PageNumberPagination()
    paginator.page_size = 20
    result_page = paginator.paginate_queryset(user.followers.all(), request)
    serializer = UserSerializer(result_page, many=True, context={'request': request})
    return paginator.get_paginated_response(serializer.data)


@api_view(['GET'])
def following_list(request, username):
    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        return Response({'error': 'Not found'}, status=404)
        
    paginator = PageNumberPagination()
    paginator.page_size = 20
    result_page = paginator.paginate_queryset(user.following.all(), request)
    serializer = UserSerializer(result_page, many=True, context={'request': request})
    return paginator.get_paginated_response(serializer.data)
