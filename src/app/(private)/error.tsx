'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'

export default function PrivateError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Error en zona privada:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="mb-6 flex justify-center">
            <div className="p-3 bg-blue-50 rounded-full">
              <AlertTriangle className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <h1 className="text-2xl font-black text-slate-900 text-center mb-2">
            Error en tu Panel
          </h1>

          <p className="text-slate-600 text-sm text-center mb-6">
            Algo no funcionó como se esperaba. Intenta nuevamente.
          </p>

          {/* Error details */}
          {error.message && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
              <p className="text-xs text-blue-800 font-mono line-clamp-3">
                {error.message}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={reset}
              className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              <RefreshCw size={18} />
              Reintentar
            </button>

            <Link
              href="/dashboard"
              className="w-full inline-flex items-center justify-center gap-2 bg-slate-200 hover:bg-slate-300 text-slate-900 font-bold py-3 px-6 rounded-lg transition-colors"
            >
              <Home size={18} />
              Mi Dashboard
            </Link>
          </div>

          <div className="text-xs text-slate-500 text-center mt-6 pt-6 border-t border-slate-200">
            Si persiste el error, intenta refrescar la página o cierra sesión.
          </div>
        </div>
      </div>
    </div>
  )
}
