import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

// GET /api/webhook/consultar-contato?phone=45998300456
// Chamado pelo agente IA (n8n) para buscar dados do cliente no CRM
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const phone = searchParams.get('phone')

    if (!phone) {
      return NextResponse.json({ error: 'Telefone obrigatório' }, { status: 400 })
    }

    // Buscar contato pelo session_id
    const contact = await query(
      `SELECT id, session_id, name, phone, email, address, neighborhood, city, status, is_recurring, total_orders, total_revenue, last_contact_at, created_at
       FROM crm_contacts
       WHERE session_id = $1
       LIMIT 1`,
      [phone]
    )

    if (contact.rows.length === 0) {
      return NextResponse.json({ found: false, message: 'Cliente não encontrado no CRM' })
    }

    const c = contact.rows[0]

    // Buscar últimos pedidos do cliente
    const orders = await query(
      `SELECT id, service_type, status, scheduled_date, scheduled_time, address, value, payment_status, notes, created_at
       FROM crm_orders
       WHERE contact_id = $1
       ORDER BY created_at DESC
       LIMIT 5`,
      [c.id]
    )

    return NextResponse.json({
      found: true,
      contact: {
        name: c.name,
        phone: c.phone || c.session_id,
        email: c.email,
        address: c.address,
        neighborhood: c.neighborhood,
        city: c.city,
        status: c.status,
        is_recurring: c.is_recurring,
        total_orders: c.total_orders || 0,
        total_revenue: c.total_revenue || 0,
      },
      recent_orders: orders.rows.map(o => ({
        service_type: o.service_type,
        status: o.status,
        scheduled_date: o.scheduled_date,
        address: o.address,
        value: o.value,
        payment_status: o.payment_status,
      })),
    })
  } catch (error) {
    console.error('Error consulting contact:', error)
    return NextResponse.json({ error: 'Erro ao consultar contato', detail: error.message }, { status: 500 })
  }
}
