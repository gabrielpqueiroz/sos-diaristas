'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

const ADMIN_EMAIL = 'admin@sosdiaristas.com'
const ADMIN_PASSWORD = 'sos2026'

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('sos-auth') === '1') {
      router.replace('/dashboard')
    }
  }, [router])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    await new Promise((r) => setTimeout(r, 900))

    if (form.email === ADMIN_EMAIL && form.password === ADMIN_PASSWORD) {
      localStorage.setItem('sos-auth', '1')
      router.push('/dashboard')
    } else {
      setError('E-mail ou senha incorretos.')
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{
        background: `
          radial-gradient(ellipse 700px 600px at 20% 65%, rgba(27,95,168,0.18) 0%, transparent 100%),
          radial-gradient(ellipse 500px 400px at 80% 15%, rgba(59,130,246,0.1) 0%, transparent 100%),
          #07090f
        `,
      }}
    >
      {/* Grid pattern */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }}
      />

      {/* Glow orb */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: 400,
          height: 400,
          left: '10%',
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'radial-gradient(circle, rgba(27,95,168,0.12) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <Image
            src="/logo.png"
            alt="SOS Diaristas"
            width={140}
            height={46}
            className="h-10 w-auto mx-auto mb-5 brightness-0 invert opacity-90"
          />
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold tracking-widest uppercase"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Área Restrita
          </div>
        </div>

        {/* Glass card */}
        <div
          className="rounded-2xl p-8"
          style={{
            background: 'rgba(255,255,255,0.04)',
            backdropFilter: 'blur(28px)',
            WebkitBackdropFilter: 'blur(28px)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 32px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
          }}
        >
          <h1 className="text-white text-xl font-bold mb-1">Entrar</h1>
          <p className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Acesso exclusivo para administradores
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest mb-2"
                style={{ color: 'rgba(255,255,255,0.4)' }}>
                E-mail
              </label>
              <input
                type="email"
                required
                placeholder="admin@sosdiaristas.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none transition-all duration-200"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.09)',
                  caretColor: '#3b82f6',
                }}
                onFocus={(e) => {
                  e.target.style.border = '1px solid rgba(59,130,246,0.5)'
                  e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.12)'
                  e.target.style.background = 'rgba(255,255,255,0.08)'
                }}
                onBlur={(e) => {
                  e.target.style.border = '1px solid rgba(255,255,255,0.09)'
                  e.target.style.boxShadow = 'none'
                  e.target.style.background = 'rgba(255,255,255,0.06)'
                }}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest mb-2"
                style={{ color: 'rgba(255,255,255,0.4)' }}>
                Senha
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-4 py-3 pr-11 rounded-xl text-sm text-white outline-none transition-all duration-200"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.09)',
                    caretColor: '#3b82f6',
                  }}
                  onFocus={(e) => {
                    e.target.style.border = '1px solid rgba(59,130,246,0.5)'
                    e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.12)'
                    e.target.style.background = 'rgba(255,255,255,0.08)'
                  }}
                  onBlur={(e) => {
                    e.target.style.border = '1px solid rgba(255,255,255,0.09)'
                    e.target.style.boxShadow = 'none'
                    e.target.style.background = 'rgba(255,255,255,0.06)'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: 'rgba(255,255,255,0.3)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}
                >
                  {showPw ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div
                className="flex items-center gap-2 text-xs px-4 py-3 rounded-xl"
                style={{
                  color: '#f87171',
                  background: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.2)',
                }}
              >
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-bold text-white text-sm transition-all duration-200 flex items-center justify-center gap-2 mt-2"
              style={{
                background: loading
                  ? 'rgba(27,95,168,0.4)'
                  : 'linear-gradient(135deg, #1B5FA8 0%, #2b7fd4 100%)',
                boxShadow: loading ? 'none' : '0 4px 24px rgba(27,95,168,0.35)',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Autenticando...
                </>
              ) : (
                'Entrar no dashboard'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs mt-8" style={{ color: 'rgba(255,255,255,0.18)' }}>
          © 2026 SOS Diaristas · Acesso restrito
        </p>
      </div>
    </div>
  )
}

function EyeIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}
