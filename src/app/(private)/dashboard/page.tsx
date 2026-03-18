import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-server'
import { BookOpen, GraduationCap, ArrowRight } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()

  // 1. Verificar sesión
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    redirect('/login')
  }

  // 2. Obtener Perfil para el nombre real
  const { data: perfil } = await supabase
    .from('perfiles')
    .select('nombre_completo')
    .eq('id', session.user.id)
    .single()

  // 3. Fallback inteligente (por si el trigger demoró o no hay perfil aún)
  const nombreMostrar = perfil?.nombre_completo || session.user.user_metadata?.full_name || 'Estudiante';

  // 4. Obtener matrículas con join a cursos
  const { data: matriculas } = await supabase
    .from('matriculas')
    .select(`
      id,
      progreso_porcentaje,
      curso:cursos (
        id,
        titulo,
        slug,
        imagen_url
      )
    `)
    .eq('perfil_id', session.user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Mini Hero Oscuro para contraste del Navbar */}
      <div className="bg-[#0a0f1d] pt-32 pb-24 px-4 sm:px-6 lg:px-8 border-b border-white/10 relative">
        <div className="absolute inset-0 opacity-20 bg-gradient-to-b from-transparent to-black/50 pointer-events-none"></div>
        <div className="max-w-5xl mx-auto relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
              Hola, {nombreMostrar}
            </h1>
            <p className="mt-2 text-sm text-slate-300 font-medium">
              Bienvenido a tu panel de aprendizaje.
            </p>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="bg-[#2DB3A7]/10 text-[#2DB3A7] border border-[#2DB3A7]/20 px-4 py-2 rounded-full font-bold flex items-center gap-2 backdrop-blur-sm">
              <GraduationCap size={18} />
              {matriculas?.length || 0} Cursos Activos
            </div>
          </div>
        </div>
      </div>

      {/* Contenido Principal Superpuesto */}
      <div className="flex-1 px-4 sm:px-6 lg:px-8 -mt-12 relative z-20 pb-20">
        <div className="max-w-5xl mx-auto">
          {(!matriculas || matriculas.length === 0) ? (
            /* Empty State */
            <div className="w-full text-center py-20 px-6 bg-white border border-slate-100 rounded-[3rem] shadow-2xl shadow-slate-200/50">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <BookOpen size={40} className="text-slate-300" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 mb-4">Aún no tienes cursos activos</h2>
              <p className="text-slate-500 mb-8 font-medium">
                Explora nuestro catálogo y comienza a potenciar tus habilidades hoy mismo.
              </p>
              <Link
                href="/cursos"
                className="inline-flex items-center gap-2 bg-[#2DB3A7] hover:bg-[#26a095] text-white px-8 py-4 rounded-xl font-black transition-all shadow-lg shadow-[#2DB3A7]/20"
              >
                Explorar Catálogo <ArrowRight size={20} />
              </Link>
            </div>
          ) : (
            /* Grid de Cursos */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {matriculas.map((matricula: any) => (
                <div 
                  key={matricula.id}
                  className="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:shadow-slate-200/60 transition-all group"
                >
                  {/* Imagen del Curso */}
                  <div className="aspect-video relative overflow-hidden bg-slate-100">
                    {matricula.curso.imagen_url ? (
                      <img 
                        src={matricula.curso.imagen_url} 
                        alt={matricula.curso.titulo}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <BookOpen size={48} />
                      </div>
                    )}
                    <div className="absolute top-4 left-4">
                      <span className="bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-slate-600 shadow-sm">
                        Curso
                      </span>
                    </div>
                  </div>

                  {/* Contenido */}
                  <div className="p-8 space-y-6">
                    <div>
                      <h3 className="text-xl font-black text-slate-900 leading-tight mb-2 line-clamp-2">
                        {matricula.curso.titulo}
                      </h3>
                    </div>

                    {/* Barra de Progreso */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                        <span className="text-slate-400">Progreso</span>
                        <span className="text-[#2DB3A7]">{matricula.progreso_porcentaje}%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#2DB3A7] transition-all duration-1000"
                          style={{ width: `${matricula.progreso_porcentaje}%` }}
                        ></div>
                      </div>
                    </div>

                    <Link
                      href={`/dashboard/cursos/${matricula.curso.slug}`}
                      className="flex items-center justify-center gap-2 w-full bg-slate-900 hover:bg-black text-white py-4 rounded-xl font-black transition-all group-hover:bg-[#2DB3A7] shadow-lg shadow-slate-900/10 group-hover:shadow-[#2DB3A7]/20"
                    >
                      Continuar Aprendiendo <ArrowRight size={18} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
