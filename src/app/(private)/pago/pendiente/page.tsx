import Link from 'next/link'
import { Clock } from 'lucide-react'

export default function PagoPendientePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-10 max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center">
            <Clock size={40} className="text-yellow-600" />
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pago en proceso</h1>
          <p className="text-gray-500 mt-2">
            Tu pago está siendo procesado. Te notificaremos por email cuando se confirme. El acceso al curso se habilitará automáticamente.
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
