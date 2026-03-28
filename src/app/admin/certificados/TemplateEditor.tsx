'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  ArrowLeft, Upload, Loader2, Eye, Save, Plus, Trash2,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Move, Type, Grid3x3, QrCode, Bold, EyeOff, RotateCcw,
} from 'lucide-react'
import { toast } from 'sonner'
import { upsertTemplate, getBackgroundPreviewUrl } from '@/actions/certificados-templates'
import type { CertificateTemplate, TextoLibre } from '@/lib/certificados/types'
import { createClient } from '@/lib/supabase-client'

// ─── Constantes ───────────────────────────────────────────────────────────────

const CANVAS_W  = 660
const GRID_SIZE = 50
const SNAP_DIST = 12

const PDF_DIMS = {
  horizontal: { w: 842, h: 595 },
  vertical:   { w: 595, h: 842 },
}

const VARIABLES = [
  { label: 'Nombre alumno', value: '{{nombre_alumno}}' },
  { label: 'RUT',           value: '{{rut_alumno}}' },
  { label: 'Curso',         value: '{{nombre_curso}}' },
  { label: 'Horas',         value: '{{horas}}' },
  { label: 'Fecha emisión', value: '{{fecha_emision}}' },
  { label: 'Vigencia',      value: '{{fecha_vigencia}}' },
]

// ─── Tipos ────────────────────────────────────────────────────────────────────

type ElementKey =
  | 'titulo_cert' | 'nombre_alumno' | 'rut_alumno' | 'titulo_curso'
  | 'horas' | 'fecha_emision' | 'fecha_vigencia' | 'cert_id' | 'qr_code'
  | `libre_${string}`

interface EditorElement {
  key: ElementKey
  label: string
  previewText: string
  x: number; y: number
  fontSize?: number
  align?: 'left' | 'center' | 'right' | 'justify'
  color?: string
  visible: boolean
  isQR?: boolean
  qrColor?: string
  size?: number          // QR size / texto libre width in PDF pts
  height?: number        // texto libre height in PDF pts
  isLibre?: boolean
  libreText?: string
  lineHeight?: number
}

interface EditorState {
  nombre: string; titulo_texto: string; curso_id: string | null
  orientacion: 'horizontal' | 'vertical'
  color_primary: string; color_accent: string
  background_storage_path: string | null
  activo: boolean
}

interface Props {
  template: CertificateTemplate | null
  cursos: { id: string; titulo: string }[]
  existingTemplates: (CertificateTemplate & { curso_titulo?: string | null })[]
  onBack: () => void; onSaved: () => void
}

// ─── Elementos fijos ──────────────────────────────────────────────────────────

const FIXED_DEFS: Omit<EditorElement, 'x' | 'y' | 'visible'>[] = [
  { key: 'titulo_cert',    label: 'Título del certificado', previewText: 'CERTIFICADO DE PARTICIPACIÓN',   fontSize: 14, align: 'center' },
  { key: 'nombre_alumno', label: 'Nombre del alumno',      previewText: 'NOMBRE APELLIDO ALUMNO',         fontSize: 28, align: 'center' },
  { key: 'rut_alumno',    label: 'RUT',                    previewText: 'RUT: 12.345.678-9',              fontSize: 14, align: 'center' },
  { key: 'titulo_curso',  label: 'Nombre del curso',       previewText: 'NOMBRE DEL CURSO',               fontSize: 20, align: 'center' },
  { key: 'horas',         label: 'Horas',                  previewText: 'Duración: 24 horas',             fontSize: 12, align: 'center' },
  { key: 'fecha_emision', label: 'Fecha de emisión',       previewText: 'Fecha de emisión: 28 mar 2026',  fontSize: 11, align: 'center' },
  { key: 'fecha_vigencia',label: 'Fecha de vigencia',      previewText: 'Válido hasta: 28 mar 2027',      fontSize: 10, align: 'center' },
  { key: 'cert_id',       label: 'ID del certificado',     previewText: 'ID: a1b2c3d4e5f6...',            fontSize: 8,  align: 'center' },
  { key: 'qr_code',       label: 'Código QR',              previewText: 'QR', isQR: true },
]

