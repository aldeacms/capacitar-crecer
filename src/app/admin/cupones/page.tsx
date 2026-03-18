/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect } from 'react'
import { getCupones, createCupon, toggleCupon, deleteCupon } from '@/actions/cupones'
import { CuponModal } from '@/components/admin/CuponModal'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Copy, Eye, EyeOff, Trash2 } from 'lucide-react'

export default function CuponesPage() {
  const [cupones, setCupones] = useState<any[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  const loadCupones = async () => {
    setLoading(true)
    const data = await getCupones()
    if (!('error' in data)) {
      setCupones(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadCupones()
  }, [])

  const handleCreateCupon = () => {
    setIsModalOpen(true)
  }

  const handleToggleCupon = async (id: string, activo: boolean) => {
    const result = await toggleCupon(id, activo)
    if ('error' in result) {
      toast.error(result.error)
    } else {
      toast.success(activo ? 'Cupón desactivado' : 'Cupón activado')
      loadCupones()
    }
  }

  const handleDeleteCupon = async (id: string, codigo: string) => {
    if (confirm(`¿Estás seguro de eliminar el cupón "${codigo}"? Esta acción no se puede deshacer.`)) {
      const result = await deleteCupon(id)
      if ('error' in result) {
        toast.error(result.error)
      } else {
        toast.success('Cupón eliminado')
        loadCupones()
      }
    }
  }

  const handleCopyCode = (codigo: string) => {
    navigator.clipboard.writeText(codigo)
    toast.success(`Código "${codigo}" copiado`)
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cupones de Descuento</h1>
          <p className="text-gray-500 mt-1">Gestiona los códigos de descuento para los cursos de pago.</p>
        </div>
        <button
          onClick={handleCreateCupon}
          className="bg-[#28B4AD] hover:bg-[#219892] text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-md hover:shadow-lg flex items-center gap-2"
        >
          <span className="text-xl">+</span> Nuevo Cupón
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-gray-600 text-[11px] uppercase tracking-wider font-bold">
              <th className="px-6 py-4">Código</th>
              <th className="px-6 py-4">Descuento</th>
              <th className="px-6 py-4">Usos</th>
              <th className="px-6 py-4">Estado</th>
              <th className="px-6 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              [1, 2, 3].map((i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-32"></div></td>
                  <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-20"></div></td>
                  <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-24"></div></td>
                  <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-16"></div></td>
                  <td className="px-6 py-4"></td>
                </tr>
              ))
            ) : cupones.length > 0 ? (
              cupones.map((cupon) => (
                <tr key={cupon.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <code className="font-mono font-bold text-gray-900">{cupon.codigo}</code>
                      <button
                        onClick={() => handleCopyCode(cupon.codigo)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-[#28B4AD]"
                        title="Copiar código"
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg text-[#28B4AD]">{cupon.descuento_porcentaje}%</span>
                      {cupon.descuento_porcentaje === 100 && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">Gratis</Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <span className="font-medium text-gray-900">{cupon.usos_actuales || 0}</span>
                    {cupon.usos_maximos ? ` / ${cupon.usos_maximos}` : ' / ∞'}
                  </td>
                  <td className="px-6 py-4">
                    <Badge
                      variant="outline"
                      className={cupon.activo ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-500 border-gray-200'}
                    >
                      {cupon.activo ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right space-x-3">
                    <button
                      onClick={() => handleToggleCupon(cupon.id, cupon.activo)}
                      className="text-gray-400 hover:text-[#28B4AD] transition-colors"
                      title={cupon.activo ? 'Desactivar' : 'Activar'}
                    >
                      {cupon.activo ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                    <button
                      onClick={() => handleDeleteCupon(cupon.id, cupon.codigo)}
                      className="text-gray-300 hover:text-red-500 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                  No hay cupones registrados todavía. Crea uno para empezar a ofrecer descuentos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <CuponModal
          onClose={() => {
            setIsModalOpen(false)
            loadCupones()
          }}
        />
      )}
    </div>
  )
}
