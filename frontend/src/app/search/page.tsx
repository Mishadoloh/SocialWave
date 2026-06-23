'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { useToast } from '@/lib/ToastContext'
import PostCard from '@/components/PostCard'
import Link from 'next/link'
import api from '@/lib/api'
import { Search as SearchIcon, Users, Hash } from 'lucide-react'

export default function SearchPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  
  const [query, setQuery] = useState('')
  const [activeTab, setActiveTab] = useState('users') // 'users' | 'posts'
  const [users, setUsers] = useState([])
  const [posts, setPosts] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!query.trim()) return

    setIsSearching(true)
    setHasSearched(true)
    try {
      if (activeTab === 'users') {
        const res = await api.get(`/users?search=${query}`)
        setUsers(res.data.results)
      } else {
        const res = await api.get(`/posts?search=${query}`)
        setPosts(res.data.results)
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

      <form onSubmit={handleSearch} className="search-bar card" style={{ padding: '12px 20px', marginBottom: '24px' }}>
        <SearchIcon size={20} color="var(--text-muted)" />
        <input 
          type="text" 
          placeholder="Знайти користувачів, пости або хештеги..." 
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <button type="submit" className="btn btn-primary btn-sm" disabled={!query.trim() || isSearching}>
          Шукати
        </button>
      </form>

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
        {isSearching ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[1, 2, 3].map(i => (
              <div key={i} className="card skeleton" style={{ height: '100px' }}></div>
            ))}
          </div>
        ) : !hasSearched ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔍</div>
            <h3>Почніть пошук</h3>
            <p>Введіть запит для пошуку {activeTab === 'users' ? 'користувачів' : 'постів'}</p>
          </div>
        ) : activeTab === 'users' ? (
          users.length === 0 ? (
            <div className="empty-state"><h3>Нічого не знайдено</h3></div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
              {users.map((u: any) => (
                <Link key={u.id} href={`/profile/${u.username}`} style={{ textDecoration: 'none' }}>
                  <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {u.avatar_url ? (
                      <img src={u.avatar_url} className="avatar avatar-md" alt={u.username} />
                    ) : (
                      <div className="avatar avatar-md">{u.username[0].toUpperCase()}</div>
                    )}
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{u.username}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{u.followers_count} підписників</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )
        ) : (
          posts.length === 0 ? (
             <div className="empty-state"><h3>Нічого не знайдено</h3></div>
          ) : (
            <div style={{ maxWidth: '640px', margin: '0 auto' }}>
              {posts.map((post: any) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )
        )}
      </div>
    </div>
  )
}
