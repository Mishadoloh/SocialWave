'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import api from '@/lib/api'
import Link from 'next/link'

function Avatar({ user, size = 'sm' }: { user: any; size?: string }) {
  if (user?.avatar_url) return <img src={user.avatar_url} className={`avatar avatar-${size}`} alt={user.username} />
  return <div className={`avatar avatar-${size}`}>{user?.username?.[0]?.toUpperCase()}</div>
}

function timeAgo(dateStr: string) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000
  if (diff < 60) return 'щойно'
  if (diff < 3600) return `${Math.floor(diff / 60)} хв`
  return `${Math.floor(diff / 3600)} год`
}

export default function ChatRoomPage() {
  const { roomId } = useParams<{ roomId: string }>()
  const { user } = useAuth()
  const router = useRouter()
  const [messages, setMessages] = useState<any[]>([])
  const [rooms, setRooms] = useState<any[]>([])
  const [inputText, setInputText] = useState('')
  const [ws, setWs] = useState<WebSocket | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Load rooms
  useEffect(() => {
    if (!user) { router.push('/login'); return }
    api.get('/chat/rooms').then(res => setRooms(res.data.results || res.data)).catch(() => {})
  }, [user])

  // Load messages
  useEffect(() => {
    if (!user || !roomId) return
    api.get(`/chat/rooms/${roomId}/messages`)
      .then(res => setMessages(res.data.results || res.data))
      .catch(() => {})
  }, [roomId, user])

  // WebSocket
  useEffect(() => {
    if (!user || !roomId) return
    const token = localStorage.getItem('access_token')
    const socket = new WebSocket(`ws://localhost:8000/ws/chat/${roomId}/?token=${token}`)
    socket.onmessage = (e) => {
      const data = JSON.parse(e.data)
      setMessages(prev => [...prev, data])
    }
    setWs(socket)
    return () => socket.close()
  }, [roomId, user])

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = () => {
    if (!inputText.trim() || !ws) return
    ws.send(JSON.stringify({ content: inputText }))
    setInputText('')
  }

  const getOtherParticipant = (room: any) => {
    return room.participants?.find((p: any) => p.id !== user?.id)
  }

  return (
    <div className="page-container-wide">
      <h1 className="page-title">💬 Повідомлення</h1>
      <div className="chat-layout">
        {/* Rooms sidebar */}
        <div className="chat-sidebar">
          {rooms.length === 0 ? (
            <div style={{ padding: 20, color: 'var(--text-muted)', fontSize: 14 }}>
              Немає чатів
            </div>
          ) : rooms.map((room: any) => {
            const other = getOtherParticipant(room)
            return (
              <Link
                key={room.id}
                href={`/chat/${room.id}`}
                className={`room-item ${roomId === String(room.id) ? 'active' : ''}`}
              >
                <Avatar user={other} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{other?.username}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {room.last_message?.content || 'Немає повідомлень'}
                  </div>
                </div>
                {room.unread_count > 0 && (
                  <span className="nav-badge">{room.unread_count}</span>
                )}
              </Link>
            )
          })}
        </div>

        {/* Chat area */}
        <div className="chat-main">
          <div className="chat-messages">
            {messages.length === 0 && (
              <div className="empty-state" style={{ padding: 40 }}>
                <div className="empty-state-icon">💬</div>
                <h3>Почніть спілкування!</h3>
              </div>
            )}
            {messages.map((msg: any) => {
              const isMine = (msg.sender_id || msg.sender?.id) === user?.id
              return (
                <div key={msg.id || msg.created_at} style={{ display: 'flex', flexDirection: 'column' }}>
                  <div className={`message-bubble ${isMine ? 'mine' : 'theirs'}`}>
                    {msg.content}
                    <div className="message-time">
                      {timeAgo(msg.created_at)}
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input-area">
            <textarea
              className="chat-input"
              placeholder="Напиши повідомлення..."
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
              }}
              rows={1}
            />
            <button className="btn btn-primary" onClick={sendMessage} disabled={!inputText.trim()}>
              ✈️
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
