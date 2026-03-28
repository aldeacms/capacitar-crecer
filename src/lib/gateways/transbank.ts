/**
 * Transbank WebPay Plus — usando transbank-sdk@6.1.1
 *
 * IMPORTANTE sobre el redirect:
 * Transbank requiere un POST form (no GET redirect).
 * Este módulo devuelve la URL y el token por separado.
 * La ruta /api/pagos/transbank/redirect sirve una página HTML
 * que auto-envía el formulario POST.
 *
 * Sandbox: credenciales públicas de integración de Transbank.
 * Producción: commerce_code y api_key provistos por Transbank.
 *
 * Docs: https://www.transbankdevelopers.cl/referencia/webpay
 */

import {
  WebpayPlus,
  Options,
  Environment,
  IntegrationCommerceCodes,
  IntegrationApiKeys,
} from 'transbank-sdk'
import type { CreatePaymentParams, CreatePaymentResult, ConfirmPaymentParams, ConfirmPaymentResult } from './types'

function buildTransaction(modo: 'sandbox' | 'production', credenciales: Record<string, string>) {
  if (modo === 'sandbox') {
    return new WebpayPlus.Transaction(
      new Options(
        IntegrationCommerceCodes.WEBPAY_PLUS,
        IntegrationApiKeys.WEBPAY,
        Environment.Integration
      )
    )
  }

  if (!credenciales.commerce_code || !credenciales.api_key) {
    throw new Error('Transbank: commerce_code y api_key son obligatorios en modo producción')
  }

  return new WebpayPlus.Transaction(
    new Options(
      credenciales.commerce_code,
      credenciales.api_key,
      Environment.Production
    )
  )
}

export async function createTransbankPayment(params: CreatePaymentParams): Promise<CreatePaymentResult> {
  const { pagoId, monto, returnUrl, modo, credenciales } = params

  const tx = buildTransaction(modo, credenciales)

  const buyOrder = pagoId.replace(/-/g, '').slice(0, 26)
  const sessionId = pagoId

  const response = await tx.create(buyOrder, sessionId, monto, returnUrl)

  // Transbank devuelve { token, url }
  // El redirect DEBE ser un POST form, no un GET redirect.
  // Usamos /api/pagos/transbank/redirect como intermediario.
  const encodedUrl = encodeURIComponent(response.url)
  const encodedToken = encodeURIComponent(response.token)

  return {
    // URL de nuestra página intermediaria que hace el POST form
    redirectUrl: `/api/pagos/transbank/redirect?tbk_url=${encodedUrl}&tbk_token=${encodedToken}`,
    gatewayOrderId: response.token,
  }
}

export async function confirmTransbankPayment(params: ConfirmPaymentParams): Promise<ConfirmPaymentResult> {
  const { gatewayData, modo, credenciales } = params

  const token = gatewayData.token_ws

  if (!token) {
    // TBK_TOKEN presente → usuario canceló o fue rechazado por Transbank antes de iniciar
    return { aprobado: false, gatewayOrderId: '', mensaje: 'Pago cancelado o rechazado por Transbank' }
  }

  const tx = buildTransaction(modo, credenciales)

  const result = await tx.commit(token)

  const aprobado = result.response_code === 0

  return {
    aprobado,
    gatewayOrderId: token,
    monto: result.amount,
    mensaje: aprobado
      ? 'Pago aprobado'
      : `Pago rechazado (response_code: ${result.response_code})`,
  }
}
