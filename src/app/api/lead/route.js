import { NextResponse } from 'next/server'
import crypto from 'crypto'

// ─── Configurações Meta CAPI ────────────────────────────────────────────────
const META_PIXEL_ID = process.env.META_PIXEL_ID
const META_ACCESS_TOKEN = process.env.META_CAPI_ACCESS_TOKEN
// ────────────────────────────────────────────────────────────────────────────

function hash(value) {
  if (!value) return undefined
  return crypto.createHash('sha256').update(value.trim().toLowerCase()).digest('hex')
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { name, phone, email } = body

    // Formata telefone: remove tudo que não é número
    const phoneClean = phone?.replace(/\D/g, '')

    const eventTime = Math.floor(Date.now() / 1000)

    const payload = {
      data: [
        {
          event_name: 'Lead',
          event_time: eventTime,
          action_source: 'website',
          user_data: {
            // A Meta exige os dados hasheados com SHA-256
            ph: phoneClean ? [hash(`55${phoneClean}`)] : undefined,
            em: email ? [hash(email)] : undefined,
            fn: name ? [hash(name.split(' ')[0])] : undefined,
            ln: name?.split(' ').length > 1 ? [hash(name.split(' ').slice(1).join(' '))] : undefined,
            ct: [hash('foz do iguacu')],
            st: [hash('pr')],
            country: [hash('br')],
          },
          custom_data: {
            content_name: 'Formulario Landing Page',
            service: body.service || 'Não informado',
          },
        },
      ],
      // test_event_code: 'TEST12345', // Descomente para testar no Events Manager
    }

    // Remove campos undefined para não enviar dados vazios
    payload.data[0].user_data = Object.fromEntries(
      Object.entries(payload.data[0].user_data).filter(([_, v]) => v !== undefined)
    )

    if (!META_PIXEL_ID || !META_ACCESS_TOKEN) {
      console.warn('Meta CAPI: variáveis de ambiente não configuradas. Pulando envio.')
      return NextResponse.json({ ok: true, skipped: true })
    }

    const response = await fetch(
      `https://graph.facebook.com/v19.0/${META_PIXEL_ID}/events?access_token=${META_ACCESS_TOKEN}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    )

    const data = await response.json()

    if (!response.ok) {
      console.error('Meta CAPI error:', data)
      return NextResponse.json({ ok: false, error: data }, { status: 500 })
    }

    return NextResponse.json({ ok: true, events_received: data.events_received })
  } catch (error) {
    console.error('Lead API error:', error)
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }
}
