import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

// GET /api/dashboard/calendario?month=2026-03
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month') // YYYY-MM

    if (!month) {
      return NextResponse.json({ error: 'Parâmetro month obrigatório (YYYY-MM)' }, { status: 400 })
    }

    // Pedidos agendados no mês
    const orders = await query(
      `SELECT o.id, o.status, o.service_type, o.scheduled_date, o.scheduled_time,
              o.address, o.value, o.notes,
              c.name as contact_name, c.phone as contact_phone,
              d.name as diarista_name, d.phone as diarista_phone
       FROM crm_orders o
       LEFT JOIN crm_contacts c ON c.id = o.contact_id
       LEFT JOIN crm_diaristas d ON d.id = o.diarista_id
       WHERE o.scheduled_date IS NOT NULL
         AND to_char(o.scheduled_date, 'YYYY-MM') = $1
       ORDER BY o.scheduled_date ASC, o.scheduled_time ASC NULLS LAST`,
      [month]
    )

    // Resumo por dia
    const daySummary = await query(
      `SELECT to_char(scheduled_date, 'YYYY-MM-DD') as day,
              count(*) as total,
              count(*) FILTER (WHERE status IN ('agendado','confirmado','diarista_atribuida')) as pendentes,
              count(*) FILTER (WHERE status = 'concluido') as concluidos,
              COALESCE(sum(value) FILTER (WHERE status = 'concluido'), 0) as receita
       FROM crm_orders
       WHERE scheduled_date IS NOT NULL
         AND to_char(scheduled_date, 'YYYY-MM') = $1
       GROUP BY to_char(scheduled_date, 'YYYY-MM-DD')
       ORDER BY day`,
      [month]
    )

    return NextResponse.json({
      orders: orders.rows,
      daySummary: Object.fromEntries(daySummary.rows.map(r => [r.day, {
        total: parseInt(r.total),
        pendentes: parseInt(r.pendentes),
        concluidos: parseInt(r.concluidos),
        receita: parseFloat(r.receita),
      }])),
    })
  } catch (error) {
    console.error('Error fetching calendar:', error)
    return NextResponse.json({ error: 'Erro ao buscar calendário' }, { status: 500 })
  }
}
