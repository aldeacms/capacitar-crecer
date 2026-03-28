'use client'

import { useState } from 'react'
import {
  Award, Plus, Edit2, Trash2, CheckCircle2, XCircle,
  AlertTriangle, Loader2, X, Globe, Copy,
} from 'lucide-react'
import { toast } from 'sonner'
import { deleteTemplate, invalidarCertificadoAdmin, duplicateTemplate } from '@/actions/certificados-templates'
import type { CertificateTemplate } from '@/lib/certificados/types'
import TemplateEditor from './TemplateEditor'

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

// ─── Modal "¿Desde dónde partes?" ────────────────────────────────────────────

function StartModal({
  templates,
  onSelect,
  onClose,
}: {
  templates: TemplateWithCurso[]
  onSelect: (base: TemplateWithCurso | null) => void
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">Nueva plantilla</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
            <X size={18} className="text-slate-400" />
          </button>
        </div>

        <div className="p-6 space-y-3">
          <p className="text-sm text-slate-600 mb-4">¿Desde dónde quieres empezar?</p>

          {/* Desde cero */}
          <button
            onClick={() => onSelect(null)}
            className="w-full flex items-center gap-3 px-4 py-3 border-2 border-dashed border-slate-200 rounded-xl hover:border-[#28B4AD] hover:bg-[#28B4AD]/5 transition-all text-left group"
          >
            <div className="w-9 h-9 bg-slate-100 group-hover:bg-[#28B4AD]/10 rounded-lg flex items-center justify-center transition-colors">
              <Plus size={18} className="text-slate-500 group-hover:text-[#28B4AD]" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">Desde cero</p>
              <p className="text-xs text-slate-500">Posiciones por defecto, sin fondo</p>
            </div>
          </button>

          {/* Basarse en existente */}
          {templates.length > 0 && (
            <>
              <div className="relative py-1">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-100" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-3 text-xs text-slate-400 font-medium">o copiar desde</span>
                </div>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {templates.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => onSelect(t)}
                    className="w-full flex items-center gap-3 px-4 py-3 border border-slate-200 rounded-xl hover:border-[#28B4AD] hover:bg-[#28B4AD]/5 transition-all text-left group"
                  >
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="w-4 h-4 rounded border border-slate-200" style={{ background: t.color_primary }} />
                      <span className="w-4 h-4 rounded border border-slate-200" style={{ background: t.color_accent }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{t.nombre}</p>
                      <p className="text-xs text-slate-400 truncate">
                        {t.curso_titulo ?? 'Global'} · {t.orientacion ?? 'horizontal'}
                      </p>
                    </div>
                    <Copy size={13} className="text-slate-300 group-hover:text-[#28B4AD] shrink-0 transition-colors" />
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Modal confirmar duplicar ─────────────────────────────────────────────────

function DuplicateModal({
  template,
  cursos,
  onConfirm,
  onClose,
}: {
  template: TemplateWithCurso
  cursos: Curso[]
  onConfirm: (nombre: string, cursoId: string | null) => Promise<void>
  onClose: () => void
}) {
  const [nombre, setNombre] = useState(`${template.nombre} (copia)`)
  const [cursoId, setCursoId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    if (!nombre.trim()) { toast.error('El nombre es obligatorio'); return }
    setLoading(true)
    await onConfirm(nombre, cursoId)
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">Duplicar plantilla</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
            <X size={18} className="text-slate-400" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Nombre</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-900 outline-none focus:ring-2 focus:ring-[#28B4AD]"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Asignar a curso</label>
            <select
              value={cursoId ?? ''}
              onChange={(e) => setCursoId(e.target.value || null)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-900 outline-none focus:ring-2 focus:ring-[#28B4AD] bg-white"
            >
              <option value="">Global</option>
              {cursos.map((c) => <option key={c.id} value={c.id}>{c.titulo}</option>)}
            </select>
          </div>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors text-sm">
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#28B4AD] text-white font-bold rounded-xl hover:bg-[#1f9593] transition-colors disabled:opacity-50 text-sm"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : null}
            Duplicar
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function CertificadosClient({ templates: initialTemplates, certificados, cursos }: Props) {
  const [templatesList, setTemplatesList] = useState(initialTemplates)
  const [certsList, setCertsList] = useState(certificados)
  const [tab, setTab] = useState<'templates' | 'emitidos'>('templates')

  // Editor
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<TemplateWithCurso | null>(null)

  // Modales
  const [showStartModal, setShowStartModal] = useState(false)
  const [duplicatingTemplate, setDuplicatingTemplate] = useState<TemplateWithCurso | null>(null)

  // Acciones
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [invalidatingId, setInvalidatingId] = useState<string | null>(null)

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('es-CL')

  // Abrir editor con template existente
  const openEdit = (t: TemplateWithCurso) => {
    setEditingTemplate(t)
    setEditorOpen(true)
  }

  // Desde el StartModal: base seleccionada (null = desde cero)
  const handleStartSelect = (base: TemplateWithCurso | null) => {
    setShowStartModal(false)
    // Si es copia, editingTemplate tendrá el contenido del base pero sin id (nuevo)
    if (base) {
      setEditingTemplate({ ...base, id: '', nombre: `${base.nombre} (nuevo)`, curso_id: null } as any)
    } else {
      setEditingTemplate(null)
    }
    setEditorOpen(true)
  }

  const handleEditorBack = () => {
    setEditorOpen(false)
    setEditingTemplate(null)
  }

  const handleEditorSaved = () => {
    setEditorOpen(false)
    setEditingTemplate(null)
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

  const handleDuplicate = async (nombre: string, cursoId: string | null) => {
    if (!duplicatingTemplate) return
    const result = await duplicateTemplate(duplicatingTemplate.id, nombre, cursoId)
    if ('error' in result) {
      toast.error(result.error)
    } else {
      toast.success('Plantilla duplicada')
      setDuplicatingTemplate(null)
      window.location.reload()
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

  // ── Si el editor está abierto, ocupa toda la pantalla ──
  if (editorOpen) {
    return (
      <TemplateEditor
        template={editingTemplate?.id ? editingTemplate as CertificateTemplate : null}
        cursos={cursos}
        existingTemplates={templatesList}
        onBack={handleEditorBack}
        onSaved={handleEditorSaved}
      />
    )
  }

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
              onClick={() => setShowStartModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#28B4AD] text-white font-bold text-sm rounded-xl hover:bg-[#1f9593] transition-all shadow-sm"
            >
              <Plus size={16} /> Nueva plantilla
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
          {(['templates', 'emitidos'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${tab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {t === 'templates' ? `Plantillas (${templatesList.length})` : `Emitidos (${certsList.length})`}
            </button>
          ))}
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
                    <th className="px-6 py-3">Aplica a</th>
                    <th className="px-6 py-3">Orientación</th>
                    <th className="px-6 py-3">Colores</th>
                    <th className="px-6 py-3">Estado</th>
                    <th className="px-6 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {templatesList.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-800 text-sm">{t.nombre}</p>
                        <p className="text-xs text-slate-400 truncate max-w-[200px]">{t.titulo_texto}</p>
                      </td>
                      <td className="px-6 py-4">
                        {t.curso_id ? (
                          <span className="text-xs text-slate-700 font-medium">{t.curso_titulo ?? t.curso_id}</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-[#28B4AD] font-semibold">
                            <Globe size={12} /> Global
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600 capitalize">{t.orientacion ?? 'horizontal'}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded border border-slate-200" style={{ background: t.color_primary }} />
                          <span className="w-5 h-5 rounded border border-slate-200" style={{ background: t.color_accent }} />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${t.activo ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                          {t.activo ? 'Activa' : 'Inactiva'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEdit(t)}
                            className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                            title="Editar"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => setDuplicatingTemplate(t)}
                            className="p-1.5 text-slate-400 hover:text-[#28B4AD] hover:bg-[#28B4AD]/10 rounded-lg transition-all"
                            title="Duplicar"
                          >
                            <Copy size={15} />
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

      {/* Modales */}
      {showStartModal && (
        <StartModal
          templates={templatesList}
          onSelect={handleStartSelect}
          onClose={() => setShowStartModal(false)}
        />
      )}

      {duplicatingTemplate && (
        <DuplicateModal
          template={duplicatingTemplate}
          cursos={cursos}
          onConfirm={handleDuplicate}
          onClose={() => setDuplicatingTemplate(null)}
        />
      )}
    </>
  )
}
