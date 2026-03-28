/**
 * Motor de generación de certificados PDF con pdf-lib
 * Soporta:
 * - Imagen de fondo (JPG/PNG) desde Supabase Storage
 * - Fuentes TTF embebidas desde /public/fonts/
 * - QR code con color configurable
 * - Orientación horizontal o vertical
 * - Bloques de texto libre con variables, negrita y alineación
 */

import { PDFDocument, rgb } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import QRCode from 'qrcode'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import fs from 'fs'
import path from 'path'
import { CertificateData } from './types'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

// ─── Variables disponibles en texto libre ────────────────────────────────────

function resolveVariables(text: string, data: CertificateData): string {
  const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

  return text
    .replace(/\{\{nombre_alumno\}\}/g, data.nombreAlumno)
    .replace(/\{\{rut_alumno\}\}/g, data.rutAlumno)
    .replace(/\{\{nombre_curso\}\}/g, data.nombreCurso)
    .replace(/\{\{horas\}\}/g, data.horas ? String(data.horas) : '')
    .replace(/\{\{fecha_emision\}\}/g,
      `${data.fechaEmision.getDate()} de ${meses[data.fechaEmision.getMonth()]} de ${data.fechaEmision.getFullYear()}`)
    .replace(/\{\{fecha_vigencia\}\}/g,
      `${data.fechaVigencia.getDate()} de ${meses[data.fechaVigencia.getMonth()]} de ${data.fechaVigencia.getFullYear()}`)
}

// ─── Segmentos de texto (para negrita inline) ────────────────────────────────

interface TextSegment {
  text: string
  bold: boolean
}

function parseSegments(text: string): TextSegment[] {
  const segments: TextSegment[] = []
  const regex = /\*\*(.*?)\*\*/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ text: text.slice(lastIndex, match.index), bold: false })
    }
    segments.push({ text: match[1], bold: true })
    lastIndex = regex.lastIndex
  }
  if (lastIndex < text.length) {
    segments.push({ text: text.slice(lastIndex), bold: false })
  }
  return segments.length > 0 ? segments : [{ text, bold: false }]
}

// ─── Generador principal ──────────────────────────────────────────────────────

