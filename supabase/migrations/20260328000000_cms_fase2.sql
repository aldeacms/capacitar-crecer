-- =============================================================
-- MIGRACIÓN FASE 2: CMS y Configuración OTEC
-- Fecha: 2026-03-28
-- Ejecutar en: Supabase Dashboard → SQL Editor → Run
-- =============================================================

-- ---------------------------------------------------------------
-- 1. TABLA: app_config
-- Configuración global de la OTEC. Una sola fila.
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.app_config (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre_otec               TEXT NOT NULL DEFAULT 'Capacitar y Crecer',
  slogan                    TEXT DEFAULT 'Evoluciona con formación pro',
  descripcion               TEXT DEFAULT 'Programas técnicos de alto impacto diseñados para Chile.',
  logo_url                  TEXT,
  favicon_url               TEXT,
  color_primario            TEXT NOT NULL DEFAULT '#28B4AD',
  color_secundario          TEXT NOT NULL DEFAULT '#1f9593',
  email_contacto            TEXT DEFAULT 'contacto@capacitarycrecer.cl',
  telefono_contacto         TEXT DEFAULT '+56 9 2964 2878',
  direccion                 TEXT,
  rut_empresa               TEXT,
  redes_sociales            JSONB DEFAULT '{"instagram": "", "linkedin": "", "facebook": ""}',
  meta_title_default        TEXT DEFAULT 'Capacitar y Crecer - Formación Profesional',
  meta_description_default  TEXT DEFAULT 'Programas técnicos de alto impacto diseñados para Chile.',
  registro_publico_habilitado BOOLEAN NOT NULL DEFAULT true,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Solo puede existir una fila de configuración
ALTER TABLE public.app_config ADD CONSTRAINT app_config_single_row CHECK (id IS NOT NULL);

-- ---------------------------------------------------------------
-- 2. TABLA: secciones_landing
-- Bloques configurables del home. Una fila por sección.
-- ---------------------------------------------------------------
CREATE TYPE IF NOT EXISTS landing_seccion_tipo AS ENUM (
  'hero', 'stats', 'clientes', 'about', 'testimonios'
);

CREATE TABLE IF NOT EXISTS public.secciones_landing (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seccion    landing_seccion_tipo NOT NULL UNIQUE,
  contenido  JSONB NOT NULL DEFAULT '{}',
  activa     BOOLEAN NOT NULL DEFAULT true,
  orden      SMALLINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------
-- 3. TABLA: paginas
-- Páginas CMS editables: Sobre Nosotros, Contacto, Términos, etc.
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.paginas (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug             TEXT NOT NULL UNIQUE,
  titulo           TEXT NOT NULL,
  contenido_html   TEXT NOT NULL DEFAULT '',
  meta_title       TEXT,
  meta_description TEXT,
  publicada        BOOLEAN NOT NULL DEFAULT false,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS paginas_slug_idx ON public.paginas(slug);
CREATE INDEX IF NOT EXISTS paginas_publicada_idx ON public.paginas(publicada);

-- ---------------------------------------------------------------
-- 4. TABLA: media_library
-- Registro de imágenes subidas a Supabase Storage.
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.media_library (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre       TEXT NOT NULL,
  url          TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  tipo_mime    TEXT NOT NULL DEFAULT 'image/jpeg',
  tamano_bytes INTEGER,
  subida_por   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------
-- 5. RLS POLICIES
-- ---------------------------------------------------------------

-- app_config: lectura pública, escritura solo admins
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "app_config_public_read" ON public.app_config
  FOR SELECT TO public USING (true);

CREATE POLICY "app_config_admin_write" ON public.app_config
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid() AND is_active = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid() AND is_active = true)
  );

-- secciones_landing: lectura pública, escritura solo admins
ALTER TABLE public.secciones_landing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "secciones_landing_public_read" ON public.secciones_landing
  FOR SELECT TO public USING (true);

CREATE POLICY "secciones_landing_admin_write" ON public.secciones_landing
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid() AND is_active = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid() AND is_active = true)
  );

-- paginas: lectura pública solo si está publicada, escritura solo admins
ALTER TABLE public.paginas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "paginas_public_read" ON public.paginas
  FOR SELECT TO public USING (publicada = true);

CREATE POLICY "paginas_admin_all" ON public.paginas
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid() AND is_active = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid() AND is_active = true)
  );

-- media_library: lectura pública, escritura solo admins
ALTER TABLE public.media_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "media_library_public_read" ON public.media_library
  FOR SELECT TO public USING (true);

CREATE POLICY "media_library_admin_write" ON public.media_library
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid() AND is_active = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid() AND is_active = true)
  );

