/**
 * AUDITORÍA INTELIGENTE - Analiza estructuras de tablas reales
 * Genera documentación profesional completa
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE!)

// Tablas identificadas del código
const TABLES = [
  'perfiles',
  'auth.users',
  'cursos',
  'modulos',
  'lecciones',
  'matriculas',
  'categorias',
  'cupones',
  'certificate_templates',
  'certificate_downloads',
  'lecciones_archivos',
  'lecciones_completadas',
  'quizzes_preguntas',
  'quizzes_opciones',
  'matriculas_cupones',
  'imagenes_cursos',
  'imagenes_preguntas',
]

async function smartAudit() {
  console.log('\n' + '═'.repeat(70))
  console.log('🔍 AUDITORÍA INTELIGENTE Y PROFESIONAL')
  console.log('═'.repeat(70) + '\n')

  let report = `# 📊 AUDITORÍA COMPLETA DE BASE DE DATOS\n\n`
  report += `**Fecha:** ${new Date().toLocaleString('es-CL')}\n`
  report += `**Proyecto:** Capacitar y Crecer LMS\n`
  report += `**Método:** Análisis directo de tablas + Inspección de código\n\n`

  let erDiagram = `# 📈 Diagrama de Relaciones (ER)\n\n\`\`\`mermaid\nerDiagram\n`

  const tableStructures: any = {}
  const relationships: string[] = []

  // Analizar cada tabla
  console.log('⏳ Analizando estructuras de tablas...\n')

  for (const tableName of TABLES) {
    console.log(`  📌 ${tableName}...`)

    try {
      const { data, error } = await supabase.from(tableName).select('*').limit(1)

      if (error && error.code === 'PGRST202') {
        console.log(`     ⚠️  Tabla no existe o no tiene permisos`)
        continue
      }

      if (error) {
        console.log(`     ⚠️  Error: ${error.message}`)
        continue
      }

      // Obtener estructura desde una fila
      if (data && data.length > 0) {
        const row = data[0]
        const columns = Object.keys(row)

        tableStructures[tableName] = {
          columns: columns,
          sampleData: row,
          rowCount: 0,
        }

        // Obtener conteo
        const { count } = await supabase
          .from(tableName)
          .select('*', { count: 'exact' })
          .limit(0)

        tableStructures[tableName].rowCount = count || 0
      } else {
        // Tabla existe pero está vacía
        const { count } = await supabase
          .from(tableName)
          .select('*', { count: 'exact' })
          .limit(0)

        tableStructures[tableName] = {
          columns: [],
          rowCount: count || 0,
        }
      }
    } catch (err) {
      console.log(`     ❌ Error: ${err}`)
    }
  }

  // Generar documentación
  console.log('\n⏳ Generando documentación...\n')

  report += `## 📋 Tablas de la Base de Datos\n\n`
  report += `**Total de tablas identificadas:** ${Object.keys(tableStructures).length}\n\n`

  // Auth.users es especial
  report += `### 🔐 Sistema de Autenticación\n\n`
  report += `#### Tabla: \`auth.users\` (Supabase Auth)\n\n`
  report += `**Propósito:** Almacena usuarios del sistema de autenticación nativa de Supabase\n\n`
  report += `**Estructura:**\n`
  report += `| Campo | Tipo | Descripción |\n`
  report += `|-------|------|-------------|\n`
  report += `| id | uuid | ID único del usuario |\n`
  report += `| email | text | Email de login |\n`
  report += `| encrypted_password | text | Contraseña hasheada (bcrypt) |\n`
  report += `| email_confirmed_at | timestamp | Fecha confirmación email |\n`
  report += `| banned_until | timestamp | Si es null, usuario activo |\n`
  report += `| created_at | timestamp | Fecha creación |\n`
  report += `| updated_at | timestamp | Última actualización |\n\n`

  // Tablas principales
  report += `### 👥 Datos de Usuario\n\n`
  report += `#### Tabla: \`perfiles\`\n\n`
  report += `**Propósito:** Perfil extendido de usuarios (datos adicionales de auth.users)\n\n`
  if (tableStructures['perfiles']) {
    report += `**Columnas:** ${tableStructures['perfiles'].columns.join(', ')}\n`
    report += `**Filas:** ${tableStructures['perfiles'].rowCount}\n\n`
    if (tableStructures['perfiles'].sampleData) {
      report += `**Estructura:**\n\`\`\`json\n${JSON.stringify(tableStructures['perfiles'].sampleData, null, 2)}\n\`\`\`\n\n`
    }
  }

  // Cursos y contenido
  report += `### 📚 Gestión de Cursos y Contenido\n\n`

  const contentTables = ['cursos', 'categorias', 'modulos', 'lecciones']
  for (const table of contentTables) {
    if (tableStructures[table]) {
      report += `#### Tabla: \`${table}\`\n`
      report += `**Columnas:** ${tableStructures[table].columns.join(', ')}\n`
      report += `**Filas:** ${tableStructures[table].rowCount}\n\n`
    }
  }

  // Enrollments y matrículas
  report += `### 📝 Matriculas y Progreso\n\n`
  const enrollmentTables = ['matriculas', 'lecciones_completadas', 'quizzes_preguntas']
  for (const table of enrollmentTables) {
    if (tableStructures[table]) {
      report += `#### Tabla: \`${table}\`\n`
      report += `**Columnas:** ${tableStructures[table].columns.join(', ')}\n`
      report += `**Filas:** ${tableStructures[table].rowCount}\n\n`
    }
  }

  // Certificados
  report += `### 🎓 Certificados\n\n`
  const certTables = ['certificate_templates', 'certificate_downloads']
  for (const table of certTables) {
    if (tableStructures[table]) {
      report += `#### Tabla: \`${table}\`\n`
      report += `**Columnas:** ${tableStructures[table].columns.join(', ')}\n`
      report += `**Filas:** ${tableStructures[table].rowCount}\n\n`
    }
  }

  // Administración
  report += `### 💰 Administración\n\n`
  const adminTables = ['cupones', 'matriculas_cupones']
  for (const table of adminTables) {
    if (tableStructures[table]) {
      report += `#### Tabla: \`${table}\`\n`
      report += `**Columnas:** ${tableStructures[table].columns.join(', ')}\n`
      report += `**Filas:** ${tableStructures[table].rowCount}\n\n`
    }
  }

  // Relaciones
  report += `## 🔗 Relaciones Identificadas\n\n`
  report += `### Jerarquía de Contenido\n`
  report += `\`Cursos\` → \`Categorias\` (1:N)\n`
  report += `\`Cursos\` → \`Modulos\` (1:N)\n`
  report += `\`Modulos\` → \`Lecciones\` (1:N)\n\n`

  report += `### Matriculas y Progreso\n`
  report += `\`Perfiles\` → \`Matriculas\` (1:N)\n`
  report += `\`Cursos\` → \`Matriculas\` (1:N)\n`
  report += `\`Matriculas\` → \`Lecciones_completadas\` (1:N)\n\n`

  report += `### Certificados\n`
  report += `\`Cursos\` → \`Certificate_templates\` (1:1)\n`
  report += `\`Perfiles\` → \`Certificate_downloads\` (1:N)\n`
  report += `\`Cursos\` → \`Certificate_downloads\` (1:N)\n\n`

  // ER Diagram
  erDiagram += `    CURSOS ||--o{ MODULOS : "contiene"\n`
  erDiagram += `    MODULOS ||--o{ LECCIONES : "contiene"\n`
  erDiagram += `    CURSOS ||--o{ MATRICULAS : "es matriculado"\n`
  erDiagram += `    PERFILES ||--o{ MATRICULAS : "realiza"\n`
  erDiagram += `    MATRICULAS ||--o{ LECCIONES_COMPLETADAS : "completa"\n`
  erDiagram += `    LECCIONES ||--o{ QUIZZES_PREGUNTAS : "contiene"\n`
  erDiagram += `    CURSOS ||--o{ CERTIFICATE_DOWNLOADS : "emite"\n`
  erDiagram += `    PERFILES ||--o{ CERTIFICATE_DOWNLOADS : "recibe"\n`
  erDiagram += `    CURSOS ||--o{ CATEGORIAS : "pertenece"\n`
  erDiagram += `    CURSOS ||--o{ CUPONES : "usa"\n`
  erDiagram += `\`\`\`\n\n`

  // Problemas y recomendaciones
  report += `## ⚠️ Problemas Identificados\n\n`

  // Verificar sincronización
  const { data: authUsers } = await supabase.auth.admin.listUsers()
  const { data: perfiles } = await supabase.from('perfiles').select('id')

  const authIds = new Set(authUsers?.users?.map((u) => u.id) || [])
  const perfilIds = new Set(perfiles?.map((p: any) => p.id) || [])

  const orphanedPerfiles = Array.from(perfilIds).filter((id) => !authIds.has(id as string))
  const orphanedAuth = Array.from(authIds).filter((id) => !perfilIds.has(id))

  report += `### Sincronización auth ↔ perfiles\n`
  if (orphanedPerfiles.length > 0) {
    report += `⚠️ **${orphanedPerfiles.length}** perfil(es) sin usuario en auth.users\n`
  }
  if (orphanedAuth.length > 0) {
    report += `⚠️ **${orphanedAuth.length}** usuario(s) en auth.users sin perfil\n`
  }
  if (orphanedPerfiles.length === 0 && orphanedAuth.length === 0) {
    report += `✅ Sincronización correcta\n`
  }
  report += `\n`

  report += `### Modelo de Admins\n`
  report += `⚠️ **CRÍTICO:** Los admins se identifican por rol en la tabla \`perfiles\`, no hay tabla separada\n`
  report += `- Un alumno convertido a admin tiene acceso total\n`
  report += `- No hay forma de revocar acceso admin sin eliminar el usuario\n\n`

  report += `### Triggers\n`
  report += `⚠️ Trigger \`handle_new_user()\` en auth.users crea perfil automático\n`
  report += `- Crea perfil con rut=NULL (viola constraint NOT NULL)\n`
  report += `- Solución actual: permitir RUT null temporalmente\n\n`

  report += `## ✅ Recomendaciones Críticas\n\n`
  report += `### 1. SEPARAR TABLA DE ADMINS (PRIORIDAD ALTA)\n`
  report += `\`\`\`sql\n`
  report += `CREATE TABLE admin_users (\n`
  report += `  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,\n`
  report += `  created_at TIMESTAMP DEFAULT NOW(),\n`
  report += `  created_by UUID REFERENCES auth.users(id)\n`
  report += `);\n`
  report += `\`\`\`\n\n`

  report += `### 2. FIX AL TRIGGER handle_new_user() (PRIORIDAD ALTA)\n`
  report += `- Proporcionar RUT por defecto o\n`
  report += `- Usar función \`gen_random_uuid()\` para generar RUT temporal\n\n`

  report += `### 3. IMPLEMENTAR ROW LEVEL SECURITY (PRIORIDAD MEDIA)\n`
  report += `- Usuarios solo ven sus matriculas\n`
  report += `- Admins ven todo\n\n`

  report += `### 4. CREAR ÍNDICES PARA BÚSQUEDA (PRIORIDAD MEDIA)\n`
  report += `- Índice en perfiles.email\n`
  report += `- Índice en cursos.slug\n`
  report += `- Índice en matriculas.perfil_id\n\n`

  report += `## 📊 Estadísticas\n\n`
  report += `| Métrica | Valor |\n`
  report += `|---------|-------|\n`
  report += `| Tablas totales | ${Object.keys(tableStructures).length} |\n`
  report += `| Perfiles/Usuarios | ${tableStructures['perfiles']?.rowCount || 0} |\n`
  report += `| Cursos | ${tableStructures['cursos']?.rowCount || 0} |\n`
  report += `| Matriculas | ${tableStructures['matriculas']?.rowCount || 0} |\n`
  report += `| Certificados emitidos | ${tableStructures['certificate_downloads']?.rowCount || 0} |\n\n`

  // Guardar
  fs.writeFileSync('DATABASE_COMPLETE_AUDIT.md', report)
  fs.writeFileSync('ER_DIAGRAM.md', erDiagram)

  console.log('═'.repeat(70))
  console.log('✅ AUDITORÍA COMPLETADA EXITOSAMENTE')
  console.log('═'.repeat(70) + '\n')

  console.log('📄 Archivos generados:')
  console.log('   1. DATABASE_COMPLETE_AUDIT.md  - Documentación completa')
  console.log('   2. ER_DIAGRAM.md              - Diagrama de relaciones\n')

  console.log(`📊 Resumen:`)
  console.log(`   - Tablas analizadas: ${Object.keys(tableStructures).length}`)
  console.log(`   - Sincronización auth: ${orphanedAuth.length === 0 && orphanedPerfiles.length === 0 ? '✅ OK' : '⚠️ Problemas'}`)
  console.log(`   - Problemas encontrados: 3 (Admins, Trigger, RLS)\n`)
}

smartAudit()
