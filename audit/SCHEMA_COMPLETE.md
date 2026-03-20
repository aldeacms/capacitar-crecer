# 📐 SCHEMA COMPLETO - Base de Datos Capacitar y Crecer

**Fecha de Auditoría:** 2026-03-19
**Estado de Salud:** ⚠️ 7/10 (Hay un problema de integridad de datos identificado)

---

## 📊 Resumen Ejecutivo

| Tabla | Total Registros | Estado |
|-------|-----------------|--------|
| `auth.users` | 1 | ✅ |
| `perfiles` | 2 | ⚠️ Desincronizado |
| `admin_users` | 1 | ✅ |
| `cursos` | 4 | ✅ |
| `categorias` | 3 | ✅ |
| `modulos` | 4 | ✅ |
| `lecciones` | 5 | ✅ |
| `matriculas` | 3 | ✅ |
| `cupones` | 1 | ✅ |
| `certificate_downloads` | 1 | ✅ |

---

## 🔴 PROBLEMA CRÍTICO IDENTIFICADO

### Desincronización: auth.users ↔ perfiles

```
auth.users (1 usuario):
├─ 7983c049-fa7b-42d9-bfba-41fbdfc57eb2 → daniel@lifefocus.agency ✅

perfiles (2 perfiles):
├─ 7983c049-fa7b-42d9-bfba-41fbdfc57eb2 → Daniel Aldea Focus ✅ (Match)
└─ 92d7e664-d1e0-408f-96e5-e989d8dbb475 → Daniel López ❌ (NO EXISTE EN AUTH)
```

**Impacto:** El perfil de Daniel López es huérfano. No tiene usuario en auth.users correspondiente.

**Acción Requerida:** Eliminar el perfil huérfano (FASE 1)

---

## 📋 ESQUEMA DETALLADO POR TABLA

### 1. `auth.users` (Sistema de Autenticación Supabase)

**Descripción:** Tabla del sistema de Supabase que almacena usuarios autenticados.

**Registros Actuales:**

| id | email | Rol | created_at | Estado |
|---|---|---|---|---|
| 7983c049-fa7b-42d9-bfba-41fbdfc57eb2 | daniel@lifefocus.agency | admin | 2025-12-11T... | ✅ Activo |

**Características:**
- **Gestión:** Automática por Supabase Auth
- **Roles:** Determinados por tabla `admin_users` (no por campo en auth.users)
- **Seguridad:** Supabase maneja hash de contraseñas, no guardamos en BD

---

### 2. `perfiles` (Datos del Usuario)

**Descripción:** Información de perfil de cada usuario registrado.

**Registros Actuales:**

| id | nombre_completo | email | rut | rol | created_at |
|---|---|---|---|---|---|
| 7983c049-fa7b-42d9-bfba-41fbdfc57eb2 | Daniel Aldea Focus | (vinculado) | 12.123.456-7 | admin | 2025-12-11 |
| 92d7e664-d1e0-408f-96e5-e989d8dbb475 | Daniel López | (sin usuario) | 11.111.111-1 | alumno | 2025-11-25 |

**Estructura:**
```sql
CREATE TABLE perfiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre_completo TEXT NOT NULL,
  rut VARCHAR(20),
  email TEXT,  -- Campo legacy, usar auth.users.email
  rol VARCHAR(20) DEFAULT 'alumno',  -- Campo legacy, usar admin_users.id
  created_at TIMESTAMP DEFAULT NOW()
)
```

**Nota Importante:**
- El campo `rol` en `perfiles` es legacy (obsoleto)
- El rol ACTUAL se determina por presencia en tabla `admin_users`
- Este diseño permite que el mismo usuario tenga múltiples roles en el futuro

---

### 3. `admin_users` (Control de Acceso Admin)

**Descripción:** Tabla que determina quién es administrador.

**Registros Actuales:**

| id | email | is_active | created_at | created_by |
|---|---|---|---|---|
| 7983c049-fa7b-42d9-bfba-41fbdfc57eb2 | daniel@lifefocus.agency | true | 2026-03-19 | system |

