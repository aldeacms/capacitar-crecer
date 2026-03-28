import Link from 'next/link'
import { XCircle } from 'lucide-react'

interface Props {
  searchParams: Promise<{ msg?: string }>
}

export default async function PagoRechazadoPage({ searchParams }: Props) {
  const { msg } = await searchParams

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-10 max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
            <XCircle size={40} className="text-red-500" />
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pago rechazado</h1>
          <p className="text-gray-500 mt-2">
            {msg ? decodeURIComponent(msg) : 'El pago no fue aprobado. Puedes intentarlo nuevamente.'}
          </p>
        </div>
        <div className="space-y-3">
          <Link
            href="/cursos"
            className="block w-full bg-[#28B4AD] hover:bg-[#219892] text-white font-bold py-3 rounded-xl transition-colors"
          >
            Volver al catálogo
          </Link>
          <Link
            href="/dashboard"
            className="block w-full border border-gray-200 text-gray-600 font-semibold py-3 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Ir a mi dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
