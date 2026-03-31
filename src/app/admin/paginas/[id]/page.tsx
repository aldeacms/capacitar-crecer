'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { ArrowLeft, Save, Globe, EyeOff, Loader2, ExternalLink } from 'lucide-react'
import { getPaginaById, upsertPagina, type Pagina } from '@/actions/paginas'
import { SafeHTML } from '@/components/ui/SafeHTML'

type FormData = {
  slug: string
  titulo: string
  contenido_html: string
  meta_title: string
  meta_description: string
  publicada: boolean
}

const EMPTY: FormData = {
  slug: '',
  titulo: '',
  contenido_html: '',
  meta_title: '',
  meta_description: '',
  publicada: false,
}

export default function PaginaEditorPage() {
  const params = useParams()
  const router = useRouter()
  const isNew = params.id === 'nueva'

  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<FormData>(EMPTY)
  const [preview, setPreview] = useState(false)

  useEffect(() => {
    if (isNew) return
    getPaginaById(params.id as string).then((p) => {
      if (!p) {
        toast.error('Página no encontrada')
        router.push('/admin/paginas')
        return
      }
      setForm({
        slug: p.slug,
        titulo: p.titulo,
        contenido_html: p.contenido_html,
        meta_title: p.meta_title || '',
        meta_description: p.meta_description || '',
        publicada: p.publicada,
      })
      setLoading(false)
    })
  }, [params.id, isNew, router])

  const set = <K extends keyof FormData>(k: K, v: FormData[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }))

  const autoSlug = (titulo: string) =>
    titulo
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')

  const handleTituloChange = (v: string) => {
    set('titulo', v)
    if (isNew) set('slug', autoSlug(v))
  }

  const handleSave = async (publicar?: boolean) => {
    if (!form.titulo.trim()) { toast.error('El título es obligatorio'); return }
    if (!form.slug.trim()) { toast.error('El slug es obligatorio'); return }

    setSaving(true)
    const result = await upsertPagina({
      ...(isNew ? {} : { id: params.id as string }),
      ...form,
      publicada: publicar !== undefined ? publicar : form.publicada,
      meta_title: form.meta_title || null,
      meta_description: form.meta_description || null,
    } as Omit<Pagina, 'created_at' | 'updated_at'> & { id?: string })

    setSaving(false)

    if ('error' in result) {
      toast.error(result.error)
      return
    }

    toast.success(isNew ? 'Página creada' : 'Página guardada')
    if (isNew) router.push(`/admin/paginas/${result.id}`)
    else if (publicar !== undefined) set('publicada', publicar)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 size={32} className="animate-spin text-[#28B4AD]" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/paginas"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isNew ? 'Nueva página' : form.titulo || 'Editar página'}
            </h1>
            {!isNew && form.slug && (
              <a
                href={`/${form.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#28B4AD] hover:underline flex items-center gap-1 mt-0.5"
              >
                /{form.slug} <ExternalLink size={10} />
              </a>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isNew && (
            <button
              onClick={() => handleSave(!form.publicada)}
              disabled={saving}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-colors disabled:opacity-50 ${
                form.publicada
                  ? 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  : 'border-green-200 text-green-700 hover:bg-green-50'
              }`}
            >
              {form.publicada ? <EyeOff size={15} /> : <Globe size={15} />}
              {form.publicada ? 'Despublicar' : 'Publicar'}
            </button>
          )}
          <button
            onClick={() => handleSave()}
            disabled={saving}
            className="flex items-center gap-2 bg-[#28B4AD] hover:bg-[#219892] text-white px-5 py-2 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            Guardar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main editor */}
        <div className="col-span-2 space-y-5">
          {/* Título */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Título</label>
              <input
                className="form-input text-lg font-semibold"
                value={form.titulo}
                onChange={(e) => handleTituloChange(e.target.value)}
                placeholder="Título de la página"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Slug (URL: <span className="font-mono text-[#28B4AD]">/{form.slug || '...'}</span>)
              </label>
              <input
                className="form-input font-mono text-sm"
                value={form.slug}
                onChange={(e) => set('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder="mi-pagina"
              />
            </div>
          </div>

          {/* Contenido HTML */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100">
              <span className="text-sm font-semibold text-gray-700">Contenido HTML</span>
              <button
                onClick={() => setPreview(!preview)}
                className="text-xs text-[#28B4AD] font-semibold hover:underline"
              >
                {preview ? 'Editar' : 'Vista previa'}
              </button>
            </div>

            {preview ? (
              <div className="p-6 prose prose-sm max-w-none min-h-[400px]">
                <SafeHTML html={form.contenido_html || ''} />
              </div>
            ) : (
              <textarea
                className="w-full p-6 font-mono text-sm text-gray-800 min-h-[400px] resize-y border-0 focus:outline-none focus:ring-0"
                value={form.contenido_html}
                onChange={(e) => set('contenido_html', e.target.value)}
                placeholder="<h1>Título</h1><p>Contenido...</p>"
                spellCheck={false}
              />
            )}
          </div>
        </div>

        {/* Sidebar: SEO */}
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
            <h3 className="text-sm font-bold text-gray-900">SEO</h3>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Meta título
              </label>
              <input
                className="form-input text-sm"
                value={form.meta_title}
                onChange={(e) => set('meta_title', e.target.value)}
                placeholder="Igual al título si se deja vacío"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Meta descripción
              </label>
              <textarea
                className="form-input text-sm resize-none min-h-[80px]"
                value={form.meta_description}
                onChange={(e) => set('meta_description', e.target.value)}
                placeholder="Máx. 160 caracteres"
                maxLength={160}
              />
              <p className="text-xs text-gray-300 mt-1 text-right">
                {form.meta_description.length}/160
              </p>
            </div>
          </div>

          {/* Estado */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Estado</h3>
            <div className={`flex items-center gap-2 text-sm font-semibold ${
              form.publicada ? 'text-green-700' : 'text-gray-400'
            }`}>
              {form.publicada ? <Globe size={15} /> : <EyeOff size={15} />}
              {form.publicada ? 'Publicada — visible al público' : 'Borrador — no visible'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