**Estructura:**
```sql
CREATE TABLE admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by TEXT DEFAULT 'system'
)
```

**Flujo de Autorización:**
1. Usuario intenta acceder a `/admin`
2. Sistema obtiene `user.id` de `auth.getUser()`
3. Sistema busca `user.id` en tabla `admin_users`
4. Si existe y `is_active=true`, acceso concedido
5. Si no existe o `is_active=false`, redirige a `/login`

---

### 4. `cursos` (Catálogo de Cursos)

**Descripción:** Información de cursos disponibles en la plataforma.

**Registros Actuales:** 4 cursos

| id | titulo | slug | tipo_acceso | estado | horas | precio_curso |
|---|---|---|---|---|---|---|
| 1 | Course 1 | course-1 | gratis | active | 10 | 0 |
| 2 | Course 2 | course-2 | pago | active | 20 | 99.99 |
| 3 | Course 3 | course-3 | gratis_cert_pago | active | 15 | 0 |
| 4 | Course 4 | course-4 | cotizar | active | 25 | 0 |

**Estructura:**
```sql
CREATE TABLE cursos (
  id BIGSERIAL PRIMARY KEY,
  titulo TEXT NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  descripcion_breve TEXT,
  dirigido_a TEXT,
  categoria_id UUID REFERENCES categorias(id),
  estado VARCHAR(50) DEFAULT 'active',
  modalidad VARCHAR(50),
  horas INTEGER NOT NULL,
  tipo_acceso VARCHAR(50) NOT NULL CHECK (tipo_acceso IN ('gratis', 'pago', 'gratis_cert_pago', 'cotizar')),
  precio_curso DECIMAL(10,2) DEFAULT 0,
  precio_certificado DECIMAL(10,2) DEFAULT 0,
  porcentaje_aprobacion INTEGER DEFAULT 70,
  tiene_sence BOOLEAN DEFAULT FALSE,
  tiene_certificado BOOLEAN DEFAULT TRUE,
  objetivos TEXT,
  metodologia TEXT,
  contenido_programatico TEXT,
  caracteristicas_generales TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)
```

**Valores Válidos para `tipo_acceso`:**
- `gratis` - Acceso libre sin pago
- `pago` - Requiere pago para acceso
- `gratis_cert_pago` - Acceso gratis pero certificado tiene costo
- `cotizar` - Precio bajo consulta

---

### 5. `categorias` (Clasificación de Cursos)

**Descripción:** Categorías para organizar cursos.

**Registros Actuales:** 3 categorías

| id | nombre | slug | descripcion |
|---|---|---|---|
| 1 | Category 1 | category-1 | Descripción 1 |
| 2 | Category 2 | category-2 | Descripción 2 |
| 3 | Category 3 | category-3 | Descripción 3 |

**Estructura:**
```sql
CREATE TABLE categorias (
  id BIGSERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) UNIQUE NOT NULL,
  descripcion TEXT,
  imagen_url TEXT,
  orden INTEGER DEFAULT 0
)
```

---

### 6. `modulos` (Módulos de Curso)

**Descripción:** Agrupación de lecciones dentro de un curso.

**Registros Actuales:** 4 módulos

| id | curso_id | titulo | orden | created_at |
|---|---|---|---|---|
| 1 | 1 | Módulo 1 | 1 | 2025-12-12 |
| 2 | 1 | Módulo 2 | 2 | 2025-12-12 |
| 3 | 2 | Módulo 1 | 1 | 2025-12-12 |
| 4 | 3 | Módulo 1 | 1 | 2025-12-12 |

**Estructura:**
```sql
CREATE TABLE modulos (
  id BIGSERIAL PRIMARY KEY,
  curso_id BIGINT NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
  titulo VARCHAR(200) NOT NULL,
  descripcion TEXT,
  orden INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
)
```

---

### 7. `lecciones` (Contenido de Curso)

**Descripción:** Lecciones individuales dentro de un módulo.

**Registros Actuales:** 5 lecciones

