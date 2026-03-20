'use client'

import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet.heat/dist/leaflet-heat.js'

export default function HeatmapLayer({ points = [] }) {
  const map = useMap()
  const heatLayerRef = useRef(null)

  useEffect(() => {
    if (!heatLayerRef.current) {
      heatLayerRef.current = L.heatLayer([], {
        radius: 25,
        blur: 15,
        maxZoom: 17,
        gradient: { 0.4: '#1B5FA8', 0.65: '#3b82f6', 1: '#60a5fa' },
      }).addTo(map)
    }

    heatLayerRef.current.setLatLngs(points)

    return () => {
      if (heatLayerRef.current) {
        heatLayerRef.current.remove()
        heatLayerRef.current = null
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points])

  return null
}
