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
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImage(file)
      const url = URL.createObjectURL(file)
      setImagePreview(url)
    }
  }

  const handleRemoveImage = () => {
    setImage(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() && !image) return
    setIsSubmitting(true)
    try {
      let res
      if (image) {
        const formData = new FormData()
        formData.append('content', content)
        formData.append('image', image)
        res = await api.post('/posts', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
      } else {
        res = await api.post('/posts', { content })
      }
      setPosts([res.data, ...posts] as any)
      setContent('')
      setImage(null)
      setImagePreview(null)
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

      <SpotlightCard className="create-post">
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
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  style={{ display: 'none' }}
                />
              
              <AnimatePresence>
                {imagePreview && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    style={{ position: 'relative', overflow: 'hidden', borderRadius: 'var(--radius-sm)' }}
                  >
                    <img src={imagePreview} alt="Preview" style={{ width: '100%', maxHeight: '300px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
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
                  disabled={(!content.trim() && !image) || isSubmitting}
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
    </div>
  )
}
