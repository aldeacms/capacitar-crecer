import Link from 'next/link'
import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import LeccionSidebar from '@/components/aula/LeccionSidebar'
import VideoPlayer from '@/components/aula/VideoPlayer'
import TextViewer from '@/components/aula/TextViewer'
import ArchivosAdjuntos from '@/components/aula/ArchivosAdjuntos'
import QuizRunner from '@/components/aula/QuizRunner'
import MarcarCompletadoButton from '@/components/aula/MarcarCompletadoButton'

export default async function CursoAulaPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ leccion?: string }>
}) {
  const { slug } = await params
  const { leccion: leccionParam } = await searchParams

  // Verificar autenticación
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Obtener perfil del usuario
  const { data: perfil } = await supabase
    .from('perfiles')
    .select('id')
    .eq('id', user.id)
    .single()

  if (!perfil) {
    redirect('/login')
  }

  // Obtener curso con módulos y lecciones
  const { data: curso, error: cursoError } = await supabase
    .from('cursos')
    .select(
      `
      id, titulo, slug, tipo_acceso, tiene_certificado, precio_certificado,
      modulos (
        id, titulo, orden,
        lecciones (
          id, titulo, tipo, video_url, contenido_html, orden,
          lecciones_archivos ( id, nombre_archivo, archivo_url ),
          quizzes_preguntas (
            id, texto, tipo, orden,
            quizzes_opciones ( id, texto, es_correcta )
          )
        )
      )
    `
    )
    .eq('slug', slug)
    .maybeSingle()

  console.log('=== AULA VIRTUAL DEBUG ===')
  console.log('slug:', slug)
  console.log('perfil.id:', perfil.id)
  console.log('cursoError:', cursoError)
  console.log('curso encontrado:', curso?.id, curso?.titulo)

  if (cursoError) {
    console.error('❌ Error al obtener curso:', cursoError)
    redirect('/cursos')
  }

  if (!curso) {
    console.error('❌ Curso no encontrado con slug:', slug)
    redirect('/cursos')
  }

  // Verificar que el usuario tenga matrícula en este curso
  const { data: matricula, error: matriculaError } = await supabase
    .from('matriculas')
    .select('id, progreso_porcentaje')
    .eq('perfil_id', perfil.id)
    .eq('curso_id', curso.id)
    .maybeSingle()

  console.log('matriculaError:', matriculaError)
  console.log('matricula encontrada:', matricula?.id)
  console.log('========================')

  if (!matricula) {
    console.error('❌ Usuario no tiene matrícula en este curso')
    redirect(`/cursos/${slug}`)
  }

  // Obtener lecciones completadas
  const { data: completadas } = await supabase
    .from('lecciones_completadas')
    .select('leccion_id')
    .eq('perfil_id', perfil.id)

  const leccionesCompletadasIds = (completadas ?? []).map(c => c.leccion_id)

  // Obtener la lección activa
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let leccionActiva: any = null

  if (leccionParam) {
    // Buscar por ID si viene en params
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const modulo of (curso.modulos || []) as any[]) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const leccion = (modulo.lecciones || []).find((l: any) => l.id === leccionParam)
      if (leccion) {
        leccionActiva = leccion
        break
      }
    }
  }

  // Si no se especifica lección o no existe, usar la primera
  if (!leccionActiva && curso.modulos && curso.modulos.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const modulosProcesados = [...(curso.modulos || [] as any[])].sort((a: any, b: any) => a.orden - b.orden)
    const primerModulo = modulosProcesados[0]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const leccionesModulo = [...(primerModulo.lecciones || [] as any[])].sort((a: any, b: any) => a.orden - b.orden)
    leccionActiva = leccionesModulo[0]
  }

  // Procesar módulos para el sidebar
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const modulosProcesados = ((curso.modulos || []) as any[]).map((m: any) => ({
    ...m,
    lecciones: (m.lecciones || []).sort((a: any, b: any) => a.orden - b.orden),
  }))

  return (
    <>
      {/* Mini-Hero */}
      <div className="bg-slate-900 border-b border-[#28B4AD]/20 py-10 lg:py-16 px-4 lg:px-8 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-4xl lg:text-5xl xl:text-6xl font-black text-white leading-tight">{curso.titulo}</h1>
            <p className="text-base text-slate-400 mt-3">Progreso: <span className="font-bold text-[#28B4AD]">{matricula.progreso_porcentaje}%</span></p>
          </div>
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-[#28B4AD] hover:text-[#26a095] font-medium transition-colors"
          >
            <ArrowLeft size={18} />
            <span className="hidden sm:inline">Volver</span>
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pb-20 px-4 lg:px-8 pt-12">

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Sidebar */}
        <LeccionSidebar
          modulos={modulosProcesados}
          leccionesCompletadas={leccionesCompletadasIds}
          leccionActivaId={leccionActiva?.id || ''}
          progresoPorcentaje={matricula.progreso_porcentaje || 0}
        />

        {/* Contenido principal */}
        <main className="lg:col-span-3">
          {leccionActiva && (
            <div className="space-y-6">
              {/* Encabezado de la lección */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h1 className="text-3xl font-bold text-gray-900">{leccionActiva.titulo}</h1>
                <p className="text-sm text-gray-500 mt-2">
                  Tipo:{' '}
                  <span className="font-semibold text-gray-700">
                    {leccionActiva.tipo === 'video'
                      ? 'Video'
                      : leccionActiva.tipo === 'texto'
                        ? 'Contenido de texto'
                        : 'Quiz'}
                  </span>
                </p>
              </div>

              {/* Contenido por tipo de lección */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                {leccionActiva.tipo === 'video' && (
                  <VideoPlayer videoUrl={leccionActiva.video_url} />
                )}

                {leccionActiva.tipo === 'texto' && (
                  <TextViewer contenido={leccionActiva.contenido_html} />
                )}

                {leccionActiva.tipo === 'quiz' && (
                  <QuizRunner preguntas={leccionActiva.quizzes_preguntas || []} />
                )}

                {/* Archivos adjuntos */}
                {leccionActiva.lecciones_archivos &&
                  leccionActiva.lecciones_archivos.length > 0 && (
                    <ArchivosAdjuntos archivos={leccionActiva.lecciones_archivos} />
                  )}
              </div>

              {/* Botón marcar completada */}
              {leccionActiva.tipo !== 'quiz' && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <MarcarCompletadoButton
                    leccionId={leccionActiva.id}
                    yaCompletada={leccionesCompletadasIds.includes(leccionActiva.id)}
                  />
                </div>
              )}

              {/* Banner de Curso Completado */}
              {matricula.progreso_porcentaje === 100 && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl shadow-md border border-green-200 p-8">
                  <div className="text-center space-y-6">
                    <div>
                      <h2 className="text-3xl font-black text-green-900 mb-2">🎉 ¡Felicitaciones!</h2>
                      <p className="text-green-700 font-semibold">Has completado exitosamente este curso.</p>
                    </div>

                    {curso.tiene_certificado ? (
                      <div className="space-y-4">
                        {curso.tipo_acceso === 'gratis' || (curso.tipo_acceso === 'pago' && (curso.precio_certificado ?? 0) === 0) ? (
                          <>
                            <p className="text-green-700">Tu certificado está listo para descargar.</p>
                            <button className="inline-flex items-center gap-2 px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-all">
                              <span>📄</span> Descargar Certificado
                            </button>
                          </>
                        ) : curso.tipo_acceso === 'gratis_cert_pago' ? (
                          <>
                            <p className="text-green-700">Obtén tu certificado pagando ${(curso.precio_certificado || 0).toLocaleString('es-CL')}.</p>
                            <button className="inline-flex items-center gap-2 px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-all">
                              <span>🎓</span> Obtener Certificado por ${(curso.precio_certificado || 0).toLocaleString('es-CL')}
                            </button>
                          </>
                        ) : null}
                      </div>
                    ) : (
                      <p className="text-green-700">Este programa está enfocado en la adquisición de habilidades y no emite certificado.</p>
                    )}

                    <div className="border-t border-green-200 pt-6">
                      <p className="text-sm text-green-600">
                        ¿Tienes dudas? <a href="#" className="font-bold hover:underline">Contacta con nuestro equipo</a>
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
    </>
  )
}
