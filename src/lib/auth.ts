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
 * Falls back to checking rol field in perfiles if admin_users doesn't exist yet
 *
 * @param userId UUID of user to check
 * @returns true if user is active admin
 */
async function isUserAdmin(userId: string): Promise<boolean> {
  const supabase = await createClient()

  // Method 1: Check admin_users table (primary method)
  try {
    const { data } = await (supabase as any)
      .from('admin_users')
      .select('id')
      .eq('id', userId)
      .eq('is_active', true)
      .single()

    if (data) {
      return true
    }
  } catch (error) {
    // admin_users table might not exist yet or user not found
    // Fall through to method 2
  }

  // Method 2: Fallback - check perfiles table rol field (during transition)
  try {
    const { data } = await supabase
      .from('perfiles')
      .select('rol')
      .eq('id', userId)
      .single()

    if (data?.rol === 'admin') {
      return true
    }
  } catch (error) {
    // perfiles also might not have rol field anymore
    // or user not found, which is fine
  }

  return false
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
