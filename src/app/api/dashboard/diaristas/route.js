import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

// GET /api/dashboard/diaristas
export async function GET() {
  try {
    const result = await query(`
      SELECT d.*,
        (SELECT count(*) FROM crm_orders o WHERE o.diarista_id = d.id) as total_orders,
        (SELECT count(*) FROM crm_orders o WHERE o.diarista_id = d.id AND o.status IN ('agendado','confirmado','diarista_atribuida','em_andamento')) as active_orders
      FROM crm_diaristas d
      ORDER BY d.name ASC
    `)
    return NextResponse.json({ diaristas: result.rows })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar diaristas' }, { status: 500 })
  }
}

// POST /api/dashboard/diaristas
export async function POST(request) {
  try {
    const body = await request.json()
    const { name, phone, specialties, notes } = body

    const result = await query(
      `INSERT INTO crm_diaristas (name, phone, specialties, notes) VALUES ($1, $2, $3, $4) RETURNING *`,
      [name, phone || null, specialties || null, notes || null]
    )
    return NextResponse.json({ diarista: result.rows[0] })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao criar diarista' }, { status: 500 })
  }
}

// PATCH /api/dashboard/diaristas - Update
export async function PATCH(request) {
  try {
    const body = await request.json()
    const { id, name, phone, status, specialties, notes } = body

    const result = await query(
      `UPDATE crm_diaristas SET
        name = COALESCE($2, name),
        phone = COALESCE($3, phone),
        status = COALESCE($4, status),
        specialties = COALESCE($5, specialties),
        notes = COALESCE($6, notes)
       WHERE id = $1
       RETURNING *`,
      [id, name, phone, status, specialties, notes]
    )
    return NextResponse.json({ diarista: result.rows[0] })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao atualizar diarista' }, { status: 500 })
  }
}

// DELETE /api/dashboard/diaristas
export async function DELETE(request) {
  try {
    const { id } = await request.json()
    await query('DELETE FROM crm_diaristas WHERE id = $1', [id])
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao excluir diarista' }, { status: 500 })
  }
}
