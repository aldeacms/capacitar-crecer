'use server'

import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { revalidatePath } from 'next/cache'

/**
 * Obtener lista de todos los usuarios (admins + alumnos)
 * Retorna: id, email, nombre_completo, rut, rol, created_at, cursos_count
 */
export async function getUsuarios() {
  const supabaseAdmin = getSupabaseAdmin()

  try {
    // Obtener usuarios de auth.users
    const { data: { users }, error: authError } = await supabaseAdmin.auth.admin.listUsers()

    if (authError) {
      throw new Error(`Error obteniendo usuarios: ${authError.message}`)
    }

    // Obtener perfiles
    const { data: perfiles, error: perfilesError } = await supabaseAdmin
      .from('perfiles')
      .select('id, nombre_completo, rut, rol, created_at')

    if (perfilesError) {
      throw new Error(`Error obteniendo perfiles: ${perfilesError.message}`)
    }

    // Obtener count de cursos por usuario
    const { data: matriculas, error: matriculasError } = await supabaseAdmin
      .from('matriculas')
      .select('perfil_id', { count: 'exact' })

    if (matriculasError) {
      throw new Error(`Error obteniendo matrículas: ${matriculasError.message}`)
    }

    // Combinar datos
    const usuariosConInfo = users.map((authUser: any) => {
      const perfil = perfiles.find((p: any) => p.id === authUser.id)
      const cursosCount = matriculas.filter((m: any) => m.perfil_id === authUser.id).length

      return {
        id: authUser.id,
        email: authUser.email,
        nombre_completo: perfil?.nombre_completo || 'Sin nombre',
        rut: perfil?.rut || '-',
        rol: perfil?.rol || 'alumno',
        created_at: perfil?.created_at || authUser.created_at,
        cursos_count: cursosCount
      }
    })

    return usuariosConInfo
  } catch (error: unknown) {
    console.error('Error en getUsuarios:', error)
    return { error: (error as Error).message || 'Error desconocido' }
  }
}

/**
 * Crear un nuevo usuario (auth + perfil)
 */
export async function crearUsuario(data: {
  email: string
  password: string
  nombre_completo: string
  rut: string
  rol: 'admin' | 'alumno'
}) {
  const supabaseAdmin = getSupabaseAdmin()

  try {
    // 1. Crear usuario en auth
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true
    })

    if (authError || !authUser.user) {
      throw new Error(`Error creando usuario auth: ${authError?.message}`)
    }

    // 2. Crear perfil
    const { error: perfilError } = await supabaseAdmin
      .from('perfiles')
      .insert([
        {
          id: authUser.user.id,
          nombre_completo: data.nombre_completo,
          rut: data.rut,
          rol: data.rol
        }
      ])

    if (perfilError) {
      // Si falla el perfil, eliminar el usuario auth creado
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
      throw new Error(`Error creando perfil: ${perfilError.message}`)
    }

    revalidatePath('/admin/alumnos')

    return { success: true, userId: authUser.user.id }
  } catch (error: unknown) {
    console.error('Error en crearUsuario:', error)
    return { error: (error as Error).message || 'Error desconocido' }
  }
}

/**
 * Cambiar contraseña de un usuario
 */
export async function cambiarPassword(userId: string, newPassword: string) {
  const supabaseAdmin = getSupabaseAdmin()

  try {
    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: newPassword
    })

    if (error) {
      throw new Error(`Error cambiando contraseña: ${error.message}`)
    }

    return { success: true }
  } catch (error: unknown) {
    console.error('Error en cambiarPassword:', error)
    return { error: (error as Error).message || 'Error desconocido' }
  }
}

/**
 * Actualizar datos del perfil
 */
export async function actualizarPerfil(
  userId: string,
  data: {
    nombre_completo?: string
    rut?: string
    rol?: 'admin' | 'alumno'
  }
) {
  const supabaseAdmin = getSupabaseAdmin()

  try {
    const { error } = await supabaseAdmin
      .from('perfiles')
      .update(data)
      .eq('id', userId)

    if (error) {
      throw new Error(`Error actualizando perfil: ${error.message}`)
    }

    revalidatePath('/admin/alumnos')

    return { success: true }
  } catch (error: unknown) {
    console.error('Error en actualizarPerfil:', error)
    return { error: (error as Error).message || 'Error desconocido' }
  }
}

/**
 * Eliminar un usuario (auth + perfil)
 */
