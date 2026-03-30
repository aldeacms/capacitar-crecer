'use server'

import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import type { CertificateTemplate, TextoLibre } from '@/lib/certificados/types'
import type { Database } from '@/types/database.types'
import type { SupabaseClient } from '@supabase/supabase-js'

// ─── Tipos de entrada ────────────────────────────────────────────────────────

export interface TemplateInput {
  id?: string
  nombre: string
  titulo_texto: string
  curso_id: string | null
  orientacion: 'horizontal' | 'vertical'
  color_primary: string
  color_accent: string
  background_storage_path: string | null
  texto_libre: TextoLibre[]
  activo: boolean
  // Posiciones — opcionales en update, requeridas en create (se setean por defecto)
  pos_titulo_cert?: any
  pos_nombre_alumno?: any
  pos_rut_alumno?: any
  pos_titulo_curso?: any
  pos_horas?: any
  pos_fecha_emision?: any
  pos_fecha_vigencia?: any
  pos_qr_code?: any
  pos_cert_id?: any
}

// ─── Defaults de posición según orientación ─────────────────────────────────

function defaultPositions(orientacion: 'horizontal' | 'vertical') {
  if (orientacion === 'vertical') {
    return {
      pos_titulo_cert:   { x: 297, y: 650, fontSize: 14, align: 'center' },
      pos_nombre_alumno: { x: 297, y: 560, fontSize: 28, align: 'center', maxWidth: 500 },
      pos_rut_alumno:    { x: 297, y: 520, fontSize: 14, align: 'center' },
      pos_titulo_curso:  { x: 297, y: 460, fontSize: 20, align: 'center', maxWidth: 480 },
      pos_horas:         { x: 297, y: 420, fontSize: 12, align: 'center' },
      pos_fecha_emision: { x: 297, y: 390, fontSize: 11, align: 'center' },
      pos_fecha_vigencia:{ x: 297, y: 365, fontSize: 10, align: 'center' },
      pos_qr_code:       { x: 500, y: 60,  size: 90 },
      pos_cert_id:       { x: 297, y: 60,  fontSize: 8, align: 'center' },
    }
  }
  // horizontal (default)
  return {
    pos_titulo_cert:   { x: 421, y: 380, fontSize: 14, align: 'center' },
    pos_nombre_alumno: { x: 421, y: 300, fontSize: 28, align: 'center', maxWidth: 600 },
    pos_rut_alumno:    { x: 421, y: 260, fontSize: 14, align: 'center' },
    pos_titulo_curso:  { x: 421, y: 210, fontSize: 20, align: 'center', maxWidth: 500 },
    pos_horas:         { x: 421, y: 175, fontSize: 12, align: 'center' },
    pos_fecha_emision: { x: 421, y: 150, fontSize: 11, align: 'center' },
    pos_fecha_vigencia:{ x: 421, y: 130, fontSize: 10, align: 'center' },
    pos_qr_code:       { x: 720, y: 40,  size: 90 },
    pos_cert_id:       { x: 421, y: 40,  fontSize: 8, align: 'center' },
  }
}

// ─── Queries ─────────────────────────────────────────────────────────────────

export async function getTemplates(): Promise<(CertificateTemplate & { curso_titulo?: string | null })[]> {
  await requireAdmin()
  const admin = getSupabaseAdmin()

  const { data, error } = await admin
    .from('certificate_templates')
    .select('*, cursos(titulo)')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('getTemplates:', error)
    return []
  }

  return (data || []).map((t: any) => ({
    ...t,
    texto_libre: t.texto_libre ?? [],
    orientacion: t.orientacion ?? 'horizontal',
    curso_titulo: t.cursos?.titulo ?? null,
  }))
}

