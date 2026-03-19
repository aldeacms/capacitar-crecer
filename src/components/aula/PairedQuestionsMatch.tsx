'use client'

import { useState } from 'react'
import { ChevronRight, X } from 'lucide-react'

interface Opcion {
  id: string
  texto: string
  es_correcta: boolean
  orden: number
}

interface PairedQuestionsMatchProps {
  preguntaId: string
  opciones: Opcion[]
  respuestas: Record<string, string>
  onRespuestaChange: (preguntaId: string, pairKey: string, value: string) => void
  submitted: boolean
}

export default function PairedQuestionsMatch({
  preguntaId,
  opciones,
  respuestas,
  onRespuestaChange,
  submitted,
}: PairedQuestionsMatchProps) {
  const [draggedItem, setDraggedItem] = useState<string | null>(null)
  const [draggedFromLeft, setDraggedFromLeft] = useState(false)

  // Split opciones: first half = términos, second half = respuestas
  const mid = Math.floor(opciones.length / 2)
  const terminos = opciones.slice(0, mid)
  const respuestasOpciones = opciones.slice(mid)

  const handleDragStart = (itemId: string, isLeft: boolean) => {
    if (submitted) return
    setDraggedItem(itemId)
    setDraggedFromLeft(isLeft)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.currentTarget.classList.add('bg-blue-50', 'border-blue-300')
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('bg-blue-50', 'border-blue-300')
  }

  const handleDrop = (
    e: React.DragEvent,
    targetId: string,
    isDropOnLeft: boolean
  ) => {
    e.preventDefault()
    e.currentTarget.classList.remove('bg-blue-50', 'border-blue-300')

    if (!draggedItem || !draggedFromLeft || isDropOnLeft) return

    const pairKey = `${preguntaId}-${draggedItem}`
    onRespuestaChange(preguntaId, pairKey, targetId)
    setDraggedItem(null)
    setDraggedFromLeft(false)
  }

  const handleRemovePair = (terminoId: string) => {
    if (submitted) return
    const pairKey = `${preguntaId}-${terminoId}`
    onRespuestaChange(preguntaId, pairKey, '')
  }

  const getMatchedRespuesta = (terminoId: string) => {
    const pairKey = `${preguntaId}-${terminoId}`
    const respuestaId = respuestas[pairKey]
    if (!respuestaId) return null
    return respuestasOpciones.find(o => o.id === respuestaId)
  }

  // Separar términos en matched y unmatched
  const terminosUnmatched = terminos.filter(t => !getMatchedRespuesta(t.id))
  const terminosMatched = terminos.filter(t => getMatchedRespuesta(t.id))

  return (
    <div className="space-y-6">
      {/* Área de emparejamiento activo */}
      <div className="grid grid-cols-2 gap-4">
        {/* Left side - Términos sin emparejar */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
            Términos {terminosMatched.length > 0 && `(${terminosUnmatched.length} por emparejar)`}
          </p>
          <div className="space-y-2 min-h-12">
            {terminosUnmatched.length > 0 ? (
              terminosUnmatched.map(termino => (
                <div
                  key={termino.id}
                  draggable={!submitted}
                  onDragStart={() => handleDragStart(termino.id, true)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    submitted
                      ? 'bg-gray-50 border-gray-200 cursor-not-allowed'
                      : 'bg-white border-gray-300 cursor-grab hover:border-blue-400 hover:bg-blue-50 active:cursor-grabbing'
                  }`}
                >
                  <p className="text-sm font-medium text-gray-900">{termino.texto}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-500 italic py-2">Todos empareados ✓</p>
            )}
          </div>
        </div>

        {/* Right side - Respuestas disponibles */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Respuestas</p>
          <div className="space-y-2 min-h-12">
            {respuestasOpciones.map(respuesta => {
              const isMatched = terminos.some(t => {
                const pairKey = `${preguntaId}-${t.id}`
                return respuestas[pairKey] === respuesta.id
              })

              return (
                <div
                  key={respuesta.id}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={e => handleDrop(e, respuesta.id, false)}
                  draggable={false}
                  className={`p-3 rounded-lg border-2 transition-all min-h-12 flex items-center ${
                    isMatched
                      ? 'bg-gray-100 border-gray-300'
                      : draggedItem && draggedFromLeft
                        ? 'border-dashed border-blue-400 bg-blue-50'
                        : 'bg-white border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <p className="text-sm font-medium text-gray-900">{respuesta.texto}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Pares completados */}
      {terminosMatched.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">
            Pares completados ({terminosMatched.length})
          </p>
          <div className="space-y-2">
            {terminosMatched.map(termino => {
              const matched = getMatchedRespuesta(termino.id)
              return matched ? (
                <div
                  key={termino.id}
                  className="flex items-center gap-2 p-2 bg-white rounded border border-gray-200 text-sm"
                >
                  <span className="font-medium text-gray-900 flex-1">{termino.texto}</span>
                  <ChevronRight size={16} className="text-gray-400" />
                  <span className="font-medium text-gray-700">{matched.texto}</span>
                  {!submitted && (
                    <button
                      onClick={() => handleRemovePair(termino.id)}
                      className="ml-1 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Deshacer emparejamiento"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              ) : null
            })}
          </div>
        </div>
      )}

      {/* Help text */}
      <p className="text-xs text-gray-500 italic">
        Arrastra los términos de la izquierda hacia las respuestas de la derecha para crear pares
      </p>
    </div>
  )
}
