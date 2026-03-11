export const metadata = {
  title: 'Dashboard · SOS Diaristas',
  description: 'Painel administrativo interno',
}

export default function DashboardLayout({ children }) {
  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {children}
    </div>
  )
}
