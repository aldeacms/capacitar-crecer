# 📊 AUDITORÍA COMPLETA DE BASE DE DATOS

**Fecha:** 19-03-2026, 7:21:58 p. m.
**Proyecto:** Capacitar y Crecer LMS
**Método:** Análisis directo de tablas + Inspección de código

## 📋 Tablas de la Base de Datos

**Total de tablas identificadas:** 14

### 🔐 Sistema de Autenticación

#### Tabla: `auth.users` (Supabase Auth)

**Propósito:** Almacena usuarios del sistema de autenticación nativa de Supabase

**Estructura:**
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | uuid | ID único del usuario |
| email | text | Email de login |
| encrypted_password | text | Contraseña hasheada (bcrypt) |
| email_confirmed_at | timestamp | Fecha confirmación email |
| banned_until | timestamp | Si es null, usuario activo |
| created_at | timestamp | Fecha creación |
| updated_at | timestamp | Última actualización |

### 👥 Datos de Usuario

#### Tabla: `perfiles`

**Propósito:** Perfil extendido de usuarios (datos adicionales de auth.users)

**Columnas:** id, rut, nombre_completo, rol, created_at
**Filas:** 2

**Estructura:**
```json
{
  "id": "92d7e664-d1e0-408f-96e5-e989d8dbb475",
  "rut": "12345678-K",
  "nombre_completo": "Daniel López",
  "rol": "admin",
  "created_at": "2026-03-19T21:45:49.214445+00:00"
}
```

### 📚 Gestión de Cursos y Contenido

#### Tabla: `cursos`
**Columnas:** id, titulo, slug, descripcion_breve, objetivos, metodologia, contenido_programatico, caracteristicas_generales, imagen_url, tipo_acceso, precio_curso, precio_certificado, porcentaje_aprobacion, created_at, estado, modalidad, horas, categoria_id, dirigido_a, tiene_sence, tiene_certificado
**Filas:** 4

#### Tabla: `categorias`
**Columnas:** id, nombre, slug, descripcion, imagen_url, creado_en
**Filas:** 3

#### Tabla: `modulos`
**Columnas:** id, curso_id, titulo, orden, created_at
**Filas:** 4

#### Tabla: `lecciones`
**Columnas:** id, modulo_id, titulo, contenido_html, video_url, orden, tipo, created_at, archivo_url, dias_para_desbloqueo
**Filas:** 5

### 📝 Matriculas y Progreso

#### Tabla: `matriculas`
**Columnas:** id, perfil_id, curso_id, estado_pago_curso, estado_pago_certificado, progreso_porcentaje, created_at
**Filas:** 3

#### Tabla: `lecciones_completadas`
**Columnas:** id, perfil_id, leccion_id, completada_at
**Filas:** 3

#### Tabla: `quizzes_preguntas`
**Columnas:** id, leccion_id, texto, tipo, puntos, created_at, orden
**Filas:** 4

### 🎓 Certificados

#### Tabla: `certificate_templates`
**Columnas:** id, curso_id, nombre, background_storage_path, font_primary_url, font_secondary_url, color_primary, color_accent, pos_titulo_cert, pos_nombre_alumno, pos_rut_alumno, pos_titulo_curso, pos_horas, pos_fecha_emision, pos_fecha_vigencia, pos_qr_code, pos_cert_id, firmantes, activo, created_at, updated_at
**Filas:** 1

#### Tabla: `certificate_downloads`
**Columnas:** id, perfil_id, curso_id, nombre_archivo, created_at, storage_path, template_id, fecha_vigencia, version, invalidado_at, invalidado_por
**Filas:** 1

### 💰 Administración

#### Tabla: `cupones`
**Columnas:** id, codigo, descuento_porcentaje, activo, usos_maximos, usos_actuales, created_at
**Filas:** 1

#### Tabla: `matriculas_cupones`
**Columnas:** id, matricula_id, cupon_id, descuento_aplicado, created_at
**Filas:** 1

## 🔗 Relaciones Identificadas

### Jerarquía de Contenido
`Cursos` → `Categorias` (1:N)
`Cursos` → `Modulos` (1:N)
`Modulos` → `Lecciones` (1:N)

### Matriculas y Progreso
`Perfiles` → `Matriculas` (1:N)
`Cursos` → `Matriculas` (1:N)
`Matriculas` → `Lecciones_completadas` (1:N)

### Certificados
`Cursos` → `Certificate_templates` (1:1)
`Perfiles` → `Certificate_downloads` (1:N)
`Cursos` → `Certificate_downloads` (1:N)

## ⚠️ Problemas Identificados

### Sincronización auth ↔ perfiles
⚠️ **1** perfil(es) sin usuario en auth.users

### Modelo de Admins
⚠️ **CRÍTICO:** Los admins se identifican por rol en la tabla `perfiles`, no hay tabla separada
- Un alumno convertido a admin tiene acceso total
- No hay forma de revocar acceso admin sin eliminar el usuario

### Triggers
⚠️ Trigger `handle_new_user()` en auth.users crea perfil automático
- Crea perfil con rut=NULL (viola constraint NOT NULL)
- Solución actual: permitir RUT null temporalmente

## ✅ Recomendaciones Críticas

### 1. SEPARAR TABLA DE ADMINS (PRIORIDAD ALTA)
```sql
CREATE TABLE admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);
```

### 2. FIX AL TRIGGER handle_new_user() (PRIORIDAD ALTA)
- Proporcionar RUT por defecto o
- Usar función `gen_random_uuid()` para generar RUT temporal

### 3. IMPLEMENTAR ROW LEVEL SECURITY (PRIORIDAD MEDIA)
- Usuarios solo ven sus matriculas
- Admins ven todo

### 4. CREAR ÍNDICES PARA BÚSQUEDA (PRIORIDAD MEDIA)
- Índice en perfiles.email
- Índice en cursos.slug
- Índice en matriculas.perfil_id

## 📊 Estadísticas

| Métrica | Valor |
|---------|-------|
| Tablas totales | 14 |
| Perfiles/Usuarios | 2 |
| Cursos | 4 |
| Matriculas | 3 |
| Certificados emitidos | 1 |

