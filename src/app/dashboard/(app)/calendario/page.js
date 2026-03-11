'use client'

import { useState, useEffect, useCallback } from 'react'
import { GLASS } from '../../_components/styles'
import { ChevronLeft, ChevronRight, PhoneIcon, MapPinIcon, WhatsAppIcon } from '../../_components/icons'

const DAYS_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MONTHS_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

const ORDER_STATUS_COLORS = {
  pendente: { bg: 'rgba(239,68,68,0.15)', color: '#f87171', dot: '#f87171' },
  agendado: { bg: 'rgba(245,158,11,0.15)', color: '#fbbf24', dot: '#fbbf24' },
  confirmado: { bg: 'rgba(59,130,246,0.15)', color: '#60a5fa', dot: '#60a5fa' },
  diarista_atribuida: { bg: 'rgba(168,85,247,0.15)', color: '#c084fc', dot: '#c084fc' },
  em_andamento: { bg: 'rgba(14,165,233,0.15)', color: '#38bdf8', dot: '#38bdf8' },
  concluido: { bg: 'rgba(16,185,129,0.15)', color: '#34d399', dot: '#34d399' },
  cancelado: { bg: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)', dot: 'rgba(255,255,255,0.3)' },
}

const STATUS_LABELS = {
  pendente: 'Pendente',
  agendado: 'Agendado',
  confirmado: 'Confirmado',
  diarista_atribuida: 'Diarista Atribuída',
  em_andamento: 'Em Andamento',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
}

