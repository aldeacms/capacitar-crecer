# Sistema de Pagos - Arquitectura Futura

## Estado Actual (2026-03-19)

**No hay sistema de pagos configurado.** Todas las transacciones son test data.

- `matriculas.estado_pago_curso` = FALSE para todas las matrículas
- Dashboard muestra **$0 de ingresos** (correcto, sin pagos reales)
- Las compras de prueba usan cupones de descuento (100%)

## El Problema: Mezclar Enrollment con Payment

El código actual (FASE 4) intentó usar `matriculas.estado_pago_curso` para rastrear pagos:

```typescript
// ❌ INCORRECTO: enrollment ≠ payment
const { data: pagosData } = await supabaseAdmin
  .from('matriculas')
  .select('cursos(precio_curso)')
  .eq('estado_pago_curso', true)

const ingresoTotal = (pagosData || []).reduce(/* ... */)
```

**Problemas:**
1. Enrollment (matrícula) es un concepto diferente de Payment (pago)
2. Un usuario puede estar matriculado sin haber pagado
3. Histórico de pagos se pierde (¿cuándo se pagó? ¿qué método?)
4. Múltiples pagos del mismo curso = imposible rastrear

## Arquitectura Correcta: Tabla Dedicada "pagos"

### Schema de la Tabla `pagos`

```sql
CREATE TABLE pagos (
  -- Identificación
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relacionales
  perfil_id UUID NOT NULL REFERENCES perfiles(id) ON DELETE CASCADE,
  curso_id UUID NOT NULL REFERENCES cursos(id) ON DELETE RESTRICT,

  -- Datos del Pago
  monto NUMERIC(10, 2) NOT NULL,
  descuento_monto NUMERIC(10, 2) DEFAULT 0,
  monto_final NUMERIC(10, 2) NOT NULL, -- monto - descuento_monto

  -- Método y Estado
  metodo_pago VARCHAR(50) NOT NULL, -- 'stripe', 'transferencia', 'efectivo', 'cupon'
  estado VARCHAR(50) NOT NULL DEFAULT 'completado', -- 'pendiente', 'completado', 'fallido', 'reembolsado'

  -- Trazabilidad
  referencia_externa VARCHAR(255) UNIQUE, -- stripe_pi_xxx, transf_id, etc
  razon_fallida TEXT, -- si estado='fallido'

  -- Auditoría
  created_at TIMESTAMP DEFAULT now(),
  completed_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT now()
);

-- Índices para queries comunes
CREATE INDEX idx_pagos_perfil ON pagos(perfil_id);
CREATE INDEX idx_pagos_curso ON pagos(curso_id);
CREATE INDEX idx_pagos_estado ON pagos(estado);
CREATE INDEX idx_pagos_fecha ON pagos(created_at);
```

### Migrations SQL Futuras

**Step 1: Crear tabla**
```sql
-- Ya defini arriba
```

**Step 2: Migrar datos (si aplica)**
```sql
-- Si hay datos de pago reales en otra tabla, migrar aquí
INSERT INTO pagos (perfil_id, curso_id, monto, monto_final, metodo_pago, estado, completed_at)
SELECT perfil_id, curso_id, precio_curso, precio_curso, 'historico', 'completado', created_at
FROM matriculas
WHERE estado_pago_curso = true;
```

**Step 3: Actualizar matriculas**
```sql
-- estado_pago_curso se usará SOLO para pago de certificado
-- ALTER TABLE matriculas DROP COLUMN estado_pago_curso IF NOT NEEDED
```

## Queries Futuras

### Ingreso Total de Pagos Completados
```typescript
const { data: pagosCompletados } = await supabaseAdmin
  .from('pagos')
  .select('monto_final')
  .eq('estado', 'completado')

const ingresoTotal = (pagosCompletados || []).reduce(
  (sum, p) => sum + (p.monto_final || 0),
  0
)
```

### Ingresos por Período
```typescript
const { data } = await supabaseAdmin
  .from('pagos')
  .select('created_at, monto_final')
  .eq('estado', 'completado')
  .gte('created_at', startDate)
  .lte('created_at', endDate)

// Agrupar por fecha
const porFecha = data?.reduce((acc, p) => {
  const fecha = new Date(p.created_at).toLocaleDateString('es-CL')
  acc[fecha] = (acc[fecha] || 0) + p.monto_final
  return acc
}, {})
```

### Ingresos por Curso
```typescript
const { data } = await supabaseAdmin
  .from('pagos')
  .select('curso_id, cursos(titulo), monto_final')
  .eq('estado', 'completado')

// Agrupar y sumar
const porCurso = data?.reduce((acc, p) => {
  const key = p.curso_id
  if (!acc[key]) {
    acc[key] = { titulo: p.cursos?.titulo, total: 0 }
  }
  acc[key].total += p.monto_final
  return acc
}, {})
```

## Caminos de Pago Soportados

### 1. Stripe (Recomendado)
- Flujo: UI → Stripe Checkout → Webhook → Crear Pago
- `metodo_pago: 'stripe'`
- `referencia_externa: 'pi_1234567890'` (Stripe Payment Intent ID)

### 2. Transferencia Bancaria
- Flujo: Usuario confirma transferencia → Admin verifica → Crear Pago
- `metodo_pago: 'transferencia'`
- `referencia_externa: 'TRANSF-202603-001'` (internal ref)
- `estado: 'pendiente'` → `'completado'` (Admin verifica)

