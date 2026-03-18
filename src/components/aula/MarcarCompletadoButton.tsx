'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, AlertCircle } from 'lucide-react'
import { marcarLeccionCompletada } from '@/actions/progreso'

interface MarcarCompletadoButtonProps {
  leccionId: string
  yaCompletada: boolean
}

export default function MarcarCompletadoButton({
  leccionId,
  yaCompletada,
}: MarcarCompletadoButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleMarcar = async () => {
    setIsLoading(true)
    setError(null)

    const result = await marcarLeccionCompletada(leccionId)

    if ('error' in result) {
      setError(result.error)
      setIsLoading(false)
      return
    }

    // Actualizar la página para refrescar checkmarks y progreso
    router.refresh()
  }

  if (yaCompletada) {
    return (
      <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
        <CheckCircle2 size={20} className="text-emerald-600 flex-shrink-0" />
        <div>
          <p className="font-semibold text-emerald-900">Completada</p>
          <p className="text-xs text-emerald-700">Haz completado esta lección</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <button
        onClick={handleMarcar}
        disabled={isLoading}
        className="w-full py-3 px-4 bg-[#28B4AD] hover:bg-[#1f9593] disabled:bg-gray-300 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Marcando...
          </>
        ) : (
          <>
            <CheckCircle2 size={18} />
            Marcar como completada
          </>
        )}
      </button>

      {error && (
        <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
          <AlertCircle size={16} className="text-red-600 flex-shrink-0" />
          <p className="text-xs text-red-700">{error}</p>
        </div>
      )}
    </div>
  )
}
