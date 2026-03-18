export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      cursos: {
        Row: {
          caracteristicas_generales: string | null
          contenido_programatico: string | null
          created_at: string
          descripcion_breve: string | null
          id: string
          imagen_url: string | null
          metodologia: string | null
          objetivos: string | null
          porcentaje_aprobacion: number | null
          precio_certificado: number | null
          precio_curso: number | null
          slug: string
          tipo_acceso: Database["public"]["Enums"]["tipo_acceso"] | null
          titulo: string
          tiene_sence: boolean | null
          tiene_certificado: boolean | null
          modalidad: string | null
          estado: string | null
          horas: number | null
          categoria_id: string | null
          dirigido_a: string | null
        }
        Insert: {
          caracteristicas_generales?: string | null
          contenido_programatico?: string | null
          created_at?: string
          descripcion_breve?: string | null
          id?: string
          imagen_url?: string | null
          metodologia?: string | null
          objetivos?: string | null
          porcentaje_aprobacion?: number | null
          precio_certificado?: number | null
          precio_curso?: number | null
          slug: string
          tipo_acceso?: Database["public"]["Enums"]["tipo_acceso"] | null
          titulo: string
          tiene_sence?: boolean | null
          tiene_certificado?: boolean | null
          modalidad?: string | null
          estado?: string | null
          horas?: number | null
          categoria_id?: string | null
          dirigido_a?: string | null
        }
        Update: {
          caracteristicas_generales?: string | null
          contenido_programatico?: string | null
          created_at?: string
          descripcion_breve?: string | null
          id?: string
          imagen_url?: string | null
          metodologia?: string | null
          objetivos?: string | null
          porcentaje_aprobacion?: number | null
          precio_certificado?: number | null
          precio_curso?: number | null
          slug?: string
          tipo_acceso?: Database["public"]["Enums"]["tipo_acceso"] | null
          titulo?: string
          tiene_sence?: boolean | null
          tiene_certificado?: boolean | null
          modalidad?: string | null
          estado?: string | null
          horas?: number | null
          categoria_id?: string | null
          dirigido_a?: string | null
        }
        Relationships: []
      }
      categorias: {
        Row: {
          id: string
          nombre: string
          slug: string | null
          descripcion: string | null
          description: string | null
          imagen_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          nombre: string
          slug?: string | null
          descripcion?: string | null
          description?: string | null
          imagen_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          nombre?: string
          slug?: string | null
          descripcion?: string | null
          description?: string | null
          imagen_url?: string | null
          created_at?: string
        }
        Relationships: []
      }
      lecciones_archivos: {
        Row: {
          id: string
          leccion_id: string
          nombre_archivo: string
          archivo_url: string
          created_at: string
        }
        Insert: {
          id?: string
          leccion_id: string
          nombre_archivo: string
          archivo_url: string
          created_at?: string
        }
        Update: {
          id?: string
          leccion_id?: string
          nombre_archivo?: string
          archivo_url?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lecciones_archivos_leccion_id_fkey"
            columns: ["leccion_id"]
            isOneToOne: false
            referencedRelation: "lecciones"
            referencedColumns: ["id"]
          }
        ]
      }
      inscripciones: {
        Row: {
          id: string
          perfil_id: string
          curso_id: string
          estado: string | null
          progreso_porcentaje: number | null
          created_at: string
        }
        Insert: {
          id?: string
          perfil_id: string
          curso_id: string
          estado?: string | null
          progreso_porcentaje?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          perfil_id?: string
          curso_id?: string
          estado?: string | null
          progreso_porcentaje?: number | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inscripciones_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inscripciones_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          }
        ]
      }
      lecciones: {
        Row: {
          contenido_html: string | null
          created_at: string
          id: string
          modulo_id: string
          orden: number
          tipo: Database["public"]["Enums"]["tipo_leccion"] | null
          titulo: string
          video_url: string | null
        }
        Insert: {
          contenido_html?: string | null
          created_at?: string
          id?: string
          modulo_id: string
          orden: number
          tipo?: Database["public"]["Enums"]["tipo_leccion"] | null
          titulo: string
          video_url?: string | null
        }
        Update: {
          contenido_html?: string | null
          created_at?: string
          id?: string
          modulo_id?: string
          orden?: number
          tipo?: Database["public"]["Enums"]["tipo_leccion"] | null
          titulo?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lecciones_modulo_id_fkey"
            columns: ["modulo_id"]
            isOneToOne: false
            referencedRelation: "modulos"
            referencedColumns: ["id"]
          },
        ]
      }
      matriculas: {
        Row: {
          created_at: string
          curso_id: string
          estado_pago_certificado: boolean | null
          estado_pago_curso: boolean | null
          id: string
          perfil_id: string
          progreso_porcentaje: number | null
        }
        Insert: {
          created_at?: string
          curso_id: string
          estado_pago_certificado?: boolean | null
          estado_pago_curso?: boolean | null
          id?: string
          perfil_id: string
          progreso_porcentaje?: number | null
        }
        Update: {
          created_at?: string
          curso_id?: string
          estado_pago_certificado?: boolean | null
          estado_pago_curso?: boolean | null
          id?: string
          perfil_id?: string
          progreso_porcentaje?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "matriculas_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matriculas_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      modulos: {
        Row: {
          created_at: string
          curso_id: string
          id: string
          orden: number
          titulo: string
        }
        Insert: {
          created_at?: string
          curso_id: string
          id?: string
          orden: number
          titulo: string
        }
        Update: {
          created_at?: string
          curso_id?: string
          id?: string
          orden?: number
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "modulos_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          },
        ]
      }
      perfiles: {
        Row: {
          created_at: string
          id: string
          nombre_completo: string
          rol: string | null
          rut: string
        }
        Insert: {
          created_at?: string
          id: string
          nombre_completo: string
          rol?: string | null
          rut: string
        }
        Update: {
          created_at?: string
          id?: string
          nombre_completo?: string
          rol?: string | null
          rut?: string
        }
        Relationships: []
      }
      quizzes_opciones: {
        Row: {
          created_at: string
          es_correcta: boolean | null
          id: string
          pregunta_id: string
          texto: string
        }
        Insert: {
          created_at?: string
          es_correcta?: boolean | null
          id?: string
          pregunta_id: string
          texto: string
        }
        Update: {
          created_at?: string
          es_correcta?: boolean | null
          id?: string
          pregunta_id?: string
          texto?: string
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_opciones_pregunta_id_fkey"
            columns: ["pregunta_id"]
            isOneToOne: false
            referencedRelation: "quizzes_preguntas"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes_preguntas: {
        Row: {
          created_at: string
          id: string
          leccion_id: string
          puntos: number | null
          texto: string
          tipo: Database["public"]["Enums"]["tipo_pregunta"] | null
        }
        Insert: {
          created_at?: string
          id?: string
          leccion_id: string
          puntos?: number | null
          texto: string
          tipo?: Database["public"]["Enums"]["tipo_pregunta"] | null
        }
        Update: {
          created_at?: string
          id?: string
          leccion_id?: string
          puntos?: number | null
          texto?: string
          tipo?: Database["public"]["Enums"]["tipo_pregunta"] | null
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_preguntas_leccion_id_fkey"
            columns: ["leccion_id"]
            isOneToOne: false
            referencedRelation: "lecciones"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      tipo_acceso: "gratis" | "pago-inmediato" | "pago" | "gratis_cert_pago" | "cotizar"
      tipo_leccion: "video" | "texto" | "quiz"
      tipo_pregunta: "multiple" | "vf" | "abierta"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      tipo_acceso: ["gratis", "pago-inmediato", "pago", "gratis_cert_pago", "cotizar"],
      tipo_leccion: ["video", "texto", "quiz"],
      tipo_pregunta: ["multiple", "vf", "abierta"],
    },
  },
} as const
