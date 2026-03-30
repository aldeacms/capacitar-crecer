/* eslint-disable @typescript-eslint/no-explicit-any */
'use server'

import { revalidatePath } from 'next/cache'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/auth'
import { z } from 'zod'
import type { Database } from '@/types/database.types'
import type { SupabaseClient } from '@supabase/supabase-js'


// --- MÓDULOS ---

export async function createModule(data: { curso_id: string, titulo: string, orden: number }) {
  await requireAdmin()
  const supabaseAdmin = getSupabaseAdmin()

  try {
    const { data: lastModule } = await supabaseAdmin
      .from('modulos')
      .select('orden')
      .eq('curso_id', data.curso_id)
      .order('orden', { ascending: false })
      .limit(1)
      .maybeSingle()

    const nextOrder = (lastModule?.orden || 0) + 1

    const { error } = await supabaseAdmin
      .from('modulos')
      .insert([{ ...data, orden: nextOrder }])

    if (error) throw error

    revalidatePath(`/admin/cursos/${data.curso_id}`)
    return { success: true }
  } catch (error: unknown) {
    console.error('CRITICAL ERROR in createModule:', error)
    return { error: (error as Error).message || String(error) }
  }
}

export async function updateModule(id: string, titulo: string, cursoId: string) {
  await requireAdmin()
  const supabaseAdmin = getSupabaseAdmin()
  try {
    const { error } = await supabaseAdmin
      .from('modulos')
      .update({ titulo })
      .eq('id', id)

    if (error) throw error
    revalidatePath(`/admin/cursos/${cursoId}`)
    return { success: true }
  } catch (error: unknown) {
    console.error('CRITICAL ERROR in updateModule:', error)
    return { error: (error as Error).message || String(error) }
  }
}

export async function deleteModule(id: string, cursoId: string) {
  await requireAdmin()
  const supabaseAdmin = getSupabaseAdmin()
  try {
    const { error } = await supabaseAdmin
      .from('modulos')
      .delete()
      .eq('id', id)

    if (error) throw error
    revalidatePath(`/admin/cursos/${cursoId}`)
    return { success: true }
  } catch (error: any) {
    console.error('CRITICAL ERROR in deleteModule:', error)
    return { error: error.message }
  }
}


// --- LECCIONES ---

export async function createLesson(formData: FormData) {
  await requireAdmin()
  const supabaseAdmin = getSupabaseAdmin() as SupabaseClient<Database>

  const modulo_id = formData.get('modulo_id') as string
  const curso_id = formData.get('curso_id') as string
  const titulo = formData.get('titulo') as string
  const tipo = formData.get('tipo') as Database['public']['Enums']['tipo_leccion']
  const video_url = formData.get('video_url') as string | null
  const contenido_html = formData.get('contenido_html') as string | null

  // Validar campos requeridos
  const parsed = z.object({
    modulo_id: z.string().uuid(),
    curso_id: z.string().uuid(),
    titulo: z.string().min(1),
  }).safeParse({ modulo_id, curso_id, titulo })

  if (!parsed.success) {
    const zodError = parsed.error.issues[0]?.message || 'Datos de lección inválidos'
    console.error('createLesson ZOD VALIDATION FAILED:', zodError, { modulo_id, curso_id, titulo })
    return { error: zodError }
  }

  try {
    const { data: lastLesson } = await supabaseAdmin
      .from('lecciones')
      .select('orden')
      .eq('modulo_id', modulo_id)
      .order('orden', { ascending: false })
      .limit(1)
      .maybeSingle()

    const nextOrder = (lastLesson?.orden || 0) + 1

    const lessonData: Database['public']['Tables']['lecciones']['Insert'] = {
      modulo_id,
      titulo,
      tipo,
      video_url: video_url || null,
      contenido_html: contenido_html || null,
      orden: nextOrder
    }

    const { data: newLesson, error: lessonError } = await supabaseAdmin
      .from('lecciones')
      .insert([lessonData])
      .select()
      .single()

    if (lessonError) throw lessonError

    revalidatePath(`/admin/cursos/${curso_id}`)
    return { success: true, leccionId: newLesson.id }
  } catch (error: any) {
    console.error('CRITICAL ERROR in createLesson:', error)
    return { error: error.message }
  }
}

export async function updateLesson(formData: FormData) {
  await requireAdmin()
  const supabaseAdmin = getSupabaseAdmin() as SupabaseClient<Database>
  const id = formData.get('id') as string
  const curso_id = formData.get('curso_id') as string
  const titulo = formData.get('titulo') as string
  const tipo = formData.get('tipo') as Database['public']['Enums']['tipo_leccion']
  const video_url = formData.get('video_url') as string | null
  const contenido_html = formData.get('contenido_html') as string | null

  try {
    const updateData: Database['public']['Tables']['lecciones']['Update'] = {
      titulo,
      tipo,
      video_url: video_url || null,
      contenido_html: contenido_html || null
    }

    const { error: updateError } = await supabaseAdmin
      .from('lecciones')
      .update(updateData)
      .eq('id', id)

    if (updateError) throw updateError

    revalidatePath(`/admin/cursos/${curso_id}`)
    return { success: true }
  } catch (error: any) {
    console.error('CRITICAL ERROR in updateLesson:', error)
    return { error: error.message }
  }
}