export default function CalendarioPage() {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth()) // 0-indexed
  const [orders, setOrders] = useState([])
  const [daySummary, setDaySummary] = useState({})
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState(null)

  const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/dashboard/calendario?month=${monthKey}`)
      const data = await res.json()
      setOrders(data.orders || [])
      setDaySummary(data.daySummary || {})
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [monthKey])

  useEffect(() => { fetchData() }, [fetchData])

  function prevMonth() {
    setSelectedDay(null)
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }

  function nextMonth() {
    setSelectedDay(null)
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  function goToday() {
    setSelectedDay(null)
    setYear(today.getFullYear())
    setMonth(today.getMonth())
  }

  // Calendar grid
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const prevDays = new Date(year, month, 0).getDate()

  const cells = []
  // Previous month filler
  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({ day: prevDays - i, current: false })
  }
  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, current: true })
  }
  // Next month filler
  const remaining = 42 - cells.length
  for (let d = 1; d <= remaining; d++) {
    cells.push({ day: d, current: false })
  }

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  function dayKey(d) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  }

  const selectedDayOrders = selectedDay
    ? orders.filter(o => o.scheduled_date && o.scheduled_date.startsWith(selectedDay))
    : []

  // Month totals
  const totalOrders = Object.values(daySummary).reduce((s, d) => s + d.total, 0)
  const totalPendentes = Object.values(daySummary).reduce((s, d) => s + d.pendentes, 0)
  const totalConcluidos = Object.values(daySummary).reduce((s, d) => s + d.concluidos, 0)
  const totalReceita = Object.values(daySummary).reduce((s, d) => s + d.receita, 0)

  function formatPhone(p) {
    if (!p) return ''
    const d = p.replace(/\D/g, '')
    if (d.length === 13) return `+${d.slice(0, 2)} (${d.slice(2, 4)}) ${d.slice(4, 9)}-${d.slice(9)}`
    if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
    return p
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Calendário</h1>
          <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Agendamentos e pedidos por data
          </p>
        </div>
        <button
          onClick={goToday}
          className="px-3 py-2 rounded-xl text-xs font-medium transition-all"
          style={{ ...GLASS, color: 'rgba(255,255,255,0.5)' }}
        >
          Hoje
        </button>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Pedidos no mês', value: totalOrders, color: '#60a5fa' },
          { label: 'Pendentes', value: totalPendentes, color: '#fbbf24' },
          { label: 'Concluídos', value: totalConcluidos, color: '#34d399' },
          { label: 'Receita', value: `R$ ${totalReceita.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`, color: '#34d399' },
        ].map((kpi, i) => (
          <div key={i} className="rounded-xl p-4" style={GLASS}>
            <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>{kpi.label}</p>
            <p className="text-lg font-bold" style={{ color: kpi.color }}>{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-5">
        {/* Calendar */}
        <div className="flex-1">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-4 rounded-xl px-4 py-3" style={GLASS}>
            <button onClick={prevMonth} className="p-1.5 rounded-lg transition-colors" style={{ color: 'rgba(255,255,255,0.5)' }}>
              <ChevronLeft />
            </button>
            <h2 className="text-sm font-bold text-white">
              {MONTHS_PT[month]} {year}
            </h2>
            <button onClick={nextMonth} className="p-1.5 rounded-lg transition-colors" style={{ color: 'rgba(255,255,255,0.5)' }}>
              <ChevronRight />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {DAYS_PT.map(d => (
              <div key={d} className="text-center text-xs font-semibold py-2" style={{ color: 'rgba(255,255,255,0.3)' }}>
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          {loading ? (
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 35 }).map((_, i) => (
                <div key={i} className="aspect-square rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,0.03)' }} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {cells.map((cell, i) => {
                const dk = cell.current ? dayKey(cell.day) : null
                const summary = dk ? daySummary[dk] : null
                const isToday = dk === todayStr
                const isSelected = dk === selectedDay
                const hasPedidos = summary && summary.total > 0

                return (
                  <button
                    key={i}
                    onClick={() => cell.current && setSelectedDay(dk === selectedDay ? null : dk)}
                    disabled={!cell.current}
                    className="aspect-square rounded-xl p-1.5 flex flex-col items-center justify-start transition-all duration-150 relative"
                    style={{
                      background: isSelected
                        ? 'rgba(27,95,168,0.25)'
                        : isToday
                          ? 'rgba(59,130,246,0.08)'
                          : cell.current
                            ? 'rgba(255,255,255,0.02)'
                            : 'transparent',
                      border: isSelected
                        ? '1px solid rgba(59,130,246,0.4)'
                        : isToday
                          ? '1px solid rgba(59,130,246,0.2)'
                          : '1px solid rgba(255,255,255,0.04)',
                      opacity: cell.current ? 1 : 0.2,
                      cursor: cell.current ? 'pointer' : 'default',
                    }}
                  >
                    <span
                      className="text-xs font-semibold"
                      style={{
                        color: isToday ? '#60a5fa' : cell.current ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.2)',
                      }}
                    >
                      {cell.day}
                    </span>

                    {hasPedidos && (
                      <div className="flex items-center gap-0.5 mt-1">
                        {summary.pendentes > 0 && (
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#fbbf24' }} />
                        )}
                        {summary.concluidos > 0 && (
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#34d399' }} />
                        )}
                        {summary.total > 0 && (
                          <span className="text-xs font-bold ml-0.5" style={{ color: 'rgba(255,255,255,0.45)', fontSize: '9px' }}>
                            {summary.total}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )}

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 px-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: '#fbbf24' }} />
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Pendentes</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: '#34d399' }} />
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Concluídos</span>
            </div>
          </div>
        </div>

        {/* Side panel - Day detail */}
        <div className="w-80 flex-shrink-0">
          <div className="rounded-2xl p-4 sticky top-6" style={GLASS}>
            {selectedDay ? (
              <>
                <h3 className="text-sm font-bold text-white mb-1">
                  {new Date(selectedDay + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </h3>
                {daySummary[selectedDay] && (
                  <div className="flex items-center gap-3 mb-4 pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      {daySummary[selectedDay].total} pedido{daySummary[selectedDay].total !== 1 ? 's' : ''}
                    </span>
                    {daySummary[selectedDay].receita > 0 && (
                      <span className="text-xs font-semibold" style={{ color: '#34d399' }}>
                        R$ {daySummary[selectedDay].receita.toLocaleString('pt-BR')}
                      </span>
                    )}
                  </div>
                )}

                {selectedDayOrders.length === 0 ? (
                  <p className="text-xs text-center py-6" style={{ color: 'rgba(255,255,255,0.25)' }}>
                    Nenhum pedido neste dia.
                  </p>
                ) : (
                  <div className="space-y-2.5 max-h-[calc(100vh-320px)] overflow-y-auto pr-1">
                    {selectedDayOrders.map(order => {
                      const sc = ORDER_STATUS_COLORS[order.status] || ORDER_STATUS_COLORS.pendente
                      return (
                        <div
                          key={order.id}
                          className="rounded-xl p-3 transition-all"
                          style={{
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.06)',
                            borderLeft: `3px solid ${sc.dot}`,
                          }}
                        >
                          {/* Time + Status */}
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold" style={{ color: sc.color }}>
                              {order.scheduled_time || 'Sem horário'}
                            </span>
                            <span
                              className="text-xs px-2 py-0.5 rounded-full"
                              style={{ background: sc.bg, color: sc.color, fontSize: '10px' }}
                            >
                              {STATUS_LABELS[order.status] || order.status}
                            </span>
                          </div>

                          {/* Client name */}
                          <p className="text-sm font-semibold text-white truncate">
                            {order.contact_name || 'Sem nome'}
                          </p>

                          {/* Service */}
                          <p className="text-xs mt-0.5 truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>
                            {order.service_type || 'Limpeza'}
                          </p>

                          {/* Diarista */}
                          {order.diarista_name && (
                            <div className="flex items-center gap-1.5 mt-2">
                              <div
                                className="w-4 h-4 rounded-full flex items-center justify-center"
                                style={{ background: 'rgba(168,85,247,0.2)', fontSize: '8px', color: '#c084fc' }}
                              >
                                {order.diarista_name[0]}
                              </div>
                              <span className="text-xs" style={{ color: '#c084fc' }}>{order.diarista_name}</span>
                            </div>
                          )}

                          {/* Address */}
                          {order.address && (
                            <div className="flex items-start gap-1.5 mt-1.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
                              <MapPinIcon />
                              <span className="text-xs truncate">{order.address}</span>
                            </div>
                          )}

                          {/* Value + WhatsApp */}
                          <div className="flex items-center justify-between mt-2 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                            {order.value ? (
                              <span className="text-xs font-bold" style={{ color: '#34d399' }}>
                                R$ {parseFloat(order.value).toLocaleString('pt-BR')}
                              </span>
                            ) : (
                              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>Sem valor</span>
                            )}
                            {order.contact_phone && (
                              <a
                                href={`https://wa.me/${order.contact_phone.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-colors"
                                style={{ background: 'rgba(37,211,102,0.1)', color: '#25d366' }}
                                onClick={e => e.stopPropagation()}
                              >
                                <WhatsAppIcon size={11} />
                                <span style={{ fontSize: '10px' }}>WhatsApp</span>
                              </a>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(59,130,246,0.08)' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(96,165,250,0.5)" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </div>
                <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  Selecione um dia para ver os pedidos
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
