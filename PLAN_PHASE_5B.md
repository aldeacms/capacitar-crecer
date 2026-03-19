# 📋 PLAN: Phase 5B - Dashboard, Icons & Performance

**Objetivo:** Mejorar UX/UI, reemplazar emojis por iconos profesionales, y optimizar performance.

---

## 🎯 Tasks

### **1. Dashboard con Métricas Reales** (50% completo)

**Estado Actual:**
- ✅ Dashboard skeleton en `/admin`
- ✅ `getDashboardMetrics()` server action implementada
- ✅ Chartas Recharts para matriculas y cursos top
- ⏳ Falta: Datos REALES de la base de datos

**Tareas:**
- [ ] Verificar que `getDashboardMetrics()` obtiene datos correctos
- [ ] Actualizar `getMatriculasChart()` para últimos 30 días
- [ ] Mejorar `getTopCursos()` con más contexto
- [ ] Agregar más métricas (tasa de conversión, ingresos, etc.)
- [ ] Implementar carga en tiempo real con Suspense
- [ ] Agregar filtros (por fecha, categoría)

---

### **2. Reemplazar Emojis por Iconos Lucide** (0% completo)

**Emojis a Reemplazar:**
| Emoji | Icono Lucide | Ubicación |
|-------|-------------|-----------|
| 📚 | BookOpen | Header, nav |
| 👤 | User | Perfiles |
| 🎓 | GraduationCap | Certificados |
| 📊 | BarChart3 | Dashboard, métricas |
| ✅ | CheckCircle2 | Estados, completadas |
| ❌ | AlertCircle | Errores |
| 🔐 | Lock | Privado, admin |
| 📝 | ClipboardList | Formularios, lecciones |
| 💰 | DollarSign | Precios, pagos |
| 📈 | TrendingUp | Gráficos |
| ⚙️ | Settings | Config |
| 🔍 | Search | Búsqueda |
| ➕ | Plus | Agregar |
| ✏️ | Edit | Editar |
| 🗑️ | Trash2 | Eliminar |

**Archivos a Actualizar:**
- [ ] src/components/admin/* (17 archivos)
- [ ] src/components/aula/* (8 archivos)
- [ ] src/components/public/* (5 archivos)
- [ ] src/app/admin/*.tsx (12 páginas)
- [ ] src/app/(private)/*.tsx (8 páginas)
- [ ] src/lib/auth.ts (comentarios)

---

### **3. Optimizar Performance** (0% completo)

**Métricas Objetivo:**
- Lighthouse: 90+ en todas
- First Contentful Paint: < 1.5s
- Cumulative Layout Shift: < 0.1
- Total Blocking Time: < 200ms

**Tareas:**
- [ ] Analizar performance con Lighthouse
- [ ] Implementar lazy loading en imágenes
- [ ] Code splitting automático (Next.js hace esto)
- [ ] Optimizar bundle size (revisión de dependencias)
- [ ] Implementar caché de imágenes
- [ ] Minify CSS/JS (Next.js build hace esto)
- [ ] Comprimir assets
- [ ] Implementar static export donde sea posible
- [ ] Suspense boundaries para carga incremental
- [ ] Scroll performance (virtualize lists si es necesario)

---

## 📝 Orden de Implementación

1. **Dashb oard Metrics** (1-2 horas)
   - Verificar datos en DB
   - Actualizar queries
   - Agregar nuevas métricas

2. **Reemplazar Emojis** (2-3 horas)
   - Script para encontrar todos los emojis
   - Actualizar componentes sistemáticamente
   - Testear visual en cada sección

3. **Optimizar Performance** (1-2 horas)
   - Ejecutar Lighthouse
   - Lazy load de imágenes
   - Comprimir assets
   - Testear con DevTools

---

## 📦 Dependencias Necesarias

```bash
# Lucide icons (ya instalado)
lucide-react

# Performance
next/image (built-in)
next/dynamic (built-in)

# Analytics (opcional)
next-speed-insights (opcional)
```

---

## ✅ Definition of Done

- [ ] Dashboard muestra métricas reales en tiempo real
- [ ] Todos los emojis reemplazados por Lucide icons
- [ ] Lighthouse score: 90+ en todas las categorías
- [ ] Build size: < 500KB
- [ ] No console errors o warnings
- [ ] Tests visuales en responsivo
- [ ] Commit con todos los cambios
- [ ] Push a main branch

---

**Tiempo Estimado:** 4-7 horas
**Inicio:** Ahora
**Meta de Cierre:** HOY (Phase 5B Complete)
