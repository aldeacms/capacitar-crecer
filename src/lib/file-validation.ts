/**
 * Validación segura de archivos subidos
 * Previene XSS, malware, y sobrecarga del servidor
 */

export interface FileValidationOptions {
  maxSize?: number // en bytes
  allowedMimeTypes?: string[]
  allowedExtensions?: string[]
  sanitizeFileName?: boolean
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  sanitizedFileName?: string
  mimeType?: string
}

// Tipos MIME comunes permitidos por defecto
export const DEFAULT_ALLOWED_MIME_TYPES = {
  IMAGES: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'image/avif',
  ],
  DOCUMENTS: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
  ],
  ARCHIVES: [
    'application/zip',
    'application/x-rar-compressed',
    'application/x-tar',
    'application/x-7z-compressed',
  ],
}

// Tamaños máximos por defecto (en bytes)
export const DEFAULT_MAX_SIZES = {
  IMAGE: 10 * 1024 * 1024, // 10MB
  DOCUMENT: 20 * 1024 * 1024, // 20MB
  ARCHIVE: 50 * 1024 * 1024, // 50MB
  GENERAL: 10 * 1024 * 1024, // 10MB
}

/**
 * Valida un archivo según las opciones proporcionadas
 */
export async function validateFile(
  file: File,
  options: FileValidationOptions = {}
): Promise<ValidationResult> {
  const errors: string[] = []
  const {
    maxSize = DEFAULT_MAX_SIZES.GENERAL,
    allowedMimeTypes = [],
    allowedExtensions = [],
    sanitizeFileName = true,
  } = options

  // 1. Validar tamaño
  if (file.size > maxSize) {
    errors.push(`El archivo excede el tamaño máximo permitido (${formatBytes(maxSize)})`)
  }

  // 2. Validar tipo MIME real (no confiar en la extensión)
  const mimeType = await detectMimeType(file)
  if (mimeType && allowedMimeTypes.length > 0 && !allowedMimeTypes.includes(mimeType)) {
    errors.push(`Tipo de archivo no permitido: ${mimeType}`)
  }

  // 3. Validar extensión (opcional, adicional al MIME)
  const fileExtension = getFileExtension(file.name)
  if (allowedExtensions.length > 0 && fileExtension) {
    if (!allowedExtensions.includes(fileExtension.toLowerCase())) {
      errors.push(`Extensión de archivo no permitida: ${fileExtension}`)
    }
  }

  // 4. Sanitizar nombre de archivo (prevenir path traversal, XSS)
  let sanitizedFileName = file.name
  if (sanitizeFileName) {
    sanitizedFileName = sanitizeFileNameFunc(file.name)
  }

  // 5. Validar nombre de archivo (prevenir caracteres peligrosos)
  if (!isValidFileName(sanitizedFileName)) {
    errors.push('El nombre del archivo contiene caracteres no permitidos')
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedFileName: errors.length === 0 ? sanitizedFileName : undefined,
    mimeType,
  }
}

/**
 * Detecta el tipo MIME real del archivo usando magic bytes
 */
async function detectMimeType(file: File): Promise<string | null> {
  // Intentar detectar mediante magic bytes (primeros bytes del archivo)
  try {
    const buffer = await file.slice(0, 4100).arrayBuffer() // Suficiente para detectar la mayoría de tipos
    const bytes = new Uint8Array(buffer)

    // Detección básica de magic numbers
    if (bytes.length >= 4) {
      // JPEG
      if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
        return 'image/jpeg'
      }
      // PNG
      if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
        return 'image/png'
      }
      // GIF
      if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
        return 'image/gif'
      }
      // PDF
      if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
        return 'application/pdf'
      }
      // ZIP
      if (bytes[0] === 0x50 && bytes[1] === 0x4B && bytes[2] === 0x03 && bytes[3] === 0x04) {
        return 'application/zip'
      }
    }

    // Si no se detecta magic number, usar el tipo MIME del navegador (menos confiable)
    return file.type || null
  } catch (error) {
    console.warn('Error detecting MIME type:', error)
    return file.type || null
  }
}

/**
 * Obtiene la extensión del archivo (sin el punto)
 */
function getFileExtension(filename: string): string | null {
  const match = filename.match(/\.([a-zA-Z0-9]+)$/)
  return match ? match[1].toLowerCase() : null
}

/**
 * Sanitiza el nombre de archivo para prevenir path traversal y XSS
 */
function sanitizeFileNameFunc(filename: string): string {
  // Remover caracteres peligrosos
  let sanitized = filename
    .replace(/[\\/:"*?<>|]/g, '_') // Caracteres peligrosos en Windows/Unix
    .replace(/\s+/g, '_') // Espacios por guiones bajos
    .replace(/[^\w.\-]/g, '') // Solo caracteres alfanuméricos, puntos y guiones

  // Prevenir nombres que comiencen con punto (archivos ocultos)
  sanitized = sanitized.replace(/^\.+/g, '')

  // Limitar longitud
  const maxLength = 255
  if (sanitized.length > maxLength) {
    const extension = getFileExtension(sanitized)
    const nameWithoutExt = sanitized.substring(0, sanitized.length - (extension?.length || 0) - 1)
    const truncated = nameWithoutExt.substring(0, maxLength - (extension?.length || 0) - 1)
    sanitized = extension ? `${truncated}.${extension}` : truncated
  }

  return sanitized
}

/**
 * Valida que el nombre de archivo sea seguro
 */
function isValidFileName(filename: string): boolean {
  // No permitir path traversal
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return false
  }

  // No permitir caracteres de control
  if (/[\x00-\x1F\x7F]/.test(filename)) {
    return false
  }

  // No permitir nombres reservados del sistema
  const reservedNames = [
    'CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9',
    'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'
  ]
  const nameWithoutExt = filename.split('.')[0].toUpperCase()
  if (reservedNames.includes(nameWithoutExt)) {
    return false
  }

  return true
}

/**
 * Formatea bytes a una representación legible
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Configuraciones predefinidas para tipos comunes de archivos
 */
export const VALIDATION_CONFIGS = {
  IMAGES: {
    maxSize: DEFAULT_MAX_SIZES.IMAGE,
    allowedMimeTypes: DEFAULT_ALLOWED_MIME_TYPES.IMAGES,
    allowedExtensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'avif'],
  },
  DOCUMENTS: {
    maxSize: DEFAULT_MAX_SIZES.DOCUMENT,
    allowedMimeTypes: DEFAULT_ALLOWED_MIME_TYPES.DOCUMENTS,
    allowedExtensions: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv'],
  },
  ARCHIVES: {
    maxSize: DEFAULT_MAX_SIZES.ARCHIVE,
    allowedMimeTypes: DEFAULT_ALLOWED_MIME_TYPES.ARCHIVES,
    allowedExtensions: ['zip', 'rar', 'tar', '7z'],
  },
}