/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect } from 'react'
import { getInscripcionesUsuario, getCursosDisponibles, inscribirEnCurso, desinscribirDeCurso } from '@/actions/usuarios'
import { toast } from 'sonner'
import { X, Plus, Trash2, BookOpen, TrendingUp } from 'lucide-react'

interface UserDetailPanelProps {
  usuario: any
  onClose: () => void
  onUserUpdated?: () => void
}

export function UserDetailPanel({ usuario, onClose, onUserUpdated }: UserDetailPanelProps) {
  const [inscripciones, setInscripciones] = useState<any[]>([])
  const [disponibles, setDisponibles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingInscribir, setLoadingInscribir] = useState<string | null>(null)
  const [loadingDesinscribir, setLoadingDesinscribir] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [usuario.id])

  const loadData = async () => {
    setLoading(true)
    const [inscritos, disponiblesData] = await Promise.all([
      getInscripcionesUsuario(usuario.id),
      getCursosDisponibles(usuario.id)
    ])

    if (!('error' in inscritos)) {
      setInscripciones(inscritos)
    }
    if (!('error' in disponiblesData)) {
      setDisponibles(disponiblesData)
    }
    setLoading(false)
  }

  const handleInscribir = async (cursoId: string) => {
    setLoadingInscribir(cursoId)
    const result = await inscribirEnCurso(usuario.id, cursoId)

    if ('error' in result) {
      toast.error(result.error)
    } else {
      toast.success('Usuario enrolado correctamente')
      loadData()
      onUserUpdated?.()
    }
    setLoadingInscribir(null)
  }

  const handleDesinscribir = async (matriculaId: string) => {
    if (confirm('¿Estás seguro de que quieres desinscribir al usuario de este curso?')) {
      setLoadingDesinscribir(matriculaId)
      const result = await desinscribirDeCurso(matriculaId)

      if ('error' in result) {
        toast.error(result.error)
      } else {
        toast.success('Usuario desinscrito correctamente')
        loadData()
        onUserUpdated?.()
      }
      setLoadingDesinscribir(null)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#28B4AD]/20 to-[#28B4AD]/5 flex items-center justify-center">
              <span className="text-lg font-bold text-[#28B4AD]">
                {usuario.nombre_completo.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{usuario.nombre_completo}</h2>
              <p className="text-sm text-gray-500">{usuario.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="p-6 text-center text-gray-500">Cargando datos...</div>
          ) : (
            <div className="p-6 space-y-6">
              {/* Inscripciones */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <BookOpen size={18} className="text-[#28B4AD]" />
                  <h3 className="font-bold text-gray-900">Cursos Inscritos ({inscripciones.length})</h3>
                </div>

                {inscripciones.length > 0 ? (
                  <div className="space-y-3">
                    {inscripciones.map((inscripcion: any) => (
                      <div
                        key={inscripcion.id}
                        className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-[#28B4AD] transition-colors group"
                      >
                        {/* Imagen del curso */}
                        {inscripcion.cursos?.imagen_url && (
                          <img
                            src={inscripcion.cursos.imagen_url}
                            alt={inscripcion.cursos?.titulo}
                            className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                          />
                        )}

                        {/* Info del curso */}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 truncate">
                            {inscripcion.cursos?.titulo || 'Curso sin nombre'}
                          </p>

                          {/* Progreso */}
                          <div className="mt-2">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <TrendingUp size={12} />
                                {inscripcion.progreso_porcentaje}%
                              </span>
                              <span className="text-xs text-gray-400">
                                Pago: {inscripcion.estado_pago_curso === 'gratis' ? 'Gratis' : 'Pagado'}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-[#28B4AD] h-2 rounded-full transition-all"
                                style={{ width: `${inscripcion.progreso_porcentaje}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>

                        {/* Botón desinscribir */}
                        <button
                          onClick={() => handleDesinscribir(inscripcion.id)}
                          disabled={loadingDesinscribir === inscripcion.id}
                          className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
                          title="Desinscribir"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 p-4 bg-gray-50 rounded-lg text-center">
                    No hay cursos inscritos
                  </p>
                )}
              </div>

              {/* Cursos disponibles */}
              {disponibles.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Plus size={18} className="text-blue-500" />
                    <h3 className="font-bold text-gray-900">Cursos Disponibles ({disponibles.length})</h3>
                  </div>

                  <div className="space-y-3">
                    {disponibles.map((curso: any) => (
                      <div
                        key={curso.id}
                        className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg border border-blue-100 hover:border-blue-300 transition-colors group"
                      >
                        {/* Imagen del curso */}
                        {curso.imagen_url && (
                          <img
                            src={curso.imagen_url}
                            alt={curso.titulo}
                            className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                          />
                        )}

                        {/* Info del curso */}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{curso.titulo}</p>
                          <p className="text-xs text-gray-500 mt-1">Disponible para enrolar</p>
                        </div>

                        {/* Botón enrolar */}
                        <button
                          onClick={() => handleInscribir(curso.id)}
                          disabled={loadingInscribir === curso.id}
                          className="p-2 bg-blue-500 text-white hover:bg-blue-600 rounded-lg transition-all flex items-center gap-2 whitespace-nowrap disabled:opacity-50"
                          title="Enrolar"
                        >
                          <Plus size={16} />
                          <span className="text-sm font-semibold">Enrolar</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
