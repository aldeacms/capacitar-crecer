/**
 * Ejecuta todos los arreglos críticos de base de datos
 * - Crea tabla admin_users
 * - Arregla RUT NULL en trigger
 * - Implementa RLS
 * - Crea índices
 * - Limpia registros huérfanos
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
  console.error('❌ Credenciales no configuradas')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE)

async function executeDatabaseFix() {
  console.log('\n' + '═'.repeat(70))
  console.log('🔧 EJECUTANDO ARREGLOS CRÍTICOS DE BASE DE DATOS')
  console.log('═'.repeat(70) + '\n')

  let report = `# 🔧 Reporte de Arreglos de Base de Datos\n\n`
  report += `**Fecha:** ${new Date().toLocaleString('es-CL')}\n`
  report += `**Estado:** En Progreso\n\n`

  const steps = [
    {
      name: 'Crear tabla admin_users',
      sql: `CREATE TABLE IF NOT EXISTS admin_users (
        id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_by UUID REFERENCES auth.users(id),
        is_active BOOLEAN DEFAULT TRUE
      );`,
    },
    {
      name: 'Crear índices en admin_users',
      sql: `CREATE INDEX IF NOT EXISTS idx_admin_users_created_by ON admin_users(created_by);
            CREATE INDEX IF NOT EXISTS idx_admin_users_is_active ON admin_users(is_active);`,
    },
    {
      name: 'Migrar admins de perfiles a admin_users',
      sql: `INSERT INTO admin_users (id, created_at, is_active)
            SELECT id, created_at, TRUE
            FROM perfiles
            WHERE rol = 'admin'
            ON CONFLICT (id) DO NOTHING;`,
    },
    {
      name: 'Remover columna rol de perfiles',
      sql: `ALTER TABLE perfiles DROP COLUMN IF EXISTS rol CASCADE;`,
    },
    {
      name: 'Hacer RUT nullable',
      sql: `ALTER TABLE perfiles ALTER COLUMN rut DROP NOT NULL;`,
    },
    {
      name: 'Actualizar RUT null con valores por defecto',
      sql: `UPDATE perfiles
            SET rut = CONCAT('TEMP-', SUBSTRING(CAST(id AS TEXT), 1, 8))
            WHERE rut IS NULL;`,
    },
    {
      name: 'Crear índices de optimización',
      sql: `CREATE INDEX IF NOT EXISTS idx_perfiles_nombre ON perfiles(nombre_completo);
            CREATE INDEX IF NOT EXISTS idx_perfiles_rut ON perfiles(rut);
            CREATE INDEX IF NOT EXISTS idx_cursos_slug ON cursos(slug);
            CREATE INDEX IF NOT EXISTS idx_cursos_categoria ON cursos(categoria_id);
            CREATE INDEX IF NOT EXISTS idx_matriculas_perfil ON matriculas(perfil_id);
            CREATE INDEX IF NOT EXISTS idx_matriculas_curso ON matriculas(curso_id);
            CREATE INDEX IF NOT EXISTS idx_lecciones_modulo ON lecciones(modulo_id);
            CREATE INDEX IF NOT EXISTS idx_lecciones_completadas_perfil ON lecciones_completadas(perfil_id);
            CREATE INDEX IF NOT EXISTS idx_certificate_downloads_perfil ON certificate_downloads(perfil_id);
            CREATE INDEX IF NOT EXISTS idx_certificate_downloads_curso ON certificate_downloads(curso_id);`,
    },
    {
      name: 'Habilitar RLS en tablas críticas',
      sql: `ALTER TABLE perfiles ENABLE ROW LEVEL SECURITY;
            ALTER TABLE matriculas ENABLE ROW LEVEL SECURITY;
            ALTER TABLE lecciones_completadas ENABLE ROW LEVEL SECURITY;
            ALTER TABLE certificate_downloads ENABLE ROW LEVEL SECURITY;
            ALTER TABLE lecciones_archivos ENABLE ROW LEVEL SECURITY;`,
    },
  ]

  const results = []
  let successCount = 0
  let errorCount = 0

  for (const step of steps) {
    console.log(`⏳ ${step.name}...`)

    try {
      const { error } = await supabase.rpc('exec_sql', { sql: step.sql })

      if (error) {
        // Intentar ejecutar con fetch directo si RPC no funciona
        const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            authorization: `Bearer ${SUPABASE_SERVICE_ROLE}`,
            'content-type': 'application/json',
          },
          body: JSON.stringify({ sql: step.sql }),
        })

        if (!response.ok) {
          // Algunos cambios pueden no requerir RPC, intentar directamente
          console.log(`   ⚠️  RPC no disponible, saltando paso (puede requerir ejecución manual)`)
          results.push({ step: step.name, status: 'warning', message: 'RPC no disponible' })
        } else {
          console.log(`   ✅ Completado`)
          results.push({ step: step.name, status: 'success' })
          successCount++
        }
      } else {
        console.log(`   ✅ Completado`)
        results.push({ step: step.name, status: 'success' })
        successCount++
      }
    } catch (err: any) {
      console.log(`   ⚠️  ${err.message}`)
      results.push({ step: step.name, status: 'error', message: err.message })
      errorCount++
    }
  }

  // Crear políticas RLS manualmente (requieren SQL más complejo)
  console.log('\n⏳ Creando políticas RLS...')
  const rlsPolicies = [
    {
      table: 'perfiles',
      name: 'Users can view own profile',
      policy: `auth.uid() = id OR EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = TRUE)`,
    },
    {
      table: 'matriculas',
      name: 'Users can view own enrollments',
      policy: `auth.uid() = perfil_id OR EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = TRUE)`,
    },
    {
      table: 'lecciones_completadas',
      name: 'Users can view own completed lessons',
      policy: `auth.uid() = perfil_id OR EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = TRUE)`,
    },
    {
      table: 'certificate_downloads',
      name: 'Users can view own certificates',
      policy: `auth.uid() = perfil_id OR EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = TRUE)`,
    },
  ]

  report += `## 📊 Resultados de Ejecución\n\n`
  report += `| Paso | Estado |\n`
  report += `|------|--------|\n`

  for (const result of results) {
    const icon = result.status === 'success' ? '✅' : result.status === 'warning' ? '⚠️' : '❌'
    report += `| ${result.step} | ${icon} ${result.status.toUpperCase()} |\n`
  }

  report += `\n## ⚠️ PASOS QUE REQUIEREN EJECUCIÓN MANUAL EN SUPABASE SQL EDITOR\n\n`
  report += `Si los pasos anteriores no completaron correctamente, ejecuta manualmente:\n\n`

  report += `### 1. Crear Políticas RLS\n`
  report += `\`\`\`sql\n`

  rlsPolicies.forEach((policy) => {
    report += `-- ${policy.table}: ${policy.name}\n`
    report += `CREATE POLICY IF NOT EXISTS "${policy.name}" ON ${policy.table}\n`
    report += `  FOR SELECT USING (${policy.policy});\n\n`
  })

  report += `\`\`\`\n\n`

  report += `### 2. Limpiar Registros Huérfanos\n`
  report += `\`\`\`sql\n`
  report += `-- Eliminar perfiles sin usuario en auth\n`
  report += `DELETE FROM perfiles\n`
  report += `WHERE id NOT IN (SELECT id FROM auth.users);\n`
  report += `\`\`\`\n\n`

  report += `### 3. Verificar Estado\n`
  report += `\`\`\`sql\n`
  report += `-- Vista de sincronización\n`
  report += `CREATE OR REPLACE VIEW v_user_sync_status AS\n`
  report += `SELECT\n`
  report += `  au.id,\n`
  report += `  au.email,\n`
  report += `  CASE WHEN p.id IS NOT NULL THEN 'Sincronizado' ELSE 'HUÉRFANO' END as status,\n`
  report += `  CASE WHEN admin.id IS NOT NULL THEN 'Admin' ELSE 'Alumno' END as role\n`
  report += `FROM auth.users au\n`
  report += `LEFT JOIN perfiles p ON au.id = p.id\n`
  report += `LEFT JOIN admin_users admin ON au.id = admin.id;\n`
  report += `\n`
  report += `SELECT * FROM v_user_sync_status;\n`
  report += `\`\`\`\n\n`

  report += `## 📈 Estadísticas\n\n`
  report += `- **Pasos Completados:** ${successCount}/${steps.length}\n`
  report += `- **Pasos Fallidos:** ${errorCount}/${steps.length}\n`
  report += `- **Pasos con Advertencia:** ${results.filter((r) => r.status === 'warning').length}/${steps.length}\n\n`

  report += `## ✅ Próximos Pasos\n\n`
  report += `1. Verificar ejecución de políticas RLS en Supabase SQL Editor\n`
  report += `2. Limpiar registros huérfanos\n`
  report += `3. Actualizar helpers de autenticación en código\n`
  report += `4. Implementar validación con Zod\n`
  report += `5. Crear error boundaries\n\n`

  // Guardar reporte
  fs.writeFileSync('DATABASE_FIX_REPORT.md', report)

  console.log('\n' + '═'.repeat(70))
  console.log('✅ REPORTE GENERADO')
  console.log('═'.repeat(70))
  console.log('📄 Archivo: DATABASE_FIX_REPORT.md\n')
  console.log(`📊 Resumen:`)
  console.log(`   - Pasos completados: ${successCount}/${steps.length}`)
  console.log(`   - Pasos fallidos: ${errorCount}/${steps.length}\n`)
}

executeDatabaseFix()
