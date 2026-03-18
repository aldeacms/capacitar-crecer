# Documento Maestro de Arquitectura y Desarrollo
**Proyecto:** Capacitar y Crecer LMS  
**Fecha de Actualización:** Marzo 2026  
**Objetivo:** Plataforma de e-learning escalable, segura y optimizada para usuarios con distintos niveles de alfabetización digital.

---

## 1. Visión General
Capacitar y Crecer es un Sistema de Gestión de Aprendizaje (LMS) diseñado para el mercado chileno. Debe soportar múltiples modelos de negocio:
- Cursos 100% gratuitos.
- Cursos gratuitos con certificación de pago (Freemium).
- Cursos de pago inmediato.
- Modalidad corporativa (Cotización B2B).

**Regla de Oro de UX:** "No me hagas pensar". Interfaces limpias, alto contraste, flujos sin fricción y cero pop-ups innecesarios.

---

## 2. Stack Tecnológico (Enterprise Standard)
- **Framework Frontend:** Next.js 16 (App Router)
- **Estilos y UI:** Tailwind CSS + Lucide React (Íconos)
- **Backend as a Service (BaaS):** Supabase (PostgreSQL, Auth, Storage)
- **Gestión de Estado y Fetching:** React Server Components (RSC) y Server Actions.
- **Pasarelas de Pago (Futuro):** Integración Multi-Gateway (Flow, Transbank Webpay, Mercado Pago) mediante patrón Adapter.

---

## 3. Principios de Arquitectura Inquebrantables
Para garantizar seguridad y escalabilidad, el proyecto se rige por estas reglas estrictas:

1. **Cero Lógica Transaccional en el Cliente:** - El navegador (Client Components) **SOLO** renderiza UI y captura eventos (clics, formularios).
   - Toda lectura/escritura en la base de datos se realiza **exclusivamente** a través de **Server Actions** o **Route Handlers** de Next.js. 
   - *Razón:* Evitar exposición de lógica, saltar restricciones frágiles del navegador y manejar errores de forma centralizada.
2. **Autenticación Híbrida Segura:** - Gestión de sesiones vía Cookies (`@supabase/ssr`).
   - Rutas privadas (`/dashboard`, `/clases`) protegidas a nivel de servidor mediante Middleware de Next.js.
3. **Manejo de Errores Explícito:** - El backend debe devolver objetos estructurados (ej: `{ success: false, error: 'MOTIVO_CLARO' }`). Cero fallas silenciosas.

---

## 4. Estructura de Base de Datos Core (PostgreSQL)

### Tabla: `perfiles`
- **id:** UUID (PK, referencia a `auth.users`)
- **nombre_completo:** Texto
- **rut:** Texto (Validado formato chileno)
- **telefono:** Texto
- **rol:** Enum ('alumno', 'admin')

### Tabla: `cursos`
- **id:** UUID (PK)
- **titulo, slug, descripcion:** Texto
- **tipo_acceso:** Enum ('gratis', 'pago-inmediato')
- **precio_curso, precio_certificado:** Numérico
- **estado:** Booleano (publicado/borrador)

### Tabla: `inscripciones`
- **id:** UUID (PK)
- **perfil_id:** UUID (FK)
- **curso_id:** UUID (FK)
- **estado:** Enum ('activo', 'completado')
- **progreso_porcentaje:** Numérico (0-100)
- *Restricción:* Llave única (perfil_id, curso_id) para evitar duplicidades.

### Tablas Futuras:
- `modulos`, `lecciones`, `progreso_lecciones`, `pagos`, `certificados`.

---

## 5. Módulos y Funcionalidades del Sistema

### Módulo 1: Autenticación y Onboarding
- [x] Registro e Inicio de Sesión por Email/Password.
- [x] Trigger SQL para creación automática de perfil tras registro.
- [x] Validación de contraste alto en formularios UI.
- [ ] Incorporación de validación de RUT chileno (Algoritmo Modulo 11) en el perfil/checkout.

### Módulo 2: Catálogo y Landing de Cursos
- [x] Listado público de cursos.
- [x] Páginas dinámicas de curso (`/cursos/[slug]`).
- [x] Call to Actions dinámicos basados en `tipo_acceso` (Comenzar Gratis vs. Cotizar).
- [ ] Refactorización del botón de inscripción a **Server Actions** para enrolamiento 100% seguro.

### Módulo 3: Área Privada del Alumno (Dashboard)
- [x] Protección de ruta mediante servidor.
- [x] Obtención de nombre real del perfil (Saludo personalizado).
- [x] Mini Hero oscuro unificado para resolver contraste del Navbar.
- [ ] Renderizado dinámico de tarjetas de cursos activos desde la tabla `inscripciones`.

### Módulo 4: Sala de Clases (LMS Player) - *Próximo a desarrollar*
- Layout de pantalla completa (Sidebar izquierdo con temario, área central de video).
- Reproductor agnóstico (soporte inicial para Vimeo/YouTube).
- Sistema de seguimiento de progreso ("Marcar como completada").
- Bloqueo de avance secuencial (opcional).

### Módulo 5: Motor de Certificación y Pagos - *Fase Avanzada*
- Barrera de pago (Paywall) al finalizar cursos Freemium.
- Generación dinámica de PDF con el nombre y RUT del alumno.
- Checkout unificado para múltiples pasarelas chilenas.

---

## 6. Estado Actual de Desarrollo (Sprint Actual)
- **Base de Datos:** Configurada con políticas RLS (Row Level Security) y triggers básicos.
- **UI Base:** Construida y responsiva.
- **Problema Actual (En resolución):** Inestabilidad en la inserción de datos desde Client Components (Supabase throws `{}`). 
- **Solución Arquitectónica Acordada:** Migración inminente de la lógica de inscripción desde `createClientComponentClient()` hacia una arquitectura de `Server Actions` (`@supabase/ssr` en servidor) para garantizar transaccionalidad y manejo de errores robusto.

---

## 7. Próximos Pasos (Hoja de Ruta Inmediata)

1. **Refactorización del Enrolamiento (Backend):** Crear el Server Action `inscribirAlumno(cursoId)` y conectarlo al botón de la landing. Validar que la inscripción gratuita funcione sin errores en BD.
2. **Poblar el Dashboard:** Consultar las inscripciones reales del usuario e inyectarlas en el grid de `/dashboard`.
3. **Diseño de Sala de Clases:** Construir la interfaz `/dashboard/cursos/[slug]` (El reproductor).