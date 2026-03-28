'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  ArrowLeft, Upload, Loader2, Eye, Save, Plus, Trash2,
  AlignLeft, AlignCenter, AlignRight, Move, Type,
} from 'lucide-react'
import { toast } from 'sonner'
import { upsertTemplate, getBackgroundPreviewUrl } from '@/actions/certificados-templates'
import type { CertificateTemplate, TextoLibre, ElementPosition, QRPosition } from '@/lib/certificados/types'
import { createClient } from '@/lib/supabase-client'

// ─── Constantes de canvas ─────────────────────────────────────────────────────

const CANVAS_W = 680 // px de display

const PDF_DIMS = {
  horizontal: { w: 842, h: 595 },
  vertical:   { w: 595, h: 842 },
}

// ─── Tipos internos del editor ───────────────────────────────────────────────

type ElementKey =
  | 'titulo_cert' | 'nombre_alumno' | 'rut_alumno' | 'titulo_curso'
  | 'horas' | 'fecha_emision' | 'fecha_vigencia' | 'cert_id' | 'qr_code'
  | `libre_${string}`

interface EditorElement {
  key: ElementKey
  label: string
  previewText: string
  x: number      // PDF coords
  y: number      // PDF coords
  fontSize?: number
  align?: 'left' | 'center' | 'right'
  color?: string
  visible: boolean
  isQR?: boolean
  size?: number  // solo QR
  isLibre?: boolean
  libreText?: string
}

interface EditorState {
  nombre: string
  titulo_texto: string
  curso_id: string | null
  orientacion: 'horizontal' | 'vertical'
  color_primary: string
  color_accent: string
  background_storage_path: string | null
  activo: boolean
}

interface Props {
  template: CertificateTemplate | null  // null = nuevo
  cursos: { id: string; titulo: string }[]
  existingTemplates: (CertificateTemplate & { curso_titulo?: string | null })[]
  onBack: () => void
  onSaved: () => void
}

// ─── Labels y textos de preview ──────────────────────────────────────────────

const FIXED_ELEMENTS: Omit<EditorElement, 'x' | 'y' | 'visible'>[] = [
  { key: 'titulo_cert',    label: 'Título del certificado', previewText: 'CERTIFICADO DE PARTICIPACIÓN', fontSize: 14, align: 'center' },
  { key: 'nombre_alumno', label: 'Nombre del alumno',      previewText: 'NOMBRE APELLIDO ALUMNO',        fontSize: 28, align: 'center' },
  { key: 'rut_alumno',    label: 'RUT',                    previewText: 'RUT: 12.345.678-9',             fontSize: 14, align: 'center' },
  { key: 'titulo_curso',  label: 'Nombre del curso',       previewText: 'NOMBRE DEL CURSO',              fontSize: 20, align: 'center' },
  { key: 'horas',         label: 'Horas',                  previewText: 'Duración: 24 horas',            fontSize: 12, align: 'center' },
  { key: 'fecha_emision', label: 'Fecha de emisión',       previewText: 'Fecha de emisión: 28 de marzo de 2026', fontSize: 11, align: 'center' },
  { key: 'fecha_vigencia',label: 'Fecha de vigencia',      previewText: 'Válido hasta: 28 de marzo de 2027',    fontSize: 10, align: 'center' },
  { key: 'cert_id',       label: 'ID del certificado',     previewText: 'ID: a1b2c3d4e5f6...', fontSize: 8, align: 'center' },
  { key: 'qr_code',       label: 'Código QR',              previewText: 'QR', isQR: true },
]

