/* eslint-disable @typescript-eslint/no-explicit-any */
import PocketBase from 'pocketbase'

/**
 * Cliente PocketBase para operaciones administrativas
 * Equivalente a getSupabaseAdmin() pero para PocketBase
 * 
 * Nota: PocketBase no tiene "service role key" como Supabase.
 * En su lugar, autenticamos con credenciales de administrador.
 */
export function getPocketBaseAdmin(): PocketBase {
  const url = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://localhost:8090'
  const adminEmail = process.env.POCKETBASE_ADMIN_EMAIL
  const adminPassword = process.env.POCKETBASE_ADMIN_PASSWORD
  
  if (!adminEmail || !adminPassword) {
    throw new Error(
      'Credenciales admin de PocketBase no configuradas. ' +
      'Configura POCKETBASE_ADMIN_EMAIL y POCKETBASE_ADMIN_PASSWORD en .env'
    )
  }
  
  const client = new PocketBase(url)
  client.autoCancellation(false)
  
  // Configurar credenciales admin (se autenticará en la primera operación que lo requiera)
  // Para operaciones inmediatas, podríamos autenticar ahora, pero lo haremos lazy
  
  return client
}

/**
 * Obtiene un cliente PocketBase autenticado como administrador
 * Útil para operaciones que requieren permisos elevados inmediatamente
 */
export async function getAuthenticatedPocketBaseAdmin(): Promise<PocketBase> {
  const pb = getPocketBaseAdmin()
  const adminEmail = process.env.POCKETBASE_ADMIN_EMAIL!
  const adminPassword = process.env.POCKETBASE_ADMIN_PASSWORD!
  
  try {
    // Verificar si ya está autenticado
    if (!pb.authStore.isValid) {
      await pb.collection('users').authWithPassword(adminEmail, adminPassword)
      console.debug('PocketBase Admin: Autenticado exitosamente')
    }
    
    return pb
  } catch (error: any) {
    console.error('Error autenticando PocketBase admin:', error)
    throw new Error(`Fallo autenticación admin: ${error.message}`)
  }
}

/**
 * Helper para operaciones administrativas comunes
 */
export const pocketbaseAdminHelpers = {
  /**
   * Crear usuario administrativamente (sin verificación email)
   */
  async createUser(email: string, password: string, data?: Record<string, any>) {
    const pb = await getAuthenticatedPocketBaseAdmin()
    
    const userData = {
      email,
      password,
      passwordConfirm: password,
      emailVisibility: true,
      verified: true,
      ...data
    }
    
    try {
      const record = await pb.collection('users').create(userData)
      return { success: true, user: record }
    } catch (error: any) {
      console.error('Error creando usuario:', error)
      return { success: false, error: error.message }
    }
  },
  
  /**
   * Eliminar usuario por ID
   */
  async deleteUser(userId: string) {
    const pb = await getAuthenticatedPocketBaseAdmin()
    
    try {
      await pb.collection('users').delete(userId)
      return { success: true }
    } catch (error: any) {
      console.error('Error eliminando usuario:', error)
      return { success: false, error: error.message }
    }
  },
  
  /**
   * Listar todos los usuarios (con paginación)
   */
  async listUsers(page = 1, perPage = 50) {
    const pb = await getAuthenticatedPocketBaseAdmin()
    
    try {
      const result = await pb.collection('users').getList(page, perPage)
      return { success: true, users: result.items, total: result.totalItems }
    } catch (error: any) {
      console.error('Error listando usuarios:', error)
      return { success: false, error: error.message }
    }
  },
  
  /**
   * Crear colección (tabla) programáticamente
   * Útil para migraciones automáticas
   */
  async createCollection(collectionData: any) {
    const pb = await getAuthenticatedPocketBaseAdmin()
    
    try {
      // Nota: PocketBase API para crear colecciones puede requerir llamadas especiales
      // Por ahora, asumimos que las colecciones se crean manualmente o vía migraciones
      console.warn('Creación programática de colecciones no implementada completamente')
      return { success: false, error: 'Método no implementado completamente' }
    } catch (error: any) {
      console.error('Error creando colección:', error)
      return { success: false, error: error.message }
    }
  },
  
  /**
   * Ejecutar migración SQL (PocketBase usa SQLite)
   * Nota: PocketBase no expone API SQL directa, necesitaríamos acceso al archivo SQLite
   */
  async executeMigration(sql: string) {
    console.warn('Ejecución SQL directa no disponible en PocketBase API')
    return { success: false, error: 'Use migraciones de PocketBase o acceso directo a SQLite' }
  }
}

/**
 * Tipo para operaciones administrativas (para mantener compatibilidad con código existente)
 * Similar al patrón de Supabase pero adaptado a PocketBase
 */
export type PocketBaseAdminClient = ReturnType<typeof getPocketBaseAdmin>

// Exportación por defecto para compatibilidad
export default getPocketBaseAdmin