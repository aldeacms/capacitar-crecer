import PocketBase from 'pocketbase'

// Tipos básicos para PocketBase (se expandirán según necesidad)
export interface PBRecord {
  id: string
  collectionId: string
  collectionName: string
  created: string
  updated: string
}

export interface PBUser extends PBRecord {
  username: string
  email: string
  emailVisibility: boolean
  verified: boolean
  name?: string
  avatar?: string
}

// Configuración de cliente PocketBase para navegador
export function createPocketBaseClient() {
  const url = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://localhost:8090'
  
  const client = new PocketBase(url)
  
  // Configurar auto-refresh de token (opcional)
  client.autoCancellation(false)
  
  return client
}

// Cliente singleton para uso en navegador
let pocketBaseClient: PocketBase | null = null

export function getPocketBaseClient(): PocketBase {
  if (!pocketBaseClient) {
    pocketBaseClient = createPocketBaseClient()
  }
  
  // Verificar si hay token almacenado y restaurar sesión
  if (typeof window !== 'undefined') {
    const token = pocketBaseClient.authStore.token
    const model = pocketBaseClient.authStore.model
    
    if (token && model) {
      // Ya autenticado, token se mantiene automáticamente
      console.debug('PocketBase: Sesión restaurada desde localStorage')
    }
  }
  
  return pocketBaseClient
}

// Helper para autenticación con email/password
export async function signInWithEmail(email: string, password: string) {
  const pb = getPocketBaseClient()
  
  try {
    const authData = await pb.collection('users').authWithPassword(email, password)
    
    // Establecer cookie de sesión para el servidor
    if (typeof window !== 'undefined') {
      try {
        await fetch('/api/auth/pocketbase/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: authData.token,
            model: authData.record
          })
        })
      } catch (fetchError) {
        console.warn('No se pudo establecer cookie de sesión:', fetchError)
        // Continuar sin cookie; el servidor no reconocerá la sesión
      }
    }
    
    return { success: true, user: authData.record, token: authData.token }
  } catch (error: any) {
    console.error('Error de autenticación PocketBase:', error)
    return { success: false, error: error.message }
  }
}

// Helper para registro
export async function signUpWithEmail(email: string, password: string, data?: Record<string, any>) {
  const pb = getPocketBaseClient()
  
  try {
    const userData = {
      email,
      password,
      passwordConfirm: password,
      ...data
    }
    
    const record = await pb.collection('users').create(userData)
    
    // Autenticar automáticamente después del registro
    const authData = await pb.collection('users').authWithPassword(email, password)
    
    // Establecer cookie de sesión para el servidor
    if (typeof window !== 'undefined') {
      try {
        await fetch('/api/auth/pocketbase/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: authData.token,
            model: authData.record
          })
        })
      } catch (fetchError) {
        console.warn('No se pudo establecer cookie de sesión:', fetchError)
        // Continuar sin cookie; el servidor no reconocerá la sesión
      }
    }
    
    return { success: true, user: authData.record, token: authData.token }
  } catch (error: any) {
    console.error('Error de registro PocketBase:', error)
    return { success: false, error: error.message }
  }
}

// Helper para cerrar sesión
export async function signOut() {
  const pb = getPocketBaseClient()
  pb.authStore.clear()
  
  if (typeof window !== 'undefined') {
    // Limpiar cookie de sesión en el servidor
    try {
      await fetch('/api/auth/pocketbase/session', {
        method: 'DELETE'
      })
    } catch (fetchError) {
      console.warn('No se pudo limpiar cookie de sesión:', fetchError)
    }
    
    // Redirigir a login o página principal
    window.location.href = '/login'
  }
  
  return { success: true }
}

// Helper para verificar autenticación actual
export function getCurrentUser(): PBUser | null {
  const pb = getPocketBaseClient()
  return pb.authStore.model as PBUser | null
}

// Helper para verificar si el usuario es admin
export function isUserAdmin(): boolean {
  const user = getCurrentUser()
  // En PocketBase, podríamos tener un campo 'role' o verificar en colección separada
  return user?.email === process.env.NEXT_PUBLIC_POCKETBASE_ADMIN_EMAIL || false
}