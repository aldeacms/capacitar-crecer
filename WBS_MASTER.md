# WBS MASTER — Capacitar y Crecer
**Versión:** 5.0
**Fecha actualización:** 2026-03-29 (auditado contra código real)
**Metodología:** Funcionalidad consolidada → CMS → Pagos → Hardening

---

## Principios de este plan

1. **Funcionalidad antes de estética** — nada roto antes de agregar features nuevas
2. **CMS primero, pagos después** — el sistema de contenidos es requisito para multi-OTEC
3. **Pagos chilenos nativos** — Transbank, Flow y Mercado Pago (no Stripe)
4. **Multi-tenant desde el diseño** — cada OTEC tendrá su instancia con su contenido
5. **Sin atajos** — cada tarea se verifica antes de marcar como completa

---

## FASE 0 — Quick wins (emojis → iconos) ✅ COMPLETADA

Eliminados todos los emojis del sistema. Archivos afectados: `CheckoutForm.tsx` (GATEWAY_ICONS), `cursos/[slug]/page.tsx`, `DeleteCourseModal.tsx`, `UserModal.tsx`, `Navbar.tsx`. Reemplazados por iconos Lucide consistentes con el resto del sitio. Build limpio, 0 errores TypeScript.

---

## FASE 1 — Consolidación de funcionalidad existente ✅ COMPLETADA (pendiente tests manuales)

### 1.1 Gestión de usuarios

| # | Tarea | Estado |
|---|-------|--------|
| 1.1.1 | Paginación en lista de alumnos | [x] 2026-03-28 — client-side, PAGE_SIZE=20, prev/next |
| 1.1.2 | Editar email de usuario | [x] 2026-03-28 |
| 1.1.3 | Envío de email a usuario individual (Resend) | [x] 2026-03-28 — SendEmailModal con plantillas |
| 1.1.4 | Búsqueda client-side en alumnos | [x] 2026-03-28 — por nombre, email y RUT |

### 1.2 Checkout

| # | Tarea | Estado |
|---|-------|--------|
| 1.2.1 | Cupón no obligatorio + flujo pendiente de pago | [x] 2026-03-28 |
| 1.2.2 | Tabla `pagos` en BD | [x] 2026-03-28 (implementada en FASE 3) |

### 1.3 Dashboard admin — métricas

| # | Tarea | Estado |
|---|-------|--------|
| 1.3.1 | Auditar `getDashboardMetrics()` — números reales | [x] 2026-03-28 — `usuariosActivos` corregido a usuarios únicos con actividad |
| 1.3.2 | Gráfico matrículas últimos 30 días | [x] 2026-03-28 — MatriculasChartClient con recharts |
| 1.3.3 | Top cursos por inscripciones (fix query) | [x] 2026-03-28 |

### 1.4 Verificación end-to-end

| # | Tarea | Estado |
|---|-------|--------|
| 1.4.1 | Test: registro → curso gratuito → aula → quiz → certificado | [ ] pendiente (manual) |
| 1.4.2 | Test: admin crea/edita/cambia rol/elimina usuario | [ ] pendiente (manual) |
| 1.4.3 | Test: cupón 100% → inscripción directa | [ ] pendiente (manual) |
| 1.4.4 | `npm run build` limpio | [x] 2026-03-28 — verificado local y en VPS Docker |

---

## FASE 2 — Sistema de Configuración y CMS ✅ COMPLETADA (parcial)

### 2.1 Base de datos

| # | Tarea | Estado |
|---|-------|--------|
| 2.1.1 | Tabla `app_config` | [x] 2026-03-28 |
| 2.1.2 | Tabla `paginas` | [x] 2026-03-28 |
| 2.1.3 | Tabla `secciones_landing` | [x] 2026-03-28 |
| 2.1.4 | Tabla `media_library` | [x] 2026-03-28 |
| 2.1.5 | Tabla `menu_items` | [~] descartada — navegación se maneja en código, no en BD |
| 2.1.6 | RLS policies para todas las tablas CMS | [x] 2026-03-28 |

