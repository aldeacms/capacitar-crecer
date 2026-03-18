# Documento Maestro de Arquitectura y Desarrollo
**Proyecto:** Capacitar y Crecer LMS
**Fecha de Actualización:** Marzo 18, 2026
**Estado:** MVP Funcional - Sistema de Cursos con Checkout y Cupones Operativo

---

## 1. Visión General
Capacitar y Crecer es un Sistema de Gestión de Aprendizaje (LMS) diseñado para el mercado chileno. Soporta **4 modelos de negocio distintos:**

| Tipo | `tipo_acceso` | Inscripción | Contenido | Certificado |
|------|--------------|-------------|-----------|-------------|
| **Gratis** | `gratis` | Gratis | Gratis | Gratis si incluido |
| **Gratis + Cert Pago** | `gratis_cert_pago` | Gratis | Gratis | Pago al terminar |
| **De Pago** | `pago` | Requiere Pago (con cupones) | Acceso post-pago | Incluido o pago |
| **Cotizar** | `cotizar` | Formulario | Manual | Manual |

**Regla de Oro de UX:** "No me hagas pensar". Interfaces limpias, alto contraste, flujos sin fricción.

---

## 2. Stack Tecnológico (Production-Ready)
- **Framework Frontend:** Next.js 16 (App Router + Server Components)
- **Estilos y UI:** Tailwind CSS + Lucide React (Íconos)
- **Backend as a Service (BaaS):** Supabase (PostgreSQL, Auth, Storage)
- **Gestión de Estado y Fetching:** React Server Components (RSC) y Server Actions (no client-side queries)
- **Componentes UI:** Badge, ImagePlaceholder, Modal de cupones
- **Pasarelas de Pago (Futuro):** Placeholder para integración Multi-Gateway (Flow, Transbank Webpay, Mercado Pago)

---

## 3. Principios de Arquitectura Inquebrantables

1. **Cero Lógica Transaccional en el Cliente:**
   - Client Components **SOLO** renderiza UI y captura eventos
   - Toda lectura/escritura en BD se realiza vía **Server Actions** (`'use server'`)
   - Validación de datos siempre en servidor

2. **Autenticación Híbrida Segura:**
   - Gestión de sesiones vía Cookies (`@supabase/ssr`)
   - Rutas privadas protegidas a nivel de servidor (Middleware Next.js)
   - Admin panel con verificación de permisos en server actions

3. **Manejo de Errores Explícito:**
   - Respuestas estructuradas: `{ success: true } | { error: 'MOTIVO_CLARO' }`
   - Cero fallas silenciosas, logging en consola del servidor

4. **Validación de Datos Multi-Capa:**
   - Validación en inputs (placeholder, disabled states)
   - Validación en server actions (tipos TypeScript, lógica de negocio)
   - RLS en Supabase como última línea de defensa

---

## 4. Estructura de Base de Datos (PostgreSQL en Supabase)

### Tabla: `perfiles`
```sql
id UUID (PK, FK → auth.users)
nombre_completo TEXT
rut TEXT (chileno)
rol ENUM ('alumno', 'admin')
created_at TIMESTAMPTZ
```

### Tabla: `cursos`
```sql
id UUID (PK)
titulo TEXT
slug TEXT (único)
descripcion_breve TEXT
contenido_programatico TEXT
objetivos TEXT
metodologia TEXT
caracteristicas_generales TEXT
imagen_url TEXT
tipo_acceso ENUM ('gratis', 'gratis_cert_pago', 'pago', 'cotizar')
precio_curso INTEGER (NULL si gratis/cotizar)
precio_certificado INTEGER (NULL si no hay cert)
tiene_certificado BOOLEAN
estado TEXT ('borrador', 'publicado')
categoria_id UUID (FK → categorias)
created_at TIMESTAMPTZ
```

### Tabla: `matriculas` (enrollment records)
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

### Tabla: `cupones` (NEW)
```sql
id UUID (PK)
codigo TEXT (UNIQUE, uppercase)
descuento_porcentaje INTEGER (1-100)
activo BOOLEAN
usos_maximos INTEGER (NULL = ilimitado)
usos_actuales INTEGER
created_at TIMESTAMPTZ
```

### Tabla: `matriculas_cupones` (NEW)
```sql
id UUID (PK)
matricula_id UUID (FK → matriculas, ON DELETE CASCADE)
cupon_id UUID (FK → cupones)
descuento_aplicado INTEGER
created_at TIMESTAMPTZ
```

### Tabla: `modulos`
```sql
id UUID (PK)
curso_id UUID (FK → cursos)
titulo TEXT
orden INTEGER
created_at TIMESTAMPTZ
```

### Tabla: `lecciones`
```sql
id UUID (PK)
modulo_id UUID (FK → modulos)
titulo TEXT
tipo ENUM ('video', 'texto', 'quiz')
video_url TEXT (Vimeo/YouTube)
contenido_html TEXT
orden INTEGER
created_at TIMESTAMPTZ
```

