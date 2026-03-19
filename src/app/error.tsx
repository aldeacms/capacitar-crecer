'use client'

import { useEffect } from 'react'
import { AlertTriangle, ArrowLeft, RefreshCw } from 'lucide-react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Error en la aplicación:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {/* Icono */}
          <div className="mb-6 flex justify-center">
            <div className="p-4 bg-yellow-50 rounded-full">
              <AlertTriangle className="w-10 h-10 text-yellow-600" />
            </div>
          </div>

          {/* Título */}
          <h1 className="text-2xl font-black text-slate-900 mb-3">
            Algo salió mal
          </h1>

          {/* Descripción */}
          <p className="text-slate-600 mb-2 text-sm leading-relaxed">
            Encontramos un error inesperado. Por favor intenta nuevamente.
          </p>

          {error.message && (
            <p className="text-xs text-slate-500 mb-6 bg-slate-50 p-3 rounded border border-slate-200 font-mono">
              {error.message.slice(0, 100)}
            </p>
          )}

          {/* Botones */}
          <div className="space-y-3">
            <button
              onClick={reset}
              className="w-full inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-black text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              <RefreshCw size={18} />
              Reintentar
            </button>

            <Link
              href="/"
              className="w-full inline-flex items-center justify-center gap-2 bg-slate-200 hover:bg-slate-300 text-slate-900 font-bold py-3 px-6 rounded-lg transition-colors"
            >
              <ArrowLeft size={18} />
              Volver al Inicio
            </Link>
          </div>

          {/* Help text */}
          <p className="text-xs text-slate-500 mt-6 border-t border-slate-200 pt-6">
            Si el problema persiste, contacta con soporte.
          </p>
        </div>
      </div>
    </div>
  )
}
