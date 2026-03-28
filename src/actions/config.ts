'use server'

import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export interface AppConfig {
  id: string
  nombre_otec: string
  slogan: string
  descripcion: string
  logo_url: string | null
  favicon_url: string | null
  color_primario: string
  color_secundario: string
  email_contacto: string
  telefono_contacto: string
  direccion: string | null
  rut_empresa: string | null
  redes_sociales: {
    instagram: string
    linkedin: string
    facebook: string
  }
  meta_title_default: string
  meta_description_default: string
  registro_publico_habilitado: boolean
}

export interface SeccionLanding {
  id: string
  seccion: 'hero' | 'stats' | 'clientes' | 'about' | 'testimonios'
  contenido: Record<string, unknown>
  activa: boolean
  orden: number
}

export async function getAppConfig(): Promise<AppConfig | null> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('app_config')
    .select('*')
    .limit(1)
    .single()

  if (error) {
    console.error('Error loading app_config:', error)
    return null
  }
  return data as AppConfig
}

export async function updateAppConfig(
  updates: Partial<Omit<AppConfig, 'id'>>
): Promise<{ success: true } | { error: string }> {
  await requireAdmin()
  const supabase = getSupabaseAdmin()

  const { data: existing } = await supabase
    .from('app_config')
    .select('id')
    .limit(1)
    .single()

  let result
  if (existing) {
    result = await supabase
      .from('app_config')
      .update(updates)
      .eq('id', existing.id)
  } else {
    result = await supabase.from('app_config').insert(updates)
  }

  if (result.error) {
    console.error('Error updating app_config:', result.error)
    return { error: result.error.message }
  }

  revalidatePath('/', 'layout')
  revalidatePath('/admin/config')
  return { success: true }
}

export async function getSeccionesLanding(): Promise<SeccionLanding[]> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('secciones_landing')
    .select('*')
    .order('orden', { ascending: true })

  if (error) {
    console.error('Error loading secciones_landing:', error)
    return []
  }
  return data as SeccionLanding[]
}

export async function updateSeccionLanding(
  seccion: string,
  contenido: Record<string, unknown>
): Promise<{ success: true } | { error: string }> {
  await requireAdmin()
  const supabase = getSupabaseAdmin()

  const { error } = await supabase
    .from('secciones_landing')
    .update({ contenido })
    .eq('seccion', seccion)

  if (error) {
    console.error('Error updating seccion_landing:', error)
    return { error: error.message }
  }

  revalidatePath('/')
  revalidatePath('/admin/config')
  return { success: true }
}