### 2.2 Admin — Configuración General (`/admin/config`)

| # | Tarea | Estado |
|---|-------|--------|
| 2.2.1 | Identidad OTEC (nombre, logo, colores) | [x] 2026-03-28 |
| 2.2.2 | Información de contacto y RRSS | [x] 2026-03-28 |
| 2.2.3 | Configuración SEO global (meta title, description, OG) | [x] 2026-03-28 |
| 2.2.4 | Configuración de registro (habilitado/deshabilitado) | [ ] pendiente |
| 2.2.5 | Configuración de certificados → reemplazada por FASE 2.6 (editor visual completo) | [x] 2026-03-29 |

### 2.3 Admin — Páginas CMS (`/admin/paginas`)

| # | Tarea | Estado |
|---|-------|--------|
| 2.3.1 | Lista de páginas con estado publicado/borrador | [x] 2026-03-28 |
| 2.3.2 | Editor de página con preview toggle | [x] 2026-03-28 |
| 2.3.3 | SEO por página (title, description, 160 chars counter) | [x] 2026-03-28 |
| 2.3.4 | Ruta pública dinámica `/(public)/[slug]/page.tsx` | [x] 2026-03-28 |
| 2.3.5 | Páginas por defecto del sistema (Términos, Privacidad…) | [ ] pendiente |

### 2.4 Admin — Landing/Home (dentro de `/admin/config`)

| # | Tarea | Estado |
|---|-------|--------|
| 2.4.1 | Editor Hero (eyebrow, título, subtítulo, CTA, imagen) | [x] 2026-03-28 |
| 2.4.2 | Editor Stats (descripción + 4 ítems) | [x] 2026-03-28 |
| 2.4.3 | Editor logos de clientes | [x] 2026-03-28 |
| 2.4.4 | Frontend conectado a BD (Hero, Stats, ClientLogos, Footer, Navbar) | [x] 2026-03-28 |
| 2.4.5 | Editor de testimonios | [ ] pendiente |

### 2.5 Biblioteca de Medios

| # | Tarea | Estado |
|---|-------|--------|
| 2.5.1 | Tabla `media_library` en BD con RLS | [x] 2026-03-28 |
| 2.5.2 | Ruta `/admin/medios` con upload a Supabase Storage | [ ] pendiente |
| 2.5.3 | Vista grid/lista de imágenes | [ ] pendiente |
| 2.5.4 | Selector de imagen reutilizable (modal) | [ ] pendiente |

---

## FASE 2.6 — Sistema de Certificados — Editor Visual ✅ COMPLETADA

### 2.6.1 Base de datos

| # | Tarea | Estado |
|---|-------|--------|
| 2.6.1.1 | Tabla `certificate_templates` (orientación, posiciones, texto libre, colores, fondo) | [x] 2026-03-28 |
| 2.6.1.2 | Tabla `certificate_downloads` (PDF estático en Storage, inmutable post-emisión) | [x] 2026-03-28 |
| 2.6.1.3 | RLS policies | [x] 2026-03-28 |

### 2.6.2 Motor PDF (`pdf-lib`)

| # | Tarea | Estado |
|---|-------|--------|
| 2.6.2.1 | Generación PDF con imagen de fondo JPG/PNG desde Supabase Storage | [x] 2026-03-28 |
| 2.6.2.2 | Fuentes TTF embebidas (Montserrat Bold + Regular desde `/public/fonts/`) | [x] 2026-03-28 |
| 2.6.2.3 | QR code con color configurable y URL de validación pública | [x] 2026-03-28 |
| 2.6.2.4 | Orientación horizontal (842×595) y vertical (595×842) | [x] 2026-03-28 |
| 2.6.2.5 | Variables dinámicas en texto: `{{nombre_alumno}}`, `{{rut_alumno}}`, `{{nombre_curso}}`, `{{horas}}`, `{{fecha_emision}}`, `{{fecha_vigencia}}` | [x] 2026-03-28 |
| 2.6.2.6 | Negrita inline con sintaxis `**texto**` en bloques de texto libre | [x] 2026-03-28 |
| 2.6.2.7 | Alineación left / center / right / justify con word-spacing en justify | [x] 2026-03-28 |

