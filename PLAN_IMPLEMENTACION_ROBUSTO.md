# 📐 PLAN DE IMPLEMENTACIÓN ROBUSTO

**Fecha:** 2026-03-19
**Enfoque:** Calidad > Velocidad
**Metodología:** Profesional, bien documentado, sin atajos

---

## 🎯 Principios del Plan

1. **Documentar ANTES de implementar** - No código sin especificación
2. **Verificar DESPUÉS de implementar** - No avanzar sin test
3. **Preservar TODA evidencia** - Nunca borrar documentación
4. **Hacer auditoría DESPUÉS de cada fase** - Validar que funciona
5. **Comunicar cambios** - Documentar qué se hizo y por qué

---

## 📋 FASE 0: Auditoría Completa de Base de Datos

**Objetivo:** Documentación exhaustiva de la BD actual

### 0.1 Esquema de Cada Tabla
Documentar para CADA tabla:
- [ ] Nombre y descripción
- [ ] Todas las columnas (nombre, tipo, constraints)
- [ ] Primary keys
- [ ] Foreign keys
- [ ] Índices
- [ ] Triggers (si existen)
- [ ] RLS Policies

**Entregable:** `SCHEMA_COMPLETE.md`

### 0.2 Data Integrity Audit
- [ ] Verificar constraints están activos
- [ ] Verificar no hay datos huérfanos
- [ ] Verificar referencias son consistentes
- [ ] Documentar problemas encontrados

**Entregable:** `DATA_AUDIT.md`

### 0.3 Security Audit
- [ ] Verificar RLS policies en todas las tablas
- [ ] Verificar column-level security si aplica
- [ ] Verificar roles (authenticated, service_role)
- [ ] Documentar permisos por rol

**Entregable:** `SECURITY_AUDIT.md`

**Tiempo estimado:** 2-3 horas
**Bloqueador:** Ninguno - es verificación pura

---

## 📋 FASE 1: Arreglar Data Integrity

**Objetivo:** Base de datos limpia y consistente

### 1.1 Sincronizar auth.users ↔ perfiles
**Problema:** Usuario Daniel López existe en perfiles sin email en auth.users

**Opción A (Recomendada):** Eliminar registro huérfano
```sql
DELETE FROM perfiles WHERE id = '92d7e664-d1e0-408f-96e5-e989d8dbb475';
```

**Opción B (Si tiene datos):** Crear usuario en auth.users
```sql
INSERT INTO auth.users (id, email)
VALUES ('92d7e664-d1e0-408f-96e5-e989d8dbb475', 'daniel.lopez@example.com');
```

**Decisión requerida del usuario:** ¿Opción A o B?

**Entregable:** BD consistente (auth.users.count == perfiles.count)

### 1.2 Crear Función para Sincronización
Crear trigger en auth.users que automáticamente cree perfil

**Por qué:** Evitar futuros desincronizaciones

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.perfiles (id, nombre_completo, rut)
  VALUES (new.id, COALESCE(new.user_metadata->>'nombre_completo', ''), NULL)
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

**Entregable:** Trigger creado y documentado

**Tiempo estimado:** 1 hora
**Bloqueador:** Decisión sobre registro huérfano

---

## 📋 FASE 2: Arreglar Funcionalidad de Admin

**Objetivo:** Admin panel completamente funcional

### 2.1 Debug getUsuarios() Error
**Problema:** `/admin/alumnos` muestra error

**Pasos:**
1. [ ] Identificar línea exacta del error
2. [ ] Entender por qué falla
3. [ ] Arreglar root cause (no síntoma)
4. [ ] Verificar en navegador que funciona

**Entregable:** Error resuelto + usuarios visibles en tabla

### 2.2 Implementar Admin Submenu
**Problema:** Usuario admin no ve "Ir a Admin" en menú

**Implementar:**
- [ ] Detectar si current user es admin
- [ ] Mostrar submenu con:
  - [ ] Dashboard
  - [ ] Gestión de Usuarios
  - [ ] Gestión de Cursos
  - [ ] Gestión de Categorías
  - [ ] Gestión de Cupones

**Archivo:** `src/components/navbar/AdminSubmenu.tsx` (nuevo)

**Entregable:** Menú funcional, accessible desde cualquier página

### 2.3 Verificar Todas las Páginas Admin
Para CADA página:
- [ ] `/admin/alumnos` - lista usuarios
- [ ] `/admin/cursos` - lista cursos
- [ ] `/admin/categorias` - lista categorías
- [ ] `/admin/cupones` - lista cupones
- [ ] `/admin` (dashboard) - muestra métricas

**Entregable:** Todas las páginas funcionales, sin errores

**Tiempo estimado:** 3-4 horas
**Bloqueador:** Bug en getUsuarios()

---

## 📋 FASE 3: Auditoría Completa de Código

**Objetivo:** Documentar arquitectura actual

### 3.1 Documentar Server Actions
Para CADA server action en `src/actions/`:
- [ ] Nombre y descripción
- [ ] Parámetros (tipos, validación)
- [ ] Retorno (tipos, posibles errores)
- [ ] Autenticación requerida
- [ ] Validaciones aplicadas

**Entregable:** `ACTIONS_DOCUMENTATION.md`

### 3.2 Documentar Componentes Críticos
Para CADA componente en `src/components/`:
- [ ] Props (tipos, requeridos/opcionales)
- [ ] Comportamiento
- [ ] Dónde se usa
- [ ] Dependencias

