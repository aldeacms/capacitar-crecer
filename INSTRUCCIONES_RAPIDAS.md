# 🚀 Guía Rápida: Activar Sistema de Certificados

## Requisitos Completados ✅
- Código implementado y compilado
- Fuentes descargadas
- Dependencias instaladas

## Próximos 3 Pasos

### Paso 1: Crear Storage Bucket (2 min)

En **Supabase Dashboard** → **Storage**:
1. Clic en "New bucket"
2. Nombre: `certificados`
3. Privado (desactivar "Public bucket")
4. Crear

### Paso 2: Subir Imagen (3 min)

En el bucket `certificados`:
1. Clic en "New folder" → nombre: `templates`
2. Entrar en carpeta `templates`
3. Clic en "Upload" → seleccionar cualquier imagen JPG/PNG (recomendado 842x595px)
4. Renombrar a `formato-base.jpg`

   **Nota**: Si no tienes una imagen, puede ser cualquier color sólido o diseño simple

### Paso 3: Ejecutar SQL Migration (1 min)

En **Supabase Dashboard** → **SQL Editor**:

1. Clic en "New query"
2. Copiar TODO el contenido de: `supabase/migrations/20260320000000_certificate_system_v2.sql`
3. Pegar en el editor
4. Clic en botón "Run" (▶)
5. Esperar confirmación (debería decir "Success")

**Eso es todo!** ✅

---

## Validar que Funciona

1. Ir a `/dashboard/cursos/[slug]` (un curso completado)
2. Buscar botón "📄 Descargar Certificado"
3. Hacer clic
4. Debería descargar PDF con:
   - Tu imagen de fondo
   - Tu nombre, RUT
   - Nombre del curso
   - QR code en la esquina superior derecha

**Si descarga 2 veces**: la segunda vez retorna el mismo archivo (idempotencia)

---

## Si Algo Falla

### Error: `Certificado no encontrado`
→ La migración SQL no se ejecutó correctamente. Revisa que no haya errores en el SQL Editor.

### Error: `Error subiendo certificado a Storage`
→ El bucket `certificados` no existe o no está creado como privado

### Error: `Error cargando imagen de fondo`
→ El archivo `formato-base.jpg` no está en `certificados/templates/`

---

## ¿Qué Pasó?

Se reescribió completamente el sistema de certificados usando:
- **pdf-lib**: Librería JavaScript pura (sin dependencias del sistema)
- **Montserrat fonts**: Fuentes TTF profesionales embebidas
- **QR codes**: Validación por código QR
- **JSONB templates**: Diseño flexible por curso (futuro)
- **Idempotencia**: Mismo certificado si descargas 2 veces

Esto reemplazó el antiguo PDFKit que fallaba con errores de fuentes del sistema.
