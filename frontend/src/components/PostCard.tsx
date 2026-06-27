'use client'

import { useState } from 'react'
import Link from 'next/link'
import api from '@/lib/api'
import { Heart, MessageCircle, Share2, MoreHorizontal, Send, Bookmark, Flag } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { uk } from 'date-fns/locale'
import { motion, AnimatePresence } from 'framer-motion'
import SpotlightCard from './SpotlightCard'
import { useAuth } from '@/lib/AuthContext'

export default function PostCard({ post: initialPost }: { post: any }) {
  const [post, setPost] = useState(initialPost)
  const [isLiking, setIsLiking] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [isCommenting, setIsCommenting] = useState(false)
  const [isBookmarking, setIsBookmarking] = useState(false)
  const { user } = useAuth()

  const handleBookmark = async () => {
    if (isBookmarking) return
    setIsBookmarking(true)
    const wasBookmarked = post.is_bookmarked
    setPost((prev: any) => ({ ...prev, is_bookmarked: !wasBookmarked }))
    try {
      await api.post(`/posts/${post.id}/bookmark`)
    } catch (e) {
      setPost((prev: any) => ({ ...prev, is_bookmarked: wasBookmarked }))
    } finally {
      setIsBookmarking(false)
    }
  }

  const handleReport = async () => {
    const reason = prompt('Чому ви хочете поскаржитися на цей пост?')
    if (!reason) return
    try {
      await api.post(`/posts/${post.id}/report`, { reason })
      alert('Скаргу надіслано. Дякуємо!')
    } catch (e) {
      alert('Помилка при надсиланні скарги.')
    }
  }

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentText.trim()) return
    setIsCommenting(true)
    try {
      const res = await api.post(`/posts/${post.id}/comments`, { content: commentText })
      setPost((prev: any) => ({
        ...prev,
        comments_count: prev.comments_count + 1,
        comments: [...(prev.comments || []), res.data]
      }))
      setCommentText('')
    } catch (e) {
      console.error(e)
    } finally {
      setIsCommenting(false)
    }
  }

  const handleLike = async () => {
    if (isLiking) return
    setIsLiking(true)

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
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      layout
      style={{ marginBottom: '24px' }}
    >
      <SpotlightCard className="post-card" style={{ marginBottom: 0 }}>
        {/* Header */}
        <div className="post-header">
          <Link href={`/profile/${post.author.username}`} style={{ display: 'inline-block', borderRadius: '50%', background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)', padding: '2px', textDecoration: 'none' }}>
            <div style={{ background: '#000', borderRadius: '50%', padding: '2px', display: 'flex' }}>
              {post.author.avatar_url ? (
                <img src={post.author.avatar_url} className="avatar avatar-sm" alt={post.author.username} style={{ border: 'none', width: '32px', height: '32px' }} />
              ) : (
                <div className="avatar avatar-sm" style={{ width: '32px', height: '32px', fontSize: '12px', background: 'var(--accent)', color: '#fff' }}>{post.author.username[0].toUpperCase()}</div>
              )}
            </div>
          </Link>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Link href={`/profile/${post.author.username}`} className="post-author-name">
                {post.author.username}
              </Link>
              <button onClick={handleReport} className="btn-icon" style={{ color: 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }} title="Поскаржитись">
                <MoreHorizontal size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Media (Full Width) */}
        {post.image_url && (
          <img src={post.image_url} alt="Post" className="post-image" style={{ width: '100%', borderRadius: '0', marginBottom: '8px', maxHeight: '580px', objectFit: 'cover' }} />
        )}

        {post.video_url && (
          <video 
            src={post.video_url} 
            controls 
            playsInline
            className="post-video" 
            style={{ width: '100%', borderRadius: '0', marginBottom: '8px', maxHeight: '580px', background: '#000' }} 
          />
        )}

        {/* Action Buttons */}
        <div className="post-actions">
          <motion.button 
            onClick={handleLike} 
            className={`action-btn ${post.is_liked ? 'liked' : ''}`}
            whileTap={{ scale: 0.8 }}
          >
            <Heart size={24} fill={post.is_liked ? 'var(--like)' : 'none'} style={{ color: post.is_liked ? 'var(--like)' : 'var(--text-primary)' }} />
          </motion.button>
          
          <button onClick={() => setShowComments(!showComments)} className="action-btn">
            <MessageCircle size={24} style={{ color: 'var(--text-primary)' }} />
          </button>
          
          <button onClick={handleBookmark} className="action-btn" style={{ marginLeft: 'auto' }}>
            <Bookmark size={24} fill={post.is_bookmarked ? 'var(--text-primary)' : 'none'} style={{ color: 'var(--text-primary)' }} />
          </button>
        </div>

        {/* Likes Count */}
        <div style={{ padding: '0 16px', fontWeight: 700, fontSize: '14px', marginBottom: '6px', color: 'var(--text-primary)' }}>
          {post.likes_count} likes
        </div>

        {/* Caption */}
        {post.content && (
          <div className="post-content" style={{ marginBottom: '6px' }}>
            <span style={{ fontWeight: 700, marginRight: '8px' }}>{post.author.username}</span>
            {post.content}
            {post.hashtags && post.hashtags.length > 0 && (
              <div style={{ marginTop: '4px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {post.hashtags.map((tag: string) => (
                  <Link key={tag} href={`/search?q=%23${tag}`} style={{ color: 'var(--accent-light)', fontSize: '13px', textDecoration: 'none', fontWeight: 500 }}>
                    #{tag}
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Comments Preview */}
        {post.comments_count > 2 && (
          <button 
            onClick={() => setShowComments(!showComments)} 
            style={{ padding: '0 16px', background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '13px', cursor: 'pointer', marginBottom: '6px', display: 'block', textAlign: 'left' }}
          >
            Читати всі коментарі ({post.comments_count})
          </button>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '8px' }}>
          {(showComments ? post.comments : post.comments?.slice(-2))?.map((comment: any) => (
            <div key={comment.id} style={{ padding: '0 16px', fontSize: '14px' }}>
              <span style={{ fontWeight: 700, marginRight: '8px' }}>{comment.author?.username}</span>
              <span style={{ color: 'var(--text-primary)' }}>{comment.content}</span>
            </div>
          ))}
        </div>

        {/* Time Ago */}
        <div style={{ padding: '0 16px', fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px' }}>
          {timeAgo}
        </div>

        {/* Comment Form Input */}
        <form onSubmit={handleCommentSubmit} style={{ display: 'flex', gap: '8px', padding: '12px 16px', borderTop: '1px solid var(--border)', background: 'transparent' }}>
          <input
            type="text"
            value={commentText}
            onChange={e => setCommentText(e.target.value)}
            placeholder="Додати коментар..."
            style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', flex: 1, fontSize: '14px' }}
            disabled={isCommenting}
          />
          <button type="submit" style={{ background: 'transparent', border: 'none', color: 'var(--accent)', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }} disabled={!commentText.trim() || isCommenting}>
            Опублікувати
          </button>
        </form>
      </SpotlightCard>
    </motion.div>
  )
}
