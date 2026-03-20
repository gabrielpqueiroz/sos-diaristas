import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const rawDays = parseInt(searchParams.get('days'), 10)
    const days = [7, 30, 90].includes(rawDays) ? rawDays : 30

    const pinsResult = await query(`
      SELECT id, lat, lng, status, address, scheduled_date
      FROM crm_orders
      WHERE lat IS NOT NULL
        AND status IN ('concluido', 'agendado', 'confirmado', 'diarista_atribuida', 'em_andamento')
        AND scheduled_date >= NOW() - INTERVAL '${days} days'
      ORDER BY scheduled_date DESC
    `)

    const countsResult = await query(`
      SELECT
        count(*) FILTER (WHERE lat IS NOT NULL) as with_coords,
        count(*) FILTER (WHERE lat IS NULL AND address IS NOT NULL) as without_coords
      FROM crm_orders
    `)

    const counts = countsResult.rows[0]

    return NextResponse.json({
      pins: pinsResult.rows,
      total_with_coords: parseInt(counts.with_coords, 10),
      total_without_coords: parseInt(counts.without_coords, 10),
    })
  } catch (error) {
    console.error('Error fetching mapa data:', error.message, error.stack)
    return NextResponse.json(
      { error: 'Erro ao buscar dados do mapa', detail: error.message },
      { status: 500 }
    )
  }
}
