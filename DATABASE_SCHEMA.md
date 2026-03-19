# 📊 Database Schema - Capacitar y Crecer

Documentación completa del modelo de datos de la plataforma.

---

## 🔐 Tabla: `auth.users` (Supabase Auth)

Sistema de autenticación nativo de Supabase. **No modificar directamente desde SQL** cuando sea posible.

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | uuid | PRIMARY KEY | ID único del usuario |
| `email` | text | UNIQUE, NOT NULL | Email del usuario (login) |
| `encrypted_password` | text | NOT NULL | Contraseña hasheada con bcrypt |
| `email_confirmed_at` | timestamp | NULL | Marca cuando el email fue confirmado |
| `created_at` | timestamp | NOT NULL | Timestamp de creación |
| `updated_at` | timestamp | NOT NULL | Timestamp de última actualización |
| `raw_app_meta_data` | jsonb | NULL | Metadata de la app |
| `raw_user_meta_data` | jsonb | NULL | Metadata del usuario |
| `is_super_admin` | boolean | DEFAULT false | Flag de super admin (dejar en false) |

**Insertar usuario:**
```sql
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin)
VALUES (
  gen_random_uuid(),
  'user@example.cl',
  crypt('Password123!', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb,
  false
)
RETURNING id;
```

---

## 👤 Tabla: `perfiles` (Perfiles de Usuario)

Datos extensivos del usuario - relacionado 1:1 con `auth.users`.

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | uuid | PRIMARY KEY, FK → auth.users(id) | ID único del perfil (=user id) |
| `rut` | text | **NOT NULL** | RUT chileno (formato: `12345678-K`) |
| `nombre_completo` | text | NOT NULL | Nombre completo del usuario |
| `rol` | text | NOT NULL, CHECK (rol IN ('alumno', 'admin')) | Rol del usuario |
| `created_at` | timestamp | NOT NULL | Timestamp de creación |

**Valores válidos para `rol`:**
- `'alumno'` - Estudiante de curso
- `'admin'` - Administrador del LMS

**Insertar perfil:**
```sql
INSERT INTO perfiles (id, rut, nombre_completo, rol, created_at)
VALUES ('user-id-uuid', '12345678-K', 'Juan Pérez', 'alumno', now());
```

---

## 📚 Tabla: `cursos` (Cursos)

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | uuid | PRIMARY KEY | ID único |
| `titulo` | text | NOT NULL | Nombre del curso |
| `slug` | text | UNIQUE, NOT NULL | URL-safe identifier |
| `descripcion` | text | NULL | Descripción larga |
| `tipo_acceso` | text | CHECK ('publico', 'privado') | Visibilidad |
| `horas` | integer | NULL | Horas de duración |
| `precio_curso` | numeric | NULL | Precio en CLP |
| `nivel` | text | NULL | Nivel del curso |
| `categoria_id` | uuid | FK → categorias(id) | Categoría |
| `created_at` | timestamp | NOT NULL | Fecha creación |
| `updated_at` | timestamp | NOT NULL | Última actualización |

---

## 📝 Tabla: `matriculas` (Enrollments)

Registro de inscripciones de usuarios a cursos.

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | uuid | PRIMARY KEY | ID único |
| `perfil_id` | uuid | FK → perfiles(id) | Usuario inscrito |
| `curso_id` | uuid | FK → cursos(id) | Curso |
| `created_at` | timestamp | NOT NULL | Fecha inscripción |
| `completado_at` | timestamp | NULL | Fecha completación |
| `progreso` | integer | DEFAULT 0 | % avance (0-100) |

**Constraint especial:** `UNIQUE(perfil_id, curso_id)` - Un usuario solo puede inscribirse una vez por curso

---

## 🎓 Tabla: `certificate_downloads` (Certificados)

Registro de descargas/emisión de certificados.

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | uuid | PRIMARY KEY | ID único |
| `perfil_id` | uuid | FK → perfiles(id) | Usuario |
| `curso_id` | uuid | FK → cursos(id) | Curso certificado |
| `certificate_template_id` | uuid | FK → certificate_templates(id) | Template usado |
| `invalidado_at` | timestamp | NULL | Cuando fue invalidado |
| `created_at` | timestamp | NOT NULL | Fecha emisión |

**Nota:** Un certificado es válido si `invalidado_at IS NULL`

---

## 🏷️ Tabla: `cupones` (Discount Coupons)

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | uuid | PRIMARY KEY | ID único |
| `codigo` | text | UNIQUE, NOT NULL | Código del cupón (ej: SUMMER2024) |
| `descuento_porcentaje` | integer | NOT NULL, CHECK (>=1, <=100) | % de descuento |
| `usos_maximos` | integer | NULL | Uso límite (null = ilimitado) |
| `usos_actuales` | integer | DEFAULT 0 | Usos hasta ahora |
| `activo` | boolean | DEFAULT true | Si está disponible |
| `created_at` | timestamp | NOT NULL | Fecha creación |

---

