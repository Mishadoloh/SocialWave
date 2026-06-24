'use client'

import { useState } from 'react'
import Link from 'next/link'
import api from '@/lib/api'
import { Heart, MessageCircle, Share2, MoreHorizontal, Send } from 'lucide-react'
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
  const { user } = useAuth()

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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      layout
      style={{ marginBottom: '16px' }}
    >
      <SpotlightCard className="post-card" style={{ marginBottom: 0 }}>
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
          <motion.button 
            onClick={handleLike} 
            className={`action-btn ${post.is_liked ? 'liked' : ''}`}
            whileTap={{ scale: 0.8 }}
          >
            <motion.div
              animate={post.is_liked ? { scale: [1, 1.3, 1] } : { scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Heart size={20} fill={post.is_liked ? 'currentColor' : 'none'} />
            </motion.div>
            <span>{post.likes_count}</span>
          </motion.button>
          
          <button onClick={() => setShowComments(!showComments)} className="action-btn">
            <motion.div whileTap={{ scale: 0.9 }} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MessageCircle size={20} />
              <span>{post.comments_count}</span>
            </motion.div>
          </button>
          
          <button className="action-btn" style={{ marginLeft: 'auto' }}>
            <motion.div whileTap={{ scale: 0.9 }}>
              <Share2 size={20} />
            </motion.div>
          </button>
        </div>

        <AnimatePresence>
          {showComments && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ overflow: 'hidden' }}
            >
              <div style={{ paddingTop: '16px', marginTop: '16px', borderTop: '1px solid var(--border)' }}>
                {post.comments?.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                    {post.comments.map((comment: any) => (
                      <div key={comment.id} style={{ display: 'flex', gap: '12px' }}>
                        <div className="avatar avatar-sm">
                          {comment.author?.avatar_url ? (
                            <img src={comment.author.avatar_url} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
                          ) : (
                            comment.author?.username[0].toUpperCase()
                          )}
                        </div>
                        <div style={{ background: 'var(--bg-input)', padding: '10px 14px', borderRadius: '16px', borderTopLeftRadius: '4px', flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '4px' }}>{comment.author?.username}</div>
                          <div style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{comment.content}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '12px', color: 'var(--text-muted)', fontSize: '14px' }}>
                    Поки немає коментарів. Будьте першим!
                  </div>
                )}
                
                <form onSubmit={handleCommentSubmit} style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    placeholder="Написати коментар..."
                    className="form-input"
                    style={{ padding: '8px 16px', borderRadius: '20px' }}
                    disabled={isCommenting}
                  />
                  <button type="submit" className="btn btn-primary btn-icon" disabled={!commentText.trim() || isCommenting} style={{ width: '40px', height: '40px', borderRadius: '50%', padding: 0 }}>
                    <Send size={16} />
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </SpotlightCard>
    </motion.div>
  )
}
