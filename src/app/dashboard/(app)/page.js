'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { GLASS } from '../_components/styles'
import { WhatsAppIcon, MapPinIcon, PhoneIcon, CalendarIcon, RefreshIcon } from '../_components/icons'

const STATUS_CONFIG = {
  pendente: { label: 'Pendente', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
  agendado: { label: 'Agendado', color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' },
  confirmado: { label: 'Confirmado', color: '#818cf8', bg: 'rgba(129,140,248,0.15)' },
  diarista_atribuida: { label: 'Diarista OK', color: '#a78bfa', bg: 'rgba(167,139,250,0.15)' },
  em_andamento: { label: 'Em Andamento', color: '#22d3ee', bg: 'rgba(34,211,238,0.15)' },
  concluido: { label: 'Concluído', color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
  cancelado: { label: 'Cancelado', color: '#6b7280', bg: 'rgba(107,114,128,0.15)' },
}

export default function HojePage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState(null)
  const [selectingDiarista, setSelectingDiarista] = useState(null)
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
      await loadData(true)
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
    if (!d) return '—'
    const str = typeof d === 'string' ? d.split('T')[0] : new Date(d).toISOString().split('T')[0]
    return new Date(str + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
  }

  function formatTime(t) {
    if (!t) return '—'
    return String(t).substring(0, 5)
  }

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-10 h-10 border-3 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    )
  }

  const { orders, tomorrowOrders, diaristas, summary } = data
  const now = new Date()
  const horaAtual = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Hoje</h1>
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {formatDate(data.today)} · {horaAtual}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm px-3 py-2 rounded-xl" style={{ background: 'rgba(16,185,129,0.1)', color: '#34d399' }}>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Ao vivo
          </div>
          <button onClick={() => loadData()} className="p-2.5 rounded-xl transition-all" style={{ ...GLASS, color: 'rgba(255,255,255,0.5)' }}>
            <RefreshIcon />
          </button>
        </div>
      </div>

      {/* KPI Cards - fontes maiores */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
        {[
          { label: 'Pedidos Hoje', value: parseInt(summary.total) || 0, color: '#60a5fa' },
          { label: 'Pendentes', value: parseInt(summary.pendentes) || 0, color: '#fbbf24' },
          { label: 'Em Andamento', value: parseInt(summary.em_andamento) || 0, color: '#22d3ee' },
          { label: 'Concluídos', value: parseInt(summary.concluidos) || 0, color: '#34d399' },
          { label: 'Receita Esperada', value: `R$ ${parseFloat(summary.receita_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`, color: '#34d399' },
        ].map((kpi, i) => (
          <div key={i} className="rounded-2xl p-4" style={GLASS}>
            <p className="text-sm mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>{kpi.label}</p>
            <p className="text-2xl font-bold" style={{ color: kpi.color }}>{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main: Today's timeline */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-base font-bold text-white">Agenda do Dia</h2>

          {orders.length === 0 ? (
            <div className="rounded-2xl p-12 text-center" style={GLASS}>
              <p className="text-base" style={{ color: 'rgba(255,255,255,0.4)' }}>Nenhum pedido agendado para hoje.</p>
            </div>
          ) : (
            orders.map(order => {
              const sc = STATUS_CONFIG[order.status] || STATUS_CONFIG.pendente
              const isUpdating = updatingId === order.id
              const isPast = order.scheduled_time && order.scheduled_time < horaAtual && order.status !== 'concluido' && order.status !== 'cancelado'
              const isConcluido = order.status === 'concluido'
              const isCancelado = order.status === 'cancelado'

              return (
                <div
                  key={order.id}
                  className="rounded-2xl transition-all"
                  style={{
                    ...GLASS,
                    borderLeft: `5px solid ${sc.color}`,
                    opacity: isUpdating ? 0.5 : isConcluido ? 0.7 : 1,
                    background: isPast ? 'rgba(245,158,11,0.05)' : isConcluido ? 'rgba(16,185,129,0.03)' : GLASS.background,
                  }}
                >
                  {/* Card principal */}
                  <div className="p-5 pb-3">
                    <div className="flex items-start gap-4">
                      {/* Horário */}
                      <div className="flex-shrink-0 text-center w-16 pt-1">
                        <p className="text-2xl font-bold" style={{ color: order.scheduled_time ? '#fff' : 'rgba(255,255,255,0.2)' }}>
                          {formatTime(order.scheduled_time)}
                        </p>
                        <p className="text-xs mt-1 font-medium" style={{ color: 'rgba(255,255,255,0.3)' }}>
                          {order.service_type?.match(/(\d+)h/)?.[0] || ''}
                        </p>
                      </div>

                      {/* Conteúdo */}
                      <div className="flex-1 min-w-0">
                        {/* Nome + status */}
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <p className="text-base font-bold text-white">
                            {order.contact_name || 'Sem nome'}
                          </p>
                          <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
                            style={{ background: sc.bg, color: sc.color }}>
                            {sc.label}
                          </span>
                        </div>

                        {/* Serviço + valor */}
                        <p className="text-sm mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
                          {order.service_type || 'Serviço'}
                          {order.value && <span className="font-bold ml-2 text-base" style={{ color: '#34d399' }}>R$ {parseFloat(order.value).toLocaleString('pt-BR')}</span>}
                        </p>

                        {/* Endereço */}
                        {(order.address || order.contact_address) && (
                          <div className="flex items-start gap-2 mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
                            <MapPinIcon />
                            <span className="text-sm">{order.address || order.contact_address}</span>
                          </div>
                        )}

                        {/* Diarista */}
                        <div className="mb-1">
                          {selectingDiarista === order.id ? (
                            <div className="flex items-center gap-2 flex-wrap">
                              <select
                                autoFocus
                                value={order.diarista_id || ''}
                                onChange={(e) => {
                                  const did = e.target.value
                                  if (did) {
                                    const newStatus = ['pendente', 'agendado', 'confirmado'].includes(order.status) ? 'diarista_atribuida' : order.status
                                    updateOrder(order.id, { diarista_id: did, status: newStatus })
                                  } else {
                                    updateOrder(order.id, { diarista_id: null })
                                  }
                                  setSelectingDiarista(null)
                                }}
                                onBlur={() => setSelectingDiarista(null)}
                                className="px-3 py-2 rounded-xl text-sm text-white outline-none"
                                style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(167,139,250,0.3)' }}>
                                <option value="" style={{ background: '#1a1a2e' }}>Nenhuma</option>
                                {diaristas.map(d => (
                                  <option key={d.id} value={d.id} style={{ background: '#1a1a2e' }}>
                                    {d.name} {parseInt(d.orders_today) > 0 ? `(${d.orders_today} pedido${parseInt(d.orders_today) > 1 ? 's' : ''} hoje)` : '(livre)'}
                                  </option>
                                ))}
                              </select>
                              <button onClick={() => setSelectingDiarista(null)}
                                className="text-xs px-2 py-1 rounded-lg" style={{ color: 'rgba(255,255,255,0.3)' }}>
                                Cancelar
                              </button>
                            </div>
                          ) : order.diarista_name ? (
                            <button onClick={() => setSelectingDiarista(order.id)}
                              className="flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all"
                              style={{ background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)' }}>
                              <div className="w-6 h-6 rounded-full flex items-center justify-center"
                                style={{ background: 'linear-gradient(135deg, #7c3aed, #a78bfa)', fontSize: '10px', color: '#fff', fontWeight: 700 }}>
                                {order.diarista_name[0]}
                              </div>
                              <span className="text-sm font-medium" style={{ color: '#c4b5fd' }}>{order.diarista_name}</span>
                              {order.diarista_phone && (
                                <a href={`https://wa.me/${order.diarista_phone.replace(/\D/g, '')}`}
                                  target="_blank" rel="noopener noreferrer"
                                  className="ml-1 px-2 py-0.5 rounded-md text-xs"
                                  style={{ background: 'rgba(37,211,102,0.15)', color: '#25d366' }}
                                  onClick={e => e.stopPropagation()}>
                                  WhatsApp
                                </a>
                              )}
                            </button>
                          ) : (
                            <button onClick={() => setSelectingDiarista(order.id)}
                              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all"
                              style={{ background: 'rgba(245,158,11,0.08)', border: '1px dashed rgba(245,158,11,0.3)', color: '#fbbf24' }}>
                              + Atribuir Diarista
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Barra de ações - separada, mais visível */}
                  {!isCancelado && (
                    <div className="px-5 py-3 flex items-center flex-wrap gap-2"
                      style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.15)', borderRadius: '0 0 16px 16px' }}>

                      {/* Pagamento - botões grandes e claros */}
                      <div className="flex items-center rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                        {[
                          { id: 'pendente', label: 'Pendente', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
                          { id: 'parcial', label: 'Parcial', color: '#f97316', bg: 'rgba(249,115,22,0.15)' },
                          { id: 'pago', label: 'Pago', color: '#10b981', bg: 'rgba(16,185,129,0.2)' },
                        ].map(ps => {
                          const active = (order.payment_status || 'pendente') === ps.id
                          return (
                            <button key={ps.id}
                              onClick={() => updateOrder(order.id, { payment_status: ps.id })}
                              className="px-3 py-2 text-xs font-semibold transition-all"
                              style={{
                                background: active ? ps.bg : 'transparent',
                                color: active ? ps.color : 'rgba(255,255,255,0.25)',
                                minWidth: '70px',
                              }}>
                              {active && ps.id === 'pago' ? 'Pago ✓' : ps.label}
                            </button>
                          )
                        })}
                      </div>

                      {/* Status do pedido */}
                      {!isConcluido && order.status !== 'em_andamento' && (
                        <button onClick={() => updateOrder(order.id, { status: 'em_andamento' })}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                          style={{ background: 'rgba(34,211,238,0.15)', color: '#22d3ee', border: '1px solid rgba(34,211,238,0.25)' }}>
                          Iniciar Serviço
                        </button>
                      )}

                      {order.status === 'em_andamento' && (
                        <button onClick={() => updateOrder(order.id, { status: 'concluido' })}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all"
                          style={{ background: 'rgba(16,185,129,0.2)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}>
                          Concluir Serviço
                        </button>
                      )}

                      {isConcluido && (
                        <span className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold"
                          style={{ background: 'rgba(16,185,129,0.12)', color: '#34d399' }}>
                          Concluído ✓
                        </span>
                      )}

                      <div className="flex-1" />

                      {/* WhatsApp */}
                      {order.contact_phone && (
                        <a href={`https://wa.me/${order.contact_phone.replace(/\D/g, '')}`}
                          target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
                          style={{ background: 'rgba(37,211,102,0.1)', color: '#25d366', border: '1px solid rgba(37,211,102,0.2)' }}>
                          <WhatsAppIcon size={14} />
                          WhatsApp
                        </a>
                      )}

                      {/* Cancelar - discreto */}
                      {!isConcluido && (
                        <button onClick={() => {
                          if (confirm('Tem certeza que deseja cancelar este pedido?')) {
                            updateOrder(order.id, { status: 'cancelado' })
                          }
                        }}
                          className="px-3 py-2 rounded-xl text-xs transition-all"
                          style={{ color: 'rgba(255,255,255,0.2)' }}>
                          Cancelar
                        </button>
                      )}
                    </div>
                  )}

                  {/* Pedido cancelado */}
                  {isCancelado && (
                    <div className="px-5 py-3 text-center" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(107,114,128,0.05)', borderRadius: '0 0 16px 16px' }}>
                      <span className="text-sm font-medium" style={{ color: '#6b7280' }}>Pedido cancelado</span>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Sidebar: Diaristas + Tomorrow */}
        <div className="space-y-5">
          {/* Diaristas do dia */}
          <div className="rounded-2xl p-5" style={GLASS}>
            <h3 className="text-base font-bold text-white mb-4">Diaristas</h3>
            {diaristas.length === 0 ? (
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>Nenhuma diarista ativa.</p>
            ) : (
              <div className="space-y-3">
                {diaristas.map(d => {
                  const busy = parseInt(d.orders_today) > 0
                  return (
                    <div key={d.id} className="flex items-center gap-3 p-3 rounded-xl"
                      style={{ background: busy ? 'rgba(167,139,250,0.08)' : 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                        style={{ background: busy ? 'linear-gradient(135deg, #7c3aed, #a78bfa)' : 'rgba(255,255,255,0.08)', color: busy ? '#fff' : 'rgba(255,255,255,0.3)' }}>
                        {d.name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{d.name}</p>
                        {busy ? (
                          <p className="text-xs" style={{ color: '#c4b5fd' }}>
                            {d.orders_today} pedido{parseInt(d.orders_today) > 1 ? 's' : ''} · {d.times_today}
                          </p>
                        ) : (
                          <p className="text-sm font-medium" style={{ color: '#34d399' }}>Disponível</p>
                        )}
                      </div>
                      {d.phone && (
                        <a href={`https://wa.me/${d.phone.replace(/\D/g, '')}`}
                          target="_blank" rel="noopener noreferrer"
                          className="p-2 rounded-xl flex-shrink-0 transition-colors"
                          style={{ background: 'rgba(37,211,102,0.1)', color: '#25d366' }}>
                          <WhatsAppIcon size={14} />
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
            <h3 className="text-base font-bold text-white mb-1">Amanhã</h3>
            <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.3)' }}>
              {formatDate(data.tomorrow)}
            </p>

            {tomorrowOrders.length === 0 ? (
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>Nenhum pedido agendado.</p>
            ) : (
              <div className="space-y-2.5">
                {tomorrowOrders.map(o => {
                  const sc = STATUS_CONFIG[o.status] || STATUS_CONFIG.pendente
                  return (
                    <div key={o.id} className="flex items-center gap-3 p-3 rounded-xl"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <span className="text-sm font-bold w-12 text-center" style={{ color: 'rgba(255,255,255,0.5)' }}>
                        {formatTime(o.scheduled_time)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{o.contact_name || 'Sem nome'}</p>
                        <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.35)' }}>
                          {o.diarista_name || 'Sem diarista'}
                        </p>
                      </div>
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: sc.color }} />
                    </div>
                  )
                })}
                <p className="text-sm text-center pt-2" style={{ color: 'rgba(255,255,255,0.3)' }}>
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
