# 📋 Roadmap de Desarrollo - Capacitar y Crecer LMS

**Última actualización:** 19 de Marzo, 2026
**Estado general:** MVP Funcional - 4/9 Fases completadas

---

## ✅ Fases Completadas

### ✅ **Fase 1: Autenticación y Onboarding**
- [x] Registro e Inicio de Sesión
- [x] Protección de rutas privadas
- [x] Gestión de usuarios desde admin

### ✅ **Fase 2: Catálogo y LMS Core**
- [x] Listado de cursos dinámico
- [x] Aula virtual con video, contenido, quizzes
- [x] Drag & Drop para reordenar curriculum
- [x] Seguimiento de progreso
- [x] Sistema de cupones y descuentos

### ✅ **Fase 3: Admin Panel**
- [x] CRUD completo de cursos
- [x] Editor de módulos y lecciones
- [x] Gestión de usuarios (crear, editar, eliminar, cambiar contraseña)
- [x] Envío de emails con Resend
- [x] Validación de carga de archivos (50MB)

### ✅ **Fase 4: Certificación** (COMPLETADA - 19/03/2026)
- [x] Generación de certificados PDF con pdf-lib
- [x] Imagen de fondo personalizada (Supabase Storage)
- [x] Fuentes TTF embebidas (Montserrat)
- [x] Datos dinámicos del alumno (nombre, RUT, curso, fechas)
- [x] QR code para validación
- [x] Idempotencia (mismo certificado si descargas 2 veces)
- [x] Página de validación pública (`/validar-certificado/[id]`)
- [x] RLS policies para lectura pública

---

## ⏳ Fases Pendientes

### **Fase 5A: Blindaje de Infraestructura** (CRÍTICO - Próximo)
**Prioridad:** 🔴 **ALTA**
**Estimado:** 2-3 sprints
**Propósito:** Reducir bugs y vulnerabilidades en producción

#### Server Actions
- [ ] Auditoría de todas las server actions con **Zod validation**
  - [ ] `certificados.ts` - validar inputs
  - [ ] `usuarios.ts` - validar IDs y cambios
  - [ ] `curriculum.ts` - validar tipos de contenido
  - [ ] `cursos.ts` - validar campos
  - [ ] `cupones.ts` - validar códigos
- [ ] Manejo de errores global con try/catch
- [ ] Logging descriptivo en todas las funciones

#### RLS (Row Level Security)
- [ ] Revisión de todas las políticas en Supabase
- [ ] Verificar que solo admins pueden crear/editar cursos
- [ ] Verificar que alumnos solo ven sus inscripciones
- [ ] Verificar certificados lectura pública pero escritura admin-only

#### Error Handling
- [ ] Crear `error.tsx` en rutas críticas (/admin, /dashboard, /checkout)
- [ ] Manejo global de errores de Supabase
- [ ] Fallback pages elegantes (no error genérico)

#### Performance
- [ ] Optimizar queries (select específicos, no `SELECT *`)
- [ ] Implementar caching en cursos frecuentes
- [ ] Index en tablas grandes (matriculas, certificate_downloads)

---

### **Fase 5B: UX/UI Pro** (Mejora de experiencia)
**Prioridad:** 🟠 **MEDIA**
**Estimado:** 2-3 sprints

#### Dashboard Admin
- [ ] Métricas reales (usuarios activos, ingresos, cursos, etc.)
- [ ] Gráficos (Chart.js o Recharts)
- [ ] Filtros temporales (hoy, esta semana, este mes, este año)

#### Optimización Visual
- [ ] Reemplazar spinners con skeletons elegantes
- [ ] Usar `next/image` para todas las imágenes
- [ ] Sistema de Diseño unificado (colors, spacing, typography)
- [ ] Animaciones sutiles en transiciones

#### Admin de Certificados (Nuevo)
- [ ] Panel para subir imagen de fondo personalizada
- [ ] Drag & drop para reposicionar elementos de texto
- [ ] Selector de orientación (vertical/horizontal)
- [ ] Preview en tiempo real
- [ ] Soporte para múltiples templates (un por curso)

---

### **Fase 6: Conversión y SEO** (Marketing)
**Prioridad:** 🟠 **MEDIA**
**Estimado:** 1-2 sprints

#### Landing Page
- [ ] Refactorizar hero section (más impacto visual)
- [ ] Testimonios de alumnos
- [ ] Stats (cursos, alumnos, certificados emitidos)
- [ ] CTA mejorados