### 2.6.3 Editor visual drag & drop

| # | Tarea | Estado |
|---|-------|--------|
| 2.6.3.1 | Canvas proporcional al PDF (escala automática) | [x] 2026-03-28 |
| 2.6.3.2 | Drag de cualquier elemento sobre el canvas | [x] 2026-03-28 |
| 2.6.3.3 | Snap a grilla (50 pts) y snap a líneas centrales | [x] 2026-03-28 |
| 2.6.3.4 | Grilla como overlay encima de imagen de fondo | [x] 2026-03-28 |
| 2.6.3.5 | QR: resize arrastrando esquina inferior-derecha | [x] 2026-03-28 |
| 2.6.3.6 | Texto libre: resize de ancho (handle derecho) y alto (handle inferior) | [x] 2026-03-28 |
| 2.6.3.7 | Chip texto libre muestra negrita y alineación real (`RichChipText`) | [x] 2026-03-28 |
| 2.6.3.8 | QR chip muestra color configurado | [x] 2026-03-28 |
| 2.6.3.9 | Editor a pantalla completa (fixed overlay, cubre sidebar admin) | [x] 2026-03-28 |
| 2.6.3.10 | Layout dos sidebars: izquierdo (lista elementos) + derecho (propiedades) | [x] 2026-03-28 |
| 2.6.3.11 | Elementos fijos: ocultar / restaurar | [x] 2026-03-28 |
| 2.6.3.12 | Texto libre: agregar / eliminar / editar con variables y negrita | [x] 2026-03-28 |

### 2.6.4 Gestión de plantillas

| # | Tarea | Estado |
|---|-------|--------|
| 2.6.4.1 | CRUD de plantillas (`upsertTemplate`, `deleteTemplate`) | [x] 2026-03-28 |
| 2.6.4.2 | Plantilla global (sin curso) + plantillas específicas por curso | [x] 2026-03-28 |
| 2.6.4.3 | Fallback: si el curso no tiene plantilla, usa la global | [x] 2026-03-28 |
| 2.6.4.4 | Duplicar plantilla (nueva desde cero o copia de existente) | [x] 2026-03-28 |
| 2.6.4.5 | Modal de inicio: "desde cero" o "copiar plantilla existente" | [x] 2026-03-28 |
| 2.6.4.6 | Upload de imagen de fondo a Supabase Storage | [x] 2026-03-28 |
| 2.6.4.7 | Preview PDF en tiempo real (endpoint POST `/api/admin/certificados/preview`) | [x] 2026-03-28 |

### 2.6.5 Inmutabilidad de certificados emitidos

| # | Tarea | Estado |
|---|-------|--------|
| 2.6.5.1 | PDFs almacenados como archivos estáticos en Supabase Storage | [x] 2026-03-28 |
| 2.6.5.2 | Descarga sirve el archivo guardado (no regenera) | [x] 2026-03-28 |
| 2.6.5.3 | Validación pública `/validar-certificado/[id]` | [x] 2026-03-28 |

---

## FASE 3 — Sistema de Pagos (Chile) ✅ COMPLETADA (core)

### 3.1 Infraestructura base

| # | Tarea | Estado |
|---|-------|--------|
| 3.1.1 | Tabla `pagos` (transacciones) | [x] 2026-03-28 |
| 3.1.2 | Tabla `payment_configs` (credenciales por gateway) | [x] 2026-03-28 |
| 3.1.3 | Cifrado de credenciales en BD (AES-256) | [ ] pendiente — actualmente en texto plano en Supabase |
| 3.1.4 | Server actions: `iniciarPago()`, `confirmarPago()` | [x] 2026-03-28 |

### 3.2 Admin — Configuración de pasarelas (`/admin/pagos`)

