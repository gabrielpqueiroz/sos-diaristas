import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

// GET /api/dashboard/stats?period=today|7d|30d|90d
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30d'

    let interval
    switch (period) {
      case 'today': interval = '1 day'; break
      case '7d': interval = '7 days'; break
      case '90d': interval = '90 days'; break
      default: interval = '30 days'
    }

    // Contact stats
    const contactStats = await query(`
      SELECT
        count(*) as total_contacts,
        count(*) FILTER (WHERE status = 'novo') as novos,
        count(*) FILTER (WHERE status = 'qualificado') as qualificados,
        count(*) FILTER (WHERE status = 'cliente') as clientes,
        count(*) FILTER (WHERE status = 'agendado') as agendados,
        count(*) FILTER (WHERE status = 'inativo') as inativos,
        count(*) FILTER (WHERE status = 'perdido') as perdidos,
        count(*) FILTER (WHERE is_recurring = true) as recorrentes,
        count(*) FILTER (WHERE last_contact_at >= now() - interval '${interval}') as ativos_periodo
      FROM crm_contacts
    `)

    // Messages in period (conversations per day)
    const dailyConversations = await query(`
      SELECT
        date_trunc('day',
          to_timestamp(
            trim(substring(message->>'content' from 'Dia e Hora atual:\\n?\\s*([0-9T:.+-]+)')),
            'YYYY-MM-DD"T"HH24:MI:SS.MS'
          )
        )::date as dia,
        count(DISTINCT session_id) as contatos_atendidos,
        count(*) FILTER (WHERE message->>'type' = 'human') as msgs_humanas,
        count(*) FILTER (WHERE message->>'type' = 'ai') as msgs_ia
      FROM n8n_chat_histories
      WHERE message->>'content' LIKE '%Dia e Hora%'
      AND id > (SELECT COALESCE(max(id), 0) - 100000 FROM n8n_chat_histories)
      GROUP BY dia
      HAVING date_trunc('day',
        to_timestamp(
          trim(substring(message->>'content' from 'Dia e Hora atual:\\n?\\s*([0-9T:.+-]+)')),
          'YYYY-MM-DD"T"HH24:MI:SS.MS'
        )
      )::date >= CURRENT_DATE - interval '${interval}'
      ORDER BY dia DESC
      LIMIT 90
    `)

    // Today's stats - orders scheduled for today
    const todayDate = new Date().toISOString().split('T')[0]
    const today = await query(`
      SELECT
        count(*) as atendimentos_hoje,
        count(*) FILTER (WHERE status = 'concluido') as concluidos_hoje,
        count(*) FILTER (WHERE status IN ('agendado','confirmado','diarista_atribuida','em_andamento')) as pendentes_hoje
      FROM crm_orders
      WHERE scheduled_date = $1
    `, [todayDate])

    // Order stats
    const orderStats = await query(`
      SELECT
        count(*) as total_orders,
        count(*) FILTER (WHERE status = 'pendente') as pendentes,
        count(*) FILTER (WHERE status = 'agendado') as agendados,
        count(*) FILTER (WHERE status = 'concluido') as concluidos,
        COALESCE(sum(value) FILTER (WHERE status = 'concluido'), 0) as receita_total,
        COALESCE(sum(value) FILTER (WHERE status = 'concluido' AND created_at >= now() - interval '${interval}'), 0) as receita_periodo
      FROM crm_orders
    `)

    // Recent contacts
    const recentContacts = await query(`
      SELECT id, session_id, name, phone, status, is_recurring, last_contact_at
      FROM crm_contacts
      WHERE last_contact_at IS NOT NULL
      ORDER BY last_contact_at DESC
      LIMIT 10
    `)

    return NextResponse.json({
      contacts: contactStats.rows[0],
      orders: orderStats.rows[0],
      today: today.rows[0],
      dailyConversations: dailyConversations.rows,
      recentContacts: recentContacts.rows,
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json({ error: 'Erro ao buscar estatísticas' }, { status: 500 })
  }
}