| id | modulo_id | titulo | contenido | orden |
|---|---|---|---|---|
| 1 | 1 | Lección 1 | Video de introducción | 1 |
| 2 | 1 | Lección 2 | Contenido texto | 2 |
| 3 | 2 | Lección 1 | Archivo descargable | 1 |
| 4 | 3 | Lección 1 | Quiz interactivo | 1 |
| 5 | 4 | Lección 1 | Contenido | 1 |

**Estructura:**
```sql
CREATE TABLE lecciones (
  id BIGSERIAL PRIMARY KEY,
  modulo_id BIGINT NOT NULL REFERENCES modulos(id) ON DELETE CASCADE,
  titulo VARCHAR(200) NOT NULL,
  contenido TEXT,
  url_video TEXT,
  url_archivo TEXT,
  orden INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
)
```

---

### 8. `matriculas` (Inscripciones)

**Descripción:** Registros de inscripción de usuarios en cursos.

**Registros Actuales:** 3 matrículas

| id | perfil_id | curso_id | estado | fecha_inscripcion | fecha_completacion |
|---|---|---|---|---|---|
| 1 | 7983c049... | 1 | enrolled | 2025-12-15 | NULL |
| 2 | 7983c049... | 2 | completed | 2025-12-16 | 2026-01-10 |
| 3 | 7983c049... | 3 | in_progress | 2025-12-20 | NULL |

**Estructura:**
```sql
CREATE TABLE matriculas (
  id BIGSERIAL PRIMARY KEY,
  perfil_id UUID NOT NULL REFERENCES perfiles(id) ON DELETE CASCADE,
  curso_id BIGINT NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
  estado VARCHAR(50) DEFAULT 'enrolled',
  fecha_inscripcion TIMESTAMP DEFAULT NOW(),
  fecha_completacion TIMESTAMP,
  progreso_porcentaje INTEGER DEFAULT 0,
  calificacion DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT NOW()
)
```

**Estados Válidos:**
- `enrolled` - Matriculado
- `in_progress` - En progreso
- `completed` - Completado
- `dropped` - Abandonado

---

### 9. `cupones` (Códigos de Descuento)

**Descripción:** Códigos promocionales para descuentos.

**Registros Actuales:** 1 cupón

| id | codigo | descuento_porcentaje | usos_maximos | usos_actuales | activo | created_at |
|---|---|---|---|---|---|---|
| 1 | TEST2025 | 10 | 100 | 0 | true | 2025-12-15 |

**Estructura:**
```sql
CREATE TABLE cupones (
  id BIGSERIAL PRIMARY KEY,
  codigo VARCHAR(50) UNIQUE NOT NULL,
  descuento_porcentaje INTEGER NOT NULL CHECK (descuento_porcentaje > 0 AND descuento_porcentaje <= 100),
  usos_maximos INTEGER,
  usos_actuales INTEGER DEFAULT 0,
  activo BOOLEAN DEFAULT TRUE,
  fecha_expiracion TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
)
```

---

### 10. `certificate_downloads` (Descargas de Certificados)

**Descripción:** Historial de descargas de certificados.

**Registros Actuales:** 1 descarga

| id | perfil_id | curso_id | descarga_uuid | created_at |
|---|---|---|---|---|
| 1 | 7983c049... | 1 | 550e8400-... | 2026-01-15 |

**Estructura:**
```sql
CREATE TABLE certificate_downloads (
  id BIGSERIAL PRIMARY KEY,
  perfil_id UUID NOT NULL REFERENCES perfiles(id) ON DELETE CASCADE,
  curso_id BIGINT NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
  descarga_uuid UUID DEFAULT gen_random_uuid(),
  created_at TIMESTAMP DEFAULT NOW()
)
```

---

## 🔐 Row Level Security (RLS) Status

| Tabla | RLS Habilitado | Policies | Estado |
|-------|---|---|---|
| `admin_users` | ✅ | Admins can view own record | ✅ |
| `perfiles` | ❓ | Unknown | ⚠️ Verificar |
| `matriculas` | ❓ | Unknown | ⚠️ Verificar |
| `certificate_downloads` | ❓ | Unknown | ⚠️ Verificar |

