'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { AlertTriangle } from 'lucide-react'

export default function PagoErrorPage() {
  const searchParams = useSearchParams()
  const rawMensaje = searchParams.get('mensaje')
  const mensaje = rawMensaje
    ? decodeURIComponent(rawMensaje)
    : 'Ocurrió un problema al procesar tu pago.'

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-10 max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle size={40} className="text-red-600" />
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Error en el pago</h1>
          <p className="text-gray-500 mt-2">{mensaje}</p>
        </div>
        <div className="flex flex-col gap-3">
          <Link
            href="/dashboard"
            className="block w-full bg-[#28B4AD] hover:bg-[#219892] text-white font-bold py-3 rounded-xl transition-colors"
          >
            Ir a mis cursos
          </Link>
          <button
            onClick={() => window.history.back()}
            className="w-full border border-gray-300 text-gray-600 font-semibold py-3 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Intentar de nuevo
          </button>
        </div>
      </div>
    </div>
  )
}
