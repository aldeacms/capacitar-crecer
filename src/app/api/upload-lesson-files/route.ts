import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/auth'

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

    for (const file of files) {
      if (file.size === 0) continue

      const fileExt = file.name.split('.').pop()
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
          nombre_archivo: file.name,
          archivo_url: publicUrl
        }])

      if (!dbError) {
        uploadedFiles.push({
          name: file.name,
          url: publicUrl
        })
      }
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