#### Curso Landing Pages
- [ ] Mejoras en diseño visual
- [ ] Filtros dinámicos (sin page reload)
- [ ] Búsqueda full-text en cursos
- [ ] Ordenamiento (relevancia, nuevo, precio)

#### SEO
- [ ] Meta tags dinámicos para cada curso
- [ ] Open Graph (preview en redes sociales)
- [ ] Sitemap dinámico
- [ ] Robots.txt y meta robots

---

### **Fase 7: Pagos (INGRESOS)** 🔴 **CRÍTICO**
**Prioridad:** 🔴 **ALTA**
**Estimado:** 3-4 sprints
**Propósito:** Monetizar la plataforma

#### Transbank Webpay Plus
- [ ] Implementar SDK de Transbank
- [ ] Crear flujo de checkout
- [ ] Manejo de respuestas (aprobado, rechazado, pendiente)
- [ ] Webhooks para confirmación de pago
- [ ] Estados de matrícula (pagado, pendiente, rechazado)

#### Flow (Alternativa)
- [ ] Integración con API de Flow
- [ ] Flujo de checkout Flow
- [ ] Sincronización de estados

#### Estados de Pago
- [ ] Crear tabla `pagos` con estados
- [ ] Actualizar `matriculas` con `estado_pago`
- [ ] Bloquear acceso si no está pagado
- [ ] Enviar emails de confirmación

#### Seguridad
- [ ] PCI DSS compliance (no guardar tarjetas)
- [ ] Encriptación de datos sensibles
- [ ] Auditoría de transacciones

---

### **Fase 8: Features Avanzadas** (Escalabilidad)
**Prioridad:** 🟡 **BAJA**
**Estimado:** 4+ sprints

#### Lecciones en Vivo (WebRTC)
- [ ] Integración Jitsi o Daily.co
- [ ] Programación de clases
- [ ] Sala de espera
- [ ] Grabación automática

#### Foros de Discusión
- [ ] Tabla `foros_temas` y `foros_posts`
- [ ] CRUD completo
- [ ] Notificaciones a participantes
- [ ] Moderación (marca como resuelto, etc.)

#### Gamificación
- [ ] Sistema de badges
- [ ] Puntos por actividades
- [ ] Leaderboard global/por curso
- [ ] Recompensas (descuentos, certificados especiales)

#### Sistema de Referidos
- [ ] Tabla `referidos` con tracking
- [ ] Links únicos por usuario
- [ ] Comisiones automáticas
- [ ] Dashboard de referidos

#### Mobile App (Nativa)
- [ ] React Native o Flutter
- [ ] Acceso offline a lecciones descargadas
- [ ] Notificaciones push
- [ ] Sincronización con servidor

---

## 🎯 Propuesta de Orden de Ejecución

### **Sprint Próximo (Recomendado)**
1. **Fase 5A: Blindaje** (reduce riesgos)
2. Luego **Fase 7: Pagos** (genera ingresos)
3. **Fase 5B: UX/UI** (mejora experiencia)
4. **Admin de Certificados** (permite diseños por curso)

### **Razones**
- ✅ Fase 5A primero = sistema estable antes de monetizar
- ✅ Fase 7 después = ingresos para financiar el resto
- ✅ Admin de Cert = feature rápida que agrega valor visual

---

## 📊 Cobertura Actual

| Feature | Status | Nota |
|---------|--------|------|
| Cursos | ✅ | CRUD completo |
| Alumnos | ✅ | Matricula, progreso |
| Certificados | ✅ | PDF con QR, validación |
| Cupones | ✅ | Descuentos 0-100% |
| Quizzes | ✅ | Opción múltiple, verdadero/falso |
| Archivos | ✅ | Upload con validación 50MB |
| Emails | ✅ | Resend integrado |
| **Pagos** | ❌ | **BLOQUEADOR** - solo TEST100 funciona |
| **RLS** | ⚠️ | Revisar en Fase 5A |
| **Admin Panel** | ⚠️ | Básico, sin métricas |

---

## 🔗 Referencias

- **Documento Principal:** `proyecto.md`
- **Estándares:** `SENIOR-STANDARDS.md`
- **Setup:** `SETUP_CERTIFICADOS.md`

---

**Mantenedor:** Daniel
**Versión:** 1.0.0 (MVP - Production Ready, 4/9 Fases)
