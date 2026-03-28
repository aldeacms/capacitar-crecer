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
}

export interface QRPosition {
  x: number
  y: number
  size: number
}

export interface Firmante {
  nombre: string
  cargo: string
  firma_storage_path?: string
  pos: {
    x: number
    y: number
    width: number
  }
}

export interface CertificateTemplate {
  id: string
  curso_id: string | null
  nombre: string
  titulo_texto: string
  background_storage_path: string | null
  font_primary_url?: string
  font_secondary_url?: string
  color_primary: string
  color_accent: string

  // Posiciones de elementos
  pos_titulo_cert: ElementPosition
  pos_nombre_alumno: ElementPosition
  pos_rut_alumno: ElementPosition
  pos_titulo_curso: ElementPosition
  pos_horas: ElementPosition
  pos_fecha_emision: ElementPosition
  pos_fecha_vigencia: ElementPosition
  pos_qr_code: QRPosition
  pos_cert_id: ElementPosition

  // Firmantes
  firmantes: Firmante[]

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
