# 🔧 Arreglos Críticos de Base de Datos - EJECUCIÓN MANUAL

## ⚠️ INSTRUCCIONES IMPORTANTES

Estos cambios deben ejecutarse en **Supabase SQL Editor** (https://supabase.com/dashboard/project/[tu-proyecto]/sql/new).

**El SDK de Supabase desde Node.js no permite ejecutar DDL (cambios de estructura) directamente.**

---

## 📋 PASO 1: Crear tabla `admin_users`

Ejecuta esto en Supabase SQL Editor:

```sql
-- Tabla separada para admins
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT TRUE
);

-- Índices para búsquedas
CREATE INDEX IF NOT EXISTS idx_admin_users_created_by ON admin_users(created_by);
CREATE INDEX IF NOT EXISTS idx_admin_users_is_active ON admin_users(is_active);
```

**Resultado esperado:** ✅ Tabla creada exitosamente

---

## 📋 PASO 2: Migrar admins existentes

```sql
-- Agregar admins existentes a la tabla nueva
INSERT INTO admin_users (id, created_at, is_active)
SELECT id, created_at, TRUE
FROM perfiles
WHERE rol = 'admin'
ON CONFLICT (id) DO NOTHING;

-- Verificar migración
SELECT COUNT(*) as admins FROM admin_users;
```

**Resultado esperado:** 1 admin migrado (Daniel López)

---

## 📋 PASO 3: Remover columna `rol` de `perfiles`

```sql
-- Eliminar la columna rol (ahora usamos tabla admin_users)
ALTER TABLE perfiles DROP COLUMN IF EXISTS rol CASCADE;

-- Verificar estructura
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name='perfiles' ORDER BY ordinal_position;
```

**Resultado esperado:** Columna `rol` eliminada

---

## 📋 PASO 4: Arreglar RUT NULL (Trigger Issue)

```sql
-- Hacer RUT nullable (algunos usuarios se crean sin RUT inicialmente)
ALTER TABLE perfiles ALTER COLUMN rut DROP NOT NULL;

-- Actualizar valores NULL con temporal
UPDATE perfiles
SET rut = CONCAT('TEMP-', SUBSTRING(CAST(id AS TEXT), 1, 8))
WHERE rut IS NULL;

-- Verificar
SELECT id, nombre_completo, rut FROM perfiles WHERE rut LIKE 'TEMP-%';
```

**Resultado esperado:** Todos los RUT tienen valores, sin NULL

---

## 📋 PASO 5: Crear índices de optimización

```sql
-- Índices en búsquedas frecuentes
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

-- Verificar índices creados
SELECT tablename, indexname FROM pg_indexes
WHERE schemaname='public' ORDER BY tablename, indexname;
```

**Resultado esperado:** 10+ índices creados

---

## 📋 PASO 6: Limpiar registros huérfanos

```sql
-- Daniel López existe en perfiles pero no en auth.users
-- Opción: Eliminar este perfil huérfano
DELETE FROM perfiles
WHERE id = '92d7e664-d1e0-408f-96e5-e989d8dbb475'
AND id NOT IN (SELECT id FROM auth.users);

-- Verificar sincronización
SELECT
  (SELECT COUNT(*) FROM auth.users) as auth_users,
  (SELECT COUNT(*) FROM perfiles) as perfiles,
  (SELECT COUNT(*) FROM admin_users) as admins;
```

**Resultado esperado:**
- auth_users: 1
- perfiles: 1 (solo Daniel Aldea que tiene auth)
- admins: 0 (después de eliminar huérfano)

---

## 📋 PASO 7: Implementar Row Level Security (RLS)

```sql
-- Habilitar RLS en tablas críticas
ALTER TABLE perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE matriculas ENABLE ROW LEVEL SECURITY;
ALTER TABLE lecciones_completadas ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificate_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lecciones_archivos ENABLE ROW LEVEL SECURITY;

-- Política: Perfiles - Ver propios datos o ser admin
CREATE POLICY "Users can view own profile" ON perfiles
  FOR SELECT USING (
    auth.uid() = id
    OR EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = TRUE)
  );

CREATE POLICY "Users can update own profile" ON perfiles
  FOR UPDATE USING (auth.uid() = id);

-- Política: Matrículas
CREATE POLICY "Users can view own enrollments" ON matriculas
  FOR SELECT USING (
    auth.uid() = perfil_id
    OR EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = TRUE)
  );

-- Política: Lecciones Completadas
CREATE POLICY "Users can view own completed lessons" ON lecciones_completadas
  FOR SELECT USING (
    auth.uid() = perfil_id
    OR EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = TRUE)
  );

-- Política: Certificados
CREATE POLICY "Users can view own certificates" ON certificate_downloads
  FOR SELECT USING (
    auth.uid() = perfil_id
    OR EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = TRUE)
  );

-- Política: Archivos de Lecciones
CREATE POLICY "Users can access lesson files" ON lecciones_archivos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM lecciones l
      JOIN matriculas m ON l.modulo_id = (
        SELECT id FROM modulos WHERE id = l.modulo_id
      )
      WHERE l.id = lecciones_archivos.leccion_id
      AND m.perfil_id = auth.uid()
      AND m.estado_pago_curso = 'pagado'
    )
    OR EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = TRUE)
  );

-- Verificar RLS habilitado
SELECT
  schemaname,
  tablename,
  row_security
FROM information_schema.tables
WHERE table_schema='public'
AND row_security='true'
ORDER BY tablename;
```

**Resultado esperado:** RLS habilitado en 5 tablas críticas

---

## 📋 PASO 8: Crear vista de sincronización

```sql
-- Vista para monitorear estado de usuarios
CREATE OR REPLACE VIEW v_user_sync_status AS
SELECT
  au.id,
  au.email,
  au.email_confirmed_at,
  au.created_at,
  CASE WHEN p.id IS NOT NULL THEN 'Sincronizado' ELSE 'HUÉRFANO EN AUTH' END as status,
  CASE
    WHEN admin.id IS NOT NULL THEN 'Admin'
    WHEN p.id IS NOT NULL THEN 'Alumno'
    ELSE 'Sin Perfil'
  END as role,
  COALESCE(p.nombre_completo, 'N/A') as nombre
FROM auth.users au
LEFT JOIN perfiles p ON au.id = p.id
LEFT JOIN admin_users admin ON au.id = admin.id AND admin.is_active = TRUE
ORDER BY au.created_at DESC;

-- Verificar estado
SELECT * FROM v_user_sync_status;
```

**Resultado esperado:** Vista muestra estado de sincronización de usuarios

---

## ✅ Verificación Final

Ejecuta esto para confirmar todos los cambios:

```sql
-- 1. Verificar estructura
\d perfiles
\d admin_users

-- 2. Verificar datos
SELECT COUNT(*) FROM perfiles;
SELECT COUNT(*) FROM admin_users;
SELECT COUNT(*) FROM auth.users;

-- 3. Verificar RLS
SELECT * FROM v_user_sync_status;

-- 4. Verificar índices
SELECT COUNT(*) FROM pg_indexes WHERE schemaname='public';
```

---

## 🚀 Próximos Pasos (en Código)

Una vez que estos cambios estén hechos en Supabase:

1. ✅ Crear `src/lib/auth.ts` con `requireAuth()` y `requireAdmin()`
2. ✅ Instalar Zod y crear schemas de validación
3. ✅ Actualizar middleware.ts
4. ✅ Actualizar layouts con guards
5. ✅ Validar todas las server actions
6. ✅ Crear error boundaries

---

## ⏱️ Tiempo Estimado

- Ejecutar pasos 1-8: ~5 minutos en Supabase SQL Editor
- Verificación: ~2 minutos
- **Total: ~7 minutos**

**Una vez completado, notifica para continuar con cambios en el código.**
