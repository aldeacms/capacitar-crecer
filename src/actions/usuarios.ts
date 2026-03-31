'use server'

import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth'
import { UsuarioSchema, ActualizarPerfilSchema, PasswordSchema } from '@/lib/validations'
import { z } from 'zod'
import type { Database } from '@/types/database.types'
import type { SupabaseClient } from '@supabase/supabase-js'

const EmailSchema = z.string().email('Formato de email inválido').max(254)

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
    // 1. Intentar crear usuario con admin API
    let authUser: any = null
    let authError: any = null

    try {
      const response = await supabaseAdmin.auth.admin.createUser({
        email: parsed.data.email,
        password: parsed.data.password,
        email_confirm: true
      })
      authUser = response.data
      authError = response.error
    } catch (adminError) {
      console.warn('Admin API falló, intentando con función SQL...', adminError)
      authError = adminError
    }

    // Si admin API falló, usar función SQL como fallback
    if (authError || !authUser?.user) {
      console.warn('Usando fallback: create_new_user RPC')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: rpcResult, error: rpcError } = await (supabaseAdmin as any).rpc(
        'create_new_user',
        {
          user_email: parsed.data.email,
          user_password: parsed.data.password,
          user_nombre: parsed.data.nombre_completo,
          user_rut: parsed.data.rut || 'sin-rut'
        }
      )

      if (rpcError || !rpcResult?.[0]?.success) {
        throw new Error(
          `Error creando usuario: ${rpcError?.message || rpcResult?.[0]?.error_message || 'Error desconocido'}`
        )
      }

      authUser = { user: { id: rpcResult[0].user_id } }
    }

    if (!authUser?.user?.id) {
      throw new Error('No se pudo obtener ID del usuario creado')
    }

    // 2. Crear perfil SOLO si usamos admin API (RPC ya lo crea)
    if (!authError) {
      const perfilData: Database['public']['Tables']['perfiles']['Insert'] = {
        id: authUser.user.id,
        nombre_completo: parsed.data.nombre_completo,
        rut: parsed.data.rut || 'sin-rut'
      }

      const { error: perfilError } = await supabaseAdmin
        .from('perfiles')
        .insert([perfilData])

      if (perfilError) {
        // Si falla el perfil, eliminar el usuario auth creado
        try {
          await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
        } catch (deleteError) {
          console.warn('No se pudo eliminar usuario fallido:', deleteError)
        }
        throw new Error(`Error creando perfil: ${perfilError.message}`)
      }
    }

    // 3. Si es admin, agregar a tabla admin_users
    if (isAdmin) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const adminData: any = {
        id: authUser.user.id,
        is_active: true
      }

      const { error: adminError } = await supabaseAdmin
        .from('admin_users')
        .insert([adminData])

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

  const supabaseAdmin = getSupabaseAdmin() as SupabaseClient<Database>

  try {
    const updateData: Database['public']['Tables']['perfiles']['Update'] = dataParsed.data as Database['public']['Tables']['perfiles']['Update']

    const { error } = await supabaseAdmin
      .from('perfiles')
      .update(updateData)
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
    // Usar función RPC transaccional para eliminación atómica
    const { data: result, error: rpcError } = await supabaseAdmin.rpc(
      'delete_user_transactional',
      { user_id: userId }
    )

    if (rpcError) {
      throw new Error(`Error en eliminación transaccional: ${rpcError.message}`)
    }

    if (!result || result.length === 0) {
      throw new Error('No se recibió respuesta de la función transaccional')
    }

    const { success, error_message } = result[0]

    if (!success) {
      throw new Error(`Error eliminando usuario: ${error_message || 'Error desconocido'}`)
    }

    revalidatePath('/admin/alumnos')

    return { success: true }
  } catch (error: unknown) {
    console.error('Error en eliminarUsuario:', error)
    return { error: (error as Error).message || 'Error desconocido' }
  }
}

/**
 * Actualizar el email de un usuario en auth.users
 * Operación separada de actualizarPerfil porque toca auth directamente
 */
export async function actualizarEmail(userId: string, newEmail: string) {
  await requireAdmin()

  const userIdParsed = z.string().uuid('ID de usuario inválido').safeParse(userId)
  const emailParsed = EmailSchema.safeParse(newEmail)

  if (!userIdParsed.success) {
    return { error: 'ID de usuario inválido' }
  }
  if (!emailParsed.success) {
    return { error: emailParsed.error.issues[0]?.message || 'Email inválido' }
  }

  const supabaseAdmin = getSupabaseAdmin()

  try {
    const { error } = await supabaseAdmin.auth.admin.updateUserById(userIdParsed.data, {
      email: emailParsed.data,
    })

    if (error) {
      if (error.message.includes('already been registered')) {
        return { error: 'Este email ya está en uso por otro usuario' }
      }
      throw new Error(`Error actualizando email: ${error.message}`)
    }

    revalidatePath('/admin/alumnos')
    return { success: true }
  } catch (error: unknown) {
    console.error('Error en actualizarEmail:', error)
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

  const supabaseAdmin = getSupabaseAdmin() as SupabaseClient<Database>

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
    const matriculaData: Database['public']['Tables']['matriculas']['Insert'] = {
      perfil_id: perfilIdParsed.data,
      curso_id: cursoIdParsed.data,
      estado_pago_curso: false,
      progreso_porcentaje: 0
    }

    const { error } = await supabaseAdmin
      .from('matriculas')
      .insert([matriculaData])

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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const adminUpsert: any = [{ id: userId, is_active: true }]
      const { error } = await supabaseAdmin
        .from('admin_users')
        .upsert(adminUpsert, { onConflict: 'id' })
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
