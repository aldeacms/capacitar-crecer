'use client'

import { useState, useTransition, useEffect } from 'react'
import { 
  createModule, updateModule, deleteModule,
  createLesson, updateLesson, deleteLesson,
  updateCurriculumOrder, deleteLessonFile
} from '@/actions/curriculum'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { 
  Pencil, Trash2, X, GripVertical, FileText, 
  ChevronDown, Paperclip, Trash, ExternalLink 
} from 'lucide-react'

// Dnd Kit Imports
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'

const RichTextEditor = dynamic(() => import('@/components/ui/RichTextEditor'), { 
  ssr: false,
  loading: () => <div className="h-40 bg-gray-50 animate-pulse rounded-xl border border-gray-100 flex items-center justify-center text-xs text-gray-400">Cargando editor...</div>
})

// --- SORTABLE WRAPPERS ---

function SortableItem({ id, children, className }: { id: string, children: React.ReactNode, className?: string }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.6 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className={className}>
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-2 text-gray-500 hover:text-[#28B4AD] transition-colors">
        <GripVertical size={20} />
      </div>
      <div className="flex-1">{children}</div>
    </div>
  )
}

// --- MAIN COMPONENT ---

export default function CurriculumBuilder({ cursoId, modulosInitial }: { cursoId: string, modulosInitial: any[] }) {
  const [isPending, startTransition] = useTransition()
  const [hasMounted, setHasMounted] = useState(false)
  
  // Modales
  const [showModuleModal, setShowModuleModal] = useState<{ id?: string, titulo?: string } | null>(null)
  const [lessonModal, setLessonModal] = useState<{ moduloId: string, leccion?: any } | null>(null)
  
  const [error, setError] = useState<string | null>(null)
  const [lessonContent, setLessonContent] = useState('')

  // Hidratación segura para DND
  useEffect(() => {
    setHasMounted(true)
  }, [])

  // Sensores DND
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  // Cerrar modales con Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            setShowModuleModal(null)
            setLessonModal(null)
        }
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [])

  // --- Handlers Módulos ---
  const handleModuleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    const titulo = formData.get('titulo') as string

    startTransition(async () => {
      let result
      if (showModuleModal?.id) {
        result = await updateModule(showModuleModal.id, titulo, cursoId)
      } else {
        result = await createModule({ curso_id: cursoId, titulo, orden: 0 })
      }
      
      if (result?.error) setError(result.error)
      else setShowModuleModal(null)
    })
  }

  const handleDeleteMod = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este módulo? Se borrarán todas sus lecciones.')) return
    startTransition(async () => {
      const result = await deleteModule(id, cursoId)
      if (result?.error) setError(result.error)
    })
  }

  // --- Handlers Lecciones ---
  const openEditLesson = (moduloId: string, leccion: any) => {
    setLessonContent(leccion.contenido_html || '')
    setLessonModal({ moduloId, leccion })
  }

  const handleLessonSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    
    const formData = new FormData(e.currentTarget)
    formData.append('curso_id', cursoId)
    formData.append('contenido_html', lessonContent)

    startTransition(async () => {
      let result
      if (lessonModal?.leccion?.id) {
        formData.append('id', lessonModal.leccion.id)
        result = await updateLesson(formData)
      } else {
        formData.append('modulo_id', lessonModal!.moduloId)
        result = await createLesson(formData)
      }

      if (result?.error) setError(result.error)
      else {
        setLessonModal(null)
        setLessonContent('')
      }
    })
  }

  const handleDeleteLess = async (id: string) => {
    if (!confirm('¿Eliminar esta lección?')) return
    startTransition(async () => {
      const result = await deleteLesson(id, cursoId)
      if (result?.error) setError(result.error)
    })
  }

  const handleDeleteFile = async (fileId: string, filePath: string) => {
    if (!confirm('¿Eliminar este archivo permanentemente?')) return
    startTransition(async () => {
      const result = await deleteLessonFile(fileId, filePath, cursoId)
      if (result?.error) setError(result.error)
    })
  }

  // --- Drag & Drop Handlers ---
  const onDragEndModules = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = modulosInitial.findIndex(m => m.id === active.id)
      const newIndex = modulosInitial.findIndex(m => m.id === over.id)
      
      const newOrder = arrayMove(modulosInitial, oldIndex, newIndex).map((mod, idx) => ({
        id: mod.id,
        orden: idx + 1
      }))

      startTransition(async () => {
        const result = await updateCurriculumOrder('module', newOrder, cursoId)
        if (result.error) setError(result.error)
      })
    }
  }

  const onDragEndLessons = (moduloId: string, event: DragEndEvent) => {
    const { active, over } = event
    const modulo = modulosInitial.find(m => m.id === moduloId)
    if (!modulo || !over || active.id === over.id) return

    const oldIndex = modulo.lecciones.findIndex((l:any) => l.id === active.id)
    const newIndex = modulo.lecciones.findIndex((l:any) => l.id === over.id)
    
    const newOrder = arrayMove(modulo.lecciones, oldIndex, newIndex).map((less:any, idx:number) => ({
      id: less.id,
      orden: idx + 1
    }))

    startTransition(async () => {
      const result = await updateCurriculumOrder('lesson', newOrder, cursoId)
      if (result.error) setError(result.error)
    })
  }

  return (
    <div className="relative">
      {isPending && (
        <div className="fixed top-8 right-8 flex items-center gap-3 bg-white/80 backdrop-blur-md px-5 py-3 rounded-2xl shadow-2xl border border-emerald-100 text-[#28B4AD] text-[10px] font-black uppercase tracking-widest">
          <div className="h-2 w-2 rounded-full bg-[#28B4AD] animate-pulse"></div>
          Actualizando Datos...
        </div>
      )}

      <div className="flex justify-between items-center mb-10">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Plan de Estudios</h2>
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">Arrastra para ordenar tu curso</p>
        </div>
        <button
          onClick={() => setShowModuleModal({})}
          className="bg-[#28B4AD] hover:bg-[#219892] text-white px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-emerald-100"
        >
          + Crear Módulo
        </button>
      </div>

      {error && (
        <div className="mb-6 p-5 bg-red-50 text-red-700 rounded-2xl text-[11px] border border-red-100 font-bold flex justify-between items-center animate-in shake duration-300">
          <div className="flex items-center gap-3">
            <X size={16} />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="hover:bg-red-100 p-1.5 rounded-lg transition-all"><X size={16} /></button>
        </div>
      )}

      {/* Módulos Sortable */}
      {!hasMounted ? (
        <div className="space-y-8 pb-32">
            {modulosInitial.map((modulo, mIndex) => (
                <div key={modulo.id} className="border-2 border-slate-100 rounded-[2rem] bg-white h-24 animate-pulse flex items-center px-8 text-slate-300 text-xs font-bold uppercase tracking-widest">
                    Cargando Módulo {mIndex + 1}...
                </div>
            ))}
        </div>
      ) : (
        <DndContext 
          sensors={sensors} 
          collisionDetection={closestCenter} 
          onDragEnd={onDragEndModules}
          modifiers={[restrictToVerticalAxis]}
        >
          <SortableContext items={modulosInitial.map(m => m.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-8 pb-32">
              {modulosInitial.length > 0 ? (
                modulosInitial.map((modulo, mIndex) => (
                  <SortableItem key={modulo.id} id={modulo.id} className="flex gap-2">
                    <div className={`flex-1 border-2 border-slate-100 rounded-[2rem] overflow-hidden shadow-sm bg-white transition-all hover:border-slate-200 ${isPending ? 'opacity-70 grayscale' : ''}`}>
                      {/* Header del Módulo */}
                      <div className="bg-slate-50/80 px-8 py-6 flex justify-between items-center border-b border-slate-100">
                        <div className="flex items-center gap-5">
                          <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 text-slate-700 flex items-center justify-center font-black text-xs shadow-sm">
                            {String(mIndex + 1).padStart(2, '0')}
                          </div>
                          <div>
                            <h3 className="font-black text-gray-900 text-lg tracking-tight leading-none">{modulo.titulo}</h3>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2">{modulo.lecciones?.length || 0} Lecciones</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => setShowModuleModal({ id: modulo.id, titulo: modulo.titulo })}
                            className="p-3 hover:bg-white rounded-xl text-slate-700 hover:text-[#28B4AD] transition-all border border-transparent hover:border-slate-100"
                            title="Editar Módulo"
                          >
                            <Pencil size={20} />
                          </button>
                          <button 
                            onClick={() => handleDeleteMod(modulo.id)}
                            className="p-3 hover:bg-white rounded-xl text-slate-700 hover:text-red-500 transition-all border border-transparent hover:border-slate-100"
                            title="Eliminar Módulo"
                          >
                            <Trash2 size={20} />
                          </button>
                          <div className="w-px h-8 bg-slate-200 mx-3" />
                          <button
                            onClick={() => {
                                setLessonContent('')
                                setLessonModal({ moduloId: modulo.id })
                            }}
                            className="text-[10px] font-black text-[#28B4AD] uppercase tracking-widest bg-emerald-50 px-6 py-3 rounded-2xl border-2 border-emerald-100 hover:bg-emerald-100 transition-all"
                          >
                            + Lección
                          </button>
                        </div>
                      </div>

                      {/* Lecciones Sortable dentro del módulo */}
                      <div className="p-6 space-y-4">
                        <DndContext 
                          sensors={sensors} 
                          collisionDetection={closestCenter} 
                          onDragEnd={(e) => onDragEndLessons(modulo.id, e)}
                          modifiers={[restrictToVerticalAxis]}
                        >
                          <SortableContext items={modulo.lecciones?.map((l:any) => l.id) || []} strategy={verticalListSortingStrategy}>
                              {modulo.lecciones && modulo.lecciones.length > 0 ? (
                              modulo.lecciones.map((leccion: any, lIndex: number) => (
                                  <SortableItem key={leccion.id} id={leccion.id} className="flex gap-2">
                                  <div className="flex-1 bg-slate-50/40 p-5 rounded-2xl border border-slate-100 flex justify-between items-center group transition-all hover:border-[#28B4AD]/40 hover:bg-white hover:shadow-lg hover:shadow-slate-100/50">
                                      <div className="flex items-center gap-5">
                                      <span className="text-slate-400 text-xs font-black font-mono">{String(lIndex + 1).padStart(2, '0')}</span>
                                      <div>
                                          <div className="text-sm font-black text-slate-900">{leccion.titulo}</div>
                                          <div className="flex gap-2 items-center mt-2">
                                          <span className="text-[9px] uppercase text-slate-700 font-black tracking-widest border border-slate-200 px-2.5 py-1 rounded-lg bg-white">
                                              {leccion.tipo}
                                          </span>
                                          {leccion.video_url && <span className="text-[9px] uppercase text-[#28B4AD] font-black tracking-widest bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">Video</span>}
                                          {leccion.lecciones_archivos?.length > 0 && (
                                              <span className="text-[9px] uppercase text-blue-700 font-black tracking-widest bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100 flex items-center gap-1.5 shadow-sm">
                                                  <Paperclip size={10} />
                                                  {leccion.lecciones_archivos.length} Archivos
                                              </span>
                                          )}
                                          </div>
                                      </div>
                                      </div>
                                      <div className="flex items-center gap-3">
                                      {leccion.tipo === 'quiz' && (
                                          <Link 
                                          href={`/admin/cursos/${cursoId}/lecciones/${leccion.id}/quiz`}
                                          className="text-[10px] font-black text-amber-700 hover:text-amber-800 bg-amber-50 px-5 py-2.5 rounded-xl border-2 border-amber-100 transition-all uppercase tracking-widest shadow-sm shadow-amber-50"
                                          >
                                          Quiz
                                          </Link>
                                      )}
                                      
                                      <button 
                                          onClick={() => openEditLesson(modulo.id, leccion)}
                                          className="p-2.5 text-slate-700 hover:text-[#28B4AD] hover:bg-emerald-50 rounded-xl transition-all"
                                      >
                                          <Pencil size={18} />
                                      </button>
                                      <button 
                                          onClick={() => handleDeleteLess(leccion.id)}
                                          className="p-2.5 text-slate-700 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                      >
                                          <Trash2 size={18} />
                                      </button>
                                      </div>
                                  </div>
                                  </SortableItem>
                              ))
                              ) : (
                              <div className="text-center py-10 text-[10px] text-slate-700 font-black uppercase tracking-widest italic bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-3xl">
                                  Sin contenido asignado.
                              </div>
                              )}
                          </SortableContext>
                        </DndContext>
                      </div>
                    </div>
                  </SortableItem>
                ))
              ) : (
                <div className="text-center py-32 bg-slate-50 border-[3px] border-dashed border-slate-200 rounded-[4rem] text-slate-400 flex flex-col items-center">
                  <ChevronDown size={48} className="mb-4 opacity-20" />
                  <p className="text-lg font-black mb-6 uppercase tracking-widest text-slate-700">Comienza tu currículum</p>
                  <button
                    onClick={() => setShowModuleModal({})}
                    className="text-[#28B4AD] font-black hover:bg-[#28B4AD] hover:text-white px-10 py-5 bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border-2 border-slate-100 transition-all uppercase text-xs tracking-[0.2em]"
                  >
                    Crear primer módulo &rarr;
                  </button>
                </div>
              )}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* --- MODAL MÓDULO --- */}
      {showModuleModal && (
        <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300"
            onClick={() => setShowModuleModal(null)}
        >
          <div 
            className="bg-white rounded-[3rem] p-12 max-w-md w-full shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15)] border-2 border-slate-100 animate-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-3xl font-black text-gray-900 mb-8 tracking-tighter">{showModuleModal.id ? 'Editar' : 'Nuevo'} Módulo</h3>
            <form onSubmit={handleModuleSubmit} className="space-y-8">
              <div>
                <label className="text-[11px] font-black text-gray-700 uppercase tracking-widest block mb-4">Título del Módulo</label>
                <input 
                  required 
                  name="titulo" 
                  defaultValue={showModuleModal.titulo}
                  autoFocus
                  placeholder="Ej: Análisis de Inversiones" 
                  className="form-input font-bold" 
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowModuleModal(null)} className="flex-1 py-5 text-gray-700 font-black uppercase tracking-widest text-xs hover:bg-slate-50 rounded-2xl transition-all">Cancelar</button>
                <button disabled={isPending} className="flex-1 py-5 bg-[#28B4AD] text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl shadow-emerald-200 disabled:opacity-50 transition-all">
                  {isPending ? 'Procesando...' : 'Confirmar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL LECCIÓN --- */}
      {lessonModal && (
        <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto animate-in fade-in duration-300"
            onClick={() => setLessonModal(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-100 my-auto animate-in slide-in-from-bottom-6 duration-300 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header - Simplified */}
            <div className="px-8 md:px-10 py-6 border-b border-slate-100">
              <h3 className="text-2xl font-black text-gray-900">
                {lessonModal.leccion ? 'Editar' : 'Nueva'} Lección
              </h3>
            </div>

            {/* Modal Body - Compact */}
            <form onSubmit={handleLessonSubmit} className="p-8 md:p-10 space-y-6">
              {/* Title */}
              <div>
                <label className="text-xs font-black text-gray-600 uppercase tracking-widest block mb-2">Título</label>
                <input
                    required
                    name="titulo"
                    defaultValue={lessonModal.leccion?.titulo}
                    autoFocus
                    placeholder="Ej: Cálculo de Rentabilidad"
                    className="form-input font-semibold"
                />
              </div>

              {/* Format Type */}
              <div>
                <label className="text-xs font-black text-gray-600 uppercase tracking-widest block mb-2">Tipo</label>
                <select
                    name="tipo"
                    defaultValue={lessonModal.leccion?.tipo || 'video'}
                    className="form-select font-semibold"
                >
                  <option value="video">🎬 Video</option>
                  <option value="texto">📖 Lectura</option>
                  <option value="quiz">✅ Quiz</option>
                </select>
              </div>

              {/* Video URL */}
              <div>
                <label className="text-xs font-black text-gray-600 uppercase tracking-widest block mb-2">Video o Embed</label>
                <input
                    name="video_url"
                    defaultValue={lessonModal.leccion?.video_url}
                    placeholder="URL o código embed"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none text-gray-900 font-semibold focus:border-[#28B4AD] focus:ring-1 focus:ring-[#28B4AD] transition-all text-sm"
                />
                <div className="mt-2 text-xs text-slate-600 space-y-1">
                  <div>✓ <strong>URLs:</strong> YouTube • Vimeo • Loom • Tella.tv</div>
                  <div>✓ <strong>Embed:</strong> Pega directamente el código &lt;iframe&gt;</div>
                </div>
              </div>

              {/* Content Editor */}
              <div className="border-t pt-6">
                <label className="text-xs font-black text-gray-600 uppercase tracking-widest block mb-3">
                  Contenido
                </label>
                <RichTextEditor
                  content={lessonContent}
                  onChange={setLessonContent}
                />
              </div>

              {/* File Management */}
              <div className="border-t pt-6">
                <label className="text-xs font-black text-gray-600 uppercase tracking-widest block mb-4">
                  Archivos Adjuntos
                </label>

                {/* Archivos existentes */}
                {lessonModal.leccion?.lecciones_archivos?.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {lessonModal.leccion.lecciones_archivos.map((file: any) => (
                      <div key={file.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-all">
                        <div className="flex items-center gap-3 truncate min-w-0">
                          <FileText size={16} className="text-slate-400 flex-shrink-0" />
                          <span className="text-sm text-slate-700 truncate">{file.nombre_archivo}</span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                          <a
                            href={file.archivo_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-slate-600 hover:text-[#28B4AD] rounded transition-colors"
                            title="Abrir"
                          >
                            <ExternalLink size={16} />
                          </a>
                          <button
                            type="button"
                            onClick={() => handleDeleteFile(file.id, file.archivo_url)}
                            className="p-1.5 text-slate-600 hover:text-red-500 rounded transition-colors"
                            title="Eliminar"
                          >
                            <Trash size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Agregar archivos */}
                <div className="p-4 border border-dashed border-slate-300 rounded-lg bg-slate-50 hover:border-slate-400 hover:bg-slate-100 transition-all">
                  <input
                    type="file"
                    name="archivos"
                    multiple
                    className="w-full text-sm text-slate-600 file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-[#28B4AD] file:text-white hover:file:bg-[#219892] transition-all cursor-pointer"
                  />
                  <p className="mt-2 text-xs text-slate-500">
                    PDF, Word, Excel, imágenes, etc.
                  </p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="border-t pt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setLessonModal(null)}
                  className="px-6 py-2 text-gray-600 font-semibold text-sm hover:bg-slate-100 rounded-lg transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-6 py-2 bg-[#28B4AD] hover:bg-[#219892] text-white rounded-lg font-semibold text-sm disabled:opacity-50 transition-all"
                >
                  {isPending ? 'Guardando...' : (lessonModal.leccion ? 'Guardar' : 'Crear')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