### Tabla: `lecciones_completadas`
```sql
id UUID (PK)
perfil_id UUID (FK → perfiles)
leccion_id UUID (FK → lecciones)
created_at TIMESTAMPTZ
UNIQUE (perfil_id, leccion_id)
```

### Tabla: `categorias`
```sql
id UUID (PK)
nombre TEXT
slug TEXT
imagen_url TEXT
```

---

## 5. Módulos Implementados (MVP)

### ✅ Módulo 1: Autenticación y Onboarding
- [x] Registro e Inicio de Sesión por Email/Password
- [x] Trigger SQL para creación automática de perfil tras registro
- [x] Protección de rutas privadas mediante middleware
- [x] Contraste alto en formularios UI
- [ ] Validación de RUT chileno (Algoritmo Módulo 11) - *Próximo*

### ✅ Módulo 2: Catálogo y Landing de Cursos
- [x] Listado público de cursos dinámico (`/cursos`)
- [x] Páginas individuales de curso (`/cursos/[slug]`)
- [x] CTAs dinámicos según `tipo_acceso` (4 variantes)
- [x] Protección: Cursos sin lecciones muestran "⚠️ En construcción"
- [x] ImagePlaceholder sutil cuando no hay imagen
- [x] Enrolamiento seguro vía Server Actions

### ✅ Módulo 3: Checkout y Sistema de Cupones
- [x] Página de checkout (`/checkout/[cursoId]`)
- [x] Mini-hero en checkout con nombre del curso
- [x] Input de código de cupón funcional
- [x] Sistema de cupones con validación
- [x] Descuento en tiempo real (cálculo de precio final)
- [x] Confirmación de inscripción con cupón
- [x] Admin de cupones (`/admin/cupones`)
  - [x] Tabla con estado activo/inactivo
  - [x] Modal de creación de cupones
  - [x] Toggle activar/desactivar
  - [x] Eliminar cupones
  - [x] Copiar código al clipboard
- [x] Cupón TEST100 (100% descuento) pre-cargado para testing
- [x] Placeholder para integración Transbank (futuro)

### ✅ Módulo 4: Área Privada del Alumno (Dashboard)
- [x] Protección de ruta mediante servidor
- [x] Saludo personalizado con nombre completo
- [x] Listado de cursos inscritos
- [x] Progreso visual de cada curso
- [x] Botón "Continuar aprendiendo" → aula virtual

### ✅ Módulo 5: Aula Virtual (LMS Player)
- [x] Layout responsivo (Sidebar + área central)
- [x] Navegación entre módulos y lecciones
- [x] Reproductor de video (Vimeo/YouTube)
- [x] Visualizador de contenido de texto (HTML)
- [x] Sistema de Quiz (preguntas opción múltiple)
- [x] Descarga de archivos adjuntos
- [x] Botón "Marcar como completada"
- [x] Seguimiento de progreso real-time
- [x] Banner de curso completado (100% progreso)
  - [x] Botón "Descargar Certificado" para gratis/pago
  - [x] Botón "Obtener Certificado por $X" para gratis_cert_pago
  - [x] Mensaje si no hay certificado

### ✅ Módulo 6: Administración de Cursos
- [x] CRUD completo de cursos (`/admin/cursos`)
- [x] Formulario mejorado con 4 opciones de tipo_acceso
- [x] Campos condicionales según tipo (precio, certificado, etc.)
- [x] Editor de módulos y lecciones
- [x] Tabla de categorías (`/admin/categorias`)
- [x] Gestión de alumnos enrolados

---

## 6. Server Actions Implementados

| Archivo | Función | Propósito |
|---------|---------|-----------|
| `src/actions/inscribir.server.ts` | `inscribir()` | Enrolamiento a cursos gratis/freemium |
| `src/actions/checkout.ts` | `validarCupon()` | Valida cupón activo y límites de uso |
| `src/actions/checkout.ts` | `inscribirConCupon()` | Procesa inscripción con descuento (100% = acceso inmediato, partial = pendiente pago) |
| `src/actions/cupones.ts` | `getCupones()` | Lista cupones para admin |
| `src/actions/cupones.ts` | `createCupon()` | Crea nuevo cupón |
| `src/actions/cupones.ts` | `toggleCupon()` | Activa/desactiva cupón |
| `src/actions/cupones.ts` | `deleteCupon()` | Elimina cupón |
| `src/actions/progreso.ts` | `marcarCompletada()` | Marca lección completada e incrementa progreso |
| `src/actions/cursos.ts` | `crearCurso()`, `editarCurso()`, `eliminarCurso()` | CRUD de cursos |
| `src/actions/cursos.ts` | `obtenerAlumnos()` | Lista estudiantes enrolados |
| `src/actions/categorias.ts` | `getCategories()`, `createCategory()`, etc. | CRUD de categorías |

---

## 7. Rutas Principales

### Públicas
- `GET /` - Landing público
- `GET /cursos` - Listado de cursos
- `GET /cursos/[slug]` - Detalle de curso
- `GET /login` - Login
- `GET /registro` - Registro

