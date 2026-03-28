'use client'

import { useState } from 'react'
import { Award, Plus, Edit2, Trash2, CheckCircle2, XCircle, AlertTriangle, Loader2, X, Upload, Globe } from 'lucide-react'
import { toast } from 'sonner'
import { upsertTemplate, deleteTemplate, invalidarCertificadoAdmin } from '@/actions/certificados-templates'
import type { CertificateTemplate, Firmante } from '@/lib/certificados/types'
import { createClient } from '@/lib/supabase-client'

// ─── Tipos ───────────────────────────────────────────────────────────────────

type TemplateWithCurso = CertificateTemplate & { curso_titulo?: string | null }

interface Curso { id: string; titulo: string }

interface Certificado {
  id: string
  created_at: string
  fecha_vigencia: string | null
  invalidado_at: string | null
  version: number
  alumno_nombre: string
  curso_titulo: string
}

interface Props {
  templates: TemplateWithCurso[]
  certificados: Certificado[]
  cursos: Curso[]
}

// ─── Formulario de plantilla ─────────────────────────────────────────────────

const EMPTY_TEMPLATE = {
  nombre: '',
  titulo_texto: 'CERTIFICADO DE PARTICIPACIÓN',
  curso_id: null as string | null,
  color_primary: '#1a1a2e',
  color_accent: '#28B4AD',
  background_storage_path: null as string | null,
  firmantes: [] as Firmante[],
  activo: true,
}

