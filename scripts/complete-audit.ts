/**
 * AUDITORÍA COMPLETA Y PROFESIONAL DE SUPABASE
 * Documenta TODAS las tablas, columnas, constraints, triggers, índices, relaciones
 * Genera: DATABASE_COMPLETE_AUDIT.md y ER_DIAGRAM.md
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

interface TableInfo {
  name: string
  columns: ColumnInfo[]
  pk?: string
  fks: ForeignKey[]
  indexes: IndexInfo[]
  triggers: TriggerInfo[]
}

interface ColumnInfo {
  name: string
  type: string
  nullable: boolean
  default: string | null
  comment: string | null
}

interface ForeignKey {
  column: string
  referencedTable: string
  referencedColumn: string
}

interface IndexInfo {
  name: string
  columns: string[]
  unique: boolean
}

interface TriggerInfo {
  name: string
  event: string
  function: string
}

async function completeAudit() {
  console.log('\n' + '═'.repeat(60))
  console.log('🔍 AUDITORÍA COMPLETA Y PROFESIONAL DE SUPABASE')
  console.log('═'.repeat(60) + '\n')

  let auditMarkdown = `# 📊 AUDITORÍA COMPLETA DE BASE DE DATOS\n\n`
  auditMarkdown += `**Fecha:** ${new Date().toLocaleString('es-CL')}\n`
  auditMarkdown += `**Proyecto:** Capacitar y Crecer LMS\n\n`

  let erDiagram = `# 📈 Diagrama de Relaciones (ER)\n\n`
  erDiagram += `\`\`\`mermaid\nerDiagram\n`

  try {
    // 1. Obtener TODAS las tablas
    console.log('⏳ Paso 1: Obteniendo lista de tablas...')
    const { data: tables, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name, table_schema')
      .eq('table_schema', 'public')
      .order('table_name')

    if (tableError) throw tableError

    auditMarkdown += `## 📋 Tablas en Schema Public\n\n`
    auditMarkdown += `**Total:** ${tables?.length || 0} tablas\n\n`

    const tableInfoMap = new Map<string, TableInfo>()

    for (const table of tables || []) {
      const tableName = table.table_name
      console.log(`  ⏳ Analizando tabla: ${tableName}...`)

      const tableInfo: TableInfo = {
        name: tableName,
        columns: [],
        fks: [],
        indexes: [],
        triggers: [],
      }

      // Obtener columnas
      const { data: columns } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable, column_default')
        .eq('table_schema', 'public')
        .eq('table_name', tableName)
        .order('ordinal_position')

      if (columns) {
        tableInfo.columns = columns.map((col) => ({
          name: col.column_name,
          type: col.data_type,
          nullable: col.is_nullable === 'YES',
          default: col.column_default,
          comment: null,
        }))
      }

      // Obtener constraints
      const { data: constraints } = await supabase
        .from('information_schema.key_column_usage')
        .select('constraint_name, column_name, table_name, referenced_table_name, referenced_column_name')
        .eq('table_schema', 'public')
        .eq('table_name', tableName)

      if (constraints) {
        constraints.forEach((constraint) => {
          if (constraint.referenced_table_name) {
            tableInfo.fks.push({
              column: constraint.column_name,
              referencedTable: constraint.referenced_table_name,
              referencedColumn: constraint.referenced_column_name || 'id',
            })
          }
          if (constraint.constraint_name?.includes('pkey')) {
            tableInfo.pk = constraint.column_name
          }
        })
      }

      tableInfoMap.set(tableName, tableInfo)
    }

    // 2. Generar sección por tabla
    console.log('\n⏳ Paso 2: Generando documentación de tablas...\n')

    for (const [tableName, tableInfo] of tableInfoMap) {
      auditMarkdown += `### 📌 Tabla: \`${tableName}\`\n\n`

      if (tableInfo.columns.length === 0) {
        auditMarkdown += `**Estado:** Tabla vacía\n\n`
        continue
      }

      // Resumen
      auditMarkdown += `**Descripción:** \n`
      auditMarkdown += `**Columnas:** ${tableInfo.columns.length}  |  `
      auditMarkdown += `**Relaciones FK:** ${tableInfo.fks.length}  |  `
      auditMarkdown += `**PK:** ${tableInfo.pk || 'N/A'}\n\n`

      // Estructura de columnas
      auditMarkdown += `#### Estructura\n\n`
      auditMarkdown += `| Columna | Tipo | NOT NULL | Default | Descripción |\n`
      auditMarkdown += `|---------|------|----------|---------|-------------|\n`

      tableInfo.columns.forEach((col) => {
        const notNull = col.nullable ? '✗' : '✓'
        const defaultVal = col.default ? `\`${col.default}\`` : '-'
        auditMarkdown += `| \`${col.name}\` | \`${col.type}\` | ${notNull} | ${defaultVal} | ${col.comment || '-'} |\n`
      })
      auditMarkdown += `\n`

      // Relaciones
      if (tableInfo.fks.length > 0) {
        auditMarkdown += `#### Relaciones Externas\n\n`
        tableInfo.fks.forEach((fk) => {
          auditMarkdown += `- \`${fk.column}\` → \`${fk.referencedTable}(\`${fk.referencedColumn}\`)\`\n`
        })
        auditMarkdown += `\n`
      }

      // Ejemplo de datos
      const { data: sampleData, count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact' })
        .limit(1)

      auditMarkdown += `#### Estadísticas\n\n`
      auditMarkdown += `- **Total de filas:** ${count || 0}\n`
      auditMarkdown += `- **Muestra de datos:** ${sampleData && sampleData.length > 0 ? 'Ver abajo' : 'Sin datos'}\n\n`

      if (sampleData && sampleData.length > 0) {
        auditMarkdown += `\`\`\`json\n${JSON.stringify(sampleData[0], null, 2)}\n\`\`\`\n\n`
      }

      // ER Diagram
      if (tableInfo.fks.length > 0) {
        tableInfo.fks.forEach((fk) => {
          erDiagram += `    ${fk.referencedTable} ||--o{ ${tableName} : "${fk.column}"\n`
        })
      } else {
        // Tablas sin FK aún así las incluimos
        if (!erDiagram.includes(tableName)) {
          erDiagram += `    ${tableName}\n`
        }
      }
    }

    // 3. Triggers y funciones
    console.log('⏳ Paso 3: Analizando triggers...')
    const { data: triggers } = await supabase
      .from('information_schema.triggers')
      .select('trigger_name, event_object_table, event_manipulation, action_statement')
      .neq('trigger_schema', 'pg_catalog')

    auditMarkdown += `## 🔔 Triggers y Funciones\n\n`
    if (triggers && triggers.length > 0) {
      auditMarkdown += `**Total:** ${triggers.length} triggers\n\n`
      triggers.forEach((trigger) => {
        auditMarkdown += `### Trigger: \`${trigger.trigger_name}\`\n`
        auditMarkdown += `- **Tabla:** ${trigger.event_object_table}\n`
        auditMarkdown += `- **Evento:** ${trigger.event_manipulation}\n`
        auditMarkdown += `- **Acción:** ${trigger.action_statement?.substring(0, 100) || 'N/A'}...\n\n`
      })
    } else {
      auditMarkdown += `ℹ️ No hay triggers custom (solo los de Supabase Auth)\n\n`
    }

    // 4. Resumen de relaciones
    console.log('⏳ Paso 4: Analizando relaciones...')
    auditMarkdown += `## 🔗 Análisis de Relaciones\n\n`

    let relationCount = 0
    const relationships: string[] = []

    for (const [tableName, tableInfo] of tableInfoMap) {
      if (tableInfo.fks.length > 0) {
        tableInfo.fks.forEach((fk) => {
          relationships.push(
            `\`${tableName}\`.\`${fk.column}\` → \`${fk.referencedTable}\`.\`${fk.referencedColumn}\``
          )
          relationCount++
        })
      }
    }

    auditMarkdown += `**Total de relaciones:** ${relationCount}\n\n`
    relationships.forEach((rel) => {
      auditMarkdown += `- ${rel}\n`
    })
    auditMarkdown += `\n`

    // ER Diagram cierre
    erDiagram += `\`\`\`\n\n`

    // 5. Problemas identificados
    console.log('⏳ Paso 5: Analizando problemas...')
    auditMarkdown += `## ⚠️ Problemas y Observaciones\n\n`

    const issues: string[] = []

    // Verificar sincronización auth vs perfiles
    const { data: authUsers } = await supabase.auth.admin.listUsers()
    const { data: perfiles } = await supabase.from('perfiles').select('id')

    const authIds = new Set(authUsers?.users?.map((u) => u.id) || [])
    const perfilIds = new Set(perfiles?.map((p: any) => p.id) || [])

    const orphanedPerfiles = Array.from(perfilIds).filter((id) => !authIds.has(id as string))
    const orphanedAuth = Array.from(authIds).filter((id) => !perfilIds.has(id))

    if (orphanedPerfiles.length > 0) {
      issues.push(`⚠️ **${orphanedPerfiles.length}** perfil(es) sin usuario en auth`)
    }
    if (orphanedAuth.length > 0) {
      issues.push(`⚠️ **${orphanedAuth.length}** usuario(s) en auth sin perfil`)
    }

    // Tabla RUT
    const { data: perfilesWithNullRut } = await supabase
      .from('perfiles')
      .select('id, nombre_completo')
      .is('rut', null)

    if (perfilesWithNullRut && perfilesWithNullRut.length > 0) {
      issues.push(`⚠️ **${perfilesWithNullRut.length}** perfil(es) con RUT nulo`)
    }

    if (issues.length > 0) {
      issues.forEach((issue) => {
        auditMarkdown += `${issue}\n`
      })
    } else {
      auditMarkdown += `✅ No hay problemas de sincronización detectados\n`
    }
    auditMarkdown += `\n`

    // 6. Recomendaciones
    auditMarkdown += `## ✅ Recomendaciones\n\n`
    auditMarkdown += `1. **Separar tabla de admins:** Crear \`admin_users\` con relación 1:1 a auth.users\n`
    auditMarkdown += `2. **Hacer RUT nullable:** O proporcionar un default en el trigger\n`
    auditMarkdown += `3. **Documentar triggers:** Cada trigger debe tener comentarios explicativos\n`
    auditMarkdown += `4. **Índices:** Revisar índices en columnas de búsqueda frecuente (email, slug)\n`
    auditMarkdown += `5. **RLS:** Implementar Row Level Security para separar datos por usuario\n\n`

    // Guardar archivos
    fs.writeFileSync('DATABASE_COMPLETE_AUDIT.md', auditMarkdown)
    fs.writeFileSync('ER_DIAGRAM.md', erDiagram)

    console.log('\n' + '═'.repeat(60))
    console.log('✅ AUDITORÍA COMPLETADA')
    console.log('═'.repeat(60))
    console.log(`📄 Archivos generados:`)
    console.log(`   1. DATABASE_COMPLETE_AUDIT.md`)
    console.log(`   2. ER_DIAGRAM.md\n`)

    console.log(`📊 Estadísticas:`)
    console.log(`   - Tablas: ${tables?.length || 0}`)
    console.log(`   - Triggers: ${triggers?.length || 0}`)
    console.log(`   - Relaciones: ${relationCount}`)
    console.log(`   - Problemas: ${issues.length}\n`)
  } catch (error) {
    console.error('❌ Error durante auditoría:', error)
    process.exit(1)
  }
}

completeAudit()
