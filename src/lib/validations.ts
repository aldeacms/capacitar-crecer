/**
 * Shared Zod validation schemas for server actions
 * Used to validate inputs in server actions before processing
 */

import { z } from 'zod'

// ===== COMMON SCHEMAS =====

export const UUIDSchema = z.string().uuid('ID inválido - debe ser un UUID')

export const PasswordSchema = z
  .string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .max(100, 'La contraseña no puede exceder 100 caracteres')

// ===== USER/PERFIL SCHEMAS =====

export const UsuarioSchema = z.object({
  email: z.string().email('Email inválido'),
  nombre_completo: z.string().min(2, 'Nombre debe tener al menos 2 caracteres').max(200),
  rut: z.string().min(1, 'RUT es requerido').optional(),
  password: PasswordSchema.optional(),
})

export const ActualizarPerfilSchema = z.object({
  nombre_completo: z.string().min(2).max(200).optional(),
  rut: z.string().optional(),
})

// Admin users are managed separately via admin_users table
export const CrearAdminSchema = z.object({
  userId: z.string().uuid('ID de usuario inválido'),
  email: z.string().email('Email inválido').optional(),
})

// ===== COURSE SCHEMAS =====

export const CursoSchema = z.object({
  titulo: z.string().min(3, 'Título debe tener al menos 3 caracteres').max(200),
  slug: z.string().min(1, 'Slug es requerido').max(200),
  descripcion_breve: z.string().max(500).optional(),
  dirigido_a: z.string().max(500).optional(),
  categoria_id: z.string().uuid('ID de categoría inválido').nullable().optional(),
  estado: z.string().optional(),
  modalidad: z.string().optional(),
  horas: z.number().int().min(1, 'Horas debe ser mayor a 0'),
  tipo_acceso: z.enum(['gratis', 'pago', 'gratis_cert_pago', 'cotizar']),
  precio_curso: z.number().min(0, 'Precio no puede ser negativo'),
  precio_certificado: z.number().min(0, 'Precio certificado no puede ser negativo'),
  porcentaje_aprobacion: z.number().int().min(0).max(100),
  tiene_sence: z.boolean().optional(),
  tiene_certificado: z.boolean().optional(),
  objetivos: z.string().optional(),
  metodologia: z.string().optional(),
  contenido_programatico: z.string().optional(),
  caracteristicas_generales: z.string().optional(),
})

// ===== MODULE/LESSON SCHEMAS =====

export const ModuloSchema = z.object({
  titulo: z.string().min(1, 'Título es requerido').max(200),
  orden: z.number().int().min(0, 'Orden no puede ser negativo'),
})

export const LeccionSchema = z.object({
  titulo: z.string().min(1, 'Título es requerido').max(200),
  contenido_html: z.string().optional(),
  tipo: z.enum(['video', 'texto', 'quiz']).catch('video'),
  video_url: z.string().optional(),
  orden: z.number().int().min(0),
})

// ===== COUPON SCHEMAS =====

export const CuponSchema = z.object({
  codigo: z.string().min(3, 'Código debe tener al menos 3 caracteres').max(20),
  descuento_porcentaje: z.number().int().min(1, 'Descuento debe ser entre 1 y 100').max(100),
  usos_maximos: z.number().int().min(1).optional(),
  activo: z.boolean().optional(),
})

// ===== QUIZ SCHEMAS =====

export const QuestionOptionSchema = z.object({
  texto: z.string().min(1, 'Opción no puede estar vacía'),
  es_correcta: z.boolean(),
  texto_pareado: z.string().optional(),
  id: z.string().optional(),
})

export const QuestionSchema = z.object({
  leccion_id: z.string().uuid('ID de lección inválido'),
  texto: z.string().min(3, 'Pregunta debe tener al menos 3 caracteres'),
  tipo: z.enum(['multiple', 'vf', 'abierta', 'pareados']),
  puntos: z.number().int().min(1, 'Puntos debe ser mínimo 1'),
  opciones: z.array(QuestionOptionSchema).min(2, 'Debe haber al menos 2 opciones'),
})

// ===== CATEGORY SCHEMAS =====

export const CategorySchema = z.object({
  nombre: z.string().min(2, 'Nombre debe tener al menos 2 caracteres').max(100),
  slug: z.string().min(1).max(100),
  descripcion: z.string().optional(),
})

// ===== CERTIFICATE SCHEMAS =====

export const CertificateGenerationSchema = z.object({
  cursoId: z.string().uuid('ID de curso inválido'),
})

export const InvalidateCertificateSchema = z.object({
  certificateId: z.string().uuid('ID de certificado inválido'),
})
