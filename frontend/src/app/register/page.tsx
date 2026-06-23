'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { useToast } from '@/lib/ToastContext'
import Link from 'next/link'
import { UserPlus } from 'lucide-react'

export default function Register() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/users/register/', { username, email, password })
      toast('Акаунт успішно створено! Тепер ви можете увійти.', 'success')
      router.push('/login')
    } catch (e: any) {
      toast(e.response?.data?.detail || 'Помилка реєстрації', 'error')
      setLoading(false)
    }
  }

  return (
    <div className="auth-page animate-fade-in">
      <div className="auth-card">
        <h1 className="auth-title">SocialWave</h1>
        <p className="auth-subtitle">Приєднуйтесь до найсучаснішої спільноти</p>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Ім'я користувача</label>
            <input 
              type="text" 
              className="form-input"
              value={username} 
              onChange={e => setUsername(e.target.value)}
              placeholder="Виберіть логін"
              required 
            />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input 
              type="email" 
              className="form-input"
              value={email} 
              onChange={e => setEmail(e.target.value)}
              placeholder="Ваша пошта"
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
              placeholder="Надійний пароль"
              required 
            />
          </div>
          
          <button type="submit" className="btn btn-primary btn-full btn-lg" style={{ marginTop: '24px' }} disabled={loading}>
            {loading ? 'Реєстрація...' : <><UserPlus size={20} /> Створити акаунт</>}
          </button>
        </form>

        <div className="auth-divider">
          <span>або</span>
        </div>

        <div className="auth-link">
          Вже маєте акаунт? <Link href="/login">Увійти</Link>
        </div>
      </div>
    </div>
  )
}
