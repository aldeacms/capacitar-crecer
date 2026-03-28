import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { generateCertificatePDF } from '@/lib/certificados/pdf-generator'
import type { CertificateData, CertificateTemplate } from '@/lib/certificados/types'

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const body = await req.json()

    // Construir template desde el body (sin guardar en BD)
    const template: CertificateTemplate = {
      id: body.id ?? 'preview',
      nombre: body.nombre ?? 'Preview',
      titulo_texto: body.titulo_texto ?? 'CERTIFICADO DE PARTICIPACIÓN',
      curso_id: body.curso_id ?? null,
      orientacion: body.orientacion ?? 'horizontal',
      color_primary: body.color_primary ?? '#1a1a2e',
      color_accent: body.color_accent ?? '#28B4AD',
      background_storage_path: body.background_storage_path ?? null,
      pos_titulo_cert:   body.pos_titulo_cert   ?? { x: 421, y: 380, fontSize: 14, align: 'center' },
      pos_nombre_alumno: body.pos_nombre_alumno ?? { x: 421, y: 300, fontSize: 28, align: 'center', maxWidth: 600 },
      pos_rut_alumno:    body.pos_rut_alumno    ?? { x: 421, y: 260, fontSize: 14, align: 'center' },
      pos_titulo_curso:  body.pos_titulo_curso  ?? { x: 421, y: 210, fontSize: 20, align: 'center', maxWidth: 500 },
      pos_horas:         body.pos_horas         ?? { x: 421, y: 175, fontSize: 12, align: 'center' },
      pos_fecha_emision: body.pos_fecha_emision ?? { x: 421, y: 150, fontSize: 11, align: 'center' },
      pos_fecha_vigencia:body.pos_fecha_vigencia?? { x: 421, y: 130, fontSize: 10, align: 'center' },
      pos_qr_code:       body.pos_qr_code       ?? { x: 720, y: 40,  size: 90 },
      pos_cert_id:       body.pos_cert_id       ?? { x: 421, y: 40,  fontSize: 8, align: 'center' },
      texto_libre: body.texto_libre ?? [],
      activo: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    // Datos de muestra para el preview
    const data: CertificateData = {
      certificateId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      nombreAlumno: 'María González Pérez',
      rutAlumno: '12.345.678-9',
      nombreCurso: body.nombre ?? 'Nombre del Curso de Ejemplo',
      horas: 24,
      fechaEmision: new Date(),
      fechaVigencia: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      template,
    }

    const pdfBuffer = await generateCertificatePDF(data)

    return new NextResponse(pdfBuffer.buffer as ArrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="preview-certificado.pdf"',
      },
    })
  } catch (err: any) {
    console.error('preview certificado:', err)
    return NextResponse.json({ error: err.message ?? 'Error generando preview' }, { status: 500 })
  }
}
