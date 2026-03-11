'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { GLASS, STATUS_COLORS, STATUS_LABELS } from '../../../_components/styles'
import { ArrowLeftIcon, WhatsAppIcon, PhoneIcon, MapPinIcon, MessageIcon, CalendarIcon } from '../../../_components/icons'

const ALL_STATUSES = ['novo', 'qualificado', 'agendado', 'cliente', 'inativo', 'perdido']

export default function ContactDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const chatRef = useRef(null)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [saving, setSaving] = useState(false)

  async function loadContact() {
    setLoading(true)
    try {
      const res = await fetch(`/api/dashboard/contatos/${id}`)
      const json = await res.json()
      setData(json)
      setEditForm({
        name: json.contact.name || '',
        address: json.contact.address || '',
        neighborhood: json.contact.neighborhood || '',
        status: json.contact.status || 'novo',
        notes: json.contact.notes || '',
      })
    } catch (e) {
      console.error('Error loading contact:', e)
    }
    setLoading(false)
  }

  useEffect(() => { loadContact() }, [id])

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight
    }
  }, [data])

  async function handleSave() {
    setSaving(true)
    try {
      await fetch(`/api/dashboard/contatos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })
      await loadContact()
      setEditing(false)
    } catch (e) {
      console.error('Error saving:', e)
    }
    setSaving(false)
  }

  function formatPhone(phone) {
    if (!phone || phone.length < 10) return phone
    if (phone.startsWith('55') && phone.length >= 12) {
      const ddd = phone.substring(2, 4)
      const num = phone.substring(4)
      if (num.length === 9) return `(${ddd}) ${num.substring(0, 5)}-${num.substring(5)}`
    }
    return phone
  }

  function cleanMessageContent(content, type) {
    if (type === 'ai') return content
    // Extract just the lead's actual message from the structured content
    const match = content.match(/# Mensagem do [Ll]ead:\s*\n?([\s\S]*?)(?:\n#|$)/)
    if (match) return match[1].trim()
    const match2 = content.match(/# Mensagem do lead:\s*([\s\S]*?)(?:\n#|$)/)
    if (match2) return match2[1].trim()
    return content
  }

  function extractTimestamp(content) {
    const match = content.match(/(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})/)
    if (match) {
      const d = new Date(match[1])
      return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
    }
    return null
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (!data?.contact) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4" style={{ color: 'rgba(255,255,255,0.4)' }}>
        <p>Contato não encontrado</p>
        <Link href="/dashboard/contatos" className="text-blue-400 text-sm hover:underline">Voltar</Link>
      </div>
    )
  }

  const { contact, messages, orders } = data
  const statusColor = STATUS_COLORS[contact.status] || STATUS_COLORS.novo

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
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/dashboard/contatos')}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}
          >
            <ArrowLeftIcon />
          </button>
          <div>
            <h1 className="text-white font-bold text-lg">{contact.name || formatPhone(contact.phone)}</h1>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
              {formatPhone(contact.phone)} · {messages.length} mensagens
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`https://wa.me/${contact.phone}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors"
            style={{ background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399' }}
          >
            <WhatsAppIcon size={13} />
            WhatsApp
          </a>
        </div>
      </div>

      <div className="px-8 py-6">
        <div className="grid lg:grid-cols-3 gap-5">
          {/* ── LEFT: Contact info ────────────────────────── */}
          <div className="space-y-4">
            {/* Info card */}
            <div className="rounded-2xl p-5" style={GLASS}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-white text-sm">Informações</h3>
                {!editing ? (
                  <button
                    onClick={() => setEditing(true)}
                    className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Editar
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={() => setEditing(false)} className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      Cancelar
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="text-xs font-semibold text-blue-400 hover:text-blue-300"
                    >
                      {saving ? 'Salvando...' : 'Salvar'}
                    </button>
                  </div>
                )}
              </div>

              {editing ? (
                <div className="space-y-3">
                  <EditField label="Nome" value={editForm.name} onChange={(v) => setEditForm({ ...editForm, name: v })} />
                  <EditField label="Endereço" value={editForm.address} onChange={(v) => setEditForm({ ...editForm, address: v })} />
                  <EditField label="Bairro" value={editForm.neighborhood} onChange={(v) => setEditForm({ ...editForm, neighborhood: v })} />
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      Status
                    </label>
                    <select
                      value={editForm.status}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg text-xs text-white outline-none"
                      style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}
                    >
                      {ALL_STATUSES.map((s) => (
                        <option key={s} value={s} style={{ background: '#1a1a2e' }}>{STATUS_LABELS[s]}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      Observações
                    </label>
                    <textarea
                      value={editForm.notes}
                      onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg text-xs text-white outline-none resize-none"
                      style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <InfoRow icon={<PhoneIcon />} label="Telefone" value={formatPhone(contact.phone)} />
                  <InfoRow icon={<MapPinIcon />} label="Endereço" value={contact.address || '—'} />
                  <InfoRow icon={<span className="text-xs">DDD</span>} label="DDD" value={contact.ddd || '—'} />
                  <InfoRow icon={<CalendarIcon />} label="Primeiro contato" value={
                    contact.first_contact_at ? new Date(contact.first_contact_at).toLocaleDateString('pt-BR') : '—'
                  } />
                  <InfoRow icon={<CalendarIcon />} label="Último contato" value={
                    contact.last_contact_at ? new Date(contact.last_contact_at).toLocaleDateString('pt-BR') : '—'
                  } />
                  <div className="pt-2">
                    <span
                      className="px-3 py-1.5 rounded-full text-xs font-bold"
                      style={{ background: statusColor.bg, color: statusColor.color, border: `1px solid ${statusColor.border}` }}
                    >
                      {STATUS_LABELS[contact.status] || contact.status}
                    </span>
                    {contact.is_recurring && (
                      <span className="ml-2 px-3 py-1.5 rounded-full text-xs font-bold"
                        style={{ background: 'rgba(16,185,129,0.12)', color: '#34d399', border: '1px solid rgba(16,185,129,0.25)' }}>
                        Recorrente
                      </span>
                    )}
                  </div>
                  {contact.notes && (
                    <div className="pt-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                      <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{contact.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Orders */}
            <div className="rounded-2xl p-5" style={GLASS}>
              <h3 className="font-bold text-white text-sm mb-3">Pedidos</h3>
              {orders.length === 0 ? (
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Nenhum pedido registrado</p>
              ) : (
                <div className="space-y-2">
                  {orders.map((o) => (
                    <div key={o.id} className="px-3 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
                      <p className="text-xs font-medium text-white">{o.service_type}</p>
                      <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                        {o.scheduled_date ? new Date(o.scheduled_date).toLocaleDateString('pt-BR') : '—'}
                        {o.value ? ` · R$ ${o.value}` : ''}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT: Conversation timeline ──────────── */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl overflow-hidden" style={GLASS}>
              <div className="px-5 py-3 border-b flex items-center gap-2" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <MessageIcon />
                <h3 className="font-bold text-white text-sm">Conversa</h3>
                <span className="text-xs ml-auto" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  {messages.length} mensagens (últimas 100)
                </span>
              </div>

              <div
                ref={chatRef}
                className="p-4 space-y-3 overflow-y-auto"
                style={{ maxHeight: 'calc(100vh - 250px)', minHeight: 400 }}
              >
                {messages.map((m, i) => {
                  const isAi = m.type === 'ai'
                  const content = cleanMessageContent(m.content, m.type)
                  const timestamp = extractTimestamp(m.content)

                  return (
                    <div key={m.id} className={`flex ${isAi ? 'justify-start' : 'justify-end'}`}>
                      <div
                        className="max-w-[80%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed"
                        style={{
                          background: isAi ? 'rgba(27,95,168,0.2)' : 'rgba(255,255,255,0.08)',
                          border: `1px solid ${isAi ? 'rgba(27,95,168,0.3)' : 'rgba(255,255,255,0.08)'}`,
                          color: 'rgba(255,255,255,0.85)',
                          borderBottomLeftRadius: isAi ? 4 : 16,
                          borderBottomRightRadius: isAi ? 16 : 4,
                        }}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold" style={{ color: isAi ? '#60a5fa' : '#a78bfa' }}>
                            {isAi ? 'SOS Bot' : contact.name || 'Lead'}
                          </span>
                          {timestamp && (
                            <span style={{ color: 'rgba(255,255,255,0.2)' }}>{timestamp}</span>
                          )}
                        </div>
                        <p className="whitespace-pre-wrap break-words">{content}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-center gap-3">
      <span style={{ color: 'rgba(255,255,255,0.3)' }}>{icon}</span>
      <div>
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{label}</p>
        <p className="text-xs font-medium text-white">{value}</p>
      </div>
    </div>
  )
}

function EditField({ label, value, onChange }) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg text-xs text-white outline-none"
        style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}
      />
    </div>
  )
}