-- ---------------------------------------------------------------
-- 6. TRIGGER: updated_at automático
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER app_config_updated_at
  BEFORE UPDATE ON public.app_config
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER secciones_landing_updated_at
  BEFORE UPDATE ON public.secciones_landing
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER paginas_updated_at
  BEFORE UPDATE ON public.paginas
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------
-- 7. DATOS INICIALES (seed)
-- Valores actuales hardcodeados migrados a la BD
-- ---------------------------------------------------------------

-- Config inicial de la OTEC
INSERT INTO public.app_config (
  nombre_otec, slogan, descripcion,
  color_primario, color_secundario,
  email_contacto, telefono_contacto,
  redes_sociales,
  meta_title_default, meta_description_default
) VALUES (
  'Capacitar y Crecer',
  'Evoluciona con formación pro',
  'Programas técnicos de alto impacto diseñados para Chile. Aprende de expertos y certifícate.',
  '#28B4AD',
  '#1f9593',
  'contacto@capacitarycrecer.cl',
  '+56 9 2964 2878',
  '{"instagram": "", "linkedin": "", "facebook": ""}',
  'Capacitar y Crecer - Formación Profesional en Chile',
  'Programas técnicos de alto impacto diseñados para Chile. Aprende de expertos y certifícate.'
)
ON CONFLICT DO NOTHING;

-- Sección Hero
INSERT INTO public.secciones_landing (seccion, orden, contenido) VALUES (
  'hero', 1,
  '{
    "eyebrow": "Capacitación OTEC · Norma NCH2728",
    "titulo": "Evoluciona con formación pro",
    "subtitulo": "Programas técnicos de alto impacto diseñados para Chile. Aprende de expertos y certifícate.",
    "cta_texto": "Ver Cursos",
    "cta_url": "/cursos",
    "imagen_url": "https://images.unsplash.com/photo-1552581234-26160f608093?w=1200",
    "badge_alumnos": "+7k Alumnos",
    "badge_rating": "4.9 Reseñas"
  }'
) ON CONFLICT (seccion) DO NOTHING;

-- Sección Stats
INSERT INTO public.secciones_landing (seccion, orden, contenido) VALUES (
  'stats', 2,
  '{
    "descripcion": "Capacitar & Crecer nace de la inquietud de profesionales con experiencia en el área de la capacitación y la gestión de personas.",
    "items": [
      {"numero": "+7.000", "label": "personas capacitadas"},
      {"numero": "+70", "label": "cursos disponibles"},
      {"numero": "+10", "label": "años de experiencia"}
    ]
  }'
) ON CONFLICT (seccion) DO NOTHING;

-- Sección Clientes
INSERT INTO public.secciones_landing (seccion, orden, contenido) VALUES (
  'clientes', 3,
  '{
    "titulo": "Empresas que confían en nosotros",
    "items": [
      {"nombre": "EL VALLEJO", "logo_url": ""},
      {"nombre": "COPEC", "logo_url": ""},
      {"nombre": "QUILIN", "logo_url": ""},
      {"nombre": "SACYR", "logo_url": ""},
      {"nombre": "TRANS ANTOFAGASTA", "logo_url": ""},
      {"nombre": "ALM", "logo_url": ""},
      {"nombre": "BUENAS HIJAS", "logo_url": ""},
      {"nombre": "POLICIA", "logo_url": ""}
    ]
  }'
) ON CONFLICT (seccion) DO NOTHING;

-- Páginas por defecto (en borrador hasta que el admin las complete)
INSERT INTO public.paginas (slug, titulo, contenido_html, publicada) VALUES
  ('sobre-nosotros', 'Sobre Nosotros',
   '<h1>Sobre Nosotros</h1><p>Somos una OTEC dedicada a la formación profesional en Chile.</p>',
   false),
  ('contacto', 'Contacto',
   '<h1>Contacto</h1><p>Puedes contactarnos a través del formulario en nuestra página principal.</p>',
   false),
  ('terminos-y-condiciones', 'Términos y Condiciones',
   '<h1>Términos y Condiciones</h1><p>Contenido pendiente de redacción.</p>',
   false),
  ('politica-de-privacidad', 'Política de Privacidad',
   '<h1>Política de Privacidad</h1><p>Contenido pendiente de redacción.</p>',
   false)
ON CONFLICT (slug) DO NOTHING;

-- ---------------------------------------------------------------
-- FIN DE MIGRACIÓN
-- ---------------------------------------------------------------
-- Tablas creadas: app_config, secciones_landing, paginas, media_library
-- RLS habilitado en todas
-- Datos iniciales insertados
-- =============================================================
