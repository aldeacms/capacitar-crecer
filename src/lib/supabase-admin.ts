/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'

export function getSupabaseAdmin(): any {
  // Return typed client cast to any to avoid strict Postgrest typings blocking
  // calls to tables that may be out-of-sync with local generated types.
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  ) as any
}
