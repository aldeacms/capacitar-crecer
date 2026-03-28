import { NextRequest, NextResponse } from 'next/server'
import { getPaymentConfigInternal } from '@/actions/pagos-config'
import { verifyMercadoPagoWebhook } from '@/lib/gateways/mercadopago'
import { confirmarPago } from '@/actions/pago-iniciar'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

/**
 * Webhook de Mercado Pago.
 *
 * MP envía un POST con el evento. Debemos responder HTTP 200/201 en < 22 segundos.
 * Para pagos: action = "payment.created" | "payment.updated", data.id = payment ID
 *
 * Verificación de firma: header x-signature + x-request-id
 * (el webhook secret se configura en el Developer Dashboard de MP)
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)

  if (!body || body.type !== 'payment') {
    // Otros tipos de notificaciones (merchant_order, etc.) — ignorar
    return NextResponse.json({ ok: true })
  }

  const paymentId = body?.data?.id
  if (!paymentId) {
    return NextResponse.json({ ok: true })
  }

  // Opcional: verificar firma si el secret está configurado
  const config = await getPaymentConfigInternal('mercadopago')
  if (config?.credenciales?.webhook_secret) {
    const xSignature = req.headers.get('x-signature') ?? ''
    const xRequestId = req.headers.get('x-request-id') ?? ''
    const isValid = verifyMercadoPagoWebhook(
      xSignature,
      xRequestId,
      String(paymentId),
      config.credenciales.webhook_secret
    )
    if (!isValid) {
      console.warn('MercadoPago webhook: firma inválida')
      return NextResponse.json({ error: 'firma_invalida' }, { status: 401 })
    }
  }

  // Verificar el pago en la API de MP para obtener external_reference (= pagoId)
  if (!config?.credenciales?.access_token) {
    return NextResponse.json({ ok: true })
  }

  try {
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${config.credenciales.access_token}` },
    })

    if (!response.ok) {
      console.error('MP webhook: error consultando pago', await response.text())
      return NextResponse.json({ ok: true })
    }

    const payment = await response.json()
    const pagoId = payment.external_reference

    if (!pagoId) {
      console.warn('MP webhook: pago sin external_reference')
      return NextResponse.json({ ok: true })
    }

    // Verificar que el pago existe y está pendiente
    const admin = getSupabaseAdmin()
    const { data: pago } = await admin
      .from('pagos')
      .select('estado')
      .eq('id', pagoId)
      .single()

    if (!pago || pago.estado !== 'pendiente') {
      return NextResponse.json({ ok: true })
    }

    const aprobado = payment.status === 'approved'
    await confirmarPago(pagoId, aprobado, String(paymentId))

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('MP webhook error:', err)
    return NextResponse.json({ ok: true }) // siempre 200 para evitar reintentos
  }
}
