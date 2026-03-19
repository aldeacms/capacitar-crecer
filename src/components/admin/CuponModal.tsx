/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState } from 'react'
import { createCupon } from '@/actions/cupones'
import { toast } from 'sonner'
import { X, Loader2, Lightbulb } from 'lucide-react'

interface CuponModalProps {
  onClose: () => void
}

export function CuponModal({ onClose }: CuponModalProps) {
  const [codigo, setCodigo] = useState('')
  const [descuento, setDescuento] = useState(10)
  const [usosMaximos, setUsosMaximos] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await createCupon(
      codigo,
      descuento,
      usosMaximos ? parseInt(usosMaximos) : undefined
    )

    setLoading(false)

    if ('error' in result) {
      setError(result.error)
      toast.error(result.error)
    } else {
      toast.success(`Cupón "${codigo.toUpperCase()}" creado exitosamente`)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Crear Nuevo Cupón</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Código del Cupón *
            </label>
            <input
              type="text"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.toUpperCase())}
              placeholder="ej: VERANO50"
              disabled={loading}
              className="form-input"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Máximo 50 caracteres, se convertirá a mayúsculas</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Porcentaje de Descuento * ({descuento}%)
            </label>
            <input
              type="range"
              min="1"
              max="100"
              value={descuento}
              onChange={(e) => setDescuento(parseInt(e.target.value))}
              disabled={loading}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>1%</span>
              <span className="font-bold text-[#28B4AD] text-sm">{descuento}%</span>
              <span>100%</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Usos Máximos (opcional)
            </label>
            <input
              type="number"
              value={usosMaximos}
              onChange={(e) => setUsosMaximos(e.target.value)}
              placeholder="Dejar en blanco para ilimitado"
              disabled={loading}
              min="1"
              className="form-input"
            />
            <p className="text-xs text-gray-500 mt-1">Cantidad máxima de veces que se puede usar este cupón</p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-700 flex items-center gap-2">
              <Lightbulb size={14} className="flex-shrink-0" />
              <span><strong>Tip:</strong> Usa cupones con 100% de descuento para hacer que los cursos de pago sean gratuitos durante pruebas.</span>
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-bold hover:bg-gray-50 transition-all disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !codigo}
              className="flex-1 px-4 py-2.5 bg-[#28B4AD] text-white rounded-lg font-bold hover:bg-[#219892] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Creando...
                </>
              ) : (
                'Crear Cupón'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
