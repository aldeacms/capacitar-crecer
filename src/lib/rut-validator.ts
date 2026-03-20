/**
 * Validación de RUT chileno con dígito verificador (módulo 11)
 * Formato aceptado: 12.345.678-9 o 123456789
 */

export function validateRUTDigit(rut: string): boolean {
  if (!rut || typeof rut !== 'string') return false

  // Limpiar formato: remover puntos, espacios y convertir a mayúscula
  const cleanRut = rut.trim().replace(/\./g, '').replace(/\s/g, '').toUpperCase()

  // Validar formato básico: número-dígito (donde dígito puede ser número o K)
  const rutRegex = /^(\d{1,8})-?([0-9K])$/
  const match = cleanRut.match(rutRegex)

  if (!match) return false

  const [, numStr, digit] = match
  const rutNumber = parseInt(numStr, 10)

  // Calcular dígito verificador con módulo 11
  const verificador = calculateVerificationDigit(rutNumber)

  // Comparar con el dígito proporcionado
  return digit === verificador
}

/**
 * Calcula el dígito verificador de un RUT usando módulo 11
 * Algoritmo: multiplicar dígitos por 2,3,4,5,6,7 de derecha a izquierda
 */
function calculateVerificationDigit(rutNumber: number): string {
  const multipliers = [2, 3, 4, 5, 6, 7]
  const rutStr = rutNumber.toString().padStart(8, '0')

  let sum = 0
  let multiplierIndex = 0

  // Iterar de derecha a izquierda
  for (let i = rutStr.length - 1; i >= 0; i--) {
    const digit = parseInt(rutStr[i], 10)
    const multiplier = multipliers[multiplierIndex % multipliers.length]
    sum += digit * multiplier
    multiplierIndex++
  }

  const remainder = sum % 11
  const verificationDigit = 11 - remainder

  // Si el resultado es 11, devolver 0; si es 10, devolver K
  if (verificationDigit === 11) return '0'
  if (verificationDigit === 10) return 'K'
  return verificationDigit.toString()
}

/**
 * Normaliza un RUT al formato: 12.345.678-9
 */
export function normalizeRUT(rut: string): string {
  const cleanRut = rut.trim().replace(/\./g, '').replace(/\s/g, '').toUpperCase()
  const match = cleanRut.match(/^(\d{1,8})-?([0-9K])$/)

  if (!match) return rut // Devolver original si no matches

  const [, numStr, digit] = match
  const num = parseInt(numStr, 10)

  // Formatear como XX.XXX.XXX-D
  const formatted = num
    .toString()
    .padStart(8, '0')
    .replace(/(\d{2})(\d{3})(\d{3})/, '$1.$2.$3')

  return `${formatted}-${digit}`
}

/**
 * Valida RUT y retorna objeto con éxito/error y RUT normalizado
 */
export function validateAndNormalizeRUT(rut: string): {
  valid: boolean
  normalized?: string
  error?: string
} {
  if (!rut || typeof rut !== 'string') {
    return { valid: false, error: 'RUT es requerido' }
  }

  const trimmed = rut.trim()
  if (trimmed.length === 0) {
    return { valid: false, error: 'RUT no puede estar vacío' }
  }

  if (!validateRUTDigit(trimmed)) {
    return { valid: false, error: 'RUT inválido (dígito verificador incorrecto)' }
  }

  return {
    valid: true,
    normalized: normalizeRUT(trimmed)
  }
}
