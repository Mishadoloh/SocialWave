'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { useToast } from '@/lib/ToastContext'
import api from '@/lib/api'
import Link from 'next/link'
import { Heart, MessageCircle, UserPlus, CheckCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { uk } from 'date-fns/locale'

export default function Notifications() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [notifications, setNotifications] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      api.get('/notifications')
        .then(res => {
          setNotifications(res.data.results)
          setIsLoading(false)
        })
        .catch(() => {
          toast('Помилка завантаження сповіщень', 'error')
          setIsLoading(false)
        })
    }
  }, [user, toast])

  const markAsRead = async (id: number) => {
    try {
      await api.post(`/notifications/${id}/mark-read`)
      setNotifications(notifications.map((n: any) => n.id === id ? { ...n, is_read: true } : n))
    } catch (e) {
      toast('Не вдалося позначити як прочитане', 'error')
    }
  }

  const markAllAsRead = async () => {
    try {
      await api.post('/notifications/mark-read')
      setNotifications(notifications.map((n: any) => ({ ...n, is_read: true })))
      toast('Усі сповіщення прочитані', 'success')
    } catch (e) {
      toast('Помилка', 'error')
    }
  }

  if (loading || !user) return null

  return (
    <div className="page-container animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>Сповіщення</h1>
        {notifications.some((n: any) => !n.is_read) && (
          <button onClick={markAllAsRead} className="btn btn-ghost btn-sm">
            <CheckCircle size={16} /> Позначити всі як прочитані
          </button>
        )}
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[1,2,3].map(i => (
             <div key={i} className="card skeleton" style={{ height: '80px' }}></div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="empty-state">
           <div className="empty-state-icon">🔔</div>
           <h3>Немає нових сповіщень</h3>
           <p>Тут з'являться лайки, коментарі та нові підписники</p>
        </div>
      ) : (
        <div className="card" style={{ padding: '0 20px' }}>
          {notifications.map((notif: any) => (
            <div 
              key={notif.id} 
              className={`notif-item ${!notif.is_read ? 'unread' : ''}`}
              onClick={() => { if (!notif.is_read) markAsRead(notif.id) }}
              style={{ cursor: !notif.is_read ? 'pointer' : 'default' }}
            >
              <div className={`notif-icon ${notif.notification_type}`}>
                {notif.notification_type === 'liked' && <Heart size={18} fill="var(--like)" color="var(--like)" />}
                {notif.notification_type === 'commented' && <MessageCircle size={18} color="var(--accent-light)" />}
                {notif.notification_type === 'followed' && <UserPlus size={18} color="var(--success)" />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '15px' }}>
                  <Link href={`/profile/${notif.sender.username}`} style={{ fontWeight: 600, color: 'var(--text-primary)', textDecoration: 'none' }}>
                    {notif.sender.username}
                  </Link>
                  {' '}
                  {notif.notification_type === 'liked' && 'вподобав ваш пост.'}
                  {notif.notification_type === 'commented' && 'прокоментував ваш пост.'}
                  {notif.notification_type === 'followed' && 'почав читати вас.'}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: uk })}
                </div>
              </div>
              {!notif.is_read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', alignSelf: 'center' }}></div>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
