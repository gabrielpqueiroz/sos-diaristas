import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

// PATCH /api/dashboard/pedidos/[id] - Update order
export async function PATCH(request, { params }) {
  try {
    const { id } = params
    const body = await request.json()
    const fields = ['status', 'service_type', 'scheduled_date', 'scheduled_time', 'address', 'diarista_id', 'value', 'payment_status', 'notes']

    const updates = []
    const values = [id]
    let idx = 2

    for (const field of fields) {
      if (body[field] !== undefined) {
        updates.push(`${field} = $${idx++}`)
        values.push(body[field] || null)
      }
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'Nenhum campo para atualizar' }, { status: 400 })
    }

    updates.push('updated_at = now()')

    const result = await query(
      `UPDATE crm_orders SET ${updates.join(', ')} WHERE id = $1
       RETURNING *,
         (SELECT name FROM crm_contacts WHERE id = crm_orders.contact_id) as contact_name,
         (SELECT phone FROM crm_contacts WHERE id = crm_orders.contact_id) as contact_phone,
         (SELECT name FROM crm_diaristas WHERE id = crm_orders.diarista_id) as diarista_name`,
      values
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })
    }

    // Update contact stats
    const order = result.rows[0]
    if (order.contact_id) {
      await query(`
        UPDATE crm_contacts SET
          total_orders = (SELECT count(*) FROM crm_orders WHERE contact_id = $1),
          total_revenue = (SELECT COALESCE(sum(value), 0) FROM crm_orders WHERE contact_id = $1 AND status = 'concluido'),
          status = CASE WHEN $2 = 'agendado' OR $2 = 'confirmado' OR $2 = 'diarista_atribuida' OR $2 = 'em_andamento' THEN 'agendado'
                        WHEN $2 = 'concluido' THEN 'cliente'
                        ELSE status END,
          updated_at = now()
        WHERE id = $1
      `, [order.contact_id, body.status || order.status])
    }

    return NextResponse.json({ order: result.rows[0] })
  } catch (error) {
    console.error('Error updating order:', error)
    return NextResponse.json({ error: 'Erro ao atualizar pedido' }, { status: 500 })
  }
}

// DELETE /api/dashboard/pedidos/[id]
export async function DELETE(request, { params }) {
  try {
    const { id } = params
    await query('DELETE FROM crm_orders WHERE id = $1', [id])
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao excluir pedido' }, { status: 500 })
  }
}