export async function eliminarUsuario(userId: string) {
  const supabaseAdmin = getSupabaseAdmin()

  try {
    // 1. Eliminar matrículas
    const { error: matriculasError } = await supabaseAdmin
      .from('matriculas')
      .delete()
      .eq('perfil_id', userId)

    if (matriculasError) {
      throw new Error(`Error eliminando matrículas: ${matriculasError.message}`)
    }

    // 2. Eliminar perfil
    const { error: perfilError } = await supabaseAdmin
      .from('perfiles')
      .delete()
      .eq('id', userId)

    if (perfilError) {
      throw new Error(`Error eliminando perfil: ${perfilError.message}`)
    }

    // 3. Eliminar usuario auth
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (authError) {
      throw new Error(`Error eliminando usuario auth: ${authError.message}`)
    }

    revalidatePath('/admin/alumnos')

    return { success: true }
  } catch (error: unknown) {
    console.error('Error en eliminarUsuario:', error)
    return { error: (error as Error).message || 'Error desconocido' }
  }
}

/**
 * Enrolar un usuario en un curso
 */
export async function inscribirEnCurso(perfilId: string, cursoId: string) {
  const supabaseAdmin = getSupabaseAdmin()

  try {
    // Verificar que no está ya inscrito
    const { data: existente } = await supabaseAdmin
      .from('matriculas')
      .select('id')
      .eq('perfil_id', perfilId)
      .eq('curso_id', cursoId)
      .single()

    if (existente) {
      return { error: 'El usuario ya está inscrito en este curso' }
    }

    // Crear matrícula
    const { error } = await supabaseAdmin
      .from('matriculas')
      .insert([
        {
          perfil_id: perfilId,
          curso_id: cursoId,
          estado_pago_curso: 'gratis',
          progreso_porcentaje: 0
        }
      ])

    if (error) {
      throw new Error(`Error inscribiendo usuario: ${error.message}`)
    }

    revalidatePath('/admin/alumnos')

    return { success: true }
  } catch (error: unknown) {
    console.error('Error en inscribirEnCurso:', error)
    return { error: (error as Error).message || 'Error desconocido' }
  }
}

/**
 * Desinscribir un usuario de un curso
 */
export async function desinscribirDeCurso(matriculaId: string) {
  const supabaseAdmin = getSupabaseAdmin()

  try {
    const { error } = await supabaseAdmin
      .from('matriculas')
      .delete()
      .eq('id', matriculaId)

    if (error) {
      throw new Error(`Error desinscribiendo usuario: ${error.message}`)
    }

    revalidatePath('/admin/alumnos')

    return { success: true }
  } catch (error: unknown) {
    console.error('Error en desinscribirDeCurso:', error)
    return { error: (error as Error).message || 'Error desconocido' }
  }
}

/**
 * Obtener inscripciones de un usuario
 */
export async function getInscripcionesUsuario(perfilId: string) {
  const supabaseAdmin = getSupabaseAdmin()

  try {
    const { data: matriculas, error } = await supabaseAdmin
      .from('matriculas')
      .select(
        `
        id,
        curso_id,
        estado_pago_curso,
        estado_pago_certificado,
        progreso_porcentaje,
        created_at,
        cursos(id, titulo, imagen_url)
      `
      )
      .eq('perfil_id', perfilId)

    if (error) {
      throw new Error(`Error obteniendo inscripciones: ${error.message}`)
    }

    return matriculas || []
  } catch (error: unknown) {
    console.error('Error en getInscripcionesUsuario:', error)
    return { error: (error as Error).message || 'Error desconocido' }
  }
}

/**
 * Obtener cursos disponibles (no inscritos por el usuario)
 */
export async function getCursosDisponibles(perfilId: string) {
  const supabaseAdmin = getSupabaseAdmin()

  try {
    // Obtener cursos en los que ya está inscrito
    const { data: inscritos } = await supabaseAdmin
      .from('matriculas')
      .select('curso_id')
      .eq('perfil_id', perfilId)

    const inscritosIds = (inscritos || []).map((m: any) => m.curso_id)

    // Obtener todos los cursos
    const { data: cursos, error } = await supabaseAdmin
      .from('cursos')
      .select('id, titulo, imagen_url')
      .order('titulo')

    if (error) {
      throw new Error(`Error obteniendo cursos: ${error.message}`)
    }

    // Filtrar los no inscritos
    const disponibles = (cursos || []).filter((c: any) => !inscritosIds.includes(c.id))

    return disponibles
  } catch (error: unknown) {
    console.error('Error en getCursosDisponibles:', error)
    return { error: (error as Error).message || 'Error desconocido' }
  }
}
