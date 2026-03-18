'use client'

import dynamic from 'next/dynamic'
import { BG_GRADIENT } from '../../_components/styles'

const MapComponent = dynamic(
  () => import('../../_components/MapComponent'),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center" style={{ height: '600px' }}>
        <div className="w-10 h-10 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    )
  }
)

export default function MapaPage() {
  return (
    <div className="p-6" style={{ background: BG_GRADIENT, minHeight: '100vh' }}>
      <h1 className="text-2xl font-bold text-white mb-6">Mapa de Atendimentos</h1>
      <div className="rounded-2xl overflow-hidden" style={{ height: '600px' }}>
        <MapComponent />
      </div>
    </div>
  )
}
