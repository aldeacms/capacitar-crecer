/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Trash2, HelpCircle, ArrowRightLeft, GripVertical, CheckCircle2, ListFilter, Edit2, Plus, Circle, X } from 'lucide-react'
import { deleteQuestion, updateQuestionsOrder, updateQuestion } from '@/actions/quiz'
import { RichTextEditor } from './RichTextEditor'
import { toast } from 'sonner'

interface QuestionListProps {
  initialPreguntas: any[]
}

export default function QuestionList({ initialPreguntas }: QuestionListProps) {
  const [preguntas, setPreguntas] = useState(initialPreguntas)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    setPreguntas(initialPreguntas)
  }, [initialPreguntas])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = preguntas.findIndex((p) => p.id === active.id)
      const newIndex = preguntas.findIndex((p) => p.id === over.id)
      const newOrder = arrayMove(preguntas, oldIndex, newIndex)
      setPreguntas(newOrder)
      const questionsToUpdate = newOrder.map((q, index) => ({ id: q.id, orden: index + 1 }))
      const result = await updateQuestionsOrder(questionsToUpdate)
      if (!result.success) setPreguntas(preguntas)
    }
  }

  if (!mounted) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
          <ListFilter size={14} /> Estructura de la Evaluación
        </h3>
        <div className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded uppercase">
          {preguntas.length} Reactivos
        </div>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={preguntas.map(p => p.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-4">
            {preguntas.length > 0 ? (
              preguntas.map((q, qIndex) => (
                <SortableQuestionItem key={q.id} q={q} qIndex={qIndex} />
              ))
            ) : (
              <div className="bg-gray-50/50 border-2 border-dashed border-gray-200 rounded-3xl p-16 text-center">
                <HelpCircle size={40} className="text-gray-200 mx-auto mb-4" />
                <p className="text-gray-400 font-bold text-sm">No hay preguntas creadas</p>
              </div>
            )}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}

function SortableQuestionItem({ q, qIndex }: { q: any, qIndex: number }) {
  const router = useRouter()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: q.id })
  const [isDeleting, setIsDeleting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  // Estados para edición
  const [editText, setEditText] = useState(q.texto)
  const [editPuntos, setEditPuntos] = useState(q.puntos || 10)
  const [editOpciones, setEditOpciones] = useState<Array<{ id?: string; texto: string; es_correcta: boolean; texto_pareado?: string }>>(
    q.tipo === 'pareados'
      ? (() => {
        const mid = Math.floor(q.quizzes_opciones.length / 2)
        const terms = q.quizzes_opciones.slice(0, mid)
        const answers = q.quizzes_opciones.slice(mid)
        return terms.map((term: any, idx: number) => ({
          id: term.id,
          texto: term.texto,
          texto_pareado: answers[idx]?.texto || '',
          es_correcta: true
        }))
      })()
      : q.quizzes_opciones.map((opt: any) => ({
        id: opt.id,
        texto: opt.texto,
        es_correcta: opt.es_correcta
      }))
  )

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 0,
    opacity: isDragging ? 0.5 : 1
  }

  const handleDelete = async () => {
    if (!confirm('¿Seguro?')) return
    setIsDeleting(true)
    const result = await deleteQuestion(q.id)
    if (!result.success) setIsDeleting(false)
  }

  const handleSaveEdit = async () => {
    setIsUpdating(true)
    const result = await updateQuestion({
      id: q.id,
      texto: editText,
      tipo: q.tipo,
      puntos: editPuntos,
      opciones: editOpciones,
      leccionId: q.leccion_id
    })
    setIsUpdating(false)

    if (result.success) {
      setIsEditing(false)
      toast.success("Pregunta actualizada correctamente")
      router.refresh()
    } else {
      toast.error(result.error || "Error al actualizar")
    }
  }

  const handleCancelEdit = () => {
    setEditText(q.texto)
    setEditPuntos(q.puntos || 10)
    setIsEditing(false)
  }

  // Color de acento según tipo
  const accentColor = q.tipo === 'multiple' ? 'border-l-[#28B4AD]' : q.tipo === 'vf' ? 'border-l-blue-400' : q.tipo === 'pareados' ? 'border-l-violet-400' : 'border-l-gray-400'

  if (isEditing) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`bg-white rounded-2xl border border-gray-100 shadow-sm border-l-4 ${accentColor} transition-all overflow-hidden`}
      >
        <div className="p-5 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gray-50 text-gray-400 flex items-center justify-center font-black text-[10px] border border-gray-100">
                {qIndex + 1}
              </div>
              <h4 className="font-bold text-gray-900">Editar Pregunta</h4>
            </div>
            <button
              onClick={handleCancelEdit}
              disabled={isUpdating}
              className="p-1.5 text-gray-300 hover:text-gray-600 rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Formulario inline */}
          <div className="space-y-3">
            {/* Texto */}
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1 block mb-2">
                Pregunta
              </label>
              <RichTextEditor
                value={editText}
                onChange={setEditText}
                placeholder="Edita la pregunta..."
              />
            </div>

            {/* Puntos */}
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Puntaje</label>
              <input
                type="number"
                value={editPuntos}
                onChange={(e) => setEditPuntos(Number(e.target.value))}
                className="form-input w-20 text-center text-[#28B4AD] font-black text-xs px-2 py-1"
              />
            </div>

            {/* Opciones */}
            {q.tipo !== 'abierta' && (
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1 block">
                  Opciones
                </label>
                {editOpciones.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-3 bg-gray-50/50 p-3 rounded-2xl border border-gray-100 group transition-all hover:bg-white hover:shadow-sm">
                    {q.tipo !== 'pareados' && (
                      <button
                        type="button"
                        onClick={() => {
                          const newOpts = editOpciones.map((o, i) => ({
                            ...o,
                            es_correcta: i === idx ? !o.es_correcta : (q.tipo === 'multiple' ? o.es_correcta : false)
                          }))
                          setEditOpciones(newOpts)
                        }}
                        className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                          opt.es_correcta
                            ? 'bg-[#28B4AD] text-white shadow-md'
                            : 'bg-white text-gray-200 border border-gray-200 hover:border-[#28B4AD]'
                        }`}
                      >
                        {opt.es_correcta ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                      </button>
                    )}

                    {q.tipo === 'pareados' ? (
                      <div className="flex-1 flex items-center gap-2">
                        <input
                          type="text"
                          value={opt.texto}
                          onChange={(e) => {
                            const n = [...editOpciones]
                            n[idx].texto = e.target.value
                            setEditOpciones(n)
                          }}
                          placeholder="Término A"
                          className="form-input flex-1"
                        />
                        <ArrowRightLeft size={14} className="text-gray-300 shrink-0" />
                        <input
                          type="text"
                          value={opt.texto_pareado || ''}
                          onChange={(e) => {
                            const n = [...editOpciones]
                            n[idx].texto_pareado = e.target.value
                            setEditOpciones(n)
                          }}
                          placeholder="Término B"
                          className="form-input flex-1 text-[#28B4AD]"
                        />
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={opt.texto}
                        onChange={(e) => {
                          const n = [...editOpciones]
                          n[idx].texto = e.target.value
                          setEditOpciones(n)
                        }}
                        placeholder={`Opción ${idx + 1}`}
                        className="form-input flex-1"
                      />
                    )}

                    {(q.tipo === 'multiple' || q.tipo === 'pareados') && editOpciones.length > 2 && (
                      <button
                        type="button"
                        onClick={() => setEditOpciones(editOpciones.filter((_, i) => i !== idx))}
                        className="p-1.5 text-gray-300 hover:text-red-500 rounded-lg transition-colors"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ))}

                {(q.tipo === 'multiple' || q.tipo === 'pareados') && (
                  <button
                    type="button"
                    onClick={() => setEditOpciones([...editOpciones, q.tipo === 'pareados' ? { texto: '', es_correcta: true, texto_pareado: '' } : { texto: '', es_correcta: false }])}
                    className="text-[10px] font-bold text-[#28B4AD] hover:underline flex items-center gap-1 mt-2"
                  >
                    <Plus size={12} /> Añadir opción
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Botones de acción */}
          <div className="flex gap-3 justify-end border-t border-gray-50 pt-4">
            <button
              onClick={handleCancelEdit}
              disabled={isUpdating}
              className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSaveEdit}
              disabled={isUpdating}
              className="px-6 py-2 bg-[#28B4AD] hover:bg-[#219892] text-white rounded-lg text-sm font-bold transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isUpdating && <div className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full" />}
              {isUpdating ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-2xl border border-gray-100 shadow-sm border-l-4 ${accentColor} transition-all hover:shadow-md group overflow-hidden`}
    >
      <div className="p-5 flex gap-5">
        {/* Lado izquierdo: Info y Número */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gray-50 text-gray-400 flex items-center justify-center font-black text-[10px] border border-gray-100">
            {qIndex + 1}
          </div>
          <div
            {...attributes} {...listeners}
            className="p-1.5 text-gray-300 hover:text-gray-600 cursor-grab active:cursor-grabbing rounded-md transition-colors"
          >
            <GripVertical size={16} />
          </div>
        </div>

        {/* Centro: Pregunta y Opciones */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-4 mb-4">
            <div className="space-y-1 flex-1">
              <div
                className="font-bold text-gray-900 leading-tight text-base tracking-tight prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: q.texto }}
              />
              <div className="flex gap-2">
                <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">
                  {q.tipo === 'multiple' ? 'Alternativas' : q.tipo === 'vf' ? 'V/F' : q.tipo === 'pareados' ? 'Pareados' : 'Abierta'}
                </span>
                <span className="text-[9px] font-bold text-[#28B4AD] uppercase">{q.puntos} pts</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setIsEditing(true)}
                className="p-2 text-gray-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
              >
                <Edit2 size={16} />
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>

          {q.tipo !== 'abierta' && q.quizzes_opciones && (
            <div>
              {q.tipo === 'pareados' ? (
                <div className="space-y-2">
                  {(() => {
                    const mid = Math.floor(q.quizzes_opciones.length / 2)
                    const terms = q.quizzes_opciones.slice(0, mid)
                    const answers = q.quizzes_opciones.slice(mid)
                    return terms.map((term: any, idx: number) => (
                      <div
                        key={term.id}
                        className="px-3 py-2 rounded-xl border bg-gray-50/30 border-gray-100 text-[13px] flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2 w-full text-[12px]">
                          <span className="font-bold text-gray-800 flex-1">{term.texto}</span>
                          <ArrowRightLeft size={10} className="text-gray-300 shrink-0" />
                          <span className="font-bold text-[#28B4AD] flex-1 text-right">{answers[idx]?.texto || ''}</span>
                        </div>
                      </div>
                    ))
                  })()}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {q.quizzes_opciones.map((opt: any) => (
                    <div
                      key={opt.id}
                      className={`px-3 py-2 rounded-xl border text-[13px] flex items-center justify-between ${
                        opt.es_correcta
                          ? 'bg-emerald-50/50 border-emerald-100 text-emerald-700 font-medium'
                          : 'bg-gray-50/30 border-gray-100 text-gray-600'
                      }`}
                    >
                      <span className="truncate">{opt.texto}</span>
                      {opt.es_correcta && <CheckCircle2 size={14} className="shrink-0 ml-2" />}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}