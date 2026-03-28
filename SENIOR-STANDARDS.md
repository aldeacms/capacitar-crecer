# Estándares de Desarrollo Senior - Capacitar y Crecer

Este documento define las reglas obligatorias de calidad para todo el desarrollo del proyecto.

## 1. UX/UI Moderna
- **Interacción**: Priorizar el uso de Drag & Drop (ej. `@dnd-kit`) para ordenamiento de listas.
- **Flujos**: Usar modales amplios, layouts de una columna para formularios complejos y navegación por pasos.
- **Feedback**: Implementar skeletons, spinners elegantes y estados de carga (`isPending`) en todas las interacciones asíncronas.

## 2. Accesibilidad y Contraste (WCAG)
- **Visibilidad**: Prohibido el uso de grises claros (`text-gray-300`, `text-gray-400`) sobre blanco.
- **Estándar**: Usar grises de alto contraste (`text-gray-700`, `text-slate-900`) para labels, placeholders y textos descriptivos.
- **Bordes**: Asegurar que los bordes de los inputs y contenedores sean claramente visibles (`border-gray-300` o similar).

## 3. Lógica de CRUD Completa
- **Sentido Común**: Cada nueva funcionalidad de creación/subida (CREATE) debe incluir automáticamente su contraparte de visualización (READ), edición (UPDATE) y eliminación (DELETE).
- **Gestión de Archivos**: Cualquier sistema de adjuntos debe permitir ver la lista de archivos y eliminarlos individualmente.

## 4. Iconos y elementos visuales
- **Iconos:** Usar exclusivamente `lucide-react` para todos los iconos del sistema.
- **Emojis:** Prohibido el uso de emojis en cualquier parte del código — en JSX, strings, comentarios de código visible, o consola. Los emojis rompen la consistencia visual del sistema.
- **Logos de terceros:** Usar SVGs oficiales (en `/public/`) para marcas externas (Transbank, Flow, MercadoPago). Mientras no estén disponibles, usar el icono genérico `CreditCard` de Lucide.

## 5. Backend Robusto ("Modo Dios")
- **Seguridad**: Todos los Server Actions deben usar la `SUPABASE_SERVICE_ROLE_KEY` para garantizar la ejecución de tareas administrativas (bypass RLS).
- **Resiliencia**: Envolver toda la lógica en bloques `try/catch`.
- **Debugging**: Usar `console.error` descriptivos incluyendo el nombre de la función y el error exacto para facilitar el mantenimiento.
