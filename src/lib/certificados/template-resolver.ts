/**
 * Resolver de templates de certificados
 * Busca el template específico de un curso o fallback al template global
 */

import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { CertificateTemplate } from './types'

/**
 * Resuelve qué template usar para un curso
 * Primero busca template específico del curso, si no existe usa el global (curso_id IS NULL)
 */
export async function resolveTemplate(cursoId: string): Promise<CertificateTemplate> {
  const supabaseAdmin = getSupabaseAdmin()

  // Buscar template específico del curso
  const { data: specificTemplate, error: specificError } = await supabaseAdmin
    .from('certificate_templates')
    .select('*')
    .eq('curso_id', cursoId)
    .eq('activo', true)
    .maybeSingle()

  if (specificTemplate && !specificError) {
    return specificTemplate as CertificateTemplate
  }

  // Fallback al template global (curso_id IS NULL)
  const { data: globalTemplate, error: globalError } = await supabaseAdmin
    .from('certificate_templates')
    .select('*')
    .is('curso_id', null)
    .eq('activo', true)
    .maybeSingle()

  if (!globalTemplate) {
    // Template por defecto hardcodeado si la BD no tiene nada
    console.warn('No template encontrado en BD, usando default hardcodeado')
    return getDefaultTemplate()
  }

  return globalTemplate as CertificateTemplate
}

/**
 * Template por defecto en caso de que la BD esté vacía
 */
function getDefaultTemplate(): CertificateTemplate {
  return {
    id: 'default-hardcoded',
    curso_id: null,
    nombre: 'default',
    titulo_texto: 'CERTIFICADO DE PARTICIPACIÓN',
    background_storage_path: 'templates/formato-base.jpg',
    color_primary: '#1a1a2e',
    color_accent: '#28B4AD',

    pos_titulo_cert: { x: 421, y: 380, fontSize: 14, align: 'center' },
    pos_nombre_alumno: { x: 421, y: 300, fontSize: 28, align: 'center', maxWidth: 600 },
    pos_rut_alumno: { x: 421, y: 260, fontSize: 14, align: 'center' },
    pos_titulo_curso: { x: 421, y: 210, fontSize: 20, align: 'center', maxWidth: 500 },
    pos_horas: { x: 421, y: 175, fontSize: 12, align: 'center' },
    pos_fecha_emision: { x: 421, y: 150, fontSize: 11, align: 'center' },
    pos_fecha_vigencia: { x: 421, y: 130, fontSize: 10, align: 'center' },
    pos_qr_code: { x: 720, y: 40, size: 90 },
    pos_cert_id: { x: 421, y: 40, fontSize: 8, align: 'center' },

    texto_libre: [],
    orientacion: 'horizontal',
    activo: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}
