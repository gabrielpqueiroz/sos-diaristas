'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { BG_GRADIENT, GLASS } from '../../_components/styles'

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
  const [data, setData] = useState({ pins: [], total_with_coords: 0, total_without_coords: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard/mapa')
      .then(res => res.json())
      .then(json => { setData(json); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="p-6" style={{ background: BG_GRADIENT, minHeight: '100vh' }}>
      <h1 className="text-2xl font-bold text-white mb-6">Mapa de Atendimentos</h1>
      <div className="rounded-2xl overflow-hidden" style={{ height: '600px', ...GLASS }}>
        <MapComponent pins={data.pins} />
      </div>
      <div className="flex items-center gap-4 mt-4 px-2">
        <span className="text-sm text-green-400">
          {data.total_with_coords} enderecos geocodificados
        </span>
        {data.total_without_coords > 0 && (
          <span className="text-sm text-yellow-400">
            {data.total_without_coords} enderecos sem coordenada
          </span>
        )}
        {loading && (
          <span className="text-sm text-white/50">Carregando dados...</span>
        )}
      </div>
    </div>
  )
}
