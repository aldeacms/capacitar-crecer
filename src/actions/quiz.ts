'use server'

import { revalidatePath } from 'next/cache'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/auth'

export async function saveQuestion(data: {
  leccion_id: string
  texto: string
  tipo: 'multiple' | 'vf' | 'abierta' | 'pareados'
  puntos: number
  opciones: { texto: string; es_correcta: boolean; texto_pareado?: string }[]
}) {
  await requireAdmin()
  const supabaseAdmin = getSupabaseAdmin()

  try {
    // 1. Obtener el último orden para esta lección
    const { data: lastQuestion } = await supabaseAdmin
      .from('quizzes_preguntas')
      .select('orden')
      .eq('leccion_id', data.leccion_id)
      .order('orden', { ascending: false })
      .limit(1)
      .maybeSingle()

    const nextOrder = (lastQuestion?.orden || 0) + 1

    // 2. Insertar la pregunta con el nuevo orden
    const { data: question, error: qError } = await supabaseAdmin
      .from('quizzes_preguntas')
      .insert([{
        leccion_id: data.leccion_id,
        texto: data.texto,
        tipo: data.tipo,
        puntos: data.puntos,
        orden: nextOrder
      }])
      .select()
      .single()

    if (qError) {
      console.error('Error inserting question:', qError)
      throw new Error(qError.message)
    }

    // 3. Insertar las opciones si no es abierta
    if (data.tipo !== 'abierta' && data.opciones.length > 0) {
      let opcionesFinales: Array<{
        pregunta_id: string
        texto: string
        es_correcta: boolean
        orden: number
      }> = []

      if (data.tipo === 'pareados') {
        // Para pareados: primero todos los términos A, luego todos los términos B
        // Términos A (índices 0..N-1) con orden 1..N
        const terms = data.opciones.map((opt, idx) => ({
          pregunta_id: question.id,
          texto: opt.texto,
          es_correcta: true,
          orden: idx + 1
        }))

        // Términos B (índices N..2N-1) con orden N+1..2N
        const answers = data.opciones.map((opt, idx) => ({
          pregunta_id: question.id,
          texto: opt.texto_pareado || '',
          es_correcta: true,
          orden: data.opciones.length + idx + 1
        }))

        opcionesFinales = [...terms, ...answers]
      } else {
        // Para multiple y vf: cada opción con su orden
        opcionesFinales = data.opciones.map((opt, idx) => ({
          pregunta_id: question.id,
          texto: opt.texto,
          es_correcta: opt.es_correcta,
          orden: idx + 1
        }))
      }

      const { error: oError } = await supabaseAdmin
        .from('quizzes_opciones')
        .insert(opcionesFinales)

      if (oError) {
        console.error('Error inserting options:', oError)
        throw new Error(`Pregunta creada, pero error en opciones: ${oError.message}`)
      }
    }

    // Revalidar el path específico del quiz para que se actualice la lista
    revalidatePath(`/admin/cursos/[id]/lecciones/[leccion_id]/quiz`, 'page')
    revalidatePath('/admin/cursos', 'layout')

    return { success: true }
  } catch (error: unknown) {
    console.error('CRITICAL ERROR in saveQuestion:', error)
    return { error: (error as Error).message || String(error) }
  }
}

