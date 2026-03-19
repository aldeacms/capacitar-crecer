'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase-server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function marcarLeccionCompletada(
  leccionId: string
): Promise<{ success: true; nextLeccionId?: string } | { error: string }> {
  try {
    // Verificar sesión
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'No autenticado' }
    }

    // Obtener el perfil del usuario
    const { data: perfil, error: perfilError } = await supabase
      .from('perfiles')
      .select('id')
      .eq('id', user.id)
      .single()

    if (perfilError || !perfil) {
      return { error: 'Perfil no encontrado' }
    }

    // Obtener la lección actual para verificar que existe
    const { data: leccion, error: leccionError } = await supabase
      .from('lecciones')
      .select('id, modulo_id, orden')
      .eq('id', leccionId)
      .single()

    if (leccionError || !leccion) {
      return { error: 'Lección no encontrada' }
    }

    // Obtener el módulo para verificar que existe
    const { data: modulo, error: moduloError } = await supabase
      .from('modulos')
      .select('id, curso_id, orden')
      .eq('id', leccion.modulo_id)
      .single()

    if (moduloError || !modulo) {
      return { error: 'Módulo no encontrado' }
    }

    // Verificar que el usuario tenga matrícula activa en este curso
    const { data: matricula, error: matriculaError } = await supabase
      .from('matriculas')
      .select('id')
      .eq('perfil_id', perfil.id)
      .eq('curso_id', modulo.curso_id)
      .single()

    if (matriculaError || !matricula) {
      return { error: 'No tienes acceso a este curso' }
    }

    // Insertar en lecciones_completadas
    const { error: insertError } = await supabase
      .from('lecciones_completadas')
      .insert({
        perfil_id: perfil.id,
        leccion_id: leccionId,
      })
      .select()

    // Si ya existe la relación (UNIQUE constraint), ignorar el error
    if (insertError && insertError.code !== '23505') {
      return { error: `Error al marcar como completada: ${insertError.message}` }
    }

    // Buscar la siguiente lección
    let nextLeccionId: string | undefined

    // Primero intenta la siguiente lección en el mismo módulo
    const { data: siguienteLeccion } = await supabase
      .from('lecciones')
      .select('id')
      .eq('modulo_id', leccion.modulo_id)
      .gt('orden', leccion.orden)
      .order('orden', { ascending: true })
      .limit(1)
      .single()

    if (siguienteLeccion) {
      nextLeccionId = siguienteLeccion.id
    } else {
      // Si no hay más lecciones en este módulo, busca en el siguiente módulo
      const { data: siguienteModulo } = await supabase
        .from('modulos')
        .select('id')
        .eq('curso_id', modulo.curso_id)
        .gt('orden', modulo.orden)
        .order('orden', { ascending: true })
        .limit(1)
        .single()

      if (siguienteModulo) {
        const { data: primeraLeccionModulo } = await supabase
          .from('lecciones')
          .select('id')
          .eq('modulo_id', siguienteModulo.id)
          .order('orden', { ascending: true })
          .limit(1)
          .single()

        if (primeraLeccionModulo) {
          nextLeccionId = primeraLeccionModulo.id
        }
      }
    }

    // Recalcular progreso del curso
    const supabaseAdmin = getSupabaseAdmin()

    // Obtener todos los módulos del curso
    const { data: modulosDatos } = await supabaseAdmin
      .from('modulos')
      .select('id')
      .eq('curso_id', modulo.curso_id)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const modulosIds = (modulosDatos ?? []).map((m: any) => m.id)

    // Obtener todas las lecciones del curso
    const { data: leccionesDelCurso } = await supabaseAdmin
      .from('lecciones')
      .select('id')
      .in('modulo_id', modulosIds)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const leccionesIds = (leccionesDelCurso ?? []).map((l: any) => l.id)

    // Contar lecciones completadas en este curso
    const { count: completadas } = await supabaseAdmin
      .from('lecciones_completadas')
      .select('*', { count: 'exact', head: true })
      .eq('perfil_id', perfil.id)
      .in('leccion_id', leccionesIds)

    const totalLecciones = leccionesDelCurso?.length ?? 0
    const completadasCount = completadas ?? 0
    const porcentaje = totalLecciones > 0
      ? Math.round((completadasCount / totalLecciones) * 100)
      : 0

    // Actualizar progreso en matriculas
    const { error: updateError } = await supabaseAdmin
      .from('matriculas')
      .update({ progreso_porcentaje: porcentaje })
      .eq('perfil_id', perfil.id)
      .eq('curso_id', modulo.curso_id)

    if (updateError) {
      return { error: `Error al actualizar progreso: ${updateError.message}` }
    }

    // Revalidar el dashboard y la página de cursos
    revalidatePath('/dashboard')
    revalidatePath('/')

    return { success: true, nextLeccionId }
  } catch (error: unknown) {
    return { error: (error as Error).message || String(error) }
  }
}

export async function getLeccionesCompletadas(
  cursoId: string
): Promise<{ data: string[] } | { error: string }> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'No autenticado' }
    }

    // Obtener el perfil del usuario
    const { data: perfil } = await supabase
      .from('perfiles')
      .select('id')
      .eq('id', user.id)
      .single()

    if (!perfil) {
      return { error: 'Perfil no encontrado' }
    }

    // Primero obtener todos los módulos del curso
    const { data: modulos } = await supabase
      .from('modulos')
      .select('id')
      .eq('curso_id', cursoId)

    if (!modulos || modulos.length === 0) {
      return { data: [] }
    }

    const moduloIds = modulos.map(m => m.id)

    // Luego obtener todas las lecciones de esos módulos
    const { data: lecciones } = await supabase
      .from('lecciones')
      .select('id')
      .in('modulo_id', moduloIds)

    if (!lecciones || lecciones.length === 0) {
      return { data: [] }
    }

    const leccionIds = lecciones.map(l => l.id)

    // Finalmente obtener las completadas por este usuario
    const { data: completadas, error } = await supabase
      .from('lecciones_completadas')
      .select('leccion_id')
      .eq('perfil_id', perfil.id)
      .in('leccion_id', leccionIds)

    if (error) {
      return { error: error.message }
    }

    return {
      data: (completadas ?? []).map((c: any) => c.leccion_id),
    }
  } catch (error: unknown) {
    return { error: (error as Error).message || String(error) }
  }
}