| # | Tarea | Estado |
|---|-------|--------|
| 3.2.1 | UI Transbank (toggle, credenciales, modo) | [x] 2026-03-28 |
| 3.2.2 | UI Flow (toggle, credenciales, modo) | [x] 2026-03-28 |
| 3.2.3 | UI MercadoPago (toggle, credenciales, webhook secret, modo) | [x] 2026-03-28 |
| 3.2.4 | Aviso si ninguna pasarela habilitada | [ ] pendiente |
| 3.2.5 | Histórico de transacciones en admin | [ ] pendiente |

> **Fix 2026-03-28:** `page.tsx` refactorizado a Server Component → `PagosForm.tsx` como Client Component. Resolvía error boundary al llamar `requireAdmin()` + `redirect()` desde `useEffect` sin manejo de errores.

### 3.3 Integración Transbank (Webpay Plus)

| # | Tarea | Estado |
|---|-------|--------|
| 3.3.1 | SDK `transbank-sdk@6.1.1` instalado | [x] 2026-03-28 |
| 3.3.2 | `createTransbankPayment()` — crea transacción, retorna redirect URL | [x] 2026-03-28 |
| 3.3.3 | Página intermediaria POST `/api/pagos/transbank/redirect` | [x] 2026-03-28 |
| 3.3.4 | Return handler `/api/pagos/transbank/return` (GET + POST) | [x] 2026-03-28 |
| 3.3.5 | Test en sandbox | [ ] pendiente (requiere credenciales) |

### 3.4 Integración Flow

| # | Tarea | Estado |
|---|-------|--------|
| 3.4.1 | Cliente HTTP con firma HMAC-SHA256 (sin SDK oficial) | [x] 2026-03-28 |
| 3.4.2 | `createFlowPayment()` — crea orden, retorna URL de pago | [x] 2026-03-28 |
| 3.4.3 | Webhook server-to-server `/api/pagos/flow/webhook` (idempotente) | [x] 2026-03-28 |
| 3.4.4 | Return handler `/api/pagos/flow/return` (idempotente) | [x] 2026-03-28 |
| 3.4.5 | Test en sandbox | [ ] pendiente (requiere credenciales) |

### 3.5 Integración MercadoPago

| # | Tarea | Estado |
|---|-------|--------|
| 3.5.1 | SDK `mercadopago@2.12.0` instalado | [x] 2026-03-28 |
| 3.5.2 | `createMercadoPagoPayment()` — crea preference, retorna init_point | [x] 2026-03-28 |
| 3.5.3 | Webhook IPN `/api/pagos/mercadopago/webhook` con verificación x-signature | [x] 2026-03-28 |
| 3.5.4 | Return handler `/api/pagos/mercadopago/return` | [x] 2026-03-28 |
| 3.5.5 | Test en sandbox | [ ] pendiente (requiere credenciales) |

### 3.6 Checkout actualizado

| # | Tarea | Estado |
|---|-------|--------|
| 3.6.1 | Selección de gateway en `CheckoutForm.tsx` | [x] 2026-03-28 |
| 3.6.2 | Flujo: curso gratuito (inscripción directa) | [x] 2026-03-28 |
| 3.6.3 | Flujo: cupón 100% → inscripción directa | [x] 2026-03-28 |
| 3.6.4 | Flujo: curso de pago → redirige a gateway → confirma | [x] 2026-03-28 |
| 3.6.5 | Páginas resultado: exitoso, rechazado, cancelado, pendiente, error | [x] 2026-03-28 |
| 3.6.6 | Emails de confirmación de compra | [ ] pendiente |

---

## FASE 4 — Funcionalidades avanzadas de admin ⬜ PENDIENTE

### 4.1 Reportes

| # | Tarea | Estado |
|---|-------|--------|
| 4.1.1 | Reporte de ingresos por período (filtros por gateway) | [ ] |
| 4.1.2 | Reporte de matrículas por curso | [ ] |
| 4.1.3 | Estadísticas de progreso por estudiante | [ ] |
| 4.1.4 | Exportar a CSV/Excel | [ ] |

### 4.2 Gestión avanzada de alumnos

