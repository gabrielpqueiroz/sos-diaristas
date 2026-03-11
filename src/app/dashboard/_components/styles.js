export const GLASS = {
  background: 'rgba(255,255,255,0.04)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.07)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
}

export const GLASS_HOVER = {
  ...GLASS,
  border: '1px solid rgba(255,255,255,0.12)',
  boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
}

export const BG_GRADIENT = `
  radial-gradient(ellipse 800px 700px at 10% 50%, rgba(27,95,168,0.1) 0%, transparent 100%),
  radial-gradient(ellipse 600px 500px at 90% 10%, rgba(59,130,246,0.07) 0%, transparent 100%),
  #07090f
`

export const STATUS_COLORS = {
  novo: { bg: 'rgba(59,130,246,0.12)', color: '#60a5fa', border: 'rgba(59,130,246,0.25)' },
  qualificado: { bg: 'rgba(168,85,247,0.12)', color: '#c084fc', border: 'rgba(168,85,247,0.25)' },
  agendado: { bg: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: 'rgba(245,158,11,0.25)' },
  cliente: { bg: 'rgba(16,185,129,0.12)', color: '#34d399', border: 'rgba(16,185,129,0.25)' },
  inativo: { bg: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.35)', border: 'rgba(255,255,255,0.1)' },
  perdido: { bg: 'rgba(239,68,68,0.12)', color: '#f87171', border: 'rgba(239,68,68,0.25)' },
}

export const STATUS_LABELS = {
  novo: 'Novo',
  qualificado: 'Qualificado',
  agendado: 'Agendado',
  cliente: 'Cliente',
  inativo: 'Inativo',
  perdido: 'Perdido',
}
