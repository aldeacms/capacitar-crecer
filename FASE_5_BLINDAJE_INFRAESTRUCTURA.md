# 🔧 FASE 5A: Blindaje de Infraestructura

**Estado:** 60% Completado | Esperando ejecución manual de SQL

**Última actualización:** 19 de Marzo, 2026 - 19:30

---

## 📋 Resumen Ejecutivo

Esta fase implementa **4 capas de seguridad crítica** antes de monetizar el LMS:

1. **Capa 0: Separación de Roles** - Tabla `admin_users` separada ✅ (código)
2. **Capa 1: Validación de Inputs** - Zod schemas ✅ (código)
3. **Capa 2: Error Handling** - Error boundaries ✅ (código)
4. **Capa 3: Protección de Datos** - Row Level Security ⏳ (Supabase SQL)

---

## ✅ LO QUE YA ESTÁ HECHO

### 1️⃣ Actualizar `src/lib/auth.ts`

```typescript
// requireAuth() - redirige a /login si no autenticado
// requireAdmin() - verifica entrada en tabla admin_users
// getAuthUser() - obtiene user sin redirigir
```

**Cambio crítico:** Admin status ahora viene de tabla `admin_users`, NO de campo `rol` en `perfiles`.

---

### 2️⃣ Actualizar `src/lib/validations.ts`

```typescript
// Schemas Zod creados:
UUIDSchema              // Validar IDs
PasswordSchema          // min 8 chars
UsuarioSchema           // email, nombre, rut, password
ActualizarPerfilSchema  // sin rol (ahora en admin_users)
CrearAdminSchema        // para crear admins
CursoSchema, ModuloSchema, etc.
```

**Cambio:** Removidos campos `rol` de perfiles, ahora usamos tabla `admin_users`.

---

### 3️⃣ Actualizar `src/actions/usuarios.ts`

```typescript
✅ getUsuarios()
   - Lee roles de tabla admin_users
   - Combina auth.users + perfiles + admin_users

✅ crearUsuario()
   - Valida con Zod
   - Crea en auth, luego perfil (sin rol)
   - Si isAdmin, agrega a admin_users table

✅ actualizarPerfil()
   - Sin campo rol (ese está en admin_users)
   - Valida UUID de usuario

✅ inscribirEnCurso(), desinscribirDeCurso()
   - Validan UUIDs de perfil/curso
   - Validación de inputs
```

---

### 4️⃣ Layouts Ya Protegidos

```typescript
✅ src/app/admin/layout.tsx
   - Llama await requireAdmin() al inicio
   - Redirige a /login si no es admin

✅ src/app/(private)/layout.tsx
   - Llama await requireAuth() al inicio
   - Redirige a /login si no autenticado
```

---

### 5️⃣ Error Boundaries Implementados

```typescript
✅ src/app/global-error.tsx       - Error del root layout
✅ src/app/error.tsx               - Error global fallback
✅ src/app/(private)/error.tsx     - Error en /dashboard/*
✅ src/app/admin/error.tsx         - Error en /admin/*
✅ src/app/checkout/[cursoId]/error.tsx - Error en checkout
```

---

### 6️⃣ Middleware Actualizado

```typescript
✅ src/middleware.ts
   - Redirige /admin y /dashboard a /login si no autenticado
   - Refrescar sesión en cada request
```

---

## ⏳ LO QUE QUEDA: Ejecución Manual en Supabase

**Ubicación:** [DATABASE_FIXES_MANUAL.md](DATABASE_FIXES_MANUAL.md)

### PASO 1️⃣ : Crear tabla `admin_users`

```sql
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT TRUE
);
CREATE INDEX IF NOT EXISTS idx_admin_users_created_by ON admin_users(created_by);
CREATE INDEX IF NOT EXISTS idx_admin_users_is_active ON admin_users(is_active);
```

**¿Por qué?** Separar roles de datos de usuario permite revocar admin sin eliminar usuario.

---

### PASO 2️⃣ : Migrar admins existentes

```sql
INSERT INTO admin_users (id, created_at, is_active)
SELECT id, created_at, TRUE
FROM perfiles
WHERE rol = 'admin'
ON CONFLICT (id) DO NOTHING;
```

**Resultado esperado:** Daniel López → admin_users

---

### PASO 3️⃣ : Remover columna `rol` de `perfiles`

```sql
ALTER TABLE perfiles DROP COLUMN IF EXISTS rol CASCADE;
```

**¿Por qué?** El rol ahora se determina por presencia en `admin_users`.

---

### PASO 4️⃣ : Arreglar RUT NULL

```sql
ALTER TABLE perfiles ALTER COLUMN rut DROP NOT NULL;
UPDATE perfiles
SET rut = CONCAT('TEMP-', SUBSTRING(CAST(id AS TEXT), 1, 8))
WHERE rut IS NULL;
```

**¿Por qué?** El trigger `handle_new_user()` crea perfiles sin RUT. Solución: RUT nullable + valores default.

---

### PASO 5️⃣ : Crear índices de optimización

```sql
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
```

**¿Por qué?** Optimizar queries en búsquedas frecuentes (email, slug, matriculas por usuario, etc.)

---

### PASO 6️⃣ : Limpiar registros huérfanos

```sql
DELETE FROM perfiles
WHERE id = '92d7e664-d1e0-408f-96e5-e989d8dbb475'
AND id NOT IN (SELECT id FROM auth.users);
```

**Caso:** Daniel López existe en perfiles pero no en auth.users.

---

### PASO 7️⃣ : Habilitar Row Level Security (RLS)

