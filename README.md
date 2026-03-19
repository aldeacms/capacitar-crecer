# 📚 Capacitar y Crecer - LMS Enterprise Seguro

**Capacitar y Crecer** es un **Learning Management System (LMS)** enterprise-grade diseñado específicamente para instituciones educativas y OTECs en Chile.

> **Estado:** 🟢 **Phase 5A Completada** | Seguridad implementada | Listo para producción
> **Última actualización:** 19 de Marzo, 2026

## ✨ Características Principales

✅ **4 Modelos de Negocio** - Soporta gratis, pago, freemium y cotización
✅ **Aula Virtual Completa** - Video, texto, quizzes, progreso en tiempo real
✅ **Gestión de Usuarios** - Crear, editar, eliminar, enrolar desde admin
✅ **Sistema de Cupones** - Descuentos dinámicos con límites de uso
✅ **Email Integrado** - Resend para envío de bienvenida y comunicaciones
✅ **Certificados** - Generación automática al completar cursos
✅ **Admin Panel** - Dashboard completo para gestión de cursos y usuarios
✅ **Responsive Design** - Mobile-first, WCAG accessibility

## 🚀 Quick Start

### Requisitos
- Node.js 20+
- npm o pnpm
- Cuenta Supabase (gratuita)

### Instalación

```bash
# Clonar repositorio
git clone https://github.com/tu-org/capacitar-crecer.git
cd "Capacitar y Crecer"

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales de Supabase y Resend
```

