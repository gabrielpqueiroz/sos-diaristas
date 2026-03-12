import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

// GET /api/dashboard/relatorios?periodo=7d|30d|90d|all
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const periodo = searchParams.get('periodo') || '30d'

    let dateFilter = ''
    switch (periodo) {
      case '7d': dateFilter = "AND o.created_at >= now() - interval '7 days'"; break
      case '30d': dateFilter = "AND o.created_at >= now() - interval '30 days'"; break
      case '90d': dateFilter = "AND o.created_at >= now() - interval '90 days'"; break
      default: dateFilter = ''
    }

    // Resumo geral
    const resumo = await query(`
      SELECT
        count(*) as total_pedidos,
        count(*) FILTER (WHERE o.status = 'concluido') as concluidos,
        count(*) FILTER (WHERE o.status = 'cancelado') as cancelados,
        count(*) FILTER (WHERE o.status IN ('pendente','agendado','confirmado','diarista_atribuida','em_andamento')) as em_aberto,
        COALESCE(sum(o.value), 0) as valor_total,
        COALESCE(sum(o.value) FILTER (WHERE o.status = 'concluido'), 0) as faturamento,
        COALESCE(sum(o.value) FILTER (WHERE o.payment_status = 'pago'), 0) as valor_recebido,
        COALESCE(sum(o.value) FILTER (WHERE o.payment_status != 'pago' OR o.payment_status IS NULL), 0) as valor_pendente,
        COALESCE(avg(o.value) FILTER (WHERE o.status = 'concluido'), 0) as ticket_medio
      FROM crm_orders o
      WHERE 1=1 ${dateFilter}
    `)

    // Faturamento por dia
    const faturamentoDiario = await query(`
      SELECT
        o.scheduled_date::text as dia,
        count(*) as pedidos,
        count(*) FILTER (WHERE o.status = 'concluido') as concluidos,
        COALESCE(sum(o.value), 0) as valor,
        COALESCE(sum(o.value) FILTER (WHERE o.payment_status = 'pago'), 0) as recebido
      FROM crm_orders o
      WHERE o.scheduled_date IS NOT NULL ${dateFilter}
      GROUP BY o.scheduled_date
      ORDER BY o.scheduled_date DESC
      LIMIT 90
    `)

    // Ranking diaristas
    const rankingDiaristas = await query(`
      SELECT
        d.name,
        d.phone,
        count(o.id) as total_pedidos,
        count(o.id) FILTER (WHERE o.status = 'concluido') as concluidos,
        COALESCE(sum(o.value) FILTER (WHERE o.status = 'concluido'), 0) as faturamento,
        COALESCE(avg(o.value) FILTER (WHERE o.status = 'concluido'), 0) as ticket_medio
      FROM crm_diaristas d
      LEFT JOIN crm_orders o ON o.diarista_id = d.id ${dateFilter.replace(/AND o\./g, 'AND o.')}
      WHERE d.status = 'ativa'
      GROUP BY d.id, d.name, d.phone
      ORDER BY faturamento DESC
    `)

    // Serviços mais pedidos
    const servicosPorTipo = await query(`
      SELECT
        o.service_type,
        count(*) as total,
        COALESCE(sum(o.value), 0) as valor_total
      FROM crm_orders o
      WHERE o.service_type IS NOT NULL ${dateFilter}
      GROUP BY o.service_type
      ORDER BY total DESC
    `)

    // Contatos: conversão
    const conversao = await query(`
      SELECT
        count(*) as total_contatos,
        count(*) FILTER (WHERE status = 'cliente') as clientes,
        count(*) FILTER (WHERE is_recurring = true) as recorrentes,
        count(*) FILTER (WHERE status = 'perdido') as perdidos
      FROM crm_contacts
    `)

    // Pedidos por status
    const pedidosPorStatus = await query(`
      SELECT status, count(*) as total, COALESCE(sum(value), 0) as valor
      FROM crm_orders
      WHERE 1=1 ${dateFilter.replace(/o\./g, '')}
      GROUP BY status
      ORDER BY total DESC
    `)

    // Pagamentos
    const pagamentos = await query(`
      SELECT
        COALESCE(payment_status, 'pendente') as status,
        count(*) as total,
        COALESCE(sum(value), 0) as valor
      FROM crm_orders
      WHERE 1=1 ${dateFilter.replace(/o\./g, '')}
      GROUP BY payment_status
    `)

    return NextResponse.json({
      resumo: resumo.rows[0],
      faturamentoDiario: faturamentoDiario.rows,
      rankingDiaristas: rankingDiaristas.rows,
      servicosPorTipo: servicosPorTipo.rows,
      conversao: conversao.rows[0],
      pedidosPorStatus: pedidosPorStatus.rows,
      pagamentos: pagamentos.rows,
    })
  } catch (error) {
    console.error('Error fetching relatorios:', error.message)
    return NextResponse.json({ error: 'Erro ao buscar relatórios', detail: error.message }, { status: 500 })
  }
}
