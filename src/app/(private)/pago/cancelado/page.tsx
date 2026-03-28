import Link from 'next/link'
import { AlertCircle } from 'lucide-react'

export default function PagoCanceladoPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-10 max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center">
            <AlertCircle size={40} className="text-amber-500" />
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pago cancelado</h1>
          <p className="text-gray-500 mt-2">
            Cancelaste el proceso de pago. Tu inscripción quedó pendiente — puedes retomar el pago cuando quieras desde el curso.
          </p>
        </div>
        <Link
          href="/cursos"
          className="block w-full bg-[#28B4AD] hover:bg-[#219892] text-white font-bold py-3 rounded-xl transition-colors"
        >
          Volver al catálogo
        </Link>
      </div>
    </div>
  )
}