**Entregable:** `COMPONENTS_DOCUMENTATION.md`

### 3.3 Documentar Middleware y Auth
- [ ] Cómo funciona middleware.ts
- [ ] Cómo funciona auth.ts
- [ ] Flujo de autenticación
- [ ] Cómo se verifican permisos

**Entregable:** `AUTH_FLOW.md`

**Tiempo estimado:** 2 horas
**Bloqueador:** Ninguno - es documentación

---

## 📋 FASE 4: Implementar Features Faltantes

**Objetivo:** Completar funcionalidad

### 4.1 Crear Usuario Admin Desde Admin Panel
**Actualmente:** Solo el usuario hardcoded es admin

**Implementar:**
- [ ] Opción "Promover a Admin" en gestión de usuarios
- [ ] Opción "Degradar de Admin"
- [ ] Validación: siempre debe haber 1 admin mínimo
- [ ] Log de cambios de rol

**Entregable:** Sistema flexible de admin management

### 4.2 Dashboard con Datos Reales
**Código existe:** Pero ¿funciona?

**Verificar:**
- [ ] `getDashboardMetrics()` retorna datos correctos
- [ ] `getMatriculasChart()` muestra últimos 30 días
- [ ] `getTopCursos()` ordena por inscripciones
- [ ] Números coinciden con BD

**Entregable:** Dashboard mostrando datos precisos

### 4.3 Búsqueda y Filtros
En gestión de usuarios:
- [ ] Búsqueda por nombre/email/RUT
- [ ] Filtro por rol (admin/alumno)
- [ ] Ordenamiento por columnas

**Entregable:** Gestión de usuarios profesional

**Tiempo estimado:** 4-5 horas
**Bloqueador:** Fases anteriores deben estar completas

---

## 📋 FASE 5: Testing Completo

**Objetivo:** Verificar que todo funciona

### 5.1 Test Manual
Para CADA funcionalidad:
- [ ] Crear usuario → verificar aparece en lista
- [ ] Editar usuario → verificar cambios guardados
- [ ] Eliminar usuario → verificar desaparece
- [ ] Promover a admin → verificar rol cambia
- [ ] Dashboard → verificar números correctos

**Entregable:** Test checklist completado

### 5.2 Test de Seguridad
- [ ] Usuario alumno NO puede acceder a /admin
- [ ] Usuario alumno NO puede ver otros usuarios
- [ ] Usuario admin puede ver todo
- [ ] logout funciona

**Entregable:** Seguridad verificada

### 5.3 Test de Data Integrity
- [ ] Crear usuario → perfil se crea automáticamente
- [ ] Eliminar usuario → perfil se elimina
- [ ] No hay datos huérfanos

**Entregable:** Integridad de datos verificada

**Tiempo estimado:** 2 horas
**Bloqueador:** Todas las fases anteriores completas

---

## 📋 FASE 6: Documentación Final

**Objetivo:** Preservar todo el trabajo

### 6.1 Crear Documentación de Usuario (Admin)
- Cómo usar gestión de usuarios
- Cómo crear/editar/eliminar usuarios
- Cómo ver metrics en dashboard
- Troubleshooting común

**Entregable:** `ADMIN_USER_GUIDE.md`

### 6.2 Crear Documentación de Desarrollador
- Cómo agregar nueva funcionalidad admin
- Cómo modificar server actions
- Cómo agregar nuevo role/permiso
- Pattern para agregar nuevas páginas admin

**Entregable:** `DEVELOPER_GUIDE.md`

### 6.3 Actualizar HEALTH_CHECK.md
- Documentar todos los cambios
- Actualizar status de cada feature
- Dejar registro para auditorías futuras

**Entregable:** HEALTH_CHECK.md actualizado

**Tiempo estimado:** 1-2 horas
**Bloqueador:** Ninguno

---

## 📊 Timeline Estimado

| Fase | Tarea | Horas | Dependencias |
|------|-------|-------|--------------|
| 0 | Auditoría BD | 3 | Ninguna |
| 1 | Arreglar data | 1 | Fase 0 |
| 2 | Admin funcional | 4 | Fase 1 |
| 3 | Documentación código | 2 | Fase 0-2 |
| 4 | Features faltantes | 5 | Fase 2-3 |
| 5 | Testing | 2 | Fase 4 |
| 6 | Documentación final | 2 | Fase 5 |
| **TOTAL** | | **19 horas** | |

---

## 🎯 Hitos y Commits

**Después de cada fase completa:**
```
git commit -m "Phase X: [Descripción breve]

Cambios:
- [Cambio 1]
- [Cambio 2]

Verificado:
- [Test 1]
- [Test 2]"
```

**NUNCA:** Commitear documentación provisional
**SIEMPRE:** Preservar documentación en git

---

## ⚠️ Reglas de Oro

1. **NO cambiar código sin documentar PRIMERO qué cambiará**
2. **NO avanzar a siguiente fase sin completar la anterior**
3. **NO eliminar documentación - ARCHIVARLA si está desactualizada**
4. **NO hacer commits sin verificar el cambio funciona**
5. **NO asumir - PREGUNTAR si hay duda**

---

## 🚀 Comenzar

Para empezar **FASE 0:**
1. Abre Supabase dashboard
2. Navega a cada tabla
3. Documenta según `SCHEMA_COMPLETE.md`
4. Actualiza este plan si hay cambios

¿Comenzamos con FASE 0?
