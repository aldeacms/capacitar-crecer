'use server'

import { revalidatePath } from 'next/cache'

import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/auth'
import { CategorySchema } from '@/lib/validations'
import { z } from 'zod'

// Al crear: auto-append numérico si el slug base ya existe
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function uniqueSlugForCreate(supabase: any, table: string, baseSlug: string): Promise<string> {
  let slug = baseSlug
  let counter = 1
  while (true) {
    const { data } = await supabase.from(table).select('id').eq('slug', slug).maybeSingle()
    if (!data) return slug
    counter++
    slug = `${baseSlug}-${counter}`
  }
}

// Al editar: sólo verifica si el slug ya está en uso por otro registro
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function slugTakenByOther(supabase: any, table: string, slug: string, currentId: string): Promise<boolean> {
  const { data } = await supabase.from(table).select('id').eq('slug', slug).neq('id', currentId).maybeSingle()
  return !!data
}

export async function getCategories() {
  // No requiere autenticación de admin - es solo lectura
  const supabaseAdmin = getSupabaseAdmin()
  const { data, error } = await supabaseAdmin
    .from('categorias')
    .select('id, nombre, slug, descripcion, imagen_url')
    .order('nombre', { ascending: true })

  if (error) {
    console.error('Error fetching categories:', error)
    return []
  }
  return data || []
}

export async function createCategory(formData: FormData) {
  await requireAdmin()

  const nombre = formData.get('nombre') as string
  const slug = formData.get('slug') as string
  const descripcion = formData.get('descripcion') as string
  const imageFile = formData.get('imagen_file') as File | null
  let imagen_url = ''

  // Validar input
  const parsed = CategorySchema.safeParse({ nombre, slug, descripcion })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Datos de categoría inválidos' }
  }

  const supabaseAdmin = getSupabaseAdmin()

  try {
    const finalSlug = await uniqueSlugForCreate(supabaseAdmin, 'categorias', slug)

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

  const nombre = formData.get('nombre') as string
  const slug = formData.get('slug') as string
  const descripcion = formData.get('descripcion') as string
  const imageFile = formData.get('imagen_file') as File | null
  let imagen_url = formData.get('current_imagen_url') as string

  // Validar ID
  const idParsed = z.string().uuid().safeParse(id)
  if (!idParsed.success) {
    return { error: 'ID de categoría inválido' }
  }

  // Validar datos
  const parsed = CategorySchema.safeParse({ nombre, slug, descripcion })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Datos de categoría inválidos' }
  }

  const supabaseAdmin = getSupabaseAdmin()

  try {
    if (await slugTakenByOther(supabaseAdmin, 'categorias', slug, id)) {
      return { error: `El slug "${slug}" ya está en uso por otra categoría. Elige uno diferente.` }
    }
    const finalSlug = slug

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
