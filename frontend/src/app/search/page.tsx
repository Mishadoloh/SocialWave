'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { useToast } from '@/lib/ToastContext'
import PostCard from '@/components/PostCard'
import SpotlightCard from '@/components/SpotlightCard'
import Link from 'next/link'
import api from '@/lib/api'
import { Search as SearchIcon, Users, Hash } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function SearchPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  
  const [query, setQuery] = useState('')
  const [activeTab, setActiveTab] = useState('users') // 'users' | 'posts'
  const [users, setUsers] = useState([])
  const [posts, setPosts] = useState([])
  const [trendingPosts, setTrendingPosts] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const host = window.location.hostname
      fetch(`http://${host}:8080/api/go/explore`)
        .then(res => res.json())
        .then(data => setTrendingPosts(data))
        .catch(err => console.error("Failed to fetch explore posts:", err))
    }
  }, [])

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!query.trim()) return

    setIsSearching(true)
    setHasSearched(true)
    try {
      if (activeTab === 'users') {
        const res = await api.get(`/users/search?q=${query}`)
        setUsers(res.data.results || res.data)
      } else {
        const res = await api.get(`/posts/search?q=${query}`)
        setPosts(res.data.results || res.data)
      }
    } catch (err) {
      toast('Помилка пошуку', 'error')
    } finally {
      setIsSearching(false)
    }
  }

  // Trigger search on tab change if query exists
  const switchTab = (tab: string) => {
    setActiveTab(tab)
    if (query.trim()) {
      handleSearch()
    }
  }

  if (!user) return null

  return (
    <div className="page-container-wide animate-fade-in">
      <h1 className="page-title"><SearchIcon size={28} /> Пошук</h1>

      <SpotlightCard className="search-bar" style={{ padding: '4px', marginBottom: '24px' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <SearchIcon size={20} color="var(--text-muted)" style={{ marginLeft: '12px' }} />
          <input 
            type="text" 
            placeholder="Знайти користувачів, пости або хештеги..." 
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', padding: '12px 0' }}
          />
          <button type="submit" className="btn btn-primary btn-sm" disabled={!query.trim() || isSearching} style={{ borderRadius: '20px', padding: '8px 24px', marginRight: '4px' }}>
            Шукати
          </button>
        </form>
      </SpotlightCard>

      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => switchTab('users')}
        >
          <Users size={16} /> Користувачі
        </button>
        <button 
          className={`tab ${activeTab === 'posts' ? 'active' : ''}`}
          onClick={() => switchTab('posts')}
        >
          <Hash size={16} /> Пости
        </button>
      </div>

      <div style={{ marginTop: '24px' }}>
        <AnimatePresence mode="wait">
          {isSearching ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
            >
              {[1, 2, 3].map(i => (
                <div key={i} className="card skeleton" style={{ height: '100px' }}></div>
              ))}
            </motion.div>
          ) : !hasSearched ? (
            <motion.div 
              key="initial"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ marginTop: '8px' }}
            >
              <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '16px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                🔥 Цікаве для вас (Go Microservice)
              </h3>
              
              {trendingPosts.length === 0 ? (
                <div className="empty-state" style={{ padding: '40px 0' }}>
                  <SearchIcon size={40} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
                  <p style={{ color: 'var(--text-muted)' }}>Завантаження рекомендацій...</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
                  {trendingPosts.map((post: any) => (
                    <div 
                      key={post.id} 
                      style={{ 
                        position: 'relative', 
                        aspectRatio: '1/1', 
                        overflow: 'hidden', 
                        borderRadius: '4px',
                        cursor: 'pointer',
                        background: '#121212',
                        border: '1px solid var(--border)'
                      }}
                    >
                      {post.video_url ? (
                        <video src={`http://${window.location.hostname}:8000${post.video_url}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : post.image_url ? (
                        <img src={`http://${window.location.hostname}:8000${post.image_url}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #121212, #262626)', padding: '12px', fontSize: '12px', textAlign: 'center', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {post.content}
                        </div>
                      )}
                      
                      {/* Hover Overlay */}
                      <div 
                        style={{
                          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                          background: 'rgba(0,0,0,0.6)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          opacity: 0, transition: 'opacity 0.15s ease', gap: '8px', color: '#fff', fontWeight: 'bold', fontSize: '16px'
                        }}
                        onMouseEnter={(e: any) => e.currentTarget.style.opacity = 1}
                        onMouseLeave={(e: any) => e.currentTarget.style.opacity = 0}
                      >
                        ❤️ {post.likes_count}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ) : activeTab === 'users' ? (
            users.length === 0 ? (
              <motion.div key="empty-users" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="empty-state">
                <div className="empty-state-icon"><Users size={48} style={{ opacity: 0.5 }} /></div>
                <h3>Нічого не знайдено</h3>
                <p>Спробуйте змінити запит</p>
              </motion.div>
            ) : (
              <motion.div 
                key="results-users"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}
              >
                {users.map((u: any) => (
                  <Link key={u.id} href={`/profile/${u.username}`} style={{ textDecoration: 'none' }}>
                    <SpotlightCard className="user-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', transition: 'transform 0.2s', cursor: 'pointer' }} onMouseEnter={(e: any) => e.currentTarget.style.transform = 'scale(1.02)'} onMouseLeave={(e: any) => e.currentTarget.style.transform = 'scale(1)'}>
                      {u.avatar_url ? (
                        <img src={u.avatar_url} className="avatar avatar-md" alt={u.username} style={{ width: '56px', height: '56px' }} />
                      ) : (
                        <div className="avatar avatar-md" style={{ width: '56px', height: '56px', fontSize: '20px' }}>{u.username[0].toUpperCase()}</div>
                      )}
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '18px', marginBottom: '4px' }}>{u.username}</div>
                        <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{u.followers_count} підписників</div>
                      </div>
                    </SpotlightCard>
                  </Link>
                ))}
              </motion.div>
            )
          ) : (
            posts.length === 0 ? (
               <motion.div key="empty-posts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="empty-state">
                 <div className="empty-state-icon"><Hash size={48} style={{ opacity: 0.5 }} /></div>
                 <h3>Нічого не знайдено</h3>
                 <p>Спробуйте змінити запит</p>
               </motion.div>
            ) : (
              <motion.div 
                key="results-posts"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                style={{ maxWidth: '640px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}
              >
                {posts.map((post: any) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </motion.div>
            )
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
