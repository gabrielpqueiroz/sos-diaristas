import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

// GET /api/dashboard/contatos/[id] - Contact detail with conversation history
export async function GET(request, { params }) {
  try {
    const { id } = params

    // Get contact
    const contact = await query('SELECT * FROM crm_contacts WHERE id = $1', [id])
    if (contact.rows.length === 0) {
      return NextResponse.json({ error: 'Contato não encontrado' }, { status: 404 })
    }

    const c = contact.rows[0]

    // Get conversation history (last 100 messages)
    const messages = await query(
      `SELECT id, session_id, message->>'type' as type, message->>'content' as content
       FROM n8n_chat_histories
       WHERE session_id = $1
       ORDER BY id DESC
       LIMIT 100`,
      [c.session_id]
    )

    // Get orders for this contact
    const orders = await query(
      `SELECT o.*, d.name as diarista_name
       FROM crm_orders o
       LEFT JOIN crm_diaristas d ON d.id = o.diarista_id
       WHERE o.contact_id = $1
       ORDER BY o.created_at DESC`,
      [id]
    )

    // Get follow-ups
    const followups = await query(
      'SELECT * FROM crm_followups WHERE contact_id = $1 ORDER BY created_at DESC',
      [id]
    )

    return NextResponse.json({
      contact: c,
      messages: messages.rows.reverse(), // oldest first
      orders: orders.rows,
      followups: followups.rows,
    })
  } catch (error) {
    console.error('Error fetching contact:', error)
    return NextResponse.json({ error: 'Erro ao buscar contato' }, { status: 500 })
  }
}

// PATCH /api/dashboard/contatos/[id] - Update contact
export async function PATCH(request, { params }) {
  try {
    const { id } = params
    const body = await request.json()
    const fields = ['name', 'address', 'neighborhood', 'city', 'status', 'notes', 'follow_up_date', 'follow_up_note']

    const updates = []
    const values = [id]
    let idx = 2

    for (const field of fields) {
      if (body[field] !== undefined) {
        updates.push(`${field} = $${idx++}`)
        values.push(body[field])
      }
    }

    if (body.tags !== undefined) {
      updates.push(`tags = $${idx++}`)
      values.push(body.tags)
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'Nenhum campo para atualizar' }, { status: 400 })
    }

    updates.push('updated_at = now()')

    const result = await query(
      `UPDATE crm_contacts SET ${updates.join(', ')} WHERE id = $1 RETURNING *`,
      values
    )

    return NextResponse.json({ contact: result.rows[0] })
  } catch (error) {
    console.error('Error updating contact:', error)
    return NextResponse.json({ error: 'Erro ao atualizar contato' }, { status: 500 })
  }
}