## 📚 Tabla: `modulos` (Course Modules)

Organización jerárquica: Curso → Módulos → Lecciones

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | uuid | PRIMARY KEY | ID único |
| `curso_id` | uuid | FK → cursos(id) | Curso padre |
| `titulo` | text | NOT NULL | Nombre del módulo |
| `orden` | integer | NOT NULL | Posición en el curso |
| `created_at` | timestamp | NOT NULL | Fecha creación |

**Constraint:** `UNIQUE(curso_id, orden)` - No hay módulos duplicados en mismo orden

---

## 📖 Tabla: `lecciones` (Lessons)

Contenido dentro de módulos.

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | uuid | PRIMARY KEY | ID único |
| `modulo_id` | uuid | FK → modulos(id) | Módulo padre |
| `titulo` | text | NOT NULL | Nombre de lección |
| `tipo` | text | CHECK ('video', 'texto', 'archivo') | Tipo contenido |
| `video_url` | text | NULL | URL del video (YouTube, etc) |
| `contenido_html` | text | NULL | HTML del contenido |
| `orden` | integer | NOT NULL | Posición en módulo |
| `created_at` | timestamp | NOT NULL | Fecha creación |

---

## 📁 Tabla: `lecciones_archivos` (Lesson Files)

Archivos adjuntos a lecciones.

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | uuid | PRIMARY KEY | ID único |
| `leccion_id` | uuid | FK → lecciones(id) | Lección padre |
| `nombre_archivo` | text | NOT NULL | Nombre original |
| `archivo_url` | text | NOT NULL | URL en Supabase Storage |
| `created_at` | timestamp | NOT NULL | Fecha subida |

---

## 📋 Tabla: `categorias` (Course Categories)

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | uuid | PRIMARY KEY | ID único |
| `nombre` | text | UNIQUE, NOT NULL | Nombre categoría |
| `slug` | text | UNIQUE, NOT NULL | URL identifier |
| `color` | text | DEFAULT '#28B4AD' | Color hex para UI |
| `created_at` | timestamp | NOT NULL | Fecha creación |

---

## ❓ Tabla: `preguntas_quiz` (Quiz Questions)

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | uuid | PRIMARY KEY | ID único |
| `leccion_id` | uuid | FK → lecciones(id) | Lección asociada |
| `pregunta` | text | NOT NULL | Texto de pregunta |
| `tipo` | text | CHECK ('multiple', 'verdadero_falso', 'abierta') | Tipo pregunta |
| `opciones` | jsonb | NULL | Array de opciones {text, es_correcta} |
| `respuesta_correcta` | text | NULL | Respuesta para tipo abierta |
| `orden` | integer | NOT NULL | Orden en quiz |
| `created_at` | timestamp | NOT NULL | Fecha creación |

---

## 🎫 Tabla: `certificate_templates` (Certificate Templates)

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | uuid | PRIMARY KEY | ID único |
| `curso_id` | uuid | FK → cursos(id) | Curso asociado |
| `html_template` | text | NOT NULL | HTML template con placeholders |
| `created_at` | timestamp | NOT NULL | Fecha creación |

**Placeholders en template:**
- `{nombre}` → Nombre del estudiante
- `{curso}` → Nombre del curso
- `{fecha}` → Fecha emisión (DD/MM/YYYY)
- `{numero_certificado}` → ID único del certificado

---

## 🔗 Diagrama de Relaciones

```
auth.users (Supabase Auth)
    ↓ (1:1)
perfiles (Usuario extendido)
    ├─ (1:N) → matriculas
    └─ (1:N) → certificate_downloads

cursos
    ├─ (1:N) → modulos
    ├─ (1:N) → matriculas
    ├─ (1:N) → certificate_templates
    ├─ (1:1) → categorias
    └─ (1:N) → certificate_downloads

modulos
    └─ (1:N) → lecciones

lecciones
    ├─ (1:N) → lecciones_archivos
    └─ (1:N) → preguntas_quiz

matriculas (UNIQUE: perfil_id + curso_id)
    ├─ → perfiles
    └─ → cursos
```

---

## ⚠️ Constraints Críticos

| Tabla | Constraint | Razón |
|-------|-----------|-------|
| `perfiles` | `rut NOT NULL` | Identificación legal requerida |
| `perfiles` | `rol IN ('alumno', 'admin')` | Control de acceso |
| `matriculas` | `UNIQUE(perfil_id, curso_id)` | Evitar inscripciones duplicadas |
| `cupones` | `descuento_porcentaje BETWEEN 1 AND 100` | Validación de datos |
| `modulos` | `UNIQUE(curso_id, orden)` | Orden único dentro curso |
| `lecciones` | `UNIQUE(modulo_id, orden)` | Orden único dentro módulo |

---

## 🚀 Scripts de Inicialización

Ver: `scripts/seed-admin.ts` y `scripts/seed-complete.ts` (por crear)

---

**Última actualización:** 2026-03-19
**Versión del Schema:** 1.0
