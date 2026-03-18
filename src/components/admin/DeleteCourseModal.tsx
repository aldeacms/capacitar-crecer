'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, X, Layers, BookOpen, Users } from 'lucide-react'
import { toast } from 'sonner'
import { getDeleteSummary, deleteCourse, type DeleteSummary } from '@/actions/cursos'

type Stage = 'loading' | 'info' | 'confirm' | 'deleting'

interface DeleteCourseModalProps {
  cursoId: string
  onClose: () => void
}

export default function DeleteCourseModal({ cursoId, onClose }: DeleteCourseModalProps) {
  const router = useRouter()
  const [stage, setStage] = useState<Stage>('loading')
  const [summary, setSummary] = useState<DeleteSummary | null>(null)
  const [summaryError, setSummaryError] = useState<string | null>(null)
  const [confirmInput, setConfirmInput] = useState('')
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // Cargar resumen al montar
  useEffect(() => {
    const loadSummary = async () => {
      const result = await getDeleteSummary(cursoId)
      if ('error' in result) {
        setSummaryError(result.error)
        setStage('info') // Mostrar estado de error
      } else {
        setSummary(result.data)
        setStage('info')
      }
    }
    loadSummary()
  }, [cursoId])

  // Cerrar con Escape (solo si no estamos eliminando)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && stage !== 'deleting') {
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [stage, onClose])

  const handleDelete = async () => {
    if (confirmInput !== summary!.titulo) return
    setStage('deleting')
    setDeleteError(null)

    const result = await deleteCourse(cursoId)

    if ('error' in result) {
      setStage('confirm')
      setDeleteError(result.error)
      toast.error('Error al eliminar: ' + result.error)
      return
    }

    // Éxito
    if (result.storageWarnings && result.storageWarnings.length > 0) {
      toast.warning('Curso eliminado. Algunos archivos del Storage no se pudieron borrar.')
    } else {
      toast.success('Curso eliminado correctamente')
    }

    onClose()
    router.push('/admin/cursos')
  }

  const StatCard = ({ icon: Icon, value, label, color = 'gray' }: any) => (
    <div className={`text-center p-3 rounded-lg ${
      color === 'red'
        ? 'bg-red-50 border border-red-100'
        : 'bg-gray-50 border border-gray-100'
    }`}>
      <div className={`flex justify-center mb-2 ${color === 'red' ? 'text-red-500' : 'text-gray-400'}`}>
        <Icon size={20} />
      </div>
      <p className={`text-lg font-bold ${color === 'red' ? 'text-red-700' : 'text-gray-900'}`}>
        {value}
      </p>
      <p className={`text-xs font-medium ${color === 'red' ? 'text-red-600' : 'text-gray-500'}`}>
        {label}
      </p>
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        {/* HEADER */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Trash2 size={20} className="text-red-500" />
            Eliminar curso
          </h2>
          <button
            onClick={onClose}
            disabled={stage === 'deleting'}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* BODY */}
        <div className="p-6">
          {/* Loading Stage */}
          {stage === 'loading' && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin h-8 w-8 border-3 border-gray-300 border-t-[#28B4AD] rounded-full mb-3" />
              <p className="text-sm text-gray-500">Cargando información del curso...</p>
            </div>
          )}

          {/* Info Stage */}
          {stage === 'info' && (
            <div className="space-y-4">
              {summaryError ? (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-100 font-bold">
                  ⚠️ {summaryError}
                </div>
              ) : summary && (
                <>
                  {/* Titulo del curso */}
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Estás a punto de eliminar:</p>
                    <p className="text-lg font-bold text-gray-900 mt-1">{summary.titulo}</p>
                  </div>

                  {/* Contadores */}
                  <div className="grid grid-cols-3 gap-3">
                    <StatCard icon={Layers} value={summary.totalModulos} label="Módulos" />
                    <StatCard icon={BookOpen} value={summary.totalLecciones} label="Lecciones" />
                    <StatCard
                      icon={Users}
                      value={summary.totalAlumnos}
                      label="Alumnos"
                      color={summary.totalAlumnos > 0 ? 'red' : 'gray'}
                    />
                  </div>

                  {/* Warning de alumnos */}
                  {summary.totalAlumnos > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
                      <div>
                        <p className="text-red-800 font-bold text-sm">
                          ⚠️ Advertencia: {summary.totalAlumnos} alumno(s) inscrito(s)
                        </p>
                        <p className="text-red-600 text-xs mt-1">
                          Se eliminarán todas sus matriculas y progreso. Esta acción NO se puede deshacer.
                        </p>
                      </div>

                      {summary.alumnos && summary.alumnos.length > 0 && (
                        <div className="bg-white rounded-lg p-3 border border-red-100">
                          <p className="text-xs font-bold text-red-700 mb-2">Alumnos inscritos:</p>
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {summary.alumnos.map(alumno => (
                              <div key={alumno.id} className="text-xs text-red-600 border-l-2 border-red-300 pl-2">
                                <p className="font-semibold">{alumno.nombre}</p>
                                <p className="text-red-500">{alumno.email}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Mensaje final */}
                  <p className="text-sm text-gray-600 p-3 bg-yellow-50 border border-yellow-100 rounded-lg">
                    <span className="font-bold text-yellow-800">⚠️ Importante:</span> Esta acción es irreversible. Se eliminarán permanentemente todos los módulos, lecciones y datos asociados.
                  </p>
                </>
              )}
            </div>
          )}

          {/* Confirm Stage */}
          {stage === 'confirm' && summary && (
            <div className="space-y-4">
              {deleteError && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-100 font-bold">
                  ⚠️ {deleteError}
                </div>
              )}

              <div>
                <p className="text-sm text-gray-600 mb-3 font-medium">
                  Para confirmar la eliminación, escribe exactamente el nombre del curso:
                </p>
                <p className="font-mono text-sm bg-gray-100 px-3 py-2.5 rounded-lg text-gray-800 mb-3 border border-gray-200 select-all">
                  {summary.titulo}
                </p>
                <input
                  type="text"
                  value={confirmInput}
                  onChange={(e) => setConfirmInput(e.target.value)}
                  placeholder="Escribe el nombre exacto..."
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-4 focus:ring-red-500/10 focus:border-red-400 outline-none transition-all text-sm disabled:bg-gray-50 disabled:text-gray-400 placeholder:text-gray-400 text-gray-900"
                />
              </div>

              {summary.totalAlumnos > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                  <p className="text-red-700 text-xs font-bold">
                    Confirmas que deseas eliminar {summary.totalAlumnos} alumno(s) inscrito(s) y todo su progreso.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-100">
          {/* Info Stage Buttons */}
          {stage === 'info' && (
            <>
              <button
                onClick={onClose}
                className="px-5 py-2 rounded-xl text-gray-600 hover:bg-gray-100 font-bold transition-all text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  setConfirmInput('')
                  setStage('confirm')
                }}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all text-sm"
              >
                Continuar →
              </button>
            </>
          )}

          {/* Confirm Stage Buttons */}
          {stage === 'confirm' && (
            <>
              <button
                onClick={() => setStage('info')}
                className="px-5 py-2 rounded-xl text-gray-600 hover:bg-gray-100 font-bold transition-all text-sm disabled:opacity-50"
              >
                Volver
              </button>
              <button
                onClick={handleDelete}
                disabled={confirmInput !== summary!.titulo}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white rounded-xl font-bold transition-all flex items-center gap-2 text-sm"
              >
                Eliminar permanentemente
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
