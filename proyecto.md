# 📚 Capacitar y Crecer LMS - Documento Maestro

**Proyecto:** Capacitar y Crecer - Learning Management System para OTEC
**Fecha de Actualización:** 19 de Marzo, 2026
**Estado:** MVP Funcional - Production Ready
**Versión:** 1.0.0

---

## 📋 Tabla de Contenidos

1. [Visión General](#visión-general)
2. [Stack Tecnológico](#stack-tecnológico)
3. [Arquitectura y Principios](#arquitectura-y-principios)
4. [Base de Datos](#base-de-datos)
5. [Módulos Implementados](#módulos-implementados)
6. [Funcionalidades Recientes (Sprint 3)](#funcionalidades-recientes-sprint-3)
7. [Server Actions](#server-actions)
8. [Rutas Principales](#rutas-principales)
9. [Mejoras de UX/Seguridad](#mejoras-de-uxseguridad)
10. [Roadmap Futuro](#roadmap-futuro)
11. [Setup y Despliegue](#setup-y-despliegue)

---

## 🎯 Visión General

Capacitar y Crecer es un **Learning Management System (LMS) production-ready** diseñado específicamente para el mercado educativo chileno.

### Soporta 4 Modelos de Negocio

| Tipo | `tipo_acceso` | Inscripción | Contenido | Certificado |
|------|--------------|-------------|-----------|------------|
| **Gratis Completo** | `gratis` | Gratis | Gratis | Gratis |
| **Gratis + Cert Pago** | `gratis_cert_pago` | Gratis | Gratis | Pago (Freemium) |
| **De Pago** | `pago` | Pago | Post-pago | Incluido |
| **Cotizar** | `cotizar` | Formulario | Previa cotización | Manual |
| **Pago Inmediato** | `pago-inmediato` | Pago 1x | Acceso inmediato | Incluido |

### Principio de UX: "No me hagas pensar"
- Interfaces limpias y de alto contraste
- Flujos sin fricción
- Feedback visual inmediato (loading states, toasts)
- Validaciones claras

---

## 💻 Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| **Framework** | Next.js 16 (App Router + Server Components) |
| **Estilos** | Tailwind CSS + Lucide React (Iconos) |
| **Backend as a Service** | Supabase (PostgreSQL, Auth, Storage) |
| **Estado** | React Server Components + Server Actions |
| **Email** | Resend (+ API) |
| **Drag & Drop** | @dnd-kit |
| **Rich Text** | TipTap Editor |
| **Notificaciones** | Sonner (Toast) |
| **Type Safety** | TypeScript + Zod (validación) |

---

## 🏗 Arquitectura y Principios

### 1. **Cero Lógica Transaccional en Cliente**
- Client Components = **solo renderizado UI + captura de eventos**
- Todas las operaciones de base de datos = **Server Actions** (`'use server'`)
- Validación siempre en servidor

### 2. **Autenticación Híbrida Segura**
- Gestión de sesiones vía Cookies (`@supabase/ssr`)
- Rutas privadas protegidas a nivel de servidor (Middleware)
- Admin panel con verificación de permisos en server actions
- Service Role Key para operaciones administrativas

### 3. **Manejo de Errores Explícito**
- Respuestas estructuradas: `{ success: true } | { error: 'MOTIVO_CLARO' }`
- Cero fallas silenciosas
- Logging descriptivo en consola del servidor

### 4. **Validación Multi-Capa**
- **Cliente:** Inputs con placeholder, disabled states, validación en tiempo real
- **Servidor:** TypeScript + Zod para validación de esquemas
- **Base de Datos:** RLS (Row Level Security) como última línea de defensa

### 5. **Límites de Carga de Archivos**
- **Límite global:** 50 MB por operación
- **Validación cliente:** Real-time feedback mientras selecciona archivos
- **Validación servidor:** Validación antes de procesar (sin caídas)
- **Feedback:** Mensajes claros del tamaño actual vs. límite

---

## 📊 Base de Datos (PostgreSQL en Supabase)

### Tablas Principales

#### `perfiles` - Datos del usuario
```sql
id UUID (PK, FK → auth.users)
nombre_completo TEXT
rut TEXT (chileno)
rol ENUM ('alumno', 'admin')
created_at TIMESTAMPTZ
```

#### `cursos` - Definición de cursos
```sql
id UUID (PK)
titulo TEXT
slug TEXT (unique)
descripcion_breve TEXT
contenido_programatico TEXT
objetivos TEXT
metodologia TEXT
caracteristicas_generales TEXT
imagen_url TEXT
tipo_acceso ENUM ('gratis', 'pago-inmediato', 'pago', 'gratis_cert_pago', 'cotizar')
precio_curso INTEGER (NULL si gratis/cotizar)
precio_certificado INTEGER (NULL si no hay cert)
tiene_certificado BOOLEAN
estado TEXT ('borrador', 'publicado')
categoria_id UUID (FK → categorias)
created_at TIMESTAMPTZ
```

#### `matriculas` - Enrollment records
```sql
id UUID (PK)
perfil_id UUID (FK → perfiles)
curso_id UUID (FK → cursos)
estado_pago_curso BOOLEAN (true = acceso permitido)
estado_pago_certificado BOOLEAN
progreso_porcentaje INTEGER (0-100)
created_at TIMESTAMPTZ
UNIQUE (perfil_id, curso_id)
```

#### `modulos` - Estructura del curso
```sql
id UUID (PK)
curso_id UUID (FK → cursos)
titulo TEXT
orden INTEGER
created_at TIMESTAMPTZ
```

#### `lecciones` - Contenido individual
```sql
id UUID (PK)
modulo_id UUID (FK → modulos)
titulo TEXT
tipo ENUM ('video', 'texto', 'quiz')
video_url TEXT
contenido_html TEXT
orden INTEGER
created_at TIMESTAMPTZ
```

#### `lecciones_archivos` - Archivos adjuntos
```sql
id UUID (PK)
leccion_id UUID (FK → lecciones)
nombre_archivo TEXT
archivo_url TEXT
created_at TIMESTAMPTZ
```

#### `lecciones_completadas` - Progreso del alumno
```sql
id UUID (PK)
perfil_id UUID (FK → perfiles)
leccion_id UUID (FK → lecciones)
created_at TIMESTAMPTZ
UNIQUE (perfil_id, leccion_id)
```

#### `cupones` - Sistema de descuentos
```sql
id UUID (PK)
codigo TEXT (UNIQUE, uppercase)
descuento_porcentaje INTEGER (1-100)
activo BOOLEAN
usos_maximos INTEGER (NULL = ilimitado)
usos_actuales INTEGER
created_at TIMESTAMPTZ
```

#### `quizzes_preguntas` - Evaluaciones
```sql
id UUID (PK)
leccion_id UUID (FK → lecciones)
pregunta TEXT
tipo ENUM ('multiple', 'verdadero_falso')
puntos INTEGER
orden INTEGER
created_at TIMESTAMPTZ
```

#### `quizzes_opciones` - Opciones de respuesta
```sql
id UUID (PK)
pregunta_id UUID (FK → quizzes_preguntas)
opcion_texto TEXT
es_correcta BOOLEAN
orden INTEGER
created_at TIMESTAMPTZ
```

---

## ✅ Módulos Implementados

### ✅ **Módulo 1: Autenticación y Onboarding**
- [x] Registro e Inicio de Sesión por Email/Password
- [x] Trigger SQL para creación automática de perfil
- [x] Protección de rutas privadas mediante middleware
- [x] Contraste alto en formularios UI
- [x] Gestión de usuarios desde admin (crear, editar, eliminar, cambiar contraseña)

### ✅ **Módulo 2: Catálogo y Landing de Cursos**
- [x] Listado público de cursos dinámico (`/cursos`)
- [x] Páginas individuales de curso (`/cursos/[slug]`)
- [x] CTAs dinámicos según `tipo_acceso` (5 variantes)
- [x] Protección: Cursos sin lecciones muestran warning
- [x] ImagePlaceholder sutil cuando no hay imagen

### ✅ **Módulo 3: Checkout y Sistema de Cupones**
- [x] Página de checkout (`/checkout/[cursoId]`)
- [x] Input de código de cupón con validación en tiempo real
- [x] Sistema de cupones con límites de uso
- [x] Descuento dinámico (cálculo de precio final)
- [x] Admin de cupones (`/admin/cupones`)
  - [x] Tabla con CRUD completo
  - [x] Toggle activar/desactivar
  - [x] Copiar código al clipboard

### ✅ **Módulo 4: Área Privada del Alumno (Dashboard)**
- [x] Protección de ruta mediante servidor
- [x] Saludo personalizado con nombre completo
- [x] Listado de cursos inscritos
- [x] Progreso visual de cada curso
- [x] Botón "Continuar aprendiendo" → aula virtual

### ✅ **Módulo 5: Aula Virtual (LMS Player)**
- [x] Layout responsivo (Sidebar + área central)
- [x] Navegación entre módulos y lecciones
- [x] Reproductor de video (Vimeo/YouTube)
- [x] Visualizador de contenido HTML
- [x] Sistema de Quiz (preguntas opción múltiple)
- [x] Descarga de archivos adjuntos
- [x] Botón "Marcar como completada"
- [x] Seguimiento de progreso real-time
- [x] Banner de curso completado (100% progreso)
- [x] Descarga de certificados

### ✅ **Módulo 6: Administración de Cursos**
- [x] CRUD completo de cursos (`/admin/cursos`)
- [x] Formulario con 5 opciones de `tipo_acceso`
- [x] Campos condicionales según tipo
- [x] Editor de módulos y lecciones
- [x] Drag & Drop para reordenar módulos/lecciones
- [x] Upload de archivos adjuntos por lección
- [x] Sistema de Quiz con editor visual

### ✅ **Módulo 7: Gestión de Usuarios (NUEVO - Sprint 3)**
- [x] `/admin/alumnos` - Tabla de usuarios (admins + alumnos)
- [x] Búsqueda en tiempo real (nombre, email, RUT)
- [x] Filtros por rol (admin/alumno)
- [x] 5 acciones por usuario:
  - [x] Ver detalle (panel con inscripciones)
  - [x] Editar (nombre, rol)
  - [x] Cambiar contraseña
  - [x] Enviar email directo
  - [x] Eliminar usuario (cascada)
- [x] Panel de inscripciones con progreso visual
- [x] Enrolar/desinscribir de cursos desde admin
- [x] Integración con Resend para envío de emails

---

## 🚀 Funcionalidades Recientes (Sprint 3)

### 🔐 **Sistema de Gestión de Usuarios**
**Archivos:** `src/app/admin/alumnos/page.tsx`, `src/actions/usuarios.ts`, `src/components/admin/*`

#### Server Actions
- `getUsuarios()` - Lista con datos combinados de auth + perfiles + matriculas
- `crearUsuario()` - Crea auth.user + perfil, con opción de email de bienvenida
- `cambiarPassword()` - Actualiza contraseña vía auth.admin
- `actualizarPerfil()` - Edita nombre, RUT, rol
- `eliminarUsuario()` - Cascada: matriculas → perfiles → auth.users
- `inscribirEnCurso()` - Enrola usuario desde admin
- `desinscribirDeCurso()` - Quita inscripción
- `getInscripcionesUsuario()` - Cursos inscritos con progreso
- `getCursosDisponibles()` - Cursos no inscritos

#### Componentes
- **UserModal.tsx** - Crear/editar usuarios con validación de contraseña
- **UserDetailPanel.tsx** - Panel de inscripciones con progreso visual
- **ChangePasswordModal.tsx** - Cambio de contraseña con confirmación
- **SendEmailModal.tsx** - Composición de emails con plantillas predefinidas

### 📧 **Integración Resend**
**Archivos:** `src/lib/resend.ts`, `src/actions/email.ts`

- `enviarEmail()` - Genérico para cualquier email HTML
- `enviarBienvenida()` - Template de bienvenida con credenciales
- Soporte para `RESEND_API_KEY` y `RESEND_FROM_EMAIL`
- Manejo de errores controlado

### 📦 **Validación de Carga de Archivos**
**Archivos:** `src/actions/curriculum.ts`, `src/app/admin/cursos/[id]/CurriculumBuilder.tsx`

#### Límites y Validación
- **Límite global:** 50 MB por operación
- **Validación cliente:**
  - Real-time mientras selecciona archivos
  - Indicador visual de tamaño actual vs. límite
  - Botón "Guardar" deshabilitado si supera límite
  - Feedback claro en rojo si hay error

- **Validación servidor:**
  - Función `getTotalFormDataSize()` calcula tamaño total
  - Validación en `createLesson()` y `updateLesson()` antes de procesar
  - Retorna error controlado sin crashes

---

## 🔧 Server Actions

### Usuarios
| Función | Propósito |
|---------|----------|
| `getUsuarios()` | Lista todos los usuarios |
| `crearUsuario()` | Crea usuario con auth + perfil |
| `cambiarPassword()` | Actualiza contraseña |
| `actualizarPerfil()` | Edita perfil del usuario |
| `eliminarUsuario()` | Cascada: elimina todo |
| `inscribirEnCurso()` | Enrola usuario en curso |
| `desinscribirDeCurso()` | Quita inscripción |
| `getInscripcionesUsuario()` | Cursos del usuario |
| `getCursosDisponibles()` | Cursos no inscritos |

### Cursos
| Función | Propósito |
|---------|----------|
| `getCursos()` | Lista de cursos |
| `crearCurso()` | Crear nuevo curso |
| `editarCurso()` | Editar propiedades |
| `eliminarCurso()` | Eliminar curso |

### Curriculum
| Función | Propósito |
|---------|----------|
| `createModule()` | Crear módulo |
| `updateModule()` | Editar módulo |
| `deleteModule()` | Eliminar módulo |
| `createLesson()` | Crear lección (con validación 50MB) |
| `updateLesson()` | Editar lección (con validación 50MB) |
| `deleteLesson()` | Eliminar lección |
| `updateCurriculumOrder()` | Reordenar módulos/lecciones |

### Email
| Función | Propósito |
|---------|----------|
| `enviarEmail()` | Envío genérico |
| `enviarBienvenida()` | Template de bienvenida |

### Progreso
| Función | Propósito |
|---------|----------|
| `marcarCompletada()` | Marca lección como vista |
| `getProgreso()` | Obtiene progreso del curso |

### Cupones
| Función | Propósito |
|---------|----------|
| `getCupones()` | Lista cupones |
| `createCupon()` | Crear cupón |
| `toggleCupon()` | Activar/desactivar |
| `deleteCupon()` | Eliminar cupón |
| `validarCupon()` | Valida en checkout |

---

## 🗺️ Rutas Principales

### 🌐 Públicas
```
GET  /                           # Landing
GET  /cursos                      # Listado de cursos
GET  /cursos/[slug]              # Detalle de curso
GET  /login                       # Inicio de sesión
GET  /registro                    # Registro
GET  /checkout/[cursoId]         # Checkout con cupones
```

### 🔒 Privadas (Alumno)
```
GET  /dashboard                              # Mis cursos
GET  /dashboard/cursos/[slug]               # Aula virtual
GET  /dashboard/cursos/[id]/lecciones/[id] # Lección específica
```

### 👨‍💼 Admin
```
GET  /admin                                    # Dashboard
GET  /admin/cursos                            # Gestión de cursos
GET  /admin/cursos/nuevo                      # Crear curso
GET  /admin/cursos/[id]/edit                 # Editar curso
GET  /admin/cursos/[id]                      # Detalles del curso
GET  /admin/cupones                          # Gestión de cupones
GET  /admin/alumnos                          # Gestión de usuarios (NUEVO)
GET  /admin/categorias                       # Categorías
```

---

## ✨ Mejoras de UX/Seguridad

| Feature | Status | Detalles |
|---------|--------|----------|
| Contraste de inputs | ✅ | Border-2, text-gray-900, visibilidad WCAG |
| ImagePlaceholder | ✅ | Sutil, limpio con icono |
| Loading states | ✅ | Spinners, disabled buttons, "Procesando..." |
| Validación real-time | ✅ | Cupones, archivos, inputs |
| Mensajes de error claros | ✅ | Alerts con motivo exacto |
| Drag & Drop | ✅ | Reordenar módulos/lecciones con @dnd-kit |
| RichTextEditor | ✅ | TipTap para contenido HTML |
| Archivos adjuntos | ✅ | Upload con validación de tamaño (50MB) |
| Tabla de usuarios | ✅ | Búsqueda, filtros, 5 acciones por fila |
| Email directo | ✅ | Integración Resend con plantillas |

---

## 📈 Roadmap Futuro

### 🛠 **Fase 1: Blindaje de Infraestructura** (Próximo Sprint)
- [ ] Auditoría de Server Actions con Zod validation
- [ ] Revisión de RLS policies en Supabase
- [ ] Manejo global de errores (error.tsx en rutas clave)
- [ ] Optimización de consultas (select específicos, no `*`)

### 🎨 **Fase 2: UX/UI Pro**
- [ ] Sistema de Diseño unificado
- [ ] Dashboard de admin con métricas reales
- [ ] Optimización de imágenes con `next/image`
- [ ] Skeletons elegantes para cargas

### 🚀 **Fase 3: Conversión y SEO**
- [ ] Refactorización del hero section
- [ ] Filtros dinámicos de cursos (sin reload)
- [ ] Landing pages vendedoras
- [ ] Meta tags dinámicos (Open Graph)

### 🎓 **Fase 4: Certificación**
- [ ] Generación de certificados PDF
- [ ] RUT estampado en certificado
- [ ] Código QR dinámico para validación

### 💳 **Fase 5: Pagos**
- [ ] Integración Transbank Webpay Plus
- [ ] Integración Flow
- [ ] Manejo de estados de pago
- [ ] Webhooks de confirmación

### 🎯 **Fase 6: Avanzadas**
- [ ] Lecciones en vivo (WebRTC)
- [ ] Foros de discusión
- [ ] Gamificación (badges, leaderboard)
- [ ] Sistema de referidos/afiliados
- [ ] Mobile app nativa

---

## 🚀 Setup y Despliegue

### Requisitos
- Node.js 20+
- npm o pnpm
- Cuenta Supabase (gratuita)
- Variables `.env.local` con credenciales

### Setup Local

```bash
# Clonar y instalar
git clone https://github.com/tu-org/capacitar-crecer.git
cd "Capacitar y Crecer"
npm install

# Configurar env
cp .env.example .env.local
# Editar .env.local con:
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
# - SUPABASE_SERVICE_ROLE_KEY
# - RESEND_API_KEY
# - RESEND_FROM_EMAIL

# Ejecutar dev
npm run dev
# → http://localhost:3000

# Build para producción
npm run build
```

### Variables de Entorno
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
RESEND_API_KEY=re_xxxxx
RESEND_FROM_EMAIL=no-reply@tu-dominio.com
```

### Deploy a Vercel
```bash
npm run build  # Verificar compilación
git push       # Push a main
# → Vercel auto-deploya
```

---

## 📝 Notas Técnicas

### RLS (Row Level Security)
- **Cupones:** Lectura pública (activos), escritura admin only
- **Matriculas:** Cada usuario ve solo sus inscripciones
- **Perfiles:** Cada usuario ve su perfil
- **Lecciones:** Acceso según matrícula

### Triggers SQL
- Al registrarse → crear perfil automáticamente
- Al marcar lección completada → actualizar progreso_porcentaje
- Al crear cupón → validar límites de uso

### Límites Conocidos
- Cupones < 100%: crean matriculas con `estado_pago_curso = false` (placeholder para pasarela)
- Certificados: generación en roadmap (no automática aún)
- Pagos: solo TEST100 (cupón 100%) funciona sin pasarela

### Performance
- Server-side rendering de páginas públicas (fast)
- ISR para cursos
- Caché de Supabase habilitado
- Archivos limitados a 50 MB

---

## 🏆 Estándares de Desarrollo

**Ver:** `SENIOR-STANDARDS.md` para reglas obligatorias de:
- UX/UI moderna (Drag & Drop, modales, feedback)
- Accesibilidad WCAG
- Lógica CRUD completa
- Backend robusto (try/catch, logging)

---

## 📊 Cambios Recientes

### Sprint 3 (19 Marzo 2026)
- ✅ Gestión completa de usuarios (`/admin/alumnos`)
- ✅ Integración Resend para emails
- ✅ Validación de carga de archivos (50MB)
- ✅ Componentes: UserModal, UserDetailPanel, ChangePasswordModal, SendEmailModal
- ✅ Build compila sin errores
- ✅ Documentación actualizada

### Sprint 2
- ✅ Sistema de Quiz con editor visual
- ✅ Tabla de cupones con CRUD
- ✅ Validación de cupones en checkout
- ✅ Aula virtual completa

### Sprint 1
- ✅ Autenticación y onboarding
- ✅ Catálogo de cursos
- ✅ Dashboard del alumno
- ✅ Admin de cursos

---

## 🔗 Enlaces Importantes

- **GitHub:** https://github.com/tu-org/capacitar-crecer
- **Supabase Project:** https://app.supabase.com/projects
- **Vercel Dashboard:** https://vercel.com/dashboard

---

## 📧 Contacto

**Maintainer:** Daniel
**Reportar bugs:** GitHub Issues con etiquetas [bug], [feature], [docs]

---

**Versión:** 1.0.0 (MVP - Production Ready)
**Última actualización:** 19 de Marzo, 2026
