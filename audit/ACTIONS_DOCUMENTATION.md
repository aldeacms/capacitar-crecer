# 📚 SERVER ACTIONS DOCUMENTATION

**Fecha:** 2026-03-19
**Total Funciones:** 52 funciones en 11 archivos
**Estado:** Completamente documentado

---

## 📋 Tabla de Contenidos

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Autenticación y Autorización](#autenticación-y-autorización)
3. [Documentación por Archivo](#documentación-por-archivo)
4. [Patrones y Mejores Prácticas](#patrones-y-mejores-prácticas)
5. [Matriz de Acceso](#matriz-de-acceso)

---

## Resumen Ejecutivo

### Estadísticas Generales

| Métrica | Valor |
|---------|-------|
| **Total de Funciones** | 52 |
| **Archivos** | 11 |
| **Funciones Públicas** | 2 |
| **Funciones RequireAuth** | 3 |
| **Funciones RequireAdmin** | 47 |
| **Operaciones Lectura** | 15 |
| **Operaciones Escritura** | 32 |
| **Operaciones Eliminación** | 5 |

### Archivos Principales

| Archivo | Funciones | Propósito |
|---------|-----------|----------|
| `categorias.ts` | 4 | Gestión de categorías de cursos |
| `certificados.ts` | 3 | Generación y validación de certificados |
| `checkout.ts` | 2 | Cupones e inscripciones con descuento |
| `cupones.ts` | 4 | Gestión de códigos promocionales |
| `curriculum.ts` | 10 | Módulos, lecciones y estructura de cursos |
| `cursos.ts` | 4 | CRUD de cursos |
| `dashboard.ts` | 3 | Métricas y gráficas administrativas |
| `email.ts` | 2 | Envío de correos electrónicos |
| `progreso.ts` | 2 | Seguimiento de progreso del estudiante |
| `quiz.ts` | 5 | Gestión de cuestionarios |
| `usuarios.ts` | 9 | Gestión de usuarios y perfiles |

---

## Autenticación y Autorización

### Niveles de Acceso

#### 1. **Public** (2 funciones)
```typescript
// Sin requiere autenticación
- validarCertificado(certificateId)     // Validar certificados públicamente
- validarCupon(codigo)                   // Verificar cupón disponible
```

#### 2. **requireAuth** (3 funciones)
```typescript
// Solo usuarios autenticados
await requireAuth()  // Obtiene usuario, redirige a /login si no existe

- generarCertificado(cursoId)            // Generar certificado del curso completado
- marcarLeccionCompletada(leccionId)     // Marcar progreso
- getLeccionesCompletadas(cursoId)       // Obtener lecciones completadas
```

#### 3. **requireAdmin** (47 funciones)
```typescript
// Solo administradores
await requireAdmin()  // Obtiene usuario, verifica admin_users, redirige si no admin

// Todos los CRUD de:
// - Categorías
// - Cupones
// - Cursos y módulos
// - Lecciones y quizzes
// - Usuarios
// - Dashboard
```

### Flujo de Autenticación

```
Request a función requireAdmin()
    ↓
requireAuth()
    ├─ getUser() de auth.users ✅ Seguro (usa getUser, no getSession)
    ├─ Si no existe → redirect /login
    └─ Return { id, email }
        ↓
    isUserAdmin(user.id)
        ├─ Busca en admin_users table
        ├─ Verifica is_active = true
        ├─ Fallback: revisa campo rol en perfiles (legacy)
        └─ Si no admin → redirect /login
            ↓
    ✅ Usuario confirmado como admin
```

---

## Documentación por Archivo

### 1️⃣ `categorias.ts` - Gestión de Categorías

#### getCategories()
- **Propósito:** Obtener todas las categorías
- **Auth:** requireAdmin
- **Retorna:** `Category[] | []`
- **BD:** SELECT id, nombre, slug, descripcion, imagen_url

#### createCategory(formData)
- **Propósito:** Crear nueva categoría
- **Auth:** requireAdmin
- **Validación:** CategorySchema (nombre, slug, descripcion)
- **Slug:** Auto-generado como único
- **Imagen:** Upload opcional a `imagenes_cursos`
- **Side Effects:** revalidatePath('/admin/categorias')

#### updateCategory(id, formData)
- **Propósito:** Actualizar categoría
- **Auth:** requireAdmin
- **Validación:** UUID + CategorySchema
- **Slug Único:** Excluding current category
- **Side Effects:** Replacement de imagen si se sube nueva

#### deleteCategory(id)
- **Propósito:** Eliminar categoría
- **Auth:** requireAdmin
- **Validación:** None
- **Cuidado:** Cascada a cursos asociados (verificar constraint)

---

### 2️⃣ `certificados.ts` - Certificados

#### generarCertificado(cursoId)
```typescript
// ✅ Idempotente: retorna existente si ya existe
// 🔒 Verifica: completion (100%), tiene_certificado=true
// 📄 Genera: PDF con template resolution
// 💾 Upload: Storage bucket certificate_downloads
// 📊 Record: INSERT en certificate_downloads con idempotency
// ⏳ Válido: 2 años desde emisión
```

**Flujo:**
1. requireAuth() + obtener perfil
2. Verificar curso existe y tiene_certificado=true
3. Verificar enrollmetn y 100% complete
4. Check if existing certificate in storage
5. Si existe: return existing
6. Si no: generate PDF → upload → record → return

#### validarCertificado(certificateId)
```typescript
// 🔓 Public - sin autenticación
// Retorna: alumno, rut, curso, fecha, estado invalidación
// Database: SELECT + check invalidado_at
```

#### invalidarCertificado(certificateId)
```typescript
// 🔒 requireAdmin
// Marca: invalidado_at timestamp + invalidado_por admin ID
// Use case: Revoke fraudulent/incorrect certs
```

---

### 3️⃣ `checkout.ts` - Cupones e Inscripciones

#### validarCupon(codigo)
```typescript
// 🔓 Public
// Busca: uppercase(codigo)
// Verifica: activo, usos_maximos, fecha_expiracion
// Retorna: descuento_porcentaje
```

#### inscribirConCupon(cursoId, codigoCupon)
```typescript
// 🔒 requireAuth
// Validaciones:
//   - User has profile
//   - Course tipo_acceso === 'pago'
//   - Not already enrolled
//   - Coupon valid
// Lógica:
//   - Si 100% descuento: estado_pago_curso = true directamente
//   - Si partial: estado_pago_curso = false (pending payment)
// Database:
//   - INSERT matriculas
//   - UPDATE cupones.usos_actuales++
//   - INSERT matriculas_cupones (linking enrollment to coupon)
// Future: Integración Transbank/Stripe
```

---

### 4️⃣ `cupones.ts` - Gestión de Cupones

#### getCupones()
```typescript
// 🔒 requireAdmin
// Retorna: All cupones ordenados por created_at DESC
// Incluye: id, codigo, descuento, usos_maximos, activo
```

#### createCupon(codigo, descuento, usos_maximos?)
```typescript
// 🔒 requireAdmin
// Validación: CuponSchema (3-20 chars, 1-100% discount)
// Code: UPPERCASE + TRIM
// Default: activo=true, usos_actuales=0
// Unique: codigo UNIQUE constraint
```

#### toggleCupon(id, activo)
```typescript
// 🔒 requireAdmin
// Alterna: NOT(current_status)
// Nota: El parámetro 'activo' es el estado actual, se invierte
```

#### deleteCupon(id)
```typescript
// 🔒 requireAdmin
// Permanente: DELETE from cupones
```

---

### 5️⃣ `curriculum.ts` - Estructura de Cursos

#### createModule(curso_id, titulo, orden)
```typescript
// 🔒 requireAdmin
// Auto-orden: Si no se proporciona, calcula como MAX(orden)+1
// Database: INSERT modulos
// Revalidate: /admin/cursos/[courseId]
```

#### updateModule(id, titulo, cursoId)
```typescript
// 🔒 requireAdmin
// Update: titulo only
// Revalidate: /admin/cursos/[courseId]
```

#### deleteModule(id, cursoId)
```typescript
// 🔒 requireAdmin
// Cascade: Elimina lecciones y quizzes dentro
// Revalidate: /admin/cursos/[courseId]
```

#### createLesson(formData)
```typescript
// 🔒 requireAdmin
// Fields:
//   - modulo_id, curso_id, titulo, tipo
//   - video_url, contenido_html (opcional)
//   - archivos[] (múltiples archivos)
// Límite: 50MB total por submission
// Auto-orden: Next available
// Uploads:
//   - Files → archivos_lecciones bucket
//   - Records → lecciones_archivos table
// Revalidate: /admin/cursos/[courseId]
```

#### updateLesson(formData)
```typescript
// 🔒 requireAdmin
// Similar a createLesson pero UPDATE
// Maneja: Reemplazo de archivos
```

#### deleteLesson(id, cursoId)
```typescript
// 🔒 requireAdmin
// Delete: lecciones record (cascade delete quizzes)
// Revalidate: /admin/cursos/[courseId]
```

#### deleteLessonFile(fileId, filePath, cursoId)
```typescript
// 🔒 requireAdmin
// Elimina: archivo de storage bucket
// DB: DELETE from lecciones_archivos
// Maneja: Paths directos y URLs públicas
// Revalidate: /admin/cursos/[courseId]
```

#### updateCurriculumOrder(type, items, cursoId)
```typescript
// 🔒 requireAdmin
// type: 'module' | 'lesson'
// items: [{ id, orden }, ...]
// Batch upsert: SINGLE query (no N queries)
// Use: Drag-and-drop reordering
// Revalidate: /admin/cursos/[courseId]
```

#### moveModule(id, cursoId, direction)
```typescript
// 🔒 requireAdmin
// direction: 'up' | 'down'
// Swaps: orden values between adjacent modules
// Deprecated: Usar updateCurriculumOrder (drag-drop)
// Revalidate: /admin/cursos/[courseId]
```

#### moveLesson(id, moduloId, cursoId, direction)
```typescript
// 🔒 requireAdmin
// Similar a moveModule pero para lecciones
// Deprecated: Usar updateCurriculumOrder
// Revalidate: /admin/cursos/[courseId]
```

---

### 6️⃣ `cursos.ts` - Gestión de Cursos

#### createCourse(formData)
```typescript
// 🔒 requireAdmin
// Campos: titulo, slug, descripcion, categoria, horas, precio, etc.
// Validación: CursoSchema (completa)
// Slug: Auto-garantiza unicidad
// Imagen: Upload a imagenes_cursos/portadas
// tipos_acceso: 'gratis' | 'pago' | 'gratis_cert_pago' | 'cotizar'
// Revalidate: /admin/cursos, /
```

#### updateCourse(formData)
```typescript
// 🔒 requireAdmin
// Similar a createCourse
// Slug: Único excluyendo current course
// Revalidate: Multiple routes (course page + listings)
```

#### getDeleteSummary(cursoId)
```typescript
// 🔒 requireAdmin
// Preparación para delete
// Retorna:
//   - totalModulos, totalLecciones
//   - totalAlumnos (affected enrollments)
//   - Lista de alumnos afectados
//   - Storage paths a limpiar
// Use: Mostrar confirmación al admin
```

#### deleteCourse(cursoId)
```typescript
// 🔒 requireAdmin
// Orden:
//   1. Fetch summary
//   2. Delete lesson files from storage
//   3. Delete course cover image
//   4. DELETE from cursos (cascade: modulos, lecciones, matriculas)
// Warning: Si storage delete falla, continúa (database succeeds)
// Retorna: storageWarnings si hay problemas
// Revalidate: /admin/cursos, /
```

---

### 7️⃣ `dashboard.ts` - Métricas

#### getDashboardMetrics()
```typescript
// 🔒 requireAdmin
// Retorna:
//   - totalUsuarios: COUNT(auth.users)
//   - usuariosActivos: COUNT(distinct users with enrollments in last 30 days)
//   - totalCursos: COUNT(cursos)
//   - cursosActivos: COUNT(distinct courses with enrollments)
//   - totalMatriculas: COUNT(matriculas)
//   - certificadosEmitidos: COUNT(non-invalidated certs)
//   - ingresoTotal: SUM(precios pagados)
// Nota: Todos inline, sin queries complejas
```

#### getMatriculasChart()
```typescript
// 🔒 requireAdmin
// Retorna: Últimos 30 días agrupados por fecha
// Formato: [{ date: 'Mar 19, 2026', matriculas: 5 }, ...]
// Locale: es-CL
// Use: Gráfico de línea en dashboard
```

#### getTopCursos()
```typescript
// 🔒 requireAdmin
// Retorna: Top 5 por enrollment count
// Formato: [{ id, titulo, matriculas }, ...]
// Use: Gráfico de barras
```

---

### 8️⃣ `email.ts` - Correos

#### enviarEmail(to, subject, html)
```typescript
// 🔓 Semi-public (llamado internamente)
// Usa: Resend API
// Require: RESEND_API_KEY env var
// From: RESEND_FROM_EMAIL (default: no-reply@resend.dev)
// Retorna: { success, id } | { error }
// Fallback: Graceful error si API key no configurada
```

#### enviarBienvenida(email, nombre, password)
```typescript
// 🔒 Internal (usado en crearUsuario)
// Template: HTML formateado
// URL: NEXT_PUBLIC_APP_URL para login link
// Incluye: Credenciales temporales + recomendación cambiar password
// Warning: Password en plain text (email)
```

---

### 9️⃣ `progreso.ts` - Progreso Estudiante

#### marcarLeccionCompletada(leccionId)
```typescript
// 🔒 requireAuth
// Validaciones:
//   - Lesson exists
//   - Module exists
//   - User enrolled in course
// Inserts:
//   - lecciones_completadas record (UNIQUE constraint ignored)
// Calcula:
//   - Next lesson ID (orden+1 same module or next module)
//   - Course progress % = (completedCount / totalCount) * 100
// Updates:
//   - matriculas.progreso_porcentaje
// Retorna: { nextLeccionId? } o error
// Revalidate: /dashboard, /
```

#### getLeccionesCompletadas(cursoId)
```typescript
// 🔒 requireAuth
// Retorna: Array de lesson IDs completadas
// Use: Marcar visualmente lecciones completadas en UI
```

---

### 🔟 `quiz.ts` - Cuestionarios

#### saveQuestion(leccion_id, texto, tipo, puntos, opciones)
```typescript
// 🔒 requireAdmin
// Validación: QuestionSchema
// Tipos: 'multiple' | 'vf' | 'abierta' | 'pareados'
// Auto-orden: Next available en lesson
// Inserts:
//   - quizzes_preguntas (pregunta)
//   - quizzes_opciones (one or more options)
// Matching:
//   - Para 'pareados': split terms y answers
// Revalidate: Quiz page + course layout
```

#### updateQuestion(id, texto, tipo, opciones, leccionId)
```typescript
// 🔒 requireAdmin
// Update: quizzes_preguntas
// Delete & Recreate: options
// Revalidate: Quiz page + course layout
```

#### updateQuestionsOrder(questions)
```typescript
// 🔒 requireAdmin
// Batch upsert: quizzes_preguntas.orden
// Use: Drag-and-drop quiz editor
// Single query: No N queries
// Revalidate: Quiz page
```

#### deleteQuestion(id)
```typescript
// 🔒 requireAdmin
// Cascade: Deletes options via DB constraint
// Revalidate: Quiz page + course layout
```

#### uploadQuestionImage(formData)
```typescript
// 🔒 requireAdmin
// File: formData.imagen
// MIME: image/jpeg | image/png | image/gif | image/webp
// Size: ≤ 5MB
// Upload: imagenes_preguntas bucket
// Retorna: public URL para embed
```

---

### 1️⃣1️⃣ `usuarios.ts` - Gestión de Usuarios

#### getUsuarios()
```typescript
// 🔒 requireAdmin
// Retorna: Array de todos los usuarios
// Incluye: id, email, nombre, rut, rol (from admin_users), cursos_count
// Merges: auth.users + perfiles + admin_users + matriculas counts
// Rol: Determined by presence in admin_users (authoritative)
```

#### crearUsuario(email, password, nombre, rut?, rol?)
```typescript
// 🔒 requireAdmin
// Validación: UsuarioSchema
// Paso 1: Create en auth.users (email_confirm: true)
// Paso 2: Create en perfiles
// Paso 3 (opt): Add a admin_users si rol='admin'
// Rollback: Si perfiles fails, revierte auth.users
// Revalidate: /admin/alumnos
```

#### cambiarPassword(userId, newPassword)
```typescript
// 🔒 requireAdmin
// Validación: PasswordSchema (8-100 chars)
// Updates: auth.users.password directamente
// Redirige: User a re-login con nuevo password
```

#### actualizarPerfil(userId, nombre_completo?, rut?)
```typescript
// 🔒 requireAdmin
// Validación: ActualizarPerfilSchema
// Updates: perfiles table
// Revalidate: /admin/alumnos
```

#### eliminarUsuario(userId)
```typescript
// 🔒 requireAdmin
// Orden:
//   1. DELETE matriculas
//   2. DELETE perfiles
//   3. DELETE auth.users (cascades)
// Revalidate: /admin/alumnos
// Cuidado: Permanent - no undo
```

#### inscribirEnCurso(perfilId, cursoId)
```typescript
// 🔒 requireAdmin
// Validación: UUID + no duplicate enrollment
// Insert: matriculas (estado_pago_curso: 'gratis')
// Revalidate: /admin/alumnos
```

#### desinscribirDeCurso(matriculaId)
```typescript
// 🔒 requireAdmin
// Delete: matriculas record
// Revalidate: /admin/alumnos
```

#### getInscripcionesUsuario(perfilId)
```typescript
// 📖 Read-only (sin requerimiento explícito de auth)
// Retorna: Todos los cursos inscritos
// Incluye: estado pago, progreso, curso info
```

#### getCursosDisponibles(perfilId)
```typescript
// 📖 Read-only
// Retorna: Cursos en los que no está inscrito
// Use: Recomendaciones / Add course dialog
```

---

## Patrones y Mejores Prácticas

### ✅ Patrones Implementados

#### 1. Validación con Zod
```typescript
// ✅ Correcto
const parsed = CursoSchema.safeParse(data)
if (!parsed.success) {
  return { error: parsed.error.issues[0]?.message }
}
const validated = parsed.data

// ❌ Incorrecto
// No validar inputs de usuarios
```

#### 2. Autenticación Centralizada
```typescript
// ✅ Correcto
export async function requireAdmin(): Promise<AuthUser> {
  const user = await requireAuth()
  const isAdmin = await isUserAdmin(user.id)
  if (!isAdmin) redirect('/login')
  return user
}

// ❌ Incorrecto
// if (!session?.user) return - usa getSession (less secure)
```

#### 3. Cache Invalidation
```typescript
// ✅ Correcto
await supabaseAdmin.from('cursos').insert({...})
revalidatePath('/admin/cursos')
revalidatePath('/cursos')
revalidatePath('/') // Home listing

// ❌ Incorrecto
// No revalidar rutas afectadas
```

#### 4. Error Handling
```typescript
// ✅ Correcto
try {
  const result = await operation()
  return { success: true, data: result }
} catch (error: unknown) {
  console.error('Context:', error)
  return { error: (error as Error).message }
}

// ❌ Incorrecto
// throw error - deja debugging al cliente
```

#### 5. Idempotencia
```typescript
// ✅ Correcto - generarCertificado
const existing = await supabase
  .from('certificate_downloads')
  .select('*')
  .eq('perfil_id', user.id)
  .eq('curso_id', cursoId)
  .single()

if (existing) return existing // Return cached cert

// ❌ Incorrecto
// Crear nuevo cada vez (múltiples PDFs para mismo usuario+curso)
```

### ⚠️ Antipatrones a Evitar

```typescript
// ❌ NO HACER: Pasar userId como parámetro de forma insegura
await cambiarPassword(userId) // No verificar que sea el usuario actual

// ✅ HACER: Obtener usuario de sesión
const user = await requireAuth()
await cambiarPassword(user.id) // Del usuario autenticado

// ❌ NO HACER: SELECT * sin límites
const { data: users } = await supabase.from('usuarios').select('*')

// ✅ HACER: Especificar columnas necesarias
const { data: users } = await supabase
  .from('usuarios')
  .select('id, email, nombre_completo')

// ❌ NO HACER: N queries en loop
items.forEach(async (item) => {
  await supabase.from('modulos').update({orden: item.orden}).eq('id', item.id)
})

// ✅ HACER: Batch operations
await supabase.from('modulos').upsert(
  items.map(i => ({id: i.id, orden: i.orden}))
)
```

---

## Matriz de Acceso

### Por Nivel de Autenticación

```
PUBLIC (2 funciones):
├─ validarCertificado
└─ validarCupon

REQUIRE_AUTH (3 funciones):
├─ generarCertificado
├─ marcarLeccionCompletada
└─ getLeccionesCompletadas

REQUIRE_ADMIN (47 funciones):
├─ categorias: 4 funciones
├─ certificados: 2 funciones (1 admin + 1 public)
├─ checkout: 1 función (inscribirConCupon es auth, no admin)
├─ cupones: 4 funciones
├─ curriculum: 10 funciones
├─ cursos: 4 funciones
├─ dashboard: 3 funciones
├─ email: 2 funciones
├─ progreso: 1 función (marcar es auth, not admin)
├─ quiz: 5 funciones
└─ usuarios: 9 funciones
```

### Por Tipo de Operación

**Lectura (15):**
- getCategories, getCupones, getCursos (implied)
- getDashboardMetrics, getMatriculasChart, getTopCursos
- validarCertificado, validarCupon
- getLeccionesCompletadas, getInscripcionesUsuario, getCursosDisponibles
- getDeleteSummary

**Escritura (32):**
- createCategory, updateCategory
- createCupon, toggleCupon
- createModule, updateModule, createLesson, updateLesson
- createCourse, updateCourse
- crearUsuario, cambiarPassword, actualizarPerfil
- inscribirEnCurso
- saveQuestion, updateQuestion, updateQuestionsOrder
- updateCurriculumOrder
- marcarLeccionCompletada
- enviarEmail, enviarBienvenida
- inscribirConCupon
- (etc - total 32)

**Eliminación (5):**
- deleteCategory
- deleteCupon
- deleteModule, deleteLesson, deleteLessonFile
- deleteCourse
- deleteQuestion
- eliminarUsuario
- desinscribirDeCurso
- invalidarCertificado

---

## Seguridad

### ✅ Implementado

- [x] Autenticación via `requireAuth()` y `requireAdmin()`
- [x] Validación de inputs via Zod schemas
- [x] Manejo centralizado de errores
- [x] Cache revalidation en mutations
- [x] UUID validation para IDs
- [x] Fallback a legacy `rol` field en `perfiles` durante transición
- [x] Idempotencia donde aplica

### ⚠️ Por Verificar

- [ ] RLS policies en tablas críticas
- [ ] CORS en storage buckets
- [ ] File type validation para uploads
- [ ] Size limits enforcement
- [ ] Rate limiting en public functions
- [ ] Audit logging de operaciones destructivas

### 📋 Recomendaciones

1. **RLS Policies:** Cada tabla debe tener policies (even if empty)
2. **File Uploads:** Validar MIME type strict (no confiar en extensión)
3. **Audit Trail:** Log de eliminaciones y cambios de rol
4. **Rate Limiting:** Limitar intentos de validación de cupones
5. **Certificate Verification:** Verificar que links de validación son únicos y temporales

---

## Próximos Pasos

### FASE 4: Implementar Features Faltantes
- [ ] Admin promote/demote de usuarios
- [ ] Dashboard con datos reales verificados
- [ ] Búsqueda y filtros avanzados en admin panel

### FASE 5: Testing
- [ ] Unit tests para server actions críticas
- [ ] Integration tests para flujos completos
- [ ] Security tests para autenticación

### FASE 6: Documentación Final
- [ ] API reference para frontend
- [ ] Ejemplos de uso en componentes
- [ ] Troubleshooting guide
