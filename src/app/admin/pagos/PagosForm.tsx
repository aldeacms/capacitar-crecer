'use client'

import { useState } from 'react'
import { Eye, EyeOff, Save, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { updatePaymentConfig } from '@/actions/pagos-config'
import { GATEWAY_FIELDS } from '@/lib/payment-constants'
import type { Gateway, PaymentConfig } from '@/lib/payment-constants'

interface Props {
  initialConfigs: PaymentConfig[]
}

export default function PagosForm({ initialConfigs }: Props) {
  const [configs, setConfigs] = useState<PaymentConfig[]>(initialConfigs)
  const [saving, setSaving] = useState<Gateway | null>(null)
  const [result, setResult] = useState<{ gateway: Gateway; ok: boolean; msg?: string } | null>(null)
  const [showSecret, setShowSecret] = useState<Record<string, boolean>>({})

  const getConfig = (gateway: Gateway) =>
    configs.find((c) => c.gateway === gateway) ?? null

  const updateLocal = (gateway: Gateway, updates: Partial<PaymentConfig>) => {
    setConfigs((prev) =>
      prev.map((c) => (c.gateway === gateway ? { ...c, ...updates } : c))
    )
  }

  const updateCredencial = (gateway: Gateway, key: string, value: string) => {
    const config = getConfig(gateway)
    if (!config) return
    updateLocal(gateway, {
      credenciales: { ...config.credenciales, [key]: value },
    })
  }

  const handleSave = async (gateway: Gateway) => {
    const config = getConfig(gateway)
    if (!config) return
    setSaving(gateway)
    setResult(null)

    const res = await updatePaymentConfig(gateway, {
      habilitado: config.habilitado,
      modo: config.modo,
      credenciales: config.credenciales,
    })

    setSaving(null)
    if ('error' in res) {
      setResult({ gateway, ok: false, msg: res.error })
    } else {
      setResult({ gateway, ok: true })
      setTimeout(() => setResult(null), 3000)
    }
  }

  const toggleSecret = (fieldId: string) =>
    setShowSecret((prev) => ({ ...prev, [fieldId]: !prev[fieldId] }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Pasarelas de Pago</h1>
        <p className="text-sm text-slate-500 mt-1">
          Configura las credenciales y el modo de cada pasarela de pago.
        </p>
      </div>

      {(Object.keys(GATEWAY_FIELDS) as Gateway[]).map((gateway) => {
        const meta = GATEWAY_FIELDS[gateway]
        const config = getConfig(gateway)
        if (!config) return null
        const isSaving = saving === gateway
        const res = result?.gateway === gateway ? result : null

        return (
          <div
            key={gateway}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <h2 className="font-bold text-slate-800 text-lg">{meta.label}</h2>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                    config.habilitado
                      ? 'bg-green-100 text-green-700'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {config.habilitado ? 'Habilitado' : 'Deshabilitado'}
                </span>
              </div>
              <label className="flex items-center cursor-pointer gap-2">
                <span className="text-xs text-slate-500 font-medium">
                  {config.habilitado ? 'Activo' : 'Inactivo'}
                </span>
                <div
                  onClick={() => updateLocal(gateway, { habilitado: !config.habilitado })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    config.habilitado ? 'bg-[#2DB3A7]' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                      config.habilitado ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </div>
              </label>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              {/* Modo */}
              <div>
                <label className="block text-xs font-black uppercase text-slate-500 mb-2">
                  Modo
                </label>
                <div className="flex gap-2">
                  {(['sandbox', 'production'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => updateLocal(gateway, { modo: m })}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                        config.modo === m
                          ? m === 'sandbox'
                            ? 'bg-amber-100 border-amber-300 text-amber-800'
                            : 'bg-green-100 border-green-300 text-green-800'
                          : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      {m === 'sandbox' ? 'Sandbox (pruebas)' : 'Producción'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Credential fields */}
              {meta.fields.map((field) => {
                const fieldId = `${gateway}-${field.key}`
                const isVisible = showSecret[fieldId]
                const value = config.credenciales?.[field.key] ?? ''
                return (
                  <div key={field.key}>
                    <label className="block text-xs font-black uppercase text-slate-500 mb-1.5">
                      {field.label}
                    </label>
                    <div className="relative">
                      <input
                        type={field.secret && !isVisible ? 'password' : 'text'}
                        value={value}
                        onChange={(e) => updateCredencial(gateway, field.key, e.target.value)}
                        placeholder={field.placeholder}
                        className="w-full pr-10 pl-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-[#2DB3A7] text-sm font-mono"
                      />
                      {field.secret && (
                        <button
                          type="button"
                          onClick={() => toggleSecret(fieldId)}
                          className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                        >
                          {isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}

              {/* Feedback */}
              {res && (
                <div
                  className={`flex items-center gap-2 text-sm rounded-xl px-4 py-3 ${
                    res.ok
                      ? 'bg-green-50 text-green-700'
                      : 'bg-red-50 text-red-600'
                  }`}
                >
                  {res.ok ? (
                    <CheckCircle2 size={16} />
                  ) : (
                    <AlertCircle size={16} />
                  )}
                  {res.ok ? 'Configuración guardada correctamente.' : res.msg}
                </div>
              )}

              {/* Save button */}
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => handleSave(gateway)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2DB3A7] text-white font-bold text-sm hover:bg-[#26a095] transition-all disabled:opacity-50"
                >
                  {isSaving ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <Save size={15} />
                  )}
                  {isSaving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
