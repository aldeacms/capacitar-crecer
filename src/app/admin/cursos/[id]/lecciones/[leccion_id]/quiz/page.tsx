import Link from 'next/link'
import { createClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import QuestionForm from '@/components/quiz/QuestionForm'
import QuestionList from '@/components/quiz/QuestionList'
import { LayoutGrid, ClipboardList, Edit3, ChevronLeft } from 'lucide-react'

export default async function QuizPage({
  params,
}: {
  params: Promise<{ id: string; leccion_id: string }>
}) {
  const { id, leccion_id } = await params
  const supabase = await createClient()

  // Fetch lección y preguntas
  const { data: leccion } = await supabase
    .from('lecciones')
    .select('*, modulos(curso_id, titulo)')
    .eq('id', leccion_id)
    .single()

  const { data: preguntas } = await supabase
    .from('quizzes_preguntas')
    .select('*, quizzes_opciones(*)')
    .eq('leccion_id', leccion_id)
    .order('orden', { ascending: true })

  if (!leccion) notFound()

  const totalPuntos = preguntas?.reduce((acc, p) => acc + (p.puntos || 0), 0) || 0

  return (
    <div className="max-w-7xl mx-auto pb-32 px-6">

      {/* HEADER REFINADO */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 pt-8">
        <div className="flex items-center gap-5">
          <Link
            href={`/admin/cursos/${id}`}
            className="group flex items-center justify-center w-10 h-10 bg-white border border-gray-200 rounded-xl hover:border-[#28B4AD] hover:text-[#28B4AD] transition-all shadow-sm"
            title="Volver al currículum"
          >
            <ChevronLeft size={20} />
          </Link>
          <div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-1">
              <ClipboardList size={12} className="text-[#28B4AD]" />
              Gestión de Evaluación
            </div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              {leccion.titulo}
            </h1>
          </div>
        </div>

        {/* STATS DEL QUIZ */}
        <div className="flex items-center gap-4 bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="px-5 py-2 text-center border-r border-gray-100">
            <div className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter text-left mb-1">Preguntas</div>
            <div className="text-xl font-black text-gray-900">{preguntas?.length || 0}</div>
          </div>
          <div className="px-5 py-2 text-center">
            <div className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter text-left mb-1">Puntos Totales</div>
            <div className="text-xl font-black text-[#28B4AD]">{totalPuntos} pts</div>
          </div>
        </div>
      </header>

      {/* GRID 50/50 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">

        {/* COLUMNA IZQUIERDA: CREACIÓN */}
        <div className="space-y-6 lg:sticky lg:top-8">
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-tr from-[#28B4AD]/20 to-transparent rounded-[2rem] blur-2xl opacity-50"></div>
            <div className="relative bg-white border border-gray-100 rounded-[2rem] shadow-xl shadow-gray-200/40 overflow-hidden">
              <div className="bg-gray-50/50 px-8 py-4 border-b border-gray-100 flex items-center justify-between text-[10px] font-black text-gray-400 tracking-widest uppercase">
                <div className="flex items-center gap-2">
                  <Edit3 size={14} className="text-[#28B4AD]" />
                  Editor de Preguntas
                </div>
                <span className="text-[9px] bg-white px-2 py-0.5 rounded border border-gray-100">Modo Autor</span>
              </div>
              <div className="p-6 md:p-8">
                <QuestionForm leccionId={leccion_id} />
              </div>
            </div>
          </div>

          <div className="p-6 bg-blue-50/40 border border-blue-100/50 rounded-2xl flex gap-4">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0 text-blue-600">
              <LayoutGrid size={20} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-blue-900 uppercase mb-1">Sugerencia pedagógica</h4>
              <p className="text-[11px] text-blue-700/80 leading-relaxed">
                Utiliza preguntas de alternativas para conceptos clave y pareados para definiciones de procesos. Esto mejora el engagement.
              </p>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: LISTADO */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <ClipboardList size={14} className="opacity-50" /> Estructura de la Evaluación
            </h3>
          </div>

          <div className="space-y-4">
            <QuestionList initialPreguntas={preguntas || []} />
          </div>
        </div>

      </div>
    </div>
  )
}