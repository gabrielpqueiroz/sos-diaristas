'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { GLASS } from '../../_components/styles'
import { WhatsAppIcon, MapPinIcon, PhoneIcon, CalendarIcon, RefreshIcon } from '../../_components/icons'

const STATUS_CONFIG = {
  pendente: { label: 'Pendente', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  agendado: { label: 'Agendado', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  confirmado: { label: 'Confirmado', color: '#818cf8', bg: 'rgba(129,140,248,0.12)' },
  diarista_atribuida: { label: 'Diarista OK', color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
  em_andamento: { label: 'Em Andamento', color: '#22d3ee', bg: 'rgba(34,211,238,0.12)' },
  concluido: { label: 'Concluído', color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  cancelado: { label: 'Cancelado', color: '#6b7280', bg: 'rgba(107,114,128,0.12)' },
}

const PAYMENT_CONFIG = {
  pendente: { label: 'Pendente', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)' },
  pago: { label: 'Pago', color: '#10b981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.25)' },
  parcial: { label: 'Parcial', color: '#f97316', bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.25)' },
}

export default function HojePage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState(null)
  const timerRef = useRef(null)

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const res = await fetch('/api/dashboard/hoje')
      const json = await res.json()
      setData(json)
    } catch (e) { console.error(e) }
    if (!silent) setLoading(false)
  }, [])

  useEffect(() => {
    loadData()
    timerRef.current = setInterval(() => loadData(true), 20000)
    return () => clearInterval(timerRef.current)
  }, [loadData])

  async function updateOrder(orderId, updates) {
    setUpdatingId(orderId)
    try {
      await fetch(`/api/dashboard/pedidos/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      loadData(true)
    } catch (e) { console.error(e) }
    setUpdatingId(null)
  }

  function formatPhone(p) {
    if (!p) return ''
    const d = p.replace(/\D/g, '')
    if (d.length === 13) return `+${d.slice(0, 2)} (${d.slice(2, 4)}) ${d.slice(4, 9)}-${d.slice(9)}`
    if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
    return p
  }

  function formatDate(d) {
    return new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
  }

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    )
  }

  const { orders, tomorrowOrders, diaristas, summary } = data
  const now = new Date()
  const horaAtual = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Hoje</h1>
          <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
            {formatDate(data.today)} · {horaAtual}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg" style={{ background: 'rgba(16,185,129,0.08)', color: '#34d399' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Ao vivo
          </div>
          <button onClick={() => loadData()} className="p-2 rounded-xl transition-all" style={{ ...GLASS, color: 'rgba(255,255,255,0.5)' }}>
            <RefreshIcon />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {[
          { label: 'Pedidos Hoje', value: parseInt(summary.total) || 0, color: '#60a5fa' },
          { label: 'Pendentes', value: parseInt(summary.pendentes) || 0, color: '#fbbf24' },
          { label: 'Em Andamento', value: parseInt(summary.em_andamento) || 0, color: '#22d3ee' },
          { label: 'Concluídos', value: parseInt(summary.concluidos) || 0, color: '#34d399' },
          { label: 'Receita Esperada', value: `R$ ${parseFloat(summary.receita_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`, color: '#34d399' },
        ].map((kpi, i) => (
          <div key={i} className="rounded-xl p-4" style={GLASS}>
            <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>{kpi.label}</p>
            <p className="text-lg font-bold" style={{ color: kpi.color }}>{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main: Today's timeline */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-sm font-bold text-white mb-3">Agenda do Dia</h2>

          {orders.length === 0 ? (
            <div className="rounded-2xl p-10 text-center" style={GLASS}>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>Nenhum pedido agendado para hoje.</p>
            </div>
          ) : (
            orders.map(order => {
              const sc = STATUS_CONFIG[order.status] || STATUS_CONFIG.pendente
              const pc = PAYMENT_CONFIG[order.payment_status || 'pendente']
              const isUpdating = updatingId === order.id
              const isPast = order.scheduled_time && order.scheduled_time < horaAtual && order.status !== 'concluido' && order.status !== 'cancelado'

              return (
                <div
                  key={order.id}
                  className="rounded-2xl p-5 transition-all"
                  style={{
                    ...GLASS,
                    borderLeft: `4px solid ${sc.color}`,
                    opacity: isUpdating ? 0.6 : 1,
                    background: isPast ? 'rgba(245,158,11,0.04)' : GLASS.background,
                  }}
                >
                  <div className="flex items-start gap-4">
                    {/* Time column */}
                    <div className="flex-shrink-0 text-center w-16">
                      <p className="text-lg font-bold" style={{ color: order.scheduled_time ? '#fff' : 'rgba(255,255,255,0.2)' }}>
                        {order.scheduled_time ? order.scheduled_time.substring(0, 5) : '—'}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.25)' }}>
                        {order.service_type?.match(/(\d+)h/)?.[0] || ''}
                      </p>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Top row: client + status */}
                      <div className="flex items-center gap-2 mb-1.5">
                        <p className="text-sm font-bold text-white truncate">
                          {order.contact_name || 'Sem nome'}
                        </p>
                        <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                          style={{ background: sc.bg, color: sc.color, fontSize: '10px', fontWeight: 600 }}>
                          {sc.label}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                          style={{ background: pc.bg, color: pc.color, border: `1px solid ${pc.border}`, fontSize: '10px', fontWeight: 600 }}>
                          {pc.label}
                        </span>
                      </div>

                      {/* Service type */}
                      <p className="text-xs mb-1.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
                        {order.service_type || 'Serviço'}
                        {order.value && <span className="font-bold ml-2" style={{ color: '#34d399' }}>R$ {parseFloat(order.value).toLocaleString('pt-BR')}</span>}
                      </p>

                      {/* Address */}
                      {(order.address || order.contact_address) && (
                        <div className="flex items-start gap-1.5 mb-1.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                          <MapPinIcon />
                          <span className="text-xs">{order.address || order.contact_address}</span>
                        </div>
                      )}

                      {/* Diarista */}
                      {order.diarista_name ? (
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-5 h-5 rounded-full flex items-center justify-center"
                            style={{ background: 'rgba(167,139,250,0.2)', fontSize: '9px', color: '#c084fc', fontWeight: 700 }}>
                            {order.diarista_name[0]}
                          </div>
                          <span className="text-xs" style={{ color: '#c4b5fd' }}>{order.diarista_name}</span>
                          {order.diarista_phone && (
                            <a href={`https://wa.me/${order.diarista_phone.replace(/\D/g, '')}`}
                              target="_blank" rel="noopener noreferrer"
                              className="text-xs px-1.5 py-0.5 rounded-md transition-colors"
                              style={{ background: 'rgba(37,211,102,0.1)', color: '#25d366', fontSize: '10px' }}>
                              WhatsApp
                            </a>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs mb-2" style={{ color: 'rgba(245,158,11,0.6)' }}>
                          Sem diarista atribuída
                        </p>
                      )}

                      {/* Action buttons */}
                      <div className="flex items-center flex-wrap gap-2">
                        {/* Quick status buttons */}
                        {order.status !== 'em_andamento' && order.status !== 'concluido' && order.status !== 'cancelado' && (
                          <button onClick={() => updateOrder(order.id, { status: 'em_andamento' })}
                            className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
                            style={{ background: 'rgba(34,211,238,0.12)', color: '#22d3ee', border: '1px solid rgba(34,211,238,0.2)' }}>
                            Iniciar
                          </button>
                        )}
                        {order.status === 'em_andamento' && (
                          <button onClick={() => updateOrder(order.id, { status: 'concluido' })}
                            className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
                            style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }}>
                            Concluir
                          </button>
                        )}

                        {/* Payment toggle */}
                        {order.payment_status !== 'pago' && (
                          <button onClick={() => updateOrder(order.id, { payment_status: 'pago' })}
                            className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
                            style={{ background: 'rgba(16,185,129,0.08)', color: '#34d399', border: '1px solid rgba(16,185,129,0.15)' }}>
                            Marcar Pago
                          </button>
                        )}
                        {order.payment_status === 'pago' && (
                          <span className="text-xs px-3 py-1.5 rounded-lg font-semibold"
                            style={{ background: 'rgba(16,185,129,0.1)', color: '#34d399' }}>
                            Pago ✓
                          </span>
                        )}

                        {/* WhatsApp client */}
                        {order.contact_phone && (
                          <a href={`https://wa.me/${order.contact_phone.replace(/\D/g, '')}`}
                            target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
                            style={{ background: 'rgba(37,211,102,0.08)', color: '#25d366', border: '1px solid rgba(37,211,102,0.15)' }}>
                            <WhatsAppIcon size={11} />
                            Cliente
                          </a>
                        )}

                        {order.status !== 'cancelado' && order.status !== 'concluido' && (
                          <button onClick={() => updateOrder(order.id, { status: 'cancelado' })}
                            className="text-xs px-2 py-1.5 rounded-lg transition-all ml-auto"
                            style={{ color: 'rgba(255,255,255,0.2)' }}>
                            Cancelar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Sidebar: Diaristas + Tomorrow */}
        <div className="space-y-5">
          {/* Diaristas do dia */}
          <div className="rounded-2xl p-5" style={GLASS}>
            <h3 className="text-sm font-bold text-white mb-3">Diaristas Hoje</h3>
            {diaristas.length === 0 ? (
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Nenhuma diarista ativa.</p>
            ) : (
              <div className="space-y-2.5">
                {diaristas.map(d => {
                  const busy = parseInt(d.orders_today) > 0
                  return (
                    <div key={d.id} className="flex items-center gap-3 p-2.5 rounded-xl"
                      style={{ background: busy ? 'rgba(167,139,250,0.06)' : 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{ background: busy ? 'linear-gradient(135deg, #7c3aed, #a78bfa)' : 'rgba(255,255,255,0.08)', color: busy ? '#fff' : 'rgba(255,255,255,0.3)' }}>
                        {d.name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-white truncate">{d.name}</p>
                        {busy ? (
                          <p className="text-xs" style={{ color: '#c4b5fd' }}>
                            {d.orders_today} pedido{parseInt(d.orders_today) > 1 ? 's' : ''} · {d.times_today}
                          </p>
                        ) : (
                          <p className="text-xs" style={{ color: 'rgba(16,185,129,0.6)' }}>Disponível</p>
                        )}
                      </div>
                      {d.phone && (
                        <a href={`https://wa.me/${d.phone.replace(/\D/g, '')}`}
                          target="_blank" rel="noopener noreferrer"
                          className="p-1.5 rounded-md flex-shrink-0 transition-colors"
                          style={{ background: 'rgba(37,211,102,0.1)', color: '#25d366' }}>
                          <WhatsAppIcon size={11} />
                        </a>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Tomorrow preview */}
          <div className="rounded-2xl p-5" style={GLASS}>
            <h3 className="text-sm font-bold text-white mb-1">Amanhã</h3>
            <p className="text-xs mb-3" style={{ color: 'rgba(255,255,255,0.25)' }}>
              {formatDate(data.tomorrow)}
            </p>

            {tomorrowOrders.length === 0 ? (
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Nenhum pedido agendado.</p>
            ) : (
              <div className="space-y-2">
                {tomorrowOrders.map(o => {
                  const sc = STATUS_CONFIG[o.status] || STATUS_CONFIG.pendente
                  return (
                    <div key={o.id} className="flex items-center gap-2.5 p-2 rounded-xl"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <span className="text-xs font-bold w-10 text-center" style={{ color: 'rgba(255,255,255,0.5)' }}>
                        {o.scheduled_time ? o.scheduled_time.substring(0, 5) : '—'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white truncate">{o.contact_name || 'Sem nome'}</p>
                        <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.3)' }}>
                          {o.diarista_name || 'Sem diarista'}
                        </p>
                      </div>
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: sc.color }} />
                    </div>
                  )
                })}
                <p className="text-xs text-center pt-1" style={{ color: 'rgba(255,255,255,0.25)' }}>
                  {tomorrowOrders.length} pedido{tomorrowOrders.length > 1 ? 's' : ''}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
