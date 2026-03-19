/**
 * Helpers para manejar Storage de Supabase
 * Gestiona paths determinísticos y uploads de certificados
 */

import { getSupabaseAdmin } from '@/lib/supabase-admin'

/**
 * Construir path determinístico en Storage para un certificado
 * Formato: {perfilId}/{cursoId}/v{version}.pdf
 * Esto permite actualizar el mismo archivo si se regenera el certificado
 */
export function getStoragePath(perfilId: string, cursoId: string, version: number = 1): string {
  return `${perfilId}/${cursoId}/v${version}.pdf`
}

/**
 * Subir certificado a Supabase Storage con upsert
 * Si el archivo ya existe en ese path, lo sobreescribe
 */
export async function uploadCertificate(storagePath: string, buffer: Buffer): Promise<void> {
  const supabaseAdmin = getSupabaseAdmin()

  console.log(`📦 Upload details: path=${storagePath}, buffer size=${buffer.length} bytes`)

  const { data, error } = await supabaseAdmin.storage
    .from('certificados')
    .upload(storagePath, buffer, {
      contentType: 'application/pdf',
      upsert: true,  // Sobreescribir si ya existe
    })

  console.log(`📦 Upload response: error=${error}, data=${JSON.stringify(data)}`)

  if (error) {
    throw new Error(`Error subiendo certificado a Storage: ${error.message}`)
  }

  if (!data) {
    console.warn(`⚠️ Upload returned no data (might still be OK with upsert)`)
  }
}

/**
 * Verificar si un certificado existe en Storage
 */
export async function certificateExistsInStorage(storagePath: string): Promise<boolean> {
  const supabaseAdmin = getSupabaseAdmin()

  try {
    // Intentar descargar para verificar que existe
    const { data, error } = await supabaseAdmin.storage
      .from('certificados')
      .download(storagePath)

    return !error && !!data
  } catch (error) {
    return false
  }
}

/**
 * Obtener URL pública de descarga para un certificado (si el bucket es público)
 * Nota: Solo funciona si el bucket es public. Para buckets privados, usar URL con token
 */
export function getPublicDownloadUrl(storagePath: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
  return `${supabaseUrl}/storage/v1/object/public/certificados/${storagePath}`
}

/**
 * Obtener URL de descarga con token (funciona para buckets privados)
 */
export async function getSignedDownloadUrl(storagePath: string, expiresIn: number = 3600): Promise<string> {
  const supabaseAdmin = getSupabaseAdmin()

  const { data, error } = await supabaseAdmin.storage
    .from('certificados')
    .createSignedUrl(storagePath, expiresIn)

  if (error || !data) {
    throw new Error(`Error generando URL firmada: ${error?.message || 'Unknown error'}`)
  }

  return data.signedUrl
}
