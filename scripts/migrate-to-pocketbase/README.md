# Migración de Supabase a PocketBase

Este directorio contiene scripts y documentación para migrar la base de datos y archivos de Supabase a PocketBase.

## Estructura

```
scripts/migrate-to-pocketbase/
├── README.md                 # Esta documentación
├── package.json              # Dependencias Node.js (Supabase JS, PocketBase JS)
├── tsconfig.json             # Configuración TypeScript
├── src/
│   ├── index.ts              # Punto de entrada principal
│   ├── supabase-exporter.ts  # Exportador de datos de Supabase
│   ├── pocketbase-importer.ts # Importador a PocketBase
│   ├── schema-mapper.ts      # Mapeo de esquemas entre Supabase y PocketBase
│   └── types.ts              # Tipos TypeScript compartidos
├── data/
│   ├── exported/             # Datos exportados de Supabase (JSON)
│   └── transformed/          # Datos transformados para PocketBase
└── logs/                     # Logs de ejecución
```

## Requisitos Previos

1. **Node.js 18+** y **npm**
2. **Docker** (para ejecutar PocketBase localmente)
3. **Credenciales de Supabase**:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. **Credenciales de PocketBase**:
   - `POCKETBASE_URL`
   - `POCKETBASE_ADMIN_EMAIL`
   - `POCKETBASE_ADMIN_PASSWORD`

## Proceso de Migración

### Fase 1: Preparación
```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales
```

### Fase 2: Exportación de Supabase
```bash
# Exportar datos de todas las tablas
npm run export:supabase

# Exportar archivos de Storage
npm run export:storage
```

### Fase 3: Transformación de Datos
```bash
# Transformar esquema de Supabase a PocketBase
npm run transform:schema

# Transformar datos (relaciones, tipos, etc.)
npm run transform:data
```

### Fase 4: Importación a PocketBase
```bash
# Iniciar PocketBase local (Docker)
docker-compose -f ../docker-compose.pb.yml up -d pocketbase

# Crear colecciones en PocketBase
npm run import:schema

# Importar datos
npm run import:data

# Importar archivos
npm run import:files
```

### Fase 5: Validación
```bash
# Verificar integridad de datos
npm run validate

# Generar reporte de migración
npm run report
```

## Mapeo de Esquemas

### Tablas de Supabase → Colecciones de PocketBase

| Supabase Table | PocketBase Collection | Notas |
|----------------|------------------------|-------|
| `auth.users` | `users` | PocketBase tiene sistema de auth integrado |
| `perfiles` | `profiles` | Relación 1:1 con users |
| `cursos` | `courses` | Campos similares |
| `modulos` | `modules` | Relación con courses |
| `lecciones` | `lessons` | Relación con modules |
| `matriculas` | `enrollments` | Relación users + courses |
| `quizzes_preguntas` | `quiz_questions` | Tipos de preguntas mapeados |
| `quizzes_opciones` | `quiz_options` | Relación con questions |
| `certificate_templates` | `certificate_templates` | Archivos PDF en storage |
| `certificate_downloads` | `certificate_issues` | Relación users + courses |
| `admin_users` | `admin_users` | Tabla separada para permisos |
| `cupones` | `coupons` | Lógica similar |
| `pagos` | `payments` | Estados mapeados |

### Consideraciones Especiales

1. **Autenticación**: PocketBase maneja auth internamente, necesitamos migrar contraseñas hasheadas.
2. **Storage**: Los archivos en Supabase Storage deben migrarse a PocketBase Files.
3. **RLS → Permisos**: Las políticas RLS se convierten en reglas de permisos de PocketBase.
4. **Funciones SQL**: Las funciones PostgreSQL (`create_new_user`, `delete_user_transactional`) deben reimplementarse como hooks de PocketBase.

## Scripts Principales

### `src/supabase-exporter.ts`
```typescript
// Exporta datos de Supabase a archivos JSON
// Maneja paginación, relaciones y archivos binarios
```

### `src/pocketbase-importer.ts`
```typescript
// Importa datos a PocketBase vía API REST
// Crea colecciones, campos, y registros
// Maneja archivos adjuntos
```

### `src/schema-mapper.ts`
```typescript
// Define el mapeo entre esquemas
// Transforma tipos de datos (timestamp → datetime)
// Ajusta relaciones (foreign keys → collection fields)
```

## Variables de Entorno

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# PocketBase
POCKETBASE_URL=http://localhost:8090
POCKETBASE_ADMIN_EMAIL=admin@example.com
POCKETBASE_ADMIN_PASSWORD=ChangeMe123!

# Configuración
BATCH_SIZE=1000
LOG_LEVEL=info
DATA_DIR=./data
```

## Solución de Problemas

### Error: "Cannot connect to Supabase"
- Verifica credenciales de service role
- Asegúrate de que la IP esté whitelisted en Supabase

### Error: "PocketBase authentication failed"
- Verifica admin email/password
- PocketBase debe estar ejecutándose y accesible

### Error: "Duplicate record"
- Usa `--force` para sobrescribir
- O `--skip-existing` para saltar duplicados

### Error: "File upload failed"
- Verifica límites de tamaño en PocketBase
- Asegúrate de que la ruta de archivo exista

## Próximos Pasos

1. **Migración incremental**: Migrar tenant por tenant
2. **Período de ejecución dual**: Enviar datos a ambos sistemas
3. **Validación en producción**: Comparar resultados
4. **Corte definitivo**: Cambiar tráfico a PocketBase

## Referencias

- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
- [PocketBase JavaScript SDK](https://github.com/pocketbase/js-sdk)
- [PocketBase API Documentation](https://pocketbase.io/docs)