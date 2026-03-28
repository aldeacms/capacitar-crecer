'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  ArrowLeft, Upload, Loader2, Eye, Save, Plus, Trash2,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Move, Type, Grid3x3, QrCode, Bold,
} from 'lucide-react'
import { toast } from 'sonner'
import { upsertTemplate, getBackgroundPreviewUrl } from '@/actions/certificados-templates'
import type { CertificateTemplate, TextoLibre } from '@/lib/certificados/types'
import { createClient } from '@/lib/supabase-client'

// ─── Constantes ───────────────────────────────────────────────────────────────

const CANVAS_W  = 680
const GRID_SIZE = 50   // pts PDF
const SNAP_DIST = 12   // pts PDF

const PDF_DIMS = {
  horizontal: { w: 842, h: 595 },
  vertical:   { w: 595, h: 842 },
}

// Variables disponibles para texto libre
const VARIABLES = [
  { label: 'Nombre alumno',    value: '{{nombre_alumno}}' },
  { label: 'RUT alumno',       value: '{{rut_alumno}}' },
  { label: 'Nombre curso',     value: '{{nombre_curso}}' },
  { label: 'Horas',            value: '{{horas}}' },
  { label: 'Fecha emisión',    value: '{{fecha_emision}}' },
  { label: 'Fecha vigencia',   value: '{{fecha_vigencia}}' },
]

// ─── Tipos internos ───────────────────────────────────────────────────────────

type ElementKey =
  | 'titulo_cert' | 'nombre_alumno' | 'rut_alumno' | 'titulo_curso'
  | 'horas' | 'fecha_emision' | 'fecha_vigencia' | 'cert_id' | 'qr_code'
  | `libre_${string}`

interface EditorElement {
  key: ElementKey
  label: string
  previewText: string
  x: number
  y: number
  fontSize?: number
  align?: 'left' | 'center' | 'right' | 'justify'
  color?: string
  visible: boolean
  isQR?: boolean
  qrColor?: string
  size?: number
  isLibre?: boolean
  libreText?: string
  lineHeight?: number
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
  template: CertificateTemplate | null
  cursos: { id: string; titulo: string }[]
  existingTemplates: (CertificateTemplate & { curso_titulo?: string | null })[]
  onBack: () => void
  onSaved: () => void
}

// ─── Elementos fijos ──────────────────────────────────────────────────────────

const FIXED_ELEMENTS: Omit<EditorElement, 'x' | 'y' | 'visible'>[] = [
  { key: 'titulo_cert',    label: 'Título del certificado', previewText: 'CERTIFICADO DE PARTICIPACIÓN', fontSize: 14, align: 'center' },
  { key: 'nombre_alumno', label: 'Nombre del alumno',      previewText: 'NOMBRE APELLIDO ALUMNO',       fontSize: 28, align: 'center' },
  { key: 'rut_alumno',    label: 'RUT',                    previewText: 'RUT: 12.345.678-9',            fontSize: 14, align: 'center' },
  { key: 'titulo_curso',  label: 'Nombre del curso',       previewText: 'NOMBRE DEL CURSO',             fontSize: 20, align: 'center' },
  { key: 'horas',         label: 'Horas',                  previewText: 'Duración: 24 horas',           fontSize: 12, align: 'center' },
  { key: 'fecha_emision', label: 'Fecha de emisión',       previewText: 'Fecha de emisión: 28 mar 2026', fontSize: 11, align: 'center' },
  { key: 'fecha_vigencia',label: 'Fecha de vigencia',      previewText: 'Válido hasta: 28 mar 2027',    fontSize: 10, align: 'center' },
  { key: 'cert_id',       label: 'ID del certificado',     previewText: 'ID: a1b2c3d4e5f6...',          fontSize: 8,  align: 'center' },
  { key: 'qr_code',       label: 'Código QR',              previewText: 'QR', isQR: true },
]

const POS_KEY_MAP: Record<string, keyof CertificateTemplate> = {
  titulo_cert:   'pos_titulo_cert',
  nombre_alumno: 'pos_nombre_alumno',
  rut_alumno:    'pos_rut_alumno',
  titulo_curso:  'pos_titulo_curso',
  horas:         'pos_horas',
  fecha_emision: 'pos_fecha_emision',
  fecha_vigencia:'pos_fecha_vigencia',
  cert_id:       'pos_cert_id',
  qr_code:       'pos_qr_code',
}

