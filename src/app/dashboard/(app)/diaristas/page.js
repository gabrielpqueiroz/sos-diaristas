'use client'

import { useState, useEffect, useCallback } from 'react'
import { GLASS, GLASS_HOVER } from '../../_components/styles'
import { SearchIcon, PhoneIcon, RefreshIcon } from '../../_components/icons'

const STATUS_MAP = {
  ativa: { label: 'Ativa', bg: 'rgba(16,185,129,0.12)', color: '#34d399', border: 'rgba(16,185,129,0.25)' },
  inativa: { label: 'Inativa', bg: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.35)', border: 'rgba(255,255,255,0.1)' },
  ferias: { label: 'Férias', bg: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: 'rgba(245,158,11,0.25)' },
}

export default function DiaristasPage() {
  const [diaristas, setDiaristas] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ name: '', phone: '', specialties: '', notes: '' })
  const [saving, setSaving] = useState(false)

  const fetchDiaristas = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/dashboard/diaristas')
      const data = await res.json()
      setDiaristas(data.diaristas || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchDiaristas() }, [fetchDiaristas])

  function openNew() {
    setEditingId(null)
    setForm({ name: '', phone: '', specialties: '', notes: '' })
    setShowModal(true)
  }

  function openEdit(d) {
    setEditingId(d.id)
    setForm({ name: d.name || '', phone: d.phone || '', specialties: d.specialties || '', notes: d.notes || '' })
    setShowModal(true)
  }

  async function handleSave() {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/dashboard/diaristas', {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingId ? { id: editingId, ...form } : form),
      })
      const data = await res.json()
      if (!res.ok) {
        alert(`Erro: ${data.detail || data.error || 'Falha ao salvar'}`)
        setSaving(false)
        return
      }
      setShowModal(false)
      fetchDiaristas()
    } catch (e) {
      console.error(e)
      alert('Erro de conexão ao salvar diarista')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleStatus(d) {
    const newStatus = d.status === 'ativa' ? 'inativa' : 'ativa'
    await fetch('/api/dashboard/diaristas', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: d.id, status: newStatus }),
    })
    fetchDiaristas()
  }

  async function handleDelete(d) {
    if (!confirm(`Deseja realmente excluir "${d.name}"?`)) return
    try {
      const res = await fetch(`/api/dashboard/diaristas?id=${d.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) {
        alert(`Erro: ${data.detail || data.error}`)
        return
      }
      fetchDiaristas()
    } catch (e) {
      console.error(e)
      alert('Erro ao excluir diarista')
    }
  }

  const filtered = diaristas.filter(d => {
    if (!search) return true
    const s = search.toLowerCase()
    return (d.name || '').toLowerCase().includes(s) || (d.phone || '').includes(s)
  })

  function formatPhone(p) {
    if (!p) return '—'
    const digits = p.replace(/\D/g, '')
    if (digits.length === 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
    if (digits.length === 13) return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9)}`
    return p
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Diaristas</h1>
          <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
            {diaristas.length} diarista{diaristas.length !== 1 ? 's' : ''} cadastrada{diaristas.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchDiaristas}
            className="px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-2"
            style={{ ...GLASS, color: 'rgba(255,255,255,0.5)' }}
          >
            <RefreshIcon /> Atualizar
          </button>
          <button
            onClick={openNew}
            className="px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2"
            style={{ background: 'linear-gradient(135deg, #1B5FA8, #3b82f6)', color: '#fff' }}
          >
            <span className="text-base leading-none">+</span> Nova Diarista
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.25)' }}>
          <SearchIcon />
        </span>
        <input
          type="text"
          placeholder="Buscar por nome ou telefone..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all"
          style={{ ...GLASS, color: '#fff' }}
        />
      </div>

      {/* Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-2xl p-5 animate-pulse" style={GLASS}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }} />
                <div className="flex-1">
                  <div className="h-4 rounded w-32" style={{ background: 'rgba(255,255,255,0.08)' }} />
                  <div className="h-3 rounded w-24 mt-1.5" style={{ background: 'rgba(255,255,255,0.05)' }} />
                </div>
              </div>
              <div className="h-3 rounded w-full" style={{ background: 'rgba(255,255,255,0.05)' }} />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 rounded-2xl" style={GLASS}>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>
            {search ? 'Nenhuma diarista encontrada para essa busca.' : 'Nenhuma diarista cadastrada ainda.'}
          </p>
          {!search && (
            <button onClick={openNew} className="mt-3 text-xs font-semibold" style={{ color: '#3b82f6' }}>
              Cadastrar primeira diarista
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(d => {
            const st = STATUS_MAP[d.status] || STATUS_MAP.ativa
            return (
              <div
                key={d.id}
                className="rounded-2xl p-5 transition-all duration-200 cursor-pointer group"
                style={GLASS}
                onClick={() => openEdit(d)}
              >
                {/* Top row */}
                <div className="flex items-start gap-3 mb-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #1B5FA8, #3b82f6)', color: '#fff' }}
                  >
                    {(d.name || '?')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{d.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      <PhoneIcon />
                      <span className="text-xs">{formatPhone(d.phone)}</span>
                    </div>
                  </div>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0"
                    style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}` }}
                  >
                    {st.label}
                  </span>
                </div>

                {/* Specialties */}
                {d.specialties && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {d.specialties.split(',').map((s, i) => (
                      <span
                        key={i}
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(59,130,246,0.1)', color: 'rgba(147,197,253,0.8)', border: '1px solid rgba(59,130,246,0.15)' }}
                      >
                        {s.trim()}
                      </span>
                    ))}
                  </div>
                )}

                {/* Stats */}
                <div className="flex items-center gap-4 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Total:</span>
                    <span className="text-xs font-semibold text-white">{d.total_orders || 0}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Ativas:</span>
                    <span className="text-xs font-semibold" style={{ color: '#34d399' }}>{d.active_orders || 0}</span>
                  </div>
                  <div className="flex-1" />
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={e => { e.stopPropagation(); handleToggleStatus(d) }}
                      className="text-xs px-2 py-1 rounded-lg transition-colors"
                      style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}
                      title={d.status === 'ativa' ? 'Desativar' : 'Ativar'}
                    >
                      {d.status === 'ativa' ? 'Desativar' : 'Ativar'}
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); handleDelete(d) }}
                      className="text-xs px-2 py-1 rounded-lg transition-colors"
                      style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}
                    >
                      Excluir
                    </button>
                  </div>
                </div>

                {/* Notes preview */}
                {d.notes && (
                  <p className="text-xs mt-2 truncate" style={{ color: 'rgba(255,255,255,0.25)' }}>
                    {d.notes}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowModal(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl p-6"
            style={{ ...GLASS_HOVER, background: 'rgba(15,18,30,0.95)' }}
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-white mb-5">
              {editingId ? 'Editar Diarista' : 'Nova Diarista'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  Nome *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Nome completo"
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ ...GLASS, color: '#fff' }}
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  Telefone
                </label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="(45) 99999-9999"
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ ...GLASS, color: '#fff' }}
                />
              </div>

              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  Especialidades
                </label>
                <input
                  type="text"
                  value={form.specialties}
                  onChange={e => setForm(f => ({ ...f, specialties: e.target.value }))}
                  placeholder="Limpeza geral, Pós-obra, Escritórios (separar por vírgula)"
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ ...GLASS, color: '#fff' }}
                />
              </div>

              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  Observações
                </label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Notas sobre a diarista..."
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
                  style={{ ...GLASS, color: '#fff' }}
                />
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{ ...GLASS, color: 'rgba(255,255,255,0.5)' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.name.trim()}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg, #1B5FA8, #3b82f6)', color: '#fff' }}
              >
                {saving ? 'Salvando...' : editingId ? 'Salvar' : 'Cadastrar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
