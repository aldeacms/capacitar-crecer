/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect } from 'react'
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
import { Trash2, HelpCircle, ArrowRightLeft, GripVertical, CheckCircle2, ListFilter } from 'lucide-react'
import { deleteQuestion, updateQuestionsOrder } from '@/actions/quiz'

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
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: q.id })
  const [isDeleting, setIsDeleting] = useState(false)

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

  // Color de acento según tipo
  const accentColor = q.tipo === 'multiple' ? 'border-l-[#28B4AD]' : q.tipo === 'vf' ? 'border-l-blue-400' : q.tipo === 'pareados' ? 'border-l-violet-400' : 'border-l-gray-400'

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
            <div className="space-y-1">
              <h4 className="font-bold text-gray-900 leading-tight text-base tracking-tight">{q.texto}</h4>
              <div className="flex gap-2">
                <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">
                  {q.tipo === 'multiple' ? 'Alternativas' : q.tipo === 'vf' ? 'V/F' : 'Abierta'}
                </span>
                <span className="text-[9px] font-bold text-[#28B4AD] uppercase">{q.puntos} pts</span>
              </div>
            </div>

            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
            >
              <Trash2 size={16} />
            </button>
          </div>

          {q.tipo !== 'abierta' && q.quizzes_opciones && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {q.quizzes_opciones.map((opt: any) => (
                <div
                  key={opt.id}
                  className={`px-3 py-2 rounded-xl border text-[13px] flex items-center justify-between ${opt.es_correcta && q.tipo !== 'pareados'
                      ? 'bg-emerald-50/50 border-emerald-100 text-emerald-700 font-medium'
                      : 'bg-gray-50/30 border-gray-100 text-gray-600'
                    }`}
                >
                  {q.tipo === 'pareados' ? (
                    <div className="flex items-center gap-2 w-full text-[12px]">
                      <span className="font-bold text-gray-800">{opt.texto}</span>
                      <ArrowRightLeft size={10} className="text-gray-300" />
                      <span className="font-bold text-[#28B4AD]">{opt.texto_pareado}</span>
                    </div>
                  ) : (
                    <>
                      <span className="truncate">{opt.texto}</span>
                      {opt.es_correcta && <CheckCircle2 size={14} className="shrink-0 ml-2" />}
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}