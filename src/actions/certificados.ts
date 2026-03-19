/* eslint-disable @typescript-eslint/no-explicit-any */
'use server'

import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { v4 as uuidv4 } from 'uuid'
import { resolveTemplate } from '@/lib/certificados/template-resolver'
import { generateCertificatePDF } from '@/lib/certificados/pdf-generator'
import { getStoragePath, uploadCertificate, certificateExistsInStorage } from '@/lib/certificados/storage'
import { CertificateRecord, GenerateCertificateResult } from '@/lib/certificados/types'
import { requireAuth } from '@/lib/auth'

/**
 * Generar certificado PDF para el usuario autenticado
 * Con idempotencia: si ya existe un certificado válido para este (perfil_id, curso_id),
 * retorna el existente en lugar de generar uno nuevo
 */
export async function generarCertificado(cursoId: string): Promise<GenerateCertificateResult> {
  const user = await requireAuth()
  const perfilId = user.id
  const supabaseAdmin = getSupabaseAdmin()

  try {
    // ===== 1. VERIFICACIONES =====
    // Verificar que el usuario existe
    const { data: perfil, error: perfilError } = await supabaseAdmin
      .from('perfiles')
      .select('id, nombre_completo, rut')
      .eq('id', perfilId)
      .single()

    if (perfilError || !perfil) {
      return { success: false, certificateId: '', downloadUrl: '', fileName: '', error: 'Perfil no encontrado' }
    }

    // Obtener datos del curso
    const { data: curso, error: cursoError } = await supabaseAdmin
      .from('cursos')
      .select('id, titulo, horas, tiene_certificado')
      .eq('id', cursoId)
      .single()

    if (cursoError || !curso) {
      return { success: false, certificateId: '', downloadUrl: '', fileName: '', error: 'Curso no encontrado' }
    }

    if (!curso.tiene_certificado) {
      return { success: false, certificateId: '', downloadUrl: '', fileName: '', error: 'Este curso no emite certificado' }
    }

    // Verificar matrícula y progreso
    const { data: matricula, error: matriculaError } = await supabaseAdmin
      .from('matriculas')
      .select('id, progreso_porcentaje')
      .eq('perfil_id', perfilId)
      .eq('curso_id', cursoId)
      .single()

    if (matriculaError || !matricula) {
      return { success: false, certificateId: '', downloadUrl: '', fileName: '', error: 'No tienes matrícula en este curso' }
    }

    if (matricula.progreso_porcentaje < 100) {
      return {
        success: false,
        certificateId: '',
        downloadUrl: '',
        fileName: '',
        error: 'Debes completar el 100% del curso para descargar el certificado',
      }
    }

    // ===== 2. IDEMPOTENCIA: BUSCAR CERTIFICADO EXISTENTE =====
    console.log('🔍 Buscando certificado existente para:', { perfilId, cursoId })

    const { data: existingCert, error: searchError } = await supabaseAdmin
      .from('certificate_downloads')
      .select('id, storage_path, version')
      .eq('perfil_id', perfilId)
      .eq('curso_id', cursoId)
      .is('invalidado_at', null)
      .maybeSingle()

    if (existingCert && !searchError) {
      // Verificar que el archivo aún existe en Storage
      const exists = await certificateExistsInStorage(existingCert.storage_path!)

      if (exists) {
        console.log('✅ Certificado existente encontrado, retornando el mismo')
        return {
          success: true,
          certificateId: existingCert.id,
          downloadUrl: `/api/certificados/${existingCert.id}/download`,
          fileName: `certificado-${curso.titulo.toLowerCase().replace(/\s+/g, '-')}.pdf`,
        }
      }

      console.log('⚠️ Certificado existente pero archivo no está en Storage, regenerando...')
    }

    // ===== 3. RESOLVER TEMPLATE =====
    console.log('🎨 Resolviendo template para curso:', cursoId)
    const template = await resolveTemplate(cursoId)

    // ===== 4. GENERAR PDF =====
    const certificateId = uuidv4()
    const version = existingCert?.version ?? 1
    const storagePath = getStoragePath(perfilId, cursoId, version)

    console.log('📄 Generando PDF...')
    const fechaVigencia = new Date()
    fechaVigencia.setFullYear(fechaVigencia.getFullYear() + 2)

    const pdfBuffer = await generateCertificatePDF({
      certificateId,
      nombreAlumno: perfil.nombre_completo,
      rutAlumno: perfil.rut,
      nombreCurso: curso.titulo,
      horas: curso.horas,
      fechaEmision: new Date(),
      fechaVigencia,
      template,
    })

    // ===== 5. SUBIR A STORAGE =====
    console.log('☁️ Subiendo a Storage:', storagePath)
    await uploadCertificate(storagePath, pdfBuffer)

    // ===== 6. REGISTRAR EN BD =====
    console.log('💾 Registrando en BD...')
    const fileName = `certificado-${curso.titulo.toLowerCase().replace(/\s+/g, '-')}.pdf`

    const { error: upsertError } = await supabaseAdmin
      .from('certificate_downloads')
      .upsert(
        {
          id: existingCert?.id ?? certificateId,
          perfil_id: perfilId,
          curso_id: cursoId,
          nombre_archivo: fileName,
          storage_path: storagePath,
          template_id: template.id,
          fecha_vigencia: fechaVigencia.toISOString(),
          version,
        },
        {
          onConflict: 'perfil_id,curso_id',
          ignoreDuplicates: false,
        }
      )

    if (upsertError) {
      console.error('❌ Error registrando certificado en BD:', upsertError)
      return {
        success: false,
        certificateId: '',
        downloadUrl: '',
        fileName: '',
        error: `Error al registrar certificado: ${upsertError.message}`,
      }
    }

    console.log('✅ Certificado generado exitosamente')
    return {
      success: true,
      certificateId: existingCert?.id ?? certificateId,
      downloadUrl: `/api/certificados/${existingCert?.id ?? certificateId}/download`,
      fileName,
    }
  } catch (error: unknown) {
    console.error('❌ Error en generarCertificado:', error)
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    return {
      success: false,
      certificateId: '',
      downloadUrl: '',
      fileName: '',
      error: errorMessage,
    }
  }
}

