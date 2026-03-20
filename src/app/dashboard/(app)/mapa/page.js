'use client'

import { useState, useEffect, useCallback } from 'react'
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

const PERIOD_OPTIONS = [
  { label: 'Ultimos 7 dias', value: 7 },
  { label: 'Ultimos 30 dias', value: 30 },
  { label: 'Ultimos 90 dias', value: 90 },
]

export default function MapaPage() {
  const [period, setPeriod] = useState(30)
  const [data, setData] = useState({ pins: [], total_with_coords: 0, total_without_coords: 0 })
  const [loading, setLoading] = useState(true)
  const [showHeatmap, setShowHeatmap] = useState(true)
  const [showPins, setShowPins] = useState(true)

  const fetchData = useCallback((days) => {
    setLoading(true)
    fetch(`/api/dashboard/mapa?days=${days}`)
      .then(res => res.json())
      .then(json => { setData(json); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchData(period)
  }, [period, fetchData])

  const heatPoints = data.pins.map(p => [p.lat, p.lng])

  return (
    <div className="p-6" style={{ background: BG_GRADIENT, minHeight: '100vh' }}>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-white">Mapa de Atendimentos</h1>
        <div className="flex gap-2 flex-wrap">
          {PERIOD_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setPeriod(opt.value)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                period === opt.value
                  ? 'bg-blue-600 text-white'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
              style={period === opt.value ? {} : { border: '1px solid rgba(255,255,255,0.1)' }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setShowHeatmap(prev => !prev)}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            showHeatmap
              ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
              : 'text-white/40 hover:text-white/60'
          }`}
          style={showHeatmap ? {} : { border: '1px solid rgba(255,255,255,0.1)' }}
        >
          Camada de Calor
        </button>
        <button
          onClick={() => setShowPins(prev => !prev)}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            showPins
              ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
              : 'text-white/40 hover:text-white/60'
          }`}
          style={showPins ? {} : { border: '1px solid rgba(255,255,255,0.1)' }}
        >
          Pins
        </button>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ height: '600px', ...GLASS }}>
        <MapComponent
          pins={showPins ? data.pins : []}
          heatPoints={showHeatmap ? heatPoints : []}
        />
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
          <span className="text-sm text-white/50">Atualizando...</span>
        )}
      </div>
    </div>
  )
}