function TemplateModal({
  template,
  cursos,
  onClose,
  onSaved,
}: {
  template: TemplateWithCurso | null
  cursos: Curso[]
  onClose: () => void
  onSaved: () => void
}) {
  const isEdit = !!template?.id && template.id !== 'default-hardcoded'
  const [form, setForm] = useState({
    nombre: template?.nombre ?? EMPTY_TEMPLATE.nombre,
    titulo_texto: template?.titulo_texto ?? EMPTY_TEMPLATE.titulo_texto,
    curso_id: template?.curso_id ?? EMPTY_TEMPLATE.curso_id,
    color_primary: template?.color_primary ?? EMPTY_TEMPLATE.color_primary,
    color_accent: template?.color_accent ?? EMPTY_TEMPLATE.color_accent,
    background_storage_path: template?.background_storage_path ?? null,
    firmantes: template?.firmantes ?? [],
    activo: template?.activo ?? true,
  })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const setFirmante = (idx: number, field: keyof Firmante | 'pos_x' | 'pos_y' | 'pos_width', value: string) => {
    setForm((f) => {
      const firmantes = [...f.firmantes]
      const firm = { ...firmantes[idx] }
      if (field === 'pos_x') firm.pos = { ...firm.pos, x: Number(value) }
      else if (field === 'pos_y') firm.pos = { ...firm.pos, y: Number(value) }
      else if (field === 'pos_width') firm.pos = { ...firm.pos, width: Number(value) }
      else (firm as any)[field] = value
      firmantes[idx] = firm
      return { ...f, firmantes }
    })
  }

  const addFirmante = () => {
    setForm((f) => ({
      ...f,
      firmantes: [...f.firmantes, { nombre: '', cargo: '', pos: { x: 200, y: 80, width: 150 } }],
    }))
  }

  const removeFirmante = (idx: number) => {
    setForm((f) => ({ ...f, firmantes: f.firmantes.filter((_, i) => i !== idx) }))
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Solo se permiten imágenes (JPG, PNG)')
      return
    }
    setUploading(true)
    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop()
      const storagePath = `templates/bg-${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('certificados').upload(storagePath, file, { upsert: true })
      if (error) throw new Error(error.message)
      setForm((f) => ({ ...f, background_storage_path: storagePath }))
      toast.success('Imagen subida correctamente')
    } catch (err: any) {
      toast.error(`Error subiendo imagen: ${err.message}`)
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    if (!form.nombre.trim()) { toast.error('El nombre es obligatorio'); return }
    if (!form.titulo_texto.trim()) { toast.error('El título del certificado es obligatorio'); return }

    setSaving(true)
    const result = await upsertTemplate({
      id: isEdit ? template!.id : undefined,
      ...form,
    })
    setSaving(false)

    if ('error' in result) {
      toast.error(result.error)
    } else {
      toast.success(isEdit ? 'Plantilla actualizada' : 'Plantilla creada')
      onSaved()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <h2 className="text-lg font-bold text-slate-900">
            {isEdit ? 'Editar plantilla' : 'Nueva plantilla'}
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
            <X size={18} className="text-slate-400" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-5">
          {/* Nombre */}
          <div>
            <label className="block text-xs font-black uppercase text-slate-500 mb-1.5">Nombre de la plantilla</label>
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-900 text-sm outline-none focus:ring-2 focus:ring-[#28B4AD]"
              placeholder="Ej: Plantilla Estándar, Plantilla Computación"
            />
          </div>

          {/* Título del certificado */}
          <div>
            <label className="block text-xs font-black uppercase text-slate-500 mb-1.5">Título del certificado</label>
            <input
              type="text"
              value={form.titulo_texto}
              onChange={(e) => setForm((f) => ({ ...f, titulo_texto: e.target.value }))}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-900 text-sm outline-none focus:ring-2 focus:ring-[#28B4AD]"
              placeholder="Ej: CERTIFICADO DE PARTICIPACIÓN"
            />
            <p className="text-xs text-slate-400 mt-1">Este texto aparece al inicio del certificado en el PDF.</p>
          </div>

          {/* Curso */}
          <div>
            <label className="block text-xs font-black uppercase text-slate-500 mb-1.5">Aplicar a curso</label>
            <select
              value={form.curso_id ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, curso_id: e.target.value || null }))}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-900 text-sm outline-none focus:ring-2 focus:ring-[#28B4AD] bg-white"
            >
              <option value="">Global (aplica a todos los cursos sin plantilla propia)</option>
              {cursos.map((c) => (
                <option key={c.id} value={c.id}>{c.titulo}</option>
              ))}
            </select>
          </div>

          {/* Colores */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black uppercase text-slate-500 mb-1.5">Color primario</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={form.color_primary}
                  onChange={(e) => setForm((f) => ({ ...f, color_primary: e.target.value }))}
                  className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer p-1"
                />
                <input
                  type="text"
                  value={form.color_primary}
                  onChange={(e) => setForm((f) => ({ ...f, color_primary: e.target.value }))}
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-slate-900 text-sm font-mono outline-none focus:ring-2 focus:ring-[#28B4AD]"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-slate-500 mb-1.5">Color acento</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={form.color_accent}
                  onChange={(e) => setForm((f) => ({ ...f, color_accent: e.target.value }))}
                  className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer p-1"
                />
                <input
                  type="text"
                  value={form.color_accent}
                  onChange={(e) => setForm((f) => ({ ...f, color_accent: e.target.value }))}
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-slate-900 text-sm font-mono outline-none focus:ring-2 focus:ring-[#28B4AD]"
                />
              </div>
            </div>
          </div>

          {/* Imagen de fondo */}
          <div>
            <label className="block text-xs font-black uppercase text-slate-500 mb-1.5">Imagen de fondo</label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors">
                {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                {uploading ? 'Subiendo...' : 'Subir imagen'}
                <input type="file" accept="image/jpeg,image/png" className="hidden" onChange={handleImageUpload} disabled={uploading} />
              </label>
              {form.background_storage_path && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <CheckCircle2 size={16} className="text-green-500" />
                  <span className="truncate max-w-xs font-mono text-xs">{form.background_storage_path}</span>
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, background_storage_path: null }))}
                    className="text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">JPG o PNG, horizontal A4 (842×595 px recomendado).</p>
          </div>

          {/* Firmantes */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-black uppercase text-slate-500">Firmantes</label>
              <button
                type="button"
                onClick={addFirmante}
                className="flex items-center gap-1.5 text-xs font-semibold text-[#28B4AD] hover:text-[#1f9593] transition-colors"
              >
                <Plus size={14} /> Agregar firmante
              </button>
            </div>
            {form.firmantes.length === 0 && (
              <p className="text-xs text-slate-400 py-3 text-center border border-dashed border-slate-200 rounded-xl">
                Sin firmantes configurados
              </p>
            )}
            <div className="space-y-3">
              {form.firmantes.map((f, idx) => (
                <div key={idx} className="border border-slate-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-600">Firmante {idx + 1}</span>
                    <button type="button" onClick={() => removeFirmante(idx)} className="text-slate-400 hover:text-red-500 transition-colors">
                      <X size={14} />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Nombre</label>
                      <input
                        type="text"
                        value={f.nombre}
                        onChange={(e) => setFirmante(idx, 'nombre', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 outline-none focus:ring-2 focus:ring-[#28B4AD]"
                        placeholder="Ej: Juan Pérez"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Cargo</label>
                      <input
                        type="text"
                        value={f.cargo}
                        onChange={(e) => setFirmante(idx, 'cargo', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 outline-none focus:ring-2 focus:ring-[#28B4AD]"
                        placeholder="Ej: Director Académico"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Posición X</label>
                      <input type="number" value={f.pos.x} onChange={(e) => setFirmante(idx, 'pos_x', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 outline-none focus:ring-2 focus:ring-[#28B4AD]" />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Posición Y</label>
                      <input type="number" value={f.pos.y} onChange={(e) => setFirmante(idx, 'pos_y', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 outline-none focus:ring-2 focus:ring-[#28B4AD]" />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Ancho línea</label>
                      <input type="number" value={f.pos.width} onChange={(e) => setFirmante(idx, 'pos_width', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 outline-none focus:ring-2 focus:ring-[#28B4AD]" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Activo */}
          <div className="flex items-center gap-3">
            <div
              onClick={() => setForm((f) => ({ ...f, activo: !f.activo }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full cursor-pointer transition-colors ${form.activo ? 'bg-[#28B4AD]' : 'bg-slate-300'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form.activo ? 'translate-x-6' : 'translate-x-1'}`} />
            </div>
            <span className="text-sm text-slate-700 font-medium">Plantilla activa</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-slate-100 shrink-0">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#28B4AD] text-white font-bold rounded-xl hover:bg-[#1f9593] transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : null}
            {saving ? 'Guardando...' : 'Guardar plantilla'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function CertificadosClient({ templates, certificados, cursos }: Props) {
  const [templatesList, setTemplatesList] = useState(templates)
  const [certsList, setCertsList] = useState(certificados)
  const [modalTemplate, setModalTemplate] = useState<TemplateWithCurso | null | 'new'>('new' as any)
  const [showModal, setShowModal] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [invalidatingId, setInvalidatingId] = useState<string | null>(null)
  const [tab, setTab] = useState<'templates' | 'emitidos'>('templates')

  const openCreate = () => { setModalTemplate(null); setShowModal(true) }
  const openEdit = (t: TemplateWithCurso) => { setModalTemplate(t); setShowModal(true) }
  const closeModal = () => setShowModal(false)

  const handleSaved = () => {
    setShowModal(false)
    window.location.reload()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta plantilla? Los certificados ya emitidos no se verán afectados.')) return
    setDeletingId(id)
    const result = await deleteTemplate(id)
    setDeletingId(null)
    if ('error' in result) {
      toast.error(result.error)
    } else {
      toast.success('Plantilla eliminada')
      setTemplatesList((prev) => prev.filter((t) => t.id !== id))
    }
  }

  const handleInvalidar = async (id: string) => {
    if (!confirm('¿Invalidar este certificado? El alumno verá el QR como inválido.')) return
    setInvalidatingId(id)
    const result = await invalidarCertificadoAdmin(id)
    setInvalidatingId(null)
    if ('error' in result) {
      toast.error(result.error)
    } else {
      toast.success('Certificado invalidado')
      setCertsList((prev) => prev.map((c) => c.id === id ? { ...c, invalidado_at: new Date().toISOString() } : c))
    }
  }

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('es-CL')

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#28B4AD]/10 rounded-xl flex items-center justify-center">
              <Award size={24} className="text-[#28B4AD]" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900">Certificados</h1>
              <p className="text-sm text-slate-500 mt-0.5">Diseña plantillas y gestiona certificados emitidos.</p>
            </div>
          </div>
          {tab === 'templates' && (
            <button
              onClick={openCreate}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#28B4AD] text-white font-bold text-sm rounded-xl hover:bg-[#1f9593] transition-all shadow-sm"
            >
              <Plus size={16} /> Nueva plantilla
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
          <button
            onClick={() => setTab('templates')}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${tab === 'templates' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Plantillas ({templatesList.length})
          </button>
          <button
            onClick={() => setTab('emitidos')}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${tab === 'emitidos' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Emitidos ({certsList.length})
          </button>
        </div>

        {/* Templates */}
        {tab === 'templates' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {templatesList.length === 0 ? (
              <div className="py-16 text-center text-slate-400">
                <Award size={40} className="mx-auto mb-3 opacity-30" />
                <p className="font-medium">No hay plantillas. Crea la primera.</p>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs font-bold uppercase tracking-wider">
                    <th className="px-6 py-3">Nombre</th>
                    <th className="px-6 py-3">Título del cert.</th>
                    <th className="px-6 py-3">Aplica a</th>
                    <th className="px-6 py-3">Colores</th>
                    <th className="px-6 py-3">Firmantes</th>
                    <th className="px-6 py-3">Estado</th>
                    <th className="px-6 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {templatesList.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4 font-semibold text-slate-800 text-sm">{t.nombre}</td>
                      <td className="px-6 py-4 text-xs text-slate-600 max-w-[180px] truncate">{t.titulo_texto}</td>
                      <td className="px-6 py-4">
                        {t.curso_id ? (
                          <span className="text-xs text-slate-700 font-medium">{t.curso_titulo ?? t.curso_id}</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-[#28B4AD] font-semibold">
                            <Globe size={12} /> Global
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded border border-slate-200 inline-block" style={{ background: t.color_primary }} title={t.color_primary} />
                          <span className="w-5 h-5 rounded border border-slate-200 inline-block" style={{ background: t.color_accent }} title={t.color_accent} />
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{t.firmantes?.length ?? 0}</td>
                      <td className="px-6 py-4">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${t.activo ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                          {t.activo ? 'Activa' : 'Inactiva'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEdit(t)}
                            className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                            title="Editar"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => handleDelete(t.id)}
                            disabled={deletingId === t.id}
                            className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
                            title="Eliminar"
                          >
                            {deletingId === t.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Certificados emitidos */}
        {tab === 'emitidos' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {certsList.length === 0 ? (
              <div className="py-16 text-center text-slate-400">
                <Award size={40} className="mx-auto mb-3 opacity-30" />
                <p className="font-medium">No hay certificados emitidos aún.</p>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs font-bold uppercase tracking-wider">
                    <th className="px-6 py-3">Alumno</th>
                    <th className="px-6 py-3">Curso</th>
                    <th className="px-6 py-3">Emitido</th>
                    <th className="px-6 py-3">Vigencia</th>
                    <th className="px-6 py-3">Estado</th>
                    <th className="px-6 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {certsList.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4 text-sm font-medium text-slate-800">{c.alumno_nombre}</td>
                      <td className="px-6 py-4 text-sm text-slate-600 max-w-[200px] truncate">{c.curso_titulo}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{formatDate(c.created_at)}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{c.fecha_vigencia ? formatDate(c.fecha_vigencia) : '—'}</td>
                      <td className="px-6 py-4">
                        {c.invalidado_at ? (
                          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold bg-red-100 text-red-700">
                            <XCircle size={12} /> Invalidado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold bg-green-100 text-green-700">
                            <CheckCircle2 size={12} /> Válido
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                          {!c.invalidado_at && (
                            <button
                              onClick={() => handleInvalidar(c.id)}
                              disabled={invalidatingId === c.id}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
                              title="Invalidar certificado"
                            >
                              {invalidatingId === c.id ? <Loader2 size={12} className="animate-spin" /> : <AlertTriangle size={12} />}
                              Invalidar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {showModal && (
        <TemplateModal
          template={modalTemplate as TemplateWithCurso | null}
          cursos={cursos}
          onClose={closeModal}
          onSaved={handleSaved}
        />
      )}
    </>
  )
}
