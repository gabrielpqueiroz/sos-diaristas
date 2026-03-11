'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { GLASS, STATUS_COLORS, STATUS_LABELS } from '../../_components/styles'
import { SearchIcon, WhatsAppIcon, ChevronLeft, ChevronRight, RefreshIcon, UserPlusIcon } from '../../_components/icons'

const STATUSES = ['', 'novo', 'qualificado', 'agendado', 'cliente', 'inativo', 'perdido']

export default function ContatosPage() {
  const [contacts, setContacts] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [searchTimeout, setSearchTimeout] = useState(null)

  const loadContacts = useCallback(async (p = page, s = search, st = status) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: p, limit: 25, search: s, status: st })
      const res = await fetch(`/api/dashboard/contatos?${params}`)
      const data = await res.json()
      setContacts(data.contacts || [])
      setTotal(data.total || 0)
      setTotalPages(data.totalPages || 1)
    } catch (e) {
      console.error('Error loading contacts:', e)
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadContacts(1, search, status) }, [status])

  function handleSearch(val) {
    setSearch(val)
    if (searchTimeout) clearTimeout(searchTimeout)
    setSearchTimeout(setTimeout(() => {
      setPage(1)
      loadContacts(1, val, status)
    }, 400))
  }

  function handlePageChange(newPage) {
    setPage(newPage)
    loadContacts(newPage, search, status)
  }

  function formatPhone(phone) {
    if (!phone || phone.length < 10) return phone
    // Format Brazilian phone: 55 45 99818-3986
    if (phone.startsWith('55') && phone.length >= 12) {
      const ddd = phone.substring(2, 4)
      const num = phone.substring(4)
      if (num.length === 9) return `(${ddd}) ${num.substring(0, 5)}-${num.substring(5)}`
      if (num.length === 8) return `(${ddd}) ${num.substring(0, 4)}-${num.substring(4)}`
    }
    return phone
  }

  function timeAgo(dateStr) {
    if (!dateStr) return '—'
    const diff = Date.now() - new Date(dateStr).getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    if (days === 0) return 'Hoje'
    if (days === 1) return 'Ontem'
    if (days < 7) return `${days}d atrás`
    if (days < 30) return `${Math.floor(days / 7)}sem atrás`
    if (days < 365) return `${Math.floor(days / 30)}m atrás`
    return `${Math.floor(days / 365)}a atrás`
  }

  return (
    <>
      {/* Top bar */}
      <div
        className="sticky top-0 z-10 flex items-center justify-between px-8 py-4"
        style={{
          background: 'rgba(7,9,15,0.8)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        <div>
          <h1 className="text-white font-bold text-lg">Contatos</h1>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
            {total.toLocaleString('pt-BR')} contatos no CRM
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => loadContacts(page, search, status)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-colors"
            style={{ ...GLASS, color: 'rgba(255,255,255,0.6)' }}
          >
            <RefreshIcon />
          </button>
        </div>
      </div>

      <div className="px-8 py-6 space-y-4">
        {/* Search + filters */}
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.3)' }}>
              <SearchIcon />
            </span>
            <input
              type="text"
              placeholder="Buscar por nome ou telefone..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-white outline-none transition-all duration-200"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.09)',
                caretColor: '#3b82f6',
              }}
              onFocus={(e) => { e.target.style.border = '1px solid rgba(59,130,246,0.4)' }}
              onBlur={(e) => { e.target.style.border = '1px solid rgba(255,255,255,0.09)' }}
            />
          </div>

          {/* Status filter tabs */}
          <div className="flex gap-1 rounded-xl p-1" style={{ background: 'rgba(255,255,255,0.04)' }}>
            {STATUSES.map((s) => {
              const active = status === s
              const label = s === '' ? 'Todos' : STATUS_LABELS[s]
              return (
                <button
                  key={s}
                  onClick={() => { setStatus(s); setPage(1) }}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap"
                  style={{
                    background: active ? 'rgba(27,95,168,0.3)' : 'transparent',
                    color: active ? '#fff' : 'rgba(255,255,255,0.4)',
                  }}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Table */}
        <div className="rounded-2xl overflow-hidden" style={GLASS}>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
            </div>
          ) : contacts.length === 0 ? (
            <div className="text-center py-16" style={{ color: 'rgba(255,255,255,0.3)' }}>
              <p className="text-sm">Nenhum contato encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    {['Contato', 'Telefone', 'Status', 'Recorrente', 'Último contato', 'Msgs', ''].map((h) => (
                      <th key={h} className="text-left px-5 py-3 font-semibold uppercase tracking-wider"
                        style={{ color: 'rgba(255,255,255,0.3)' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {contacts.map((c, i) => {
                    const statusColor = STATUS_COLORS[c.status] || STATUS_COLORS.novo
                    return (
                      <tr
                        key={c.id}
                        className="transition-colors cursor-pointer"
                        style={{ borderBottom: i < contacts.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.025)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        {/* Name + avatar */}
                        <td className="px-5 py-3">
                          <Link href={`/dashboard/contatos/${c.id}`} className="flex items-center gap-3">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                              style={{ background: statusColor.bg, color: statusColor.color }}
                            >
                              {(c.name || c.phone || '?')[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-white text-sm">{c.name || '—'}</p>
                              {c.ddd && <p style={{ color: 'rgba(255,255,255,0.25)' }}>DDD {c.ddd}</p>}
                            </div>
                          </Link>
                        </td>

                        {/* Phone */}
                        <td className="px-5 py-3" style={{ color: 'rgba(255,255,255,0.55)' }}>
                          {formatPhone(c.phone)}
                        </td>

                        {/* Status */}
                        <td className="px-5 py-3">
                          <span
                            className="px-2.5 py-1 rounded-full text-xs font-semibold"
                            style={{ background: statusColor.bg, color: statusColor.color, border: `1px solid ${statusColor.border}` }}
                          >
                            {STATUS_LABELS[c.status] || c.status}
                          </span>
                        </td>

                        {/* Recurring */}
                        <td className="px-5 py-3">
                          {c.is_recurring ? (
                            <span className="text-emerald-400 text-xs font-semibold">Sim</span>
                          ) : (
                            <span style={{ color: 'rgba(255,255,255,0.25)' }}>—</span>
                          )}
                        </td>

                        {/* Last contact */}
                        <td className="px-5 py-3" style={{ color: 'rgba(255,255,255,0.45)' }}>
                          {timeAgo(c.last_contact_at)}
                        </td>

                        {/* Messages */}
                        <td className="px-5 py-3">
                          <span className="font-bold text-blue-400">{c.total_messages || '—'}</span>
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <a
                              href={`https://wa.me/${c.phone}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                              style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399' }}
                              title="Abrir WhatsApp"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <WhatsAppIcon size={12} />
                            </a>
                            <Link
                              href={`/dashboard/contatos/${c.id}`}
                              className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                              style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa' }}
                              title="Ver detalhes"
                            >
                              <ChevronRight />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div
              className="flex items-center justify-between px-5 py-3 border-t"
              style={{ borderColor: 'rgba(255,255,255,0.06)' }}
            >
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                Página {page} de {totalPages} · {total.toLocaleString('pt-BR')} contatos
              </p>
              <div className="flex gap-1">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page <= 1}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors disabled:opacity-30"
                  style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)' }}
                >
                  <ChevronLeft />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let p
                  if (totalPages <= 5) p = i + 1
                  else if (page <= 3) p = i + 1
                  else if (page >= totalPages - 2) p = totalPages - 4 + i
                  else p = page - 2 + i
                  return (
                    <button
                      key={p}
                      onClick={() => handlePageChange(p)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium transition-colors"
                      style={{
                        background: p === page ? 'rgba(27,95,168,0.3)' : 'rgba(255,255,255,0.06)',
                        color: p === page ? '#fff' : 'rgba(255,255,255,0.5)',
                      }}
                    >
                      {p}
                    </button>
                  )
                })}
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= totalPages}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors disabled:opacity-30"
                  style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)' }}
                >
                  <ChevronRight />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
