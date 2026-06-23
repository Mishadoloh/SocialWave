'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { useToast } from '@/lib/ToastContext'
import PostCard from '@/components/PostCard'
import api from '@/lib/api'
import { UserPlus, UserMinus, Calendar, FileText } from 'lucide-react'

export default function Profile() {
  const params = useParams()
  const username = params.username
  const { user } = useAuth()
  const { toast } = useToast()
  const [profile, setProfile] = useState<any>(null)
  const [posts, setPosts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFollowing, setIsFollowing] = useState(false)

  useEffect(() => {
    api.get(`/users/${username}`)
      .then(res => {
        setProfile(res.data)
        setIsFollowing(res.data.is_following)
        return api.get(`/users/${username}/posts`)
      })
      .then(res => {
        setPosts(res.data.results)
        setIsLoading(false)
      })
      .catch(err => {
        toast('Помилка завантаження профілю', 'error')
        setIsLoading(false)
      })
  }, [username, toast])

  const handleFollow = async () => {
    // Optimistic Update
    const wasFollowing = isFollowing
    setIsFollowing(!wasFollowing)
    setProfile((prev: any) => ({
      ...prev,
      followers_count: prev.followers_count + (wasFollowing ? -1 : 1)
    }))

    try {
      if (wasFollowing) {
        await api.delete(`/users/${username}/follow`)
        toast(`Ви відписалися від ${username}`, 'info')
      } else {
        await api.post(`/users/${username}/follow`)
        toast(`Ви підписалися на ${username}`, 'success')
      }
    } catch (e) {
      // Revert on error
      setIsFollowing(wasFollowing)
      setProfile((prev: any) => ({
        ...prev,
        followers_count: prev.followers_count + (wasFollowing ? 1 : -1)
      }))
      toast('Не вдалося змінити статус підписки', 'error')
    }
  }

  if (isLoading) {
    return (
      <div className="page-container animate-fade-in">
        <div className="profile-header skeleton" style={{ height: '200px', marginBottom: '24px' }}></div>
        <div className="skeleton skeleton-text w-1/2" style={{ height: '32px', marginBottom: '24px' }}></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[1, 2].map(i => (
             <div key={i} className="post-card">
               <div className="post-header">
                 <div className="skeleton skeleton-avatar"></div>
                 <div style={{ flex: 1 }}>
                   <div className="skeleton skeleton-text w-1/2"></div>
                   <div className="skeleton skeleton-text w-1/4"></div>
                 </div>
               </div>
               <div className="skeleton skeleton-text w-full"></div>
             </div>
          ))}
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <div className="empty-state-icon">👤</div>
          <h3>Користувача не знайдено</h3>
        </div>
      </div>
    )
  }

  const isOwnProfile = user?.username === username

  return (
    <div className="page-container animate-fade-in">
      <div className="profile-header">
        <div className="profile-info">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} className="avatar avatar-xl" style={{ border: '4px solid var(--bg-card)' }} alt={profile.username} />
          ) : (
            <div className="avatar avatar-xl" style={{ border: '4px solid var(--bg-card)' }}>{profile.username[0].toUpperCase()}</div>
          )}
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '4px', letterSpacing: '-0.02em' }}>{profile.username}</h1>
            <div style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px' }}>
               <Calendar size={14} /> Приєднався {new Date(profile.date_joined).getFullYear()}
            </div>
          </div>
          {!isOwnProfile && user && (
            <button 
              onClick={handleFollow} 
              className={isFollowing ? "btn btn-ghost" : "btn btn-primary"}
            >
              {isFollowing ? <><UserMinus size={18} /> Відписатися</> : <><UserPlus size={18} /> Підписатися</>}
            </button>
          )}
        </div>
        
        <div className="profile-stats">
          <div className="stat-item">
            <div className="stat-number">{profile.posts_count}</div>
            <div className="stat-label">Постів</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">{profile.followers_count}</div>
            <div className="stat-label">Підписників</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">{profile.following_count}</div>
            <div className="stat-label">Підписок</div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '32px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 16px 8px' }}>Пости</h2>
        {posts.length === 0 ? (
          <div className="empty-state">
             <div className="empty-state-icon"><FileText size={48} /></div>
             <h3>Немає постів</h3>
          </div>
        ) : (
          posts.map((post: any) => (
            <PostCard key={post.id} post={post} />
          ))
        )}
      </div>
    </div>
  )
}
