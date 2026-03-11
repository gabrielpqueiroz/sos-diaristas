'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { GLASS, STATUS_COLORS } from '../_components/styles'
import { UsersIcon, CalendarIcon, RefreshIcon } from '../_components/icons'

export default function OverviewPage() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  async function loadStats() {
    setLoading(true)
    try {
      const res = await fetch('/api/dashboard/stats?period=30d')
      const data = await res.json()
      setStats(data)
    } catch (e) {
      console.error('Error loading stats:', e)
    }
    setLoading(false)
  }

  useEffect(() => { loadStats() }, [])

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
          <h1 className="text-white font-bold text-lg">Visão Geral</h1>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Últimos 30 dias · Dados em tempo real do PostgreSQL
          </p>
        </div>
        <button
          onClick={loadStats}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200"
          style={{ background: 'linear-gradient(135deg, #1B5FA8 0%, #2b7fd4 100%)', boxShadow: '0 4px 16px rgba(27,95,168,0.3)', color: '#fff' }}
        >
          <RefreshIcon />
          {loading ? 'Carregando...' : 'Atualizar'}
        </button>
      </div>

      <div className="px-8 py-6 space-y-6">
        {loading && !stats ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : stats ? (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard label="Atendimentos Hoje" value={stats.today?.atendimentos_hoje || '0'} accent="#3b82f6" />
              <KpiCard label="Total Contatos" value={stats.contacts?.total_contacts || '0'} accent="#818cf8" />
              <KpiCard label="Clientes Ativos" value={stats.contacts?.clientes || '0'} accent="#10b981" />
              <KpiCard label="Recorrentes" value={stats.contacts?.recorrentes || '0'} accent="#f59e0b" />
            </div>

            {/* Status distribution */}
            <div className="grid lg:grid-cols-2 gap-4">
              <div className="rounded-2xl p-6" style={GLASS}>
                <h3 className="font-bold text-white text-sm mb-5">Distribuição de Contatos</h3>
                <div className="space-y-3">
                  {['novo', 'qualificado', 'cliente', 'agendado', 'inativo', 'perdido'].map((s) => {
                    const count = parseInt(stats.contacts?.[s === 'cliente' ? 'clientes' : s === 'novo' ? 'novos' : s === 'qualificado' ? 'qualificados' : s === 'agendado' ? 'agendados' : s === 'inativo' ? 'inativos' : 'perdidos'] || 0)
                    const total = parseInt(stats.contacts?.total_contacts || 1)
                    const pct = Math.round((count / total) * 100)
                    const colors = STATUS_COLORS[s]
                    return (
                      <div key={s}>
                        <div className="flex justify-between text-xs mb-1">
                          <span style={{ color: colors.color }}>{s.charAt(0).toUpperCase() + s.slice(1)}</span>
                          <span className="font-bold text-white">{count} ({pct}%)</span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: colors.color }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Recent contacts */}
              <div className="rounded-2xl p-6" style={GLASS}>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-bold text-white text-sm">Contatos Recentes</h3>
                  <Link href="/dashboard/contatos" className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors">
                    Ver todos →
                  </Link>
                </div>
                <div className="space-y-2">
                  {(stats.recentContacts || []).slice(0, 8).map((c) => {
                    const statusColor = STATUS_COLORS[c.status] || STATUS_COLORS.novo
                    return (
                      <Link
                        key={c.id}
                        href={`/dashboard/contatos/${c.id}`}
                        className="flex items-center gap-3 px-3 py-2 rounded-xl transition-colors"
                        style={{ background: 'transparent' }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                          style={{ background: statusColor.bg, color: statusColor.color }}>
                          {(c.name || c.phone || '?')[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-white truncate">{c.name || c.phone}</p>
                          <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.3)' }}>
                            {c.last_contact_at ? new Date(c.last_contact_at).toLocaleDateString('pt-BR') : '—'}
                          </p>
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: statusColor.bg, color: statusColor.color }}>
                          {c.status}
                        </span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Daily conversations chart */}
            {stats.dailyConversations?.length > 0 && (
              <div className="rounded-2xl p-6" style={GLASS}>
                <h3 className="font-bold text-white text-sm mb-2">Atendimentos por Dia</h3>
                <p className="text-xs mb-5" style={{ color: 'rgba(255,255,255,0.35)' }}>Contatos únicos atendidos cada dia (últimos 30 dias)</p>
                <DailyChart data={stats.dailyConversations} />
              </div>
            )}
          </>
        ) : null}
      </div>
    </>
  )
}

function KpiCard({ label, value, accent }) {
  return (
    <div className="rounded-2xl p-5" style={GLASS}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: `${accent}18`, color: accent }}>
        <UsersIcon />
      </div>
      <div className="text-2xl font-extrabold text-white tracking-tight">{value}</div>
      <div className="text-xs font-medium mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{label}</div>
    </div>
  )
}

function DailyChart({ data }) {
  const sorted = [...data].sort((a, b) => a.dia.localeCompare(b.dia)).slice(-30)
  const max = Math.max(...sorted.map((d) => parseInt(d.contatos_atendidos) || 1))

  return (
    <div className="flex items-end gap-1 h-28">
      {sorted.map((d, i) => {
        const val = parseInt(d.contatos_atendidos) || 0
        const pct = (val / max) * 100
        const date = new Date(d.dia).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
            <div
              className="w-full rounded-t-sm transition-all duration-200 group-hover:opacity-100 opacity-80 min-h-[2px]"
              style={{ height: `${Math.max(pct, 3)}%`, background: 'linear-gradient(180deg, #3b82f6, #1B5FA8)' }}
            />
            {/* Tooltip */}
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 hidden group-hover:block whitespace-nowrap z-10">
              <div className="bg-white text-gray-900 text-xs px-2 py-1 rounded-lg shadow-lg font-semibold">
                {val} · {date}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
