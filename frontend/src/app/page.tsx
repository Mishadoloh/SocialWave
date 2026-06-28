'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { useToast } from '@/lib/ToastContext'
import PostCard from '@/components/PostCard'
import SpotlightCard from '@/components/SpotlightCard'
import api from '@/lib/api'
import { Image as ImageIcon, Send, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function Feed() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  
  const [posts, setPosts] = useState([])
  const [isLoadingPosts, setIsLoadingPosts] = useState(true)
  const [content, setContent] = useState('')
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [mediaPreview, setMediaPreview] = useState<string | null>(null)
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null)
  const [activeStory, setActiveStory] = useState<any>(null)
  const [storyProgress, setStoryProgress] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  // Auto-advance/close story after 5 seconds (100 * 50ms = 5000ms)
  useEffect(() => {
    if (!activeStory) return
    setStoryProgress(0)
    const interval = setInterval(() => {
      setStoryProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setActiveStory(null)
          return 0
        }
        return prev + 1
      })
    }, 50)
    return () => clearInterval(interval)
  }, [activeStory])

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setMediaFile(file)
      const type = file.type.startsWith('video/') ? 'video' : 'image'
      setMediaType(type)
      const url = URL.createObjectURL(file)
      setMediaPreview(url)
    }
  }

  const handleRemoveMedia = () => {
    setMediaFile(null)
    setMediaPreview(null)
    setMediaType(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() && !mediaFile) return
    setIsSubmitting(true)
    try {
      let res
      if (mediaFile) {
        const formData = new FormData()
        formData.append('content', content)
        if (mediaType === 'video') {
          formData.append('video', mediaFile)
        } else {
          formData.append('image', mediaFile)
        }
        res = await api.post('/posts', formData)
      } else {
        res = await api.post('/posts', { content })
      }
      setPosts([res.data, ...posts] as any)
      setContent('')
      setMediaFile(null)
      setMediaPreview(null)
      setMediaType(null)
      toast('Пост успішно опубліковано!', 'success')
    } catch (e) {
      toast('Не вдалося створити пост', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading || !user) return null

  // Extract unique authors with avatars for the stories bar
  const storyUsers = Array.from(
    new Map(
      posts
        .filter((p: any) => p.author && p.author.username)
        .map((p: any) => [p.author.id, p.author])
    ).values()
  ).slice(0, 8)

  return (
    <div className="page-container animate-fade-in">
      <h1 className="page-title">Головна стрічка</h1>

      {/* Stories Bar (Instagram Style) */}
      {storyUsers.length > 0 && (
        <div style={{
          display: 'flex',
          overflowX: 'auto',
          gap: '16px',
          padding: '8px 12px 16px 12px',
          maxWidth: '470px',
          margin: '0 auto 16px auto',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }} className="stories-container">
          {/* Own Story Mock */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', flexShrink: 0 }}>
            <div style={{ borderRadius: '50%', background: 'var(--border)', padding: '2px' }}>
              <div style={{ background: '#000', borderRadius: '50%', padding: '2px', display: 'flex', position: 'relative' }}>
                {user.avatar_url ? (
                  <img src={user.avatar_url} className="avatar avatar-md" alt="my story" style={{ width: '56px', height: '56px', border: 'none' }} />
                ) : (
                  <div className="avatar avatar-md" style={{ width: '56px', height: '56px', fontSize: '18px', background: 'var(--border)' }}>{user.username[0].toUpperCase()}</div>
                )}
                <div style={{ position: 'absolute', bottom: 0, right: 0, width: '18px', height: '18px', background: '#0095f6', border: '2px solid #000', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '12px', fontWeight: 'bold' }}>+</div>
              </div>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', maxWidth: '64px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Ваша історія</span>
          </div>

          {/* Seeded Users Stories */}
          {storyUsers.map((u: any) => (
            <div 
              key={u.id} 
              onClick={() => setActiveStory(u)}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', flexShrink: 0 }}
            >
              <div style={{ borderRadius: '50%', background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)', padding: '2px' }}>
                <div style={{ background: '#000', borderRadius: '50%', padding: '2px', display: 'flex' }}>
                  {u.avatar_url ? (
                    <img src={u.avatar_url} className="avatar avatar-md" alt={u.username} style={{ width: '56px', height: '56px', border: 'none' }} />
                  ) : (
                    <div className="avatar avatar-md" style={{ width: '56px', height: '56px', fontSize: '18px' }}>{u.username[0].toUpperCase()}</div>
                  )}
                </div>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', maxWidth: '64px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.username}</span>
            </div>
          ))}
        </div>
      )}

      <SpotlightCard className="create-post" style={{ maxWidth: '470px', margin: '0 auto 24px auto', padding: '16px', borderRadius: '12px' }}>
        <form onSubmit={handleCreatePost}>
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
               <input
                  type="file"
                  accept="image/*,video/*"
                  ref={fileInputRef}
                  onChange={handleMediaChange}
                  style={{ display: 'none' }}
                />
              
              <AnimatePresence>
                {mediaPreview && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    style={{ position: 'relative', overflow: 'hidden', borderRadius: 'var(--radius-sm)' }}
                  >
                    {mediaType === 'video' ? (
                      <video src={mediaPreview} controls style={{ width: '100%', maxHeight: '300px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', background: '#000' }} />
                    ) : (
                      <img src={mediaPreview} alt="Preview" style={{ width: '100%', maxHeight: '300px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />
                    )}
                    <button
                      type="button"
                      onClick={handleRemoveMedia}
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        background: 'rgba(0,0,0,0.6)',
                        border: 'none',
                        borderRadius: '50%',
                        padding: '4px',
                        color: 'white',
                        cursor: 'pointer',
                        backdropFilter: 'blur(4px)'
                      }}
                    >
                      <X size={16} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                <button 
                  type="button" 
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-icon" 
                  style={{ color: 'var(--accent)', background: 'transparent', border: 'none' }}
                >
                  <ImageIcon size={20} />
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary btn-sm" 
                  disabled={(!content.trim() && !mediaFile) || isSubmitting}
                  style={{ borderRadius: '20px', padding: '8px 20px' }}
                >
                  {isSubmitting ? 'Публікація...' : <><Send size={16} /> Опублікувати</>}
                </button>
              </div>
            </div>
          </div>
        </form>
      </SpotlightCard>

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
        <motion.div 
          className="empty-state"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="empty-state-icon">📝</div>
          <h3>Немає постів</h3>
          <p>Будьте першим, хто напише щось цікаве!</p>
        </motion.div>
      ) : (
        <AnimatePresence mode="popLayout">
          {posts.map((post: any) => (
             <PostCard key={post.id} post={post} />
          ))}
        </AnimatePresence>
      )}

      {/* Fullscreen Story Modal (Instagram Style) */}
      <AnimatePresence>
        {activeStory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.95)',
              zIndex: 9999,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px'
            }}
          >
            <div style={{ position: 'relative', width: '100%', maxWidth: '420px', height: '80vh', background: '#121212', borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 60px rgba(0,0,0,0.8)' }}>
              {/* Progress bar container */}
              <div style={{ position: 'absolute', top: '12px', left: '12px', right: '12px', height: '3px', background: 'rgba(255,255,255,0.2)', borderRadius: '2px', overflow: 'hidden', zIndex: 10 }}>
                <div style={{ width: `${storyProgress}%`, height: '100%', background: '#fff', transition: 'width 0.05s linear' }} />
              </div>

              {/* Story Header */}
              <div style={{ position: 'absolute', top: '24px', left: '16px', right: '16px', display: 'flex', alignItems: 'center', gap: '12px', zIndex: 10 }}>
                <div style={{ borderRadius: '50%', background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)', padding: '2px' }}>
                  <div style={{ background: '#000', borderRadius: '50%', padding: '1px', display: 'flex' }}>
                    {activeStory.avatar_url ? (
                      <img src={activeStory.avatar_url} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
                    ) : (
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>{activeStory.username[0].toUpperCase()}</div>
                    )}
                  </div>
                </div>
                <span style={{ color: '#fff', fontWeight: 600, fontSize: '14px', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>{activeStory.username}</span>
                <button onClick={() => setActiveStory(null)} style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={24} />
                </button>
              </div>

              {/* Story Content */}
              <div style={{ flex: 1, background: 'linear-gradient(135deg, #e1306c 0%, #c13584 50%, #833ab4 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', textAlign: 'center' }}>
                <div style={{ fontSize: '72px', marginBottom: '20px' }}>🌟</div>
                <h2 style={{ color: '#fff', fontSize: '24px', fontWeight: 800, marginBottom: '12px', textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>Вітання від {activeStory.username}!</h2>
                <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '16px', fontStyle: 'italic', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                  "Насолоджуюсь літніми днями та створюю крутий контент в SocialWave! Приєднуйтесь!"
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
