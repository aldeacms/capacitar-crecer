import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabaseAdmin = getSupabaseAdmin()

  try {
    // Verificar que el certificado existe
    const { data: certificate, error: certError } = await supabaseAdmin
      .from('certificate_downloads')
      .select('nombre_archivo, perfil_id, curso_id, storage_path')
      .eq('id', id)
      .single()

    if (certError || !certificate) {
      return NextResponse.json(
        { error: 'Certificado no encontrado' },
        { status: 404 }
      )
    }

    // Descargar archivo del storage usando storage_path
    const storagePath = certificate.storage_path || `public/${certificate.nombre_archivo}`

    // Construir URL pública (el bucket es público)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/certificados/${storagePath}`

    console.log('📥 Descargando desde URL pública:', publicUrl)

    try {
      // Fetch del archivo usando la URL pública
      const response = await fetch(publicUrl)

      if (!response.ok) {
        console.error('Error fetching certificado:', response.status, response.statusText)
        return NextResponse.json(
          { error: 'Error al descargar certificado' },
          { status: response.status }
        )
      }

      const buffer = await response.arrayBuffer()

      // Retornar el PDF
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${certificate.nombre_archivo}"`,
        },
      })
    } catch (fetchError) {
      console.error('Error descargando certificado:', fetchError)
      return NextResponse.json(
        { error: 'Error al descargar certificado' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error en download route:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
