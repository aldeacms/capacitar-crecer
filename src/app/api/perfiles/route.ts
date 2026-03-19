/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase-server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { nombre_completo, rut, telefono } = body

    const serverSupabase = await createServerClient()
    const { data: { user }, error: userError } = await serverSupabase.auth.getUser()
    if (userError || !user) return NextResponse.json({ ok: false, error: 'NO_SESSION' }, { status: 401 })

    const admin = createAdminClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const { error } = await admin.from('perfiles').upsert({
      id: user.id,
      nombre_completo: nombre_completo || user.user_metadata?.full_name || user.email || 'Alumno',
      rut: rut || user.id,
      telefono: telefono || null,
      rol: 'alumno'
    })

    if (error) {
      console.error('API perfiles upsert error:', error)
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('API /perfiles error:', err)
    return NextResponse.json({ ok: false, error: err.message || String(err) }, { status: 500 })
  }
}

