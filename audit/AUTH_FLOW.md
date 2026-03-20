# 🔐 AUTENTICACIÓN Y FLUJO DE AUTORIZACIÓN

**Fecha:** 2026-03-19
**Sistema:** Supabase Authentication + Custom Roles

---

## 📋 Tabla de Contenidos

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Componentes del Sistema](#componentes-del-sistema)
3. [Flujos Principales](#flujos-principales)
4. [Tabla de Roles y Permisos](#tabla-de-roles-y-permisos)
5. [Troubleshooting](#troubleshooting)

---

## Resumen Ejecutivo

**Sistema de Autenticación:** Supabase Auth (PostgreSQL basado)

| Componente | Descripción |
|-----------|-------------|
| **auth.users** | Usuarios del sistema (Supabase managed) |
| **perfiles** | Información de perfil (nombre, RUT, etc.) |
| **admin_users** | Tabla que define quiénes son administradores |
| **Helper Functions** | `requireAuth()`, `requireAdmin()`, `isUserAdmin()` |
| **Middleware** | `/src/middleware.ts` - Redirect de rutas protegidas |
| **Layouts** | `admin/layout.tsx`, `(private)/layout.tsx` - Protecciones por ruta |

---

## Componentes del Sistema

### 1. `src/lib/auth.ts` - Funciones Centralizadas

#### getAuthUser()
```typescript
export async function getAuthUser(): Promise<AuthUser | null>

// Descripción: Obtiene usuario actual sin redirigir
// Seguridad: Usa getUser() (✅ seguro) NO getSession()
// Retorna: { id, email } o null
// Uso: Verificar si existe sesión sin forzar login
```

#### requireAuth()
```typescript
export async function requireAuth(): Promise<AuthUser>

// Descripción: Obtiene usuario actual O redirige a login
// Seguridad: Usa getUser() (✅ seguro)
// Flujo:
//   1. Llama getAuthUser()
//   2. Si null → redirect('/login')
//   3. Si existe → retorna { id, email }
// Uso: En server actions que requieren usuario autenticado
// Redirige: /login (es el usuario quien se redirige en cliente)
```

#### isUserAdmin(userId)
```typescript
async function isUserAdmin(userId: string): Promise<boolean>

// Descripción: Verifica si usuario es admin
// Método 1 (Primario):
//   - Busca en tabla admin_users
//   - WHERE id=userId AND is_active=true
//   - Si existe → TRUE
// Método 2 (Fallback - Legacy):
//   - Si Método 1 falla o tabla no existe
//   - Busca en tabla perfiles
//   - WHERE id=userId AND rol='admin'
//   - Si existe → TRUE
// Propósito: Transición gradual del sistema de roles
```

#### requireAdmin()
```typescript
export async function requireAdmin(): Promise<AuthUser>

// Descripción: Obtiene usuario admin O redirige a login
// Flujo:
//   1. Llama requireAuth()  (verifica usuario existe)
//      → Si falla, redirige /login
//   2. Llama isUserAdmin(user.id)
//   3. Si is_admin=false → redirect('/login')
//   4. Si is_admin=true → retorna user
// Uso: En server actions solo para admin
// Seguridad: Double-check (sesión + BD)

// ⚠️ Nota: Redirige a /login para ambos casos (no auth y no admin)
// Esto es correcto - admin siempre requiere estar autenticado
```

---

### 2. `src/middleware.ts` - Protección de Rutas

**Propósito:** Middleware que actúa en CADA request

```typescript
// Configuración
const protectedRoutes = ['/admin', '/dashboard']
const publicRoutes = ['/login', '/registro', '/']

// Flujo en cada request:
// 1. Inicializar sesión Supabase
// 2. Refrescar token si expirado
// 3. Para rutas protegidas:
//    - Si NO hay usuario → redirect('/login')
//    - Si hay usuario → permite pasar
// 4. Retorna response modificado

// ✅ QUÉ HACE BIEN:
// - Redirige usuarios no autenticados de /admin y /dashboard
// - Mantiene sesión fresca (token refresh)
// - No bloquea rutas públicas

// ⚠️ LIMITACIONES:
// - NO verifica rol en middleware (correcto - sin acceso a BD perfiles)
// - Verificación de admin happens en layout/server action
// - Middleware solo cubre autenticación básica
```

**Nota Importante:** El middleware NO puede acceder a tabla `admin_users` porque tendría que hacer queries a BD en cada request, lo cual es ineficiente. Por eso:
- Middleware verifica: autenticado SI/NO
- Layout/Server Action verifica: admin SI/NO

---

### 3. Layout Protection

#### `src/app/admin/layout.tsx`
```typescript
export default async function AdminLayout({ children }) {
  const user = await requireAdmin()  // ← Verificación crítica

  // Si requireAdmin() throws:
  //   - Usuario no autenticado → redirect('/login')
  //   - Usuario auth pero no admin → redirect('/login')
  //   - Usuario admin → continúa

  return (
    <div className="flex">
      <AdminSidebar user={user} />
      {children}
    </div>
  )
}

// ✅ Protege TODA la ruta /admin/* automáticamente
// ✅ Sin necesidad de protección en cada /admin/xxx/page.tsx
```

#### `src/app/(private)/layout.tsx`
```typescript
export default async function PrivateLayout({ children }) {
  const user = await requireAuth()  // ← Verificación crítica

  // Si requireAuth() throws:
  //   - Usuario no autenticado → redirect('/login')
  //   - Usuario auth → continúa (alumno o admin)

  return (
    <div>
      <Navbar user={user} />
      {children}
    </div>
  )
}

// ✅ Protege TODA la ruta /dashboard/* automáticamente
// ✅ Solo requiere estar autenticado, no requiere admin
```

---

### 4. Tabla `admin_users`

**Propósito:** Single source of truth para roles de admin

```sql
CREATE TABLE admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by TEXT DEFAULT 'system'
)
```

**Registros Actuales:**
```
id: 7983c049-fa7b-42d9-bfba-41fbdfc57eb2
email: daniel@lifefocus.agency
is_active: true
created_at: 2026-03-19
```

**Flujo:**
1. Usuario crea cuenta en `/registro`
   - Se crea en `auth.users` (usuario=alumno)
   - Se crea en `perfiles` (rol=alumno)
   - NO se agrega a `admin_users`

2. Admin promueve usuario a admin
   - Admin navega a `/admin/alumnos`
   - Busca usuario y clickea "Promover a Admin"
   - Se inserta record en `admin_users`
   - Siguiente login: usuario es admin

3. Usuario intenta acceder a `/admin`
   - Middleware verifica: ¿tiene sesión? ✅ Sí
   - Layout verifica: ¿está en admin_users? ✅ Sí
   - ¿is_active=true? ✅ Sí
   - → Acceso concedido ✅

---

## Flujos Principales

### 🔄 Flujo 1: Registro de Nuevo Usuario

```
Usuario visita /registro
    ↓
Form → POST a server action `registrarUsuario`
    ↓
Validation: email, password, nombre_completo
    ↓
Create en auth.users via supabaseAuth.signUp()
    ↓
Create en perfiles con rol='alumno' ← IMPORTANTE
    ↓
✅ Usuario creado
    ↓
Redirige a /login o directamente autenticado
```

**Código (conceptual):**
```typescript
export async function registrarUsuario(formData: FormData) {
  const email = formData.get('email')
  const password = formData.get('password')
  const nombre = formData.get('nombre_completo')

  // 1. Create en auth
  const { error: authError, data: { user } } =
    await supabase.auth.signUp({ email, password })
  if (authError) return { error: authError.message }

  // 2. Create en perfiles
  const { error: perfilError } =
    await supabase.from('perfiles').insert({
      id: user.id,
      email,
      nombre_completo: nombre,
      rol: 'alumno'
    })
  if (perfilError) {
    // Rollback: Delete from auth
    await supabase.auth.admin.deleteUser(user.id)
    return { error: 'Error en creación de perfil' }
  }

  return { success: true }
}
```

---

### 🔄 Flujo 2: Login

```
Usuario visita /login
    ↓
Form → Submit email + password
    ↓
Supabase.auth.signInWithPassword()
    ↓
¿Credenciales válidas?
├─ ❌ NO → Error "Email o contraseña incorrectos"
└─ ✅ SÍ → Token y sesión creados

Redirige a /
    ↓
Middleware verifica sesión
    ↓
Si admin_users.is_active=true:
  → Navbar muestra "Panel Admin"
Si admin_users.is_active=false o no existe:
  → Navbar muestra solo opciones de alumno
```

**Login Component (conceptual):**
```typescript
export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()

  const handleLogin = async (e) => {
    e.preventDefault()

    const { error } =
      await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
    } else {
      router.push('/')
      router.refresh()
    }
  }

  return (
    <form onSubmit={handleLogin}>
      <input value={email} onChange={(e) => setEmail(e.target.value)} />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button>Iniciar Sesión</button>
    </form>
  )
}
```

---

### 🔄 Flujo 3: Admin Promueve Alumno

```
Admin navega a /admin/alumnos
    ↓
requireAdmin() en layout
    ↓
¿Es admin? ✅ SÍ
    ↓
Muestra lista de usuarios via getUsuarios()
    ↓
Admin busca usuario y clickea "Promover a Admin"
    ↓
Server action: promoteToAdmin(userId)
    ↓
INSERT en admin_users:
  id: userId
  email: user.email
  is_active: true
    ↓
✅ Usuario ahora es admin
    ↓
Next login: usuario verá /admin en navbar
```

**Function (conceptual):**
```typescript
export async function promoteToAdmin(userId: string) {
  await requireAdmin()  // Verifica caller es admin

  const { error } = await supabaseAdmin
    .from('admin_users')
    .insert({
      id: userId,
      email: userEmail,  // Obtener de perfiles
      is_active: true
    })

  if (error) {
    return { error: 'Error promoviendo usuario' }
  }

  revalidatePath('/admin/alumnos')
  return { success: true }
}
```

---

### 🔄 Flujo 4: Logout

```
Usuario clickea "Cerrar Sesión" en navbar
    ↓
Supabase.auth.signOut()
    ↓
Token eliminado
Sesión limpiada
    ↓
Redirige a /
    ↓
Middleware verifica: NO hay sesión
    ↓
Navbar muestra "Iniciar Sesión" en lugar de username
```

---

### 🔄 Flujo 5: Acceso Denegado a /admin

```
Usuario alumno intenta acceder a /admin
    ↓
Middleware: ¿hay sesión? ✅ Sí (alumno autenticado)
    ↓
Permite pasar a layout
    ↓
admin/layout.tsx llamá requireAdmin()
    ↓
requireAuth() → ✅ Usuario existe
    ↓
isUserAdmin(userId)
    ↓
Busca en admin_users → NO existe
    ↓
Fallback: Busca en perfiles.rol → rol='alumno'
    ↓
isUserAdmin() retorna FALSE
    ↓
requireAdmin() → redirect('/login')
    ↓
❌ Acceso denegado
    ↓
Usuario ve página login
```

---

## Tabla de Roles y Permisos

### Matriz de Acceso

| Ruta | Alumno | Admin | Público |
|------|--------|-------|---------|
| `/` | ✅ | ✅ | ✅ |
| `/login` | ✅ | ✅ | ✅ |
| `/registro` | ✅ | ✅ | ✅ |
| `/cursos` | ✅ | ✅ | ✅ |
| `/cursos/[slug]` | ✅ | ✅ | ✅ |
| `/dashboard` | ✅ | ✅ | ❌ |
| `/dashboard/cursos/[slug]` | ✅ | ✅ | ❌ |
| `/admin` | ❌ | ✅ | ❌ |
| `/admin/alumnos` | ❌ | ✅ | ❌ |
| `/admin/cursos` | ❌ | ✅ | ❌ |
| `/admin/categorias` | ❌ | ✅ | ❌ |
| `/admin/cupones` | ❌ | ✅ | ❌ |

### Permisos en Server Actions

| Acción | Alumno | Admin | Público |
|--------|--------|-------|---------|
| `generarCertificado()` | ✅ | ✅ | ❌ |
| `marcarLeccionCompletada()` | ✅ | ✅ | ❌ |
| `inscribirEnCurso()` | ✅ | ✅ | ❌ |
| `getUsuarios()` | ❌ | ✅ | ❌ |
| `crearUsuario()` | ❌ | ✅ | ❌ |
| `cambiarPassword()` | ❌ | ✅ | ❌ |
| `createCourse()` | ❌ | ✅ | ❌ |
| `validarCupon()` | ✅ | ✅ | ✅ |
| `validarCertificado()` | ✅ | ✅ | ✅ |

---

## Seguridad

### ✅ Implementado

- [x] Autenticación via Supabase Auth
- [x] Tokens JWT con refresh automático
- [x] Verificación en servidor (no confiar en JWT del cliente)
- [x] Double-check de admin (sesión + BD)
- [x] Logout limpia sesión
- [x] Middleware protege rutas
- [x] Redirección segura (servidor, no cliente)
- [x] Roles únicos en BD (single source of truth)

### ⚠️ Por Verificar

- [ ] Password reset flow
- [ ] 2FA/MFA implementation
- [ ] Session timeout
- [ ] IP-based restrictions
- [ ] Audit logging de cambios de rol
- [ ] Rate limiting en login

### 🚨 Cuidados Especiales

```typescript
// ❌ NUNCA HACER: Confiar en token JWT del cliente
if (decodedToken.role === 'admin') { ... }

// ✅ HACER: Verificar en servidor
const isAdmin = await isUserAdmin(user.id)

// ❌ NUNCA HACER: getSession() en server actions
const { data: { session } } = await supabase.auth.getSession()

// ✅ HACER: getUser() en server actions
const { data: { user } } = await supabase.auth.getUser()

// ❌ NUNCA HACER: Pasar userId como parámetro sin validar
deleteUser(userId) // ¿De dónde viene userId?

// ✅ HACER: Obtener del usuario autenticado
const user = await requireAdmin()
deleteUser(user.id) // Validado
```

---

## Troubleshooting

### Problema 1: Usuario no ve botón "Panel Admin"

**Síntomas:**
- Usuario autenticado pero no ve "Panel Admin" en navbar
- Acceso a /admin redirige a /login

**Diagnóstico:**
```typescript
// Verificar usuario en BD
const { data } = await supabase.auth.admin.listUsers()
// ¿Email aparece en lista?

// Verificar perfil existe
const { data: perfil } = await supabase
  .from('perfiles')
  .select('*')
  .eq('email', userEmail)
  .single()
// ¿Existe?

// Verificar admin_users
const { data: admin } = await supabase
  .from('admin_users')
  .select('*')
  .eq('id', userId)
  .single()
// ¿Existe y is_active=true?
```

**Solución:**
```sql
-- Si perfil falta:
INSERT INTO perfiles (id, nombre_completo, email, rol)
VALUES (uuid, 'Name', 'email@example.com', 'admin');

-- Si admin_users falta:
INSERT INTO admin_users (id, email, is_active)
VALUES (uuid, 'email@example.com', true);
```

---

### Problema 2: Middleware redirige todos a /login

**Síntomas:**
- Todos los usuarios ven /login
- Incluso no autenticados redirigen

**Diagnóstico:**
```typescript
// Middleware puede estar redirigiendo mal
// Verificar: middleware.ts
//   - ¿Rutas públicas están en whitelist?
//   - ¿getSession() falla?
```

**Solución:**
```typescript
// Asegurar que /login y /registro están en public routes
const publicRoutes = ['/login', '/registro', '/']
if (publicRoutes.includes(pathname)) {
  return response  // Permitir sin validación
}
```

---

### Problema 3: Token refresh infinito

**Síntomas:**
- Página blanca infinita en login
- Console: "Redirect loop detected"

**Diagnóstico:**
```typescript
// Middleware puede estar causando loop
// 1. User goes to /login (public)
// 2. Middleware tries getSession()
// 3. getSession() redirige a /login (¿si es null?)
// 4. Loop infinito
```

**Solución:**
```typescript
// Middleware debe permitir /login sin validación
const { data, error } = await supabase.auth.getSession()
if (!data.session && pathname !== '/login' && pathname !== '/registro') {
  return NextResponse.redirect(new URL('/login', request.url))
}
return response
```

---

## Próximos Pasos

1. **FASE 5:** Testing de flujos de autenticación
2. **Implementar:** Password reset flow
3. **Agregar:** Verificación de email
4. **Documentar:** Recuperación de cuenta

---

## Referencias Rápidas

### Componentes Clave

| Archivo | Función |
|---------|---------|
| `src/lib/auth.ts` | Helpers: `requireAuth()`, `requireAdmin()`, `getAuthUser()` |
| `src/middleware.ts` | Protección de rutas por autenticación |
| `src/app/admin/layout.tsx` | Protección /admin/* por admin role |
| `src/app/(private)/layout.tsx` | Protección /dashboard/* por autenticación |
| `src/lib/supabase-server.ts` | Cliente Supabase server-side |
| `src/lib/supabase-client.ts` | Cliente Supabase client-side |

### Environment Variables Required

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://qablhrycgplkgmzurtke.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

### Debugging

```typescript
// Verificar sesión actual
const { data: { user } } = await supabase.auth.getUser()
console.log('Current user:', user)

// Verificar si es admin
const isAdmin = await isUserAdmin(user.id)
console.log('Is admin:', isAdmin)

// Verificar sesión en client
const { data: { session } } = await supabase.auth.getSession()
console.log('Session:', session)
```
