export type Gateway = 'transbank' | 'flow' | 'mercadopago'
export type Modo = 'sandbox' | 'production'

export interface PaymentConfig {
  id: string
  gateway: Gateway
  nombre: string
  habilitado: boolean
  modo: Modo
  credenciales: Record<string, string>
}

export const GATEWAY_FIELDS: Record<Gateway, { label: string; fields: { key: string; label: string; placeholder: string; secret?: boolean }[] }> = {
  transbank: {
    label: 'Transbank WebPay Plus',
    fields: [
      { key: 'commerce_code', label: 'Código de Comercio', placeholder: '597055555532' },
      { key: 'api_key', label: 'API Key', placeholder: 'tu-api-key', secret: true },
    ],
  },
  flow: {
    label: 'Flow',
    fields: [
      { key: 'api_key', label: 'API Key', placeholder: 'tu-api-key' },
      { key: 'secret_key', label: 'Secret Key', placeholder: 'tu-secret-key', secret: true },
    ],
  },
  mercadopago: {
    label: 'Mercado Pago',
    fields: [
      { key: 'access_token', label: 'Access Token', placeholder: 'APP_USR-... (usa TEST-... para sandbox)', secret: true },
      { key: 'public_key', label: 'Public Key', placeholder: 'APP_USR-...' },
      { key: 'webhook_secret', label: 'Webhook Secret (opcional)', placeholder: 'Desde Developer Dashboard → Integraciones', secret: true },
    ],
  },
}
