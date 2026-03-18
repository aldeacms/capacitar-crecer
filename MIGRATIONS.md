# Migraciones Pendientes

## 🔄 Actualizar Enum `tipo_acceso` en Supabase

**Estado:** ⏳ Pendiente de aplicación manual

### Instrucciones:

1. Abre la consola SQL de Supabase:
   - Ve a: https://app.supabase.com/project/qablhrycgplkgmzurtke/sql/new
   - O: Supabase Dashboard → SQL Editor → New Query

2. Copia y ejecuta este SQL:

```sql
-- Crear nuevo enum con todos los valores requeridos
CREATE TYPE tipo_acceso_new AS ENUM ('gratis', 'pago-inmediato', 'pago', 'gratis_cert_pago', 'cotizar');

-- Convertir la columna al nuevo tipo
ALTER TABLE cursos
ALTER COLUMN tipo_acceso TYPE tipo_acceso_new USING tipo_acceso::text::tipo_acceso_new;

-- Eliminar el tipo viejo
DROP TYPE tipo_acceso;

-- Renombrar el tipo nuevo al nombre original
ALTER TYPE tipo_acceso_new RENAME TO tipo_acceso;
```

3. Verifica que no haya errores y presiona "Run"

### ¿Por qué?

El código ahora soporta estos tipos de acceso:
- `'gratis'` - Curso completamente gratuito
- `'pago-inmediato'` - Pago de una vez
- `'pago'` - Alias para pago (futuro)
- `'gratis_cert_pago'` - Curso gratis con certificado de pago (Freemium)
- `'cotizar'` - Requiere cotización B2B

El enum anterior solo tenía: `'pago'`, `'gratis_cert_pago'`, `'cotizar'`

### Cambios en código que lo soportan:
- ✅ `src/types/database.types.ts` - Types actualizados
- ✅ `supabase/migrations/20260314000000_initial_schema.sql` - Schema actualizado
- ✅ `src/app/actions/inscribir.server.ts` - Validación de tipo de acceso
- ✅ `src/app/(public)/cursos/[slug]/page.tsx` - Lógica de precios
- ✅ Build compila sin errores

---

## ✅ Cambios Aplicados en Código

1. **Dashboard query arreglada**
   - Cambio: `inscripciones` → `matriculas` (tabla real)
   - Archivo: `src/app/(private)/dashboard/page.tsx`

2. **Server Action validación**
   - Ahora valida tipo de acceso antes de crear matrícula
   - Archivo: `src/app/actions/inscribir.server.ts`

3. **Course detail page**
   - Removidos campos inexistentes
   - Queries ajustadas al schema real
   - Archivo: `src/app/(public)/cursos/[slug]/page.tsx`

4. **Admin pages**
   - Removidas referencias a campos inexistentes
   - Archivo: `src/app/admin/cursos/page.tsx`, `src/app/admin/cursos/[id]/page.tsx`

5. **Build**
   - ✅ Compila sin errores TypeScript