// ─── Snap helper ─────────────────────────────────────────────────────────────

function snapVal(val: number, center: number, threshold: number): number {
  if (Math.abs(val - center) < threshold) return center
  const nearest = Math.round(val / GRID_SIZE) * GRID_SIZE
  if (Math.abs(val - nearest) < threshold) return nearest
  return val
}

// ─── Conversión template → elementos ─────────────────────────────────────────

function templateToElements(t: CertificateTemplate): EditorElement[] {
  const dims = PDF_DIMS[t.orientacion ?? 'horizontal']

  const clampX = (v: number) => Math.max(5, Math.min(dims.w - 5, v))
  const clampY = (v: number) => Math.max(5, Math.min(dims.h - 5, v))

  const fixed = FIXED_ELEMENTS.map((def) => {
    const posKey = POS_KEY_MAP[def.key] as keyof CertificateTemplate
    const pos = t[posKey] as any

    // Default centrado si la posición guardada está fuera del canvas actual
    const defaultX = dims.w / 2
    const defaultY = dims.h / 2
    const rawX = pos?.x ?? defaultX
    const rawY = pos?.y ?? defaultY

    return {
      ...def,
      x: clampX(rawX),
      y: clampY(rawY),
      fontSize: pos?.fontSize ?? def.fontSize,
      align: pos?.align ?? def.align ?? 'center',
      color: pos?.color,
      visible: pos?.visible !== false,
      size: pos?.size ?? (def.isQR ? 90 : undefined),
      qrColor: pos?.color ?? '#000000',
    } as EditorElement
  })

  const libre: EditorElement[] = (t.texto_libre ?? []).map((b) => ({
    key: `libre_${b.id}` as ElementKey,
    label: `Texto: "${b.text.substring(0, 20)}${b.text.length > 20 ? '…' : ''}"`,
    previewText: b.text.replace(/\{\{.*?\}\}/g, '…').replace(/\*\*(.*?)\*\*/g, '$1').substring(0, 40),
    x: clampX(b.pos.x),
    y: clampY(b.pos.y),
    fontSize: b.pos.fontSize ?? 12,
    align: b.pos.align ?? 'left',
    color: b.pos.color,
    visible: b.pos.visible !== false,
    isLibre: true,
    libreText: b.text,
    lineHeight: b.pos.lineHeight,
  }))

  return [...fixed, ...libre]
}

// ─── Conversión elementos → payload para guardar ──────────────────────────────

function elementsToPayload(elements: EditorElement[]) {
  const posFields: any = {}

  for (const el of elements) {
    if (el.isLibre) continue
    const posKey = POS_KEY_MAP[el.key]
    if (!posKey) continue

    if (el.isQR) {
      posFields[posKey] = {
        x: Math.round(el.x), y: Math.round(el.y),
        size: el.size ?? 90,
        visible: el.visible,
        color: el.qrColor ?? '#000000',
      }
    } else {
      posFields[posKey] = {
        x: Math.round(el.x), y: Math.round(el.y),
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
        x: Math.round(el.x), y: Math.round(el.y),
        fontSize: el.fontSize ?? 12,
        align: el.align ?? 'left',
        ...(el.color ? { color: el.color } : {}),
        ...(el.lineHeight ? { lineHeight: el.lineHeight } : {}),
        visible: el.visible,
      },
    }))

  return { ...posFields, texto_libre }
}

