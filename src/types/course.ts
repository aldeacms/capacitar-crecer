export interface CourseFormData {
  id?: string;
  titulo: string;
  slug: string;
  descripcion_breve: string;
  dirigido_a?: string;
  categoria_id: string;
  estado: 'borrador' | 'publicado';
  modalidad: 'online-asincrono' | 'online-envivo' | 'presencial';
  horas: number;
  tipo_acceso: 'pago-inmediato' | 'cotizar' | 'gratis';
  precio_curso: number;
  tiene_certificado: boolean;
  precio_certificado: number;
  porcentaje_aprobacion: number;
  tiene_sence: boolean;
  imagen_url?: string;
  objetivos?: string;
  metodologia?: string;
  contenido_programatico?: string;
  caracteristicas_generales?: string;
}

export interface Lesson {
  id: string;
  modulo_id: string;
  titulo: string;
  tipo: 'video' | 'texto' | 'quiz';
  orden: number;
  contenido_html?: string;
  video_url?: string;
  dias_para_desbloqueo: number; // 0 = Inmediato
  created_at: string;
}

export interface Module {
  id: string;
  curso_id: string;
  titulo: string;
  orden: number;
  lecciones?: Lesson[];
  created_at: string;
}
