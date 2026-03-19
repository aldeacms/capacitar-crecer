-- ============================================================
-- TABLA: certificate_templates (nuevas plantillas de certificados)
-- Define la plantilla visual de certificado por curso.
-- ============================================================
CREATE TABLE IF NOT EXISTS certificate_templates (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  curso_id        UUID REFERENCES cursos ON DELETE CASCADE UNIQUE,  -- NULL = template global
  nombre          TEXT NOT NULL DEFAULT 'default',
  background_storage_path TEXT,  -- path en Supabase Storage
  font_primary_url    TEXT,
  font_secondary_url  TEXT,
  color_primary   TEXT DEFAULT '#1a1a2e',
  color_accent    TEXT DEFAULT '#28B4AD',

  -- Posiciones de elementos (JSONB: { x, y, fontSize, color?, maxWidth?, align? })
  pos_titulo_cert    JSONB DEFAULT '{"x":421,"y":380,"fontSize":14,"align":"center"}',
  pos_nombre_alumno  JSONB DEFAULT '{"x":421,"y":300,"fontSize":28,"align":"center","maxWidth":600}',
  pos_rut_alumno     JSONB DEFAULT '{"x":421,"y":260,"fontSize":14,"align":"center"}',
  pos_titulo_curso   JSONB DEFAULT '{"x":421,"y":210,"fontSize":20,"align":"center","maxWidth":500}',
  pos_horas          JSONB DEFAULT '{"x":421,"y":175,"fontSize":12,"align":"center"}',
  pos_fecha_emision  JSONB DEFAULT '{"x":421,"y":150,"fontSize":11,"align":"center"}',
  pos_fecha_vigencia JSONB DEFAULT '{"x":421,"y":130,"fontSize":10,"align":"center"}',
  pos_qr_code        JSONB DEFAULT '{"x":720,"y":40,"size":90}',
  pos_cert_id        JSONB DEFAULT '{"x":421,"y":40,"fontSize":8,"align":"center"}',

  -- Firmantes: array de { nombre, cargo, firma_storage_path?, pos: {x,y,width} }
  firmantes       JSONB DEFAULT '[]',

  activo          BOOLEAN DEFAULT true,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL,
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

ALTER TABLE certificate_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lectura pública de templates" ON certificate_templates
  FOR SELECT USING (true);

CREATE POLICY "Solo admins modifican templates" ON certificate_templates
  FOR ALL USING (EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'admin'));

-- Insertar template default global
INSERT INTO certificate_templates (curso_id, nombre, background_storage_path)
VALUES (NULL, 'default', 'templates/formato-base.jpg')
ON CONFLICT (curso_id) DO NOTHING;

-- ============================================================
-- MODIFICAR: certificate_downloads (agregar nuevas columnas)
-- ============================================================
ALTER TABLE certificate_downloads
  ADD COLUMN IF NOT EXISTS storage_path    TEXT,
  ADD COLUMN IF NOT EXISTS template_id     UUID REFERENCES certificate_templates(id),
  ADD COLUMN IF NOT EXISTS fecha_vigencia  TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS version         INT DEFAULT 1,
  ADD COLUMN IF NOT EXISTS invalidado_at   TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS invalidado_por  UUID REFERENCES perfiles(id);

-- Agregar restricción UNIQUE si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'certificate_downloads_perfil_curso_unique'
  ) THEN
    ALTER TABLE certificate_downloads
      ADD CONSTRAINT certificate_downloads_perfil_curso_unique
      UNIQUE (perfil_id, curso_id);
  END IF;
END
$$;

-- Actualizar RLS: permitir lectura pública para validación por QR
DROP POLICY IF EXISTS "Usuarios ven sus propios certificados" ON certificate_downloads;
DROP POLICY IF EXISTS "Lectura pública de certificados" ON certificate_downloads;
DROP POLICY IF EXISTS "Usuarios pueden insertar sus certificados" ON certificate_downloads;
DROP POLICY IF EXISTS "Solo admins pueden actualizar certificados" ON certificate_downloads;

CREATE POLICY "Lectura pública de certificados" ON certificate_downloads
  FOR SELECT USING (true);

CREATE POLICY "Usuarios pueden insertar sus certificados" ON certificate_downloads
  FOR INSERT WITH CHECK (auth.uid() = perfil_id);

CREATE POLICY "Solo admins pueden actualizar certificados" ON certificate_downloads
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'admin')
  );
