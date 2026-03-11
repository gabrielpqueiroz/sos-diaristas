import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

// PATCH /api/dashboard/contatos/atualizar-por-telefone
// Chamado pelo agente SDR (n8n) para salvar nome/endereço confirmados pelo cliente
// Body: { phone: "5545998300956", name?: "Maria Silva", address?: "Rua X, 123", neighborhood?: "Centro", city?: "Foz do Iguaçu" }
export async function PATCH(request) {
  try {
    const body = await request.json()
    const { phone, name, address, neighborhood, city } = body

    if (!phone) {
      return NextResponse.json({ error: 'Telefone obrigatório' }, { status: 400 })
    }

    // Find contact by session_id (phone)
    const contact = await query('SELECT id FROM crm_contacts WHERE session_id = $1 LIMIT 1', [phone])

    if (contact.rows.length === 0) {
      return NextResponse.json({ error: 'Contato não encontrado' }, { status: 404 })
    }

    const contactId = contact.rows[0].id
    const updates = []
    const values = [contactId]
    let idx = 2

    if (name) { updates.push(`name = $${idx++}`); values.push(name) }
    if (address) { updates.push(`address = $${idx++}`); values.push(address) }
    if (neighborhood) { updates.push(`neighborhood = $${idx++}`); values.push(neighborhood) }
    if (city) { updates.push(`city = $${idx++}`); values.push(city) }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'Nenhum campo para atualizar' }, { status: 400 })
    }

    updates.push('updated_at = now()')

    const result = await query(
      `UPDATE crm_contacts SET ${updates.join(', ')} WHERE id = $1 RETURNING *`,
      values
    )

    return NextResponse.json({ ok: true, contact: result.rows[0] })
  } catch (error) {
    console.error('Error updating contact by phone:', error)
    return NextResponse.json({ error: 'Erro ao atualizar contato' }, { status: 500 })
  }
}
