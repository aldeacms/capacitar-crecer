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
  Split
} from 'lucide-react'
import { saveQuestion } from '@/actions/quiz'
import { RichTextEditor } from './RichTextEditor'
import { toast } from 'sonner'

interface Option {
  id?: string
  texto: string
  es_correcta: boolean
  texto_pareado?: string
}

export default function QuestionForm({ leccionId }: { leccionId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tipo, setTipo] = useState<'multiple' | 'vf' | 'abierta' | 'pareados'>('multiple')
  const [texto, setTexto] = useState('')
  const [puntos, setPuntos] = useState(10)
  const [opciones, setOpciones] = useState<Option[]>([
    { texto: '', es_correcta: false },
    { texto: '', es_correcta: false }
  ])

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

    const result = await saveQuestion({ leccion_id: leccionId, texto, tipo, puntos, opciones })
    setLoading(false)

    if (result.success) {
      setTexto('')
      handleTypeChange(tipo)
      setError(null)
      toast.success("Pregunta añadida correctamente")
      router.refresh()
    } else {
      setError(result.error || "Error al guardar la pregunta")
      toast.error(result.error || "Error al guardar la pregunta")
    }
  }

  const inputBase = "form-input"

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden transition-all duration-300">
      {/* HEADER DEL FORMULARIO */}
      <div className="bg-gray-50/80 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#28B4AD]/10 text-[#28B4AD] flex items-center justify-center">
            <Plus size={18} />
          </div>
          <h3 className="font-bold text-gray-900 text-sm tracking-tight">Nueva Pregunta</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Puntaje:</span>
          <input
            type="number" value={puntos} onChange={(e) => setPuntos(Number(e.target.value))}
            className="form-input w-16 text-center text-[#28B4AD] font-black text-xs px-2 py-1"
          />
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* SELECTOR DE TIPO (VISUAL CARDS MÁS SUTILES) */}
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
              className={`relative flex flex-col items-center justify-center gap-2 py-3 px-1 rounded-2xl transition-all border-2 group ${tipo === t.id
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
              {tipo === t.id && (
                <div className={`absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full ${t.id === 'multiple' ? 'bg-[#28B4AD]' : 'bg-current'}`} />
              )}
            </button>
          ))}
        </div>

        {/* ENUNCIADO */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Pregunta Principal</label>
          <RichTextEditor
            value={texto}
            onChange={setTexto}
            placeholder="¿Qué quieres preguntar?"
          />
        </div>

        {/* OPCIONES */}
        {tipo !== 'abierta' && (
          <div className="space-y-3 pt-2">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Configurar Opciones</label>
              {(tipo === 'multiple' || tipo === 'pareados') && (
                <button
                  type="button"
                  onClick={() => setOpciones([...opciones, { texto: '', es_correcta: false, texto_pareado: '' }])}
                  className="text-[10px] font-bold text-[#28B4AD] hover:underline flex items-center gap-1"
                >
                  <Plus size={12} /> Añadir opción
                </button>
              )}
            </div>

            <div className="space-y-2">
              {opciones.map((opt, index) => (
                <div key={index} className="flex items-center gap-3 bg-gray-50/50 p-3 rounded-2xl border border-gray-100 group transition-all hover:bg-white hover:shadow-sm">
                  {tipo !== 'pareados' && (
                    <button
                      type="button"
                      onClick={() => setOpciones(opciones.map((o, i) => ({
                        ...o,
                        es_correcta: i === index ? !o.es_correcta : (tipo === 'multiple' ? o.es_correcta : false)
                      })))}
                      className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all ${opt.es_correcta
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
                        type="text" value={opt.texto}
                        onChange={(e) => { const n = [...opciones]; n[index].texto = e.target.value; setOpciones(n); }}
                        placeholder="Término A" className={`${inputBase} py-1.5`}
                      />
                      <ArrowRightLeft size={14} className="text-gray-300 shrink-0" />
                      <input
                        type="text" value={opt.texto_pareado}
                        onChange={(e) => { const n = [...opciones]; n[index].texto_pareado = e.target.value; setOpciones(n); }}
                        placeholder="Término B" className={`${inputBase} py-1.5 text-[#28B4AD] border-[#28B4AD]/20`}
                      />
                    </div>
                  ) : (
                    <input
                      type="text" value={opt.texto}
                      onChange={(e) => { const n = [...opciones]; n[index].texto = e.target.value; setOpciones(n); }}
                      disabled={tipo === 'vf'} className={`${inputBase} py-1.5`}
                      placeholder={tipo === 'vf' ? opt.texto : `Opción ${index + 1}`}
                    />
                  )}

                  {(tipo === 'multiple' || tipo === 'pareados') && opciones.length > 2 && (
                    <button
                      type="button"
                      onClick={() => setOpciones(opciones.filter((_, i) => i !== index))}
                      className="p-1.5 text-gray-300 hover:text-red-500 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ERRORES */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-xs text-red-700 font-medium">{error}</p>
          </div>
        )}

        {/* PIE DEL FORMULARIO CON CTA REFINADO */}
        <div className="pt-4 flex flex-col md:flex-row justify-end items-center gap-6 border-t border-gray-50">
          <p className="hidden md:block text-[10px] text-gray-400 font-medium italic">
            <Zap size={10} className="inline mr-1" /> Los cambios se guardarán automáticamente.
          </p>
          <button
            disabled={loading}
            className="w-full md:w-auto bg-[#28B4AD] hover:bg-[#219892] text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-[#28B4AD]/20 transition-all disabled:opacity-50 text-xs flex items-center justify-center gap-2 whitespace-nowrap min-w-[160px]"
          >
            {loading ? (
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <Plus size={16} strokeWidth={3} />
            )}
            <span>{loading ? 'Guardando...' : 'Añadir Pregunta'}</span>
          </button>
        </div>
      </div>
    </form>
  )
}