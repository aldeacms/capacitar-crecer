import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/auth'
import { validateFile, VALIDATION_CONFIGS } from '@/lib/file-validation'

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '100mb',
    },
  },
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()

    const formData = await request.formData()
    const leccion_id = formData.get('leccion_id') as string
    const curso_id = formData.get('curso_id') as string
    const files = formData.getAll('archivos') as File[]

    if (!leccion_id || !curso_id || !files.length) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos' },
        { status: 400 }
      )
    }

    const supabaseAdmin = getSupabaseAdmin()
    const uploadedFiles = []

    // Validar cantidad máxima de archivos
    const MAX_FILES = 10
    const MAX_TOTAL_SIZE = 100 * 1024 * 1024 // 100MB
    let totalSize = 0

    if (files.length > MAX_FILES) {
      return NextResponse.json(
        { error: `No se pueden subir más de ${MAX_FILES} archivos a la vez` },
        { status: 400 }
      )
    }

    // Validar cada archivo
    for (const file of files) {
      totalSize += file.size
      
      // Validación básica de tamaño
      if (file.size === 0) continue

      // Validación avanzada con file-validation
      const validation = await validateFile(file, {
        maxSize: 50 * 1024 * 1024, // 50MB por archivo
        allowedMimeTypes: [
          ...VALIDATION_CONFIGS.IMAGES.allowedMimeTypes,
          ...VALIDATION_CONFIGS.DOCUMENTS.allowedMimeTypes,
          ...VALIDATION_CONFIGS.ARCHIVES.allowedMimeTypes,
        ],
        sanitizeFileName: true,
      })

      if (!validation.isValid) {
        console.error('File validation failed:', validation.errors)
        continue // O podríamos retornar error, pero continuamos con otros archivos
      }

      // Usar nombre sanitizado si está disponible
      const safeFileName = validation.sanitizedFileName || file.name
      const fileExt = safeFileName.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `${curso_id}/${leccion_id}/${fileName}`

      const buffer = await file.arrayBuffer()
      const { error: uploadError } = await supabaseAdmin.storage
        .from('archivos_lecciones')
        .upload(filePath, buffer)

      if (uploadError) {
        console.error('Upload error:', uploadError)
        continue
      }

      const { data: { publicUrl } } = supabaseAdmin.storage
        .from('archivos_lecciones')
        .getPublicUrl(filePath)

      const { error: dbError } = await supabaseAdmin
        .from('lecciones_archivos')
        .insert([{
          leccion_id,
          nombre_archivo: safeFileName,
          archivo_url: publicUrl
        }])

      if (!dbError) {
        uploadedFiles.push({
          name: safeFileName,
          url: publicUrl
        })
      }
    }

    // Validar tamaño total de archivos
    if (totalSize > MAX_TOTAL_SIZE) {
      return NextResponse.json(
        { error: `El tamaño total de los archivos excede el límite permitido (${MAX_TOTAL_SIZE / 1024 / 1024}MB)` },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      uploadedFiles,
      message: `${uploadedFiles.length} archivo(s) subido(s) correctamente`
    })
  } catch (error: any) {
    console.error('CRITICAL ERROR in upload-lesson-files:', error)
    return NextResponse.json(
      { error: error.message || 'Error al subir archivos' },
      { status: 500 }
    )
  }
}
