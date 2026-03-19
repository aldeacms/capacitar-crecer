/**
 * Ejecuta todas las queries de auditoría y genera AUDIT_RESULTS.md
 * Uso: npx tsx scripts/run-audit.ts
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
  console.error('❌ Variables de entorno no configuradas')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE)

async function runAudit() {
  console.log('\n🔍 Ejecutando auditoría completa de Supabase...\n')

  let results = `# 📊 Resultados de Auditoría - ${new Date().toLocaleString('es-CL')}\n\n`

  try {
    // 1. Tablas en public
    console.log('⏳ Query 1: Tablas en public...')
    const { data: tables } = await supabase.rpc('get_table_list')
    if (!tables) {
      const { data: tablesRaw } = await supabase.from('information_schema.tables').select('*')
      results += `## 1️⃣  Tablas en Schema Public\n\n\`\`\`\n${JSON.stringify(tablesRaw, null, 2)}\n\`\`\`\n\n`
    }

    // 2. Estructura perfiles
    console.log('⏳ Query 2: Estructura perfiles...')
    const { data: perfilStruct } = await supabase.rpc('get_table_columns', {
      table_name: 'perfiles',
    })
    results += `## 2️⃣  Estructura Tabla: perfiles\n\n\`\`\`\n`
    if (perfilStruct) {
      results += JSON.stringify(perfilStruct, null, 2)
    } else {
      results += 'Error: Use Supabase UI for detailed column info\n'
    }
    results += `\`\`\`\n\n`

    // 3. Usuarios en auth
    console.log('⏳ Query 3: Usuarios en auth.users...')
    const { data: users, error: usersError } = await supabase
      .from('auth.users')
      .select('id, email, email_confirmed_at, created_at, updated_at')
      .order('created_at', { ascending: false })

    results += `## 3️⃣  Usuarios en auth.users\n\n`
    if (usersError) {
      results += `**Error:** ${usersError.message}\n\n`
    } else {
      results += `**Total:** ${users?.length || 0}\n\n\`\`\`json\n${JSON.stringify(users, null, 2)}\n\`\`\`\n\n`
    }

    // 4. Usuarios en perfiles
    console.log('⏳ Query 4: Usuarios en perfiles...')
    const { data: perfiles, error: perfilesError } = await supabase
      .from('perfiles')
      .select('id, rut, nombre_completo, rol, created_at')
      .order('created_at', { ascending: false })

    results += `## 4️⃣  Usuarios en Tabla perfiles\n\n`
    if (perfilesError) {
      results += `**Error:** ${perfilesError.message}\n\n`
    } else {
      results += `**Total:** ${perfiles?.length || 0}\n\n\`\`\`json\n${JSON.stringify(perfiles, null, 2)}\n\`\`\`\n\n`
    }

    // 5. Análisis de sincronización
    console.log('⏳ Query 5: Análisis de sincronización...')
    results += `## 5️⃣  ANÁLISIS: Sincronización (auth vs perfiles)\n\n`

    if (users && perfiles) {
      const authEmails = new Set(users.map((u: any) => u.email))
      const perfilIds = new Set(perfiles.map((p: any) => p.id))

      const enAuthNoEnPerfiles = users.filter((u: any) => !perfilIds.has(u.id))
      const enPerfilesNoEnAuth = perfiles.filter((p: any) => !users.find((u: any) => u.id === p.id))

      results += `### Usuarios en auth.users pero NO en perfiles:\n`
      if (enAuthNoEnPerfiles.length > 0) {
        results += `⚠️  ${enAuthNoEnPerfiles.length} usuario(s) sin perfil:\n\n\`\`\`json\n${JSON.stringify(
          enAuthNoEnPerfiles,
          null,
          2
        )}\n\`\`\`\n\n`
      } else {
        results += `✅ Ninguno (sincronización OK)\n\n`
      }

      results += `### Usuarios en perfiles pero NO en auth.users:\n`
      if (enPerfilesNoEnAuth.length > 0) {
        results += `⚠️  ${enPerfilesNoEnAuth.length} perfil(es) huérfano(s):\n\n\`\`\`json\n${JSON.stringify(
          enPerfilesNoEnAuth,
          null,
          2
        )}\n\`\`\`\n\n`
      } else {
        results += `✅ Ninguno (sincronización OK)\n\n`
      }
    }

    // 6. Hallazgos clave
    console.log('⏳ Generando hallazgos clave...')
    results += `## 🔍 HALLAZGOS CLAVE\n\n`

    if (users && perfiles) {
      const usersConfirmed = users.filter((u: any) => u.email_confirmed_at).length
      const usersNotConfirmed = users.length - usersConfirmed

      results += `- **Usuarios totales (auth):** ${users.length}\n`
      results += `  - Confirmados: ${usersConfirmed}\n`
      results += `  - No confirmados: ${usersNotConfirmed}\n`
      results += `- **Perfiles totales:** ${perfiles.length}\n`
      results += `- **Sincronización:** ${users.length === perfiles.length ? '✅ OK' : '⚠️ DESAJUSTE'}\n\n`
    }

    results += `## 📋 Próximos Pasos\n\n`
    results += `1. Analiza los resultados anteriores\n`
    results += `2. Identifica la causa raíz del error de login\n`
    results += `3. Crea un plan de remediación\n`

    results += `\n---\n**Generado:** ${new Date().toISOString()}\n`

    // Guardar resultados
    const filePath = path.join(process.cwd(), 'AUDIT_RESULTS.md')
    fs.writeFileSync(filePath, results)

    console.log(`\n✅ Auditoría completada!`)
    console.log(`📄 Resultados guardados en: AUDIT_RESULTS.md\n`)

    // Mostrar resumen
    console.log('═══════════════════════════════════════════════════')
    console.log('RESUMEN EJECUTIVO')
    console.log('═══════════════════════════════════════════════════')
    if (users) console.log(`Usuarios en auth: ${users.length}`)
    if (perfiles) console.log(`Perfiles creados: ${perfiles.length}`)
    console.log('═══════════════════════════════════════════════════\n')
  } catch (error) {
    console.error('❌ Error durante auditoría:', error)
    process.exit(1)
  }
}

runAudit()
