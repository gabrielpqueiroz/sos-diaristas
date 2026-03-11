'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { GridIcon, UsersIcon, ClipboardIcon, CalendarIcon, SparklesIcon, ReportIcon, SettingsIcon, LogoutIcon } from '../_components/icons'
import { BG_GRADIENT } from '../_components/styles'

const navItems = [
  { id: 'overview', label: 'Visão Geral', href: '/dashboard', icon: <GridIcon /> },
  { id: 'contatos', label: 'Contatos', href: '/dashboard/contatos', icon: <UsersIcon /> },
  { id: 'pedidos', label: 'Pedidos', href: '/dashboard/pedidos', icon: <ClipboardIcon /> },
  { id: 'calendario', label: 'Calendário', href: '/dashboard/calendario', icon: <CalendarIcon /> },
  { id: 'diaristas', label: 'Diaristas', href: '/dashboard/diaristas', icon: <SparklesIcon /> },
  { id: 'relatorios', label: 'Relatórios', href: '/dashboard/relatorios', icon: <ReportIcon /> },
  { id: 'config', label: 'Configurações', href: '/dashboard/configuracoes', icon: <SettingsIcon /> },
]

export default function AppLayout({ children }) {
  const [authed, setAuthed] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (localStorage.getItem('sos-auth') !== '1') {
        router.replace('/dashboard/login')
      } else {
        setAuthed(true)
      }
    }
  }, [router])

  function handleLogout() {
    localStorage.removeItem('sos-auth')
    router.push('/dashboard/login')
  }

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#07090f' }}>
        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    )
  }

  function isActive(href) {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: BG_GRADIENT, color: 'rgba(255,255,255,0.85)' }}
    >
      {/* ── SIDEBAR ─────────────────────────────────────────────── */}
      <aside
        className="flex flex-col flex-shrink-0 w-56 h-full"
        style={{ background: 'rgba(255,255,255,0.02)', borderRight: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="px-5 py-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <Image src="/logo.png" alt="SOS Diaristas" width={120} height={40} className="h-8 w-auto brightness-0 invert opacity-80" />
          <p className="text-xs mt-2 font-semibold tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.25)' }}>
            Dashboard
          </p>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-0.5">
          {navItems.map((item) => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.id}
                href={item.href}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
                style={{
                  background: active ? 'rgba(27,95,168,0.2)' : 'transparent',
                  color: active ? '#fff' : 'rgba(255,255,255,0.38)',
                  borderLeft: active ? '2px solid #1B5FA8' : '2px solid transparent',
                }}
              >
                <span style={{ color: active ? '#3b82f6' : 'inherit' }}>{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="px-3 pb-4">
          <div
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs"
            style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)', color: 'rgba(251,191,36,0.8)' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
            <span>Meta Ads: Demo</span>
          </div>
        </div>

        <div className="px-4 py-4 border-t flex items-center gap-3" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #1B5FA8, #3b82f6)' }}>
            G
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">Gabriel Q.</p>
            <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.3)' }}>Admin</p>
          </div>
          <button onClick={handleLogout} title="Sair" className="transition-colors flex-shrink-0"
            style={{ color: 'rgba(255,255,255,0.25)' }}>
            <LogoutIcon />
          </button>
        </div>
      </aside>

      {/* ── MAIN ──────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
