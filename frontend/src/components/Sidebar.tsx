'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import api from '@/lib/api'
import { Home, Search, Bell, MessageCircle, User, LogOut, Download } from 'lucide-react'

export default function Sidebar() {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const [unreadNotifs, setUnreadNotifs] = useState(0)
  const [trending, setTrending] = useState([])

  useEffect(() => {
    if (!user) return
    api.get('/notifications/unread-count').then(r => setUnreadNotifs(r.data.count)).catch(() => {})
    api.get('/posts/trending-hashtags').then(r => setTrending(r.data)).catch(() => {})
    const interval = setInterval(() => {
      api.get('/notifications/unread-count').then(r => setUnreadNotifs(r.data.count)).catch(() => {})
    }, 10000)
    return () => clearInterval(interval)
  }, [user])

  if (!user) return null

  const navs = [
    { name: 'Головна', path: '/', icon: <Home size={22} /> },
    { name: 'Пошук', path: '/search', icon: <Search size={22} /> },
    { name: 'Повідомлення', path: '/chat', icon: <MessageCircle size={22} /> },
    { 
      name: 'Сповіщення', 
      path: '/notifications', 
      icon: <Bell size={22} />,
      badge: unreadNotifs > 0 ? unreadNotifs : null
    },
    { name: 'Профіль', path: `/profile/${user.username}`, icon: <User size={22} /> },
    { name: 'Додаток', path: '/download', icon: <Download size={22} /> },
  ]

  return (
    <aside className="sidebar">
      <Link href="/" className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12h4l3-9 5 18 3-9h5"/></svg>
        </div>
        <div className="sidebar-logo-text">SocialWave</div>
      </Link>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <nav className="sidebar-nav">
          {navs.map(nav => (
            <Link
              key={nav.path}
              href={nav.path}
              className={`nav-link ${pathname === nav.path ? 'active' : ''}`}
            >
              <span className="nav-icon">{nav.icon}</span>
              <span>{nav.name}</span>
              {nav.badge && <span className="nav-badge">{nav.badge}</span>}
            </Link>
          ))}
        </nav>

        {trending.length > 0 && (
          <div style={{ marginTop: '32px', marginBottom: 'auto' }}>
            <h3 style={{ fontSize: '14px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px', paddingLeft: '16px' }}>
              Актуальні теми
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {trending.map((tag: any) => (
                <Link key={tag.id} href={`/search?q=%23${tag.name}`} style={{ display: 'block', padding: '8px 16px', borderRadius: '12px', textDecoration: 'none', transition: 'background 0.2s' }} className="hover-bg-input">
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '15px' }}>#{tag.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{tag.posts_count} постів</div>
                </Link>
              ))}
            </div>
            <style jsx>{`
              .hover-bg-input:hover { background: var(--bg-input); }
            `}</style>
          </div>
        )}
      </div>

      <div className="sidebar-user">
        <Link href={`/profile/${user.username}`} style={{textDecoration:'none', color:'inherit'}}>
          <div className="sidebar-user-card">
            {user.avatar_url ? (
              <img src={user.avatar_url} className="avatar avatar-md" alt={user.username} />
            ) : (
              <div className="avatar avatar-md">{user.username[0].toUpperCase()}</div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 15, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                {user.username}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Особистий профіль</div>
            </div>
          </div>
        </Link>
        <button 
          onClick={logout} 
          className="btn btn-ghost btn-full" 
          style={{ marginTop: '16px', color: 'var(--like)', justifyContent: 'flex-start', paddingLeft: '16px', border: 'none' }}
        >
          <LogOut size={20} /> Вийти
        </button>
      </div>
    </aside>
  )
}
