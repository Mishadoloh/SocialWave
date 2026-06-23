'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { useToast } from '@/lib/ToastContext'
import Link from 'next/link'
import { LogIn } from 'lucide-react'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const { login } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(username, password)
      toast('Ви успішно увійшли!', 'success')
      router.push('/')
    } catch (e) {
      toast('Неправильний логін або пароль', 'error')
      setLoading(false)
    }
  }

  return (
    <div className="auth-page animate-fade-in">
      <div className="auth-card">
        <h1 className="auth-title">SocialWave</h1>
        <p className="auth-subtitle">З поверненням! Увійдіть до свого акаунту</p>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Ім'я користувача</label>
            <input 
              type="text" 
              className="form-input"
              value={username} 
              onChange={e => setUsername(e.target.value)}
              placeholder="Введіть логін"
              required 
            />
          </div>
          <div className="form-group">
            <label className="form-label">Пароль</label>
            <input 
              type="password" 
              className="form-input"
              value={password} 
              onChange={e => setPassword(e.target.value)}
              placeholder="Введіть пароль"
              required 
            />
          </div>
          
          <button type="submit" className="btn btn-primary btn-full btn-lg" style={{ marginTop: '24px' }} disabled={loading}>
            {loading ? 'Вхід...' : <><LogIn size={20} /> Увійти</>}
          </button>
        </form>

        <div className="auth-divider">
          <span>або</span>
        </div>

        <div className="auth-link">
          Немає акаунту? <Link href="/register">Створити зараз</Link>
        </div>
      </div>
    </div>
  )
}