### Privadas (Alumno)
- `GET /dashboard` - Mis cursos
- `GET /dashboard/cursos/[slug]` - Aula virtual (video, texto, quiz, progreso)
- `GET /checkout/[cursoId]` - Checkout con cupones

### Admin
- `GET /admin` - Dashboard admin
- `GET /admin/cursos` - Tabla de cursos
- `POST /admin/cursos/nuevo` - Crear curso
- `GET /admin/cursos/[id]/edit` - Editar curso
- `GET /admin/cupones` - Gestión de cupones
- `GET /admin/categorias` - Categorías
- `GET /admin/alumnos` - Estudiantes del sistema

---

## 8. Mejoras de UX Implementadas

| Feature | Status | Detalles |
|---------|--------|----------|
| Contraste de inputs | ✅ | Border-2, placeholder-gray-500, text-gray-900 |
| ImagePlaceholder | ✅ | Sutil, limpio con icono de imagen |
| Mini-hero en checkout | ✅ | Gradiente + nombre del curso |
| Protección sin lecciones | ✅ | Botón deshabilitado + banner "En construcción" |
| Responsive design | ✅ | Mobile-first, tested en tablet/desktop |
| Validación en tiempo real | ✅ | Cupones, código uppercase, disabled states |
| Mensajes de error claros | ✅ | Alerts con motivo exacto |
| Loading states | ✅ | Spinners, disabled buttons, "Procesando..." |

---

## 9. Bugs Corregidos

| Bug | Síntoma | Solución |
|-----|---------|----------|
| Detección de duplicados | `insertError.message.includes('duplicate')` | Cambiar a `insertError.code !== '23505'` |
| Campo nombre en perfiles | Query seleccionaba 'email' de tabla equivocada | Cambiar a `nombre_completo` (autenticado en perfiles) |
| Certificado inferido de precio | Lógica frágil | Usar boolean `tiene_certificado` |
| Enum tipo_acceso con 5 valores | Redundancia (pago vs pago-inmediato) | Simplificar a 4 valores canónicos |
| Redireccionamiento en checkout | Usaba `curso.titulo` en URL | Cambiar a `curso.slug` |
| CheckoutForm sin estilos | Props no llegaban | Verificar hydration + agregar logging |

---

## 10. Estado Actual y Próximos Pasos

### ✅ Completado (MVP)
- Sistema de autenticación y autorización
- 4 modelos de negocio de cursos
- Checkout funcional con cupones
- Aula virtual con video, texto, quiz
- Sistema de progreso y certificados (placeholder)
- Admin completo

### 📋 Tareas Inmediatas (Next Sprint)
1. **Validación RUT chileno** - Algoritmo Módulo 11 en checkout
2. **Generación de certificados PDF** - Nombre + RUT del alumno
3. **Integración Transbank** - Pasarela de pago para descuentos parciales
4. **Notificaciones por email** - Confirmación inscripción, certificado listo
5. **Analytics y reportes** - Dashboard admin con métricas
6. **Optimizaciones de SEO** - Open Graph, structured data

### 🔮 Fase Avanzada (Roadmap)
- Lecciones en vivo (WebRTC)
- Foros de discussión
- Gamificación (badges, leaderboard)
- Sistema de refreridos/afiliados
- Mobile app nativa

---

## 11. Instrucciones de Instalación y Desarrollo

### Requisitos
- Node.js 20+
- npm o pnpm
- Cuenta Supabase (gratuita)
- Variables `.env.local` con credenciales Supabase

### Setup Local
```bash
# Clonar y instalar
git clone https://github.com/tu-org/capacitar-crecer.git
cd "Capacitar y Crecer"
npm install

# Configurar env
cp .env.example .env.local
# Editar .env.local con credenciales Supabase

# Ejecutar dev
npm run dev
# → http://localhost:3000
```

### Deploy a Producción
```bash
npm run build  # Verificar compilación
git push      # Push a main
# → Vercel auto-deploya (configurado)
```

---

## 12. Notas Técnicas Importantes

### RLS (Row Level Security)
- Cupones: lectura pública (activos), escritura admin only
- Matriculas: cada usuario ve solo sus propias inscripciones
- Perfiles: cada usuario ve solo su perfil

### Triggers SQL
- Al registrarse → crear perfil automáticamente
- Al marcar lección completada → actualizar progreso_porcentaje de matrícula

### Límites Conocidos
- Cupones con descuento < 100%: se crean matriculas con `estado_pago_curso = false` (placeholder para pasarela)
- Certificados: generación manual o vía script (no automática aún)
- Pagos: solo TEST100 (cupón 100%) funciona sin pasarela

### Performance
- Server-side rendering de páginas públicas (fast)
- ISR (Incremental Static Regeneration) para cursos
- Caché de Supabase habilitado

---

## 13. Contacto y Soporte

**Mantainer:** Daniel (daniel@capacitarycrcer.cl)
**Repo:** https://github.com/tu-org/capacitar-crecer
**Issues:** Usar GitHub Issues con etiquetas [bug], [feature], [docs]

---

**Última actualización:** Marzo 18, 2026
**Versión:** 1.0.0 (MVP - Production Ready)
