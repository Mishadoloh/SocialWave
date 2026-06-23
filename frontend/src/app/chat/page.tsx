'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { useToast } from '@/lib/ToastContext'
import api from '@/lib/api'
import { Send, Users, MessageCircle } from 'lucide-react'

export default function Chat() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  
  const [rooms, setRooms] = useState([])
  const [activeRoom, setActiveRoom] = useState<any>(null)
  const [messages, setMessages] = useState([])
  const [message, setMessage] = useState('')
  const [ws, setWs] = useState<WebSocket | null>(null)
  const [isRoomsLoading, setIsRoomsLoading] = useState(true)
  const [isMessagesLoading, setIsMessagesLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [user, loading, router])

  // Fetch Rooms
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
    const socket = new WebSocket(`ws://localhost:8000/ws/chat/${activeRoom.name}/?token=${token}`)

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
          {isRoomsLoading ? (
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: '40px' }}></div>)}
            </div>
          ) : rooms.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px 20px' }}>
              <div className="empty-state-icon"><Users size={32} /></div>
              <h4 style={{ fontSize: '15px' }}>Немає чатів</h4>
            </div>
          ) : (
            rooms.map((room: any) => {
              const otherUser = room.participants.find((p: any) => p.username !== user.username) || room.participants[0]
              const isActive = activeRoom?.id === room.id
              return (
                <div 
                  key={room.id} 
                  className={`room-item ${isActive ? 'active' : ''}`}
                  onClick={() => setActiveRoom(room)}
                >
                  {otherUser.avatar_url ? (
                    <img src={otherUser.avatar_url} className="avatar avatar-sm" alt="" />
                  ) : (
                    <div className="avatar avatar-sm">{otherUser.username[0].toUpperCase()}</div>
                  )}
                  <div style={{ fontWeight: 600 }}>{otherUser.username}</div>
                </div>
              )
            })
          )}
        </div>

        <div className="chat-main">
          {!activeRoom ? (
             <div className="empty-state" style={{ flex: 1 }}>
               <div className="empty-state-icon"><MessageCircle size={48} /></div>
               <h3>Оберіть чат</h3>
               <p>Виберіть діалог зліва, щоб почати спілкування</p>
             </div>
          ) : (
            <>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontWeight: 700, background: 'rgba(255,255,255,0.02)' }}>
                {activeRoom.participants.find((p: any) => p.username !== user.username)?.username}
              </div>
              <div className="chat-messages">
                {isMessagesLoading ? (
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'flex-start' }}>
                     {[1,2,3].map(i => <div key={i} className="skeleton" style={{ width: '200px', height: '40px', borderRadius: '20px' }}></div>)}
                   </div>
                ) : (
                  messages.map((msg: any, i) => {
                    const isMine = msg.sender.username === user.username
                    return (
                      <div key={i} className={`message-bubble ${isMine ? 'mine' : 'theirs'}`}>
                        <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
              <form onSubmit={sendMessage} style={{ padding: '16px', borderTop: '1px solid var(--border)', display: 'flex', gap: '12px' }}>
                <input 
                  type="text" 
                  className="form-input" 
                  style={{ borderRadius: '24px', flex: 1 }}
                  placeholder="Введіть повідомлення..." 
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                />
                <button type="submit" className="btn btn-primary btn-icon" disabled={!message.trim()} style={{ width: '48px', height: '48px', borderRadius: '50%' }}>
                  <Send size={18} />
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
