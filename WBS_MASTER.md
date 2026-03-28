# WBS MASTER — Capacitar y Crecer
**Versión:** 3.0
**Fecha actualización:** 2026-03-28
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

11 archivos actualizados. Build limpio, 0 errores TypeScript.

---

## FASE 1 — Consolidación de funcionalidad existente ⚠️ PARCIAL

### 1.1 Gestión de usuarios

| # | Tarea | Estado |
|---|-------|--------|
| 1.1.1 | Paginación en lista de alumnos | [ ] pendiente |
| 1.1.2 | Editar email de usuario | [x] 2026-03-28 |
| 1.1.3 | Envío de email a usuario individual (Resend) | [ ] pendiente |
| 1.1.4 | Búsqueda server-side en alumnos | [ ] pendiente |

### 1.2 Checkout

| # | Tarea | Estado |
|---|-------|--------|
| 1.2.1 | Cupón no obligatorio + flujo pendiente de pago | [x] 2026-03-28 |
| 1.2.2 | Tabla `pagos` en BD | [x] 2026-03-28 (implementada en FASE 3) |

### 1.3 Dashboard admin — métricas

| # | Tarea | Estado |
|---|-------|--------|
| 1.3.1 | Auditar `getDashboardMetrics()` — números reales | [ ] pendiente |
| 1.3.2 | Gráfico matrículas últimos 30 días | [ ] pendiente |
| 1.3.3 | Top cursos por inscripciones (fix query) | [x] 2026-03-28 |

### 1.4 Verificación end-to-end

| # | Tarea | Estado |
|---|-------|--------|
| 1.4.1 | Test: registro → curso gratuito → aula → quiz → certificado | [ ] pendiente |
| 1.4.2 | Test: admin crea/edita/cambia rol/elimina usuario | [ ] pendiente |
| 1.4.3 | Test: cupón 100% → inscripción directa | [ ] pendiente |
| 1.4.4 | `npm run build` limpio | [ ] pendiente (verificar) |

---

## FASE 2 — Sistema de Configuración y CMS ✅ COMPLETADA (parcial)

### 2.1 Base de datos

| # | Tarea | Estado |
|---|-------|--------|
| 2.1.1 | Tabla `app_config` | [x] 2026-03-28 |
| 2.1.2 | Tabla `paginas` | [x] 2026-03-28 |
| 2.1.3 | Tabla `secciones_landing` | [x] 2026-03-28 |
| 2.1.4 | Tabla `media_library` | [x] 2026-03-28 |
| 2.1.5 | Tabla `menu_items` | [ ] pendiente |
| 2.1.6 | RLS policies para todas las tablas CMS | [x] 2026-03-28 |

### 2.2 Admin — Configuración General (`/admin/config`)

| # | Tarea | Estado |
|---|-------|--------|
| 2.2.1 | Identidad OTEC (nombre, logo, colores) | [x] 2026-03-28 |
| 2.2.2 | Información de contacto y RRSS | [x] 2026-03-28 |
| 2.2.3 | Configuración SEO global (meta title, description, OG) | [x] 2026-03-28 |
| 2.2.4 | Configuración de registro (habilitado/deshabilitado) | [ ] pendiente |
| 2.2.5 | Configuración de certificados (logo, firma, datos legales) | [ ] pendiente |

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
| 2.5.1 | Ruta `/admin/medios` con upload a Supabase Storage | [ ] pendiente |
| 2.5.2 | Vista grid/lista de imágenes | [ ] pendiente |
| 2.5.3 | Selector de imagen reutilizable (modal) | [ ] pendiente |

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

## Estado actual — resumen ejecutivo (2026-03-28)

| Área | Estado | Notas |
|------|--------|-------|
| Build TypeScript | ✅ Sin errores | Verificar tras cambios recientes |
| Auth básica (login, registro) | ✅ Funcional | |
| Auth avanzada (reset password) | ✅ Funcional | `/olvide-mi-contrasena` + `/restablecer-contrasena` |
| Admin panel CRUD | ✅ Funcional | Cursos, lecciones, quizzes, alumnos, cupones, categorías |
| Aula virtual + quizzes | ✅ Funcional | |
| Certificados + QR | ✅ Funcional | |
| Checkout / cupones | ✅ Funcional | Cupón no obligatorio; flujo pendiente de pago |
| CMS — configuración OTEC | ✅ Funcional | `/admin/config` — identidad, contacto, RRSS, SEO, landing |
| CMS — páginas dinámicas | ✅ Funcional | `/admin/paginas` + ruta pública `/(public)/[slug]` |
| Frontend conectado a BD | ✅ Funcional | Hero, Stats, ClientLogos, Navbar, Footer desde `app_config` |
| Pasarela Transbank | ✅ Implementada | Pendiente test con credenciales reales |
| Pasarela Flow | ✅ Implementada | Pendiente test con credenciales reales |
| Pasarela MercadoPago | ✅ Implementada | Pendiente test con credenciales reales |
| Biblioteca de medios | ❌ Pendiente | No hay `/admin/medios` aún |
| Emails transaccionales | ❌ Pendiente | Resend instalado, no implementado en pagos |
| Reportes de ingresos | ❌ Pendiente | FASE 4 |
| Cifrado credenciales pago | ⚠️ Pendiente | Actualmente en texto plano en Supabase RLS |
| Rate limiting | ❌ Pendiente | FASE 5 |
| Tests automatizados | ❌ Pendiente | FASE 6 |

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

1. **Verificar build** — `npm run build` y asegurar 0 errores tras todos los cambios de esta sesión
2. **Test flujo completo** — registro → cupón 100% → aula → certificado (sin necesidad de credenciales de pago)
3. **Credenciales de pago** — obtener sandbox keys de Transbank / Flow / MercadoPago y probar
4. **Emails transaccionales** — confirmación de inscripción y de pago (Resend ya instalado)
5. **Biblioteca de medios** — `/admin/medios` para gestión de imágenes
6. **Cifrado de credenciales** — no dejar API keys en texto plano en BD antes de producción
7. **Rate limiting** — antes de abrir registro público masivo
