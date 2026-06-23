'use client'

import { useState } from 'react'
import Link from 'next/link'
import api from '@/lib/api'
import { Heart, MessageCircle, Share2, MoreHorizontal } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { uk } from 'date-fns/locale'

export default function PostCard({ post: initialPost }: { post: any }) {
  const [post, setPost] = useState(initialPost)
  const [isLiking, setIsLiking] = useState(false)

  const handleLike = async () => {
    if (isLiking) return
    setIsLiking(true)

    // Optimistic UI update
    const wasLiked = post.is_liked
    const newLikesCount = wasLiked ? post.likes_count - 1 : post.likes_count + 1

    setPost((prev: any) => ({
      ...prev,
      is_liked: !wasLiked,
      likes_count: newLikesCount
    }))

    try {
      if (wasLiked) {
        await api.delete(`/posts/${post.id}/like`)
      } else {
        await api.post(`/posts/${post.id}/like`)
      }
    } catch (e) {
      // Revert if failed
      setPost((prev: any) => ({
        ...prev,
        is_liked: wasLiked,
        likes_count: prev.likes_count + (wasLiked ? 1 : -1)
      }))
    } finally {
      setIsLiking(false)
    }
  }

  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: uk })

  return (
    <article className="post-card animate-fade-up">
      <div className="post-header">
        <Link href={`/profile/${post.author.username}`}>
          {post.author.avatar_url ? (
            <img src={post.author.avatar_url} className="avatar avatar-md" alt={post.author.username} />
          ) : (
            <div className="avatar avatar-md">{post.author.username[0].toUpperCase()}</div>
          )}
        </Link>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Link href={`/profile/${post.author.username}`} className="post-author-name">
              {post.author.username}
            </Link>
            <button className="btn-icon" style={{ color: 'var(--text-muted)', background: 'transparent', border: 'none' }}>
              <MoreHorizontal size={20} />
            </button>
          </div>
          <div className="post-time">{timeAgo}</div>
        </div>
      </div>

      <div className="post-content">
        {post.content}
      </div>

      {post.image_url && (
        <img src={post.image_url} alt="Post" className="post-image" style={{ width: '100%', borderRadius: 'var(--radius-sm)', marginBottom: '16px', maxHeight: '400px', objectFit: 'cover' }} />
      )}

      <div className="post-actions">
        <button 
          onClick={handleLike} 
          className={`action-btn ${post.is_liked ? 'liked' : ''}`}
        >
          <Heart size={20} fill={post.is_liked ? 'currentColor' : 'none'} />
          <span>{post.likes_count}</span>
        </button>
        <Link href={`/post/${post.id}`} className="action-btn" style={{ textDecoration: 'none' }}>
          <MessageCircle size={20} />
          <span>{post.comments_count}</span>
        </Link>
        <button className="action-btn" style={{ marginLeft: 'auto' }}>
          <Share2 size={20} />
        </button>
      </div>
    </article>
  )
}
