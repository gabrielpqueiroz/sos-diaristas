import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

function formatDate(date) {
  if (!date) return null
  const d = new Date(date)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

function buildResumo(contact, lastOrder) {
  const nome = contact.name || 'sem nome cadastrado'
  const totalOrders = contact.total_orders || 0
  const endereco = contact.address || (lastOrder && lastOrder.address) || null

  if (totalOrders > 0) {
    const tipo = contact.is_recurring ? 'Cliente recorrente' : 'Cliente'
    let resumo = `${tipo}. Nome: ${nome}. `
    resumo += endereco ? `Endereço: ${endereco}. ` : 'Sem endereço cadastrado. '
    resumo += `Já fez ${totalOrders} pedido${totalOrders > 1 ? 's' : ''}. `
    if (lastOrder) {
      resumo += `Último serviço: ${lastOrder.service_type || 'Limpeza'} em ${formatDate(lastOrder.scheduled_date)}.`
    }
    return resumo
  }

  let resumo = `Lead existente. Nome: ${nome}. Ainda não fez nenhum pedido. `
  resumo += endereco ? `Endereço: ${endereco}.` : 'Sem endereço cadastrado.'
  return resumo
}

// GET /api/webhook/consultar-sessao?session_id=45998300456
// Chamado pelo n8n para buscar dados do cliente por session_id
// Retorna resumo amigável para prompt de IA
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('session_id')

    if (!sessionId) {
      return NextResponse.json({ error: 'session_id obrigatório' }, { status: 400 })
    }

    const contact = await query(
      `SELECT id, session_id, name, phone, address, neighborhood, city,
              status, is_recurring, total_orders, total_revenue, last_contact_at, created_at
       FROM crm_contacts
       WHERE session_id = $1
       LIMIT 1`,
      [sessionId]
    )

    if (contact.rows.length === 0) {
      return NextResponse.json({
        found: false,
        resumo: 'Cliente novo, primeiro contato. Nenhum dado cadastrado ainda.',
        contact: null,
      })
    }

    const c = contact.rows[0]

    // Buscar último pedido para o resumo
    const lastOrderResult = await query(
      `SELECT service_type, scheduled_date, address
       FROM crm_orders
       WHERE contact_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [c.id]
    )
    const lastOrder = lastOrderResult.rows[0] || null

    const resumo = buildResumo(c, lastOrder)

    return NextResponse.json({
      found: true,
      resumo,
      contact: {
        id: c.id,
        session_id: c.session_id,
        name: c.name,
        phone: c.phone || c.session_id,
        address: c.address,
        neighborhood: c.neighborhood,
        city: c.city,
        status: c.status,
        is_recurring: c.is_recurring,
        total_orders: c.total_orders || 0,
        total_revenue: c.total_revenue || 0,
        last_contact_at: c.last_contact_at,
        created_at: c.created_at,
      },
    })
  } catch (error) {
    console.error('Error consulting session:', error.message, error.stack)
    return NextResponse.json({ error: 'Erro ao consultar sessão', detail: error.message }, { status: 500 })
  }
}
