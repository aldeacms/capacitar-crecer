'use server'

import { revalidatePath } from 'next/cache'

import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/auth'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function ensureUniqueSlug(supabase: any, table: string, baseSlug: string, currentId?: string) {
  let uniqueSlug = baseSlug
  let counter = 1
  let exists = true

  while (exists) {
    let query = supabase
      .from(table)
      .select('id')
      .eq('slug', uniqueSlug)
    
    if (currentId) {
      query = query.neq('id', currentId)
    }

    const { data } = await query.maybeSingle()

    if (!data) {
      exists = false
    } else {
      counter++
      uniqueSlug = `${baseSlug}-${counter}`
    }
  }

  return uniqueSlug
}

export async function getCategories() {
  await requireAdmin()
  const supabaseAdmin = getSupabaseAdmin()
  const { data, error } = await supabaseAdmin
    .from('categorias')
    .select('*')
    .order('nombre', { ascending: true })
  
  if (error) {
    console.error('Error fetching categories:', error)
    return []
  }
  return data
}

export async function createCategory(formData: FormData) {
  await requireAdmin()
  const supabaseAdmin = getSupabaseAdmin()

  const nombre = formData.get('nombre') as string
  const slug = formData.get('slug') as string
  const descripcion = formData.get('descripcion') as string
  const imageFile = formData.get('imagen_file') as File | null
  let imagen_url = ''

  try {
    const finalSlug = await ensureUniqueSlug(supabaseAdmin, 'categorias', slug)

    if (imageFile && imageFile.size > 0) {
      const fileExt = imageFile.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `categorias/${fileName}`

      const { error: uploadError } = await supabaseAdmin.storage
        .from('imagenes_cursos')
        .upload(filePath, imageFile)

      if (uploadError) throw uploadError
      
      const { data: { publicUrl } } = supabaseAdmin.storage
        .from('imagenes_cursos')
        .getPublicUrl(filePath)
      
      imagen_url = publicUrl
    }

    const { error: insertError } = await supabaseAdmin
      .from('categorias')
      .insert([{ nombre, slug: finalSlug, descripcion, imagen_url }])

    if (insertError) throw insertError

    revalidatePath('/admin/categorias')
    return { success: true }
  } catch (error: unknown) {
    console.error('Error creating category:', error)
    return { error: (error as Error).message || String(error) }
  }
}

export async function updateCategory(id: string, formData: FormData) {
  await requireAdmin()
  const supabaseAdmin = getSupabaseAdmin()

  const nombre = formData.get('nombre') as string
  const slug = formData.get('slug') as string
  const descripcion = formData.get('descripcion') as string
  const imageFile = formData.get('imagen_file') as File | null
  let imagen_url = formData.get('current_imagen_url') as string

  try {
    const finalSlug = await ensureUniqueSlug(supabaseAdmin, 'categorias', slug, id)

    if (imageFile && imageFile.size > 0) {
      const fileExt = imageFile.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `categorias/${fileName}`

      const { error: uploadError } = await supabaseAdmin.storage
        .from('imagenes_cursos')
        .upload(filePath, imageFile)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabaseAdmin.storage
        .from('imagenes_cursos')
        .getPublicUrl(filePath)
      
      imagen_url = publicUrl
    }

    const { error: updateError } = await supabaseAdmin
      .from('categorias')
      .update({ nombre, slug: finalSlug, descripcion, imagen_url })
      .eq('id', id)

    if (updateError) throw updateError

    revalidatePath('/admin/categorias')
    return { success: true }
  } catch (error: unknown) {
    console.error('Error updating category:', error)
    return { error: (error as Error).message || String(error) }
  }
}

export async function deleteCategory(id: string) {
  await requireAdmin()
  const supabaseAdmin = getSupabaseAdmin()
  try {
    const { error } = await supabaseAdmin
      .from('categorias')
      .delete()
      .eq('id', id)

    if (error) throw error

    revalidatePath('/admin/categorias')
    return { success: true }
  } catch (error: unknown) {
    console.error('Error deleting category:', error)
    return { error: (error as Error).message || String(error) }
  }
}
