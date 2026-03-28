'use server'

import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import type { CertificateTemplate, Firmante } from '@/lib/certificados/types'

// ─── Tipos de entrada ────────────────────────────────────────────────────────

export interface TemplateInput {
  id?: string
  nombre: string
  titulo_texto: string
  curso_id: string | null
  color_primary: string
  color_accent: string
  background_storage_path: string | null
  firmantes: Firmante[]
  activo: boolean
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
    curso_titulo: t.cursos?.titulo ?? null,
  }))
}

export async function upsertTemplate(
  input: TemplateInput
): Promise<{ success: true; id: string } | { error: string }> {
  await requireAdmin()
  const admin = getSupabaseAdmin()

  const payload: any = {
    nombre: input.nombre,
    titulo_texto: input.titulo_texto,
    curso_id: input.curso_id || null,
    color_primary: input.color_primary,
    color_accent: input.color_accent,
    background_storage_path: input.background_storage_path,
    firmantes: input.firmantes,
    activo: input.activo,
    updated_at: new Date().toISOString(),
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
    // Defaults de posición al crear nuevo template
    payload.pos_titulo_cert = { x: 421, y: 380, fontSize: 14, align: 'center' }
    payload.pos_nombre_alumno = { x: 421, y: 300, fontSize: 28, align: 'center', maxWidth: 600 }
    payload.pos_rut_alumno = { x: 421, y: 260, fontSize: 14, align: 'center' }
    payload.pos_titulo_curso = { x: 421, y: 210, fontSize: 20, align: 'center', maxWidth: 500 }
    payload.pos_horas = { x: 421, y: 175, fontSize: 12, align: 'center' }
    payload.pos_fecha_emision = { x: 421, y: 150, fontSize: 11, align: 'center' }
    payload.pos_fecha_vigencia = { x: 421, y: 130, fontSize: 10, align: 'center' }
    payload.pos_qr_code = { x: 720, y: 40, size: 90 }
    payload.pos_cert_id = { x: 421, y: 40, fontSize: 8, align: 'center' }

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
      perfiles(nombre_completo, id),
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

export async function getCursosSinTemplate(): Promise<{ id: string; titulo: string }[]> {
  await requireAdmin()
  const admin = getSupabaseAdmin()

  const { data: cursosConTemplate } = await admin
    .from('certificate_templates')
    .select('curso_id')
    .not('curso_id', 'is', null)

  const usedIds = (cursosConTemplate || []).map((t: any) => t.curso_id)

  const query = admin.from('cursos').select('id, titulo').order('titulo')
  const { data: cursos } = await query

  return (cursos || []).filter((c: any) => !usedIds.includes(c.id))
}

export async function getCursos(): Promise<{ id: string; titulo: string }[]> {
  await requireAdmin()
  const admin = getSupabaseAdmin()
  const { data } = await admin.from('cursos').select('id, titulo').order('titulo')
  return data || []
}
