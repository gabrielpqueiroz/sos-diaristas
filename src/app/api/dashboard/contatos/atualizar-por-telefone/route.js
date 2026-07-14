import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

// PATCH /api/dashboard/contatos/atualizar-por-telefone
// Chamado pelo agente SDR (n8n) para salvar nome/endereço confirmados pelo cliente
// Body: { phone: "5545998300956", name?, address?, neighborhood?, city?, observation? }
// Cria o contato se ainda não existir — o SDR coleta esses dados antes de fechar
// pedido, então o contato normalmente ainda não passou pelo /webhook/novo-pedido.

// O session_id chega ora com DDI (5545...), ora sem (45...). Aceita os dois.
function phoneVariants(phone) {
  const digits = String(phone).replace(/\D/g, '')
  const variants = new Set([digits])
  if (digits.startsWith('55')) variants.add(digits.slice(2))
  else variants.add(`55${digits}`)
  return [...variants]
}

export async function PATCH(request) {
  try {
    const raw = await request.json()
    const body = Array.isArray(raw) ? raw[0] : raw
    const { phone, name, address, neighborhood, city } = body
    const notes = body.observation || body.notes

    if (!phone) {
      return NextResponse.json({ error: 'Telefone obrigatório' }, { status: 400 })
    }

    const variants = phoneVariants(phone)
    const contact = await query(
      'SELECT id FROM crm_contacts WHERE session_id = ANY($1) LIMIT 1',
      [variants]
    )

    let contactId
    let created = false

    if (contact.rows.length > 0) {
      contactId = contact.rows[0].id
    } else {
      const digits = variants[0]
      const newContact = await query(
        `INSERT INTO crm_contacts (session_id, phone, name, status)
         VALUES ($1, $2, $3, 'novo')
         RETURNING id`,
        [digits, digits, name || 'Lead WhatsApp']
      )
      contactId = newContact.rows[0].id
      created = true
    }

    const updates = []
    const values = [contactId]
    let idx = 2

    if (name) { updates.push(`name = $${idx++}`); values.push(name) }
    if (address) { updates.push(`address = $${idx++}`); values.push(address) }
    if (neighborhood) { updates.push(`neighborhood = $${idx++}`); values.push(neighborhood) }
    if (city) { updates.push(`city = $${idx++}`); values.push(city) }
    if (notes) { updates.push(`notes = $${idx++}`); values.push(notes) }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'Nenhum campo para atualizar' }, { status: 400 })
    }

    updates.push('last_contact_at = now()')
    updates.push('updated_at = now()')

    const result = await query(
      `UPDATE crm_contacts SET ${updates.join(', ')} WHERE id = $1 RETURNING *`,
      values
    )

    return NextResponse.json({ ok: true, created, contact: result.rows[0] })
  } catch (error) {
    console.error('Error updating contact by phone:', error.message, error.stack)
    return NextResponse.json(
      { error: 'Erro ao atualizar contato', detail: error.message },
      { status: 500 }
    )
  }
}
