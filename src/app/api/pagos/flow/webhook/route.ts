import { NextRequest, NextResponse } from 'next/server'
import { getPaymentConfigInternal } from '@/actions/pagos-config'
import { confirmFlowPayment } from '@/lib/gateways/flow'
import { confirmarPago } from '@/actions/pago-iniciar'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

/**
 * Webhook server-to-server de Flow (urlConfirmation).
 * Flow envía un POST con el token. Debemos responder HTTP 200 en < 15 segundos.
 * Según la doc, este endpoint puede recibir la confirmación ANTES que el return.
 */
export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const pagoId = searchParams.get('pago_id')

  let token: string | null = null
  try {
    const body = await req.formData()
    token = body.get('token') as string | null
  } catch {
    // ignorar error al parsear
  }

  if (!pagoId || !token) {
    return NextResponse.json({ error: 'datos_incompletos' }, { status: 400 })
  }

  const admin = getSupabaseAdmin()
  const { data: pago } = await admin
    .from('pagos')
    .select('estado, modo')
    .eq('id', pagoId)
    .single()

  if (!pago) {
    return NextResponse.json({ error: 'pago_no_encontrado' }, { status: 404 })
  }

  // Idempotente: si ya está procesado, responder OK
  if (pago.estado !== 'pendiente') {
    return NextResponse.json({ ok: true })
  }

  const config = await getPaymentConfigInternal('flow')
  if (!config) {
    return NextResponse.json({ error: 'gateway_no_configurado' }, { status: 500 })
  }

  try {
    const result = await confirmFlowPayment({
      pagoId,
      gatewayData: { token },
      modo: pago.modo as 'sandbox' | 'production',
      credenciales: config.credenciales,
    })

    await confirmarPago(pagoId, result.aprobado, result.gatewayOrderId)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Flow webhook error:', err)
    // Responder 200 igualmente para evitar reintentos infinitos de Flow
    return NextResponse.json({ ok: false, error: String(err) })
  }
}
