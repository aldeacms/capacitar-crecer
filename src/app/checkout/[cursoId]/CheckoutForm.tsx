'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, AlertCircle, Loader2, FileText, CheckCircle2, CreditCard } from 'lucide-react'
import { validarCupon, inscribirConCupon, comprarCertificado, inscribirPendientePago } from '@/actions/checkout'
import { iniciarPago } from '@/actions/pago-iniciar'
import type { Gateway as GatewayType } from '@/lib/payment-constants'


interface GatewayInfo {
  gateway: GatewayType
  nombre: string
  modo: string
}

interface CheckoutFormProps {
  cursoId: string
  precio: number
  tipo?: 'curso' | 'certificado'
  cursoSlug?: string
  gatewaysDisponibles?: GatewayInfo[]
}

export default function CheckoutForm({ cursoId, precio, tipo = 'curso', cursoSlug = '', gatewaysDisponibles = [] }: CheckoutFormProps) {
  const esCertificado = tipo === 'certificado'
  const router = useRouter()
  const [codigoCupon, setCodigoCupon] = useState('')
  const [cuponAplicado, setCuponAplicado] = useState<{
    codigo: string
    descuento_porcentaje: number
  } | null>(null)
  const [loadingCupon, setLoadingCupon] = useState(false)
  const [loadingInscripcion, setLoadingInscripcion] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cuponError, setCuponError] = useState<string | null>(null)
  const [inscripcionPendiente, setInscripcionPendiente] = useState(false)
  const [gatewaySeleccionado, setGatewaySeleccionado] = useState<GatewayType | null>(
    gatewaysDisponibles.length === 1 ? gatewaysDisponibles[0].gateway : null
  )

  const descuentoAplicado = cuponAplicado
    ? Math.round(precio * (cuponAplicado.descuento_porcentaje / 100))
    : 0
  const precioFinal = precio - descuentoAplicado

  const handleAplicarCupon = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoadingCupon(true)
    setCuponError(null)

    const resultado = await validarCupon(codigoCupon)

    if ('error' in resultado) {
      setCuponError(resultado.error)
      setLoadingCupon(false)
      return
    }

    setCuponAplicado(resultado.data)
    setCodigoCupon('')
    setLoadingCupon(false)
  }

  const handleConfirmarInscripcion = async () => {
    setLoadingInscripcion(true)
    setError(null)

    if (esCertificado) {
      // Compra de certificado (sin cambios)
      const resultado = await comprarCertificado(cursoId, cuponAplicado?.codigo)
      if ('error' in resultado) {
        setError(resultado.error)
        setLoadingInscripcion(false)
        return
      }
      router.push(`/dashboard/cursos/${cursoSlug}?leccion=certificado`)
      return
    }

    if (cuponAplicado) {
      // Inscripción con cupón aplicado
      const resultado = await inscribirConCupon(cursoId, cuponAplicado.codigo)
      if ('error' in resultado) {
        if (resultado.requierePago) {
          // Descuento parcial: matrícula creada pero pago pendiente — no es un error
          setInscripcionPendiente(true)
          setLoadingInscripcion(false)
          return
        }
        setError(resultado.error)
        setLoadingInscripcion(false)
        return
      }
      router.push('/dashboard')
      return
    }

    // Sin cupón en curso de pago
    if (gatewaySeleccionado) {
      // Hay gateway habilitado → pago online
      const resultado = await iniciarPago(cursoId, gatewaySeleccionado)
      if ('error' in resultado) {
        setError(resultado.error)
        setLoadingInscripcion(false)
        return
      }
      // Redirigir al gateway externo
      window.location.href = resultado.redirectUrl
      return
    }

    // Sin gateways → flujo manual de coordinación
    const resultado = await inscribirPendientePago(cursoId)
    if ('error' in resultado) {
      setError(resultado.error)
      setLoadingInscripcion(false)
      return
    }
    setInscripcionPendiente(true)
    setLoadingInscripcion(false)
  }

  const handleEliminarCupon = () => {
    setCuponAplicado(null)
    setCodigoCupon('')
    setCuponError(null)
  }

  // Pantalla de inscripción pendiente de pago
  if (inscripcionPendiente) {
    return (
      <div className="space-y-4 text-center py-4">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle2 size={32} className="text-green-600" />
          </div>
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">Inscripción registrada</h3>
          <p className="text-gray-600 mt-2 text-sm">
            Tu solicitud fue recibida. Un administrador se contactará contigo para coordinar el pago
            {precio > 0 && <> de <strong>${precio.toLocaleString('es-CL')}</strong></>}.
          </p>
        </div>
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700 text-left">
          Mientras tanto, el curso aparecerá en tu dashboard con estado <strong>pendiente de pago</strong>.
          Una vez confirmado el pago, tendrás acceso completo.
        </div>
        <button
          onClick={() => router.push('/dashboard')}
          className="w-full py-3 bg-[#28B4AD] hover:bg-[#1f9593] text-white rounded-xl font-bold transition-all"
        >
          Ir a mi dashboard
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Resumen de precio */}
      <div className="bg-slate-50 rounded-xl p-4 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Precio {esCertificado ? 'del certificado' : 'del curso'}</span>
          <span className="font-semibold text-gray-900">${precio.toLocaleString('es-CL')}</span>
        </div>

        {cuponAplicado && (
          <>
            <div className="border-t border-gray-200 pt-3">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Descuento ({cuponAplicado.descuento_porcentaje}%)</span>
                <span className="font-semibold text-red-600">-${descuentoAplicado.toLocaleString('es-CL')}</span>
              </div>
              <div className="flex justify-between text-base font-bold border-t border-gray-200 pt-3">
                <span className="text-gray-900">Precio final</span>
                <span className={precioFinal === 0 ? 'text-green-600' : 'text-gray-900'}>
                  {precioFinal === 0 ? 'Gratis' : `$${precioFinal.toLocaleString('es-CL')}`}
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Sección de cupón */}
      {!cuponAplicado ? (
        <form onSubmit={handleAplicarCupon} className="space-y-3">
          <label className="block text-sm font-semibold text-gray-900">
            Código de descuento (opcional)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={codigoCupon}
              onChange={(e) => setCodigoCupon(e.target.value.toUpperCase())}
              placeholder="Ej: TEST100"
              disabled={loadingCupon}
              className="flex-1 px-4 py-2.5 bg-white border-2 border-gray-300 text-gray-900 placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-[#28B4AD]/20 focus:border-[#28B4AD] outline-none transition-all disabled:bg-gray-100"
            />
            <button
              type="submit"
              disabled={!codigoCupon || loadingCupon}
              className="px-6 py-2.5 bg-[#28B4AD] hover:bg-[#1f9593] disabled:bg-gray-300 text-white rounded-lg font-bold transition-all flex items-center gap-2 disabled:cursor-not-allowed"
            >
              {loadingCupon ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Validando...
                </>
              ) : (
                'Aplicar'
              )}
            </button>
          </div>
          {cuponError && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-700">{cuponError}</p>
            </div>
          )}
        </form>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2">
              <Check size={16} className="text-green-600" />
              <span className="text-sm font-semibold text-green-700">{cuponAplicado.codigo}</span>
            </div>
            <button
              onClick={handleEliminarCupon}
              disabled={loadingInscripcion}
              className="text-xs text-green-600 hover:text-green-700 font-medium disabled:opacity-50"
            >
              Cambiar
            </button>
          </div>
        </div>
      )}

      {/* Selección de medio de pago (cursos de pago con gateways disponibles) */}
      {!esCertificado && precioFinal > 0 && gatewaysDisponibles.length > 0 && (
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-900 flex items-center gap-2">
            <CreditCard size={16} className="text-gray-400" />
            Medio de pago
          </label>
          <div className="space-y-2">
            {gatewaysDisponibles.map((gw) => (
              <button
                key={gw.gateway}
                type="button"
                onClick={() => setGatewaySeleccionado(gw.gateway)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                  gatewaySeleccionado === gw.gateway
                    ? 'border-[#28B4AD] bg-[#28B4AD]/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <CreditCard size={20} className="text-slate-400 shrink-0" />
                <div className="flex-1">
                  <span className="text-sm font-semibold text-gray-900">{gw.nombre}</span>
                  {gw.modo === 'sandbox' && (
                    <span className="ml-2 text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded font-semibold">Prueba</span>
                  )}
                </div>
                {gatewaySeleccionado === gw.gateway && (
                  <Check size={16} className="text-[#28B4AD] shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error general */}
      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-700">{error}</p>
        </div>
      )}

      {/* Botón de confirmación — siempre visible */}
      <button
        onClick={handleConfirmarInscripcion}
        disabled={loadingInscripcion}
        className="w-full py-3 bg-gradient-to-r from-[#28B4AD] to-[#1f9593] hover:from-[#1f9593] hover:to-[#178580] disabled:from-gray-300 disabled:to-gray-300 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:cursor-not-allowed"
      >
        {loadingInscripcion ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            Procesando...
          </>
        ) : (
          <>
            <Check size={18} />
            {esCertificado
              ? 'Confirmar Compra'
              : cuponAplicado && precioFinal === 0
                ? 'Confirmar Inscripción Gratuita'
                : gatewaySeleccionado
                  ? `Pagar $${precioFinal.toLocaleString('es-CL')} con ${gatewaysDisponibles.find(g => g.gateway === gatewaySeleccionado)?.nombre ?? gatewaySeleccionado}`
                  : cuponAplicado
                    ? `Confirmar y Coordinar Pago ($${precioFinal.toLocaleString('es-CL')})`
                    : 'Solicitar Inscripción'}
          </>
        )}
      </button>

      {/* Aviso de seguridad */}
      {(cuponAplicado && precioFinal === 0) && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-700 flex items-center gap-1.5">
            <Check size={12} className="flex-shrink-0" />
            Tu {esCertificado ? 'compra' : 'inscripción'} será confirmada inmediatamente sin requerir pago.
          </p>
        </div>
      )}

      {/* Aviso para certificado sin cupón */}
      {esCertificado && !cuponAplicado && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-xs text-amber-700 flex items-center gap-1.5">
            <FileText size={12} className="flex-shrink-0" />
            Confirma tu compra del certificado por ${precio.toLocaleString('es-CL')}.
          </p>
        </div>
      )}
    </div>
  )
}
