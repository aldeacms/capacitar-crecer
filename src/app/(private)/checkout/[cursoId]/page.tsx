import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import CheckoutForm from './CheckoutForm'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { ImagePlaceholder } from '@/components/ui/ImagePlaceholder'

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ cursoId: string }>
}) {
  const { cursoId } = await params

  // Verificar sesión
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Obtener datos del curso
  const { data: curso, error } = await supabase
    .from('cursos')
    .select('id, titulo, slug, descripcion_breve, imagen_url, precio_curso, tipo_acceso')
    .eq('id', cursoId)
    .single()

  // Log para debugging
  if (error) {
    console.error('Error fetching curso:', error)
  }

  if (!curso) {
    console.error('Curso no encontrado:', cursoId)
    redirect('/cursos')
  }

  // Si no es curso de pago, redirigir a landing
  if (curso.tipo_acceso !== 'pago') {
    redirect(`/cursos/${curso.slug}`)
  }

  // Verificar si ya está inscrito
  const { data: perfil } = await supabase
    .from('perfiles')
    .select('id')
    .eq('id', user.id)
    .single()

  if (perfil) {
    const { data: matricula } = await supabase
      .from('matriculas')
      .select('id')
      .eq('perfil_id', perfil.id)
      .eq('curso_id', cursoId)
      .maybeSingle()

    if (matricula) {
      redirect(`/dashboard/cursos/${curso.slug}`)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Mini-hero */}
      <div className="bg-gradient-to-r from-[#28B4AD]/5 to-[#28B4AD]/10 border-b border-[#28B4AD]/20 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-[#28B4AD] hover:text-[#1f9593] font-medium mb-6 transition-colors"
          >
            <ArrowLeft size={18} />
            Volver al Dashboard
          </Link>
          <div>
            <h1 className="text-3xl font-black text-gray-900 mb-2">Finalizar Compra</h1>
            <p className="text-gray-600">Completa tu inscripción al curso de {curso.titulo}</p>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="py-12 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Tarjeta principal */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Header del curso */}
          <div className="bg-gradient-to-r from-[#28B4AD]/10 to-[#28B4AD]/5 p-6 border-b border-gray-200">
            <div className="flex gap-4">
              <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                {curso.imagen_url ? (
                  <img
                    src={curso.imagen_url}
                    alt={curso.titulo}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImagePlaceholder className="w-full h-full" titulo="Sin imagen" />
                )}
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900">{curso.titulo}</h1>
                <p className="text-gray-600 text-sm mt-1">{curso.descripcion_breve}</p>
              </div>
            </div>
          </div>

          {/* Contenido principal */}
          <div className="p-8">
            <CheckoutForm cursoId={cursoId} precioCurso={curso.precio_curso || 0} />
          </div>
        </div>

          {/* Footer info */}
          <div className="mt-6 text-center text-sm text-gray-600">
            <p>
              ¿Tienes problemas?{' '}
              <a href="#contacto" className="text-[#28B4AD] hover:underline font-medium">
                Contactanos
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
