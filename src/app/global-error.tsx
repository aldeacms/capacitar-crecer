'use client'

import { useEffect } from 'react'
import { AlertCircle } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Global error:', error)
  }, [error])

  return (
    <html>
      <body>
        <div className="min-h-screen bg-gradient-to-b from-red-50 to-red-100 flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <div className="mb-6 flex justify-center">
              <div className="p-4 bg-red-100 rounded-full">
                <AlertCircle className="w-12 h-12 text-red-600" />
              </div>
            </div>

            <h1 className="text-3xl font-black text-red-900 mb-3">
              Error Crítico
            </h1>

            <p className="text-red-700 mb-6 text-sm">
              Ocurrió un problema inesperado en la aplicación. Nuestro equipo ha sido notificado.
            </p>

            {error.digest && (
              <p className="text-xs text-red-600 mb-6 font-mono bg-red-50 p-3 rounded border border-red-200">
                ID: {error.digest}
              </p>
            )}

            <div className="flex flex-col gap-3">
              <button
                onClick={reset}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                Reintentar
              </button>

              <a
                href="/"
                className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg transition-colors text-center"
              >
                Volver al Inicio
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
