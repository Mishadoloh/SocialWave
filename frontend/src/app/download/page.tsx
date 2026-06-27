'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { useRouter } from 'next/navigation'
import SpotlightCard from '@/components/SpotlightCard'
import { Download, Smartphone, Globe, ShieldAlert, ArrowDownToLine } from 'lucide-react'
import { motion } from 'framer-motion'

export default function DownloadPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [activeGuide, setActiveGuide] = useState<'android' | 'ios'>('android')

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    // Capture PWA install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setDeferredPrompt(null)
      setIsInstalled(true)
    }
  }

  if (loading || !user) return null

  return (
    <div className="page-container animate-fade-in" style={{ maxWidth: '720px' }}>
      <h1 className="page-title"><Smartphone size={28} /> Встановити додаток</h1>

      <SpotlightCard className="download-hero" style={{ padding: '32px', textAlign: 'center', marginBottom: '32px' }}>
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '24px',
            background: 'var(--accent-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px auto',
            boxShadow: '0 8px 30px rgba(110, 68, 255, 0.3)'
          }}>
            <Smartphone size={40} style={{ color: '#fff' }} />
          </div>

          <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>SocialWave на вашому телефоні</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '15px', maxWidth: '480px', margin: '0 auto 24px auto' }}>
            Встановіть SocialWave як додаток (PWA) для миттєвого доступу, повноекранного режиму та високої швидкості роботи.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
              {deferredPrompt && (
                <button
                  onClick={handleInstallClick}
                  className="btn btn-primary"
                  style={{
                    borderRadius: '30px',
                    padding: '12px 32px',
                    fontSize: '15px',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '10px',
                    boxShadow: '0 8px 20px var(--accent-glow)'
                  }}
                >
                  <ArrowDownToLine size={18} /> Встановити PWA
                </button>
              )}
              
              <a
                href="/socialwave-desktop.bat"
                download="SocialWave.bat"
                className="btn btn-ghost"
                style={{
                  borderRadius: '30px',
                  padding: '12px 32px',
                  fontSize: '15px',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  border: '1px solid var(--border)',
                  textDecoration: 'none'
                }}
              >
                <Download size={18} /> Скачати для Windows (.bat)
              </a>
            </div>

            {!deferredPrompt && !isInstalled && (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 20px',
                background: 'var(--bg-input)',
                borderRadius: '20px',
                color: 'var(--text-muted)',
                fontSize: '14px',
                border: '1px solid var(--border)',
                marginTop: '8px'
              }}>
                <Globe size={16} /> Скористайтеся інструкцією нижче для вашого мобільного пристрою
              </div>
            )}
          </div>
        </motion.div>
      </SpotlightCard>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <button
          onClick={() => setActiveGuide('android')}
          className={`tab ${activeGuide === 'android' ? 'active' : ''}`}
          style={{ flex: 1, justifyContent: 'center' }}
        >
          🤖 Android
        </button>
        <button
          onClick={() => setActiveGuide('ios')}
          className={`tab ${activeGuide === 'ios' ? 'active' : ''}`}
          style={{ flex: 1, justifyContent: 'center' }}
        >
          🍏 iPhone / iOS
        </button>
      </div>

      <SpotlightCard style={{ padding: '24px' }}>
        {activeGuide === 'android' ? (
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Globe size={20} style={{ color: 'var(--accent)' }} /> Інструкція для Android (Google Chrome)
            </h3>
            <ol style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '12px', color: 'var(--text-primary)', fontSize: '15px' }}>
              <li>Відкрийте цей сайт у браузері <strong>Google Chrome</strong> на телефоні.</li>
              <li>Натисніть кнопку меню (три крапки зверху праворуч).</li>
              <li>Оберіть пункт <strong>"Додати на головний екран"</strong> або <strong>"Встановити додаток"</strong>.</li>
              <li>Підтвердіть дію, і іконка SocialWave з'явиться на вашому робочому столі!</li>
            </ol>
          </div>
        ) : (
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Smartphone size={20} style={{ color: 'var(--accent)' }} /> Інструкція для iOS (Safari)
            </h3>
            <ol style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '12px', color: 'var(--text-primary)', fontSize: '15px' }}>
              <li>Відкрийте цей сайт через стандартний браузер <strong>Safari</strong>.</li>
              <li>Натисніть кнопку <strong>"Поділитися"</strong> (іконка квадрата зі стрілкою вгору в нижньому меню).</li>
              <li>Прокрутіть меню вниз та оберіть пункт <strong>"На початковий екран"</strong> (Add to Home Screen).</li>
              <li>Натисніть <strong>"Додати"</strong> у верхньому правому кутку. Додаток встановлено!</li>
            </ol>
          </div>
        )}
      </SpotlightCard>
    </div>
  )
}
