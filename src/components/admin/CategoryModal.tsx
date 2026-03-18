'use client'

import { useState } from 'react'
import { createCategory, updateCategory } from '@/actions/categorias'

interface CategoryModalProps {
  category?: any
  onClose: () => void
}

export default function CategoryModal({ category, onClose }: CategoryModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [nombre, setNombre] = useState(category?.nombre || '')
  const [slug, setSlug] = useState(category?.slug || '')
  const [previewUrl, setPreviewUrl] = useState<string | null>(category?.imagen_url || null)

  const slugify = (text: string) => {
    return text
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '')
      .replace(/--+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '')
  }

  const handleNombreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setNombre(val)
    // Solo auto-generar slug si el campo está vacío o es el slug automático del nombre anterior
    if (!slug || slug === slugify(nombre)) {
      setSlug(slugify(val))
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const formData = new FormData(e.currentTarget)
      if (category) {
        formData.append('current_imagen_url', category.imagen_url || '')
      }

      const result = category 
        ? await updateCategory(category.id, formData)
        : await createCategory(formData)

      if (result?.error) {
        setError(result.error)
      } else {
        onClose()
      }
    } catch (err: any) {
      setError(err.message || 'Error al procesar la categoría')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">
            {category ? 'Editar Categoría' : 'Nueva Categoría'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-100 font-bold">
              ⚠️ {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[12px] font-bold text-gray-500 uppercase tracking-wider">Nombre</label>
              <input
                required
                name="nombre"
                value={nombre}
                onChange={handleNombreChange}
                placeholder="Ej: Recursos Humanos"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-4 focus:ring-[#28B4AD]/10 focus:border-[#28B4AD] outline-none transition-all font-medium text-gray-900"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[12px] font-bold text-gray-500 uppercase tracking-wider">Slug (Automático)</label>
              <input
                required
                name="slug"
                value={slug}
                readOnly={!!category}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-500 outline-none font-mono text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[12px] font-bold text-gray-500 uppercase tracking-wider">Descripción</label>
              <textarea
                name="descripcion"
                rows={3}
                defaultValue={category?.descripcion}
                placeholder="Breve descripción para SEO y landing de categoría"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-4 focus:ring-[#28B4AD]/10 focus:border-[#28B4AD] outline-none transition-all text-gray-900"
              ></textarea>
            </div>

            <div className="space-y-1.5">
              <label className="text-[12px] font-bold text-gray-500 uppercase tracking-wider">Imagen Ilustrativa</label>
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  name="imagen_file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) setPreviewUrl(URL.createObjectURL(file))
                  }}
                  className="flex-1 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#28B4AD]/10 file:text-[#28B4AD] hover:file:bg-[#28B4AD]/20 transition-all"
                />
                {previewUrl && (
                  <div className="w-16 h-12 rounded-lg overflow-hidden border border-gray-100 flex-shrink-0 shadow-sm">
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl text-gray-600 hover:bg-gray-100 font-bold transition-all text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-2 bg-[#28B4AD] hover:bg-[#219892] text-white rounded-xl font-bold transition-all shadow-lg disabled:opacity-50 flex items-center gap-2 text-sm"
            >
              {loading && <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />}
              {loading ? 'Guardando...' : (category ? 'Guardar Cambios' : 'Crear Categoría')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
