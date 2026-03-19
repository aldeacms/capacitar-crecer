/**
 * Centralized authentication helpers
 * Use these in server actions and layouts to enforce auth and authorization
 *
 * CRITICAL: After Phase 5A database fixes:
 * - Admin status is checked via admin_users table (not rol field in perfiles)
 * - Admins must have entry in admin_users with is_active=true
 */

import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

export interface AuthUser {
  id: string
  email: string
}

/**
 * Get current authenticated user without redirecting
 * Returns null if not authenticated
 */
export async function getAuthUser(): Promise<AuthUser | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  return {
    id: user.id,
    email: user.email || '',
  }
}

/**
 * Require authenticated user - redirects to /login if not authenticated
 * Uses getUser() (secure) instead of getSession()
 *
 * @returns User with id and email
 * @throws Redirect to /login if not authenticated
 */
export async function requireAuth(): Promise<AuthUser> {
  const user = await getAuthUser()

  if (!user) {
    redirect('/login')
  }

  return user
}

/**
 * Check if user is admin by querying admin_users table
 * Admin status is determined by presence in admin_users table with is_active=true
 *
 * @param userId UUID of user to check
 * @returns true if user is active admin
 */
async function isUserAdmin(userId: string): Promise<boolean> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('admin_users')
    .select('id')
    .eq('id', userId)
    .eq('is_active', true)
    .single()

  return !!data
}

/**
 * Require admin user - redirects to /login if not authenticated or not admin
 * Calls requireAuth() first, then checks admin_users table
 *
 * @returns User with id and email (confirmed admin)
 * @throws Redirect to /login if not authenticated or not admin
 */
export async function requireAdmin(): Promise<AuthUser> {
  const user = await requireAuth()

  // Check if user is admin in admin_users table
  const isAdmin = await isUserAdmin(user.id)

  if (!isAdmin) {
    // User is authenticated but not admin
    redirect('/login')
  }

  return user
}