/**
 * Validar y obtener información de un certificado (para la página pública de validación)
 */
export async function validarCertificado(certificateId: string) {
  const supabaseAdmin = getSupabaseAdmin()

  try {
    // Obtener certificado con todos los datos
    const { data: certificate, error } = await supabaseAdmin
      .from('certificate_downloads')
      .select('id, perfil_id, curso_id, created_at, invalidado_at')
      .eq('id', certificateId)
      .single()

    if (error || !certificate) {
      console.log('Certificate not found:', error)
      return { error: 'Certificado no encontrado o inválido' }
    }

    // Obtener datos del perfil
    const { data: perfil } = await supabaseAdmin
      .from('perfiles')
      .select('nombre_completo, rut')
      .eq('id', certificate.perfil_id)
      .single()

    // Obtener datos del curso
    const { data: curso } = await supabaseAdmin
      .from('cursos')
      .select('titulo')
      .eq('id', certificate.curso_id)
      .single()

    const isInvalidado = certificate.invalidado_at !== null

    return {
      success: true,
      certificateId: certificate.id,
      alumno: perfil?.nombre_completo || 'Desconocido',
      rut: perfil?.rut || 'N/A',
      curso: curso?.titulo || 'Desconocido',
      fechaEmision: certificate.created_at,
      invalidado: isInvalidado,
      invalidadoMensaje: isInvalidado ? 'Este certificado ha sido invalidado' : null,
    }
  } catch (error: unknown) {
    console.error('❌ Error en validarCertificado:', error)
    return { error: 'Error al validar certificado' }
  }
}

/**
 * Invalidar un certificado (solo para admins)
 */
export async function invalidarCertificado(certificateId: string) {
  const admin = await requireAdmin()
  const adminId = admin.id
  const supabaseAdmin = getSupabaseAdmin()

  try {
    // Invalidar certificado
    const { error: invalidateError } = await supabaseAdmin
      .from('certificate_downloads')
      .update({
        invalidado_at: new Date().toISOString(),
        invalidado_por: adminId,
      })
      .eq('id', certificateId)

    if (invalidateError) {
      return { success: false, error: invalidateError.message }
    }

    return { success: true }
  } catch (error: unknown) {
    console.error('❌ Error invalidando certificado:', error)
    return { success: false, error: 'Error al invalidar certificado' }
  }
}
