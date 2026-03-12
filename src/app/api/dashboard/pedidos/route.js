import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

// GET /api/dashboard/pedidos?status=&page=1&limit=50
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    let where = 'WHERE 1=1'
    const params = []
    let idx = 1

    if (status) {
      where += ` AND o.status = $${idx++}`
      params.push(status)
    }

    const countResult = await query(
      `SELECT count(*) as total FROM crm_orders o ${where}`, params
    )

    const orders = await query(
      `SELECT o.*,
        c.name as contact_name, c.phone as contact_phone, c.session_id,
        d.name as diarista_name, d.phone as diarista_phone
       FROM crm_orders o
       LEFT JOIN crm_contacts c ON c.id = o.contact_id
       LEFT JOIN crm_diaristas d ON d.id = o.diarista_id
       ${where}
       ORDER BY
         CASE o.status
           WHEN 'pendente' THEN 1
           WHEN 'agendado' THEN 2
           WHEN 'confirmado' THEN 3
           WHEN 'diarista_atribuida' THEN 4
           WHEN 'em_andamento' THEN 5
           WHEN 'concluido' THEN 6
           WHEN 'cancelado' THEN 7
         END,
         o.scheduled_date::text ASC NULLS LAST,
         o.created_at DESC
       LIMIT $${idx++} OFFSET $${idx++}`,
      [...params, limit, offset]
    )

    // Get counts per status
    const statusCounts = await query(`
      SELECT status, count(*) as total FROM crm_orders GROUP BY status
    `)

    return NextResponse.json({
      orders: orders.rows,
      total: parseInt(countResult.rows[0].total),
      statusCounts: Object.fromEntries(statusCounts.rows.map(r => [r.status, parseInt(r.total)])),
    })
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json({ error: 'Erro ao buscar pedidos' }, { status: 500 })
  }
}

// POST /api/dashboard/pedidos - Create order
export async function POST(request) {
  try {
    const body = await request.json()
    const { contact_id, session_id, service_type, status, scheduled_date, scheduled_time, address, diarista_id, value, notes } = body

    const result = await query(
      `INSERT INTO crm_orders (contact_id, session_id, service_type, status, scheduled_date, scheduled_time, address, diarista_id, value, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [contact_id, session_id, service_type, status || 'pendente', scheduled_date || null, scheduled_time || null, address || null, diarista_id || null, value || null, notes || null]
    )

    // Update contact stats
    if (contact_id) {
      await query(`
        UPDATE crm_contacts SET
          total_orders = (SELECT count(*) FROM crm_orders WHERE contact_id = $1),
          total_revenue = (SELECT COALESCE(sum(value), 0) FROM crm_orders WHERE contact_id = $1 AND status = 'concluido'),
          updated_at = now()
        WHERE id = $1
      `, [contact_id])
    }

    return NextResponse.json({ order: result.rows[0] })
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json({ error: 'Erro ao criar pedido' }, { status: 500 })
  }
}
