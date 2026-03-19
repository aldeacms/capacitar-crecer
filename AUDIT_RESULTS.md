# 📊 Auditoría Profesional - 19-03-2026, 7:05:46 p. m.

## 1️⃣  TABLA: perfiles

**Total de registros:** 2

**Estructura y datos:**

```json
[
  {
    "id": "7983c049-fa7b-42d9-bfba-41fbdfc57eb2",
    "rut": "rut-7983c049",
    "nombre_completo": "Daniel Aldea Focus",
    "rol": "alumno",
    "created_at": "2026-03-18T15:02:09.884324+00:00"
  },
  {
    "id": "92d7e664-d1e0-408f-96e5-e989d8dbb475",
    "rut": "12345678-K",
    "nombre_completo": "Daniel López",
    "rol": "admin",
    "created_at": "2026-03-19T21:45:49.214445+00:00"
  }
]
```

**Análisis de perfiles:**
- Daniel Aldea Focus (alumno) - RUT: rut-7983c049
- Daniel López (admin) - RUT: 12345678-K

## 2️⃣  AUTH.USERS (Usuario Admin)

**Total usuarios:** 1

```json
{
  "id": "7983c049-fa7b-42d9-bfba-41fbdfc57eb2",
  "email": "daniel@lifefocus.agency",
  "email_confirmed_at": "2026-03-18T02:59:51.436907Z",
  "created_at": "2026-03-18T02:43:07.988686Z"
}
```

## 3️⃣  ANÁLISIS DE DESAJUSTES

### Auth sin Perfil:
✅ Ninguno

### Perfil sin Auth:
⚠️  **1** perfil(es):
- Daniel López (id: 92d7e664-d1e0-408f-96e5-e989d8dbb475)

## 🔍 PROBLEMA IDENTIFICADO

**El usuario daniel@luam.cl existe en auth.users pero el login falla.**

Posibles causas:
1. Email no confirmado (verificar `email_confirmed_at`)
2. Usuario baneado (verificar `banned_until`)
3. Problema con hashing de contraseña
4. Política RLS bloqueando la lectura

## ✅ SOLUCIÓN RECOMENDADA

Ejecutar en Supabase SQL Editor:
```sql
-- Verificar estado exacto del usuario
SELECT id, email, email_confirmed_at, banned_until, raw_app_meta_data
FROM auth.users WHERE email = 'daniel@luam.cl';
```

