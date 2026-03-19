# 🔧 Setup de Usuario Administrador - GUÍA FINAL

Procedimiento **verificado y funcional** para crear usuarios administrador.

---

## ⚠️ Nota Importante: El Trigger

Supabase tiene un trigger `handle_new_user()` en `auth.users` que **automáticamente crea** una fila en `perfiles` cuando se inserta un usuario. Este trigger usa `rut = null`, lo cual viola la constraint `NOT NULL` de la columna `rut`.

**Solución:** Hacer `rut` temporalmente nullable durante la creación del usuario.

---

## 🔐 Crear Administrador (Paso Único)

En **Supabase SQL Editor**, copia y ejecuta TODO ESTO JUNTO:

```sql
-- 1. Permitir rut nullable (para evitar que el trigger falle)
ALTER TABLE perfiles ALTER COLUMN rut DROP NOT NULL;

-- 2. Limpiar si existe usuario anterior
DELETE FROM perfiles WHERE id IN (SELECT id FROM auth.users WHERE email = 'daniel@luam.cl');
DELETE FROM auth.users WHERE email = 'daniel@luam.cl';

-- 3. Crear usuario en auth.users (el trigger crea automáticamente la fila en perfiles)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin)
VALUES (gen_random_uuid(), 'daniel@luam.cl', crypt('Tempwoou509x!2024', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, false);

-- 4. Actualizar el perfil que el trigger creó con los datos correctos
UPDATE perfiles SET rut = '12345678-K', nombre_completo = 'Daniel López', rol = 'admin'
WHERE id IN (SELECT id FROM auth.users WHERE email = 'daniel@luam.cl');

-- 5. Restaurar constraint NOT NULL en rut
ALTER TABLE perfiles ALTER COLUMN rut SET NOT NULL;

-- 6. Verificar que todo está correcto
SELECT u.email, p.rut, p.nombre_completo, p.rol
FROM auth.users u
INNER JOIN perfiles p ON u.id = p.id
WHERE u.email = 'daniel@luam.cl';
```

**Resultado esperado:**
```
email          | rut         | nombre_completo | rol
daniel@luam.cl | 12345678-K  | Daniel López    | admin
```

---

## 🚀 Iniciar Sesión

Ve a `http://localhost:3000/login` e ingresa:

```
Email:    daniel@luam.cl
Password: Tempwoou509x!2024
```

Deberías llegar a `/admin` automáticamente.

---

## 📋 Variables Personalizables

En el SQL anterior, puedes cambiar:

| Variable | Ubicación | Formato |
|----------|-----------|---------|
| `daniel@luam.cl` | Líneas 5, 6, 10, 14 | Email válido |
| `Tempwoou509x!2024` | Línea 10 | Contraseña (mín 8 caracteres) |
| `12345678-K` | Línea 14 | RUT chileno |
| `Daniel López` | Línea 14 | Nombre completo |

---

## 🔄 Para Cambiar Contraseña de Admin Existente

```sql
UPDATE auth.users
SET encrypted_password = crypt('NuevaPassword123!', gen_salt('bf'))
WHERE email = 'daniel@luam.cl';
```

---

## 📊 Tabla: perfiles - Estructura

```
id              uuid        PRIMARY KEY
rut             text        NOT NULL (formato: 12345678-K)
nombre_completo text        NOT NULL
rol             text        NOT NULL (valores: 'alumno' | 'admin')
created_at      timestamp   NOT NULL
```

---

## 🚨 Troubleshooting

| Error | Causa | Solución |
|-------|-------|----------|
| `null value in column 'rut'` | El trigger se disparó pero el UPDATE no se ejecutó | Asegúrate que todo el bloque SQL se ejecute junto (no por partes) |
| `duplicate key` | Usuario ya existe | Ejecuta el DELETE antes de INSERT |
| `trigger 'X' does not exist` | Intentaste desactivar un trigger que no existe | No es necesario desactivar triggers, la solución del paso 1 maneja esto |
| `relation 'perfiles' does not exist` | Migrations incompletas | Verifica que las tablas existan en Supabase |

---

## ✅ Checklist

- [ ] SQL ejecutado sin errores
- [ ] Resultado muestra: email, rut, nombre_completo, rol
- [ ] Puedo iniciar sesión en `/login`
- [ ] Puedo ver `/admin/dashboard` con métricas
- [ ] El rol es `admin`

---

## 📚 Referencias

- **Database Schema:** Ver [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)
- **Supabase Auth:** https://supabase.com/docs/guides/auth

---

**Última actualización:** 2026-03-19
**Verificado:** ✅ Funcional
**Versión:** 2.0 (Corregida para triggers)
