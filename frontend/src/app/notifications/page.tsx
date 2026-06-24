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

import { motion, AnimatePresence } from 'framer-motion'
import SpotlightCard from '@/components/SpotlightCard'

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
          setNotifications(res.data.results || res.data)
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

  // Framer motion variants
  const containerVars = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  }

  const itemVars = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  }

  return (
    <div className="page-container animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>Сповіщення</h1>
        {notifications.some((n: any) => !n.is_read) && (
          <button onClick={markAllAsRead} className="btn btn-primary btn-sm" style={{ borderRadius: '20px' }}>
            <CheckCircle size={16} /> Позначити всі як прочитані
          </button>
        )}
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[1,2,3,4].map(i => (
             <div key={i} className="card skeleton" style={{ height: '80px', borderRadius: '16px' }}></div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="empty-state">
           <motion.div 
             className="empty-state-icon"
             animate={{ y: [0, -10, 0] }} 
             transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
           >
             🔔
           </motion.div>
           <h3>Немає нових сповіщень</h3>
           <p>Тут з'являться лайки, коментарі та нові підписники</p>
        </motion.div>
      ) : (
        <motion.div 
          variants={containerVars} 
          initial="hidden" 
          animate="show"
          style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
        >
          <AnimatePresence>
            {notifications.map((notif: any) => (
              <motion.div key={notif.id} variants={itemVars} layout>
                <SpotlightCard>
                  <div 
                    className={`notif-item ${!notif.is_read ? 'unread' : ''}`}
                    onClick={() => { if (!notif.is_read) markAsRead(notif.id) }}
                    style={{ 
                      display: 'flex', gap: '16px', padding: '16px', 
                      cursor: !notif.is_read ? 'pointer' : 'default',
                      alignItems: 'center',
                      background: notif.is_read ? 'transparent' : 'rgba(var(--accent-rgb), 0.05)',
                      borderRadius: '16px',
                      transition: 'background 0.3s'
                    }}
                  >
                    <div className={`notif-icon ${notif.verb}`} style={{ flexShrink: 0, width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-card)' }}>
                      {notif.verb === 'liked' && <Heart size={20} fill="var(--like)" color="var(--like)" />}
                      {notif.verb === 'commented' && <MessageCircle size={20} color="var(--accent-light)" />}
                      {notif.verb === 'followed' && <UserPlus size={20} color="var(--success)" />}
                    </div>
                    
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '15px' }}>
                        <Link href={`/profile/${notif.actor?.username}`} style={{ fontWeight: 600, color: 'var(--text-primary)', textDecoration: 'none' }} onClick={e => e.stopPropagation()}>
                          {notif.actor?.username || 'Користувач'}
                        </Link>
                        {' '}
                        <span style={{ color: 'var(--text-secondary)' }}>
                          {notif.verb === 'liked' && 'вподобав ваш пост.'}
                          {notif.verb === 'commented' && 'прокоментував ваш пост.'}
                          {notif.verb === 'followed' && 'почав читати вас.'}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: uk })}
                      </div>
                    </div>

                    {!notif.is_read && (
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0, boxShadow: '0 0 10px var(--accent)' }}
                      />
                    )}
                  </div>
                </SpotlightCard>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  )
}
