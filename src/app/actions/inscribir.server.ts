/* eslint-disable @typescript-eslint/no-explicit-any */
"use server"

import { createClient as createServerClient } from '@/lib/supabase-server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'

export async function inscribir(cursoId: string) {
  // Server action: validates session from cookies, then uses service role to ensure
  // perfil exists and create a matricula (enrollment). Throws on errors.

  const serverSupabase = await createServerClient()
  const { data: { session }, error: sessionError } = await serverSupabase.auth.getSession()

  if (sessionError || !session) {
    throw new Error('NO_SESSION')
  }

  // Admin client using service role key to bypass RLS for safe writes
  const admin = createAdminClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  // Ensure perfil exists to avoid FK violations
  const { data: perfilExistente, error: perfilCheckError } = await admin
    .from('perfiles')
    .select('id')
    .eq('id', session.user.id)
    .maybeSingle()

  if (perfilCheckError) {
    throw perfilCheckError
  }

  if (!perfilExistente) {
    const nombreDefault = (session.user.user_metadata as any)?.full_name || session.user.email || 'Alumno'
    const rutPlaceholder = session.user.id
    const { error: crearPerfilError } = await admin
      .from('perfiles')
      .insert({ id: session.user.id, nombre_completo: nombreDefault, rol: 'alumno', rut: rutPlaceholder })

    if (crearPerfilError) {
      throw crearPerfilError
    }
  }

  // Use matriculas table as canonical enrollment table
  const { data: yaInscrito, error: checkError } = await admin
    .from('matriculas')
    .select('id')
    .eq('perfil_id', session.user.id)
    .eq('curso_id', cursoId)
    .maybeSingle()

  if (checkError) {
    throw checkError
  }

  if (!yaInscrito) {
    // Obtener datos del curso para validar tipo de acceso
    const { data: curso, error: cursoError } = await admin
      .from('cursos')
      .select('tipo_acceso, precio_curso')
      .eq('id', cursoId)
      .single()

    if (cursoError || !curso) {
      throw new Error('CURSO_NO_ENCONTRADO')
    }

    // Validar tipo de acceso y permitir/rechazar inscripción
    // gratis: inscripción directa
    // gratis_cert_pago: inscripción directa (contenido gratis, certificado se paga después)
    // pago: rechazar, redirigir a checkout
    // cotizar: rechazar, redirigir a formulario

    if (curso.tipo_acceso === 'pago') {
      throw new Error('CURSO_REQUIERE_PAGO')
    }

    if (curso.tipo_acceso === 'cotizar') {
      throw new Error('CURSO_REQUIERE_COTIZACION')
    }

    if (curso.tipo_acceso !== 'gratis' && curso.tipo_acceso !== 'gratis_cert_pago') {
      throw new Error('TIPO_ACCESO_INVALIDO')
    }

    // Insertamos la matrícula con estado_pago_curso en true (acceso permitido)
    // Para gratis_cert_pago, estado_pago_certificado será false hasta que pague el certificado
    const estadoPagoCertificado = curso.tipo_acceso === 'gratis_cert_pago' ? false : true

    const { error: insertError } = await admin
      .from('matriculas')
      .insert({
        perfil_id: session.user.id,
        curso_id: cursoId,
        estado_pago_curso: true, // true = usuario tiene acceso permitido
        estado_pago_certificado: estadoPagoCertificado, // false para gratis_cert_pago hasta que pague
        progreso_porcentaje: 0
      })

    if (insertError) {
      throw insertError
    }
  }

  return { ok: true }
}

