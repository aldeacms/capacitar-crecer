'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { CreditCard, Check, Eye, EyeOff, Loader2, Save, AlertTriangle } from 'lucide-react'
import { getPaymentConfigs, updatePaymentConfig } from '@/actions/pagos-config'
import { GATEWAY_FIELDS, type PaymentConfig, type Gateway, type Modo } from '@/lib/payment-constants'

const GATEWAY_ICONS: Record<Gateway, string> = {
  transbank: '🏦',
  flow: '💸',
  mercadopago: '🛒',
}

const GATEWAY_DESCRIPTIONS: Record<Gateway, string> = {
  transbank: 'El medio de pago más usado en Chile. Requiere afiliación con Transbank.',
  flow: 'Plataforma chilena de pagos online. Soporte para tarjetas y transferencias.',
  mercadopago: 'Disponible en Chile con tarjetas de crédito/débito y saldo MP.',
}

export default function PagosAdminPage() {
  const [configs, setConfigs] = useState<PaymentConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<Gateway | null>(null)
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({})

  // Local edits keyed by gateway
  const [edits, setEdits] = useState<Record<Gateway, Partial<PaymentConfig>>>({
    transbank: {}, flow: {}, mercadopago: {},
  })

  useEffect(() => {
    getPaymentConfigs().then((data) => {
      setConfigs(data)
      // Initialize edits with current values
      const init: Record<Gateway, Partial<PaymentConfig>> = { transbank: {}, flow: {}, mercadopago: {} }
      data.forEach((c) => {
        init[c.gateway] = { habilitado: c.habilitado, modo: c.modo, credenciales: { ...c.credenciales } }
      })
      setEdits(init)
      setLoading(false)
    })
  }, [])

  const setField = (gateway: Gateway, key: string, value: string) => {
    setEdits((prev) => ({
      ...prev,
      [gateway]: {
        ...prev[gateway],
        credenciales: { ...(prev[gateway].credenciales ?? {}), [key]: value },
      },
    }))
  }

  const setModo = (gateway: Gateway, modo: Modo) => {
    setEdits((prev) => ({ ...prev, [gateway]: { ...prev[gateway], modo } }))
  }

  const setHabilitado = async (gateway: Gateway, habilitado: boolean) => {
    const current = edits[gateway]
    // Validate credentials before enabling
    const fields = GATEWAY_FIELDS[gateway].fields
    const creds = current.credenciales ?? {}
    const missing = fields.some((f) => !creds[f.key]?.trim())

    if (habilitado && missing && current.modo === 'production') {
      toast.error('Ingresa las credenciales antes de habilitar en modo producción')
      return
    }

    setEdits((prev) => ({ ...prev, [gateway]: { ...prev[gateway], habilitado } }))
    setSaving(gateway)
    const result = await updatePaymentConfig(gateway, { habilitado })
    setSaving(null)
    if ('error' in result) {
      toast.error(result.error)
      setEdits((prev) => ({ ...prev, [gateway]: { ...prev[gateway], habilitado: !habilitado } }))
    } else {
      toast.success(habilitado ? 'Gateway habilitado' : 'Gateway deshabilitado')
      setConfigs((prev) => prev.map((c) => c.gateway === gateway ? { ...c, habilitado } : c))
    }
  }

  const handleSave = async (gateway: Gateway) => {
    setSaving(gateway)
    const { habilitado: _h, ...updates } = edits[gateway]
    const result = await updatePaymentConfig(gateway, updates)
    setSaving(null)
    if ('error' in result) {
      toast.error(result.error)
    } else {
      toast.success('Configuración guardada')
      setConfigs((prev) =>
        prev.map((c) => c.gateway === gateway ? { ...c, ...updates } : c)
      )
    }
  }

  const toggleSecret = (key: string) =>
    setShowSecrets((prev) => ({ ...prev, [key]: !prev[key] }))

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 size={32} className="animate-spin text-[#28B4AD]" />
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-[#28B4AD]/20 rounded-xl flex items-center justify-center">
          <CreditCard size={20} className="text-[#28B4AD]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Medios de Pago</h1>
          <p className="text-sm text-gray-500">
            Configura los gateways de pago para los cursos de pago
          </p>
        </div>
      </div>

      {/* Info banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 mb-8">
        <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
        <div className="text-sm text-amber-800">
          <strong>Modo Sandbox activo por defecto.</strong> Los pagos en sandbox no son reales.
          Cuando tengas las credenciales de producción, cámbialas aquí y activa el modo Producción.
          Cada gateway puede estar en un modo diferente.
        </div>
      </div>

      <div className="space-y-6">
        {configs.map((config) => {
          const edit = edits[config.gateway]
          const gatewayDef = GATEWAY_FIELDS[config.gateway]
          const creds = edit.credenciales ?? config.credenciales
          const modo = edit.modo ?? config.modo
          const habilitado = edit.habilitado ?? config.habilitado
          const isSaving = saving === config.gateway

          return (
            <div
              key={config.gateway}
              className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${
                habilitado ? 'border-[#28B4AD]/40' : 'border-gray-100'
              }`}
            >
              {/* Gateway header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-50">
                <div className="flex items-center gap-4">
                  <span className="text-2xl">{GATEWAY_ICONS[config.gateway]}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-gray-900">{config.nombre}</h2>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        modo === 'production'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-blue-100 text-blue-600'
                      }`}>
                        {modo === 'production' ? 'Producción' : 'Sandbox'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{GATEWAY_DESCRIPTIONS[config.gateway]}</p>
                  </div>
                </div>

                {/* Toggle habilitado */}
                <button
                  onClick={() => setHabilitado(config.gateway, !habilitado)}
                  disabled={isSaving}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                    habilitado ? 'bg-[#28B4AD]' : 'bg-gray-200'
                  } ${isSaving ? 'opacity-50' : ''}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    habilitado ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              {/* Config body */}
              <div className="p-6 space-y-5">
                {/* Modo sandbox/production */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Modo</label>
                  <div className="flex gap-3">
                    {(['sandbox', 'production'] as Modo[]).map((m) => (
                      <button
                        key={m}
                        onClick={() => setModo(config.gateway, m)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-semibold transition-all ${
                          modo === m
                            ? m === 'production'
                              ? 'border-green-500 bg-green-50 text-green-700'
                              : 'border-blue-400 bg-blue-50 text-blue-700'
                            : 'border-gray-200 text-gray-500 hover:border-gray-300'
                        }`}
                      >
                        {modo === m && <Check size={14} />}
                        {m === 'sandbox' ? 'Sandbox (pruebas)' : 'Producción (real)'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Credential fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {gatewayDef.fields.map((field) => {
                    const secretKey = `${config.gateway}_${field.key}`
                    const isVisible = showSecrets[secretKey]
                    return (
                      <div key={field.key}>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                          {field.label}
                        </label>
                        <div className="relative">
                          <input
                            type={field.secret && !isVisible ? 'password' : 'text'}
                            value={creds[field.key] ?? ''}
                            onChange={(e) => setField(config.gateway, field.key, e.target.value)}
                            className="form-input pr-10 font-mono text-sm"
                            placeholder={modo === 'sandbox' ? `sandbox-${field.placeholder}` : field.placeholder}
                          />
                          {field.secret && (
                            <button
                              type="button"
                              onClick={() => toggleSecret(secretKey)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              {isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Save button */}
                <div className="flex items-center justify-between pt-2">
                  <p className="text-xs text-gray-400">
                    Las credenciales se almacenan de forma segura y solo son accesibles por admins.
                  </p>
                  <button
                    onClick={() => handleSave(config.gateway)}
                    disabled={isSaving}
                    className="flex items-center gap-2 bg-[#28B4AD] hover:bg-[#219892] text-white px-5 py-2 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                    Guardar
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
