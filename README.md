# Capacitar y Crecer — LMS para OTECs

LMS enterprise diseñado para instituciones de capacitación (OTECs) en Chile. Gestión completa de cursos, alumnos, pagos y certificados.

**Producción:** https://cyc.luam.cl
**Stack:** Next.js 16 · Supabase · TypeScript · Tailwind CSS · Docker
**Última actualización:** 28 de Marzo, 2026

---

## Estado del proyecto

| Área | Estado |
|------|--------|
| Auth (login, registro, reset) | Funcional |
| Aula virtual + quizzes | Funcional |
| Certificados con QR | Funcional |
| CMS — configuración OTEC | Funcional |
| CMS — páginas dinámicas | Funcional |
| Pasarelas de pago (Transbank, Flow, MercadoPago) | Implementadas — pendiente test con credenciales |
| Admin panel completo | Funcional |
| Deploy Docker en VPS | Funcional |

Ver `WBS_MASTER.md` para el detalle completo de tareas y fases.

---

## Requisitos

- Node.js 20+
- Cuenta Supabase
- (Producción) Docker + Docker Compose

---

## Variables de entorno

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
RESEND_API_KEY=re_xxxxx
RESEND_FROM_EMAIL=no-reply@tu-dominio.com
```

---

## Desarrollo local

```bash
npm install
npm run dev
```

Abre http://localhost:3000

---

## Deploy en producción (Docker + VPS)

```bash
# En el VPS
cd /var/www/capacitar-y-crecer
git pull origin main
docker compose build --no-cache
docker compose up -d
```

El `docker-compose.yml` requiere un archivo `.env` en la misma carpeta con las variables de producción.

---

## Estructura del proyecto

```
src/
├── app/
│   ├── (public)/          # Rutas públicas (home, cursos, login, registro)
│   ├── (private)/         # Dashboard de alumnos
│   ├── admin/             # Panel de administración
│   ├── api/               # API routes (pagos, auth, perfiles)
│   └── checkout/          # Flujo de compra
├── actions/               # Server Actions
├── components/            # Componentes React
├── lib/
│   ├── gateways/          # Integraciones Transbank, Flow, MercadoPago
│   ├── certificados/      # Generación de PDFs y storage
│   ├── payment-constants.ts
│   └── auth.ts
└── middleware.ts
```

---

## Stack tecnológico

| Capa | Tecnología |
|------|------------|
| Frontend | Next.js 16, React 19, TypeScript |
| Estilos | Tailwind CSS, Lucide Icons |
| Backend | Supabase (PostgreSQL), Server Actions |
| Auth | Supabase Auth, @supabase/ssr |
| Email | Resend |
| Storage | Supabase Storage |
| Rich Text | TipTap |
| Pagos | Transbank SDK, Flow (HMAC), MercadoPago SDK |
| Deploy | Docker, Nginx |

---

## Modelos de acceso a cursos

| Tipo | Inscripción | Acceso | Certificado |
|------|-------------|--------|-------------|
| Gratis | Automática | Inmediato | Gratis |
| Gratis + Cert Pago | Automática | Inmediato | Pago |
| De pago (pasarela) | Requiere pago | Post-pago | Incluido |
| Cotización | Formulario | Manual | Manual |

---

## Seguridad

- `requireAuth()` y `requireAdmin()` en todas las rutas protegidas
- Tabla `admin_users` separada del campo `rol` en perfiles
- Row Level Security (RLS) en tablas sensibles
- Verificación de firma en webhooks (MercadoPago x-signature, Flow HMAC-SHA256)
- Server Actions con `SUPABASE_SERVICE_ROLE_KEY` (bypass RLS controlado)

---

## Documentacion

- `WBS_MASTER.md` — Roadmap y estado de todas las fases
- `SENIOR-STANDARDS.md` — Estándares de desarrollo del proyecto
- `DATABASE_SCHEMA.md` — Esquema completo de base de datos
- `ER_DIAGRAM.md` — Diagrama entidad-relación

---

Todos los derechos reservados © 2026 Capacitar y Crecer
