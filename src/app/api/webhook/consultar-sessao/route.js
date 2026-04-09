import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

// GET /api/webhook/consultar-sessao?session_id=45998300456
// Chamado pelo n8n para buscar dados completos do cliente por session_id
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('session_id')

    if (!sessionId) {
      return NextResponse.json({ error: 'session_id obrigatório' }, { status: 400 })
    }

    // Buscar contato pelo session_id
    const contact = await query(
      `SELECT id, session_id, name, phone, address, neighborhood, city,
              status, is_recurring, total_orders, total_revenue, last_contact_at, created_at
       FROM crm_contacts
       WHERE session_id = $1
       LIMIT 1`,
      [sessionId]
    )

    if (contact.rows.length === 0) {
      return NextResponse.json({ found: false, message: 'Cliente não encontrado no CRM' })
    }

    const c = contact.rows[0]

    // Buscar pedidos do cliente
    const orders = await query(
      `SELECT id, service_type, status, scheduled_date, scheduled_time,
              address, value, payment_status, notes, created_at
       FROM crm_orders
       WHERE contact_id = $1
       ORDER BY created_at DESC
       LIMIT 10`,
      [c.id]
    )

    // Buscar últimas mensagens do chat (n8n)
    const chatHistory = await query(
      `SELECT message, type, created_at
       FROM n8n_chat_histories
       WHERE session_id = $1
       ORDER BY created_at DESC
       LIMIT 20`,
      [sessionId]
    )

    return NextResponse.json({
      found: true,
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
      orders: orders.rows.map(o => ({
        id: o.id,
        service_type: o.service_type,
        status: o.status,
        scheduled_date: o.scheduled_date,
        scheduled_time: o.scheduled_time,
        address: o.address,
        value: o.value,
        payment_status: o.payment_status,
        notes: o.notes,
      })),
      chat_history: chatHistory.rows.map(h => ({
        message: h.message,
        type: h.type,
        created_at: h.created_at,
      })),
    })
  } catch (error) {
    console.error('Error consulting session:', error.message, error.stack)
    return NextResponse.json({ error: 'Erro ao consultar sessão', detail: error.message }, { status: 500 })
  }
}
