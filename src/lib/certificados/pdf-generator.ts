/**
 * Motor de generación de certificados PDF con pdf-lib
 * Soporta:
 * - Imagen de fondo (JPG/PNG) desde Supabase Storage
 * - Fuentes TTF embebidas desde /public/fonts/
 * - QR code embebido
 * - Posicionamiento flexible mediante template JSONB
 */

import { PDFDocument, rgb } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import QRCode from 'qrcode'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import fs from 'fs'
import path from 'path'
import { CertificateData } from './types'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

/**
 * Generar PDF de certificado con pdf-lib
 */
export async function generateCertificatePDF(data: CertificateData): Promise<Buffer> {
  const supabaseAdmin = getSupabaseAdmin()

  // Crear documento PDF (A4 horizontal: 842×595 puntos)
  const pdfDoc = await PDFDocument.create()
  pdfDoc.registerFontkit(fontkit)

  const page = pdfDoc.addPage([842, 595])

  // ===== 1. CARGAR IMAGEN DE FONDO =====
  if (data.template.background_storage_path) {
    try {
      const { data: imageData, error: downloadError } = await supabaseAdmin.storage
        .from('certificados')
        .download(data.template.background_storage_path)

      if (!downloadError && imageData) {
        const imageBuffer = await imageData.arrayBuffer()
        const backgroundImage = await pdfDoc.embedJpg(imageBuffer)
        page.drawImage(backgroundImage, {
          x: 0,
          y: 0,
          width: 842,
          height: 595,
        })
      }
    } catch (error) {
      console.warn('Error cargando imagen de fondo:', error)
      // Continuar sin imagen de fondo
    }
  }

  // ===== 2. REGISTRAR Y CARGAR FUENTES TTF =====
  let primaryFont: any = null
  let secondaryFont: any = null

  try {
    // Cargar fuente primaria (Bold)
    const fontBoldPath = path.join(process.cwd(), 'public', 'fonts', 'Montserrat-Bold.ttf')
    if (fs.existsSync(fontBoldPath)) {
      const fontBytes = fs.readFileSync(fontBoldPath)
      primaryFont = await pdfDoc.embedFont(fontBytes)
    }

    // Cargar fuente secundaria (Regular)
    const fontRegularPath = path.join(process.cwd(), 'public', 'fonts', 'Montserrat-Regular.ttf')
    if (fs.existsSync(fontRegularPath)) {
      const fontBytes = fs.readFileSync(fontRegularPath)
      secondaryFont = await pdfDoc.embedFont(fontBytes)
    }
  } catch (error) {
    console.warn('Error cargando fuentes TTF, usando fuentes estándar:', error)
    // Las fuentes se cargarán como fallback más abajo
  }

  // ===== 3. GENERAR QR CODE =====
  const qrUrl = `${BASE_URL}/validar-certificado/${data.certificateId}`
  const qrDataUrl = await QRCode.toDataURL(qrUrl, {
    width: 200,
    margin: 2,
    color: { dark: '#000000', light: '#FFFFFF' },
  })

  // Extraer base64 del data URL y embeber como PNG
  const qrBase64 = qrDataUrl.replace(/^data:image\/png;base64,/, '')
  const qrBuffer = Buffer.from(qrBase64, 'base64')
  const qrImage = await pdfDoc.embedPng(qrBuffer)

  // Posición del QR según template
  const qrPos = data.template.pos_qr_code
  page.drawImage(qrImage, {
    x: qrPos.x - qrPos.size / 2,
    y: qrPos.y,
    width: qrPos.size,
    height: qrPos.size,
  })

  // ===== 4. DIBUJAR TEXTOS =====
  const primaryColor = parseColor(data.template.color_primary)
  const accentColor = parseColor(data.template.color_accent)

  // Título del certificado
  drawText(page, 'CERTIFICADO DE PARTICIPACIÓN', data.template.pos_titulo_cert, primaryFont, primaryColor, 14)

  // Nombre del alumno (grande, bold)
  drawText(page, data.nombreAlumno.toUpperCase(), data.template.pos_nombre_alumno, primaryFont, primaryColor, 28)

  // RUT del alumno
  drawText(page, `RUT: ${data.rutAlumno}`, data.template.pos_rut_alumno, secondaryFont, parseColor('#666666'), 14)

  // Título del curso (color accent)
  const courseText = data.nombreCurso.toUpperCase()
  drawText(page, courseText, data.template.pos_titulo_curso, primaryFont, accentColor, 20)

  // Horas (si aplica)
  if (data.horas) {
    drawText(page, `Duración: ${data.horas} horas`, data.template.pos_horas, secondaryFont, primaryColor, 12)
  }

  // Fecha de emisión
  const fechaEmisionText = formatDate(data.fechaEmision)
  drawText(page, `Fecha de emisión: ${fechaEmisionText}`, data.template.pos_fecha_emision, secondaryFont, primaryColor, 11)

  // Fecha de vigencia
  const fechaVigenciaText = formatDate(data.fechaVigencia)
  drawText(page, `Válido hasta: ${fechaVigenciaText}`, data.template.pos_fecha_vigencia, secondaryFont, primaryColor, 10)

  // ID del certificado (pequeño)
  const certIdText = `ID: ${data.certificateId.substring(0, 12)}...`
  drawText(page, certIdText, data.template.pos_cert_id, secondaryFont, parseColor('#999999'), 8)

  // ===== 5. DIBUJAR FIRMANTES =====
  for (const firmante of data.template.firmantes) {
    // Nombre del firmante
    const namePos = firmante.pos
    drawText(page, firmante.nombre, { x: namePos.x, y: namePos.y + 20 }, primaryFont, primaryColor, 12)

    // Cargo
    drawText(page, firmante.cargo, { x: namePos.x, y: namePos.y }, secondaryFont, parseColor('#666666'), 10)

    // Línea de firma
    page.drawLine({
      start: { x: namePos.x - namePos.width / 2, y: namePos.y - 10 },
      end: { x: namePos.x + namePos.width / 2, y: namePos.y - 10 },
      thickness: 1,
      color: parseColor('#000000'),
    })
  }

  // ===== 6. CONVERTIR A BUFFER =====
  const pdfBuffer = await pdfDoc.save()
  return Buffer.from(pdfBuffer)
}

