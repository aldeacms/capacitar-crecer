'use server'

import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { revalidatePath } from 'next/cache'
import { requireAdmin, getPocketBaseAdminClient } from '@/lib/pocketbase-server'
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

  try {
    const pbAdmin = await getPocketBaseAdminClient()

    // Obtener usuarios de PocketBase
    const users = await pbAdmin.collection('users').getFullList({
      sort: '-created'
    })

    // Obtener perfiles
    let perfiles: any[] = []
    try {
      perfiles = await pbAdmin.collection('perfiles').getFullList({
        fields: 'id,nombre_completo,rut,created'
      })
    } catch (error: any) {
      console.warn('No se pudieron obtener perfiles:', error.message)
    }

    // Obtener admins
    let adminIds = new Set<string>()
    try {
      const admins = await pbAdmin.collection('admin_users').getFullList({
        fields: 'id'
      })
      adminIds = new Set(admins.map((a: any) => a.id))
    } catch (error: any) {
      console.warn('No se pudieron obtener admin_users:', error.message)
    }

    // Obtener count de cursos por usuario
    let matriculas: any[] = []
    try {
      matriculas = await pbAdmin.collection('matriculas').getFullList({
        fields: 'perfil_id'
      })
    } catch (error: any) {
      console.warn('No se pudieron obtener matrículas:', error.message)
    }

    // Combinar datos
    const usuariosConInfo = users.map((user: any) => {
      const perfil = perfiles.find((p: any) => p.id === user.id)
      const cursosCount = matriculas.filter((m: any) => m.perfil_id === user.id).length
      const isAdmin = adminIds.has(user.id)

      return {
        id: user.id,
        email: user.email,
        nombre_completo: perfil?.nombre_completo || user.name || 'Sin nombre',
        rut: perfil?.rut || '-',
        rol: isAdmin ? 'admin' : 'alumno',
        created_at: perfil?.created || user.created,
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

  const isAdmin = data.rol === 'admin'

  try {
    // Cliente admin de PocketBase
    const pbAdmin = await getPocketBaseAdminClient()

    // 1. Crear usuario en PocketBase
    const userData = {
      email: parsed.data.email,
      password: parsed.data.password,
      passwordConfirm: parsed.data.password,
      name: parsed.data.nombre_completo,
      emailVisibility: true,
      verified: true
    }

    let createdUser: any
    try {
      createdUser = await pbAdmin.collection('users').create(userData)
    } catch (error: any) {
      throw new Error(`Error creando usuario: ${error.message}`)
    }

    const userId = createdUser.id

    // 2. Crear perfil en colección 'perfiles'
    const perfilData = {
      id: userId,
      nombre_completo: parsed.data.nombre_completo,
      rut: parsed.data.rut || 'sin-rut',
      telefono: null,
      rol: isAdmin ? 'admin' : 'alumno',
      user: userId,
      created: new Date().toISOString(),
      updated: new Date().toISOString()
    }

    try {
      await pbAdmin.collection('perfiles').create(perfilData)
    } catch (error: any) {
      // Revertir: eliminar usuario creado
      try {
        await pbAdmin.collection('users').delete(userId)
      } catch (deleteError) {
        console.warn('No se pudo eliminar usuario fallido:', deleteError)
      }
      throw new Error(`Error creando perfil: ${error.message}`)
    }

    // 3. Si es admin, agregar a colección 'admin_users'
    if (isAdmin) {
      const adminData = {
        id: userId,
        user: userId,
        created: new Date().toISOString()
      }

      try {
        await pbAdmin.collection('admin_users').create(adminData)
      } catch (error: any) {
        // Revertir perfil y usuario
        try {
          await pbAdmin.collection('perfiles').delete(userId)
          await pbAdmin.collection('users').delete(userId)
        } catch (revertError) {
          console.warn('Error en reversión completa:', revertError)
        }
        throw new Error(`Error asignando rol admin: ${error.message}`)
      }
    }

    revalidatePath('/admin/alumnos')

    return { success: true, userId }
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

  try {
    const pbAdmin = await getPocketBaseAdminClient()

    await pbAdmin.collection('users').update(userIdParsed.data, {
      password: passwordParsed.data,
      passwordConfirm: passwordParsed.data
    })

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

  try {
    const pbAdmin = await getPocketBaseAdminClient()

    const updateData: Record<string, any> = {}
    if (dataParsed.data.nombre_completo !== undefined) {
      updateData.nombre_completo = dataParsed.data.nombre_completo
    }
    if (dataParsed.data.rut !== undefined) {
      updateData.rut = dataParsed.data.rut
    }
    updateData.updated = new Date().toISOString()

    await pbAdmin.collection('perfiles').update(userIdParsed.data, updateData)

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

  try {
    const pbAdmin = await getPocketBaseAdminClient()

    // Eliminar en orden: admin_users, matriculas, perfiles, users
    // Nota: PocketBase no tiene transacciones, así que hacemos eliminaciones secuenciales
    // Si alguna falla, no revertimos (no hay rollback), pero al menos se detiene.

    // 1. Eliminar de admin_users (si existe)
    try {
      await pbAdmin.collection('admin_users').delete(userId)
    } catch (error: any) {
      // Ignorar si no existe
      if (error.status !== 404) {
        console.warn('Error eliminando de admin_users:', error.message)
      }
    }

    // 2. Eliminar matriculas del usuario
    try {
      // Suponemos que matriculas tiene campo 'perfil_id' o 'user_id'
      const matriculas = await pbAdmin.collection('matriculas').getFullList({
        filter: `perfil_id = "${userId}" || user_id = "${userId}"`
      })
      for (const matricula of matriculas) {
        await pbAdmin.collection('matriculas').delete(matricula.id)
      }
    } catch (error: any) {
      // Ignorar si la colección no existe o no hay matriculas
      if (error.status !== 404) {
        console.warn('Error eliminando matriculas:', error.message)
      }
    }

    // 3. Eliminar perfil
    try {
      await pbAdmin.collection('perfiles').delete(userId)
    } catch (error: any) {
      // Si no existe perfil, continuar
      if (error.status !== 404) {
        throw new Error(`Error eliminando perfil: ${error.message}`)
      }
    }

    // 4. Eliminar usuario
    await pbAdmin.collection('users').delete(userId)

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

  try {
    const pbAdmin = await getPocketBaseAdminClient()

    await pbAdmin.collection('users').update(userIdParsed.data, {
      email: emailParsed.data,
      emailVisibility: true
    })

    revalidatePath('/admin/alumnos')
    return { success: true }
  } catch (error: any) {
    console.error('Error en actualizarEmail:', error)
    if (error.message.includes('already exists') || error.status === 400) {
      return { error: 'Este email ya está en uso por otro usuario' }
    }
    return { error: error.message || 'Error desconocido' }
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
