import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

// GET /api/dashboard/hoje
export async function GET() {
  try {
    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD

    // Orders scheduled for today
    const orders = await query(
      `SELECT o.*,
        c.name as contact_name, c.phone as contact_phone, c.address as contact_address,
        d.name as diarista_name, d.phone as diarista_phone
       FROM crm_orders o
       LEFT JOIN crm_contacts c ON c.id = o.contact_id
       LEFT JOIN crm_diaristas d ON d.id = o.diarista_id
       WHERE o.scheduled_date::text = $1
       ORDER BY o.scheduled_time ASC NULLS LAST, o.created_at ASC`,
      [today]
    )

    // Tomorrow's orders (for preview)
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = tomorrow.toISOString().split('T')[0]

    const tomorrowOrders = await query(
      `SELECT o.id, o.status, o.service_type, o.scheduled_time, o.address, o.value, o.payment_status,
        c.name as contact_name, c.phone as contact_phone,
        d.name as diarista_name
       FROM crm_orders o
       LEFT JOIN crm_contacts c ON c.id = o.contact_id
       LEFT JOIN crm_diaristas d ON d.id = o.diarista_id
       WHERE o.scheduled_date::text = $1
       ORDER BY o.scheduled_time ASC NULLS LAST`,
      [tomorrowStr]
    )

    // Diaristas with their today's workload
    const diaristas = await query(`
      SELECT d.*,
        (SELECT count(*) FROM crm_orders o WHERE o.diarista_id = d.id AND o.scheduled_date::text = $1) as orders_today,
        (SELECT string_agg(o.scheduled_time::text, ', ' ORDER BY o.scheduled_time) FROM crm_orders o WHERE o.diarista_id = d.id AND o.scheduled_date::text = $1 AND o.scheduled_time IS NOT NULL) as times_today
      FROM crm_diaristas d
      WHERE d.status = 'ativa'
      ORDER BY d.name
    `, [today])

    // Today's summary
    const summary = await query(`
      SELECT
        count(*) as total,
        count(*) FILTER (WHERE status IN ('agendado','confirmado','diarista_atribuida')) as pendentes,
        count(*) FILTER (WHERE status = 'em_andamento') as em_andamento,
        count(*) FILTER (WHERE status = 'concluido') as concluidos,
        count(*) FILTER (WHERE status = 'cancelado') as cancelados,
        COALESCE(sum(value), 0) as receita_total,
        COALESCE(sum(value) FILTER (WHERE status = 'concluido'), 0) as receita_concluida,
        count(*) FILTER (WHERE payment_status = 'pago') as pagos,
        count(*) FILTER (WHERE payment_status = 'pendente' OR payment_status IS NULL) as pagamento_pendente
      FROM crm_orders
      WHERE scheduled_date::text = $1
    `, [today])

    return NextResponse.json({
      orders: orders.rows,
      tomorrowOrders: tomorrowOrders.rows,
      diaristas: diaristas.rows,
      summary: summary.rows[0],
      today,
      tomorrow: tomorrowStr,
    })
  } catch (error) {
    console.error('Error fetching hoje:', error.message, error.stack)
    return NextResponse.json({ error: 'Erro ao buscar dados de hoje', detail: error.message }, { status: 500 })
  }
}
