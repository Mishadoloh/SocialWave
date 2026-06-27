from rest_framework import serializers
from .models import Post, Comment, Like, Hashtag, Bookmark, Report
from users.serializers import UserSerializer


class CommentSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)

    class Meta:
        model = Comment
        fields = ['id', 'author', 'content', 'created_at']
        read_only_fields = ['id', 'author', 'created_at']


class PostSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    likes_count = serializers.SerializerMethodField()
    comments_count = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()
    is_bookmarked = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()
    video_url = serializers.SerializerMethodField()
    hashtags = serializers.SerializerMethodField()
    comments = CommentSerializer(many=True, read_only=True)
    reposted_from = serializers.SerializerMethodField()
    reposts_count = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = ['id', 'author', 'content', 'image', 'image_url', 'video', 'video_url',
                  'likes_count', 'comments_count', 'is_liked', 'is_bookmarked', 'hashtags', 'comments', 'reposted_from', 'reposts_count', 'created_at']
        read_only_fields = ['id', 'author', 'created_at']

    def get_likes_count(self, obj):
        return obj.likes.count()

    def get_comments_count(self, obj):
        return obj.comments.count()

    def get_is_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.likes.filter(user=request.user).exists()
        return False

    def get_image_url(self, obj):
        request = self.context.get('request')
        if obj.image and request:
            return request.build_absolute_uri(obj.image.url)
        return None

    def get_video_url(self, obj):
        request = self.context.get('request')
        if obj.video and request:
            return request.build_absolute_uri(obj.video.url)
        return None

    def get_is_bookmarked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.bookmarks.filter(user=request.user).exists()
        return False

    def get_hashtags(self, obj):
        return [tag.name for tag in obj.hashtags.all()]

    def get_reposts_count(self, obj):
        return obj.reposts.count()

    def get_reposted_from(self, obj):
        if obj.reposted_from:
            return {
                'id': obj.reposted_from.id,
                'author': UserSerializer(obj.reposted_from.author).data,
                'content': obj.reposted_from.content,
                'created_at': obj.reposted_from.created_at,
            }
        return None


class HashtagSerializer(serializers.ModelSerializer):
    posts_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Hashtag
        fields = ['id', 'name', 'posts_count']


class BookmarkSerializer(serializers.ModelSerializer):
    post = PostSerializer(read_only=True)

    class Meta:
        model = Bookmark
        fields = ['id', 'post', 'created_at']


class ReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Report
        fields = ['id', 'post', 'reason', 'is_resolved', 'created_at']
        read_only_fields = ['id', 'is_resolved', 'created_at']