### Variables de Entorno Necesarias

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Resend (Email)
RESEND_API_KEY=re_xxxxx
RESEND_FROM_EMAIL=no-reply@tu-dominio.com
```

### Ejecutar Desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

### Build para Producción

```bash
npm run build
npm start
```

## 📁 Estructura del Proyecto

```
src/
├── app/                      # Next.js App Router
│   ├── (public)/            # Rutas públicas
│   ├── (private)/           # Rutas privadas (alumnos)
│   ├── admin/               # Panel de administración
│   └── api/                 # Rutas API
├── actions/                 # Server Actions (lógica backend)
├── components/              # React Components
│   ├── admin/              # Componentes del admin
│   ├── ui/                 # Componentes reutilizables
│   └── ...
├── lib/                     # Utilidades y helpers
│   ├── supabase-server.ts  # Cliente Supabase servidor
│   ├── supabase-admin.ts   # Cliente admin (service role)
│   └── resend.ts           # Cliente Resend
├── middleware.ts            # Middleware de autenticación
└── types/                   # TypeScript types
```

## 🔐 Autenticación

El sistema usa **Supabase Auth** con sesiones basadas en cookies:

- **Registro:** `/registro` - Crea usuario en auth + perfil automático
- **Login:** `/login` - Email/Password
- **Logout:** Session cookie se limpia automáticamente
- **Rutas privadas:** Protegidas por middleware en `src/middleware.ts`

## 📚 Funcionalidades Principales

### Para Alumnos
- ✅ Ver catálogo de cursos públicos
- ✅ Inscribirse a cursos gratis
- ✅ Dashboard personal con cursos inscritos
- ✅ Aula virtual con video, texto, quizzes
- ✅ Marcar lecciones como completadas
- ✅ Descargar certificados
- ✅ Seguimiento de progreso en tiempo real

### Para Administradores
- ✅ CRUD completo de cursos
- ✅ Editor de módulos y lecciones (Drag & Drop)
- ✅ Upload de archivos (videos, PDFs, imágenes)
- ✅ Sistema de quizzes con editor visual
- ✅ Gestión de cupones (crear, activar, desactivar)
- ✅ Gestión de usuarios (crear, editar, eliminar, enrolar)
- ✅ Enviar emails directo a usuarios
- ✅ Ver inscripciones y progreso de alumnos

## 🔧 Stack Tecnológico

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 16, React 19, TypeScript |
| **Styling** | Tailwind CSS, Lucide Icons |
| **Backend** | Supabase (PostgreSQL), Server Actions |
| **Auth** | Supabase Auth, @supabase/ssr |
| **Email** | Resend API |
| **Upload** | Supabase Storage |
| **State** | React Server Components |
| **Rich Text** | TipTap Editor |
| **UI Components** | Sonner (Toasts), @dnd-kit (Drag & Drop) |

## 📊 Modelos de Acceso

El sistema soporta 5 tipos de cursos:

| Tipo | Inscripción | Acceso | Certificado |
|------|-------------|--------|------------|
| **Gratis** | Automática | Inmediato | Gratis |
| **Gratis + Cert Pago** | Automática | Inmediato | Pago ($) |
| **De Pago** | Requiere cupón | Post-pago | Incluido |
| **Pago Inmediato** | Requiere cupón | Inmediato | Incluido |
| **Cotizar** | Formulario | Manual | Manual |

## 🗄️ Base de Datos

PostgreSQL en Supabase con tablas para:
- `perfiles` - Datos del usuario
- `cursos` - Definición de cursos
- `matriculas` - Inscripciones
- `modulos` - Estructura del curso
- `lecciones` - Contenido individual
- `quizzes_preguntas` - Evaluaciones
- `cupones` - Sistema de descuentos

Ver `proyecto.md` para esquema completo.

## 🔒 Seguridad (Phase 5A Implementada)

### **Autenticación & Autorización**
- ✅ `requireAuth()` - Protege rutas privadas (/dashboard)
- ✅ `requireAdmin()` - Protege panel admin (/admin)
- ✅ Admin users en tabla separada (no rol field)
- ✅ Supabase Auth con sesiones HttpOnly
- ✅ Middleware verifica autenticación en cada request

### **Validación de Inputs**
- ✅ Zod schemas en TODAS las server actions
- ✅ Validación de tipos con TypeScript
- ✅ Validación de UUIDs en parámetros
- ✅ Mensajes de error claros en español
- ✅ Protección contra inyección SQL

### **Base de Datos**
- ✅ Tabla `admin_users` separada para administradores
- ✅ Row Level Security (RLS) en 5 tablas críticas
- ✅ Políticas RLS personalizadas (usuarios ven solo sus datos)
- ✅ 10+ índices de optimización
- ✅ Vista `v_user_sync_status` para monitoreo

### **Manejo de Errores**
- ✅ Error boundaries en 5 rutas críticas
- ✅ Errores capturados sin romper la UI
- ✅ No expone información sensible
- ✅ Botón "Reintentar" automático

### **Conformidad**
- ✅ OWASP Top 10 cubierto
- ✅ Service Role Key para operaciones administrativas
- ✅ CORS habilitado correctamente
- ✅ Protección CSRF en forms
- ✅ Input sanitization en todos los campos

## 📧 Email

Integración con **Resend**:
- Email de bienvenida automático al crear usuario
- Envío de emails directo desde admin panel
- Plantillas HTML profesionales
- Manejo de errores controlado

```typescript
// Enviar email
await enviarEmail({
  to: 'usuario@ejemplo.com',
  subject: 'Bienvenido',
  html: '<h1>¡Hola!</h1>'
})
```

## 📦 Límites de Carga

- **Máximo por operación:** 50 MB
- **Validación cliente:** Real-time feedback
- **Validación servidor:** Rechazo controlado sin crashes

## 🚀 Despliegue

### En Vercel (Recomendado)

```bash
# 1. Conectar repositorio a Vercel
# 2. Configurar variables de entorno en Vercel dashboard
# 3. Push a main dispara auto-deploy
```

### Self-hosted

```bash
npm run build
NODE_ENV=production npm start
```

## 📖 Documentación

- **[RESUMEN_FASE_5A_COMPLETADA.md](RESUMEN_FASE_5A_COMPLETADA.md)** - Estado actual del proyecto
- **[DATABASE_SCHEMA.md](DATABASE_SCHEMA.md)** - Esquema completo de base de datos
- **[ER_DIAGRAM.md](ER_DIAGRAM.md)** - Diagrama entidad-relación
- **[SENIOR-STANDARDS.md](SENIOR-STANDARDS.md)** - Estándares de desarrollo y arquitectura

## 🤝 Contribuir

1. Fork el repositorio
2. Crea rama: `git checkout -b feature/mi-feature`
3. Commit cambios: `git commit -m 'Agregar feature'`
4. Push a rama: `git push origin feature/mi-feature`
5. Abre Pull Request

## 📧 Soporte

Para reportar bugs o sugerir features, abre un issue en GitHub.

## 📄 Licencia

Todos los derechos reservados © 2026 Capacitar y Crecer

---

**Versión:** 1.0.0 (Phase 5A - Seguridad Completada)
**Status:** 🟢 Producción Lista
**Última actualización:** 19 de Marzo, 2026 - 19:45
**Mantainer:** Daniel & Claude Code