const POS_KEY_MAP: Record<string, keyof CertificateTemplate> = {
  titulo_cert: 'pos_titulo_cert',
  nombre_alumno: 'pos_nombre_alumno',
  rut_alumno: 'pos_rut_alumno',
  titulo_curso: 'pos_titulo_curso',
  horas: 'pos_horas',
  fecha_emision: 'pos_fecha_emision',
  fecha_vigencia: 'pos_fecha_vigencia',
  cert_id: 'pos_cert_id',
  qr_code: 'pos_qr_code',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function templateToElements(t: CertificateTemplate): EditorElement[] {
  const fixed = FIXED_ELEMENTS.map((def) => {
    const posKey = POS_KEY_MAP[def.key] as keyof CertificateTemplate
    const pos = t[posKey] as any
    return {
      ...def,
      x: pos?.x ?? 421,
      y: pos?.y ?? 300,
      fontSize: pos?.fontSize ?? def.fontSize,
      align: pos?.align ?? def.align ?? 'center',
      color: pos?.color,
      visible: pos?.visible !== false,
      size: pos?.size,
    } as EditorElement
  })

  const libre: EditorElement[] = (t.texto_libre ?? []).map((b) => ({
    key: `libre_${b.id}` as ElementKey,
    label: `Texto: "${b.text.substring(0, 20)}${b.text.length > 20 ? '…' : ''}"`,
    previewText: b.text,
    x: b.pos.x,
    y: b.pos.y,
    fontSize: b.pos.fontSize ?? 12,
    align: b.pos.align ?? 'left',
    color: b.pos.color,
    visible: b.pos.visible !== false,
    isLibre: true,
    libreText: b.text,
  }))

  return [...fixed, ...libre]
}

function elementsToPayload(elements: EditorElement[], state: EditorState) {
  const posFields: any = {}

  for (const el of elements) {
    if (el.isLibre) continue
    const posKey = POS_KEY_MAP[el.key]
    if (!posKey) continue

    if (el.isQR) {
      posFields[posKey] = { x: Math.round(el.x), y: Math.round(el.y), size: el.size ?? 90, visible: el.visible }
    } else {
      posFields[posKey] = {
        x: Math.round(el.x),
        y: Math.round(el.y),
        fontSize: el.fontSize,
        align: el.align,
        ...(el.color ? { color: el.color } : {}),
        visible: el.visible,
      }
    }
  }

  const texto_libre: TextoLibre[] = elements
    .filter((el) => el.isLibre)
    .map((el) => ({
      id: el.key.replace('libre_', ''),
      text: el.libreText ?? '',
      pos: {
        x: Math.round(el.x),
        y: Math.round(el.y),
        fontSize: el.fontSize ?? 12,
        align: el.align ?? 'left',
        ...(el.color ? { color: el.color } : {}),
        visible: el.visible,
      },
    }))

  return { ...posFields, texto_libre }
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function TemplateEditor({ template, cursos, existingTemplates, onBack, onSaved }: Props) {
  // Estado general del template
  const [state, setState] = useState<EditorState>({
    nombre: template?.nombre ?? '',
    titulo_texto: template?.titulo_texto ?? 'CERTIFICADO DE PARTICIPACIÓN',
    curso_id: template?.curso_id ?? null,
    orientacion: template?.orientacion ?? 'horizontal',
    color_primary: template?.color_primary ?? '#1a1a2e',
    color_accent: template?.color_accent ?? '#28B4AD',
    background_storage_path: template?.background_storage_path ?? null,
    activo: template?.activo ?? true,
  })

  // Elementos arrastrables
  const [elements, setElements] = useState<EditorElement[]>(() =>
    template ? templateToElements(template) : templateToElements({
      ...({} as CertificateTemplate),
      orientacion: 'horizontal',
      pos_titulo_cert:   { x: 421, y: 380, fontSize: 14, align: 'center' },
      pos_nombre_alumno: { x: 421, y: 300, fontSize: 28, align: 'center', maxWidth: 600 },
      pos_rut_alumno:    { x: 421, y: 260, fontSize: 14, align: 'center' },
      pos_titulo_curso:  { x: 421, y: 210, fontSize: 20, align: 'center', maxWidth: 500 },
      pos_horas:         { x: 421, y: 175, fontSize: 12, align: 'center' },
      pos_fecha_emision: { x: 421, y: 150, fontSize: 11, align: 'center' },
      pos_fecha_vigencia:{ x: 421, y: 130, fontSize: 10, align: 'center' },
      pos_qr_code:       { x: 720, y: 40, size: 90 },
      pos_cert_id:       { x: 421, y: 40, fontSize: 8, align: 'center' },
      texto_libre: [],
      firmantes: [],
    } as any)
  )

  const [selected, setSelected] = useState<ElementKey | null>(null)
  const [bgUrl, setBgUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [previewing, setPreviewing] = useState(false)

  // Canvas
  const canvasRef = useRef<HTMLDivElement>(null)
  const draggingRef = useRef<{ key: ElementKey; startMX: number; startMY: number; startX: number; startY: number } | null>(null)

  // Dimensiones en PDF y canvas
  const pdfDims = PDF_DIMS[state.orientacion]
  const scale = CANVAS_W / pdfDims.w
  const canvasH = Math.round(pdfDims.h * scale)

  // Convertir coordenadas PDF → canvas (Y invertida)
  const toCanvas = useCallback((px: number, py: number) => ({
    x: px * scale,
    y: (pdfDims.h - py) * scale,
  }), [scale, pdfDims.h])

  // Cargar URL firmada de fondo
  useEffect(() => {
    setBgUrl(null)
    if (!state.background_storage_path) return
    getBackgroundPreviewUrl(state.background_storage_path).then((res) => {
      if ('url' in res) setBgUrl(res.url)
    })
  }, [state.background_storage_path])

  // Drag handlers
  const onChipPointerDown = (e: React.PointerEvent, key: ElementKey) => {
    e.preventDefault()
    e.stopPropagation()
    const el = elements.find((x) => x.key === key)
    if (!el) return
    draggingRef.current = { key, startMX: e.clientX, startMY: e.clientY, startX: el.x, startY: el.y }
    setSelected(key)
    canvasRef.current?.setPointerCapture(e.pointerId)
  }

  const onCanvasPointerMove = (e: React.PointerEvent) => {
    const drag = draggingRef.current
    if (!drag) return
    const dx = (e.clientX - drag.startMX) / scale
    const dy = (e.clientY - drag.startMY) / scale
    const newX = Math.max(0, Math.min(pdfDims.w, drag.startX + dx))
    const newY = Math.max(0, Math.min(pdfDims.h, drag.startY - dy)) // Y invertida
    setElements((prev) =>
      prev.map((el) => el.key === drag.key ? { ...el, x: newX, y: newY } : el)
    )
  }

  const onCanvasPointerUp = () => {
    draggingRef.current = null
  }

  // Propiedades del elemento seleccionado
  const selectedEl = elements.find((el) => el.key === selected) ?? null

  const updateSelected = (patch: Partial<EditorElement>) => {
    setElements((prev) => prev.map((el) => el.key === selected ? { ...el, ...patch } : el))
  }

  // Agregar texto libre
  const addTextoLibre = () => {
    const id = Date.now().toString()
    const newEl: EditorElement = {
      key: `libre_${id}`,
      label: 'Texto libre',
      previewText: 'Texto libre',
      x: Math.round(pdfDims.w / 2),
      y: Math.round(pdfDims.h / 2),
      fontSize: 12,
      align: 'center',
      visible: true,
      isLibre: true,
      libreText: 'Texto libre',
    }
    setElements((prev) => [...prev, newEl])
    setSelected(newEl.key)
  }

  const removeSelectedLibre = () => {
    if (!selectedEl?.isLibre) return
    setElements((prev) => prev.filter((el) => el.key !== selected))
    setSelected(null)
  }

  // Upload de imagen de fondo
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop()
      const storagePath = `templates/bg-${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('certificados').upload(storagePath, file, { upsert: true })
      if (error) throw new Error(error.message)
      setState((s) => ({ ...s, background_storage_path: storagePath }))
      toast.success('Imagen subida correctamente')
    } catch (err: any) {
      toast.error(`Error subiendo imagen: ${err.message}`)
    } finally {
      setUploading(false)
    }
  }

  // Guardar
  const handleSave = async () => {
    if (!state.nombre.trim()) { toast.error('El nombre es obligatorio'); return }
    setSaving(true)
    const { texto_libre, ...posFields } = elementsToPayload(elements, state)
    const result = await upsertTemplate({
      id: template?.id,
      ...state,
      texto_libre,
      ...posFields,
    })
    setSaving(false)
    if ('error' in result) {
      toast.error(result.error)
    } else {
      toast.success(template?.id ? 'Plantilla actualizada' : 'Plantilla creada')
      onSaved()
    }
  }

  // Preview PDF
  const handlePreview = async () => {
    if (!state.nombre.trim()) { toast.error('Guarda un nombre primero'); return }
    setPreviewing(true)
    try {
      const { texto_libre, ...posFields } = elementsToPayload(elements, state)
      const body = { ...state, texto_libre, ...posFields, id: template?.id }
      const res = await fetch('/api/admin/certificados/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error('Error generando preview')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setPreviewing(false)
    }
  }

  // Cambiar orientación → recentrar elementos
  const handleOrientacionChange = (nueva: 'horizontal' | 'vertical') => {
    setState((s) => ({ ...s, orientacion: nueva }))
  }

  const selectedIdx = elements.findIndex((el) => el.key === selected)

  return (
    <div className="flex flex-col h-full">
      {/* ── Toolbar ── */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-slate-200 bg-white shrink-0 flex-wrap">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 transition-colors text-sm font-medium"
        >
          <ArrowLeft size={16} /> Volver
        </button>

        <div className="h-5 w-px bg-slate-200" />

        <input
          type="text"
          value={state.nombre}
          onChange={(e) => setState((s) => ({ ...s, nombre: e.target.value }))}
          placeholder="Nombre de la plantilla"
          className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-[#28B4AD] w-56"
        />

        <select
          value={state.curso_id ?? ''}
          onChange={(e) => setState((s) => ({ ...s, curso_id: e.target.value || null }))}
          className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#28B4AD] bg-white"
        >
          <option value="">Global</option>
          {cursos.map((c) => <option key={c.id} value={c.id}>{c.titulo}</option>)}
        </select>

        {/* Orientación */}
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
          {(['horizontal', 'vertical'] as const).map((o) => (
            <button
              key={o}
              onClick={() => handleOrientacionChange(o)}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all capitalize ${state.orientacion === o ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
            >
              {o}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={handlePreview}
            disabled={previewing}
            className="flex items-center gap-1.5 px-4 py-1.5 border border-slate-200 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            {previewing ? <Loader2 size={14} className="animate-spin" /> : <Eye size={14} />}
            Ver preview
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-[#28B4AD] text-white text-sm font-bold rounded-lg hover:bg-[#1f9593] transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Guardar
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Canvas ── */}
        <div className="flex-1 overflow-auto bg-slate-100 flex items-start justify-center p-6">
          <div
            ref={canvasRef}
            style={{ width: CANVAS_W, height: canvasH, position: 'relative', cursor: draggingRef.current ? 'grabbing' : 'default' }}
            className="shadow-2xl rounded overflow-hidden select-none"
            onPointerMove={onCanvasPointerMove}
            onPointerUp={onCanvasPointerUp}
          >
            {/* Fondo */}
            {bgUrl ? (
              <img src={bgUrl} alt="fondo" className="absolute inset-0 w-full h-full object-cover pointer-events-none" draggable={false} />
            ) : (
              <div className="absolute inset-0 bg-white" />
            )}

            {/* Chips de elementos */}
            {elements.map((el) => {
              const pos = toCanvas(el.x, el.y)
              const isSelected = el.key === selected
              const isHidden = !el.visible

              return (
                <div
                  key={el.key}
                  onPointerDown={(e) => onChipPointerDown(e, el.key)}
                  style={{
                    position: 'absolute',
                    left: pos.x,
                    top: pos.y,
                    transform: 'translate(-50%, -50%)',
                    cursor: 'grab',
                    zIndex: isSelected ? 20 : 10,
                    opacity: isHidden ? 0.35 : 1,
                    touchAction: 'none',
                  }}
                  title={el.label}
                >
                  {el.isQR ? (
                    <div
                      style={{
                        width: (el.size ?? 90) * scale,
                        height: (el.size ?? 90) * scale,
                        border: isSelected ? '2px solid #28B4AD' : '1.5px dashed rgba(0,0,0,0.4)',
                        borderRadius: 4,
                        background: 'rgba(255,255,255,0.7)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 9,
                        color: '#444',
                        fontWeight: 600,
                        backdropFilter: 'blur(2px)',
                      }}
                    >
                      QR
                    </div>
                  ) : (
                    <div
                      style={{
                        padding: '2px 6px',
                        borderRadius: 4,
                        border: isSelected ? '2px solid #28B4AD' : '1px dashed rgba(0,0,0,0.35)',
                        background: isSelected ? 'rgba(40,180,173,0.12)' : 'rgba(255,255,255,0.6)',
                        fontSize: Math.max(7, Math.min(13, (el.fontSize ?? 12) * scale)),
                        color: el.color ?? '#1a1a2e',
                        fontWeight: el.key === 'nombre_alumno' ? 700 : 500,
                        whiteSpace: 'nowrap',
                        maxWidth: 280,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        backdropFilter: 'blur(2px)',
                        textAlign: el.align ?? 'center',
                      }}
                    >
                      {el.previewText}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Panel lateral ── */}
        <div className="w-72 bg-white border-l border-slate-200 flex flex-col overflow-y-auto shrink-0">

          {/* Propiedades del elemento seleccionado */}
          <div className="p-4 border-b border-slate-100">
            <p className="text-xs font-black uppercase text-slate-400 mb-3">
              {selectedEl ? selectedEl.label : 'Selecciona un elemento'}
            </p>

            {selectedEl && (
              <div className="space-y-3">
                {/* Texto libre: editar contenido */}
                {selectedEl.isLibre && (
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Texto</label>
                    <textarea
                      value={selectedEl.libreText ?? ''}
                      onChange={(e) => updateSelected({ libreText: e.target.value, previewText: e.target.value, label: `Texto: "${e.target.value.substring(0, 20)}"` })}
                      rows={2}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#28B4AD] resize-none"
                    />
                  </div>
                )}

                {/* Posición */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">X (PDF)</label>
                    <input
                      type="number"
                      value={Math.round(selectedEl.x)}
                      onChange={(e) => updateSelected({ x: Number(e.target.value) })}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#28B4AD]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Y (PDF)</label>
                    <input
                      type="number"
                      value={Math.round(selectedEl.y)}
                      onChange={(e) => updateSelected({ y: Number(e.target.value) })}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#28B4AD]"
                    />
                  </div>
                </div>

                {/* QR: tamaño */}
                {selectedEl.isQR && (
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Tamaño (px PDF)</label>
                    <input
                      type="number"
                      value={selectedEl.size ?? 90}
                      onChange={(e) => updateSelected({ size: Number(e.target.value) })}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#28B4AD]"
                    />
                  </div>
                )}

                {/* Texto: fontSize, align, color */}
                {!selectedEl.isQR && (
                  <>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Tamaño de fuente</label>
                      <input
                        type="number"
                        value={selectedEl.fontSize ?? 12}
                        onChange={(e) => updateSelected({ fontSize: Number(e.target.value) })}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#28B4AD]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-slate-500 mb-1.5">Alineación</label>
                      <div className="flex gap-1">
                        {(['left', 'center', 'right'] as const).map((a) => (
                          <button
                            key={a}
                            onClick={() => updateSelected({ align: a })}
                            className={`flex-1 flex items-center justify-center py-1.5 rounded-lg border transition-all ${selectedEl.align === a ? 'bg-[#28B4AD] border-[#28B4AD] text-white' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                          >
                            {a === 'left' && <AlignLeft size={13} />}
                            {a === 'center' && <AlignCenter size={13} />}
                            {a === 'right' && <AlignRight size={13} />}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Color del texto</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={selectedEl.color ?? '#1a1a2e'}
                          onChange={(e) => updateSelected({ color: e.target.value })}
                          className="w-8 h-8 rounded border border-slate-200 cursor-pointer p-0.5"
                        />
                        <input
                          type="text"
                          value={selectedEl.color ?? ''}
                          onChange={(e) => updateSelected({ color: e.target.value })}
                          placeholder="Usa color global"
                          className="flex-1 px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 outline-none focus:ring-2 focus:ring-[#28B4AD]"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Visible toggle */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-slate-600 font-medium">Visible en PDF</span>
                  <div
                    onClick={() => updateSelected({ visible: !selectedEl.visible })}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full cursor-pointer transition-colors ${selectedEl.visible ? 'bg-[#28B4AD]' : 'bg-slate-300'}`}
                  >
                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${selectedEl.visible ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
                  </div>
                </div>

                {/* Eliminar texto libre */}
                {selectedEl.isLibre && (
                  <button
                    onClick={removeSelectedLibre}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg border border-red-200 transition-colors"
                  >
                    <Trash2 size={12} /> Eliminar bloque
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Configuración general */}
          <div className="p-4 border-b border-slate-100 space-y-3">
            <p className="text-xs font-black uppercase text-slate-400">Diseño</p>

            {/* Título del cert */}
            <div>
              <label className="block text-xs text-slate-500 mb-1">Título del certificado</label>
              <input
                type="text"
                value={state.titulo_texto}
                onChange={(e) => setState((s) => ({ ...s, titulo_texto: e.target.value }))}
                className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#28B4AD]"
              />
            </div>

            {/* Colores */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Color primario</label>
                <div className="flex items-center gap-1.5">
                  <input type="color" value={state.color_primary} onChange={(e) => setState((s) => ({ ...s, color_primary: e.target.value }))}
                    className="w-7 h-7 rounded border border-slate-200 cursor-pointer p-0.5" />
                  <input type="text" value={state.color_primary} onChange={(e) => setState((s) => ({ ...s, color_primary: e.target.value }))}
                    className="flex-1 px-1.5 py-1 border border-slate-200 rounded text-xs font-mono text-slate-800 outline-none focus:ring-2 focus:ring-[#28B4AD]" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Color acento</label>
                <div className="flex items-center gap-1.5">
                  <input type="color" value={state.color_accent} onChange={(e) => setState((s) => ({ ...s, color_accent: e.target.value }))}
                    className="w-7 h-7 rounded border border-slate-200 cursor-pointer p-0.5" />
                  <input type="text" value={state.color_accent} onChange={(e) => setState((s) => ({ ...s, color_accent: e.target.value }))}
                    className="flex-1 px-1.5 py-1 border border-slate-200 rounded text-xs font-mono text-slate-800 outline-none focus:ring-2 focus:ring-[#28B4AD]" />
                </div>
              </div>
            </div>

            {/* Imagen de fondo */}
            <div>
              <label className="block text-xs text-slate-500 mb-1">Imagen de fondo</label>
              <label className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors">
                {uploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                {uploading ? 'Subiendo...' : state.background_storage_path ? 'Cambiar imagen' : 'Subir imagen'}
                <input type="file" accept="image/jpeg,image/png" className="hidden" onChange={handleImageUpload} disabled={uploading} />
              </label>
              {state.background_storage_path && (
                <p className="text-xs text-slate-400 mt-1 truncate font-mono">{state.background_storage_path.split('/').pop()}</p>
              )}
            </div>

            {/* Activo */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-600 font-medium">Plantilla activa</span>
              <div
                onClick={() => setState((s) => ({ ...s, activo: !s.activo }))}
                className={`relative inline-flex h-5 w-9 items-center rounded-full cursor-pointer transition-colors ${state.activo ? 'bg-[#28B4AD]' : 'bg-slate-300'}`}
              >
                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${state.activo ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
              </div>
            </div>
          </div>

          {/* Texto libre */}
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-black uppercase text-slate-400">Texto libre</p>
              <button
                onClick={addTextoLibre}
                className="flex items-center gap-1 text-xs font-semibold text-[#28B4AD] hover:text-[#1f9593] transition-colors"
              >
                <Plus size={12} /> Agregar
              </button>
            </div>
            <p className="text-xs text-slate-400">Agrega bloques de texto estático con posición libre en el certificado.</p>

            {/* Lista de elementos fijos para seleccionar */}
            <div className="mt-3 space-y-1">
              <p className="text-xs font-semibold text-slate-500 mb-1">Elementos</p>
              {elements.map((el) => (
                <button
                  key={el.key}
                  onClick={() => setSelected(el.key)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left text-xs transition-all ${el.key === selected ? 'bg-[#28B4AD]/10 text-[#28B4AD] font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  {el.isQR ? <Move size={11} className="shrink-0 opacity-60" /> : el.isLibre ? <Type size={11} className="shrink-0 opacity-60" /> : <Move size={11} className="shrink-0 opacity-60" />}
                  <span className="truncate">{el.label}</span>
                  {!el.visible && <span className="ml-auto text-slate-400 text-xs">oculto</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
