'use server'

import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth'
import { UsuarioSchema, ActualizarPerfilSchema, PasswordSchema } from '@/lib/validations'
import { z } from 'zod'

/**
 * Obtener lista de todos los usuarios (admins + alumnos)
 * Retorna: id, email, nombre_completo, rut, rol, created_at, cursos_count
 */
export async function getUsuarios() {
  await requireAdmin()
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
      .select('id, nombre_completo, rut, created_at')

    if (perfilesError) {
      throw new Error(`Error obteniendo perfiles: ${perfilesError.message}`)
    }

    // Obtener admins
    const { data: admins, error: adminsError } = await supabaseAdmin
      .from('admin_users')
      .select('id')

    if (adminsError) {
      console.warn('Warning: Could not fetch admin_users, admin roles may be incomplete')
    }

    const adminIds = new Set((admins || []).map((a: any) => a.id))

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
      const isAdmin = adminIds.has(authUser.id)

      return {
        id: authUser.id,
        email: authUser.email,
        nombre_completo: perfil?.nombre_completo || 'Sin nombre',
        rut: perfil?.rut || '-',
        rol: isAdmin ? 'admin' : 'alumno',
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
 * Note: rol is determined by presence in admin_users table, not stored in perfiles
 */
export async function crearUsuario(data: {
  email: string
  password: string
  nombre_completo: string
  rut?: string
  rol?: 'admin' | 'alumno'
}) {
  await requireAdmin()

  // Validar input
  const parsed = UsuarioSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Datos inválidos' }
  }

  const supabaseAdmin = getSupabaseAdmin()
  const isAdmin = data.rol === 'admin'

  try {
    // 1. Crear usuario en auth
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: parsed.data.email,
      password: parsed.data.password,
      email_confirm: true
    })

    if (authError || !authUser.user) {
      throw new Error(`Error creando usuario auth: ${authError?.message}`)
    }

    // 2. Crear perfil (sin rol - eso se maneja vía admin_users)
    const { error: perfilError } = await supabaseAdmin
      .from('perfiles')
      .insert([
        {
          id: authUser.user.id,
          nombre_completo: parsed.data.nombre_completo,
          rut: parsed.data.rut || null
        }
      ])

    if (perfilError) {
      // Si falla el perfil, eliminar el usuario auth creado
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
      throw new Error(`Error creando perfil: ${perfilError.message}`)
    }

    // 3. Si es admin, agregar a tabla admin_users
    if (isAdmin) {
      const { error: adminError } = await supabaseAdmin
        .from('admin_users')
        .insert([
          {
            id: authUser.user.id,
            is_active: true
          }
        ])

      if (adminError) {
        throw new Error(`Error asignando rol admin: ${adminError.message}`)
      }
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
  await requireAdmin()

  // Validar inputs
  const userIdParsed = z.string().uuid().safeParse(userId)
  const passwordParsed = PasswordSchema.safeParse(newPassword)

  if (!userIdParsed.success) {
    return { error: 'ID de usuario inválido' }
  }
  if (!passwordParsed.success) {
    return { error: passwordParsed.error.issues[0]?.message || 'Contraseña inválida' }
  }

  const supabaseAdmin = getSupabaseAdmin()

  try {
    const { error } = await supabaseAdmin.auth.admin.updateUserById(userIdParsed.data, {
      password: passwordParsed.data
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
 * Note: rol is managed via admin_users table, not here
 */
export async function actualizarPerfil(
  userId: string,
  data: {
    nombre_completo?: string
    rut?: string
  }
) {
  await requireAdmin()

  // Validar inputs
  const userIdParsed = z.string().uuid('ID de usuario inválido').safeParse(userId)
  const dataParsed = ActualizarPerfilSchema.safeParse(data)

  if (!userIdParsed.success) {
    return { error: 'ID de usuario inválido' }
  }
  if (!dataParsed.success) {
    return { error: dataParsed.error.issues[0]?.message || 'Datos inválidos' }
  }

  const supabaseAdmin = getSupabaseAdmin()

  try {
    const { error } = await supabaseAdmin
      .from('perfiles')
      .update(dataParsed.data)
      .eq('id', userIdParsed.data)

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
  await requireAdmin()
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
  await requireAdmin()

  // Validar UUIDs
  const perfilIdParsed = z.string().uuid('ID de perfil inválido').safeParse(perfilId)
  const cursoIdParsed = z.string().uuid('ID de curso inválido').safeParse(cursoId)

  if (!perfilIdParsed.success) {
    return { error: perfilIdParsed.error.issues[0]?.message || 'ID de perfil inválido' }
  }
  if (!cursoIdParsed.success) {
    return { error: cursoIdParsed.error.issues[0]?.message || 'ID de curso inválido' }
  }

  const supabaseAdmin = getSupabaseAdmin()

  try {
    // Verificar que no está ya inscrito
    const { data: existente } = await supabaseAdmin
      .from('matriculas')
      .select('id')
      .eq('perfil_id', perfilIdParsed.data)
      .eq('curso_id', cursoIdParsed.data)
      .single()

    if (existente) {
      return { error: 'El usuario ya está inscrito en este curso' }
    }

    // Crear matrícula
    const { error } = await supabaseAdmin
      .from('matriculas')
      .insert([
        {
          perfil_id: perfilIdParsed.data,
          curso_id: cursoIdParsed.data,
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
  await requireAdmin()

  // Validar UUID
  const matriculaIdParsed = z.string().uuid('ID de matrícula inválido').safeParse(matriculaId)
  if (!matriculaIdParsed.success) {
    return { error: matriculaIdParsed.error.issues[0]?.message || 'ID de matrícula inválido' }
  }

  const supabaseAdmin = getSupabaseAdmin()

  try {
    const { error } = await supabaseAdmin
      .from('matriculas')
      .delete()
      .eq('id', matriculaIdParsed.data)

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

/**
 * Cambiar el rol de un usuario entre admin y alumno
 * Requiere: admin
 * Previene: auto-degradación de admin
 */
export async function cambiarRolUsuario(userId: string, nuevoRol: 'admin' | 'alumno') {
  const currentAdmin = await requireAdmin()

  // Prevenir que admin se degrade a sí mismo
  if (currentAdmin.id === userId && nuevoRol === 'alumno') {
    return { error: 'No puedes degradar tu propia cuenta de administrador' }
  }

  const supabaseAdmin = getSupabaseAdmin()

  try {
    if (nuevoRol === 'admin') {
      // Promover a admin
      const { error } = await supabaseAdmin
        .from('admin_users')
        .upsert([{ id: userId, is_active: true }], { onConflict: 'id' })
      if (error) return { error: error.message }
    } else {
      // Degradar de admin
      const { error } = await supabaseAdmin
        .from('admin_users')
        .delete()
        .eq('id', userId)
      if (error) return { error: error.message }
    }

    revalidatePath('/admin/alumnos')
    return { success: true }
  } catch (error: unknown) {
    console.error('Error en cambiarRolUsuario:', error)
    return { error: (error as Error).message || 'Error desconocido al cambiar rol' }
  }
}
