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

    // Solo permitir inscripción gratuita en cursos gratis
    // Cursos pago-inmediato solo si precio es 0
    // Otros tipos (pago, gratis_cert_pago, cotizar) requieren procesamiento adicional
    const esInscripcionDirecta =
      curso.tipo_acceso === 'gratis' ||
      (curso.tipo_acceso === 'pago-inmediato' && curso.precio_curso === 0)

    if (!esInscripcionDirecta) {
      // Los cursos de pago o requieren cotización deben procesarse en checkout/pagos
      throw new Error('CURSO_REQUIERE_PAGO_O_COTIZACION')
    }

    const { error: insertError } = await admin
      .from('matriculas')
      .insert({
        perfil_id: session.user.id,
        curso_id: cursoId,
        estado_pago_curso: true, // true = usuario tiene acceso permitido
        progreso_porcentaje: 0
      })

    if (insertError) {
      throw insertError
    }
  }

  return { ok: true }
}