const POS_MAP: Record<string, keyof CertificateTemplate> = {
  titulo_cert: 'pos_titulo_cert', nombre_alumno: 'pos_nombre_alumno',
  rut_alumno: 'pos_rut_alumno',   titulo_curso: 'pos_titulo_curso',
  horas: 'pos_horas',             fecha_emision: 'pos_fecha_emision',
  fecha_vigencia: 'pos_fecha_vigencia', cert_id: 'pos_cert_id', qr_code: 'pos_qr_code',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function snapVal(v: number, center: number): number {
  if (Math.abs(v - center) < SNAP_DIST) return center
  const n = Math.round(v / GRID_SIZE) * GRID_SIZE
  return Math.abs(v - n) < SNAP_DIST ? n : v
}

function templateToElements(t: CertificateTemplate): EditorElement[] {
  const dims = PDF_DIMS[t.orientacion ?? 'horizontal']
  const cx = (v: number) => Math.max(5, Math.min(dims.w - 5, v))
  const cy = (v: number) => Math.max(5, Math.min(dims.h - 5, v))

  const fixed = FIXED_DEFS.map((def) => {
    const pos = t[POS_MAP[def.key] as keyof CertificateTemplate] as any
    return {
      ...def,
      x: cx(pos?.x ?? dims.w / 2),
      y: cy(pos?.y ?? dims.h / 2),
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
    label: `Texto: "${b.text.substring(0, 18)}${b.text.length > 18 ? '…' : ''}"`,
    previewText: b.text,
    x: cx(b.pos.x), y: cy(b.pos.y),
    fontSize: b.pos.fontSize ?? 12,
    align: b.pos.align ?? 'left',
    color: b.pos.color,
    visible: b.pos.visible !== false,
    isLibre: true, libreText: b.text,
    lineHeight: b.pos.lineHeight,
    size: (b.pos as any).maxWidth ?? 300,
    height: (b.pos as any).maxHeight ?? 120,
  }))

  return [...fixed, ...libre]
}

function elementsToPayload(elements: EditorElement[], allKeys: ElementKey[]) {
  const posFields: any = {}
  // Asegurar que todas las claves fijas estén en el payload (con visible:false si fueron eliminadas)
  for (const key of allKeys) {
    const el = elements.find((e) => e.key === key)
    const posKey = POS_MAP[key]
    if (!posKey) continue
    if (!el) {
      posFields[posKey] = { x: 0, y: 0, visible: false }
      continue
    }
    if (el.isQR) {
      posFields[posKey] = { x: Math.round(el.x), y: Math.round(el.y), size: el.size ?? 90, visible: el.visible, color: el.qrColor ?? '#000000' }
    } else {
      posFields[posKey] = {
        x: Math.round(el.x), y: Math.round(el.y),
        fontSize: el.fontSize, align: el.align,
        ...(el.color ? { color: el.color } : {}),
        visible: el.visible,
      }
    }
  }

  const texto_libre: TextoLibre[] = elements.filter((el) => el.isLibre).map((el) => ({
    id: el.key.replace('libre_', ''),
    text: el.libreText ?? '',
    pos: {
      x: Math.round(el.x), y: Math.round(el.y),
      fontSize: el.fontSize ?? 12,
      align: el.align ?? 'left',
      maxWidth: el.size ?? 300,
      ...(el.height ? { maxHeight: el.height } : {}),
      ...(el.lineHeight ? { lineHeight: el.lineHeight } : {}),
      ...(el.color ? { color: el.color } : {}),
      visible: el.visible,
    } as any,
  }))

  return { ...posFields, texto_libre }
}

const DEFAULT_H: Partial<CertificateTemplate> = {
  orientacion: 'horizontal',
  pos_titulo_cert:   { x: 421, y: 430, fontSize: 14, align: 'center' },
  pos_nombre_alumno: { x: 421, y: 350, fontSize: 28, align: 'center', maxWidth: 600 },
  pos_rut_alumno:    { x: 421, y: 310, fontSize: 14, align: 'center' },
  pos_titulo_curso:  { x: 421, y: 255, fontSize: 20, align: 'center', maxWidth: 500 },
  pos_horas:         { x: 421, y: 215, fontSize: 12, align: 'center' },
  pos_fecha_emision: { x: 421, y: 185, fontSize: 11, align: 'center' },
  pos_fecha_vigencia:{ x: 421, y: 160, fontSize: 10, align: 'center' },
  pos_qr_code:       { x: 500, y: 60,  size: 90 },
  pos_cert_id:       { x: 200, y: 40,  fontSize: 8,  align: 'center' },
  texto_libre: [],
}

// ─── Render de texto con negrita inline ──────────────────────────────────────

function RichChipText({ text, fontSize }: { text: string; fontSize: number }) {
  const parts = text.replace(/\{\{.*?\}\}/g, '·').split(/(\*\*.*?\*\*)/)
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} style={{ fontWeight: 800 }}>{part.slice(2, -2)}</strong>
        }
        return <span key={i}>{part}</span>
      })}
    </>
  )
}

