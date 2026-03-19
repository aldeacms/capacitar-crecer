-- ====================================================================
-- AUDITORÍA CRÍTICA - SOLUCIONES DE BASE DE DATOS
-- Capacitar y Crecer LMS
-- ====================================================================

-- PASO 1: CREAR TABLA admin_users (SEPARAR ADMINS DE ALUMNOS)
-- ====================================================================
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT TRUE
);

-- Índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_admin_users_created_by ON admin_users(created_by);
CREATE INDEX IF NOT EXISTS idx_admin_users_is_active ON admin_users(is_active);

-- PASO 2: MIGRAR ADMINS DE perfiles A admin_users
-- ====================================================================
-- Insertar admins existentes en tabla nueva
INSERT INTO admin_users (id, created_at, is_active)
SELECT id, created_at, TRUE
FROM perfiles
WHERE rol = 'admin'
ON CONFLICT (id) DO NOTHING;

-- PASO 3: REMOVER COLUMNA rol DE perfiles (será solo para alumnos)
-- ====================================================================
-- Primero crear columna para datos históricos si es necesario
ALTER TABLE perfiles DROP COLUMN IF EXISTS rol CASCADE;

-- PASO 4: ARREGLAR RUT NULL EN TRIGGER handle_new_user()
-- ====================================================================
-- Hacer RUT nullable temporalmente (hasta que se complete el perfil)
ALTER TABLE perfiles ALTER COLUMN rut DROP NOT NULL;

-- Actualizar RUTs null con valores por defecto
UPDATE perfiles
SET rut = CONCAT('TEMP-', SUBSTRING(CAST(id AS TEXT), 1, 8))
WHERE rut IS NULL;

-- PASO 5: CREAR ÍNDICES PARA OPTIMIZAR BÚSQUEDAS
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_perfiles_email ON perfiles(id);
CREATE INDEX IF NOT EXISTS idx_perfiles_nombre ON perfiles(nombre_completo);
CREATE INDEX IF NOT EXISTS idx_perfiles_rut ON perfiles(rut);

CREATE INDEX IF NOT EXISTS idx_cursos_slug ON cursos(slug);
CREATE INDEX IF NOT EXISTS idx_cursos_categoria ON cursos(categoria_id);

CREATE INDEX IF NOT EXISTS idx_matriculas_perfil ON matriculas(perfil_id);
CREATE INDEX IF NOT EXISTS idx_matriculas_curso ON matriculas(curso_id);

CREATE INDEX IF NOT EXISTS idx_lecciones_modulo ON lecciones(modulo_id);
CREATE INDEX IF NOT EXISTS idx_lecciones_completadas_perfil ON lecciones_completadas(perfil_id);

CREATE INDEX IF NOT EXISTS idx_certificate_downloads_perfil ON certificate_downloads(perfil_id);
CREATE INDEX IF NOT EXISTS idx_certificate_downloads_curso ON certificate_downloads(curso_id);

-- PASO 6: LIMPIAR REGISTROS HUÉRFANOS
-- ====================================================================
-- Daniel López (92d7e664-d1e0-408f-96e5-e989d8dbb475) no tiene entrada en auth.users
-- Opción 1: Eliminar el perfil huérfano
DELETE FROM perfiles
WHERE id = '92d7e664-d1e0-408f-96e5-e989d8dbb475'
AND id NOT IN (SELECT id FROM auth.users);

-- PASO 7: IMPLEMENTAR ROW LEVEL SECURITY (RLS)
-- ====================================================================

-- Habilitar RLS en tablas críticas
ALTER TABLE perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE matriculas ENABLE ROW LEVEL SECURITY;
ALTER TABLE lecciones_completadas ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificate_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes_preguntas ENABLE ROW LEVEL SECURITY;
ALTER TABLE lecciones_archivos ENABLE ROW LEVEL SECURITY;

-- POLÍTICA: Perfiles - Usuarios solo ven su propio perfil, admins ven todo
CREATE POLICY IF NOT EXISTS "Users can view own profile" ON perfiles
  FOR SELECT USING (
    auth.uid() = id
    OR EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = TRUE)
  );

CREATE POLICY IF NOT EXISTS "Users can update own profile" ON perfiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- POLÍTICA: Matrículas - Usuarios ven sus matrículas, admins ven todo
CREATE POLICY IF NOT EXISTS "Users can view own enrollments" ON matriculas
  FOR SELECT USING (
    auth.uid() = perfil_id
    OR EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = TRUE)
  );

-- POLÍTICA: Lecciones Completadas - Solo usuario y admins
CREATE POLICY IF NOT EXISTS "Users can view own completed lessons" ON lecciones_completadas
  FOR SELECT USING (
    auth.uid() = perfil_id
    OR EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = TRUE)
  );

-- POLÍTICA: Certificados - Solo propietario y admins
CREATE POLICY IF NOT EXISTS "Users can view own certificates" ON certificate_downloads
  FOR SELECT USING (
    auth.uid() = perfil_id
    OR EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = TRUE)
  );

-- PASO 8: CREAR VISTA PARA VERIFICAR SINCRONIZACIÓN
-- ====================================================================
CREATE OR REPLACE VIEW v_user_sync_status AS
SELECT
  au.id,
  au.email,
  au.email_confirmed_at,
  CASE WHEN p.id IS NOT NULL THEN 'Sincronizado' ELSE 'HUÉRFANO' END as status,
  CASE WHEN admin.id IS NOT NULL THEN 'Admin' ELSE 'Alumno' END as role,
  au.created_at
FROM auth.users au
LEFT JOIN perfiles p ON au.id = p.id
LEFT JOIN admin_users admin ON au.id = admin.id
ORDER BY au.created_at DESC;

-- PASO 9: INFORMACIÓN DE ESTADO
-- ====================================================================
-- Verificar sincronización después de cambios
-- SELECT * FROM v_user_sync_status;

-- Verificar índices creados
-- SELECT schemaname, tablename, indexname FROM pg_indexes WHERE schemaname = 'public';

-- Verificar RLS habilitado
-- SELECT * FROM information_schema.tables WHERE table_schema='public' AND row_security_active='true';
