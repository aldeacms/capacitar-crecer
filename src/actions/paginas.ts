'use server'

import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export interface Pagina {
  id: string
  slug: string
  titulo: string
  contenido_html: string
  meta_title: string | null
  meta_description: string | null
  publicada: boolean
  created_at: string
  updated_at: string
}

export async function getPaginas(): Promise<Pagina[]> {
  await requireAdmin()
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('paginas')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error loading paginas:', error)
    return []
  }
  return data as Pagina[]
}

export async function getPaginaById(id: string): Promise<Pagina | null> {
  await requireAdmin()
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('paginas')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return data as Pagina
}

export async function getPaginaBySlug(slug: string): Promise<Pagina | null> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('paginas')
    .select('*')
    .eq('slug', slug)
    .eq('publicada', true)
    .single()

  if (error) return null
  return data as Pagina
}

export async function upsertPagina(
  data: Omit<Pagina, 'id' | 'created_at' | 'updated_at'> & { id?: string }
): Promise<{ success: true; id: string } | { error: string }> {
  await requireAdmin()
  const supabase = getSupabaseAdmin()

  const { id, ...fields } = data

  let result
  if (id) {
    result = await supabase
      .from('paginas')
      .update(fields)
      .eq('id', id)
      .select('id')
      .single()
  } else {
    result = await supabase
      .from('paginas')
      .insert(fields)
      .select('id')
      .single()
  }

  if (result.error) {
    console.error('Error upserting pagina:', result.error)
    return { error: result.error.message }
  }

  revalidatePath('/admin/paginas')
  revalidatePath(`/${data.slug}`)
  return { success: true, id: result.data.id }
}

export async function togglePublicarPagina(
  id: string,
  publicada: boolean
): Promise<{ success: true } | { error: string }> {
  await requireAdmin()
  const supabase = getSupabaseAdmin()

  const { error } = await supabase
    .from('paginas')
    .update({ publicada })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/admin/paginas')
  return { success: true }
}

export async function deletePagina(id: string): Promise<{ success: true } | { error: string }> {
  await requireAdmin()
  const supabase = getSupabaseAdmin()

  const { error } = await supabase.from('paginas').delete().eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/admin/paginas')
  return { success: true }
}
