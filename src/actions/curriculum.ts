/* eslint-disable @typescript-eslint/no-explicit-any */
'use server'

import { revalidatePath } from 'next/cache'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

// Límite máximo de carga: 50 MB
const MAX_UPLOAD_SIZE = 50 * 1024 * 1024
const MAX_UPLOAD_SIZE_MB = 50

/**
 * Calcula el tamaño total de los archivos en FormData
 */
function getTotalFormDataSize(formData: FormData): number {
  let totalSize = 0
  const files = formData.getAll('archivos') as File[]
  for (const file of files) {
    totalSize += file.size
  }
  return totalSize
}

// --- MÓDULOS ---

export async function createModule(data: { curso_id: string, titulo: string, orden: number }) {
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
  const supabaseAdmin = getSupabaseAdmin()

  const modulo_id = formData.get('modulo_id') as string
  const curso_id = formData.get('curso_id') as string
  const titulo = formData.get('titulo') as string
  const tipo = formData.get('tipo') as 'video' | 'texto' | 'quiz'
  const video_url = formData.get('video_url') as string
  const contenido_html = formData.get('contenido_html') as string
  const files = formData.getAll('archivos') as File[]

  // Validar tamaño total de archivos
  const totalSize = getTotalFormDataSize(formData)
  if (totalSize > MAX_UPLOAD_SIZE) {
    const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2)
    return {
      error: `El tamaño total de los archivos (${totalSizeMB} MB) supera el límite permitido de ${MAX_UPLOAD_SIZE_MB} MB.`
    }
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

    const { data: newLesson, error: lessonError } = await supabaseAdmin
      .from('lecciones')
      .insert([{
        modulo_id,
        titulo,
        tipo,
        video_url,
        contenido_html,
        orden: nextOrder
      }])
      .select()
      .single()

    if (lessonError) throw lessonError

    if (files && files.length > 0) {
      for (const file of files) {
        if (file.size === 0) continue

        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
        const filePath = `${curso_id}/${newLesson.id}/${fileName}`

        const { error: uploadError } = await supabaseAdmin.storage
          .from('archivos_lecciones')
          .upload(filePath, file)

        if (uploadError) continue

        const { data: { publicUrl } } = supabaseAdmin.storage
          .from('archivos_lecciones')
          .getPublicUrl(filePath)
        
        await supabaseAdmin
          .from('lecciones_archivos')
          .insert([{
            leccion_id: newLesson.id,
            nombre_archivo: file.name,
            archivo_url: publicUrl
          }])
      }
    }

    revalidatePath(`/admin/cursos/${curso_id}`)
    return { success: true }
  } catch (error: any) {
    console.error('CRITICAL ERROR in createLesson:', error)
    return { error: error.message }
  }
}

export async function updateLesson(formData: FormData) {
  const supabaseAdmin = getSupabaseAdmin()
  const id = formData.get('id') as string
  const curso_id = formData.get('curso_id') as string
  const titulo = formData.get('titulo') as string
  const tipo = formData.get('tipo') as any
  const video_url = formData.get('video_url') as string
  const contenido_html = formData.get('contenido_html') as string
  const files = formData.getAll('archivos') as File[]

  // Validar tamaño total de archivos
  const totalSize = getTotalFormDataSize(formData)
  if (totalSize > MAX_UPLOAD_SIZE) {
    const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2)
    return {
      error: `El tamaño total de los archivos (${totalSizeMB} MB) supera el límite permitido de ${MAX_UPLOAD_SIZE_MB} MB.`
    }
  }

  try {
    const { error: updateError } = await supabaseAdmin
      .from('lecciones')
      .update({
        titulo,
        tipo,
        video_url,
        contenido_html
      })
      .eq('id', id)

    if (updateError) throw updateError

    if (files && files.length > 0) {
        for (const file of files) {
          if (file.size === 0) continue
  
          const fileExt = file.name.split('.').pop()
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
          const filePath = `${curso_id}/${id}/${fileName}`
  
          const { error: uploadError } = await supabaseAdmin.storage
            .from('archivos_lecciones')
            .upload(filePath, file)
  
          if (uploadError) continue
  
          const { data: { publicUrl } } = supabaseAdmin.storage
            .from('archivos_lecciones')
            .getPublicUrl(filePath)
          
          await supabaseAdmin
            .from('lecciones_archivos')
            .insert([{
              leccion_id: id,
              nombre_archivo: file.name,
              archivo_url: publicUrl
            }])
        }
      }

    revalidatePath(`/admin/cursos/${curso_id}`)
    return { success: true }
  } catch (error: any) {
    console.error('CRITICAL ERROR in updateLesson:', error)
    return { error: error.message }
  }
}

export async function deleteLesson(id: string, cursoId: string) {
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
  const supabaseAdmin = getSupabaseAdmin()
  const table = type === 'module' ? 'modulos' : 'lecciones'

  try {
    // Actualizamos secuencialmente para garantizar consistencia y evitar líos de triggers/PKs
    for (const item of items) {
      const { error } = await supabaseAdmin
        .from(table)
        .update({ orden: item.orden })
        .eq('id', item.id)
      
      if (error) throw error
    }

    revalidatePath(`/admin/cursos/${cursoId}`)
    return { success: true }
  } catch (error: any) {
    console.error(`CRITICAL ERROR in updateCurriculumOrder (${type}):`, error)
    return { error: error.message }
  }
}


// --- MOVIMIENTOS (DEPRECATED by Drag & Drop, but kept for safety) ---

export async function moveModule(id: string, cursoId: string, direction: 'up' | 'down') {
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
