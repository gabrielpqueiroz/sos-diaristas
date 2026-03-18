import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

// GET /api/dashboard/mapa
// Returns geocoded order pins plus counts of orders with/without coordinates
export async function GET() {
  try {
    // Fetch pins for orders that have been geocoded and are in active statuses
    const pinsResult = await query(`
      SELECT id, lat, lng, status, address, scheduled_date
      FROM crm_orders
      WHERE lat IS NOT NULL
        AND status IN ('concluido', 'agendado', 'confirmado', 'diarista_atribuida', 'em_andamento')
      ORDER BY scheduled_date DESC
    `)

    // Count orders with and without coordinates
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
