import { NextRequest, NextResponse } from 'next/server'
import { getPaymentConfigInternal } from '@/actions/pagos-config'
import { confirmFlowPayment } from '@/lib/gateways/flow'
import { confirmarPago } from '@/actions/pago-iniciar'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

/**
 * Return URL de Flow — el usuario llega aquí tras el pago.
 *
 * NOTA: según la doc de Flow, el webhook server-to-server (urlConfirmation)
 * puede llegar ANTES que el usuario. Si el pago ya fue confirmado por el webhook,
 * solo mostramos el resultado. Si no, consultamos el estado aquí también.
 */
async function handleReturn(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const pagoId = searchParams.get('pago_id')

  // Flow puede enviar el token tanto por GET como por POST
  let token = searchParams.get('token')
  if (!token && req.method === 'POST') {
    try {
      const body = await req.formData()
      token = body.get('token') as string | null
    } catch {
      // ignorar
    }
  }

  if (!pagoId) {
    return NextResponse.redirect(new URL('/pago/error?msg=datos_incompletos', req.url))
  }

  const admin = getSupabaseAdmin()

  // Verificar si el pago ya fue procesado por el webhook
  const { data: pago } = await admin
    .from('pagos')
    .select('estado, modo')
    .eq('id', pagoId)
    .single()

  if (!pago) {
    return NextResponse.redirect(new URL('/pago/error?msg=pago_no_encontrado', req.url))
  }

  // Si el webhook ya confirmó, redirigir directamente
  if (pago.estado === 'aprobado') {
    return NextResponse.redirect(new URL(`/pago/exitoso?pago_id=${pagoId}`, req.url))
  }
  if (pago.estado === 'rechazado' || pago.estado === 'anulado') {
    return NextResponse.redirect(new URL('/pago/rechazado?msg=Pago+no+aprobado', req.url))
  }

  // Aún pendiente — consultar estado en Flow
  if (!token) {
    return NextResponse.redirect(new URL('/pago/error?msg=token_no_recibido', req.url))
  }

  const config = await getPaymentConfigInternal('flow')
  if (!config) {
    return NextResponse.redirect(new URL('/pago/error?msg=gateway_no_configurado', req.url))
  }

  try {
    const result = await confirmFlowPayment({
      pagoId,
      gatewayData: { token },
      modo: pago.modo as 'sandbox' | 'production',
      credenciales: config.credenciales,
    })

    await confirmarPago(pagoId, result.aprobado, result.gatewayOrderId)

    if (result.aprobado) {
      return NextResponse.redirect(new URL(`/pago/exitoso?pago_id=${pagoId}`, req.url))
    } else {
      return NextResponse.redirect(new URL(`/pago/rechazado?msg=${encodeURIComponent(result.mensaje ?? '')}`, req.url))
    }
  } catch (err) {
    console.error('Flow return error:', err)
    return NextResponse.redirect(new URL('/pago/error?msg=error_confirmando', req.url))
  }
}

export async function GET(req: NextRequest) { return handleReturn(req) }
export async function POST(req: NextRequest) { return handleReturn(req) }
