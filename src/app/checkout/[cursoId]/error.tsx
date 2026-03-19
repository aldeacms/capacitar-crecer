'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, ShoppingCart, Lightbulb } from 'lucide-react'
import Link from 'next/link'

export default function CheckoutError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Error en checkout:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Icon */}
          <div className="mb-6 flex justify-center">
            <div className="p-3 bg-red-50 rounded-full">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-black text-slate-900 text-center mb-2">
            Error en Compra
          </h1>

          {/* Description */}
          <p className="text-slate-600 text-sm text-center mb-6">
            Ocurrió un problema al procesar tu compra. Por favor intenta nuevamente.
          </p>

          {/* Error message */}
          {error.message && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
              <p className="text-xs text-red-800 font-mono">
                {error.message.slice(0, 100)}
              </p>
            </div>
          )}

          {/* Helpful text */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
            <p className="text-xs text-blue-800 flex items-center gap-2">
              <Lightbulb size={14} className="flex-shrink-0" />
              <span>Tu dinero no ha sido debitado. Es seguro reintentar.</span>
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={reset}
              className="w-full inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              <RefreshCw size={18} />
              Reintentar Compra
            </button>

            <Link
              href="/cursos"
              className="w-full inline-flex items-center justify-center gap-2 bg-slate-200 hover:bg-slate-300 text-slate-900 font-bold py-3 px-6 rounded-lg transition-colors"
            >
              <ShoppingCart size={18} />
              Volver a Cursos
            </Link>
          </div>

          {/* Support */}
          <div className="text-xs text-slate-500 text-center mt-6 pt-6 border-t border-slate-200">
            Si el problema persiste, contacta con soporte@capacitarycrecer.cl
          </div>
        </div>
      </div>
    </div>
  )
}