const DEFAULT_H: Partial<CertificateTemplate> = {
  orientacion: 'horizontal',
  pos_titulo_cert:   { x: 421, y: 420, fontSize: 14, align: 'center' },
  pos_nombre_alumno: { x: 421, y: 340, fontSize: 28, align: 'center', maxWidth: 600 },
  pos_rut_alumno:    { x: 421, y: 300, fontSize: 14, align: 'center' },
  pos_titulo_curso:  { x: 421, y: 250, fontSize: 20, align: 'center', maxWidth: 500 },
  pos_horas:         { x: 421, y: 210, fontSize: 12, align: 'center' },
  pos_fecha_emision: { x: 421, y: 180, fontSize: 11, align: 'center' },
  pos_fecha_vigencia:{ x: 421, y: 155, fontSize: 10, align: 'center' },
  pos_qr_code:       { x: 500, y: 60,  size: 90 },
  pos_cert_id:       { x: 200, y: 40,  fontSize: 8,  align: 'center' },
  texto_libre: [],
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function TemplateEditor({ template, cursos, existingTemplates, onBack, onSaved }: Props) {
  const [state, setState] = useState<EditorState>({
    nombre:                  template?.nombre ?? '',
    titulo_texto:            template?.titulo_texto ?? 'CERTIFICADO DE PARTICIPACIÓN',
    curso_id:                template?.curso_id ?? null,
    orientacion:             template?.orientacion ?? 'horizontal',
    color_primary:           template?.color_primary ?? '#1a1a2e',
    color_accent:            template?.color_accent ?? '#28B4AD',
    background_storage_path: template?.background_storage_path ?? null,
    activo:                  template?.activo ?? true,
  })

  const [elements, setElements] = useState<EditorElement[]>(() =>
    template
      ? templateToElements(template)
      : templateToElements({ ...DEFAULT_H } as CertificateTemplate)
  )

  const [selected, setSelected] = useState<ElementKey | null>(null)
  const [bgUrl, setBgUrl] = useState<string | null>(null)
  const [showGrid, setShowGrid] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [previewing, setPreviewing] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const canvasRef = useRef<HTMLDivElement>(null)
  const draggingRef = useRef<{
    key: ElementKey; startMX: number; startMY: number; startX: number; startY: number
  } | null>(null)

  const pdfDims = PDF_DIMS[state.orientacion]
  const scale   = CANVAS_W / pdfDims.w
  const canvasH = Math.round(pdfDims.h * scale)

  const toCanvas = useCallback((px: number, py: number) => ({
    x: px * scale,
    y: (pdfDims.h - py) * scale,
  }), [scale, pdfDims.h])

  // URL firmada del fondo
  useEffect(() => {
    setBgUrl(null)
    if (!state.background_storage_path) return
    getBackgroundPreviewUrl(state.background_storage_path).then((res) => {
      if ('url' in res) setBgUrl(res.url)
    })
  }, [state.background_storage_path])

  // Al cambiar orientación, reclampear posiciones
  const handleOrientacionChange = (nueva: 'horizontal' | 'vertical') => {
    const dims = PDF_DIMS[nueva]
    setState((s) => ({ ...s, orientacion: nueva }))
    setElements((prev) => prev.map((el) => ({
      ...el,
      x: Math.max(5, Math.min(dims.w - 5, el.x)),
      y: Math.max(5, Math.min(dims.h - 5, el.y)),
    })))
  }

  // ── Drag ─────────────────────────────────────────────────────────────────

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
    const rawX = drag.startX + dx
    const rawY = drag.startY - dy
    const cx = pdfDims.w / 2
    const cy = pdfDims.h / 2
    const finalX = Math.max(0, Math.min(pdfDims.w, snapVal(rawX, cx, SNAP_DIST)))
    const finalY = Math.max(0, Math.min(pdfDims.h, snapVal(rawY, cy, SNAP_DIST)))
    setElements((prev) => prev.map((el) => el.key === drag.key ? { ...el, x: finalX, y: finalY } : el))
  }

  const onCanvasPointerUp = () => { draggingRef.current = null }

  // ── Propiedades ───────────────────────────────────────────────────────────

  const selectedEl = elements.find((el) => el.key === selected) ?? null

  const updateSelected = (patch: Partial<EditorElement>) => {
    setElements((prev) => prev.map((el) => el.key === selected ? { ...el, ...patch } : el))
  }

  // ── Texto libre ───────────────────────────────────────────────────────────

  const addTextoLibre = () => {
    const id = Date.now().toString()
    const newEl: EditorElement = {
      key: `libre_${id}`,
      label: 'Texto libre',
      previewText: 'Texto libre',
      x: pdfDims.w / 2,
      y: pdfDims.h / 2,
      fontSize: 12,
      align: 'left',
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

  // Insertar variable en el textarea del texto libre
  const insertVariable = (variable: string) => {
    const ta = textareaRef.current
    if (!ta || !selectedEl?.isLibre) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const current = selectedEl.libreText ?? ''
    const newText = current.slice(0, start) + variable + current.slice(end)
    const previewText = newText.replace(/\{\{.*?\}\}/g, '…').replace(/\*\*(.*?)\*\*/g, '$1').substring(0, 40)
    updateSelected({ libreText: newText, previewText })
    // Restaurar cursor
    setTimeout(() => {
      ta.selectionStart = ta.selectionEnd = start + variable.length
      ta.focus()
    }, 0)
  }

  // Wrap selección con **negrita**
  const toggleBold = () => {
    const ta = textareaRef.current
    if (!ta || !selectedEl?.isLibre) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const current = selectedEl.libreText ?? ''
    const selected_text = current.slice(start, end)
    let newText: string
    if (selected_text.startsWith('**') && selected_text.endsWith('**')) {
      newText = current.slice(0, start) + selected_text.slice(2, -2) + current.slice(end)
    } else {
      newText = current.slice(0, start) + `**${selected_text}**` + current.slice(end)
    }
    const previewText = newText.replace(/\{\{.*?\}\}/g, '…').replace(/\*\*(.*?)\*\*/g, '$1').substring(0, 40)
    updateSelected({ libreText: newText, previewText })
    setTimeout(() => ta.focus(), 0)
  }

  // ── Upload fondo ──────────────────────────────────────────────────────────

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

  // ── Guardar ───────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!state.nombre.trim()) { toast.error('El nombre es obligatorio'); return }
    setSaving(true)
    const { texto_libre, ...posFields } = elementsToPayload(elements)
    const result = await upsertTemplate({ id: template?.id, ...state, texto_libre, ...posFields })
    setSaving(false)
    if ('error' in result) {
      toast.error(result.error)
    } else {
      toast.success(template?.id ? 'Plantilla actualizada' : 'Plantilla creada')
      onSaved()
    }
  }

  // ── Preview ───────────────────────────────────────────────────────────────

  const handlePreview = async () => {
    setPreviewing(true)
    try {
      const { texto_libre, ...posFields } = elementsToPayload(elements)
      const res = await fetch('/api/admin/certificados/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...state, texto_libre, ...posFields, id: template?.id }),
      })
      if (!res.ok) throw new Error('Error generando preview')
      window.open(URL.createObjectURL(await res.blob()), '_blank')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setPreviewing(false)
    }
  }

  // ── Grilla ────────────────────────────────────────────────────────────────

  const gridPx   = GRID_SIZE * scale
  const centerX  = (pdfDims.w / 2) * scale
  const centerY  = (pdfDims.h / 2) * scale
  const snapOn   = selectedEl && (
    Math.abs(selectedEl.x - pdfDims.w / 2) < SNAP_DIST ||
    Math.abs(selectedEl.y - pdfDims.h / 2) < SNAP_DIST
  )

  return (
    <div className="flex flex-col h-full">

      {/* ── Toolbar ── */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-slate-200 bg-white shrink-0 flex-wrap">
        <button onClick={onBack} className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 transition-colors text-sm font-medium">
          <ArrowLeft size={16} /> Volver
        </button>
        <div className="h-5 w-px bg-slate-200" />

        <input
          type="text"
          value={state.nombre}
          onChange={(e) => setState((s) => ({ ...s, nombre: e.target.value }))}
          placeholder="Nombre de la plantilla"
          className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-[#28B4AD] w-52"
        />

        <select
          value={state.curso_id ?? ''}
          onChange={(e) => setState((s) => ({ ...s, curso_id: e.target.value || null }))}
          className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#28B4AD] bg-white"
        >
          <option value="">Global (todos los cursos)</option>
          {cursos.map((c) => <option key={c.id} value={c.id}>{c.titulo}</option>)}
        </select>

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

        <button
          onClick={() => setShowGrid((v) => !v)}
          title="Mostrar/ocultar grilla"
          className={`p-1.5 rounded-lg border transition-all ${showGrid ? 'bg-[#28B4AD]/10 border-[#28B4AD] text-[#28B4AD]' : 'border-slate-200 text-slate-400 hover:bg-slate-50'}`}
        >
          <Grid3x3 size={15} />
        </button>

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
        <div className="flex-1 overflow-auto bg-slate-200 flex items-start justify-center p-6">
          <div
            ref={canvasRef}
            style={{
              width: CANVAS_W, height: canvasH,
              position: 'relative',
              cursor: draggingRef.current ? 'grabbing' : 'default',
              backgroundImage: showGrid
                ? `linear-gradient(rgba(99,102,241,0.1) 1px, transparent 1px),
                   linear-gradient(90deg, rgba(99,102,241,0.1) 1px, transparent 1px)`
                : undefined,
              backgroundSize: showGrid ? `${gridPx}px ${gridPx}px` : undefined,
            }}
            className="shadow-2xl rounded overflow-hidden select-none"
            onPointerMove={onCanvasPointerMove}
            onPointerUp={onCanvasPointerUp}
          >
            {/* Fondo */}
            {bgUrl
              ? <img src={bgUrl} alt="fondo" className="absolute inset-0 w-full h-full object-cover pointer-events-none" draggable={false} />
              : <div className="absolute inset-0 bg-white" />
            }

            {/* Guías de centro */}
            {showGrid && <>
              <div style={{ position: 'absolute', left: centerX, top: 0, width: 1, height: '100%', background: snapOn ? 'rgba(40,180,173,0.9)' : 'rgba(99,102,241,0.3)', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', top: centerY, left: 0, height: 1, width: '100%', background: snapOn ? 'rgba(40,180,173,0.9)' : 'rgba(99,102,241,0.3)', pointerEvents: 'none' }} />
            </>}

            {/* Chips */}
            {elements.map((el) => {
              const pos = toCanvas(el.x, el.y)
              const isSel = el.key === selected
              return (
                <div
                  key={el.key}
                  onPointerDown={(e) => onChipPointerDown(e, el.key)}
                  style={{
                    position: 'absolute',
                    left: pos.x, top: pos.y,
                    transform: 'translate(-50%, -50%)',
                    cursor: 'grab', zIndex: isSel ? 20 : 10,
                    opacity: el.visible ? 1 : 0.3,
                    touchAction: 'none',
                  }}
                  title={el.label}
                >
                  {el.isQR ? (
                    <div style={{
                      width: (el.size ?? 90) * scale, height: (el.size ?? 90) * scale,
                      border: isSel ? '2px solid #28B4AD' : '2px solid rgba(99,102,241,0.8)',
                      borderRadius: 6,
                      background: isSel ? 'rgba(40,180,173,0.15)' : 'rgba(235,235,255,0.9)',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
                      boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
                    }}>
                      <QrCode size={Math.max(14, (el.size ?? 90) * scale * 0.45)} color={isSel ? '#28B4AD' : '#6366f1'} />
                      <span style={{ fontSize: 8, fontWeight: 700, color: isSel ? '#28B4AD' : '#6366f1' }}>QR</span>
                    </div>
                  ) : (
                    <div style={{
                      padding: '2px 7px', borderRadius: 4,
                      border: isSel ? '2px solid #28B4AD' : '1.5px solid rgba(99,102,241,0.6)',
                      background: isSel ? 'rgba(40,180,173,0.12)' : el.isLibre ? 'rgba(254,240,138,0.85)' : 'rgba(238,238,255,0.85)',
                      fontSize: Math.max(7, Math.min(13, (el.fontSize ?? 12) * scale)),
                      color: isSel ? '#0f766e' : '#3730a3',
                      fontWeight: el.key === 'nombre_alumno' ? 700 : 500,
                      whiteSpace: 'nowrap', maxWidth: 260,
                      overflow: 'hidden', textOverflow: 'ellipsis',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.18)',
                    }}>
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

          {/* Propiedades del elemento */}
          <div className="p-4 border-b border-slate-100">
            <p className="text-xs font-black uppercase text-slate-400 mb-3">
              {selectedEl ? selectedEl.label : 'Selecciona un elemento'}
            </p>

            {selectedEl && (
              <div className="space-y-3">

                {/* ── Texto libre: editor enriquecido ── */}
                {selectedEl.isLibre && (
                  <div>
                    {/* Toolbar de formato */}
                    <div className="flex items-center gap-1 mb-1.5 flex-wrap">
                      <button
                        onClick={toggleBold}
                        className="flex items-center gap-1 px-2 py-1 text-xs font-bold bg-slate-100 hover:bg-slate-200 rounded transition-colors"
                        title="Negrita (selecciona texto primero)"
                      >
                        <Bold size={11} /> B
                      </button>
                      <div className="h-4 w-px bg-slate-200 mx-0.5" />
                      {VARIABLES.map((v) => (
                        <button
                          key={v.value}
                          onClick={() => insertVariable(v.value)}
                          className="px-1.5 py-0.5 text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium rounded transition-colors border border-indigo-200"
                          title={`Insertar variable: ${v.value}`}
                        >
                          {v.label}
                        </button>
                      ))}
                    </div>

                    <textarea
                      ref={textareaRef}
                      value={selectedEl.libreText ?? ''}
                      onChange={(e) => {
                        const newText = e.target.value
                        const previewText = newText.replace(/\{\{.*?\}\}/g, '…').replace(/\*\*(.*?)\*\*/g, '$1').substring(0, 40)
                        updateSelected({ libreText: newText, previewText, label: `Texto: "${newText.substring(0, 20)}"` })
                      }}
                      rows={5}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#28B4AD] resize-none font-mono"
                      placeholder="Texto libre. Usa **negrita** y {{variables}}"
                    />
                    <p className="text-xs text-slate-400 mt-1">
                      <span className="font-mono">**texto**</span> = negrita · <span className="font-mono">{'{{variable}}'}</span> = dato dinámico
                    </p>
                  </div>
                )}

                {/* Posición */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">X</label>
                    <input type="number" value={Math.round(selectedEl.x)}
                      onChange={(e) => updateSelected({ x: Number(e.target.value) })}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#28B4AD]" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Y</label>
                    <input type="number" value={Math.round(selectedEl.y)}
                      onChange={(e) => updateSelected({ y: Number(e.target.value) })}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#28B4AD]" />
                  </div>
                </div>

                {/* QR: tamaño + color */}
                {selectedEl.isQR && (
                  <>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Tamaño QR (pts)</label>
                      <input type="number" value={selectedEl.size ?? 90}
                        onChange={(e) => updateSelected({ size: Number(e.target.value) })}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#28B4AD]" />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Color del QR</label>
                      <div className="flex items-center gap-2">
                        <input type="color" value={selectedEl.qrColor ?? '#000000'}
                          onChange={(e) => updateSelected({ qrColor: e.target.value })}
                          className="w-8 h-8 rounded border border-slate-200 cursor-pointer p-0.5" />
                        <input type="text" value={selectedEl.qrColor ?? '#000000'}
                          onChange={(e) => updateSelected({ qrColor: e.target.value })}
                          className="flex-1 px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 outline-none focus:ring-2 focus:ring-[#28B4AD]" />
                      </div>
                      <div className="flex gap-2 mt-1.5">
                        {['#000000', '#1a1a2e', '#28B4AD'].map((c) => (
                          <button key={c} onClick={() => updateSelected({ qrColor: c })}
                            className="w-6 h-6 rounded border-2 border-white shadow"
                            style={{ background: c }}
                            title={c}
                          />
                        ))}
                        <button onClick={() => updateSelected({ qrColor: state.color_primary })}
                          className="px-2 py-0.5 text-xs bg-slate-100 hover:bg-slate-200 rounded transition-colors text-slate-600">
                          Primario
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {/* Texto: fontSize, align, color, lineHeight */}
                {!selectedEl.isQR && (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">Fuente (pts)</label>
                        <input type="number" value={selectedEl.fontSize ?? 12}
                          onChange={(e) => updateSelected({ fontSize: Number(e.target.value) })}
                          className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#28B4AD]" />
                      </div>
                      {selectedEl.isLibre && (
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">Interlineado</label>
                          <input type="number" step="0.1" value={selectedEl.lineHeight ?? 1.4}
                            onChange={(e) => updateSelected({ lineHeight: Number(e.target.value) })}
                            className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#28B4AD]" />
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs text-slate-500 mb-1.5">Alineación</label>
                      <div className="flex gap-1">
                        {(['left', 'center', 'right', ...(selectedEl.isLibre ? ['justify'] : [])] as const).map((a) => (
                          <button key={a} onClick={() => updateSelected({ align: a as any })}
                            className={`flex-1 flex items-center justify-center py-1.5 rounded-lg border transition-all ${selectedEl.align === a ? 'bg-[#28B4AD] border-[#28B4AD] text-white' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                            {a === 'left'    && <AlignLeft    size={13} />}
                            {a === 'center'  && <AlignCenter  size={13} />}
                            {a === 'right'   && <AlignRight   size={13} />}
                            {a === 'justify' && <AlignJustify size={13} />}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Color del texto</label>
                      <div className="flex items-center gap-2">
                        <input type="color" value={selectedEl.color ?? '#1a1a2e'}
                          onChange={(e) => updateSelected({ color: e.target.value })}
                          className="w-8 h-8 rounded border border-slate-200 cursor-pointer p-0.5" />
                        <input type="text" value={selectedEl.color ?? ''}
                          onChange={(e) => updateSelected({ color: e.target.value })}
                          placeholder="Color global"
                          className="flex-1 px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 outline-none focus:ring-2 focus:ring-[#28B4AD]" />
                      </div>
                    </div>
                  </>
                )}

                {/* Visible */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-slate-600 font-medium">Visible en PDF</span>
                  <div onClick={() => updateSelected({ visible: !selectedEl.visible })}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full cursor-pointer transition-colors ${selectedEl.visible ? 'bg-[#28B4AD]' : 'bg-slate-300'}`}>
                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${selectedEl.visible ? 'translate-x-[18px]' : 'translate-x-[2px]'}`} />
                  </div>
                </div>

                {selectedEl.isLibre && (
                  <button onClick={removeSelectedLibre}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg border border-red-200 transition-colors">
                    <Trash2 size={12} /> Eliminar bloque
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Configuración general */}
          <div className="p-4 border-b border-slate-100 space-y-3">
            <p className="text-xs font-black uppercase text-slate-400">Diseño</p>

            <div>
              <label className="block text-xs text-slate-500 mb-1">Título del certificado</label>
              <input type="text" value={state.titulo_texto}
                onChange={(e) => setState((s) => ({ ...s, titulo_texto: e.target.value }))}
                className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#28B4AD]" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              {([['color_primary', 'Color primario'], ['color_accent', 'Color acento']] as const).map(([field, label]) => (
                <div key={field}>
                  <label className="block text-xs text-slate-500 mb-1">{label}</label>
                  <div className="flex items-center gap-1.5">
                    <input type="color" value={state[field]} onChange={(e) => setState((s) => ({ ...s, [field]: e.target.value }))}
                      className="w-7 h-7 rounded border border-slate-200 cursor-pointer p-0.5" />
                    <input type="text" value={state[field]} onChange={(e) => setState((s) => ({ ...s, [field]: e.target.value }))}
                      className="flex-1 px-1.5 py-1 border border-slate-200 rounded text-xs font-mono text-slate-800 outline-none focus:ring-2 focus:ring-[#28B4AD]" />
                  </div>
                </div>
              ))}
            </div>

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

            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-600 font-medium">Plantilla activa</span>
              <div onClick={() => setState((s) => ({ ...s, activo: !s.activo }))}
                className={`relative inline-flex h-5 w-9 items-center rounded-full cursor-pointer transition-colors ${state.activo ? 'bg-[#28B4AD]' : 'bg-slate-300'}`}>
                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${state.activo ? 'translate-x-[18px]' : 'translate-x-[2px]'}`} />
              </div>
            </div>
          </div>

          {/* Lista de elementos */}
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-black uppercase text-slate-400">Elementos</p>
              <button onClick={addTextoLibre}
                className="flex items-center gap-1 text-xs font-semibold text-[#28B4AD] hover:text-[#1f9593] transition-colors">
                <Plus size={12} /> Texto libre
              </button>
            </div>
            <div className="space-y-0.5">
              {elements.map((el) => (
                <button key={el.key} onClick={() => setSelected(el.key)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left text-xs transition-all ${el.key === selected ? 'bg-[#28B4AD]/10 text-[#28B4AD] font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}>
                  {el.isQR ? <QrCode size={11} className="shrink-0 opacity-60" />
                    : el.isLibre ? <Type size={11} className="shrink-0 opacity-60" />
                    : <Move size={11} className="shrink-0 opacity-60" />}
                  <span className="truncate flex-1">{el.label}</span>
                  {!el.visible && <span className="text-slate-300 text-xs">oculto</span>}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-3 leading-relaxed">
              Arrastra los elementos sobre el canvas. Las guías de centro se iluminan al hacer snap.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
