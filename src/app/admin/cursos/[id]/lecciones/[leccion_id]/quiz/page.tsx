import Link from 'next/link'
import { createClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import QuestionList from '@/components/quiz/QuestionList'
import { ClipboardList, ChevronLeft } from 'lucide-react'

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

      {/* LISTA A PANTALLA COMPLETA */}
      <div className="space-y-6">
        <QuestionList initialPreguntas={preguntas || []} leccionId={leccion_id} />
      </div>
    </div>
  )
}