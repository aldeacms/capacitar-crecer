import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import CheckoutForm from './CheckoutForm'
import Link from 'next/link'
import { ArrowLeft, AlertCircle } from 'lucide-react'
import { ImagePlaceholder } from '@/components/ui/ImagePlaceholder'
import { getPaymentConfigs } from '@/actions/pagos-config'

export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ cursoId: string }>
  searchParams: Promise<{ tipo?: string; precio?: string }>
}) {
  const { cursoId } = await params
  const { tipo, precio } = await searchParams

  // Verificar sesión (único redirect crítico)
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
    .select('id, titulo, slug, descripcion_breve, imagen_url, precio_curso, precio_certificado, tiene_certificado, tipo_acceso')
    .eq('id', cursoId)
    .single()

  // EXCEPCIÓN 1: Curso no encontrado
  if (error || !curso) {
    return <CursoNoEncontradoPage cursoId={cursoId} />
  }

  // Detectar si es compra de certificado
  const esCompradeCertificado = tipo === 'certificado'
  const precioAMostrar = esCompradeCertificado
    ? Number(precio) || curso.precio_certificado || 0
    : curso.precio_curso || 0

  // EXCEPCIÓN 2: Validar tipo de acceso según compra
  if (esCompradeCertificado) {
    // Para certificado: debe ser gratis_cert_pago y debe tener certificado
    if (curso.tipo_acceso !== 'gratis_cert_pago' || !curso.tiene_certificado) {
      return <CursoNoEsDePagoPage curso={curso} />
    }
  } else {
    // Para curso: debe ser pago
    if (curso.tipo_acceso !== 'pago') {
      return <CursoNoEsDePagoPage curso={curso} />
    }
  }

  // EXCEPCIÓN 3: Verificar si ya está inscrito
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
      // Ya está inscrito, ir directo al aula
      redirect(`/dashboard/cursos/${curso.slug}`)
    }
  }

  // Obtener gateways habilitados
  const allConfigs = await getPaymentConfigs()
  const gatewaysHabilitados = allConfigs
    .filter((c) => c.habilitado)
    .map((c) => ({ gateway: c.gateway, nombre: c.nombre, modo: c.modo }))

  // ✅ FLUJO NORMAL: Mostrar checkout
  return (
    <div className="min-h-screen">
      {/* Mini-hero */}
      <div className="bg-gradient-to-r from-[#28B4AD]/5 to-[#28B4AD]/10 border-b border-[#28B4AD]/20 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <Link
            href={esCompradeCertificado ? `/dashboard/cursos/${curso.slug}?leccion=certificado` : "/dashboard"}
            className="flex items-center gap-2 text-[#28B4AD] hover:text-[#1f9593] font-medium mb-6 transition-colors"
          >
            <ArrowLeft size={18} />
            Volver
          </Link>
          <div>
            <h1 className="text-3xl font-black text-gray-900 mb-2">Finalizar {esCompradeCertificado ? 'Compra del Certificado' : 'Inscripción'}</h1>
            <p className="text-gray-600">
              {esCompradeCertificado
                ? `Obtén tu certificado para ${curso.titulo}`
                : `Completa tu inscripción al curso de ${curso.titulo}`}
            </p>
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
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">Resumen de tu compra</h2>

                <div className="bg-slate-50 rounded-lg p-4 space-y-3 border border-slate-200">
                  <div className="flex justify-between">
                    <span className="text-gray-700">{esCompradeCertificado ? 'Certificado de:' : 'Curso:'}</span>
                    <span className="font-bold text-gray-900">{curso.titulo}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-3">
                    <span className="text-gray-700 font-semibold">Precio total:</span>
                    <span className="font-black text-gray-900 text-lg">
                      ${precioAMostrar.toLocaleString('es-CL')}
                    </span>
                  </div>
                </div>

                <CheckoutForm
                  cursoId={cursoId}
                  precio={precioAMostrar}
                  tipo={esCompradeCertificado ? 'certificado' : 'curso'}
                  cursoSlug={curso.slug}
                  gatewaysDisponibles={gatewaysHabilitados}
                />
              </div>
            </div>
          </div>

          {/* Footer info */}
          <div className="mt-6 text-center text-sm text-gray-600">
            <p>
              ¿Tienes problemas?{' '}
              <a href="#contacto" className="text-[#28B4AD] hover:underline font-medium">
                Contáctanos
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * EXCEPCIÓN 1: Curso no encontrado
 */
function CursoNoEncontradoPage({ cursoId }: { cursoId: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-3 bg-red-50 rounded-full">
              <AlertCircle size={32} className="text-red-600" />
            </div>
          </div>
          <h1 className="text-2xl font-black text-gray-900">Curso no encontrado</h1>
          <p className="text-gray-600">
            El curso que buscas no existe o ha sido eliminado. Verifica el ID: <code className="text-xs bg-gray-100 px-2 py-1 rounded">{cursoId}</code>
          </p>
          <div className="flex gap-3">
            <Link
              href="/cursos"
              className="flex-1 py-2.5 bg-[#28B4AD] hover:bg-[#1f9593] text-white rounded-lg font-bold transition-all text-center"
            >
              Ver todos los cursos
            </Link>
            <Link
              href="/dashboard"
              className="flex-1 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg font-bold transition-all text-center"
            >
              Mi Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * EXCEPCIÓN 2: Curso no es de pago
 */
function CursoNoEsDePagoPage({ curso }: { curso: any }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 space-y-4">
          <div className="flex justify-center">
            <div className="p-3 bg-amber-50 rounded-full">
              <AlertCircle size={32} className="text-amber-600" />
            </div>
          </div>
          <h1 className="text-2xl font-black text-gray-900">Acceso directo disponible</h1>
          <p className="text-gray-600">
            Este curso <strong>"{curso.titulo}"</strong> es de acceso{' '}
            <strong>
              {curso.tipo_acceso === 'gratis'
                ? 'gratuito'
                : curso.tipo_acceso === 'gratis_cert_pago'
                  ? 'gratuito (con certificado de pago)'
                  : 'por cotización'}
            </strong>
            . No requiere pago en este momento.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-700">
              Puedes acceder directamente a este curso desde su página de detalles.
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href={`/cursos/${curso.slug}`}
              className="flex-1 py-2.5 bg-[#28B4AD] hover:bg-[#1f9593] text-white rounded-lg font-bold transition-all text-center"
            >
              Ver curso
            </Link>
            <Link
              href="/cursos"
              className="flex-1 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg font-bold transition-all text-center"
            >
              Otros cursos
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

