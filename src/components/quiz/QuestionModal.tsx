/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  ArrowRightLeft,
  Target,
  Zap,
  HelpCircle,
  Split,
  X
} from 'lucide-react'
import { saveQuestion, updateQuestion } from '@/actions/quiz'
import { RichTextEditor } from './RichTextEditor'
import { toast } from 'sonner'

interface QuestionModalProps {
  leccionId: string
  question?: any
  onClose: () => void
}

export function QuestionModal({ leccionId, question, onClose }: QuestionModalProps) {
  const router = useRouter()
  const isEdit = !!question
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [tipo, setTipo] = useState<'multiple' | 'vf' | 'abierta' | 'pareados'>(
    question?.tipo || 'multiple'
  )
  const [texto, setTexto] = useState(question?.texto || '')
  const [puntos, setPuntos] = useState(question?.puntos || 10)
  const [opciones, setOpciones] = useState<any[]>(
    question
      ? question.tipo === 'pareados'
        ? (() => {
            const mid = Math.floor(question.quizzes_opciones.length / 2)
            const terms = question.quizzes_opciones.slice(0, mid)
            const answers = question.quizzes_opciones.slice(mid)
            return terms.map((term: any, idx: number) => ({
              id: term.id,
              texto: term.texto,
              texto_pareado: answers[idx]?.texto || '',
              es_correcta: true
            }))
          })()
        : question.quizzes_opciones.map((opt: any) => ({
            id: opt.id,
            texto: opt.texto,
            es_correcta: opt.es_correcta
          }))
      : tipo === 'vf'
      ? [
          { texto: 'Verdadero', es_correcta: false },
          { texto: 'Falso', es_correcta: false }
        ]
      : [
          { texto: '', es_correcta: false },
          { texto: '', es_correcta: false }
        ]
  )

  const handleTypeChange = (newType: typeof tipo) => {
    setTipo(newType)
    if (newType === 'vf') {
      setOpciones([{ texto: 'Verdadero', es_correcta: false }, { texto: 'Falso', es_correcta: false }])
    } else if (newType === 'multiple') {
      setOpciones([{ texto: '', es_correcta: false }, { texto: '', es_correcta: false }])
    } else if (newType === 'pareados') {
      setOpciones([{ texto: '', es_correcta: true, texto_pareado: '' }, { texto: '', es_correcta: true, texto_pareado: '' }])
    } else {
      setOpciones([])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const result = isEdit
      ? await updateQuestion({
          id: question.id,
          texto,
          tipo,
          puntos,
          opciones,
          leccionId
        })
      : await saveQuestion({
          leccion_id: leccionId,
          texto,
          tipo,
          puntos,
          opciones
        })

    setLoading(false)

    if (result.success) {
      toast.success(isEdit ? 'Pregunta actualizada correctamente' : 'Pregunta añadida correctamente')
      router.refresh()
      onClose()
    } else {
      const errorMsg = result.error || 'Error al guardar la pregunta'
      setError(errorMsg)
      toast.error(errorMsg)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">
            {isEdit ? 'Editar Pregunta' : 'Nueva Pregunta'}
          </h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[75vh]">
          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Type Selector + Points */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { id: 'multiple', label: 'Alternativas', icon: <Target size={16} />, activeColor: 'border-[#28B4AD] text-[#28B4AD] bg-emerald-50/50' },
                { id: 'vf', label: 'V / F', icon: <Zap size={16} />, activeColor: 'border-blue-400 text-blue-600 bg-blue-50/50' },
                { id: 'pareados', label: 'Pareados', icon: <Split size={16} />, activeColor: 'border-violet-400 text-violet-600 bg-violet-50/50' },
                { id: 'abierta', label: 'Abierta', icon: <HelpCircle size={16} />, activeColor: 'border-gray-400 text-gray-600 bg-gray-50' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleTypeChange(t.id as any)}
                  disabled={loading}
                  className={`relative flex flex-col items-center justify-center gap-2 py-3 px-1 rounded-2xl transition-all border-2 group disabled:opacity-50 ${
                    tipo === t.id
                      ? `${t.activeColor} shadow-sm scale-[1.02]`
                      : 'bg-white text-gray-400 border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <div className={`transition-colors ${tipo === t.id ? '' : 'text-gray-300 group-hover:text-gray-500'}`}>
                    {t.icon}
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-widest leading-none">
                    {t.label}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Puntaje</label>
              <input
                type="number"
                value={puntos}
                onChange={(e) => setPuntos(Number(e.target.value))}
                disabled={loading}
                className="form-input w-20 text-center text-[#28B4AD] font-black text-xs px-2 py-1"
              />
            </div>
          </div>

          {/* Question Text */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1 block">
              Pregunta Principal
            </label>
            <RichTextEditor
              value={texto}
              onChange={setTexto}
              placeholder="¿Qué quieres preguntar?"
              key={`editor-${question?.id || 'new'}`}
            />
          </div>

          {/* Options */}
          {tipo !== 'abierta' && (
            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">
                  Configurar Opciones
                </label>
                {(tipo === 'multiple' || tipo === 'pareados') && (
                  <button
                    type="button"
                    onClick={() =>
                      setOpciones([
                        ...opciones,
                        tipo === 'pareados'
                          ? { texto: '', es_correcta: true, texto_pareado: '' }
                          : { texto: '', es_correcta: false }
                      ])
                    }
                    disabled={loading}
                    className="text-[10px] font-bold text-[#28B4AD] hover:underline flex items-center gap-1 disabled:opacity-50"
                  >
                    <Plus size={12} /> Añadir opción
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {opciones.map((opt, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 bg-gray-50/50 p-3 rounded-2xl border border-gray-100 group transition-all hover:bg-white hover:shadow-sm"
                  >
                    {tipo !== 'pareados' && (
                      <button
                        type="button"
                        onClick={() =>
                          setOpciones(
                            opciones.map((o, i) => ({
                              ...o,
                              es_correcta:
                                i === index
                                  ? !o.es_correcta
                                  : tipo === 'multiple'
                                  ? o.es_correcta
                                  : false
                            }))
                          )
                        }
                        disabled={loading}
                        className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all disabled:opacity-50 ${
                          opt.es_correcta
                            ? 'bg-[#28B4AD] text-white shadow-md'
                            : 'bg-white text-gray-200 border border-gray-200 hover:border-[#28B4AD]'
                        }`}
                      >
                        {opt.es_correcta ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                      </button>
                    )}

                    {tipo === 'pareados' ? (
                      <div className="flex-1 flex items-center gap-2">
                        <input
                          type="text"
                          value={opt.texto}
                          onChange={(e) => {
                            const n = [...opciones]
                            n[index].texto = e.target.value
                            setOpciones(n)
                          }}
                          placeholder="Término A"
                          disabled={loading}
                          className="form-input py-1.5 flex-1"
                        />
                        <ArrowRightLeft size={14} className="text-gray-300 shrink-0" />
                        <input
                          type="text"
                          value={opt.texto_pareado}
                          onChange={(e) => {
                            const n = [...opciones]
                            n[index].texto_pareado = e.target.value
                            setOpciones(n)
                          }}
                          placeholder="Término B"
                          disabled={loading}
                          className="form-input py-1.5 flex-1 text-[#28B4AD] border-[#28B4AD]/20"
                        />
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={opt.texto}
                        onChange={(e) => {
                          const n = [...opciones]
                          n[index].texto = e.target.value
                          setOpciones(n)
                        }}
                        disabled={loading || tipo === 'vf'}
                        placeholder={tipo === 'vf' ? opt.texto : `Opción ${index + 1}`}
                        className="form-input py-1.5 flex-1"
                      />
                    )}

                    {(tipo === 'multiple' || tipo === 'pareados') && opciones.length > 2 && (
                      <button
                        type="button"
                        onClick={() => setOpciones(opciones.filter((_, i) => i !== index))}
                        disabled={loading}
                        className="p-1.5 text-gray-300 hover:text-red-500 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2 rounded-xl text-gray-600 hover:bg-gray-100 font-bold transition-all text-sm disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !texto}
            className="px-8 py-2 bg-[#28B4AD] hover:bg-[#219892] text-white rounded-xl font-bold transition-all shadow-lg disabled:opacity-50 flex items-center gap-2 text-sm"
          >
            {loading && <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />}
            {loading
              ? 'Guardando...'
              : isEdit
              ? 'Guardar cambios'
              : 'Añadir Pregunta'}
          </button>
        </div>
      </div>
    </div>
  )
}