| # | Tarea | Estado |
|---|-------|--------|
| 4.2.1 | Vista de detalle del alumno con historial de cursos y pagos | [ ] |
| 4.2.2 | Inscripción manual masiva (CSV upload) | [ ] |
| 4.2.3 | Envío de emails masivos (por curso, por estado) | [ ] |

### 4.3 Configuración de cursos avanzada

| # | Tarea | Estado |
|---|-------|--------|
| 4.3.1 | Fecha de inicio/fin de acceso al curso | [ ] |
| 4.3.2 | Prerequisitos entre cursos | [ ] |
| 4.3.3 | Cursos con lista de espera | [ ] |

---

## FASE 5 — Seguridad y hardening ⚠️ PARCIAL

| # | Tarea | Estado |
|---|-------|--------|
| 5.1 | Password reset flow (email → link → nueva contraseña) | [x] 2026-03-28 — `/olvide-mi-contrasena`, `/restablecer-contrasena`, `/auth/callback` |
| 5.2 | Rate limiting en API routes públicas | [ ] pendiente |
| 5.3 | Session timeout configurable | [ ] pendiente |
| 5.4 | Audit log de acciones admin | [ ] pendiente |
| 5.5 | Verificación de firma en webhooks de pasarelas | [x] 2026-03-28 — MercadoPago x-signature + Flow HMAC |
| 5.6 | Scan de dependencias (`npm audit`) | [ ] pendiente |
| 5.7 | Cifrado de credenciales de pago en BD | [ ] pendiente (ver 3.1.3) |

---

## FASE 6 — Multi-OTEC y deploy ⬜ PENDIENTE

| # | Tarea | Estado |
|---|-------|--------|
| 6.1 | Definir estrategia multi-tenant (instancias separadas vs schema por tenant) | [ ] |
| 6.2 | Variables de entorno por OTEC | [ ] |
| 6.3 | Script de bootstrap para nueva OTEC | [ ] |
| 6.4 | Pipeline CI/CD por tenant | [ ] |
| 6.5 | Migración dominio cyc.luam.cl → capacitarycrecer.cl | [ ] |
| 6.6 | Tests E2E con Playwright para flujos críticos | [ ] |
| 6.7 | Lighthouse 90+ en todas las páginas públicas | [ ] |

---

## Estado actual — resumen ejecutivo (2026-03-29, auditado)

| Área | Estado | Notas |
|------|--------|-------|
| Build TypeScript | ✅ Sin errores | Verificado local y VPS Docker |
| Deploy VPS | ✅ Activo | `cyc.luam.cl` — Hetzner `204.168.156.157:3002`, Docker |
| Auth básica (login, registro) | ✅ Funcional | Supabase Auth |
| Auth avanzada (reset password) | ✅ Funcional | `/olvide-mi-contrasena` → email → `/restablecer-contrasena` |
| Admin panel — CRUD cursos | ✅ Funcional | Cursos, módulos, lecciones, quizzes, archivos adjuntos |
| Admin panel — usuarios | ✅ Funcional | Paginación, búsqueda, editar, enviar email (Resend) |
| Admin panel — cupones | ✅ Funcional | Crear/editar/toggle activo |
| Admin panel — categorías | ✅ Funcional | CRUD con imágenes |
| Aula virtual | ✅ Funcional | Video, texto, quiz, progreso por lección |
| Quizzes (múltiple, V/F, abierta) | ✅ Funcional | Con imágenes adjuntas |
| Certificados — generación PDF | ✅ Funcional | pdf-lib + fontkit TTF, QR con validación, variables, negrita |
| Certificados — editor visual | ✅ Funcional | Drag & drop, pantalla completa, dos sidebars, snap, resize QR/texto |
| Certificados — gestión plantillas | ✅ Funcional | CRUD, global/por curso, duplicar, preview tiempo real |
| Checkout — cursos gratuitos | ✅ Funcional | Inscripción directa |
| Checkout — cupones 100% | ✅ Funcional | Inscripción directa sin pago |
| Checkout — pasarelas de pago | ✅ Implementado | Transbank, Flow, MercadoPago — pendiente test con credenciales reales |
| CMS — configuración OTEC | ✅ Funcional | Identidad, colores, contacto, RRSS, SEO desde `/admin/config` |
| CMS — landing conectada a BD | ✅ Funcional | Hero, Stats, Clientes, Navbar, Footer dinámicos |
| CMS — páginas dinámicas | ✅ Funcional | `/admin/paginas` + ruta pública `/[slug]` |
| Validación pública certificados | ✅ Funcional | `/validar-certificado/[id]` |
| Biblioteca de medios (UI) | ❌ Pendiente | Tabla BD existe (`media_library`), falta `/admin/medios` |
| Emails transaccionales en pagos | ❌ Pendiente | Resend instalado, falta email de confirmación de compra |
| Histórico transacciones admin | ❌ Pendiente | Tabla `pagos` existe, falta UI en `/admin/pagos` |
| Configuración de registro (on/off) | ❌ Pendiente | `app_config` soporta, falta UI toggle |
| Reportes de ingresos / matrículas | ❌ Pendiente | FASE 4 |
| Cifrado credenciales de pago | ⚠️ Pendiente | API keys en texto plano en BD — riesgo antes de producción |
| Rate limiting | ❌ Pendiente | FASE 5 |
| Tests E2E automatizados | ❌ Pendiente | FASE 6 |

