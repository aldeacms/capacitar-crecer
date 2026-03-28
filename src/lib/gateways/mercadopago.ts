/**
 * Mercado Pago — Checkout Pro — usando mercadopago@2.12.0
 *
 * Sandbox: usar access_token con prefijo TEST- (desde developer dashboard de MP)
 * Producción: access_token real de producción
 *
 * SDK v2 tiene API diferente a v1: usa clases instanciadas (no métodos estáticos).
 *
 * Docs: https://www.mercadopago.cl/developers/es/docs/checkout-pro/integration-configuration/integrate-checkout-pro
 */

import { MercadoPagoConfig, Preference } from 'mercadopago'
import type { CreatePaymentParams, CreatePaymentResult, ConfirmPaymentParams, ConfirmPaymentResult } from './types'

export async function createMercadoPagoPayment(params: CreatePaymentParams): Promise<CreatePaymentResult> {
  const { pagoId, monto, descripcion, email, returnUrl, webhookUrl, credenciales } = params

  if (!credenciales.access_token) {
    throw new Error('Mercado Pago: access_token no configurado')
  }

  const client = new MercadoPagoConfig({ accessToken: credenciales.access_token })
  const preferenceClient = new Preference(client)

  const result = await preferenceClient.create({
    body: {
      items: [
        {
          id: pagoId,
          title: descripcion,
          quantity: 1,
          unit_price: monto,
          currency_id: 'CLP',
        },
      ],
      payer: { email },
      back_urls: {
        success: `${returnUrl}?status=success`,
        failure: `${returnUrl}?status=failure`,
        pending: `${returnUrl}?status=pending`,
      },
      auto_return: 'approved',
      notification_url: webhookUrl,
      external_reference: pagoId,
    },
  })

  if (!result.id) {
    throw new Error('Mercado Pago: no se recibió ID de preferencia')
  }

  // sandbox_init_point para tokens TEST-, init_point para producción
  const isSandbox = credenciales.access_token.startsWith('TEST-')
  const redirectUrl = isSandbox
    ? (result.sandbox_init_point ?? result.init_point ?? '')
    : (result.init_point ?? '')

  if (!redirectUrl) {
    throw new Error('Mercado Pago: no se recibió URL de pago')
  }

  return {
    redirectUrl,
    gatewayOrderId: result.id,
  }
}

export async function confirmMercadoPagoPayment(params: ConfirmPaymentParams): Promise<ConfirmPaymentResult> {
  const { gatewayData, credenciales } = params

  const paymentId = gatewayData.payment_id
  const status = gatewayData.status

  // El usuario canceló o fue rechazado antes de completar
  if (status === 'failure') {
    return { aprobado: false, gatewayOrderId: '', mensaje: 'Pago rechazado por Mercado Pago' }
  }

  if (status === 'pending' || !paymentId) {
    return { aprobado: false, gatewayOrderId: paymentId ?? '', mensaje: 'Pago pendiente de acreditación' }
  }

  if (!credenciales.access_token) {
    throw new Error('Mercado Pago: access_token no configurado')
  }

  // Verificar el pago directamente en la API de MP
  const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${credenciales.access_token}` },
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Mercado Pago verify error: ${err}`)
  }

  const data = await response.json()
  const aprobado = data.status === 'approved'

  return {
    aprobado,
    gatewayOrderId: String(paymentId),
    monto: data.transaction_amount,
    mensaje: aprobado ? 'Pago aprobado' : `Estado: ${data.status} — ${data.status_detail}`,
  }
}

/**
 * Verificar firma del webhook de Mercado Pago (x-signature header)
 */
export function verifyMercadoPagoWebhook(
  xSignature: string,
  xRequestId: string,
  dataId: string,
  webhookSecret: string
): boolean {
  const parts = Object.fromEntries(
    xSignature.split(',').map((part) => part.split('=') as [string, string])
  )
  const ts = parts['ts']
  const v1 = parts['v1']

  if (!ts || !v1) return false

  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`

  const crypto = require('crypto') as typeof import('crypto')
  const computed = crypto.createHmac('sha256', webhookSecret).update(manifest).digest('hex')

  return computed === v1
}