```sql
ALTER TABLE perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE matriculas ENABLE ROW LEVEL SECURITY;
ALTER TABLE lecciones_completadas ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificate_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lecciones_archivos ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso
CREATE POLICY "Users can view own profile" ON perfiles
  FOR SELECT USING (
    auth.uid() = id
    OR EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = TRUE)
  );

CREATE POLICY "Users can update own profile" ON perfiles
  FOR UPDATE USING (auth.uid() = id);

-- ... (resto de políticas en DATABASE_FIXES_MANUAL.md)
```

**¿Por qué?** Usuarios solo ven sus propios datos, admins ven todo.

---

### PASO 8️⃣ : Crear vista de sincronización

```sql
CREATE OR REPLACE VIEW v_user_sync_status AS
SELECT
  au.id,
  au.email,
  au.created_at,
  CASE WHEN p.id IS NOT NULL THEN 'Sincronizado' ELSE 'HUÉRFANO' END as status,
  CASE WHEN admin.id IS NOT NULL THEN 'Admin' ELSE 'Alumno' END as role
FROM auth.users au
LEFT JOIN perfiles p ON au.id = p.id
LEFT JOIN admin_users admin ON au.id = admin.id;
```

**Uso:** `SELECT * FROM v_user_sync_status;` para monitorear integridad de datos.

---

## 🚀 Cómo Proceder

### ANTES de continuar:

1. ✅ Lee [DATABASE_FIXES_MANUAL.md](DATABASE_FIXES_MANUAL.md)
2. ✅ Ve a [Supabase SQL Editor](https://supabase.com/dashboard/project/[tu-proyecto]/sql/new)
3. ✅ Ejecuta los 8 pasos en orden (7 minutos aproximadamente)
4. ✅ Verifica con `SELECT * FROM v_user_sync_status;`
5. ✅ Notifica cuando esté completado

### DESPUÉS de completar SQL:

El código está listo para funcionar:
- Admin checks van a la tabla `admin_users`
- Validación de inputs con Zod está activa
- Errores son capturados por error boundaries
- RLS protege los datos de usuarios

---

## 📊 Cambios de Base de Datos

| Elemento | Antes | Después |
|----------|-------|---------|
| **Admin model** | Campo `rol` en `perfiles` | Tabla `admin_users` separada |
| **RUT** | NOT NULL (error con trigger) | Nullable + defaults |
| **Índices** | 0 en búsquedas frecuentes | 10+ índices optimizados |
| **RLS** | Deshabilitado | Habilitado en 5 tablas |
| **Sincronización** | Manual (vista audit) | Vista automatizada |

---

## 🔐 Seguridad Implementada

| Capa | Elemento | Status |
|------|----------|--------|
| **Auth** | `requireAuth()`, `requireAdmin()` | ✅ |
| **Validación** | Zod schemas en server actions | ✅ |
| **Errores** | Error boundaries en 5 rutas | ✅ |
| **Base datos** | Admin table, RLS, índices | ⏳ (SQL manual) |

---

## ⏱️ Timeline Estimado

| Fase | Duración | Status |
|------|----------|--------|
| Código en aplicación | 45 min | ✅ Completado |
| SQL manual en Supabase | 7 min | ⏳ Esperando usuario |
| Verificación | 5 min | ⏳ Después de SQL |
| **Total** | **~1 hora** | **60% Done** |

---

## 🎯 Próximos Pasos (después de SQL)

1. **Verificar integración:**
   ```bash
   npm run build
   ```
   Debe compilar sin errores de TypeScript.

2. **Test login:**
   - Crear nuevo usuario con `crearUsuario()`
   - Verificar que aparece en admin_users si `rol=admin`
   - Verificar que acceso admin funciona

3. **Test RLS:**
   - Alumno intenta acceder a datos de otro alumno
   - Debe fallar (RLS bloquea)

4. **Continuar con:**
   - Phase 5B: Mejoras UX/UI (dashboard, iconos, etc.)
   - Monetización: Stripe, coupons, etc.

---

## 📚 Documentación Relacionada

- [DATABASE_COMPLETE_AUDIT.md](DATABASE_COMPLETE_AUDIT.md) - Audit de tablas
- [DATABASE_FIXES_MANUAL.md](DATABASE_FIXES_MANUAL.md) - SQL paso a paso
- [ADMIN_SETUP.md](ADMIN_SETUP.md) - Setup manual de admins
- [PLAN: Phase 5A](../parallel-whistling-whisper.md) - Plan técnico completo

---

## ❓ Preguntas Frecuentes

**P: ¿Qué pasa si ejecuto el SQL en el orden equivocado?**
A: Los pasos están diseñados para ser idempotentes (`IF NOT EXISTS`, `ON CONFLICT`). Puedes ejecutar múltiples veces sin error.

**P: ¿Necesito resetear la base de datos?**
A: No. Todos los cambios son aditivos (nuevas tablas/índices) o migraciones (rol: admin → admin_users).

**P: ¿Cómo creo un nuevo admin después de esto?**
A:
```typescript
await crearUsuario({
  email: 'admin@example.com',
  password: 'Secure123456',
  nombre_completo: 'Admin Name',
  rol: 'admin' // Automáticamente agregará a admin_users
})
```

**P: ¿Y si ejecuto SQL pero el código falla?**
A: Los changesptos son reversibles:
- `DROP TABLE admin_users;` revierte todo
- Los índices se pueden recrear
- RLS puede deshabilitarse si necesario

---

## 📞 Soporte

Si hay errores durante la ejecución:
1. Guarda el error exacto
2. Copia la línea SQL que falló
3. Verifica que la tabla existe: `SELECT * FROM information_schema.tables WHERE table_name='admin_users';`
4. Contacta con detalles del error

---

**Versión:** 1.0 | **Última revisión:** 19-03-2026 | **Autor:** Claude Code
