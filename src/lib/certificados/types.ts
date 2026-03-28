/**
 * Tipos del sistema de certificados
 */

export interface ElementPosition {
  x: number
  y: number
  fontSize?: number
  color?: string
  maxWidth?: number
  align?: 'left' | 'center' | 'right'
  visible?: boolean
}

export interface QRPosition {
  x: number
  y: number
  size: number
  visible?: boolean
}

export interface TextoLibre {
  id: string
  text: string
  pos: ElementPosition
}

export interface CertificateTemplate {
  id: string
  curso_id: string | null
  nombre: string
  titulo_texto: string
  orientacion: 'horizontal' | 'vertical'
  background_storage_path: string | null
  color_primary: string
  color_accent: string

  // Posiciones de elementos fijos
  pos_titulo_cert: ElementPosition
  pos_nombre_alumno: ElementPosition
  pos_rut_alumno: ElementPosition
  pos_titulo_curso: ElementPosition
  pos_horas: ElementPosition
  pos_fecha_emision: ElementPosition
  pos_fecha_vigencia: ElementPosition
  pos_qr_code: QRPosition
  pos_cert_id: ElementPosition

  // Bloques de texto libre
  texto_libre: TextoLibre[]

  activo: boolean
  created_at: string
  updated_at: string
}

export interface CertificateData {
  certificateId: string
  nombreAlumno: string
  rutAlumno: string
  nombreCurso: string
  horas: number | null
  fechaEmision: Date
  fechaVigencia: Date
  template: CertificateTemplate
}

export interface CertificateRecord {
  id: string
  perfil_id: string
  curso_id: string
  nombre_archivo: string
  storage_path: string | null
  template_id: string | null
  fecha_vigencia: string | null
  version: number
  created_at: string
  invalidado_at: string | null
  invalidado_por: string | null
}

export interface GenerateCertificateResult {
  success: boolean
  certificateId: string
  downloadUrl: string
  fileName: string
  error?: string
}