export async function upsertTemplate(
  input: TemplateInput
): Promise<{ success: true; id: string } | { error: string }> {
  await requireAdmin()
  const admin = getSupabaseAdmin()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const payload: any = {
    nombre: input.nombre,
    titulo_texto: input.titulo_texto,
    curso_id: input.curso_id || null,
    orientacion: input.orientacion,
    color_primary: input.color_primary,
    color_accent: input.color_accent,
    background_storage_path: input.background_storage_path,
    texto_libre: input.texto_libre,
    activo: input.activo,
    updated_at: new Date().toISOString(),
  }

  // Si vienen posiciones explícitas (del editor), usarlas
  const posFields = ['pos_titulo_cert', 'pos_nombre_alumno', 'pos_rut_alumno', 'pos_titulo_curso',
    'pos_horas', 'pos_fecha_emision', 'pos_fecha_vigencia', 'pos_qr_code', 'pos_cert_id'] as const

  for (const field of posFields) {
    if (input[field] !== undefined) payload[field] = input[field]
  }

  let result
  if (input.id) {
    result = await admin
      .from('certificate_templates')
      .update(payload)
      .eq('id', input.id)
      .select('id')
      .single()
  } else {
    // Crear con posiciones por defecto según orientación
    const defaults = defaultPositions(input.orientacion)
    for (const field of posFields) {
      if (payload[field] === undefined) payload[field] = (defaults as any)[field]
    }
    result = await admin
      .from('certificate_templates')
      .insert(payload)
      .select('id')
      .single()
  }

  if (result.error) return { error: result.error.message }

  revalidatePath('/admin/certificados')
  return { success: true, id: result.data.id }
}

export async function duplicateTemplate(
  id: string,
  nuevoNombre: string,
  cursoId: string | null
): Promise<{ success: true; id: string } | { error: string }> {
  await requireAdmin()
  const admin = getSupabaseAdmin()

  const { data: original, error: fetchError } = await admin
    .from('certificate_templates')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError || !original) return { error: fetchError?.message ?? 'Template no encontrado' }

  const { id: _id, created_at, updated_at, ...rest } = original
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const payload: any = {
    ...rest,
    nombre: nuevoNombre,
    curso_id: cursoId,
    texto_libre: rest.texto_libre ?? [],
    orientacion: rest.orientacion ?? 'horizontal',
    activo: true,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await admin
    .from('certificate_templates')
    .insert(payload)
    .select('id')
    .single()

  if (error) return { error: error.message }

  revalidatePath('/admin/certificados')
  return { success: true, id: data.id }
}

export async function deleteTemplate(id: string): Promise<{ success: true } | { error: string }> {
  await requireAdmin()
  const admin = getSupabaseAdmin()

  const { error } = await admin.from('certificate_templates').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/admin/certificados')
  return { success: true }
}

// ─── Certificados emitidos ────────────────────────────────────────────────────

export async function getCertificadosEmitidos() {
  await requireAdmin()
  const admin = getSupabaseAdmin()

  const { data, error } = await admin
    .from('certificate_downloads')
    .select(`
      id,
      created_at,
      fecha_vigencia,
      invalidado_at,
      version,
      perfiles!certificate_downloads_perfil_id_fkey(nombre_completo, id),
      cursos(titulo, id)
    `)
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) {
    console.error('getCertificadosEmitidos:', error)
    return []
  }

  return (data || []).map((c: any) => ({
    id: c.id,
    created_at: c.created_at,
    fecha_vigencia: c.fecha_vigencia,
    invalidado_at: c.invalidado_at,
    version: c.version,
    alumno_nombre: c.perfiles?.nombre_completo ?? '—',
    alumno_id: c.perfiles?.id,
    curso_titulo: c.cursos?.titulo ?? '—',
    curso_id: c.cursos?.id,
  }))
}

export async function invalidarCertificadoAdmin(
  id: string
): Promise<{ success: true } | { error: string }> {
  const admin_user = await requireAdmin()
  const admin = getSupabaseAdmin()

  const { error } = await admin
    .from('certificate_downloads')
    .update({
      invalidado_at: new Date().toISOString(),
      invalidado_por: admin_user.id,
    })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/admin/certificados')
  return { success: true }
}

export async function getUploadUrl(path: string): Promise<{ signedUrl: string } | { error: string }> {
  await requireAdmin()
  const admin = getSupabaseAdmin()

  const { data, error } = await admin.storage
    .from('certificados')
    .createSignedUploadUrl(path)

  if (error) return { error: error.message }
  return { signedUrl: data.signedUrl }
}

export async function getBackgroundPreviewUrl(
  storagePath: string
): Promise<{ url: string } | { error: string }> {
  await requireAdmin()
  const admin = getSupabaseAdmin()

  const { data, error } = await admin.storage
    .from('certificados')
    .createSignedUrl(storagePath, 3600)

  if (error) return { error: error.message }
  return { url: data.signedUrl }
}

export async function getCursos(): Promise<{ id: string; titulo: string }[]> {
  await requireAdmin()
  const admin = getSupabaseAdmin()
  const { data } = await admin.from('cursos').select('id, titulo').order('titulo')
  return data || []
}
