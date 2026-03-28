'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { FileText, Plus, Pencil, Trash2, Globe, EyeOff, Loader2 } from 'lucide-react'
import { getPaginas, togglePublicarPagina, deletePagina, type Pagina } from '@/actions/paginas'

export default function PaginasPage() {
  const [paginas, setPaginas] = useState<Pagina[]>([])
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    const data = await getPaginas()
    setPaginas(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleToggle = async (pagina: Pagina) => {
    setToggling(pagina.id)
    const result = await togglePublicarPagina(pagina.id, !pagina.publicada)
    if ('error' in result) {
      toast.error(result.error)
    } else {
      toast.success(pagina.publicada ? 'Página despublicada' : 'Página publicada')
      await load()
    }
    setToggling(null)
  }

  const handleDelete = async (pagina: Pagina) => {
    if (!confirm(`¿Eliminar la página "${pagina.titulo}"? Esta acción no se puede deshacer.`)) return
    const result = await deletePagina(pagina.id)
    if ('error' in result) {
      toast.error(result.error)
    } else {
      toast.success('Página eliminada')
      await load()
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#28B4AD]/20 rounded-xl flex items-center justify-center">
            <FileText size={20} className="text-[#28B4AD]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Páginas CMS</h1>
            <p className="text-sm text-gray-500">Edita el contenido de las páginas estáticas del sitio</p>
          </div>
        </div>
        <Link
          href="/admin/paginas/nueva"
          className="flex items-center gap-2 bg-[#28B4AD] hover:bg-[#219892] text-white px-5 py-2.5 rounded-xl font-semibold transition-colors"
        >
          <Plus size={18} />
          Nueva página
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-[11px] uppercase tracking-wider font-bold">
              <th className="px-6 py-4">Título</th>
              <th className="px-6 py-4">Slug (URL)</th>
              <th className="px-6 py-4">Estado</th>
              <th className="px-6 py-4">Última edición</th>
              <th className="px-6 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              [1, 2, 3, 4].map((i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-40" /></td>
                  <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-32" /></td>
                  <td className="px-6 py-4"><div className="h-5 bg-gray-100 rounded-full w-20" /></td>
                  <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-24" /></td>
                  <td className="px-6 py-4" />
                </tr>
              ))
            ) : paginas.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-16 text-center text-gray-400">
                  No hay páginas creadas todavía.
                </td>
              </tr>
            ) : (
              paginas.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-gray-900">{p.titulo}</td>
                  <td className="px-6 py-4 font-mono text-xs text-gray-400">/{p.slug}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleToggle(p)}
                      disabled={toggling === p.id}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                        p.publicada
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {toggling === p.id ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : p.publicada ? (
                        <Globe size={12} />
                      ) : (
                        <EyeOff size={12} />
                      )}
                      {p.publicada ? 'Publicada' : 'Borrador'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400">
                    {new Date(p.updated_at).toLocaleDateString('es-CL')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/admin/paginas/${p.id}`}
                        className="flex items-center gap-1.5 text-[#28B4AD] hover:text-[#219892] text-sm font-semibold transition-colors"
                      >
                        <Pencil size={14} />
                        Editar
                      </Link>
                      <button
                        onClick={() => handleDelete(p)}
                        className="flex items-center gap-1.5 text-gray-300 hover:text-red-500 text-sm font-medium transition-colors"
                      >
                        <Trash2 size={14} />
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
