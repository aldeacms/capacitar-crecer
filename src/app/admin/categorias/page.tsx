/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { getCategories, deleteCategory } from '@/actions/categorias'
import CategoryModal from '@/components/admin/CategoryModal'
import Tooltip from '@/components/ui/Tooltip'

export default function CategoriasPage() {
  const [categorias, setCategorias] = useState<any[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const loadCategorias = async () => {
    setLoading(true)
    const data = await getCategories()
    setCategorias(data)
    setLoading(false)
  }

  useEffect(() => {
    loadCategorias()
  }, [])

  const handleEdit = (cat: any) => {
    setSelectedCategory(cat)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string, nombre: string) => {
    if (confirm(`¿Estás seguro de eliminar la categoría "${nombre}"? Esta acción no se puede deshacer.`)) {
      const result = await deleteCategory(id)
      if (result?.success) {
        loadCategorias()
      } else {
        alert('Error al eliminar: ' + result?.error)
      }
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Categorías</h1>
          <p className="text-gray-500 mt-1">Gestiona las clasificaciones del catálogo y sus metadatos SEO.</p>
        </div>
        <button 
          onClick={() => {
            setSelectedCategory(null)
            setIsModalOpen(true)
          }}
          className="bg-[#28B4AD] hover:bg-[#219892] text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-md hover:shadow-lg flex items-center gap-2"
        >
          <span className="text-xl">+</span> Nueva Categoría
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-gray-600 text-[11px] uppercase tracking-wider font-bold">
              <th className="px-6 py-4">Imagen</th>
              <th className="px-6 py-4">Categoría</th>
              <th className="px-6 py-4">Slug</th>
              <th className="px-6 py-4">Descripción</th>
              <th className="px-6 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              [1, 2, 3].map((i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-6 py-4"><div className="w-12 h-10 bg-gray-100 rounded-lg"></div></td>
                  <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-32"></div></td>
                  <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-24"></div></td>
                  <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-48"></div></td>
                  <td className="px-6 py-4"></td>
                </tr>
              ))
            ) : categorias.length > 0 ? (
              categorias.map((cat) => (
                <tr key={cat.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-2">
                    <div className="w-12 h-10 rounded-lg overflow-hidden border border-gray-100 shadow-sm bg-gray-50">
                      {cat.imagen_url ? (
                        <img src={cat.imagen_url} alt={cat.nombre} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-300 font-bold uppercase">No img</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-900">{cat.nombre}</td>
                  <td className="px-6 py-4 text-xs font-mono text-gray-400">{cat.slug}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                    {cat.descripcion || <span className="italic opacity-50">Sin descripción</span>}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Tooltip label="Editar">
                        <button
                          onClick={() => handleEdit(cat)}
                          className="p-1.5 text-gray-400 hover:text-[#28B4AD] hover:bg-[#28B4AD]/10 rounded-lg transition-all"
                        >
                          <Pencil size={15} />
                        </button>
                      </Tooltip>
                      <Tooltip label="Eliminar">
                        <button
                          onClick={() => handleDelete(cat.id, cat.nombre)}
                          className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 size={15} />
                        </button>
                      </Tooltip>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                  No hay categorías registradas todavía.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <CategoryModal 
          category={selectedCategory} 
          onClose={() => {
            setIsModalOpen(false)
            loadCategorias()
          }} 
        />
      )}
    </div>
  )
}
