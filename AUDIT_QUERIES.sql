-- ═══════════════════════════════════════════════════════════════════════════
-- AUDITORÍA COMPLETA - CAPACITAR Y CRECER LMS
-- Ejecuta CADA QUERY por separado y documenta los resultados
-- ═══════════════════════════════════════════════════════════════════════════

-- 1️⃣  LISTAR TODAS LAS TABLAS EN SCHEMA PUBLIC
-- ═══════════════════════════════════════════════════════════════════════════
SELECT
  table_name,
  (SELECT count(*) FROM information_schema.columns
   WHERE table_name = t.table_name) as num_columnas
FROM information_schema.tables t
WHERE table_schema = 'public'
ORDER BY table_name;


-- 2️⃣  ESTRUCTURA COMPLETA DE TABLA: perfiles
-- ═══════════════════════════════════════════════════════════════════════════
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default,
  ordinal_position
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'perfiles'
ORDER BY ordinal_position;


-- 3️⃣  ESTRUCTURA COMPLETA DE TABLA: auth.users
-- ═══════════════════════════════════════════════════════════════════════════
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default,
  ordinal_position
FROM information_schema.columns
WHERE table_schema = 'auth' AND table_name = 'users'
ORDER BY ordinal_position;


-- 4️⃣  CONSTRAINTS DE TABLA perfiles
-- ═══════════════════════════════════════════════════════════════════════════
SELECT
  constraint_name,
  constraint_type,
  table_name,
  column_name
FROM information_schema.key_column_usage
WHERE table_schema = 'public' AND table_name = 'perfiles'
UNION ALL
SELECT
  constraint_name,
  'CHECK' as constraint_type,
  table_name,
  NULL as column_name
FROM information_schema.check_constraints
WHERE constraint_schema = 'public';


-- 5️⃣  TRIGGERS EN LA BASE DE DATOS
-- ═══════════════════════════════════════════════════════════════════════════
SELECT
  trigger_schema,
  trigger_name,
  event_object_schema,
  event_object_table,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema NOT IN ('pg_catalog', 'information_schema')
ORDER BY event_object_table, trigger_name;


-- 6️⃣  FUNCIONES Y PROCEDURES
-- ═══════════════════════════════════════════════════════════════════════════
SELECT
  routine_schema,
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines
WHERE routine_schema NOT IN ('pg_catalog', 'information_schema')
ORDER BY routine_schema, routine_name;


-- 7️⃣  POLÍTICAS RLS (Row Level Security)
-- ═══════════════════════════════════════════════════════════════════════════
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;


-- 8️⃣  USUARIOS EN auth.users - ESTADO COMPLETO
-- ═══════════════════════════════════════════════════════════════════════════
SELECT
  id,
  email,
  email_confirmed_at,
  banned_until,
  is_super_admin,
  created_at,
  updated_at
FROM auth.users
ORDER BY created_at DESC;


-- 9️⃣  USUARIOS EN TABLE perfiles - ESTADO COMPLETO
-- ═══════════════════════════════════════════════════════════════════════════
SELECT
  id,
  rut,
  nombre_completo,
  rol,
  created_at
FROM public.perfiles
ORDER BY created_at DESC;


-- 🔟 ANÁLISIS: USUARIOS QUE EXISTEN EN auth PERO NO EN perfiles
-- ═══════════════════════════════════════════════════════════════════════════
SELECT
  u.id,
  u.email,
  u.email_confirmed_at,
  CASE WHEN p.id IS NULL THEN 'NO EXISTE EN perfiles' ELSE 'OK' END as estado
FROM auth.users u
LEFT JOIN public.perfiles p ON u.id = p.id
WHERE p.id IS NULL;


-- 1️⃣1️⃣ ANÁLISIS: USUARIOS QUE EXISTEN EN perfiles PERO NO EN auth
-- ═══════════════════════════════════════════════════════════════════════════
SELECT
  p.id,
  p.nombre_completo,
  p.rol,
  CASE WHEN u.id IS NULL THEN 'NO EXISTE EN auth' ELSE 'OK' END as estado
FROM public.perfiles p
LEFT JOIN auth.users u ON p.id = u.id
WHERE u.id IS NULL;


-- 1️⃣2️⃣ RELACIONES: todos los usuarios (auth + perfiles) SINCRONIZADOS
-- ═══════════════════════════════════════════════════════════════════════════
SELECT
  COALESCE(u.email, 'ONLY_PERFILES') as email,
  u.email_confirmed_at,
  COALESCE(p.nombre_completo, 'NO PERFIL') as nombre,
  COALESCE(p.rol, 'N/A') as rol,
  CASE
    WHEN u.id IS NULL THEN '❌ Solo en perfiles'
    WHEN p.id IS NULL THEN '⚠️ Solo en auth (SIN PERFIL)'
    ELSE '✅ Sincronizado'
  END as estado
FROM auth.users u
FULL OUTER JOIN public.perfiles p ON u.id = p.id
ORDER BY email;


-- 1️⃣3️⃣ TABLAS Y TAMAÑO
-- ═══════════════════════════════════════════════════════════════════════════
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as tamaño,
  (SELECT count(*) FROM pg_class WHERE relname = tablename) as filas
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;


-- ═══════════════════════════════════════════════════════════════════════════
-- INSTRUCCIONES DE USO:
-- ═══════════════════════════════════════════════════════════════════════════
-- 1. Ve a https://supabase.com/dashboard > Tu proyecto > SQL Editor
-- 2. Copia CADA QUERY (una por vez)
-- 3. Ejecuta y toma nota de los resultados
-- 4. Documenta hallazgos en un archivo AUDIT_RESULTS.md
-- 5. Luego haremos un plan de acción basado en hechos, no en prueba/error
-- ═══════════════════════════════════════════════════════════════════════════
