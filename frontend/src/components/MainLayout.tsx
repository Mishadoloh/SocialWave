'use client'

import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'

export default function MainLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const isAuthPage = pathname === '/login' || pathname === '/register'

  return (
    <main className={isAuthPage ? '' : 'main-content'} style={isAuthPage ? { flex: 1, width: '100%' } : {}}>
      {children}
    </main>
  )
}