### Deuda técnica identificada (audit 2026-03-29)

| Item | Detalle | Prioridad |
|------|---------|-----------|
| Tablas sin migración | `categorias`, `cupones`, `pagos`, `payment_configs`, `admin_users`, `lecciones_completadas`, `matriculas_cupones`, `imagenes_cursos`, `imagenes_preguntas` existen en producción pero sin archivo de migración en el repo | Media |
| `archivos_lecciones` duplicada | El código usa tanto `lecciones_archivos` como `archivos_lecciones` indistintamente — la tabla real es `lecciones_archivos` | Baja |
| `menu_items` | Referenciada en WBS (2.1.5) pero nunca implementada ni usada | Baja (eliminar del backlog) |

---

## Flujo completo del alumno — estado actual

```
Registro (/registro)           ✅
  ↓
Login (/login)                 ✅  — con "¿Olvidaste tu contraseña?"
  ↓
Reset contraseña               ✅  — email → /auth/callback → /restablecer-contrasena
  ↓
Catálogo cursos (/cursos)      ✅
  ↓
Checkout (/checkout/[id])      ✅
  ├── Curso gratuito           ✅  — inscripción directa
  ├── Cupón 100%               ✅  — inscripción directa
  ├── Transbank                ✅  — implementado, sin credenciales de prod
  ├── Flow                     ✅  — implementado, sin credenciales de prod
  └── MercadoPago              ✅  — implementado, sin credenciales de prod
  ↓
Aula virtual                   ✅
  ↓
Quizzes                        ✅
  ↓
Certificado + QR               ✅
  ↓
Validación pública             ✅  — /validar-certificado/[id]
```

---

## Próximas acciones recomendadas (por prioridad)

1. **Test flujo completo** — registro → cupón 100% → aula → certificado (sin necesidad de credenciales de pago)
2. **Credenciales de pago** — obtener sandbox keys de Transbank / Flow / MercadoPago y probar end-to-end
3. **Emails transaccionales** — confirmación de inscripción y de pago (Resend ya instalado, falta implementar en pagos)
4. **Biblioteca de medios** — `/admin/medios` para gestión de imágenes (subir, listar, eliminar)
5. **Cifrado de credenciales** — no dejar API keys en texto plano en BD antes de uso en producción real
6. **Rate limiting** — en `/api/auth/signup`, `/api/pagos/*` antes de abrir registro público masivo
7. **Logotipos de pasarelas** — reemplazar icono genérico CreditCard por SVGs oficiales en checkout
8. **Configuración de registro** — habilitar/deshabilitar registro público desde `/admin/config` (2.2.4)
9. **Histórico de transacciones** — vista en `/admin/pagos` con filtros por gateway y estado (3.2.5)
