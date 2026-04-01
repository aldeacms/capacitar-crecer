import PocketBase from 'pocketbase'
import { cookies } from 'next/headers'
import { PBUser } from './pocketbase-client'

// Nombre de la cookie para almacenar autenticación PocketBase
const PB_AUTH_COOKIE = 'pb_auth'

// Interfaz para datos de autenticación serializados
interface SerializedAuth {
  token: string
  model: PBUser | null
}

/**
 * Crea un cliente PocketBase para el servidor con manejo de cookies
 */
export async function createPocketBaseServerClient() {
  const cookieStore = await cookies()
  const url = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://localhost:8090'
  
  const client = new PocketBase(url)
  client.autoCancellation(false)
  
  // Intentar restaurar autenticación desde cookies
  const authCookie = cookieStore.get(PB_AUTH_COOKIE)
  
  if (authCookie?.value) {
    try {
      const authData: SerializedAuth = JSON.parse(authCookie.value)
      
      if (authData.token && authData.model) {
        client.authStore.save(authData.token, authData.model)
        console.debug('PocketBase: Sesión restaurada desde cookies')
      }
    } catch (error) {
      console.error('Error restaurando autenticación desde cookies:', error)
      // Limpiar cookie inválida
      cookieStore.delete(PB_AUTH_COOKIE)
    }
  }
  
  return client
}

/**
 * Obtiene el usuario actual autenticado (para Server Components)
 */
export async function getServerAuthUser(): Promise<PBUser | null> {
  const pb = await createPocketBaseServerClient()
  return pb.authStore.model as PBUser | null
}

/**
 * Verifica si el usuario actual es administrador (para Server Components)
 */
export async function isServerUserAdmin(): Promise<boolean> {
  const user = await getServerAuthUser()
  
  if (!user) return false
  
  // Verificar si es admin basado en email o colección separada
  // TODO: Implementar lógica de roles más robusta
  return user.email === process.env.NEXT_PUBLIC_POCKETBASE_ADMIN_EMAIL || false
}

/**
 * Helper para establecer autenticación en cookies después de login/registro
 */
export async function setServerAuth(token: string, model: PBUser) {
  const cookieStore = await cookies()
  
  const authData: SerializedAuth = { token, model }
  
  cookieStore.set({
    name: PB_AUTH_COOKIE,
    value: JSON.stringify(authData),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 días (similar a Supabase)
  })
}

/**
 * Helper para limpiar autenticación de cookies (logout)
 */
export async function clearServerAuth() {
  const cookieStore = await cookies()
  cookieStore.delete(PB_AUTH_COOKIE)
}

/**
 * Cliente PocketBase para operaciones que requieren autenticación admin
 * Similar a getSupabaseAdmin() pero para PocketBase
 */
export async function getPocketBaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://localhost:8090'
  const adminEmail = process.env.POCKETBASE_ADMIN_EMAIL
  const adminPassword = process.env.POCKETBASE_ADMIN_PASSWORD
  
  if (!adminEmail || !adminPassword) {
    throw new Error('Credenciales admin de PocketBase no configuradas')
  }
  
  const client = new PocketBase(url)
  client.autoCancellation(false)
  
  try {
    // Autenticar como admin
    await client.collection('users').authWithPassword(adminEmail, adminPassword)
    return client
  } catch (error: any) {
    console.error('Error autenticando como admin PocketBase:', error)
    throw new Error(`Fallo autenticación admin: ${error.message}`)
  }
}

/**
 * Middleware helper: Verificar autenticación y redirigir si no autenticado
 */
export async function requireAuth(): Promise<PBUser> {
  const user = await getServerAuthUser()
  
  if (!user) {
    // Redirigir a login
    const { redirect } = await import('next/navigation')
    redirect('/login')
  }
  
  return user!
}

/**
 * Middleware helper: Verificar que el usuario es admin
 */
export async function requireAdmin(): Promise<PBUser> {
  const user = await requireAuth()
  const isAdmin = await isServerUserAdmin()
  
  if (!isAdmin) {
    // Redirigir a dashboard o acceso denegado
    const { redirect } = await import('next/navigation')
    redirect('/dashboard')
  }
  
  return user
}