export async function deleteLesson(id: string, cursoId: string) {
  await requireAdmin()
  const supabaseAdmin = getSupabaseAdmin()
  try {
    const { error } = await supabaseAdmin
      .from('lecciones')
      .delete()
      .eq('id', id)

    if (error) throw error
    revalidatePath(`/admin/cursos/${cursoId}`)
    return { success: true }
  } catch (error: any) {
    console.error('CRITICAL ERROR in deleteLesson:', error)
    return { error: error.message }
  }
}

export async function deleteLessonFile(fileId: string, filePath: string, cursoId: string) {
  await requireAdmin()
  const supabaseAdmin = getSupabaseAdmin()
  try {
    // 1. Borrar de la base de datos
    const { error: dbError } = await supabaseAdmin
      .from('lecciones_archivos')
      .delete()
      .eq('id', fileId)
    
    if (dbError) throw dbError

    // 2. Borrar del storage
    // El filePath debe ser relativo al bucket 'archivos_lecciones'
    // Extraemos el path del URL público si no viene directo
    let actualPath = filePath
    if (filePath.includes('/public/')) {
        actualPath = filePath.split('/archivos_lecciones/')[1]
    }

    await supabaseAdmin.storage
      .from('archivos_lecciones')
      .remove([actualPath])

    revalidatePath(`/admin/cursos/${cursoId}`)
    return { success: true }
  } catch (error: any) {
    console.error('CRITICAL ERROR in deleteLessonFile:', error)
    return { error: error.message }
  }
}


// --- ORDENAMIENTO (DRAG & DROP) ---

export async function updateCurriculumOrder(
  type: 'module' | 'lesson',
  items: { id: string, orden: number }[],
  cursoId: string
) {
  await requireAdmin()
  const supabaseAdmin = getSupabaseAdmin()
  const table = type === 'module' ? 'modulos' : 'lecciones'

  try {
    // Batch update: actualizar orden para todos los items de una vez
    const { error } = await supabaseAdmin
      .from(table)
      .upsert(
        items.map(item => ({ id: item.id, orden: item.orden })),
        { onConflict: 'id' }
      )

    if (error) throw error

    revalidatePath(`/admin/cursos/${cursoId}`)
    return { success: true }
  } catch (error: any) {
    console.error(`CRITICAL ERROR in updateCurriculumOrder (${type}):`, error)
    return { error: error.message }
  }
}


// --- MOVIMIENTOS (DEPRECATED by Drag & Drop, but kept for safety) ---

export async function moveModule(id: string, cursoId: string, direction: 'up' | 'down') {
  await requireAdmin()
  const supabaseAdmin = getSupabaseAdmin()
  try {
    const { data: modules } = await supabaseAdmin
      .from('modulos')
      .select('id, orden')
      .eq('curso_id', cursoId)
      .order('orden', { ascending: true })

    if (!modules) throw new Error('No se encontraron módulos')
    const index = modules.findIndex((m: any) => m.id === id)
    if (index === -1) throw new Error('Módulo no encontrado')

    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= modules.length) return { success: true }

    const current = modules[index]
    const target = modules[targetIndex]

    await supabaseAdmin.from('modulos').update({ orden: target.orden }).eq('id', current.id)
    await supabaseAdmin.from('modulos').update({ orden: current.orden }).eq('id', target.id)

    revalidatePath(`/admin/cursos/${cursoId}`)
    return { success: true }
  } catch (error: any) {
    console.error('CRITICAL ERROR in moveModule:', error)
    return { error: error.message }
  }
}

export async function moveLesson(id: string, moduloId: string, cursoId: string, direction: 'up' | 'down') {
  await requireAdmin()
  const supabaseAdmin = getSupabaseAdmin()
  try {
    const { data: lessons } = await supabaseAdmin
      .from('lecciones')
      .select('id, orden')
      .eq('modulo_id', moduloId)
      .order('orden', { ascending: true })

    if (!lessons) throw new Error('No se encontraron lecciones')
    const index = lessons.findIndex((l: any) => l.id === id)
    if (index === -1) throw new Error('Lección no encontrada')

    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= lessons.length) return { success: true }

    const current = lessons[index]
    const target = lessons[targetIndex]

    await supabaseAdmin.from('lecciones').update({ orden: target.orden }).eq('id', current.id)
    await supabaseAdmin.from('lecciones').update({ orden: current.orden }).eq('id', target.id)

    revalidatePath(`/admin/cursos/${cursoId}`)
    return { success: true }
  } catch (error: any) {
    console.error('CRITICAL ERROR in moveLesson:', error)
    return { error: error.message }
  }
}
