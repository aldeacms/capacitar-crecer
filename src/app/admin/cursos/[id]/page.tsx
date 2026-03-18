import Link from 'next/link'
import { createClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import CurriculumBuilder from './CurriculumBuilder'

export default async function DetalleCursoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: curso, error } = await supabase
    .from('cursos')
    .select(`
      *,
      modulos (
        *,
        lecciones (
          *,
          lecciones_archivos (*)
        )
      )
    `)
    .eq('id', id)
    .single()

  if (error || !curso) {
    notFound()
  }

  const modulosOrdenados = curso.modulos?.sort((a: any, b: any) => a.orden - b.orden).map((m: any) => ({
    ...m,
    lecciones: m.lecciones?.sort((a: any, b: any) => a.orden - b.orden) || []
  })) || []

  return (
    <div className="max-w-7xl mx-auto pb-20 px-4 lg:px-8">
      {/* HEADER SUPERIOR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm">
            <Link href="/admin/cursos" className="text-[#28B4AD] hover:underline font-medium transition-all">
              Cursos
            </Link>
            <span className="text-gray-300">/</span>
            <span className="text-gray-400 font-medium">Gestión</span>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            {curso.titulo}
          </h1>
        </div>

        <Link
          href={`/admin/cursos/${id}/edit`}
          className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 hover:border-[#28B4AD]/30 transition-all shadow-sm group"
        >
          <svg className="w-4 h-4 text-gray-400 group-hover:text-[#28B4AD]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          Editar Info Básica
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">

        {/* SIDEBAR IZQUIERDO (STICKY) */}
        <aside className="lg:col-span-1 space-y-6 lg:sticky lg:top-24">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="aspect-[16/10] bg-gray-100 overflow-hidden border-b border-gray-50">
              {(curso.imagen_url && curso.imagen_url.trim() !== '') ? (
                <img src={curso.imagen_url} alt={curso.titulo} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>

            <div className="p-5 space-y-4">
              <div>
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.1em] mb-4">Detalles Técnicos</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Modalidad</span>
                    <span className="px-2 py-0.5 bg-gray-50 text-gray-700 rounded font-bold text-[10px] uppercase border border-gray-100">
                      {curso.modalidad?.replace(/-/g, ' ')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Acceso</span>
                    <span className="font-semibold text-gray-800 capitalize italic text-xs">
                      {curso.tipo_acceso?.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-bold">
                    <span className="text-gray-500 font-medium">Precio</span>
                    <span className="text-[#28B4AD]">
                      {(curso.precio_curso ?? 0) > 0 ? `$${curso.precio_curso!.toLocaleString('es-CL')}` : 'Gratis'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-50 flex justify-between items-center">
                <div className="text-center flex-1">
                  <div className="text-xl font-black text-gray-900">{modulosOrdenados.length}</div>
                  <div className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Módulos</div>
                </div>
                <div className="w-px h-8 bg-gray-100"></div>
                <div className="text-center flex-1">
                  <div className="text-xl font-black text-gray-900">
                    {modulosOrdenados.reduce((acc, m) => acc + (m.lecciones?.length || 0), 0)}
                  </div>
                  <div className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Clases</div>
                </div>
              </div>
            </div>
          </div>

          <Link
            href={`/cursos/${curso.slug}`}
            target="_blank"
            className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-[#28B4AD] transition-all shadow-xl shadow-gray-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Ver página pública
          </Link>
        </aside>

        {/* CONTENIDO PRINCIPAL (CURRICULUM) */}
        <main className="lg:col-span-3">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2 md:p-4">
            {/* Aquí quitamos el div con el título duplicado y dejamos que CurriculumBuilder tome el mando */}
            <CurriculumBuilder cursoId={id} modulosInitial={modulosOrdenados} />
          </div>
        </main>

      </div>
    </div>
  )
}