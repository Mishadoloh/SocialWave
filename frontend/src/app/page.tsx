'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { useToast } from '@/lib/ToastContext'
import PostCard from '@/components/PostCard'
import api from '@/lib/api'
import { Image as ImageIcon, Send } from 'lucide-react'

export default function Feed() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  
  const [posts, setPosts] = useState([])
  const [isLoadingPosts, setIsLoadingPosts] = useState(true)
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      api.get('/posts')
        .then(res => {
          setPosts(res.data.results)
          setIsLoadingPosts(false)
        })
        .catch(err => {
          toast('Помилка завантаження стрічки', 'error')
          setIsLoadingPosts(false)
        })
    }
  }, [user, toast])

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return
    setIsSubmitting(true)
    try {
      const res = await api.post('/posts', { content })
      setPosts([res.data, ...posts] as any)
      setContent('')
      toast('Пост успішно опубліковано!', 'success')
    } catch (e) {
      toast('Не вдалося створити пост', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading || !user) return null

  return (
    <div className="page-container animate-fade-in">
      <h1 className="page-title">Головна стрічка</h1>

      <form onSubmit={handleCreatePost} className="create-post">
        <div style={{ display: 'flex', gap: '16px' }}>
          {user.avatar_url ? (
            <img src={user.avatar_url} className="avatar avatar-md" alt={user.username} />
          ) : (
            <div className="avatar avatar-md">{user.username[0].toUpperCase()}</div>
          )}
          <div style={{ flex: 1 }}>
            <textarea
              className="create-post-input"
              placeholder="Що у вас нового?"
              value={content}
              onChange={e => setContent(e.target.value)}
              disabled={isSubmitting}
              style={{ width: '100%', resize: 'none', outline: 'none', color: 'var(--text-primary)' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
              <button type="button" className="btn-icon" style={{ color: 'var(--accent)', background: 'transparent', border: 'none' }}>
                <ImageIcon size={20} />
              </button>
              <button 
                type="submit" 
                className="btn btn-primary btn-sm" 
                disabled={!content.trim() || isSubmitting}
                style={{ borderRadius: '20px', padding: '8px 20px' }}
              >
                {isSubmitting ? 'Публікація...' : <><Send size={16} /> Опублікувати</>}
              </button>
            </div>
          </div>
        </div>
      </form>

      {isLoadingPosts ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="post-card">
              <div className="post-header">
                <div className="skeleton skeleton-avatar"></div>
                <div style={{ flex: 1 }}>
                  <div className="skeleton skeleton-text w-1/2"></div>
                  <div className="skeleton skeleton-text w-1/4"></div>
                </div>
              </div>
              <div className="skeleton skeleton-text w-full"></div>
              <div className="skeleton skeleton-text w-3/4"></div>
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📝</div>
          <h3>Немає постів</h3>
          <p>Будьте першим, хто напише щось цікаве!</p>
        </div>
      ) : (
        <div>
          {posts.map((post: any) => (
             <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  )
}
