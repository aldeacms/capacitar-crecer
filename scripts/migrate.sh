#!/bin/bash

# Este script aplica migraciones a Supabase usando la API PostgreSQL
# Nota: Supabase no permite ejecutar SQL raw directamente por seguridad.
# Debes hacer esto manualmente en la consola.

echo "================================"
echo "🔄 APLICAR MIGRACIONES"
echo "================================"
echo ""
echo "⚠️  Supabase no permite ejecutar SQL raw via API por razones de seguridad."
echo ""
echo "PASOS A SEGUIR:"
echo ""
echo "1️⃣  Abre el SQL Editor de Supabase:"
echo "   https://app.supabase.com/project/qablhrycgplkgmzurtke/sql/new"
echo ""
echo "2️⃣  Copia y pega el siguiente SQL:"
echo ""
echo "────────────────────────────────────────────────────────────"
cat << 'SQL'
-- Actualizar enum tipo_acceso para soportar nuevos tipos de cursos
-- Paso 1: Crear nuevo enum con todos los valores
CREATE TYPE tipo_acceso_new AS ENUM ('gratis', 'pago-inmediato', 'pago', 'gratis_cert_pago', 'cotizar');

-- Paso 2: Convertir la columna tipo_acceso al nuevo tipo
ALTER TABLE cursos 
ALTER COLUMN tipo_acceso TYPE tipo_acceso_new USING tipo_acceso::text::tipo_acceso_new;

-- Paso 3: Eliminar el enum viejo
DROP TYPE tipo_acceso;

-- Paso 4: Renombrar el nuevo enum al nombre original
ALTER TYPE tipo_acceso_new RENAME TO tipo_acceso;
SQL
echo "────────────────────────────────────────────────────────────"
echo ""
echo "3️⃣  Presiona 'Run' o Cmd+Enter"
echo ""
echo "4️⃣  Verifica que no haya errores"
echo ""
echo "✅ Una vez completado, el proyecto está listo para usar."
echo ""