// ─── Componente ───────────────────────────────────────────────────────────────

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
    template ? templateToElements(template) : templateToElements({ ...DEFAULT_H } as CertificateTemplate)
  )

  const fixedKeys = FIXED_DEFS.map((d) => d.key as ElementKey)
  const [selected, setSelected] = useState<ElementKey | null>(null)
  const [bgUrl, setBgUrl]       = useState<string | null>(null)
  const [showGrid, setShowGrid] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving]     = useState(false)
  const [previewing, setPreviewing] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const canvasRef   = useRef<HTMLDivElement>(null)
  type DragState  = { key: ElementKey; startMX: number; startMY: number; startX: number; startY: number }
  type ResizeState = { key: ElementKey; startMX: number; startMY: number; startSize: number; axis: 'size' | 'height' }
  const draggingRef = useRef<DragState | null>(null)
  const resizingRef = useRef<ResizeState | null>(null)

  const pdfDims = PDF_DIMS[state.orientacion]
  const scale   = CANVAS_W / pdfDims.w
  const canvasH = Math.round(pdfDims.h * scale)

  const toCanvas = useCallback((px: number, py: number) => ({
    x: px * scale,
    y: (pdfDims.h - py) * scale,
  }), [scale, pdfDims.h])

  useEffect(() => {
    setBgUrl(null)
    if (!state.background_storage_path) return
    getBackgroundPreviewUrl(state.background_storage_path).then((r) => { if ('url' in r) setBgUrl(r.url) })
  }, [state.background_storage_path])

  const handleOrientacionChange = (o: 'horizontal' | 'vertical') => {
    const dims = PDF_DIMS[o]
    setState((s) => ({ ...s, orientacion: o }))
    setElements((prev) => prev.map((el) => ({
      ...el,
      x: Math.max(5, Math.min(dims.w - 5, el.x)),
      y: Math.max(5, Math.min(dims.h - 5, el.y)),
    })))
  }

  // ── Drag ─────────────────────────────────────────────────────────────────

  const onChipPointerDown = (e: React.PointerEvent, key: ElementKey) => {
    e.preventDefault(); e.stopPropagation()
    const el = elements.find((x) => x.key === key)
    if (!el) return
    draggingRef.current = { key, startMX: e.clientX, startMY: e.clientY, startX: el.x, startY: el.y }
    setSelected(key)
    canvasRef.current?.setPointerCapture(e.pointerId)
  }

  const onResizePointerDown = (e: React.PointerEvent, key: ElementKey, axis: 'size' | 'height') => {
    e.preventDefault(); e.stopPropagation()
    const el = elements.find((x) => x.key === key)
    if (!el) return
    const startSize = axis === 'height' ? (el.height ?? 120) : (el.size ?? 90)
    resizingRef.current = { key, startMX: e.clientX, startMY: e.clientY, startSize, axis }
    canvasRef.current?.setPointerCapture(e.pointerId)
  }

  const onCanvasPointerMove = (e: React.PointerEvent) => {
    const drag = draggingRef.current
    if (drag) {
      const dx = (e.clientX - drag.startMX) / scale
      const dy = (e.clientY - drag.startMY) / scale
      const cx = pdfDims.w / 2; const cy = pdfDims.h / 2
      const fx = Math.max(0, Math.min(pdfDims.w, snapVal(drag.startX + dx, cx)))
      const fy = Math.max(0, Math.min(pdfDims.h, snapVal(drag.startY - dy, cy)))
      setElements((prev) => prev.map((el) => el.key === drag.key ? { ...el, x: fx, y: fy } : el))
      return
    }
    const res = resizingRef.current
    if (res) {
      const delta = (res.axis === 'height')
        ? -(e.clientY - res.startMY) / scale   // drag up = taller
        : (e.clientX - res.startMX) / scale
      const newVal = Math.max(30, res.startSize + delta)
      setElements((prev) => prev.map((el) => el.key === res.key
        ? res.axis === 'height' ? { ...el, height: newVal } : { ...el, size: newVal }
        : el))
    }
  }

  const onCanvasPointerUp = () => { draggingRef.current = null; resizingRef.current = null }

  // ── Elemento seleccionado ─────────────────────────────────────────────────

  const selectedEl = elements.find((el) => el.key === selected) ?? null
  const updateSelected = (patch: Partial<EditorElement>) =>
    setElements((prev) => prev.map((el) => el.key === selected ? { ...el, ...patch } : el))

  // ── Texto libre ───────────────────────────────────────────────────────────

  const addTextoLibre = () => {
    const id = Date.now().toString()
    const el: EditorElement = {
      key: `libre_${id}`, label: 'Texto libre', previewText: 'Texto libre',
      x: pdfDims.w / 2, y: pdfDims.h / 2,
      fontSize: 12, align: 'left', visible: true,
      isLibre: true, libreText: 'Texto libre',
      size: 300, height: 120, lineHeight: 1.4,
    }
    setElements((prev) => [...prev, el])
    setSelected(el.key)
  }

  const deleteElement = (key: ElementKey) => {
    const isFixed = fixedKeys.includes(key)
    if (isFixed) {
      // Fixed elements: just hide (set visible: false)
      setElements((prev) => prev.map((el) => el.key === key ? { ...el, visible: false } : el))
    } else {
      setElements((prev) => prev.filter((el) => el.key !== key))
    }
    if (selected === key) setSelected(null)
  }

  const restoreElement = (key: ElementKey) =>
    setElements((prev) => prev.map((el) => el.key === key ? { ...el, visible: true } : el))

  // Insertar variable en textarea
  const insertVariable = (v: string) => {
    const ta = textareaRef.current
    if (!ta || !selectedEl?.isLibre) return
    const s = ta.selectionStart; const e = ta.selectionEnd
    const cur = selectedEl.libreText ?? ''
    const next = cur.slice(0, s) + v + cur.slice(e)
    updateSelected({ libreText: next, previewText: next })
    setTimeout(() => { ta.selectionStart = ta.selectionEnd = s + v.length; ta.focus() }, 0)
  }

  const toggleBold = () => {
    const ta = textareaRef.current
    if (!ta || !selectedEl?.isLibre) return
    const s = ta.selectionStart; const e = ta.selectionEnd
    const cur = selectedEl.libreText ?? ''
    const sel = cur.slice(s, e)

    let next: string
    let newSelStart: number
    let newSelEnd: number

    if (!sel) {
      // Sin selección: insertar **texto** y seleccionar "texto"
      const placeholder = 'texto'
      next = cur.slice(0, s) + `**${placeholder}**` + cur.slice(s)
      newSelStart = s + 2
      newSelEnd = s + 2 + placeholder.length
    } else if (sel.startsWith('**') && sel.endsWith('**') && sel.length > 4) {
      // Toggle off: quitar marcadores
      const inner = sel.slice(2, -2)
      next = cur.slice(0, s) + inner + cur.slice(e)
      newSelStart = s
      newSelEnd = s + inner.length
    } else {
      // Toggle on: envolver selección
      next = cur.slice(0, s) + `**${sel}**` + cur.slice(e)
      newSelStart = s
      newSelEnd = s + sel.length + 4
    }

    updateSelected({ libreText: next, previewText: next })
    setTimeout(() => {
      ta.focus()
      ta.setSelectionRange(newSelStart, newSelEnd)
    }, 0)
  }

  // ── Upload ────────────────────────────────────────────────────────────────

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    setUploading(true)
    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop()
      const sp = `templates/bg-${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('certificados').upload(sp, file, { upsert: true })
      if (error) throw new Error(error.message)
      setState((s) => ({ ...s, background_storage_path: sp }))
      toast.success('Imagen subida correctamente')
    } catch (err: any) { toast.error(err.message) }
    finally { setUploading(false) }
  }

  // ── Guardar ───────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!state.nombre.trim()) { toast.error('El nombre es obligatorio'); return }
    setSaving(true)
    const { texto_libre, ...posFields } = elementsToPayload(elements, fixedKeys)
    const result = await upsertTemplate({ id: template?.id, ...state, texto_libre, ...posFields })
    setSaving(false)
    if ('error' in result) { toast.error(result.error) }
    else { toast.success(template?.id ? 'Actualizada' : 'Creada'); onSaved() }
  }

  const handlePreview = async () => {
    setPreviewing(true)
    try {
      const { texto_libre, ...posFields } = elementsToPayload(elements, fixedKeys)
      const res = await fetch('/api/admin/certificados/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...state, texto_libre, ...posFields, id: template?.id }),
      })
      if (!res.ok) throw new Error('Error generando preview')
      window.open(URL.createObjectURL(await res.blob()), '_blank')
    } catch (err: any) { toast.error(err.message) }
    finally { setPreviewing(false) }
  }

  // ── Canvas helpers ────────────────────────────────────────────────────────

  const gridPx  = GRID_SIZE * scale
  const centerX = (pdfDims.w / 2) * scale
  const centerY = (pdfDims.h / 2) * scale
  const snapOn  = selectedEl && (Math.abs(selectedEl.x - pdfDims.w / 2) < SNAP_DIST || Math.abs(selectedEl.y - pdfDims.h / 2) < SNAP_DIST)

  const visibleElements = elements.filter((el) => el.visible)
  const hiddenFixed = elements.filter((el) => !el.visible && fixedKeys.includes(el.key))

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-slate-50">

      {/* ── Toolbar ── */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-200 bg-white shrink-0 flex-wrap">
        <button onClick={onBack} className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 text-sm font-medium transition-colors">
          <ArrowLeft size={15} /> Volver
        </button>
        <div className="h-4 w-px bg-slate-200" />
        <input
          type="text" value={state.nombre}
          onChange={(e) => setState((s) => ({ ...s, nombre: e.target.value }))}
          placeholder="Nombre de la plantilla"
          className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-[#28B4AD] w-48"
        />
        <select
          value={state.curso_id ?? ''}
          onChange={(e) => setState((s) => ({ ...s, curso_id: e.target.value || null }))}
          className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#28B4AD] bg-white"
        >
          <option value="">Global (todos los cursos)</option>
          {cursos.map((c) => <option key={c.id} value={c.id}>{c.titulo}</option>)}
        </select>
        <div className="flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-lg">
          {(['horizontal', 'vertical'] as const).map((o) => (
            <button key={o} onClick={() => handleOrientacionChange(o)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all capitalize ${state.orientacion === o ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
              {o}
            </button>
          ))}
        </div>
        <button onClick={() => setShowGrid((v) => !v)} title="Grilla"
          className={`p-1.5 rounded-lg border transition-all ${showGrid ? 'bg-[#28B4AD]/10 border-[#28B4AD] text-[#28B4AD]' : 'border-slate-200 text-slate-400 hover:bg-slate-50'}`}>
          <Grid3x3 size={15} />
        </button>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={handlePreview} disabled={previewing}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors">
            {previewing ? <Loader2 size={13} className="animate-spin" /> : <Eye size={13} />} Preview
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-[#28B4AD] text-white text-sm font-bold rounded-lg hover:bg-[#1f9593] disabled:opacity-50 transition-colors">
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} Guardar
          </button>
        </div>
      </div>

      {/* ── Body: left | canvas | right ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── LEFT: lista de elementos ── */}
        <div className="w-52 bg-white border-r border-slate-200 flex flex-col overflow-y-auto shrink-0">
          <div className="p-3 border-b border-slate-100">
            <p className="text-xs font-black uppercase text-slate-400 mb-2">Elementos fijos</p>
            <div className="space-y-0.5">
              {elements.filter((el) => !el.isLibre).map((el) => (
                <button key={el.key} onClick={() => { if (el.visible) setSelected(el.key) }}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left text-xs transition-all ${el.key === selected ? 'bg-[#28B4AD]/10 text-[#28B4AD] font-semibold' : el.visible ? 'text-slate-600 hover:bg-slate-50' : 'text-slate-300 cursor-default'}`}>
                  {el.isQR ? <QrCode size={11} className="shrink-0" /> : <Move size={11} className="shrink-0" />}
                  <span className="truncate flex-1 text-xs">{el.label}</span>
                  {!el.visible
                    ? <button onClick={(e) => { e.stopPropagation(); restoreElement(el.key) }} title="Restaurar"
                        className="p-0.5 hover:text-green-500 transition-colors"><RotateCcw size={10} /></button>
                    : <button onClick={(e) => { e.stopPropagation(); deleteElement(el.key) }} title="Ocultar"
                        className="p-0.5 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"><EyeOff size={10} /></button>
                  }
                </button>
              ))}
            </div>
          </div>

          <div className="p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-black uppercase text-slate-400">Texto libre</p>
              <button onClick={addTextoLibre}
                className="flex items-center gap-0.5 text-xs font-semibold text-[#28B4AD] hover:text-[#1f9593] transition-colors">
                <Plus size={11} /> Agregar
              </button>
            </div>
            <div className="space-y-0.5">
              {elements.filter((el) => el.isLibre).map((el) => (
                <div key={el.key} className="flex items-center gap-1">
                  <button onClick={() => setSelected(el.key)}
                    className={`flex-1 flex items-center gap-2 px-2 py-1.5 rounded-lg text-left text-xs transition-all ${el.key === selected ? 'bg-[#28B4AD]/10 text-[#28B4AD] font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}>
                    <Type size={11} className="shrink-0" />
                    <span className="truncate">{el.label}</span>
                  </button>
                  <button onClick={() => deleteElement(el.key)} className="p-1 text-slate-300 hover:text-red-400 transition-colors">
                    <Trash2 size={11} />
                  </button>
                </div>
              ))}
              {elements.filter((el) => el.isLibre).length === 0 && (
                <p className="text-xs text-slate-300 py-2 text-center">Sin bloques de texto libre</p>
              )}
            </div>
          </div>

          {/* Diseño general */}
          <div className="p-3 border-t border-slate-100 mt-auto space-y-3">
            <p className="text-xs font-black uppercase text-slate-400">Diseño</p>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Título del cert.</label>
              <input type="text" value={state.titulo_texto}
                onChange={(e) => setState((s) => ({ ...s, titulo_texto: e.target.value }))}
                className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#28B4AD]" />
            </div>
            <div className="space-y-2">
              {([['color_primary', 'Primario'], ['color_accent', 'Acento']] as const).map(([f, l]) => (
                <div key={f} className="flex items-center gap-2">
                  <label className="text-xs text-slate-500 w-14">{l}</label>
                  <input type="color" value={state[f]} onChange={(e) => setState((s) => ({ ...s, [f]: e.target.value }))}
                    className="w-7 h-7 rounded border border-slate-200 cursor-pointer p-0.5" />
                  <input type="text" value={state[f]} onChange={(e) => setState((s) => ({ ...s, [f]: e.target.value }))}
                    className="flex-1 px-1.5 py-1 border border-slate-200 rounded text-xs font-mono text-slate-800 outline-none focus:ring-1 focus:ring-[#28B4AD]" />
                </div>
              ))}
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Fondo</label>
              <label className="flex items-center gap-2 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer">
                {uploading ? <Loader2 size={11} className="animate-spin" /> : <Upload size={11} />}
                {uploading ? 'Subiendo...' : state.background_storage_path ? 'Cambiar' : 'Subir imagen'}
                <input type="file" accept="image/jpeg,image/png" className="hidden" onChange={handleImageUpload} disabled={uploading} />
              </label>
              {state.background_storage_path && (
                <p className="text-xs text-slate-400 mt-1 truncate">{state.background_storage_path.split('/').pop()}</p>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-600">Activa</span>
              <div onClick={() => setState((s) => ({ ...s, activo: !s.activo }))}
                className={`relative inline-flex h-5 w-9 items-center rounded-full cursor-pointer transition-colors ${state.activo ? 'bg-[#28B4AD]' : 'bg-slate-300'}`}>
                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${state.activo ? 'translate-x-[18px]' : 'translate-x-[2px]'}`} />
              </div>
            </div>
          </div>
        </div>

        {/* ── CANVAS ── */}
        <div className="flex-1 overflow-auto bg-slate-300 flex items-start justify-center p-6">
          <div
            ref={canvasRef}
            style={{ width: CANVAS_W, height: canvasH, position: 'relative', cursor: draggingRef.current ? 'grabbing' : 'default' }}
            className="shadow-2xl rounded overflow-hidden select-none"
            onPointerMove={onCanvasPointerMove}
            onPointerUp={onCanvasPointerUp}
          >
            {/* 1. Fondo */}
            {bgUrl
              ? <img src={bgUrl} alt="" className="absolute inset-0 w-full h-full object-cover pointer-events-none" style={{ zIndex: 1 }} draggable={false} />
              : <div className="absolute inset-0 bg-white" style={{ zIndex: 1 }} />
            }

            {/* 2. Grilla (encima del fondo, debajo de chips) */}
            {showGrid && (
              <div style={{
                position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none',
                backgroundImage: `linear-gradient(rgba(99,102,241,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.18) 1px, transparent 1px)`,
                backgroundSize: `${gridPx}px ${gridPx}px`,
              }} />
            )}

            {/* 3. Guías de centro */}
            {showGrid && (
              <>
                <div style={{ position: 'absolute', left: centerX, top: 0, width: 1, height: '100%', zIndex: 3, pointerEvents: 'none', background: snapOn ? 'rgba(40,180,173,0.9)' : 'rgba(99,102,241,0.45)' }} />
                <div style={{ position: 'absolute', top: centerY, left: 0, height: 1, width: '100%', zIndex: 3, pointerEvents: 'none', background: snapOn ? 'rgba(40,180,173,0.9)' : 'rgba(99,102,241,0.45)' }} />
              </>
            )}

            {/* 4. Chips de elementos */}
            {visibleElements.map((el) => {
              const pos = toCanvas(el.x, el.y)
              const isSel = el.key === selected

              return (
                <div key={el.key}
                  onPointerDown={(e) => onChipPointerDown(e, el.key)}
                  style={{
                    position: 'absolute', left: pos.x, top: pos.y,
                    transform: 'translate(-50%, -50%)',
                    cursor: 'grab', zIndex: isSel ? 20 : 10,
                    touchAction: 'none',
                  }}
                >
                  {el.isQR ? (
                    // ── QR ──────────────────────────────────────────────────
                    <div style={{ position: 'relative', width: (el.size ?? 90) * scale, height: (el.size ?? 90) * scale }}>
                      <div style={{
                        width: '100%', height: '100%',
                        border: isSel ? '2px solid #28B4AD' : '2px solid rgba(99,102,241,0.75)',
                        borderRadius: 6,
                        background: isSel ? 'rgba(40,180,173,0.12)' : 'rgba(235,235,255,0.92)',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                      }}>
                        <QrCode size={Math.max(14, (el.size ?? 90) * scale * 0.5)} color={el.qrColor ?? '#000000'} />
                        <span style={{ fontSize: 8, fontWeight: 700, color: el.qrColor ?? '#000000', opacity: 0.7 }}>QR</span>
                      </div>
                      {/* Handle de resize (esquina inf-der) */}
                      {isSel && (
                        <div
                          onPointerDown={(e) => onResizePointerDown(e, el.key, 'size')}
                          style={{
                            position: 'absolute', right: -5, bottom: -5,
                            width: 10, height: 10, borderRadius: 2,
                            background: '#28B4AD', cursor: 'se-resize', zIndex: 25,
                            border: '1.5px solid white', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                          }}
                        />
                      )}
                    </div>
                  ) : el.isLibre ? (
                    // ── Texto libre (caja con dimensiones) ──────────────────
                    <div style={{ position: 'relative' }}>
                      <div style={{
                        width: (el.size ?? 300) * scale,
                        minHeight: (el.height ?? 120) * scale,
                        border: isSel ? '2px solid #28B4AD' : '1.5px dashed rgba(251,191,36,0.8)',
                        borderRadius: 4,
                        background: isSel ? 'rgba(40,180,173,0.08)' : 'rgba(254,249,195,0.75)',
                        padding: '3px 6px',
                        overflow: 'hidden',
                        boxShadow: isSel ? '0 0 0 1px rgba(40,180,173,0.3)' : '0 1px 3px rgba(0,0,0,0.12)',
                      }}>
                        <div style={{ fontSize: Math.max(7, Math.min(11, (el.fontSize ?? 12) * scale)), color: el.color ?? '#1a1a2e', lineHeight: 1.4, textAlign: (el.align ?? 'left') as any, width: '100%' }}>
                          <RichChipText text={el.previewText.substring(0, 120)} fontSize={el.fontSize ?? 12} />
                        </div>
                      </div>
                      {/* Handle ancho (esquina der) */}
                      {isSel && (
                        <div
                          onPointerDown={(e) => onResizePointerDown(e, el.key, 'size')}
                          style={{
                            position: 'absolute', right: -5, top: '50%', transform: 'translateY(-50%)',
                            width: 10, height: 20, borderRadius: 3,
                            background: '#28B4AD', cursor: 'e-resize', zIndex: 25,
                            border: '1.5px solid white', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                          }}
                        />
                      )}
                      {/* Handle alto (esquina inf) */}
                      {isSel && (
                        <div
                          onPointerDown={(e) => onResizePointerDown(e, el.key, 'height')}
                          style={{
                            position: 'absolute', bottom: -5, left: '50%', transform: 'translateX(-50%)',
                            width: 20, height: 10, borderRadius: 3,
                            background: '#6366f1', cursor: 's-resize', zIndex: 25,
                            border: '1.5px solid white', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                          }}
                        />
                      )}
                    </div>
                  ) : (
                    // ── Chip de texto fijo ────────────────────────────────
                    <div style={{
                      padding: '2px 7px', borderRadius: 4,
                      border: isSel ? '2px solid #28B4AD' : '1.5px solid rgba(99,102,241,0.55)',
                      background: isSel ? 'rgba(40,180,173,0.12)' : 'rgba(238,238,255,0.88)',
                      fontSize: Math.max(7, Math.min(13, (el.fontSize ?? 12) * scale)),
                      color: isSel ? '#0f766e' : '#3730a3',
                      fontWeight: el.key === 'nombre_alumno' ? 700 : 500,
                      whiteSpace: 'nowrap', maxWidth: 260,
                      overflow: 'hidden', textOverflow: 'ellipsis',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                    }}>
                      {el.previewText}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* ── RIGHT: propiedades ── */}
        <div className="w-68 bg-white border-l border-slate-200 flex flex-col overflow-y-auto shrink-0" style={{ width: 272 }}>
          <div className="p-4">
            {!selectedEl ? (
              <p className="text-xs text-slate-400 text-center py-8">Selecciona un elemento para editar sus propiedades</p>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-black uppercase text-slate-500">{selectedEl.label}</p>
                  <button onClick={() => deleteElement(selectedEl.key)}
                    className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600 transition-colors">
                    {selectedEl.isLibre ? <Trash2 size={12} /> : <EyeOff size={12} />}
                    {selectedEl.isLibre ? 'Eliminar' : 'Ocultar'}
                  </button>
                </div>

                {/* Texto libre: editor */}
                {selectedEl.isLibre && (
                  <div>
                    <div className="flex items-center gap-1 mb-1.5 flex-wrap">
                      <button onClick={toggleBold}
                        className="flex items-center justify-center w-8 h-7 font-black bg-slate-100 hover:bg-slate-200 rounded transition-colors border border-slate-200 text-slate-700"
                        title="Negrita: selecciona texto y pulsa B">
                        <Bold size={13} />
                      </button>
                      <div className="h-4 w-px bg-slate-200" />
                      {VARIABLES.map((v) => (
                        <button key={v.value} onClick={() => insertVariable(v.value)}
                          className="px-1.5 py-0.5 text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium rounded border border-indigo-200 transition-colors">
                          {v.label}
                        </button>
                      ))}
                    </div>
                    <textarea
                      ref={textareaRef}
                      value={selectedEl.libreText ?? ''}
                      onChange={(e) => {
                        const t = e.target.value
                        updateSelected({ libreText: t, previewText: t, label: `Texto: "${t.substring(0, 18)}"` })
                      }}
                      rows={5}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#28B4AD] resize-none font-mono"
                      placeholder={'Texto libre.\n**negrita**\n{{nombre_alumno}}'}
                    />
                    <p className="text-xs text-slate-400 mt-0.5"><span className="font-mono">**text**</span> = negrita · <span className="font-mono">{'{{var}}'}</span> = dato dinámico</p>
                  </div>
                )}

                {/* Posición */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">X (PDF pts)</label>
                    <input type="number" value={Math.round(selectedEl.x)} onChange={(e) => updateSelected({ x: Number(e.target.value) })}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#28B4AD]" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Y (PDF pts)</label>
                    <input type="number" value={Math.round(selectedEl.y)} onChange={(e) => updateSelected({ y: Number(e.target.value) })}
                      className="w-full px-2 py-1.5 border border-slate-200 outline-none focus:ring-2 focus:ring-[#28B4AD] rounded-lg text-xs text-slate-800" />
                  </div>
                </div>

                {/* QR: tamaño + color */}
                {selectedEl.isQR && <>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Tamaño (pts) — también arrastra la esquina</label>
                    <input type="number" value={Math.round(selectedEl.size ?? 90)} onChange={(e) => updateSelected({ size: Number(e.target.value) })}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#28B4AD]" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Color del QR</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={selectedEl.qrColor ?? '#000000'} onChange={(e) => updateSelected({ qrColor: e.target.value })}
                        className="w-8 h-8 rounded border border-slate-200 cursor-pointer p-0.5" />
                      <input type="text" value={selectedEl.qrColor ?? '#000000'} onChange={(e) => updateSelected({ qrColor: e.target.value })}
                        className="flex-1 px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 outline-none focus:ring-2 focus:ring-[#28B4AD]" />
                    </div>
                    <div className="flex gap-2 mt-2">
                      {['#000000', state.color_primary, state.color_accent].map((c) => (
                        <button key={c} onClick={() => updateSelected({ qrColor: c })}
                          className="w-6 h-6 rounded-full border-2 border-white shadow-md ring-1 ring-slate-200 transition-transform hover:scale-110"
                          style={{ background: c }} title={c} />
                      ))}
                    </div>
                  </div>
                </>}

                {/* Texto libre: dimensiones */}
                {selectedEl.isLibre && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Ancho (pts)</label>
                      <input type="number" value={Math.round(selectedEl.size ?? 300)} onChange={(e) => updateSelected({ size: Number(e.target.value) })}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#28B4AD]" />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Alto (pts)</label>
                      <input type="number" value={Math.round(selectedEl.height ?? 120)} onChange={(e) => updateSelected({ height: Number(e.target.value) })}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#28B4AD]" />
                    </div>
                  </div>
                )}

                {/* Texto: fontSize, align, lineHeight, color */}
                {!selectedEl.isQR && <>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Fuente (pts)</label>
                      <input type="number" value={selectedEl.fontSize ?? 12} onChange={(e) => updateSelected({ fontSize: Number(e.target.value) })}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#28B4AD]" />
                    </div>
                    {selectedEl.isLibre && (
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">Interlineado</label>
                        <input type="number" step="0.1" value={selectedEl.lineHeight ?? 1.4} onChange={(e) => updateSelected({ lineHeight: Number(e.target.value) })}
                          className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#28B4AD]" />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Alineación</label>
                    <div className="flex gap-1">
                      {(['left', 'center', 'right', ...(selectedEl.isLibre ? ['justify'] : [])] as const).map((a) => (
                        <button key={a} onClick={() => updateSelected({ align: a as any })}
                          className={`flex-1 flex items-center justify-center py-1.5 rounded-lg border transition-all ${selectedEl.align === a ? 'bg-[#28B4AD] border-[#28B4AD] text-white' : 'border-slate-200 text-slate-400 hover:bg-slate-50'}`}>
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
                      <input type="color" value={selectedEl.color ?? '#1a1a2e'} onChange={(e) => updateSelected({ color: e.target.value })}
                        className="w-8 h-8 rounded border border-slate-200 cursor-pointer p-0.5" />
                      <input type="text" value={selectedEl.color ?? ''} onChange={(e) => updateSelected({ color: e.target.value })}
                        placeholder="Color global"
                        className="flex-1 px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 outline-none focus:ring-2 focus:ring-[#28B4AD]" />
                    </div>
                  </div>
                </>}

                {/* Visible toggle */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                  <span className="text-xs text-slate-600 font-medium">Visible en PDF</span>
                  <div onClick={() => updateSelected({ visible: !selectedEl.visible })}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full cursor-pointer transition-colors ${selectedEl.visible ? 'bg-[#28B4AD]' : 'bg-slate-300'}`}>
                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${selectedEl.visible ? 'translate-x-[18px]' : 'translate-x-[2px]'}`} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
