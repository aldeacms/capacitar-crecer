/**
 * Motor de generación de certificados PDF con pdf-lib
 * Soporta:
 * - Imagen de fondo (JPG/PNG) desde Supabase Storage
 * - Fuentes TTF embebidas desde /public/fonts/
 * - QR code embebido
 * - Posicionamiento flexible mediante template JSONB
 * - Orientación horizontal o vertical
 * - Bloques de texto libre
 */

import { PDFDocument, rgb } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import QRCode from 'qrcode'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import fs from 'fs'
import path from 'path'
import { CertificateData } from './types'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export async function generateCertificatePDF(data: CertificateData): Promise<Buffer> {
  const supabaseAdmin = getSupabaseAdmin()

  // Dimensiones según orientación
  const isHorizontal = (data.template.orientacion ?? 'horizontal') === 'horizontal'
  const pageWidth = isHorizontal ? 842 : 595
  const pageHeight = isHorizontal ? 595 : 842

  const pdfDoc = await PDFDocument.create()
  pdfDoc.registerFontkit(fontkit)
  const page = pdfDoc.addPage([pageWidth, pageHeight])

  // ===== 1. IMAGEN DE FONDO =====
  if (data.template.background_storage_path) {
    try {
      const { data: imageData, error } = await supabaseAdmin.storage
        .from('certificados')
        .download(data.template.background_storage_path)

      if (!error && imageData) {
        const imageBuffer = await imageData.arrayBuffer()
        const ext = data.template.background_storage_path.split('.').pop()?.toLowerCase()
        const backgroundImage = ext === 'png'
          ? await pdfDoc.embedPng(imageBuffer)
          : await pdfDoc.embedJpg(imageBuffer)
        page.drawImage(backgroundImage, { x: 0, y: 0, width: pageWidth, height: pageHeight })
      }
    } catch (error) {
      console.warn('Error cargando imagen de fondo:', error)
    }
  }

  // ===== 2. FUENTES TTF =====
  let primaryFont: any = null
  let secondaryFont: any = null

  try {
    const fontBoldPath = path.join(process.cwd(), 'public', 'fonts', 'Montserrat-Bold.ttf')
    if (fs.existsSync(fontBoldPath)) {
      primaryFont = await pdfDoc.embedFont(fs.readFileSync(fontBoldPath))
    }
    const fontRegularPath = path.join(process.cwd(), 'public', 'fonts', 'Montserrat-Regular.ttf')
    if (fs.existsSync(fontRegularPath)) {
      secondaryFont = await pdfDoc.embedFont(fs.readFileSync(fontRegularPath))
    }
  } catch (error) {
    console.warn('Error cargando fuentes TTF:', error)
  }

  // ===== 3. QR CODE =====
  const qrPos = data.template.pos_qr_code
  if (qrPos.visible !== false) {
    const qrUrl = `${BASE_URL}/validar-certificado/${data.certificateId}`
    const qrDataUrl = await QRCode.toDataURL(qrUrl, {
      width: 200,
      margin: 2,
      color: { dark: '#000000', light: '#FFFFFF' },
    })
    const qrBuffer = Buffer.from(qrDataUrl.replace(/^data:image\/png;base64,/, ''), 'base64')
    const qrImage = await pdfDoc.embedPng(qrBuffer)
    page.drawImage(qrImage, {
      x: qrPos.x - qrPos.size / 2,
      y: qrPos.y,
      width: qrPos.size,
      height: qrPos.size,
    })
  }

  // ===== 4. TEXTOS FIJOS =====
  const primaryColor = parseColor(data.template.color_primary)
  const accentColor = parseColor(data.template.color_accent)

  const pos = data.template

  drawTextEl(page, data.template.titulo_texto || 'CERTIFICADO DE PARTICIPACIÓN', pos.pos_titulo_cert, primaryFont, primaryColor, 14)
  drawTextEl(page, data.nombreAlumno.toUpperCase(), pos.pos_nombre_alumno, primaryFont, primaryColor, 28)
  drawTextEl(page, `RUT: ${data.rutAlumno}`, pos.pos_rut_alumno, secondaryFont, parseColor('#666666'), 14)
  drawTextEl(page, data.nombreCurso.toUpperCase(), pos.pos_titulo_curso, primaryFont, accentColor, 20)

  if (data.horas && pos.pos_horas.visible !== false) {
    drawTextEl(page, `Duración: ${data.horas} horas`, pos.pos_horas, secondaryFont, primaryColor, 12)
  }

  drawTextEl(page, `Fecha de emisión: ${formatDate(data.fechaEmision)}`, pos.pos_fecha_emision, secondaryFont, primaryColor, 11)
  drawTextEl(page, `Válido hasta: ${formatDate(data.fechaVigencia)}`, pos.pos_fecha_vigencia, secondaryFont, primaryColor, 10)
  drawTextEl(page, `ID: ${data.certificateId.substring(0, 12)}...`, pos.pos_cert_id, secondaryFont, parseColor('#999999'), 8)

  // ===== 5. TEXTO LIBRE =====
  for (const bloque of (data.template.texto_libre ?? [])) {
    if (bloque.pos.visible === false) continue
    const color = bloque.pos.color ? parseColor(bloque.pos.color) : primaryColor
    drawTextEl(page, bloque.text, bloque.pos, secondaryFont, color, bloque.pos.fontSize ?? 12)
  }

  const pdfBuffer = await pdfDoc.save()
  return Buffer.from(pdfBuffer)
}

function drawTextEl(page: any, text: string, position: any, font: any, color: any, defaultFontSize: number) {
  if (position.visible === false) return
  if (!text) return

  const fontSize = position.fontSize || defaultFontSize
  const x = position.x || 0
  const y = position.y || 0
  const align = position.align || 'left'
  const maxWidth = position.maxWidth || 600
  const drawFont = font || 'Helvetica'

  // Alineación horizontal
  let textX = x
  if (align === 'center') {
    textX = x - (text.length * fontSize * 0.6) / 2
  } else if (align === 'right') {
    textX = x - text.length * fontSize * 0.6
  }

  // Word wrap simple
  if (maxWidth && text.length > 40) {
    const words = text.split(' ')
    let currentLine = ''
    let lineY = y

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word
      if (testLine.length * fontSize * 0.6 > maxWidth && currentLine) {
        page.drawText(currentLine, {
          x: align === 'center' ? x - (currentLine.length * fontSize * 0.6) / 2 : x,
          y: lineY,
          size: fontSize,
          font: drawFont,
          color,
        })
        currentLine = word
        lineY -= fontSize + 5
      } else {
        currentLine = testLine
      }
    }
    if (currentLine) {
      page.drawText(currentLine, {
        x: align === 'center' ? x - (currentLine.length * fontSize * 0.6) / 2 : x,
        y: lineY,
        size: fontSize,
        font: drawFont,
        color,
      })
    }
  } else {
    page.drawText(text, { x: textX, y, size: fontSize, font: drawFont, color })
  }
}

function parseColor(hexColor: string): any {
  const hex = hexColor.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16) / 255
  const g = parseInt(hex.substring(2, 4), 16) / 255
  const b = parseInt(hex.substring(4, 6), 16) / 255
  return rgb(r, g, b)
}

function formatDate(date: Date): string {
  const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
  return `${date.getDate()} de ${meses[date.getMonth()]} de ${date.getFullYear()}`
}
