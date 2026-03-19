/**
 * Centralized authentication helpers
 * Use these in server actions and layouts to enforce auth and authorization
 */

import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

export interface AuthUser {
  id: string
  email: string
  role: 'admin' | 'alumno'
}

/**
 * Require authenticated user - redirects to /login if not authenticated
 * Uses getUser() (secure) instead of getSession()
 */
export async function requireAuth(): Promise<AuthUser> {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  // Fetch role from perfiles table
  const { data: perfil, error: perfilError } = await supabase
    .from('perfiles')
    .select('rol')
    .eq('id', user.id)
    .single()

  if (perfilError || !perfil) {
    // User exists in auth but not in perfiles - redirect to setup or login
    redirect('/login')
  }

  return {
    id: user.id,
    email: user.email!,
    role: (perfil.rol || 'alumno') as 'admin' | 'alumno',
  }
}

/**
 * Require admin user - redirects to /login if not authenticated or not admin
 * Calls requireAuth() first, then checks role
 */
export async function requireAdmin(): Promise<AuthUser> {
  const user = await requireAuth()

  if (user.role !== 'admin') {
    // User is authenticated but not admin
    redirect('/login')
  }

  return user
}
