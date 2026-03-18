import Link from 'next/link'
import { createClient } from '@/lib/supabase-server'
import { Eye } from 'lucide-react'

export default async function CursosPage() {
  const supabase = await createClient()

  const { data: cursos, error } = await supabase
    .from('cursos')
    .select(`
      *,
      categorias ( nombre ),
      modulos (
        id,
        lecciones (id)
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('ERROR FETCHING COURSES:', JSON.stringify(error, null, 2))
  }

  const cursosProcesados = cursos?.map(curso => {
    const totalLecciones = curso.modulos?.reduce((acc: number, mod: any) => {
      return acc + (mod.lecciones?.length || 0)
    }, 0) || 0

    return {
      ...curso,
      isElearning: totalLecciones > 0
    }
  })

  return (
    <div className="w-full min-w-0 max-w-full overflow-hidden">
      <div className="flex justify-between items-center mb-8 px-2">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 leading-tight">Gestión de Cursos</h1>
          <p className="text-gray-500 mt-1">Administra el catálogo de cursos y su contenido.</p>
        </div>
        <Link
          href="/admin/cursos/nuevo"
          className="bg-[#28B4AD] hover:bg-[#219892] text-white px-6 py-2.5 rounded-lg font-semibold transition-all shadow-sm hover:shadow-md flex items-center gap-2 whitespace-nowrap"
        >
          <span>+</span> Crear Nuevo Curso
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden w-full">
        <div className="w-full overflow-x-auto scrollbar-thin scrollbar-thumb-gray-200">
          <table className="w-full text-left border-collapse min-w-[1000px] table-auto">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200 text-slate-400 text-[10px] uppercase tracking-widest">
                <th className="px-6 py-4 font-black whitespace-nowrap">Curso</th>
                <th className="px-6 py-4 font-black text-center whitespace-nowrap">Categoría</th>
                <th className="px-6 py-4 font-black text-center whitespace-nowrap">Horas</th>
                <th className="px-6 py-4 font-black text-center whitespace-nowrap">Modalidad</th>
                <th className="px-6 py-4 font-black text-center whitespace-nowrap">Precio</th>
                <th className="px-6 py-4 font-black text-center whitespace-nowrap">Certificado</th>
                <th className="px-6 py-4 font-black text-center whitespace-nowrap">Estado</th>
                <th className="px-6 py-4 font-black text-right whitespace-nowrap">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {cursosProcesados && cursosProcesados.length > 0 ? (
                cursosProcesados.map((curso) => (
                  <tr key={curso.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link href={`/admin/cursos/${curso.id}`} className="block max-w-[280px]">
                        <div className="font-black text-gray-900 group-hover:text-[#28B4AD] transition-colors leading-tight text-sm truncate">
                          {curso.titulo}
                        </div>
                        <div className="text-[11px] text-gray-400 mt-1 font-mono group-hover:text-[#28B4AD]/70 transition-colors">
                          /{curso.slug}
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <span className="text-[11px] text-gray-600 font-bold bg-gray-100 px-2 py-1 rounded-md">
                        Curso
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600 font-medium whitespace-nowrap">
                      -
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-600 border border-indigo-100">
                        {curso.modalidad === 'online-asincrono' ? 'Online Asíncrono' : 
                         curso.modalidad === 'online-envivo' ? 'Online en Vivo' : 
                         curso.modalidad === 'presencial' ? 'Presencial' : curso.modalidad}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      {curso.tipo_acceso === 'cotizar' ? (
                        <span className="text-sm font-bold text-slate-400">A convenir</span>
                      ) : curso.tipo_acceso === 'gratis' ? (
                        <span className="text-sm font-black text-[#2DB3A7]">Gratis</span>
                      ) : (
                        <span className="text-sm font-black text-gray-800">
                          {curso.precio_curso ? `$${curso.precio_curso.toLocaleString('es-CL')}` : '$0'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      {!curso.tiene_certificado ? (
                        <span className="text-slate-400 text-xs italic">No incluye</span>
                      ) : curso.precio_certificado === 0 ? (
                        <span className="bg-[#2DB3A7]/10 text-[#2DB3A7] text-[10px] font-black uppercase px-2 py-1 rounded-md">
                          Incluido
                        </span>
                      ) : (
                        <span className="text-[#2DB3A7] font-bold text-sm">
                          + ${(curso.precio_certificado ?? 0).toLocaleString('es-CL')}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${curso.estado === 'publicado'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-600'
                          }`}>
                          {curso.estado === 'publicado' ? 'Publicado' : 'Borrador'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/cursos/${curso.slug}`}
                          target="_blank"
                          className="p-2 text-slate-400 hover:text-[#28B4AD] hover:bg-[#28B4AD]/5 rounded-xl transition-all"
                          title="Ver en la web"
                        >
                          <Eye size={18} />
                        </Link>
                        <Link
                          href={`/admin/cursos/${curso.id}`}
                          className="px-4 py-1.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-[#28B4AD] hover:border-[#28B4AD]/30 rounded-lg text-xs font-bold transition-all shadow-sm"
                        >
                          Gestionar
                        </Link>
                        <Link
                          href={`/admin/cursos/${curso.id}/edit`}
                          className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-all"
                          title="Editar información general"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center whitespace-nowrap">
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <svg className="w-12 h-12 mb-4 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      <p className="text-lg font-medium text-gray-500">No hay cursos registrados</p>
                      <p className="text-sm mt-1">Crea tu primer curso para empezar.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}