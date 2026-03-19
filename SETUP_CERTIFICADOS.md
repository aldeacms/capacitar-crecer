# 🎓 Setup del Sistema de Certificados v2

## Estado Actual ✅
- ✅ Dependencias instaladas: `pdf-lib`, `@pdf-lib/fontkit`, `qrcode`
- ✅ Fuentes descargadas: `/public/fonts/Montserrat-*.ttf`
- ✅ Código implementado: `src/lib/certificados/` + `src/actions/certificados.ts`
- ✅ Build sin errores: `npm run build` pasó exitosamente
- ⏳ **Pendiente**: Configuración en Supabase

## Pasos Necesarios en Supabase

### 1️⃣ Crear Storage Bucket

En **Storage** → **Buckets**:
1. Crear bucket llamado `certificados`
2. Configurar como **Privado** (no público)
3. Opcional: configurar CORS si es necesario

### 2️⃣ Subir Imagen de Fondo

1. Descargar o crear una imagen JPG (recomendado: 842×595px, tamaño A4 horizontal)
   - Puede ser simple (fondo blanco con borde) o profesional con diseño
2. En el bucket `certificados`:
   - Crear carpeta `templates`
   - Subir imagen como `formato-base.jpg`

   Path final: `certificados/templates/formato-base.jpg`

### 3️⃣ Ejecutar Migración SQL

En **SQL Editor** de Supabase:

1. Copiar el contenido completo de: `supabase/migrations/20260320000000_certificate_system_v2.sql`
2. Pegar en el editor SQL
3. Ejecutar (botón "Run")
4. Confirmar que no hay errores

La migración:
- Crea tabla `certificate_templates` con plantilla global
- Agrega columnas a `certificate_downloads`: `storage_path`, `template_id`, `fecha_vigencia`, `version`, `invalidado_at`, `invalidado_por`
- Configura RLS policies
- Inserta template global por defecto

## Después de Completar Setup ✅

1. Refrescar la app en el navegador
2. Ir a un curso que tengas completado (100%)
3. Hacer clic en "📄 Descargar Certificado"
4. El PDF debería descargar automáticamente con:
   - Imagen de fondo (formato-base.jpg)
   - Datos del alumno (nombre, RUT)
   - Título del curso y duración
   - Fechas de emisión y vigencia (2 años)
   - QR code para validación

## Validación

### Idempotencia
Descarga el certificado 2 veces:
- Primera vez: genera nuevo
- Segunda vez: retorna el mismo certificado (sin generar otro)

### QR
1. En el PDF, escanea el QR code
2. Se abre: `/validar-certificado/{id}`
3. Muestra datos del alumno y curso

### Errores Comunes

| Error | Causa | Solución |
|-------|-------|----------|
| `Certificado no encontrado` | Migración no ejecutada | Ejecutar SQL migration en Supabase |
| `Error subiendo certificado a Storage` | Bucket no existe o sin permisos | Crear bucket `certificados` privado |
| `Error cargando imagen de fondo` | Imagen no existe en Storage | Subir `formato-base.jpg` a `certificados/templates/` |
| `Error en resolveTemplate` | Template no en BD | Migración se inserta automáticamente |

## Siguiente Fase (Opcional)

Después de validar que funciona:
1. **Personalizar diseño por curso**: Crear templates específicos por curso (colores, posiciones, firmantes)
2. **Admin panel**: UI para subir imágenes de fondo y ajustar posiciones
3. **Validación mejorada**: Dashboard de validación para admins
