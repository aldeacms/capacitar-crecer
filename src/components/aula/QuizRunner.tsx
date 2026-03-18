'use client'

import { useState } from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'

interface Opcion {
  id: string
  texto: string
  es_correcta: boolean
  orden: number
}

interface Pregunta {
  id: string
  texto: string
  tipo: 'multiple' | 'vf' | 'abierta'
  orden: number
  quizzes_opciones: Opcion[]
}

interface QuizRunnerProps {
  preguntas: Pregunta[]
}

export default function QuizRunner({ preguntas }: QuizRunnerProps) {
  const [respuestas, setRespuestas] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)

  if (!preguntas || preguntas.length === 0) {
    return (
      <div className="w-full bg-gray-50 rounded-xl p-8 border border-gray-200 flex items-center justify-center min-h-[300px]">
        <p className="text-gray-500 text-sm">No hay preguntas en este quiz</p>
      </div>
    )
  }

  const preguntasOrdenadas = [...preguntas].sort((a, b) => a.orden - b.orden)
  const opcionesOrdenadas = preguntasOrdenadas.map(p => ({
    ...p,
    quizzes_opciones: [...p.quizzes_opciones].sort((a, b) => a.orden - b.orden),
  }))

  const handleRespuesta = (preguntaId: string, opcionId: string) => {
    if (submitted) return
    setRespuestas(prev => ({
      ...prev,
      [preguntaId]: opcionId,
    }))
  }

  const handleRespuestaVF = (preguntaId: string, esVerdadero: boolean) => {
    if (submitted) return
    const opcion = preguntasOrdenadas
      .find(p => p.id === preguntaId)
      ?.quizzes_opciones.find(
        o => (esVerdadero && o.texto.toLowerCase() === 'verdadero') ||
             (!esVerdadero && o.texto.toLowerCase() === 'falso')
      )
    if (opcion) {
      setRespuestas(prev => ({
        ...prev,
        [preguntaId]: opcion.id,
      }))
    }
  }

  const handleSubmit = () => {
    setSubmitted(true)
  }

  const handleReiniciar = () => {
    setRespuestas({})
    setSubmitted(false)
  }

  if (submitted) {
    const correctas = opcionesOrdenadas.filter(p => {
      const respuestaId = respuestas[p.id]
      if (!respuestaId) return false
      return p.quizzes_opciones.some(o => o.id === respuestaId && o.es_correcta)
    }).length

    const porcentaje = Math.round((correctas / opcionesOrdenadas.length) * 100)

    return (
      <div className="w-full bg-white rounded-xl border border-gray-200 p-8 space-y-6">
        {/* Resultado General */}
        <div className="bg-gradient-to-r from-[#28B4AD]/10 to-[#28B4AD]/5 rounded-xl p-6 border border-[#28B4AD]/20">
          <div className="text-center">
            <h3 className="text-3xl font-bold text-gray-900">
              {porcentaje}%
            </h3>
            <p className="text-gray-600 mt-1">
              {correctas} de {opcionesOrdenadas.length} respuestas correctas
            </p>
          </div>
        </div>

        {/* Revisión de respuestas */}
        <div className="space-y-4">
          <h4 className="font-bold text-gray-900">Revisión</h4>
          {opcionesOrdenadas.map((pregunta, idx) => {
            const respuestaId = respuestas[pregunta.id]
            const opcionSeleccionada = pregunta.quizzes_opciones.find(o => o.id === respuestaId)
            const esCorrecta = opcionSeleccionada?.es_correcta || false

            return (
              <div
                key={pregunta.id}
                className={`p-4 rounded-lg border-l-4 ${
                  esCorrecta
                    ? 'bg-emerald-50 border-emerald-500'
                    : 'bg-red-50 border-red-500'
                }`}
              >
                <div className="flex items-start gap-3">
                  {esCorrecta ? (
                    <CheckCircle2 size={20} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 mb-1">
                      {idx + 1}. {pregunta.texto}
                    </p>
                    {opcionSeleccionada && (
                      <p className={`text-sm ${esCorrecta ? 'text-emerald-700' : 'text-red-700'}`}>
                        Tu respuesta: <span className="font-medium">{opcionSeleccionada.texto}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Botón de reinicio */}
        <button
          onClick={handleReiniciar}
          className="w-full py-2.5 bg-[#28B4AD] hover:bg-[#1f9593] text-white rounded-xl font-bold transition-all"
        >
          Reintentar
        </button>
      </div>
    )
  }

  const respondidas = Object.keys(respuestas).length
  const total = opcionesOrdenadas.length

  return (
    <div className="w-full bg-white rounded-xl border border-gray-200 p-8 space-y-6">
      {/* Progreso */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-bold text-gray-900">Progreso</span>
          <span className="text-sm text-gray-600">
            {respondidas} de {total}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-[#28B4AD] h-2 rounded-full transition-all"
            style={{ width: `${(respondidas / total) * 100}%` }}
          />
        </div>
      </div>

      {/* Preguntas */}
      <div className="space-y-6">
        {opcionesOrdenadas.map((pregunta, idx) => (
          <div key={pregunta.id} className="border-b border-gray-200 pb-6 last:border-b-0 last:pb-0">
            <h4 className="font-semibold text-gray-900 mb-4">
              {idx + 1}. {pregunta.texto}
            </h4>

            {pregunta.tipo === 'multiple' && (
              <div className="space-y-2">
                {pregunta.quizzes_opciones.map(opcion => (
                  <label
                    key={opcion.id}
                    className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-all"
                  >
                    <input
                      type="radio"
                      name={pregunta.id}
                      value={opcion.id}
                      checked={respuestas[pregunta.id] === opcion.id}
                      onChange={() => handleRespuesta(pregunta.id, opcion.id)}
                      disabled={submitted}
                      className="w-4 h-4 cursor-pointer"
                    />
                    <span className="ml-3 text-sm text-gray-700">{opcion.texto}</span>
                  </label>
                ))}
              </div>
            )}

            {pregunta.tipo === 'vf' && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleRespuestaVF(pregunta.id, true)}
                  disabled={submitted}
                  className={`flex-1 py-2 px-4 rounded-lg font-bold text-sm transition-all ${
                    respuestas[pregunta.id] ===
                    pregunta.quizzes_opciones.find(o => o.texto.toLowerCase() === 'verdadero')?.id
                      ? 'bg-[#28B4AD] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  } disabled:opacity-50`}
                >
                  Verdadero
                </button>
                <button
                  onClick={() => handleRespuestaVF(pregunta.id, false)}
                  disabled={submitted}
                  className={`flex-1 py-2 px-4 rounded-lg font-bold text-sm transition-all ${
                    respuestas[pregunta.id] ===
                    pregunta.quizzes_opciones.find(o => o.texto.toLowerCase() === 'falso')?.id
                      ? 'bg-[#28B4AD] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  } disabled:opacity-50`}
                >
                  Falso
                </button>
              </div>
            )}

            {pregunta.tipo === 'abierta' && (
              <textarea
                disabled={true}
                placeholder="Esta es una pregunta abierta. Tu respuesta se registra automáticamente."
                className="w-full p-3 border border-gray-200 rounded-lg text-sm text-gray-500 bg-gray-50 resize-none"
                rows={3}
              />
            )}
          </div>
        ))}
      </div>

      {/* Botón submit */}
      <button
        onClick={handleSubmit}
        disabled={respondidas === 0}
        className="w-full py-2.5 bg-[#28B4AD] hover:bg-[#1f9593] disabled:bg-gray-300 text-white rounded-xl font-bold transition-all disabled:cursor-not-allowed"
      >
        Enviar respuestas
      </button>
    </div>
  )
}
