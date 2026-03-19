'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Error en panel de admin:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <div className="flex items-center gap-3 mb-6">
          <AlertTriangle className="w-8 h-8 text-amber-600" />
          <h1 className="text-2xl font-black text-slate-900">
            Error en Admin
          </h1>
        </div>

        <div className="mb-6">
          <p className="text-slate-700 text-sm leading-relaxed mb-4">
            Ocurrió un error inesperado en el panel de administración.
          </p>

          {error.message && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
              <p className="text-xs text-amber-800 font-mono">
                {error.message}
              </p>
            </div>
          )}

          {error.digest && (
            <p className="text-xs text-slate-500 text-center">
              ID de error: {error.digest}
            </p>
          )}
        </div>

        <div className="space-y-3">
          <button
            onClick={reset}
            className="w-full inline-flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            <RefreshCw size={18} />
            Reintentar
          </button>

          <a
            href="/admin"
            className="w-full inline-flex items-center justify-center gap-2 bg-slate-200 hover:bg-slate-300 text-slate-900 font-bold py-3 px-6 rounded-lg transition-colors text-center"
          >
            Volver al Dashboard
          </a>
        </div>
      </div>
    </div>
  )
}
