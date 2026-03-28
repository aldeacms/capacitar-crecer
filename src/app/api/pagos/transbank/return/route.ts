import { NextRequest, NextResponse } from 'next/server'
import { getPaymentConfigInternal } from '@/actions/pagos-config'
import { confirmTransbankPayment } from '@/lib/gateways/transbank'
import { confirmarPago } from '@/actions/pago-iniciar'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function POST(req: NextRequest) {
  return handleReturn(req)
}

export async function GET(req: NextRequest) {
  return handleReturn(req)
}

async function handleReturn(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const pagoId = searchParams.get('pago_id')

  if (!pagoId) {
    return NextResponse.redirect(new URL('/pago/error?msg=pago_no_encontrado', req.url))
  }

  // Obtener datos del pago para saber el modo
  const admin = getSupabaseAdmin()
  const { data: pago } = await admin
    .from('pagos')
    .select('modo, matricula_id')
    .eq('id', pagoId)
    .single()

  if (!pago) {
    return NextResponse.redirect(new URL('/pago/error?msg=pago_no_encontrado', req.url))
  }

  const config = await getPaymentConfigInternal('transbank')
  const credenciales = config?.credenciales ?? {}

  // Transbank envía token_ws vía POST o GET dependiendo del flujo
  let token_ws: string | null = null
  if (req.method === 'POST') {
    try {
      const body = await req.formData()
      token_ws = body.get('token_ws') as string | null
    } catch {
      token_ws = searchParams.get('token_ws')
    }
  } else {
    token_ws = searchParams.get('token_ws')
  }

  if (!token_ws) {
    // Usuario canceló
    await confirmarPago(pagoId, false)
    return NextResponse.redirect(new URL('/pago/cancelado', req.url))
  }

  try {
    const result = await confirmTransbankPayment({
      pagoId,
      gatewayData: { token_ws },
      modo: pago.modo as 'sandbox' | 'production',
      credenciales,
    })

    await confirmarPago(pagoId, result.aprobado, result.gatewayOrderId)

    if (result.aprobado) {
      return NextResponse.redirect(new URL(`/pago/exitoso?pago_id=${pagoId}`, req.url))
    } else {
      return NextResponse.redirect(new URL(`/pago/rechazado?msg=${encodeURIComponent(result.mensaje ?? '')}`, req.url))
    }
  } catch (err) {
    console.error('Transbank return error:', err)
    return NextResponse.redirect(new URL('/pago/error?msg=error_confirmando', req.url))
  }
}
