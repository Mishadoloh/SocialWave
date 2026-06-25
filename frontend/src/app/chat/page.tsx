'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { useToast } from '@/lib/ToastContext'
import api from '@/lib/api'
import { Send, Users, MessageCircle, Plus, Search } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import SpotlightCard from '@/components/SpotlightCard'

export default function Chat() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  
  const [rooms, setRooms] = useState([])
  const [suggestedUsers, setSuggestedUsers] = useState([])
  const [activeRoom, setActiveRoom] = useState<any>(null)
  const [messages, setMessages] = useState([])
  const [message, setMessage] = useState('')
  const [searchUsername, setSearchUsername] = useState('')
  const [isCreatingChat, setIsCreatingChat] = useState(false)
  const [ws, setWs] = useState<WebSocket | null>(null)
  const [isRoomsLoading, setIsRoomsLoading] = useState(true)
  const [isMessagesLoading, setIsMessagesLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [user, loading, router])

  // Fetch Rooms & Suggestions
  useEffect(() => {
    if (user) {
      api.get('/chat/rooms')
        .then(res => {
          setRooms(res.data.results || res.data)
          setIsRoomsLoading(false)
        })
        .catch(() => {
          toast('Помилка завантаження кімнат', 'error')
          setIsRoomsLoading(false)
        })
        
      api.get('/users/suggested').then(res => setSuggestedUsers(res.data)).catch(console.error)
    }
  }, [user, toast])

  // Join Room
  useEffect(() => {
    if (!activeRoom || !user) return

    setIsMessagesLoading(true)
    api.get(`/chat/rooms/${activeRoom.id}/messages`)
      .then(res => {
        setMessages(res.data.results || res.data)
        setIsMessagesLoading(false)
        scrollToBottom()
      })
      .catch(() => {
        toast('Помилка завантаження повідомлень', 'error')
        setIsMessagesLoading(false)
      })

    const token = localStorage.getItem('access_token')
    const socket = new WebSocket(`ws://localhost:8000/ws/chat/${activeRoom.id}/?token=${token}`)

    socket.onmessage = (e) => {
      const data = JSON.parse(e.data)
      setMessages(prev => [...prev, data.message] as any)
      scrollToBottom()
    }

    setWs(socket)

    return () => socket.close()
  }, [activeRoom, user, toast])

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  const openChat = async (targetUsername: string) => {
    if (!targetUsername.trim()) return
    setIsCreatingChat(true)
    try {
      const res = await api.post('/chat/rooms/open', { username: targetUsername })
      const newRoom = res.data
      
      if (!rooms.find((r: any) => r.id === newRoom.id)) {
        setRooms((prev: any) => [newRoom, ...prev] as any)
      }
      
      setActiveRoom(newRoom)
      setSearchUsername('')
      toast('Чат відкрито!', 'success')
    } catch (err: any) {
      toast(err.response?.data?.error || 'Помилка створення чату', 'error')
    } finally {
      setIsCreatingChat(false)
    }
  }

  const handleCreateChat = (e: React.FormEvent) => {
    e.preventDefault()
    openChat(searchUsername)
  }

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || !ws) return
    ws.send(JSON.stringify({ message }))
    setMessage('')
  }

  if (loading || !user) return null

  return (
    <div className="page-container-wide animate-fade-in" style={{ height: 'calc(100vh - 64px)' }}>
      <h1 className="page-title" style={{ marginBottom: '16px' }}>Чат</h1>

      <div className="chat-layout">
        <div className="chat-sidebar">
          <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
            <form onSubmit={handleCreateChat} style={{ display: 'flex', gap: '8px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Пошук (username)"
                  className="form-input"
                  style={{ paddingLeft: '36px', borderRadius: '20px' }}
                  value={searchUsername}
                  onChange={e => setSearchUsername(e.target.value)}
                  disabled={isCreatingChat}
                />
              </div>
              <button 
                type="submit" 
                className="btn btn-primary btn-icon" 
                disabled={!searchUsername.trim() || isCreatingChat}
                style={{ borderRadius: '50%', width: '38px', height: '38px', padding: 0 }}
              >
                <Plus size={18} />
              </button>
            </form>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {isRoomsLoading ? (
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: '56px', borderRadius: '12px' }}></div>)}
              </div>
            ) : rooms.length === 0 ? (
              <div style={{ padding: '20px' }}>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="empty-state" style={{ padding: '40px 20px', marginBottom: '24px' }}>
                  <div className="empty-state-icon"><Users size={32} /></div>
                  <h4 style={{ fontSize: '15px' }}>Немає чатів</h4>
                </motion.div>
                
                {suggestedUsers.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Рекомендовані для вас
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {suggestedUsers.map((su: any) => (
                        <div 
                          key={su.username}
                          onClick={() => openChat(su.username)}
                          style={{ 
                            display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', 
                            background: 'rgba(255,255,255,0.02)', borderRadius: '12px', cursor: 'pointer',
                            border: '1px solid var(--border)'
                          }}
                          className="hover-bg"
                        >
                          <div className="avatar avatar-sm" style={{ width: '40px', height: '40px', fontSize: '16px', background: 'var(--accent-light)', color: '#fff' }}>
                            {su.username[0].toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '14px' }}>{su.username}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>AI Bot</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            ) : (
              <AnimatePresence>
                {rooms.map((room: any) => {
                  const otherUser = room.participants.find((p: any) => p.username !== user.username) || room.participants[0]
                  const isActive = activeRoom?.id === room.id
                  return (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      key={room.id} 
                      className={`room-item ${isActive ? 'active' : ''}`}
                      onClick={() => setActiveRoom(room)}
                      style={{ 
                        margin: '8px', 
                        borderRadius: '12px', 
                        background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                        padding: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        cursor: 'pointer',
                        transition: 'background 0.2s'
                      }}
                    >
                      {otherUser.avatar_url ? (
                        <img src={otherUser.avatar_url} className="avatar avatar-sm" alt="" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                      ) : (
                        <div className="avatar avatar-sm" style={{ width: '40px', height: '40px', fontSize: '16px' }}>
                          {otherUser.username[0].toUpperCase()}
                        </div>
                      )}
                      <div style={{ fontWeight: 600 }}>{otherUser.username}</div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            )}
          </div>
        </div>

        <div className="chat-main">
          <AnimatePresence mode="wait">
            {!activeRoom ? (
               <motion.div 
                 key="empty"
                 initial={{ opacity: 0, scale: 0.95 }}
                 animate={{ opacity: 1, scale: 1 }}
                 exit={{ opacity: 0, scale: 0.95 }}
                 className="empty-state" 
                 style={{ flex: 1 }}
               >
                 <div className="empty-state-icon">
                   <motion.div
                     animate={{ y: [0, -10, 0] }}
                     transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                   >
                     <MessageCircle size={64} style={{ color: 'var(--accent)' }} />
                   </motion.div>
                 </div>
                 <h3>Оберіть чат</h3>
                 <p>Виберіть діалог зліва або знайдіть користувача за username, щоб почати спілкування</p>
               </motion.div>
            ) : (
              <motion.div 
                key={activeRoom.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
              >
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontWeight: 700, background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(8px)' }}>
                  {activeRoom.participants.find((p: any) => p.username !== user.username)?.username}
                </div>
                
                <div className="chat-messages" style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {isMessagesLoading ? (
                     <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'flex-start' }}>
                       {[1,2,3].map(i => <div key={i} className="skeleton" style={{ width: '200px', height: '40px', borderRadius: '20px' }}></div>)}
                     </div>
                  ) : (
                    <AnimatePresence initial={false}>
                      {messages.map((msg: any, i) => {
                        const isMine = msg.sender.username === user.username
                        return (
                          <motion.div 
                            key={i} 
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            className={`message-bubble ${isMine ? 'mine' : 'theirs'}`}
                          >
                            <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                          </motion.div>
                        )
                      })}
                    </AnimatePresence>
                  )}
                  <div ref={messagesEndRef} />
                </div>
                
                <form onSubmit={sendMessage} style={{ padding: '16px', borderTop: '1px solid var(--border)', display: 'flex', gap: '12px', background: 'rgba(255,255,255,0.02)' }}>
                  <input 
                    type="text" 
                    className="form-input" 
                    style={{ borderRadius: '24px', flex: 1 }}
                    placeholder="Введіть повідомлення..." 
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                  />
                  <button 
                    type="submit" 
                    className="btn btn-primary btn-icon" 
                    disabled={!message.trim()} 
                    style={{ width: '48px', height: '48px', borderRadius: '50%' }}
                  >
                    <Send size={18} />
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