### 3. Cupón 100% (Ya existe)
- Flujo: Aplicar cupón → Crear Matrícula
- Actualmente no crea registro en `pagos`
- **TODO**: Crear pago con `metodo_pago: 'cupon'` y `monto_final: 0`

### 4. Dinero en Efectivo
- Flujo: Cliente paga en efectivo → Verificación manual
- `metodo_pago: 'efectivo'`
- Requiere confirmación de Admin antes de crear matrícula

## Datos Relacionados a Pagos

```typescript
interface Pago {
  id: string
  perfil_id: string
  curso_id: string
  monto: number
  descuento_monto: number
  monto_final: number
  metodo_pago: 'stripe' | 'transferencia' | 'cupon' | 'efectivo'
  estado: 'pendiente' | 'completado' | 'fallido' | 'reembolsado'
  referencia_externa?: string
  razon_fallida?: string
  created_at: string
  completed_at?: string
  updated_at: string
}

interface MatriculaConPago extends Matricula {
  pago?: Pago
}
```

## Cambios en Server Actions

### Antes (FASE 4):
```typescript
// src/actions/checkout.ts
const { error } = await admin.from('matriculas').insert({
  perfil_id: perfil.id,
  curso_id: cursoId,
  estado_pago_curso: true, // ❌ Incorrecto: mezcla pago con matrícula
})
```

### Después (FASE 5+):
```typescript
// Crear matrícula
const { error: matriculaError } = await admin
  .from('matriculas')
  .insert({
    perfil_id: perfil.id,
    curso_id: cursoId,
    // estado_pago_curso ya no se usa para pagos de curso
  })

// Registrar pago
const { error: pagoError } = await admin
  .from('pagos')
  .insert({
    perfil_id: perfil.id,
    curso_id: cursoId,
    monto: precioFinal,
    monto_final: precioFinal - descuentoMonto,
    metodo_pago: 'stripe',
    estado: 'completado',
    referencia_externa: stripePaymentIntentId,
    completed_at: new Date().toISOString(),
  })
```

## Cambios en Dashboard

### Antes (FASE 4):
```typescript
// ❌ Incorrecto: joined query
const { data: pagosData } = await supabaseAdmin
  .from('matriculas')
  .select('cursos(precio_curso)')
  .eq('estado_pago_curso', true)
```

### Después (FASE 5+):
```typescript
// ✅ Correcto: tabla dedicada
const { data: pagos } = await supabaseAdmin
  .from('pagos')
  .select('monto_final')
  .eq('estado', 'completado')
  .gte('created_at', thirtyDaysAgo)

const ingresoTotal = (pagos || []).reduce(
  (sum, p) => sum + p.monto_final,
  0
)
```

## Migración y Roadmap

### Inmediato (FASE 4 - COMPLETADO)
- ✅ Limpiar estado_pago_curso inconsistencias
- ✅ Remover income metrics del dashboard
- ✅ Documentar arquitectura correcta
- ✅ Cambiar `'gratis'` → `false` en usuarios.ts

### Corto Plazo (FASE 5)
- [ ] Crear tabla `pagos` en Supabase
- [ ] Crear migrations SQL
- [ ] Actualizar tipos TypeScript (database.types.ts)

### Mediano Plazo (FASE 6)
- [ ] Implementar Stripe integration
- [ ] Crear server action `procesarPagoStripe()`
- [ ] Crear componente `StripeCheckoutForm`
- [ ] Webhook para `stripe/webhook`

### Largo Plazo (FASE 7+)
- [ ] Otros métodos: transferencia, efectivo
- [ ] Panel de análisis de pagos
- [ ] Reportes financieros
- [ ] Reembolsos y ajustes
- [ ] Auditoría y compliance

## Notas de Seguridad

### Para Implementación Futura

1. **Nunca confiar en el cliente** para el monto de pago
   ```typescript
   // ❌ Incorrecto
   const pago = await pagoCuadrilla(monto, precioUI)

   // ✅ Correcto
   const curso = await obtenerCursoDelServidor(cursoId)
   const precioReal = curso.precio_curso
   const pago = await pagoCuadrilla(precioReal)
   ```

2. **Validar estado con Stripe**
   ```typescript
   // En webhook de Stripe
   const intent = await stripe.paymentIntents.retrieve(intentId)
   if (intent.status !== 'succeeded') return 400

   // Crear pago en BD
   await admin.from('pagos').insert(...)
   ```

3. **RLS en tabla `pagos`**
   ```sql
   CREATE POLICY pagos_select_own ON pagos
     FOR SELECT USING (auth.uid() = perfil_id OR is_admin())

   CREATE POLICY pagos_insert_admin ON pagos
     FOR INSERT WITH CHECK (is_admin())
   ```

4. **Auditoría**
   - Todos los pagos quedan en BD con timestamp
   - No pueden ser eliminados, solo marcados como reembolsados
   - Logs en Stripe mantienen copia independiente

## Referencias

- [Stripe API Documentation](https://stripe.com/docs/api)
- [Supabase RLS Policies](https://supabase.com/docs/guides/auth/row-level-security)
- [Payment Processing Best Practices](https://www.pcisecuritystandards.org/)

---

**Última actualización**: 2026-03-19
**Estado**: Documentación completada, implementación pendiente