export async function updateQuestion(data: {
  id: string
  texto: string
  tipo: 'multiple' | 'vf' | 'abierta' | 'pareados'
  puntos: number
  opciones: { id?: string; texto: string; es_correcta: boolean; texto_pareado?: string }[]
  leccionId: string
}) {
  await requireAdmin()
  const supabaseAdmin = getSupabaseAdmin()

  try {
    // 1. Actualizar la pregunta
    const { error: updateError } = await supabaseAdmin
      .from('quizzes_preguntas')
      .update({
        texto: data.texto,
        tipo: data.tipo,
        puntos: data.puntos
      })
      .eq('id', data.id)

    if (updateError) {
      throw new Error(`Error actualizando pregunta: ${updateError.message}`)
    }

    // 2. Eliminar opciones antiguas
    const { error: deleteError } = await supabaseAdmin
      .from('quizzes_opciones')
      .delete()
      .eq('pregunta_id', data.id)

    if (deleteError) {
      throw new Error(`Error eliminando opciones antiguas: ${deleteError.message}`)
    }

    // 3. Insertar nuevas opciones si no es abierta
    if (data.tipo !== 'abierta' && data.opciones.length > 0) {
      let opcionesFinales: Array<{
        pregunta_id: string
        texto: string
        es_correcta: boolean
        orden: number
      }> = []

      if (data.tipo === 'pareados') {
        const terms = data.opciones.map((opt, idx) => ({
          pregunta_id: data.id,
          texto: opt.texto,
          es_correcta: true,
          orden: idx + 1
        }))

        const answers = data.opciones.map((opt, idx) => ({
          pregunta_id: data.id,
          texto: opt.texto_pareado || '',
          es_correcta: true,
          orden: data.opciones.length + idx + 1
        }))

        opcionesFinales = [...terms, ...answers]
      } else {
        opcionesFinales = data.opciones.map((opt, idx) => ({
          pregunta_id: data.id,
          texto: opt.texto,
          es_correcta: opt.es_correcta,
          orden: idx + 1
        }))
      }

      const { error: insertError } = await supabaseAdmin
        .from('quizzes_opciones')
        .insert(opcionesFinales)

      if (insertError) {
        throw new Error(`Error insertando nuevas opciones: ${insertError.message}`)
      }
    }

    revalidatePath(`/admin/cursos/[id]/lecciones/[leccion_id]/quiz`, 'page')
    revalidatePath('/admin/cursos', 'layout')

    return { success: true }
  } catch (error: unknown) {
    console.error('CRITICAL ERROR in updateQuestion:', error)
    return { error: (error as Error).message || String(error) }
  }
}

export async function updateQuestionsOrder(questions: { id: string; orden: number }[]) {
  await requireAdmin()
  const supabaseAdmin = getSupabaseAdmin()

  try {
    const { error } = await supabaseAdmin
      .from('quizzes_preguntas')
      .upsert(questions.map(q => ({ id: q.id, orden: q.orden })), { onConflict: 'id' })

    if (error) {
      console.error('Error updating questions order:', error)
      return { success: false, error: error.message }
    }

    revalidatePath(`/admin/cursos/[id]/lecciones/[leccion_id]/quiz`, 'page')
    revalidatePath('/admin/cursos', 'layout')
    return { success: true }
  } catch (error: unknown) {
    console.error('CRITICAL ERROR in updateQuestionsOrder:', error)
    return { success: false, error: (error as Error).message || String(error) }
  }
}

export async function deleteQuestion(id: string) {
  await requireAdmin()
  const supabaseAdmin = getSupabaseAdmin()

  try {
    const { error } = await supabaseAdmin
      .from('quizzes_preguntas')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting question:', error)
      throw new Error(error.message)
    }

    revalidatePath(`/admin/cursos/[id]/lecciones/[leccion_id]/quiz`, 'page')
    revalidatePath('/admin/cursos', 'layout')
    return { success: true }
  } catch (error: unknown) {
    console.error('CRITICAL ERROR in deleteQuestion:', error)
    return { error: (error as Error).message || String(error) }
  }
}

export async function uploadQuestionImage(formData: FormData) {
  await requireAdmin()
  const file = formData.get('imagen') as File

  if (!file) {
    return { error: 'No image provided' }
  }

  const fileExt = file.name.split('.').pop()
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
  const supabaseAdmin = getSupabaseAdmin()

  try {
    const { error: uploadError } = await supabaseAdmin.storage
      .from('imagenes_preguntas')
      .upload(fileName, file, { upsert: true })

    if (uploadError) {
      console.error('Error uploading image:', uploadError)
      throw new Error(uploadError.message)
    }

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('imagenes_preguntas')
      .getPublicUrl(fileName)

    return { url: publicUrl }
  } catch (error: unknown) {
    console.error('CRITICAL ERROR in uploadQuestionImage:', error)
    return { error: (error as Error).message || String(error) }
  }
}
