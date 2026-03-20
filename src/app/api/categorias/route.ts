import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabaseAdmin = getSupabaseAdmin()

    const { data, error } = await supabaseAdmin
      .from('categorias')
      .select('id, nombre, slug, descripcion, imagen_url, created_at')
      .order('nombre', { ascending: true })

    if (error) {
      console.error('Error fetching categories:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (err: any) {
    console.error('API /categorias error:', err)
    return NextResponse.json({ error: err.message || 'Error fetching categories' }, { status: 500 })
  }
}
