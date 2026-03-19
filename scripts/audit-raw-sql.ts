/**
 * Auditoría usando SQL RAW contra Supabase
 * Ejecuta queries directamente sin limitaciones del SDK
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

async function auditRawSQL() {
  console.log('\n🔍 Ejecutando Auditoría con SQL RAW...\n')

  let report = `# 📊 Auditoría Profesional - ${new Date().toLocaleString('es-CL')}\n\n`

  try {
    // Query 1: Contar usuarios en auth
    console.log('⏳ Contando usuarios en auth.users...')
    const authResult = await fetch(`${SUPABASE_URL}/rest/v1/rpc/count_auth_users`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${SUPABASE_SERVICE_ROLE}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({}),
    })

    // Query 2: Obtener trigger details
    console.log('⏳ Buscando triggers...')
    const { data: triggerData } = await supabase.rpc('get_triggers_list')

    // Query 3: Estructura perfiles - usando query directo a tabla pública
    console.log('⏳ Analizando tabla perfiles...')
    const { data: perfiles, count: perfilesCount } = await supabase
      .from('perfiles')
      .select('*', { count: 'exact' })

    // Query 4: Intentar obtener auth.users de otra forma
    console.log('⏳ Intentando acceder a auth.users...')
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()

    report += `## 1️⃣  TABLA: perfiles\n\n`
    report += `**Total de registros:** ${perfilesCount || perfiles?.length || 0}\n\n`

    if (perfiles && perfiles.length > 0) {
      report += `**Estructura y datos:**\n\n\`\`\`json\n${JSON.stringify(perfiles, null, 2)}\n\`\`\`\n\n`

      // Análisis
      report += `**Análisis de perfiles:**\n`
      perfiles.forEach((p: any) => {
        report += `- ${p.nombre_completo} (${p.rol}) - RUT: ${p.rut}\n`
      })
      report += `\n`
    }

    // Información de auth
    report += `## 2️⃣  AUTH.USERS (Usuario Admin)\n\n`
    if (authError) {
      report += `**Error:** ${authError.message}\n\n`
    } else if (authUsers && authUsers.users.length > 0) {
      report += `**Total usuarios:** ${authUsers.users.length}\n\n`
      report += `\`\`\`json\n`
      authUsers.users.forEach((u: any) => {
        report += JSON.stringify(
          {
            id: u.id,
            email: u.email,
            email_confirmed_at: u.email_confirmed_at,
            created_at: u.created_at,
          },
          null,
          2
        )
        report += '\n'
      })
      report += `\`\`\`\n\n`
    }

    // Análisis de desajustes
    report += `## 3️⃣  ANÁLISIS DE DESAJUSTES\n\n`

    if (authUsers && perfiles) {
      const authIds = new Set(authUsers.users.map((u: any) => u.id))
      const perfilIds = new Set(perfiles.map((p: any) => p.id))

      const enAuthNoEnPerfiles = authUsers.users.filter((u: any) => !perfilIds.has(u.id))
      const enPerfilesNoEnAuth = perfiles.filter((p: any) => !authIds.has(p.id))

      report += `### Auth sin Perfil:\n`
      if (enAuthNoEnPerfiles.length > 0) {
        report += `⚠️  **${enAuthNoEnPerfiles.length}** usuario(s):\n`
        enAuthNoEnPerfiles.forEach((u: any) => {
          report += `- ${u.email} (id: ${u.id})\n`
        })
      } else {
        report += `✅ Ninguno\n`
      }
      report += `\n`

      report += `### Perfil sin Auth:\n`
      if (enPerfilesNoEnAuth.length > 0) {
        report += `⚠️  **${enPerfilesNoEnAuth.length}** perfil(es):\n`
        enPerfilesNoEnAuth.forEach((p: any) => {
          report += `- ${p.nombre_completo} (id: ${p.id})\n`
        })
      } else {
        report += `✅ Ninguno\n`
      }
      report += `\n`
    }

    // Problema identificado
    report += `## 🔍 PROBLEMA IDENTIFICADO\n\n`
    report += `**El usuario daniel@luam.cl existe en auth.users pero el login falla.**\n\n`
    report += `Posibles causas:\n`
    report += `1. Email no confirmado (verificar \`email_confirmed_at\`)\n`
    report += `2. Usuario baneado (verificar \`banned_until\`)\n`
    report += `3. Problema con hashing de contraseña\n`
    report += `4. Política RLS bloqueando la lectura\n\n`

    report += `## ✅ SOLUCIÓN RECOMENDADA\n\n`
    report += `Ejecutar en Supabase SQL Editor:\n\`\`\`sql\n`
    report += `-- Verificar estado exacto del usuario\n`
    report += `SELECT id, email, email_confirmed_at, banned_until, raw_app_meta_data\n`
    report += `FROM auth.users WHERE email = 'daniel@luam.cl';\n`
    report += `\`\`\`\n\n`

    // Guardar
    fs.writeFileSync('AUDIT_RESULTS.md', report)
    console.log('\n✅ Auditoría completada!')
    console.log('📄 Resultados en: AUDIT_RESULTS.md\n')

    // Mostrar resumen
    console.log('═══════════════════════════════════════════════════')
    console.log('📊 RESUMEN')
    console.log('═══════════════════════════════════════════════════')
    console.log(`Usuarios en auth: ${authUsers?.users.length || 0}`)
    console.log(`Perfiles creados: ${perfiles?.length || 0}`)
    console.log('═══════════════════════════════════════════════════\n')
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

auditRawSQL()
