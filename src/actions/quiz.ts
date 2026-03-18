'use server'

import { revalidatePath } from 'next/cache'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function saveQuestion(data: {
  leccion_id: string
  texto: string
  tipo: 'multiple' | 'vf' | 'abierta' | 'pareados'
  puntos: number
  opciones: { texto: string; es_correcta: boolean; texto_pareado?: string }[]
}) {
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
      const opcionesToInsert = data.opciones.map(opt => ({
        pregunta_id: question.id,
        texto: opt.texto,
        es_correcta: opt.es_correcta,
        texto_pareado: opt.texto_pareado || null
      }))

      const { error: oError } = await supabaseAdmin
        .from('quizzes_opciones')
        .insert(opcionesToInsert)

      if (oError) {
        console.error('Error inserting options:', oError)
        throw new Error(`Pregunta creada, pero error en opciones: ${oError.message}`)
      }
    }

    revalidatePath(`/admin/cursos`, 'layout')
    return { success: true }
  } catch (error: unknown) {
    console.error('CRITICAL ERROR in saveQuestion:', error)
    return { error: (error as Error).message || String(error) }
  }
}

export async function updateQuestionsOrder(questions: { id: string; orden: number }[]) {
  const supabaseAdmin = getSupabaseAdmin()

  try {
    // Usamos upsert para actualización masiva del orden
    const { error } = await supabaseAdmin
      .from('quizzes_preguntas')
      .upsert(questions.map(q => ({ id: q.id, orden: q.orden })), { onConflict: 'id' })

    if (error) {
      console.error('Error updating questions order:', error)
      throw new Error(error.message)
    }

    revalidatePath(`/admin/cursos`, 'layout')
    return { success: true }
  } catch (error: unknown) {
    console.error('CRITICAL ERROR in updateQuestionsOrder:', error)
    return { success: true, error: (error as Error).message || String(error) }
  }
}

export async function deleteQuestion(id: string) {
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
    
    revalidatePath('/admin/cursos', 'layout')
    return { success: true }
  } catch (error: unknown) {
    console.error('CRITICAL ERROR in deleteQuestion:', error)
    return { error: (error as Error).message || String(error) }
  }
}