export async function generateCertificatePDF(data: CertificateData): Promise<Buffer> {
  const supabaseAdmin = getSupabaseAdmin()

  const isHorizontal = (data.template.orientacion ?? 'horizontal') === 'horizontal'
  const pageWidth  = isHorizontal ? 842 : 595
  const pageHeight = isHorizontal ? 595 : 842

  const pdfDoc = await PDFDocument.create()
  pdfDoc.registerFontkit(fontkit)
  const page = pdfDoc.addPage([pageWidth, pageHeight])

  // ── 1. Imagen de fondo ────────────────────────────────────────────────────
  if (data.template.background_storage_path) {
    try {
      const { data: imageData, error } = await supabaseAdmin.storage
        .from('certificados')
        .download(data.template.background_storage_path)

      if (!error && imageData) {
        const imageBuffer = await imageData.arrayBuffer()
        const ext = data.template.background_storage_path.split('.').pop()?.toLowerCase()
        const bg = ext === 'png'
          ? await pdfDoc.embedPng(imageBuffer)
          : await pdfDoc.embedJpg(imageBuffer)
        page.drawImage(bg, { x: 0, y: 0, width: pageWidth, height: pageHeight })
      }
    } catch (e) {
      console.warn('Error cargando imagen de fondo:', e)
    }
  }

  // ── 2. Fuentes TTF ────────────────────────────────────────────────────────
  let boldFont: any = null
  let regularFont: any = null

  try {
    const boldPath = path.join(process.cwd(), 'public', 'fonts', 'Montserrat-Bold.ttf')
    if (fs.existsSync(boldPath)) boldFont = await pdfDoc.embedFont(fs.readFileSync(boldPath))

    const regularPath = path.join(process.cwd(), 'public', 'fonts', 'Montserrat-Regular.ttf')
    if (fs.existsSync(regularPath)) regularFont = await pdfDoc.embedFont(fs.readFileSync(regularPath))
  } catch (e) {
    console.warn('Error cargando fuentes TTF:', e)
  }

  // ── 3. QR ─────────────────────────────────────────────────────────────────
  const qrPos = data.template.pos_qr_code
  if (qrPos.visible !== false) {
    const qrDarkColor = qrPos.color ?? '#000000'
    const qrUrl = `${BASE_URL}/validar-certificado/${data.certificateId}`
    const qrDataUrl = await QRCode.toDataURL(qrUrl, {
      width: 200,
      margin: 2,
      color: { dark: qrDarkColor, light: '#FFFFFF' },
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

  // ── 4. Textos fijos ───────────────────────────────────────────────────────
  const primaryColor = parseColor(data.template.color_primary)
  const accentColor  = parseColor(data.template.color_accent)
  const pos = data.template

  drawSimple(page, data.template.titulo_texto || 'CERTIFICADO DE PARTICIPACIÓN',
    pos.pos_titulo_cert, boldFont, primaryColor, 14)
  drawSimple(page, data.nombreAlumno.toUpperCase(),
    pos.pos_nombre_alumno, boldFont, primaryColor, 28)
  drawSimple(page, `RUT: ${data.rutAlumno}`,
    pos.pos_rut_alumno, regularFont, parseColor('#666666'), 14)
  drawSimple(page, data.nombreCurso.toUpperCase(),
    pos.pos_titulo_curso, boldFont, accentColor, 20)

  if (data.horas && pos.pos_horas.visible !== false) {
    drawSimple(page, `Duración: ${data.horas} horas`,
      pos.pos_horas, regularFont, primaryColor, 12)
  }

  drawSimple(page, `Fecha de emisión: ${formatDate(data.fechaEmision)}`,
    pos.pos_fecha_emision, regularFont, primaryColor, 11)
  drawSimple(page, `Válido hasta: ${formatDate(data.fechaVigencia)}`,
    pos.pos_fecha_vigencia, regularFont, primaryColor, 10)
  drawSimple(page, `ID: ${data.certificateId.substring(0, 12)}...`,
    pos.pos_cert_id, regularFont, parseColor('#999999'), 8)

  // ── 5. Texto libre con variables y negrita ────────────────────────────────
  for (const bloque of (data.template.texto_libre ?? [])) {
    if (bloque.pos.visible === false) continue
    const resolved = resolveVariables(bloque.text, data)
    const color = bloque.pos.color ? parseColor(bloque.pos.color) : primaryColor
    drawRichText(page, resolved, bloque.pos, boldFont, regularFont, color, pageWidth)
  }

  const pdfBuffer = await pdfDoc.save()
  return Buffer.from(pdfBuffer)
}

// ─── Dibujar texto simple (elementos fijos) ───────────────────────────────────

function drawSimple(
  page: any, text: string, position: any,
  font: any, color: any, defaultSize: number
) {
  if (position.visible === false || !text) return

  const fontSize = position.fontSize || defaultSize
  const x = position.x || 0
  const y = position.y || 0
  const align = position.align || 'left'
  const maxWidth = position.maxWidth || 700
  const drawFont = font || 'Helvetica'

  const lines = wrapText(text, fontSize, maxWidth)
  const lineHeight = fontSize * (position.lineHeight ?? 1.3)

  lines.forEach((line, i) => {
    const lineWidth = estimateWidth(line, fontSize)
    let tx = x
    if (align === 'center') tx = x - lineWidth / 2
    else if (align === 'right') tx = x - lineWidth

    page.drawText(line, {
      x: tx,
      y: y - i * lineHeight,
      size: fontSize,
      font: drawFont,
      color,
    })
  })
}

// ─── Dibujar texto enriquecido (texto libre) ──────────────────────────────────

function drawRichText(
  page: any, text: string, position: any,
  boldFont: any, regularFont: any, defaultColor: any, pageWidth: number
) {
  if (!text) return

  const fontSize   = position.fontSize ?? 12
  const x          = position.x ?? 0
  const y          = position.y ?? 0
  const align      = (position.align ?? 'left') as 'left' | 'center' | 'right' | 'justify'
  const maxWidth   = position.maxWidth ?? 500
  const lineHeight = fontSize * (position.lineHeight ?? 1.4)
  const color      = position.color ? parseColor(position.color) : defaultColor

  // Separar en párrafos por saltos de línea
  const paragraphs = text.split('\n')

  let currentY = y

  for (const para of paragraphs) {
    if (!para.trim()) { currentY -= lineHeight * 0.5; continue }

    const segments = parseSegments(para)

    // Construir palabras con su estilo
    const words: { word: string; bold: boolean }[] = []
    for (const seg of segments) {
      const ws = seg.text.split(/(\s+)/)
      for (const w of ws) {
        if (w) words.push({ word: w, bold: seg.bold })
      }
    }

    // Word wrap respetando estilos
    const wrappedLines: { word: string; bold: boolean }[][] = []
    let currentLine: { word: string; bold: boolean }[] = []
    let currentLineWidth = 0

    for (const item of words) {
      if (item.word.match(/^\s+$/)) {
        currentLine.push(item)
        currentLineWidth += estimateWidth(' ', fontSize)
        continue
      }
      const ww = estimateWidth(item.word, fontSize)
      if (currentLineWidth + ww > maxWidth && currentLine.length > 0) {
        wrappedLines.push(currentLine)
        currentLine = [item]
        currentLineWidth = ww
      } else {
        currentLine.push(item)
        currentLineWidth += ww
      }
    }
    if (currentLine.length > 0) wrappedLines.push(currentLine)

    // Dibujar cada línea
    wrappedLines.forEach((line, lineIdx) => {
      const isLastLine = lineIdx === wrappedLines.length - 1
      const lineText = line.map((w) => w.word).join('')
      const lineWidth = estimateWidth(lineText.trim(), fontSize)

      let startX = x
      if (align === 'center') startX = x - lineWidth / 2
      else if (align === 'right') startX = x - lineWidth
      // justify: calcular espaciado extra entre palabras (no en última línea)

      let cursorX = startX
      const nonSpaceItems = line.filter((w) => !w.word.match(/^\s+$/))
      const spaceCount = line.filter((w) => w.word.match(/^\s+$/)).length
      const extraSpace = (align === 'justify' && !isLastLine && spaceCount > 0)
        ? (maxWidth - lineWidth) / spaceCount
        : 0

      for (const item of line) {
        if (item.word.match(/^\s+$/)) {
          cursorX += estimateWidth(' ', fontSize) + extraSpace
          continue
        }
        const font = item.bold ? (boldFont ?? 'Helvetica-Bold') : (regularFont ?? 'Helvetica')
        const w = estimateWidth(item.word, fontSize)
        page.drawText(item.word, {
          x: cursorX,
          y: currentY,
          size: fontSize,
          font,
          color,
        })
        cursorX += w
      }

      currentY -= lineHeight
    })
  }
}

// ─── Utilidades ───────────────────────────────────────────────────────────────

function estimateWidth(text: string, fontSize: number): number {
  return text.length * fontSize * 0.55
}

function wrapText(text: string, fontSize: number, maxWidth: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let current = ''

  for (const word of words) {
    const test = current ? `${current} ${word}` : word
    if (estimateWidth(test, fontSize) > maxWidth && current) {
      lines.push(current)
      current = word
    } else {
      current = test
    }
  }
  if (current) lines.push(current)
  return lines.length > 0 ? lines : [text]
}

function parseColor(hexColor: string): any {
  const hex = hexColor.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16) / 255
  const g = parseInt(hex.substring(2, 4), 16) / 255
  const b = parseInt(hex.substring(4, 6), 16) / 255
  return rgb(r, g, b)
}

function formatDate(date: Date): string {
  const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
  return `${date.getDate()} de ${meses[date.getMonth()]} de ${date.getFullYear()}`
}
