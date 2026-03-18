'use server'

import { createClient } from '@/lib/supabase-server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function getCupones() {
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
  try {
    const admin = getSupabaseAdmin()

    if (!codigo || codigo.trim() === '') {
      return { error: 'El código es requerido' }
    }

    if (descuento_porcentaje < 1 || descuento_porcentaje > 100) {
      return { error: 'El descuento debe estar entre 1 y 100' }
    }

    const { data, error } = await admin
      .from('cupones')
      .insert({
        codigo: codigo.toUpperCase().trim(),
        descuento_porcentaje,
        activo: true,
        usos_maximos: usos_maximos || null,
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
