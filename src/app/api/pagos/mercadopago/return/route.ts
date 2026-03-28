import { NextRequest, NextResponse } from 'next/server'
import { getPaymentConfigInternal } from '@/actions/pagos-config'
import { confirmMercadoPagoPayment } from '@/lib/gateways/mercadopago'
import { confirmarPago } from '@/actions/pago-iniciar'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const pagoId = searchParams.get('pago_id')
  const paymentId = searchParams.get('payment_id')
  const status = searchParams.get('status')

  if (!pagoId) {
    return NextResponse.redirect(new URL('/pago/error?msg=pago_no_encontrado', req.url))
  }

  if (status === 'failure') {
    await confirmarPago(pagoId, false)
    return NextResponse.redirect(new URL('/pago/rechazado?msg=Pago+rechazado', req.url))
  }

  if (status === 'pending') {
    return NextResponse.redirect(new URL(`/pago/pendiente?pago_id=${pagoId}`, req.url))
  }

  const admin = getSupabaseAdmin()
  const { data: pago } = await admin
    .from('pagos')
    .select('modo')
    .eq('id', pagoId)
    .single()

  if (!pago) {
    return NextResponse.redirect(new URL('/pago/error?msg=pago_no_encontrado', req.url))
  }

  const config = await getPaymentConfigInternal('mercadopago')
  const credenciales = config?.credenciales ?? {}

  try {
    const result = await confirmMercadoPagoPayment({
      pagoId,
      gatewayData: { payment_id: paymentId ?? '', status: status ?? '' },
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
    console.error('MercadoPago return error:', err)
    return NextResponse.redirect(new URL('/pago/error?msg=error_confirmando', req.url))
  }
}
