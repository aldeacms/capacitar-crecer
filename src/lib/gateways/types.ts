export interface CreatePaymentParams {
  pagoId: string        // UUID del registro en tabla pagos
  monto: number         // en CLP entero
  descripcion: string
  email: string
  returnUrl: string     // URL a la que el gateway redirige tras el pago
  webhookUrl: string    // URL para notificaciones async
  modo: 'sandbox' | 'production'
  credenciales: Record<string, string>
}

export interface CreatePaymentResult {
  redirectUrl: string   // URL a la que redirigir al usuario
  gatewayOrderId: string
}

export interface ConfirmPaymentParams {
  pagoId: string
  gatewayData: Record<string, string>  // query params / body del gateway en el return
  modo: 'sandbox' | 'production'
  credenciales: Record<string, string>
}

export interface ConfirmPaymentResult {
  aprobado: boolean
  gatewayOrderId: string
  monto?: number
  mensaje?: string
}
