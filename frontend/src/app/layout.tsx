import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/lib/AuthContext'
import { ToastProvider } from '@/lib/ToastContext'
import Sidebar from '@/components/Sidebar'
import MainLayout from '@/components/MainLayout'

export const metadata: Metadata = {
  title: 'SocialWave — Соціальна мережа',
  description: 'Спілкуйтесь, діліться та знаходьте нових друзів',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk">
      <body>
        <ToastProvider>
          <AuthProvider>
            <div className="app-layout">
              <Sidebar />
              <MainLayout>
                {children}
              </MainLayout>
            </div>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  )
}
