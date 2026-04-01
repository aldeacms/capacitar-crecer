# Configuración Local de PocketBase

Para completar la migración local de Supabase a PocketBase, necesitas ejecutar un servidor PocketBase localmente. Sigue estos pasos:

## 1. Descargar PocketBase

### Opción A: Descargar binario (recomendado)

**macOS (Apple Silicon):**
```bash
cd /Users/daniel/Desktop/Vibe\ Coding/Capacitar\ y\ Crecer
mkdir -p pocketbase
cd pocketbase
curl -L -o pocketbase.zip https://github.com/pocketbase/pocketbase/releases/download/v0.26.8/pocketbase_0.26.8_darwin_arm64.zip
unzip pocketbase.zip
chmod +x pocketbase
```

**macOS (Intel):**
```bash
cd /Users/daniel/Desktop/Vibe\ Coding/Capacitar\ y\ Crecer
mkdir -p pocketbase
cd pocketbase
curl -L -o pocketbase.zip https://github.com/pocketbase/pocketbase/releases/download/v0.26.8/pocketbase_0.26.8_darwin_amd64.zip
unzip pocketbase.zip
chmod +x pocketbase
```

### Opción B: Instalar via Homebrew
```bash
brew tap pocketbase/pocketbase
brew install pocketbase
```

### Opción C: Usar Docker (si tienes Docker instalado)
```bash
docker run -d \
  --name pocketbase \
  -p 8090:8090 \
  -v ./pocketbase/pb_data:/pb/pb_data \
  -v ./pocketbase/pb_public:/pb/pb_public \
  pocketbase/pocketbase:latest
```

## 2. Iniciar PocketBase

### Configuración inicial:
```bash
cd /Users/daniel/Desktop/Vibe\ Coding/Capacitar\ y\ Crecer
# Iniciar PocketBase (se ejecutará en http://localhost:8090)
./pocketbase/pocketbase serve --http="localhost:8090"
```

**Nota:** La primera vez que inicies PocketBase, deberás:
1. Abrir http://localhost:8090/_/ en tu navegador
2. Crear una cuenta de administrador (configura email y contraseña)
3. Anotar las credenciales y configurarlas en `.env.local`:
   ```
   POCKETBASE_ADMIN_EMAIL=tu_email@ejemplo.com
   POCKETBASE_ADMIN_PASSWORD=tu_password_seguro
   ```

## 3. Crear las colecciones necesarias

PocketBase necesita las siguientes colecciones (equivalentes a las tablas de Supabase):

### Colección `perfiles`
- **Campos:**
  - `id` (Texto, relación con `users`)
  - `nombre_completo` (Texto)
  - `rut` (Texto)
  - `telefono` (Texto, opcional)
  - `rol` (Texto, opciones: `admin`, `alumno`)
  - `user` (Relación, colección: `users`)
  - `created` (Fecha)
  - `updated` (Fecha)

### Colección `admin_users` (opcional)
- **Campos:**
  - `id` (Texto, relación con `users`)
  - `created` (Fecha)

### Colección `cursos`
- **Campos:** (mantener estructura similar a Supabase)

### Colección `matriculas`
- **Campos:** (mantener estructura similar)

## 4. Configuración automática (script)

Ejecuta el siguiente script para configurar PocketBase automáticamente:

```bash
# Crear script de configuración
cat > scripts/setup-pocketbase-local.sh << 'EOF'
#!/bin/bash
set -e

echo "Iniciando configuración de PocketBase local..."

# Crear directorio de datos
mkdir -p pocketbase/pb_data

# Iniciar PocketBase en segundo plano (si no está corriendo)
if ! lsof -i:8090 | grep -q pocketbase; then
  echo "Iniciando PocketBase en puerto 8090..."
  ./pocketbase/pocketbase serve --http="localhost:8090" &
  PB_PID=$!
  echo "PocketBase iniciado con PID: $PB_PID"
  sleep 5
fi

echo "Configuración completada. PocketBase disponible en http://localhost:8090"
EOF

chmod +x scripts/setup-pocketbase-local.sh
./scripts/setup-pocketbase-local.sh
```

## 5. Variables de entorno para desarrollo

Asegúrate de que tu `.env.local` tenga:

```bash
NEXT_PUBLIC_POCKETBASE_URL=http://localhost:8090
POCKETBASE_ADMIN_EMAIL=admin@local.dev
POCKETBASE_ADMIN_PASSWORD=admin123
```

## 6. Verificar conexión

Puedes verificar que PocketBase está funcionando:

```bash
curl http://localhost:8090/api/health
# Debería responder: {"code":200,"message":"OK","data":{}}

# Verificar colecciones
curl http://localhost:8090/api/collections \
  -H "Authorization: Bearer $(curl -X POST http://localhost:8090/api/admins/auth-with-password \
    -d '{"identity":"'"$POCKETBASE_ADMIN_EMAIL"'","password":"'"$POCKETBASE_ADMIN_PASSWORD"'"}' \
    | jq -r .token)"
```

## 7. Migrar datos (opcional para desarrollo)

Para migrar datos de Supabase a PocketBase local:

1. Exporta datos de Supabase usando el script en `scripts/migracion-supabase-a-pocketbase.md`
2. Transforma el esquema
3. Importa a PocketBase usando la API admin

## Notas importantes

- PocketBase usa SQLite embebido, los datos se guardan en `pocketbase/pb_data/data.db`
- La interfaz admin está en `http://localhost:8090/_/`
- Para desarrollo, puedes reiniciar PocketBase cuando quieras
- Las migraciones de código ya están implementadas (login, registro, admin layout, perfiles)

## Siguientes pasos

Una vez que PocketBase esté ejecutándose localmente:

1. **Probar autenticación:** Visita `http://localhost:3000/login` e intenta iniciar sesión
2. **Probar registro:** Visita `http://localhost:3000/registro` y crea un nuevo usuario
3. **Probar admin:** Visita `http://localhost:3000/admin` (requiere usuario admin)

Si encuentras problemas, revisa los logs de PocketBase y verifica las variables de entorno.

---

**Estado actual de la migración:**
- ✅ Clientes PocketBase implementados
- ✅ Páginas de login y registro migradas
- ✅ Layout de admin migrado
- ✅ Endpoint /api/perfiles migrado
- ⏳ Pendiente: Server Actions de usuarios
- ⏳ Pendiente: Migración completa de datos