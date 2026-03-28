/**
 * Flow - Plataforma chilena de pagos
 *
 * Sandbox: https://sandbox.flow.cl/api
 * Producción: https://www.flow.cl/api
 *
 * Docs: https://www.flow.cl/docs/api.html
 */

import crypto from 'crypto'
import type { CreatePaymentParams, CreatePaymentResult, ConfirmPaymentParams, ConfirmPaymentResult } from './types'

const SANDBOX_BASE = 'https://sandbox.flow.cl/api'
const PROD_BASE = 'https://www.flow.cl/api'

function sign(params: Record<string, string>, secretKey: string): string {
  const keys = Object.keys(params).sort()
  const toSign = keys.map((k) => `${k}${params[k]}`).join('')
  return crypto.createHmac('sha256', secretKey).update(toSign).digest('hex')
}

export async function createFlowPayment(params: CreatePaymentParams): Promise<CreatePaymentResult> {
  const { pagoId, monto, descripcion, email, returnUrl, webhookUrl, modo, credenciales } = params

  if (!credenciales.api_key || !credenciales.secret_key) {
    throw new Error('Flow: credenciales no configuradas')
  }

  const base = modo === 'sandbox' ? SANDBOX_BASE : PROD_BASE
  const flowParams: Record<string, string> = {
    apiKey: credenciales.api_key,
    commerceOrder: pagoId.replace(/-/g, '').slice(0, 40),
    subject: descripcion.slice(0, 255),
    amount: String(monto),
    email,
    urlConfirmation: webhookUrl,
    urlReturn: returnUrl,
  }

  flowParams.s = sign(flowParams, credenciales.secret_key)

  const body = new URLSearchParams(flowParams)
  const response = await fetch(`${base}/payment/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Flow create error: ${err}`)
  }

  const data = await response.json()
  if (data.code && data.code !== 200) {
    throw new Error(`Flow: ${data.message}`)
  }

  return {
    redirectUrl: `${data.url}?token=${data.token}`,
    gatewayOrderId: data.token,
  }
}

export async function confirmFlowPayment(params: ConfirmPaymentParams): Promise<ConfirmPaymentResult> {
  const { gatewayData, modo, credenciales } = params

  const token = gatewayData.token
  if (!token) {
    return { aprobado: false, gatewayOrderId: '', mensaje: 'Token no recibido' }
  }

  const base = modo === 'sandbox' ? SANDBOX_BASE : PROD_BASE
  const queryParams: Record<string, string> = {
    apiKey: credenciales.api_key,
    token,
  }
  queryParams.s = sign(queryParams, credenciales.secret_key)

  const qs = new URLSearchParams(queryParams).toString()
  const response = await fetch(`${base}/payment/getStatus?${qs}`)

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Flow getStatus error: ${err}`)
  }

  const data = await response.json()
  // status: 1=pendiente, 2=pagado, 3=rechazado, 4=anulado
  const aprobado = data.status === 2

  return {
    aprobado,
    gatewayOrderId: token,
    monto: data.amount,
    mensaje: aprobado ? 'Pago aprobado' : `Estado Flow: ${data.status}`,
  }
}
