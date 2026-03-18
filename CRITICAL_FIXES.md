# ✅ Correcciones Críticas Aplicadas - 18/03/2026

## Resumen Ejecutivo

Se han corregido los **3 errores críticos** que bloqueaban la funcionalidad core del proyecto:

1. ✅ Dashboard que no renderizaba cursos
2. ✅ Lógica de inscripción sin validación
3. ✅ Inconsistencias entre código y schema de BD

**Estado actual:** Build compila sin errores. Listo para producción después de ejecutar 1 comando SQL.

---

## 🔴 Errores Críticos Corregidos

### 1. **Dashboard - Query a tabla incorrecta**

**Problema:**
```typescript
// ❌ Buscaba en tabla incorrecta
const { data: inscripciones } = await supabase
  .from('inscripciones')  // Esta tabla NO existe
  .select(...)
```

**Solución:** [src/app/(private)/dashboard/page.tsx](src/app/(private)/dashboard/page.tsx)
```typescript
// ✅ Ahora busca en la tabla correcta
const { data: matriculas } = await supabase
  .from('matriculas')  // Tabla real en la BD
  .select(...)
```

**Cambios:**
- `inscripciones` → `matriculas` (tabla canónica)
- Removido campo `modalidad` (no existe)
- Todas las referencias internas actualizadas

---

### 2. **Inscripción - Sin validación de tipo de acceso**

**Problema:**
```typescript
// ❌ Marcaba estado_pago_curso=true SIN validar si es gratis o pago
const { error: insertError } = await admin
  .from('matriculas')
  .insert({
    perfil_id: session.user.id,
    curso_id: cursoId,
    estado_pago_curso: true,  // Siempre true, sin validación
    progreso_porcentaje: 0
  })
```

**Solución:** [src/app/actions/inscribir.server.ts](src/app/actions/inscribir.server.ts)
```typescript
// ✅ Ahora valida tipo de acceso
const { data: curso } = await admin
  .from('cursos')
  .select('tipo_acceso, precio_curso')
  .eq('id', cursoId)
  .single()

const esInscripcionDirecta =
  curso.tipo_acceso === 'gratis' ||
  (curso.tipo_acceso === 'pago-inmediato' && curso.precio_curso === 0)

if (!esInscripcionDirecta) {
  throw new Error('CURSO_REQUIERE_PAGO_O_COTIZACION')
}
```

**Cambios:**
- Obtiene datos del curso antes de insertar
- Valida que sea inscripción directa (gratis)
- Rechaza cursos que requieren pago o cotización

---

### 3. **Course Detail Page - Queries con joins incorrectos**

**Problema:**
```typescript
// ❌ Intentaba usar relaciones que no existen
const { data: course } = await supabase
  .from('cursos')
  .select(`
    *,
    categorias ( nombre ),  // Relación NO existe
  `)
```

**Solución:** [src/app/(public)/cursos/[slug]/page.tsx](src/app/(public)/cursos/[slug]/page.tsx)
```typescript
// ✅ Solo campos que existen realmente
const { data: course } = await supabase
  .from('cursos')
  .select(`
    id,
    titulo,
    slug,
    descripcion_breve,
    objetivos,
    metodologia,
    contenido_programatico,
    caracteristicas_generales,
    imagen_url,
    tipo_acceso,
    precio_curso,
    precio_certificado,
    porcentaje_aprobacion,
    modulos (id, lecciones (id))
  `)
```

**Cambios:**
- Removido join a `categorias` (no existe)
- Removidas referencias a campos inexistentes:
  - `tiene_sence` ❌
  - `tiene_certificado` ❌
  - `modalidad` ❌
  - `horas` ❌
- Lógica de certificación ahora se basa en `precio_certificado`

---

## 📋 Archivos Modificados

| Archivo | Cambios |
|---------|---------|
| `src/app/(private)/dashboard/page.tsx` | Query tabla, campos, todas referencias |
| `src/app/actions/inscribir.server.ts` | Validación tipo_acceso |
| `src/app/(public)/cursos/[slug]/page.tsx` | Query fields, removido joins/campos |
| `src/app/admin/cursos/page.tsx` | Removidas referencias campos inexistentes |
| `src/app/admin/cursos/[id]/page.tsx` | Null checks en comparaciones |
| `src/types/database.types.ts` | Actualizado enum tipo_acceso |
| `supabase/migrations/20260314000000_initial_schema.sql` | Actualizado enum tipo_acceso |

---

## 🚀 Próximos Pasos

### 1️⃣ **EJECUTAR SQL EN SUPABASE** (OBLIGATORIO)

Abre: https://app.supabase.com/project/qablhrycgplkgmzurtke/sql/new

Copia y ejecuta:

```sql
-- Actualizar enum tipo_acceso
CREATE TYPE tipo_acceso_new AS ENUM ('gratis', 'pago-inmediato', 'pago', 'gratis_cert_pago', 'cotizar');

ALTER TABLE cursos
ALTER COLUMN tipo_acceso TYPE tipo_acceso_new USING tipo_acceso::text::tipo_acceso_new;

DROP TYPE tipo_acceso;

ALTER TYPE tipo_acceso_new RENAME TO tipo_acceso;
```

⏱️ Tiempo: ~2 segundos
✅ Si no hay error rojo = Listo

### 2️⃣ Probar flujo completo

```bash
npm run dev
```

Prueba:
1. Registro en `/registro`
2. Inscripción a curso gratis en `/cursos`
3. Verificar dashboard en `/dashboard`

### 3️⃣ Próximas funcionalidades

- [ ] Implementar `/checkout/[id]` para cursos de pago
- [ ] Crear sala de clases `/dashboard/cursos/[slug]`
- [ ] Integrar pasarelas de pago (Flow, Transbank)
- [ ] Validación de RUT chileno
- [ ] Generación de certificados PDF

---

## 🔍 Verificación

- ✅ Build compila: `npm run build`
- ✅ TypeScript: Sin errores
- ✅ Types sincronizados: `database.types.ts`
- ✅ Schema actualizado: Migration lista
- ⏳ BD: Pendiente ejecutar SQL

---

## 📊 Deuda Técnica Pendiente

**Baja prioridad:**
- Remover imports no usados (hints de linter)
- Agregar tests E2E
- Documentar APIs

**Futura arquitectura:**
- Considerar agregar tabla `categorias` con relación
- Campos: `modalidad`, `horas`, `tiene_sence`, `tiene_certificado`
- Esto requiere migración adicional

---

## ✨ Cambios de Tipo

Actualizado enum `tipo_acceso`:

**Antes:** `'pago' | 'gratis_cert_pago' | 'cotizar'`

**Ahora:** `'gratis' | 'pago-inmediato' | 'pago' | 'gratis_cert_pago' | 'cotizar'`

Esto permite:
- Cursos 100% gratis
- Cursos con pago inmediato
- Cursos gratis con certificado de pago (Freemium)
- Cursos que requieren cotización B2B
