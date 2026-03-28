'use server'

import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import type { Gateway, Modo, PaymentConfig } from '@/lib/payment-constants'

export async function getPaymentConfigs(): Promise<PaymentConfig[]> {
  await requireAdmin()
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('payment_configs')
    .select('*')
    .order('gateway')

  if (error) {
    console.error('Error loading payment_configs:', error)
    return []
  }
  return data as PaymentConfig[]
}

export async function updatePaymentConfig(
  gateway: Gateway,
  updates: Partial<Pick<PaymentConfig, 'habilitado' | 'modo' | 'credenciales'>>
): Promise<{ success: true } | { error: string }> {
  await requireAdmin()
  const supabase = getSupabaseAdmin()

  const { error } = await supabase
    .from('payment_configs')
    .update(updates)
    .eq('gateway', gateway)

  if (error) return { error: error.message }

  revalidatePath('/admin/pagos')
  return { success: true }
}

/** Usado internamente por las API routes — sin requireAdmin */
export async function getPaymentConfigInternal(gateway: Gateway): Promise<PaymentConfig | null> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('payment_configs')
    .select('*')
    .eq('gateway', gateway)
    .eq('habilitado', true)
    .single()

  if (error) return null
  return data as PaymentConfig
}
