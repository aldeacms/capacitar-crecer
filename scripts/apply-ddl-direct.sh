#!/bin/bash

# Apply DDL commands directly to Supabase PostgreSQL database
# Uses psql with direct connection string

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "\n${BLUE}════════════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}🔧 APLICANDO CAMBIOS DDL DIRECTAMENTE A POSTGRESQL${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════════════${NC}\n"

# Extract connection info from SUPABASE
SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL}"
PROJECT_ID=$(echo $SUPABASE_URL | grep -oP 'https://\K[^.]+')

# Supabase connection string format
# postgresql://postgres:[password]@[project-id].supabase.co:5432/postgres
DB_HOST="${PROJECT_ID}.supabase.co"
DB_PORT="5432"
DB_NAME="postgres"
DB_USER="postgres"
DB_PASSWORD="${SUPABASE_SERVICE_ROLE_KEY:0:30}"  # This is wrong, we need actual password

echo -e "${YELLOW}⚠️  Nota: Se necesita acceso directo a PostgreSQL${NC}"
echo -e "${YELLOW}   Los credenciales de Supabase Service Role no incluyen la contraseña de BD${NC}\n"

echo -e "${BLUE}Intenta una alternativa: ejecuta esto en Supabase SQL Editor:${NC}\n"

cat << 'EOF'
-- Step 1: Drop rol column
ALTER TABLE public.perfiles DROP COLUMN IF EXISTS rol CASCADE;

-- Step 2: Enable RLS
ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matriculas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lecciones_completadas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificate_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lecciones_archivos ENABLE ROW LEVEL SECURITY;

-- Verify changes
SELECT column_name FROM information_schema.columns
WHERE table_name='perfiles' AND column_name='rol';

SELECT tablename, rowsecurity FROM pg_tables
WHERE tablename IN ('perfiles', 'matriculas', 'lecciones_completadas', 'certificate_downloads', 'lecciones_archivos')
ORDER BY tablename;
EOF

echo -e "\n"
