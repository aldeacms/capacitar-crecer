'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronDown, Play, BookOpen, HelpCircle, CheckCircle2 } from 'lucide-react'

interface Leccion {
  id: string
  titulo: string
  tipo: 'video' | 'texto' | 'quiz'
  orden: number
}

interface Modulo {
  id: string
  titulo: string
  orden: number
  lecciones: Leccion[]
}

interface LeccionSidebarProps {
  modulos: Modulo[]
  leccionesCompletadas: string[]
  leccionActivaId: string
  progresoPorcentaje: number
}

function getIconoTipo(tipo: string) {
  switch (tipo) {
    case 'video':
      return <Play size={14} />
    case 'texto':
      return <BookOpen size={14} />
    case 'quiz':
      return <HelpCircle size={14} />
    default:
      return <BookOpen size={14} />
  }
}

export default function LeccionSidebar({
  modulos,
  leccionesCompletadas,
  leccionActivaId,
  progresoPorcentaje,
}: LeccionSidebarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [expandidos, setExpandidos] = useState<Record<string, boolean>>(
    modulos.reduce((acc, m) => ({ ...acc, [m.id]: true }), {})
  )

  const toggleModulo = (moduloId: string) => {
    setExpandidos(prev => ({
      ...prev,
      [moduloId]: !prev[moduloId],
    }))
  }

  const handleLeccionClick = (leccionId: string) => {
    router.push(`?leccion=${leccionId}`)
  }

  const modulosOrdenados = [...modulos].sort((a, b) => a.orden - b.orden)

  return (
    <aside className="lg:col-span-1 h-fit lg:sticky lg:top-24 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
      {/* Header con progreso */}
      <div className="p-5 border-b border-gray-100">
        <div className="mb-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Progreso del curso
            </span>
            <span className="text-xs font-bold text-gray-700">{progresoPorcentaje}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-[#28B4AD] h-2 rounded-full transition-all duration-300"
              style={{ width: `${progresoPorcentaje}%` }}
            />
          </div>
        </div>
      </div>

      {/* Módulos y lecciones */}
      <div className="flex-1 overflow-y-auto max-h-[calc(100vh-300px)]">
        <div className="divide-y divide-gray-100">
          {modulosOrdenados.map(modulo => {
            const leccionesOrdenadas = [...(modulo.lecciones || [])].sort(
              (a, b) => a.orden - b.orden
            )

            return (
              <div key={modulo.id} className="last:border-b-0">
                {/* Header del módulo */}
                <button
                  onClick={() => toggleModulo(modulo.id)}
                  className="w-full px-5 py-3 hover:bg-gray-50 transition-colors flex items-center justify-between group"
                >
                  <span className="font-bold text-xs text-gray-700 uppercase tracking-wider group-hover:text-[#28B4AD]">
                    {modulo.titulo}
                  </span>
                  <ChevronDown
                    size={16}
                    className={`text-gray-400 transition-transform ${
                      expandidos[modulo.id] ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Lecciones */}
                {expandidos[modulo.id] && (
                  <div className="bg-gray-50/50 space-y-1 px-2 py-2">
                    {leccionesOrdenadas.map(leccion => {
                      const esActiva = leccion.id === leccionActivaId
                      const esCompletada = leccionesCompletadas.includes(leccion.id)

                      return (
                        <button
                          key={leccion.id}
                          onClick={() => handleLeccionClick(leccion.id)}
                          className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2 group ${
                            esActiva
                              ? 'bg-[#28B4AD] text-white shadow-sm'
                              : esCompletada
                                ? 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100'
                                : 'text-gray-700 hover:bg-white'
                          }`}
                        >
                          <span className={`flex-shrink-0 ${
                            esActiva ? 'text-white' : 'text-gray-500'
                          }`}>
                            {getIconoTipo(leccion.tipo)}
                          </span>
                          <span className="flex-1 truncate">{leccion.titulo}</span>
                          {esCompletada && (
                            <CheckCircle2
                              size={14}
                              className={`flex-shrink-0 ${
                                esActiva
                                  ? 'text-white'
                                  : 'text-emerald-600'
                              }`}
                            />
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </aside>
  )
}
