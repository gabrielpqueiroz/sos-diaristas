'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { GLASS } from '../../_components/styles'
import { WhatsAppIcon, MapPinIcon, CalendarIcon, RefreshIcon } from '../../_components/icons'

const HOURS_PRICING = [
  { hours: 2, price: 125 },
  { hours: 3, price: 135 },
  { hours: 4, price: 145 },
  { hours: 5, price: 155 },
  { hours: 6, price: 180 },
  { hours: 7, price: 210 },
  { hours: 8, price: 220 },
  { hours: 9, price: 230 },
  { hours: 10, price: 240 },
]

const ORDER_COLUMNS = [
  { id: 'pendente', label: 'Pendente', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
  { id: 'agendado', label: 'Agendado', color: '#3b82f6', bg: 'rgba(59,130,246,0.08)' },
  { id: 'confirmado', label: 'Confirmado', color: '#818cf8', bg: 'rgba(129,140,248,0.08)' },
  { id: 'diarista_atribuida', label: 'Diarista Atribuída', color: '#a78bfa', bg: 'rgba(167,139,250,0.08)' },
  { id: 'em_andamento', label: 'Em Andamento', color: '#22d3ee', bg: 'rgba(34,211,238,0.08)' },
  { id: 'concluido', label: 'Concluído', color: '#10b981', bg: 'rgba(16,185,129,0.08)' },
]

export default function PedidosPage() {
  const [orders, setOrders] = useState([])
  const [statusCounts, setStatusCounts] = useState({})
  const [diaristas, setDiaristas] = useState([])
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showNewOrder, setShowNewOrder] = useState(false)
  const [newOrder, setNewOrder] = useState({ contact_id: '', service_type: '', scheduled_date: '', scheduled_time: '', address: '', value: '', notes: '' })
  const [contactSearch, setContactSearch] = useState('')
  const [showContactDropdown, setShowContactDropdown] = useState(false)
  const [saving, setSaving] = useState(false)
  const [draggedOrderId, setDraggedOrderId] = useState(null)
  const [dragOverCol, setDragOverCol] = useState(null)
  const refreshTimerRef = useRef(null)

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const [ordersRes, diaristasRes] = await Promise.all([
        fetch('/api/dashboard/pedidos?limit=200'),
        fetch('/api/dashboard/diaristas'),
      ])
      const ordersData = await ordersRes.json()
      const diaristasData = await diaristasRes.json()
      setOrders(ordersData.orders || [])
      setStatusCounts(ordersData.statusCounts || {})
      setDiaristas(diaristasData.diaristas || [])
    } catch (e) {
      console.error(e)
    }
    if (!silent) setLoading(false)
  }, [])

  useEffect(() => {
    loadData()
    // Auto-refresh every 30s
    refreshTimerRef.current = setInterval(() => loadData(true), 30000)
    return () => clearInterval(refreshTimerRef.current)
  }, [loadData])

  async function searchContacts(q) {
    setContactSearch(q)
    if (q.length < 2) { setContacts([]); setShowContactDropdown(false); return }
    try {
      const res = await fetch(`/api/dashboard/contatos?search=${encodeURIComponent(q)}&limit=8`)
      const data = await res.json()
      setContacts(data.contacts || [])
      setShowContactDropdown(true)
    } catch (e) { console.error(e) }
  }

  async function updateOrder(orderId, updates) {
    try {
      await fetch(`/api/dashboard/pedidos/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      loadData(true)
    } catch (e) { console.error(e) }
  }

  async function createOrder() {
    setSaving(true)
    try {
      const contact = contacts.find(c => c.id === newOrder.contact_id)
      await fetch('/api/dashboard/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newOrder,
          session_id: contact?.session_id || null,
          value: newOrder.value ? parseFloat(newOrder.value) : null,
        }),
      })
      setShowNewOrder(false)
      setNewOrder({ contact_id: '', service_type: '', scheduled_date: '', scheduled_time: '', address: '', value: '', notes: '' })
      setContactSearch('')
      loadData()
    } catch (e) { console.error(e) }
    setSaving(false)
  }

  function formatPhone(phone) {
    if (!phone || !phone.startsWith('55') || phone.length < 12) return phone
    const ddd = phone.substring(2, 4)
    const num = phone.substring(4)
    if (num.length === 9) return `(${ddd}) ${num.substring(0, 5)}-${num.substring(5)}`
    return phone
  }

  // Drag handlers
  function handleDragStart(e, orderId) {
    setDraggedOrderId(orderId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', orderId)
    // Make the ghost semi-transparent
    if (e.currentTarget) {
      e.currentTarget.style.opacity = '0.4'
    }
  }

  function handleDragEnd(e) {
    setDraggedOrderId(null)
    setDragOverCol(null)
    if (e.currentTarget) {
      e.currentTarget.style.opacity = '1'
    }
  }

  function handleDragOver(e, colId) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverCol(colId)
  }

  function handleDragLeave() {
    setDragOverCol(null)
  }

  function handleDrop(e, colId) {
    e.preventDefault()
    setDragOverCol(null)
    if (draggedOrderId) {
      const order = orders.find(o => String(o.id) === String(draggedOrderId))
      if (order && order.status !== colId) {
        // Optimistic update
        setOrders(prev => prev.map(o => String(o.id) === String(draggedOrderId) ? { ...o, status: colId } : o))
        updateOrder(draggedOrderId, { status: colId })
      }
    }
    setDraggedOrderId(null)
  }

  // When selecting hours in the modal, auto-fill price
  function handleServiceChange(hours) {
    const h = parseInt(hours)
    const pricing = HOURS_PRICING.find(p => p.hours === h)
    setNewOrder(prev => ({
      ...prev,
      service_type: h ? `Limpeza ${h}h` : '',
      value: pricing ? String(pricing.price) : '',
    }))
  }

  return (
    <>
      {/* Top bar */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-8 py-4"
        style={{ background: 'rgba(7,9,15,0.8)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div>
          <h1 className="text-white font-bold text-lg">Pedidos</h1>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
            {orders.length} pedido{orders.length !== 1 ? 's' : ''} · Arraste entre colunas para mover
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg" style={{ background: 'rgba(16,185,129,0.08)', color: '#34d399' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Auto-refresh 30s
          </div>
          <button onClick={openNewOrder}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all"
            style={{ background: 'linear-gradient(135deg, #1B5FA8 0%, #2b7fd4 100%)', boxShadow: '0 4px 16px rgba(27,95,168,0.3)', color: '#fff' }}>
            + Novo Pedido
          </button>
          <button onClick={() => loadData()} className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs" style={{ ...GLASS, color: 'rgba(255,255,255,0.6)' }}>
            <RefreshIcon />
          </button>
        </div>
      </div>

      <div className="px-8 py-6">
        {/* New Order Modal */}
        {showNewOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            onClick={() => setShowNewOrder(false)}>
            <div className="w-full max-w-md rounded-2xl p-6 mx-4" style={{ ...GLASS, background: 'rgba(15,17,25,0.95)', border: '1px solid rgba(255,255,255,0.1)' }}
              onClick={e => e.stopPropagation()}>
              <h2 className="text-white font-bold text-base mb-5">Novo Pedido</h2>

              {/* Contact search */}
              <div className="mb-3 relative">
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Cliente *</label>
                <input type="text" placeholder="Buscar contato..." value={contactSearch}
                  onChange={(e) => searchContacts(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-xs text-white outline-none"
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }} />
                {showContactDropdown && contacts.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 rounded-xl overflow-hidden z-50 max-h-48 overflow-y-auto"
                    style={{ background: 'rgba(20,22,35,0.98)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    {contacts.map(c => (
                      <button key={c.id} className="w-full text-left px-3 py-2 text-xs hover:bg-white/5 transition-colors flex items-center gap-2"
                        onClick={() => {
                          setNewOrder(prev => ({ ...prev, contact_id: c.id, address: c.address || '' }))
                          setContactSearch(c.name || formatPhone(c.phone))
                          setShowContactDropdown(false)
                        }}>
                        <span className="text-white font-medium">{c.name || '—'}</span>
                        <span style={{ color: 'rgba(255,255,255,0.3)' }}>{formatPhone(c.phone)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Hours selector with price table */}
              <div className="mb-3">
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Horas de Serviço *</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {HOURS_PRICING.map(hp => {
                    const selected = newOrder.service_type === `Limpeza ${hp.hours}h`
                    return (
                      <button
                        key={hp.hours}
                        type="button"
                        onClick={() => handleServiceChange(hp.hours)}
                        className="px-2 py-2 rounded-lg text-xs font-medium transition-all text-center"
                        style={{
                          background: selected ? 'rgba(27,95,168,0.25)' : 'rgba(255,255,255,0.05)',
                          border: selected ? '1px solid rgba(59,130,246,0.5)' : '1px solid rgba(255,255,255,0.08)',
                          color: selected ? '#60a5fa' : 'rgba(255,255,255,0.5)',
                        }}
                      >
                        <span className="block font-bold" style={{ color: selected ? '#fff' : 'rgba(255,255,255,0.7)' }}>{hp.hours}h</span>
                        <span className="block mt-0.5" style={{ fontSize: '10px' }}>R$ {hp.price}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Value (auto-filled but editable) */}
              <div className="mb-3">
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  Valor (R$)
                  <span className="font-normal normal-case tracking-normal ml-1" style={{ color: 'rgba(255,255,255,0.25)' }}>· preenchido automaticamente</span>
                </label>
                <input type="number" step="0.01" value={newOrder.value}
                  onChange={(e) => setNewOrder(prev => ({ ...prev, value: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg text-xs text-white outline-none"
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }} />
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Data</label>
                  <input type="date" value={newOrder.scheduled_date}
                    onChange={(e) => setNewOrder(prev => ({ ...prev, scheduled_date: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg text-xs text-white outline-none"
                    style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }} />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Horário</label>
                  <input type="time" value={newOrder.scheduled_time}
                    onChange={(e) => setNewOrder(prev => ({ ...prev, scheduled_time: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg text-xs text-white outline-none"
                    style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }} />
                </div>
              </div>

              <div className="mb-3">
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Endereço</label>
                <input type="text" placeholder="Rua, número, bairro" value={newOrder.address}
                  onChange={(e) => setNewOrder(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg text-xs text-white outline-none"
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }} />
              </div>

              {/* Diarista selector in modal */}
              <div className="mb-3">
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Diarista</label>
                <select value={newOrder.diarista_id || ''}
                  onChange={(e) => setNewOrder(prev => ({ ...prev, diarista_id: e.target.value || null }))}
                  className="w-full px-3 py-2 rounded-lg text-xs text-white outline-none"
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <option value="" style={{ background: '#1a1a2e' }}>Selecionar depois...</option>
                  {diaristas.filter(d => d.status === 'ativa').map(d => (
                    <option key={d.id} value={d.id} style={{ background: '#1a1a2e' }}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div className="mb-5">
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Obs</label>
                <textarea value={newOrder.notes} onChange={(e) => setNewOrder(prev => ({ ...prev, notes: e.target.value }))}
                  rows={2} className="w-full px-3 py-2 rounded-lg text-xs text-white outline-none resize-none"
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }} />
              </div>

              <div className="flex gap-2">
                <button onClick={() => setShowNewOrder(false)} className="flex-1 py-2.5 rounded-xl text-xs font-medium"
                  style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}>
                  Cancelar
                </button>
                <button onClick={createOrder} disabled={saving || !newOrder.contact_id || !newOrder.service_type}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white disabled:opacity-40"
                  style={{ background: 'linear-gradient(135deg, #1B5FA8, #2b7fd4)' }}>
                  {saving ? 'Criando...' : 'Criar Pedido'}
                </button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : (
          /* Kanban Board */
          <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: 'calc(100vh - 180px)' }}>
            {ORDER_COLUMNS.map(col => {
              const colOrders = orders.filter(o => o.status === col.id)
              const count = statusCounts[col.id] || colOrders.length
              const isOver = dragOverCol === col.id

              return (
                <div
                  key={col.id}
                  className="flex-shrink-0 w-72 transition-all duration-200"
                  onDragOver={(e) => handleDragOver(e, col.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, col.id)}
                >
                  {/* Column header */}
                  <div className="flex items-center gap-2 mb-3 px-1">
                    <span className="w-2 h-2 rounded-full" style={{ background: col.color }} />
                    <span className="text-xs font-bold text-white">{col.label}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                      style={{ background: col.bg, color: col.color }}>
                      {count}
                    </span>
                  </div>

                  {/* Drop zone */}
                  <div
                    className="space-y-2 min-h-[120px] rounded-xl p-1.5 transition-all duration-200"
                    style={{
                      background: isOver ? `${col.color}10` : 'transparent',
                      border: isOver ? `2px dashed ${col.color}50` : '2px dashed transparent',
                    }}
                  >
                    {colOrders.map(order => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        columns={ORDER_COLUMNS}
                        diaristas={diaristas}
                        onUpdate={(updates) => updateOrder(order.id, updates)}
                        formatPhone={formatPhone}
                        onDragStart={(e) => handleDragStart(e, order.id)}
                        onDragEnd={handleDragEnd}
                      />
                    ))}

                    {colOrders.length === 0 && (
                      <div className="rounded-xl p-6 text-center" style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)' }}>
                        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>
                          {isOver ? 'Solte aqui' : 'Nenhum pedido'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )

  function openNewOrder() {
    setNewOrder({ contact_id: '', service_type: '', scheduled_date: '', scheduled_time: '', address: '', value: '', notes: '', diarista_id: null })
    setContactSearch('')
    setShowContactDropdown(false)
    setShowNewOrder(true)
  }
}

function OrderCard({ order, columns, diaristas, onUpdate, formatPhone, onDragStart, onDragEnd }) {
  const [expanded, setExpanded] = useState(false)
  const [showDiaristaSelect, setShowDiaristaSelect] = useState(false)
  const col = columns.find(c => c.id === order.status) || columns[0]

  // Parse hours from service_type like "Limpeza 5h"
  const hoursMatch = order.service_type?.match(/(\d+)h/)
  const hours = hoursMatch ? parseInt(hoursMatch[1]) : null

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className="rounded-xl p-4 cursor-grab active:cursor-grabbing transition-all duration-200 group"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderLeft: `3px solid ${col.color}`,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
    >
      {/* Top: Service + Hours badge */}
      <div className="flex items-start justify-between mb-1">
        <p className="text-xs font-bold text-white">{order.service_type || 'Serviço'}</p>
        {hours && (
          <span className="text-xs px-1.5 py-0.5 rounded-md flex-shrink-0 ml-2"
            style={{ background: 'rgba(59,130,246,0.12)', color: '#60a5fa', fontSize: '10px', fontWeight: 700 }}>
            {hours}h
          </span>
        )}
      </div>

      {/* Contact name */}
      <p className="text-xs mb-2" style={{ color: 'rgba(255,255,255,0.55)' }}>
        {order.contact_name || formatPhone(order.contact_phone) || '—'}
      </p>

      {/* Date + time */}
      {order.scheduled_date && (
        <div className="flex items-center gap-1.5 mb-2 text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
          <CalendarIcon />
          {new Date(order.scheduled_date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
          {order.scheduled_time && ` às ${order.scheduled_time.substring(0, 5)}`}
        </div>
      )}

      {/* Address */}
      {order.address && (
        <div className="flex items-start gap-1.5 mb-2 text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
          <MapPinIcon />
          <span className="line-clamp-1">{order.address}</span>
        </div>
      )}

      {/* Value + Diarista row */}
      <div className="flex items-center justify-between mb-1">
        {order.value ? (
          <span className="text-xs font-bold text-emerald-400">R$ {parseFloat(order.value).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</span>
        ) : (
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>Sem valor</span>
        )}

        {/* WhatsApp mini button */}
        {order.contact_phone && (
          <a href={`https://wa.me/${order.contact_phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md"
            style={{ background: 'rgba(37,211,102,0.1)', color: '#25d366' }}
            onClick={e => e.stopPropagation()}>
            <WhatsAppIcon size={11} />
          </a>
        )}
      </div>

      {/* Diarista assignment - always visible */}
      <div className="mt-2 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        {showDiaristaSelect ? (
          <div onClick={e => e.stopPropagation()}>
            <select
              autoFocus
              value={order.diarista_id || ''}
              onChange={(e) => {
                const did = e.target.value
                if (did) {
                  onUpdate({ diarista_id: did, status: order.status === 'pendente' || order.status === 'agendado' || order.status === 'confirmado' ? 'diarista_atribuida' : order.status })
                } else {
                  onUpdate({ diarista_id: null })
                }
                setShowDiaristaSelect(false)
              }}
              onBlur={() => setShowDiaristaSelect(false)}
              className="w-full px-2 py-1.5 rounded-lg text-xs text-white outline-none"
              style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}>
              <option value="" style={{ background: '#1a1a2e' }}>Sem diarista</option>
              {diaristas.filter(d => d.status === 'ativa').map(d => (
                <option key={d.id} value={d.id} style={{ background: '#1a1a2e' }}>{d.name}</option>
              ))}
            </select>
          </div>
        ) : (
          <button
            onClick={(e) => { e.stopPropagation(); setShowDiaristaSelect(true) }}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-all"
            style={{
              background: order.diarista_name ? 'rgba(167,139,250,0.1)' : 'rgba(255,255,255,0.04)',
              border: order.diarista_name ? '1px solid rgba(167,139,250,0.2)' : '1px dashed rgba(255,255,255,0.1)',
              color: order.diarista_name ? '#c4b5fd' : 'rgba(255,255,255,0.3)',
            }}
          >
            <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                background: order.diarista_name ? 'rgba(167,139,250,0.25)' : 'rgba(255,255,255,0.08)',
                fontSize: '8px',
                fontWeight: 700,
                color: order.diarista_name ? '#e9d5ff' : 'rgba(255,255,255,0.3)',
              }}>
              {order.diarista_name ? order.diarista_name[0].toUpperCase() : '?'}
            </div>
            <span className="truncate">{order.diarista_name || 'Atribuir diarista'}</span>
          </button>
        )}
      </div>

      {/* Expand toggle */}
      <button
        onClick={(e) => { e.stopPropagation(); setExpanded(!expanded) }}
        className="w-full text-center mt-2 py-1 rounded-md text-xs transition-all"
        style={{ color: 'rgba(255,255,255,0.2)', fontSize: '10px' }}
      >
        {expanded ? '▲ menos' : '▼ mais'}
      </button>

      {/* Expanded: move to status buttons */}
      {expanded && (
        <div className="mt-2 pt-2 space-y-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
          onClick={(e) => e.stopPropagation()}>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Mover para:</p>
          <div className="flex flex-wrap gap-1">
            {columns.filter(c => c.id !== order.status).map(c => (
              <button key={c.id} onClick={() => onUpdate({ status: c.id })}
                className="px-2 py-1 rounded-lg text-xs font-medium transition-colors"
                style={{ background: c.bg, color: c.color, border: `1px solid ${c.color}30` }}>
                {c.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