/**
 * Dibujar texto con posición y estilo
 */
function drawText(page: any, text: string, position: any, font: any, color: any, defaultFontSize: number) {
  const fontSize = position.fontSize || defaultFontSize
  const x = position.x || 0
  const y = position.y || 0
  const align = position.align || 'left'
  const maxWidth = position.maxWidth || 600

  // Usar fuente embebida si está disponible, si no usar fuente estándar
  const drawFont = font || 'Helvetica'

  // Calcular ancho del texto para alineación
  let textX = x
  if (align === 'center') {
    // Para texto centrado, estimamos que cada carácter ocupa ~0.6 * fontSize píxeles
    const estimatedWidth = text.length * fontSize * 0.6
    textX = x - estimatedWidth / 2
  } else if (align === 'right') {
    const estimatedWidth = text.length * fontSize * 0.6
    textX = x - estimatedWidth
  }

  // Dibujar texto con word wrap si es necesario
  if (maxWidth && text.length > 40) {
    // Wrap de texto simple
    const words = text.split(' ')
    let currentLine = ''
    let lineY = y

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word
      const estimatedLineWidth = testLine.length * fontSize * 0.6

      if (estimatedLineWidth > maxWidth && currentLine) {
        // Dibujar línea actual
        page.drawText(currentLine, {
          x: align === 'center' ? x - (currentLine.length * fontSize * 0.6) / 2 : x,
          y: lineY,
          size: fontSize,
          font: drawFont,
          color: color,
        })
        currentLine = word
        lineY -= fontSize + 5
      } else {
        currentLine = testLine
      }
    }

    // Dibujar última línea
    if (currentLine) {
      page.drawText(currentLine, {
        x: align === 'center' ? x - (currentLine.length * fontSize * 0.6) / 2 : x,
        y: lineY,
        size: fontSize,
        font: drawFont,
        color: color,
      })
    }
  } else {
    // Texto simple sin wrap
    page.drawText(text, {
      x: textX,
      y: y,
      size: fontSize,
      font: drawFont,
      color: color,
    })
  }
}

/**
 * Parsear color hex a RGB para pdf-lib
 */
function parseColor(hexColor: string): any {
  const hex = hexColor.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16) / 255
  const g = parseInt(hex.substring(2, 4), 16) / 255
  const b = parseInt(hex.substring(4, 6), 16) / 255
  return rgb(r, g, b)
}

/**
 * Formatear fecha en español
 */
function formatDate(date: Date): string {
  const dias = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
  return `${date.getDate()} de ${dias[date.getMonth()]} de ${date.getFullYear()}`
}