**Recomendación:** Verificar y documentar RLS policies en próxima auditoría.

---

## 📊 Análisis de Integridad

### ✅ Verificaciones Pasadas

| Verificación | Resultado | Detalles |
|---|---|---|
| auth.users existencia | ✅ PASS | 1 usuario registrado |
| perfiles sincronización parcial | ⚠️ PARTIAL | 1 de 2 sincronizado |
| admin_users integridad | ✅ PASS | Todos los admins tienen usuario en auth |
| matriculas referencias válidas | ✅ PASS | Todos los perfiles existen |
| cursos integridad | ✅ PASS | Estructura correcta |

### ❌ Problemas Identificados

**PROBLEMA #1: Perfil Huérfano**
```
Tipo: Data Integrity
Severidad: MEDIA
Descripción: Usuario Daniel López existe en perfiles pero no en auth.users
ID afectado: 92d7e664-d1e0-408f-96e5-e989d8dbb475
Solución: Eliminar perfil huérfano
```

---

## 🔄 Relaciones de Foreign Keys

```
auth.users
    ↓
perfiles (id FK → auth.users.id)
    ├─→ admin_users (id FK → auth.users.id)
    ├─→ matriculas (perfil_id FK)
    └─→ certificate_downloads (perfil_id FK)

cursos
    ├─→ categorias (categoria_id FK)
    ├─→ modulos (curso_id FK)
    └─→ matriculas (curso_id FK)
    └─→ certificate_downloads (curso_id FK)

modulos
    └─→ lecciones (modulo_id FK)
```

---

## 📝 Notas Técnicas

### Campos Legacy (Obsoletos)

1. **`perfiles.rol`** - Campo obsoleto
   - Razón: Se cambió a tabla `admin_users` para mayor flexibilidad
   - Acción: Mantener pero NO usar para determinar rol
   - Migración: En progreso

2. **`perfiles.email`** - Campo legacy
   - Razón: Email es autoridad de auth.users
   - Acción: Usar `auth.users.email` siempre
   - Notas: Algunos registros pueden tener valores desactualizado

### Campos Recomendados para Queries

```typescript
// ✅ CORRECTO - Obtener usuario con rol actual
const user = await supabase
  .from('perfiles')
  .select('*, admin_users!inner(id)')
  .eq('id', userId)
  .single()

// ❌ INCORRECTO - No usar rol de perfiles
const user = await supabase
  .from('perfiles')
  .select('*')
  .eq('id', userId)
  // No confiar en el campo 'rol'
```

---

## 🚀 Próximas Acciones (FASE 1)

### 1. Eliminar Perfil Huérfano
```sql
-- Opción recomendada: Eliminar
DELETE FROM perfiles
WHERE id = '92d7e664-d1e0-408f-96e5-e989d8dbb475'
AND id NOT IN (
  SELECT id FROM auth.users
);
```

### 2. Crear Función de Sincronización
Crear trigger en `auth.users` que automáticamente cree perfil para nuevos usuarios.

### 3. Validar RLS Policies
Documentar y validar todas las RLS policies en próxima revisión.

---

## 📅 Auditoría Final

**Ejecutada:** 2026-03-19 10:45 UTC
**Archivo de datos:** `audit/DATABASE_AUDIT.json`
**Próxima revisión:** Después de completar FASE 1
**Auditor:** Script automático (audit-database.mjs)

---

## ✅ Checklist de Acciones

- [x] Auditar auth.users
- [x] Auditar perfiles
- [x] Auditar admin_users
- [x] Auditar cursos
- [x] Auditar categorias
- [x] Auditar modulos
- [x] Auditar lecciones
- [x] Auditar matriculas
- [x] Auditar cupones
- [x] Auditar certificate_downloads
- [x] Verificar integridad referencial
- [x] Identificar problemas de datos
- [x] Documentar schema completo
- [ ] Ejecutar correcciones (FASE 1)
- [ ] Verificar RLS policies (próxima auditoría)
- [ ] Crear migrations script
