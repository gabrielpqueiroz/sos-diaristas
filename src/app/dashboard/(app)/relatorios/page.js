'use client'

import { useState, useEffect } from 'react'
import { GLASS } from '../../_components/styles'
import { RefreshIcon } from '../../_components/icons'

const PERIODOS = [
  { id: '7d', label: '7 dias' },
  { id: '30d', label: '30 dias' },
  { id: '90d', label: '90 dias' },
  { id: 'all', label: 'Tudo' },
]

const STATUS_LABELS = {
  pendente: { label: 'Pendente', color: '#f59e0b' },
  agendado: { label: 'Agendado', color: '#3b82f6' },
  confirmado: { label: 'Confirmado', color: '#818cf8' },
  diarista_atribuida: { label: 'Diarista OK', color: '#a78bfa' },
  em_andamento: { label: 'Em Andamento', color: '#22d3ee' },
  concluido: { label: 'Concluído', color: '#10b981' },
  cancelado: { label: 'Cancelado', color: '#6b7280' },
}

export default function RelatoriosPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [periodo, setPeriodo] = useState('30d')

  async function loadData() {
    setLoading(true)
    try {
      const res = await fetch(`/api/dashboard/relatorios?periodo=${periodo}`)
      const json = await res.json()
      setData(json)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  useEffect(() => { loadData() }, [periodo])

  function fmt(v) {
    return parseFloat(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
  }

  function fmtDate(d) {
    if (!d) return '—'
    const str = typeof d === 'string' ? d.split('T')[0] : d
    const [y, m, day] = str.split('-')
    return `${day}/${m}`
  }

  return (
    <>
      {/* Top bar */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-8 py-4"
        style={{ background: 'rgba(7,9,15,0.8)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div>
          <h1 className="text-white font-bold text-lg">Relatórios</h1>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Acompanhe o desempenho do negócio
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Period selector */}
          <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
            {PERIODOS.map(p => (
              <button key={p.id} onClick={() => setPeriodo(p.id)}
                className="px-3 py-2 text-xs font-medium transition-all"
                style={{
                  background: periodo === p.id ? 'rgba(27,95,168,0.3)' : 'transparent',
                  color: periodo === p.id ? '#60a5fa' : 'rgba(255,255,255,0.4)',
                }}>
                {p.label}
              </button>
            ))}
          </div>
          <button onClick={loadData} className="p-2 rounded-xl transition-all" style={{ ...GLASS, color: 'rgba(255,255,255,0.5)' }}>
            <RefreshIcon />
          </button>
        </div>
      </div>

      <div className="px-8 py-6 space-y-6">
        {loading && !data ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : data ? (
          <>
            {/* KPIs principais */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <KpiCard label="Total Pedidos" value={fmt(data.resumo?.total_pedidos)} color="#60a5fa" />
              <KpiCard label="Concluídos" value={fmt(data.resumo?.concluidos)} color="#34d399" />
              <KpiCard label="Faturamento" value={`R$ ${fmt(data.resumo?.faturamento)}`} color="#34d399" big />
              <KpiCard label="Valor Recebido" value={`R$ ${fmt(data.resumo?.valor_recebido)}`} color="#10b981" />
              <KpiCard label="A Receber" value={`R$ ${fmt(data.resumo?.valor_pendente)}`} color="#fbbf24" />
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <KpiCard label="Ticket Médio" value={`R$ ${fmt(data.resumo?.ticket_medio)}`} color="#818cf8" />
              <KpiCard label="Cancelados" value={fmt(data.resumo?.cancelados)} color="#f87171" />
              <KpiCard label="Em Aberto" value={fmt(data.resumo?.em_aberto)} color="#fbbf24" />
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Faturamento por dia */}
              <div className="rounded-2xl p-6" style={GLASS}>
                <h3 className="font-bold text-white text-sm mb-4">Faturamento por Dia</h3>
                {data.faturamentoDiario?.length > 0 ? (
                  <div className="space-y-1.5 max-h-80 overflow-y-auto">
                    {data.faturamentoDiario.map((d, i) => {
                      const maxVal = Math.max(...data.faturamentoDiario.map(x => parseFloat(x.valor) || 1))
                      const pct = ((parseFloat(d.valor) || 0) / maxVal) * 100
                      return (
                        <div key={i} className="flex items-center gap-3">
                          <span className="text-xs font-medium w-12 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.5)' }}>
                            {fmtDate(d.dia)}
                          </span>
                          <div className="flex-1 h-6 rounded-lg overflow-hidden relative" style={{ background: 'rgba(255,255,255,0.04)' }}>
                            <div className="h-full rounded-lg transition-all" style={{ width: `${Math.max(pct, 3)}%`, background: 'linear-gradient(90deg, #1B5FA8, #3b82f6)' }} />
                            <div className="absolute inset-0 flex items-center justify-between px-2">
                              <span className="text-xs font-medium text-white">{d.pedidos} ped.</span>
                              <span className="text-xs font-bold text-white">R$ {fmt(d.valor)}</span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-center py-8" style={{ color: 'rgba(255,255,255,0.3)' }}>Nenhum dado no período</p>
                )}
              </div>

              {/* Ranking diaristas */}
              <div className="rounded-2xl p-6" style={GLASS}>
                <h3 className="font-bold text-white text-sm mb-4">Ranking de Diaristas</h3>
                {data.rankingDiaristas?.length > 0 ? (
                  <div className="space-y-3">
                    {data.rankingDiaristas.map((d, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                          style={{
                            background: i === 0 ? 'linear-gradient(135deg, #f59e0b, #d97706)' : i === 1 ? 'linear-gradient(135deg, #94a3b8, #64748b)' : i === 2 ? 'linear-gradient(135deg, #b45309, #92400e)' : 'rgba(255,255,255,0.08)',
                            color: '#fff',
                          }}>
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{d.name}</p>
                          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                            {d.concluidos} concluído{parseInt(d.concluidos) !== 1 ? 's' : ''} · Ticket médio R$ {fmt(d.ticket_medio)}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-bold" style={{ color: '#34d399' }}>R$ {fmt(d.faturamento)}</p>
                          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{d.total_pedidos} pedidos</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-center py-8" style={{ color: 'rgba(255,255,255,0.3)' }}>Nenhuma diarista com pedidos</p>
                )}
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Pedidos por status */}
              <div className="rounded-2xl p-6" style={GLASS}>
                <h3 className="font-bold text-white text-sm mb-4">Pedidos por Status</h3>
                <div className="space-y-3">
                  {(data.pedidosPorStatus || []).map((s, i) => {
                    const cfg = STATUS_LABELS[s.status] || { label: s.status, color: '#6b7280' }
                    const total = parseInt(data.resumo?.total_pedidos) || 1
                    const pct = Math.round((parseInt(s.total) / total) * 100)
                    return (
                      <div key={i}>
                        <div className="flex justify-between text-xs mb-1">
                          <span style={{ color: cfg.color }}>{cfg.label}</span>
                          <span className="font-bold text-white">{s.total} ({pct}%)</span>
                        </div>
                        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: cfg.color }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Serviços mais pedidos */}
              <div className="rounded-2xl p-6" style={GLASS}>
                <h3 className="font-bold text-white text-sm mb-4">Serviços Mais Pedidos</h3>
                <div className="space-y-3">
                  {(data.servicosPorTipo || []).map((s, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                      <div>
                        <p className="text-sm font-medium text-white">{s.service_type}</p>
                        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{s.total} pedido{parseInt(s.total) !== 1 ? 's' : ''}</p>
                      </div>
                      <p className="text-sm font-bold" style={{ color: '#60a5fa' }}>R$ {fmt(s.valor_total)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pagamentos */}
              <div className="rounded-2xl p-6" style={GLASS}>
                <h3 className="font-bold text-white text-sm mb-4">Status de Pagamento</h3>
                <div className="space-y-4">
                  {(data.pagamentos || []).map((p, i) => {
                    const colors = { pago: '#10b981', pendente: '#f59e0b', parcial: '#f97316' }
                    const labels = { pago: 'Pago', pendente: 'Pendente', parcial: 'Parcial' }
                    const color = colors[p.status] || '#6b7280'
                    return (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: color }} />
                        <div className="flex-1">
                          <p className="text-sm font-medium" style={{ color }}>{labels[p.status] || p.status}</p>
                          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{p.total} pedido{parseInt(p.total) !== 1 ? 's' : ''}</p>
                        </div>
                        <p className="text-sm font-bold text-white">R$ {fmt(p.valor)}</p>
                      </div>
                    )
                  })}
                </div>

                {/* Conversão */}
                {data.conversao && (
                  <div className="mt-5 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <h4 className="text-xs font-bold text-white mb-3">Conversão de Contatos</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <MiniStat label="Total Contatos" value={data.conversao.total_contatos} color="rgba(255,255,255,0.6)" />
                      <MiniStat label="Clientes" value={data.conversao.clientes} color="#34d399" />
                      <MiniStat label="Recorrentes" value={data.conversao.recorrentes} color="#60a5fa" />
                      <MiniStat label="Perdidos" value={data.conversao.perdidos} color="#f87171" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </>
  )
}

function KpiCard({ label, value, color, big }) {
  return (
    <div className="rounded-2xl p-5" style={GLASS}>
      <p className="text-xs mb-1.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{label}</p>
      <p className={`${big ? 'text-2xl' : 'text-xl'} font-extrabold tracking-tight`} style={{ color }}>{value}</p>
    </div>
  )
}

function MiniStat({ label, value, color }) {
  return (
    <div className="p-2 rounded-lg text-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
      <p className="text-lg font-bold" style={{ color }}>{value || 0}</p>
      <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{label}</p>
    </div>
  )
}
