import { createClient } from '@/lib/supabase-server'
import CourseCard from '@/components/public/CourseCard'
import { LayoutGrid, Tag } from 'lucide-react'
import Link from 'next/link'

export default async function CoursesPage() {
  const supabase = await createClient()

  // Traemos cursos y categorías en paralelo
  const [{ data: courses }, { data: categories }] = await Promise.all([
    supabase.from('cursos').select(`
      *,
      categorias(nombre),
      modulos(
        id,
        lecciones(id)
      )
    `).eq('estado', 'publicado').order('created_at', { ascending: false }),
    supabase.from('categorias').select('*').order('nombre')
  ])

  // Contar lecciones para cada curso
  const coursesWithLessonCount = courses?.map((course: any) => {
    const leccionesTotal = (course.modulos || []).reduce((sum: number, modulo: any) => {
      return sum + (modulo.lecciones?.length || 0)
    }, 0)
    return { ...course, lessons_count: leccionesTotal }
  }) || []

  return (
    <div className="bg-slate-50 min-h-screen">
      <section className="pt-32 pb-16 bg-[#0a0f1d] text-white">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-6">
              Explora nuestra <span className="text-[#2DB3A7]">Formación</span>
            </h1>

            {/* Navegación de Categorías */}
            <div className="flex flex-wrap gap-3 mt-10">
              <Link href="/cursos" className="px-5 py-2 rounded-full bg-[#2DB3A7] text-white text-xs font-bold transition-all">
                Todos
              </Link>
              {categories?.map(cat => (
                <Link
                  key={cat.id}
                  href={`/categorias/${cat.slug}`}
                  className="px-5 py-2 rounded-full bg-white/5 border border-white/10 text-slate-300 text-xs font-bold hover:bg-white/10 hover:text-white transition-all"
                >
                  {cat.nombre}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {coursesWithLessonCount?.map((course: any) => (
              <CourseCard key={course.id} {...course} categoria_nombre={course.categorias?.nombre} />
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}