import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

// GET /api/dashboard/contatos?page=1&limit=20&status=&search=
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status') || ''
    const search = searchParams.get('search') || ''
    const offset = (page - 1) * limit

    let where = 'WHERE 1=1'
    const params = []
    let paramIdx = 1

    if (status) {
      where += ` AND c.status = $${paramIdx++}`
      params.push(status)
    }

    if (search) {
      where += ` AND (c.name ILIKE $${paramIdx} OR c.phone ILIKE $${paramIdx})`
      params.push(`%${search}%`)
      paramIdx++
    }

    // Count total
    const countResult = await query(
      `SELECT count(*) as total FROM crm_contacts c ${where}`,
      params
    )
    const total = parseInt(countResult.rows[0].total)

    // Get contacts with message count
    const contacts = await query(
      `SELECT c.*,
        (SELECT count(*) FROM n8n_chat_histories h WHERE h.session_id = c.session_id) as total_messages,
        (SELECT count(*) FROM crm_orders o WHERE o.contact_id = c.id) as order_count
       FROM crm_contacts c
       ${where}
       ORDER BY c.last_contact_at DESC NULLS LAST
       LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
      [...params, limit, offset]
    )

    return NextResponse.json({
      contacts: contacts.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Error fetching contacts:', error)
    return NextResponse.json({ error: 'Erro ao buscar contatos' }, { status: 500 })
  }
}

// PATCH /api/dashboard/contatos - Update a contact
export async function PATCH(request) {
  try {
    const body = await request.json()
    const { id, name, address, neighborhood, status, notes, follow_up_date, follow_up_note, tags } = body

    const result = await query(
      `UPDATE crm_contacts SET
        name = COALESCE($2, name),
        address = COALESCE($3, address),
        neighborhood = COALESCE($4, neighborhood),
        status = COALESCE($5, status),
        notes = COALESCE($6, notes),
        follow_up_date = $7,
        follow_up_note = $8,
        tags = COALESCE($9, tags),
        updated_at = now()
       WHERE id = $1
       RETURNING *`,
      [id, name, address, neighborhood, status, notes, follow_up_date, follow_up_note, tags]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Contato não encontrado' }, { status: 404 })
    }

    return NextResponse.json({ contact: result.rows[0] })
  } catch (error) {
    console.error('Error updating contact:', error)
    return NextResponse.json({ error: 'Erro ao atualizar contato' }, { status: 500 })
  }
}
