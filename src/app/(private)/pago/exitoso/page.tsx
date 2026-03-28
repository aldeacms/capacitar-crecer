import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'

export default function PagoExitosoPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-10 max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle2 size={40} className="text-green-600" />
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">¡Pago exitoso!</h1>
          <p className="text-gray-500 mt-2">
            Tu inscripción ha sido confirmada. Ya puedes acceder al curso desde tu dashboard.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="block w-full bg-[#28B4AD] hover:bg-[#219892] text-white font-bold py-3 rounded-xl transition-colors"
        >
          Ir a mis cursos
        </Link>
      </div>
    </div>
  )
}
