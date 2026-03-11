import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

// POST /api/webhook/novo-pedido
// Chamado pelo n8n quando o SDR fecha um agendamento no WhatsApp
// Body esperado:
// {
//   phone: "5545998300956",          ← telefone do cliente (session_id)
//   service_type: "Limpeza residencial",
//   scheduled_date: "2026-03-15",   ← data do agendamento (YYYY-MM-DD)
//   scheduled_time: "08:00",        ← horário (HH:MM)
//   address: "Rua X, 123",          ← endereço (opcional, se o cliente informou)
//   value: 250,                      ← valor combinado (opcional)
//   notes: "Cliente pediu atenção especial na cozinha" ← observações (opcional)
// }

export async function POST(request) {
  try {
    const body = await request.json()
    const { phone, service_type, scheduled_date, scheduled_time, address, value, notes } = body

    if (!phone) {
      return NextResponse.json({ error: 'Telefone obrigatório' }, { status: 400 })
    }

    // 1. Buscar ou criar contato pelo telefone (session_id)
    let contactResult = await query(
      'SELECT id FROM crm_contacts WHERE session_id = $1 LIMIT 1',
      [phone]
    )

    let contactId = null
    if (contactResult.rows.length > 0) {
      contactId = contactResult.rows[0].id
    } else {
      // Criar contato novo se não existe
      const newContact = await query(
        `INSERT INTO crm_contacts (session_id, phone, name, status)
         VALUES ($1, $2, $3, 'agendado')
         RETURNING id`,
        [phone, phone, 'Lead WhatsApp']
      )
      contactId = newContact.rows[0].id
    }

    // 2. Criar o pedido
    const orderResult = await query(
      `INSERT INTO crm_orders (contact_id, session_id, service_type, status, scheduled_date, scheduled_time, address, value, notes)
       VALUES ($1, $2, $3, 'agendado', $4, $5, $6, $7, $8)
       RETURNING *`,
      [contactId, phone, service_type || 'Limpeza', scheduled_date || null, scheduled_time || null, address || null, value || null, notes || null]
    )

    // 3. Atualizar stats do contato
    await query(`
      UPDATE crm_contacts SET
        status = 'agendado',
        total_orders = (SELECT count(*) FROM crm_orders WHERE contact_id = $1),
        updated_at = now()
      WHERE id = $1
    `, [contactId])

    // 4. Se veio endereço, salvar no contato
    if (address) {
      await query(
        'UPDATE crm_contacts SET address = $2, updated_at = now() WHERE id = $1 AND (address IS NULL OR address = \'\')',
        [contactId, address]
      )
    }

    return NextResponse.json({
      ok: true,
      order_id: orderResult.rows[0].id,
      contact_id: contactId,
    })
  } catch (error) {
    console.error('Webhook novo-pedido error:', error)
    return NextResponse.json({ error: 'Erro ao criar pedido' }, { status: 500 })
  }
}
