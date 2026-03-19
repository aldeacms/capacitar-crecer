'use server'

import { createClient } from '@/lib/supabase-server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/auth'
import { CuponSchema } from '@/lib/validations'

export async function getCupones() {
  await requireAdmin()
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('cupones')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return { error: error.message }
    }

    return data || []
  } catch (error: unknown) {
    return { error: (error as Error).message || String(error) }
  }
}

export async function createCupon(
  codigo: string,
  descuento_porcentaje: number,
  usos_maximos?: number
): Promise<{ success: true; cupon?: any } | { error: string }> {
  await requireAdmin()

  // Validar input con Zod
  const parsed = CuponSchema.safeParse({
    codigo,
    descuento_porcentaje,
    usos_maximos,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Datos de cupón inválidos' }
  }

  try {
    const admin = getSupabaseAdmin()

    const { data, error } = await admin
      .from('cupones')
      .insert({
        codigo: parsed.data.codigo.toUpperCase().trim(),
        descuento_porcentaje: parsed.data.descuento_porcentaje,
        activo: true,
        usos_maximos: parsed.data.usos_maximos || null,
      })
      .select()
      .single()

    if (error) {
      if (error.message.includes('duplicate')) {
        return { error: `El código ${codigo.toUpperCase()} ya existe` }
      }
      return { error: error.message }
    }

    return { success: true, cupon: data }
  } catch (error: unknown) {
    return { error: (error as Error).message || String(error) }
  }
}

export async function toggleCupon(id: string, activo: boolean): Promise<{ success: true } | { error: string }> {
  await requireAdmin()
  try {
    const admin = getSupabaseAdmin()

    const { error } = await admin
      .from('cupones')
      .update({ activo: !activo })
      .eq('id', id)

    if (error) {
      return { error: error.message }
    }

    return { success: true }
  } catch (error: unknown) {
    return { error: (error as Error).message || String(error) }
  }
}

export async function deleteCupon(id: string): Promise<{ success: true } | { error: string }> {
  await requireAdmin()
  try {
    const admin = getSupabaseAdmin()

    const { error } = await admin
      .from('cupones')
      .delete()
      .eq('id', id)

    if (error) {
      return { error: error.message }
    }

    return { success: true }
  } catch (error: unknown) {
    return { error: (error as Error).message || String(error) }
  }
}
