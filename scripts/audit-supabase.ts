/**
 * Auditoría Completa de Supabase - SQL RAW
 * Propósito: Mapear estructura, triggers, constraints y estado de usuarios
 * Ejecución: npx tsx scripts/audit-supabase.ts
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
  console.error('❌ Variables de entorno no configuradas')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE)

async function auditSupabase() {
  console.log('\n📋 ═══════════════════════════════════════════════════')
  console.log('     AUDITORÍA COMPLETA - CAPACITAR Y CRECER')
  console.log('═══════════════════════════════════════════════════\n')

  try {
    // 1. LISTAR TABLAS EN SCHEMA PUBLIC
    console.log('1️⃣  TABLAS EN EL SCHEMA PUBLIC\n')
    const { data: tables, error: tablesError } = await supabase.rpc('get_all_tables')

    if (tables && !tablesError) {
      tables.forEach((table: any) => {
        console.log(`   📊 ${table.table_name}`)
      })
    } else {
      console.log('   ℹ️  (Query via Supabase UI)\n')
    }

    // 2. ESTRUCTURA DE PERFILES
    console.log('\n2️⃣  ESTRUCTURA DE TABLA PERFILES\n')
    const { data: perfilColumns, error: perfilError } = await supabase.rpc('get_table_schema', {
      table_name: 'perfiles',
    })

    if (perfilError) {
      console.log('   Ejecutar en SQL Editor:')
      console.log('   SELECT column_name, data_type, is_nullable')
      console.log('   FROM information_schema.columns')
      console.log('   WHERE table_name = "perfiles"')
      console.log('   ORDER BY ordinal_position;\n')
    }

    // 3. ESTRUCTURA DE AUTH.USERS
    console.log('\n3️⃣  ESTRUCTURA DE AUTH.USERS\n')
    console.log('   Ejecutar en SQL Editor:')
    console.log('   SELECT column_name, data_type, is_nullable')
    console.log('   FROM information_schema.columns')
    console.log('   WHERE table_schema = "auth" AND table_name = "users"')
    console.log('   ORDER BY ordinal_position;\n')

    // 4. LISTA DE TRIGGERS
    console.log('\n4️⃣  TRIGGERS EN LA BASE DE DATOS\n')
    console.log('   Ejecutar en SQL Editor:')
    console.log('   SELECT trigger_name, event_object_table, event_manipulation')
    console.log('   FROM information_schema.triggers')
    console.log('   WHERE trigger_schema NOT IN ("pg_catalog", "information_schema");\n')

    // 5. USUARIOS EN AUTH
    console.log('\n5️⃣  USUARIOS EN AUTH.USERS\n')
    const { data: users, error: usersError } = await supabase
      .from('auth.users')
      .select('id, email, email_confirmed_at, created_at')

    if (usersError) {
      console.log(`   ⚠️  Error accediendo auth.users: ${usersError.message}`)
      console.log('   Ejecutar en SQL Editor:\n')
      console.log('   SELECT id, email, email_confirmed_at, created_at')
      console.log('   FROM auth.users;\n')
    } else {
      console.log(`   Total de usuarios: ${users?.length || 0}\n`)
      users?.forEach((user: any) => {
        const confirmed = user.email_confirmed_at ? '✓' : '✗'
        console.log(`   ${confirmed} ${user.email}`)
      })
      console.log()
    }

    // 6. USUARIOS EN PERFILES
    console.log('\n6️⃣  USUARIOS EN TABLA PERFILES\n')
    const { data: perfiles, error: perfilesError } = await supabase
      .from('perfiles')
      .select('id, rut, nombre_completo, rol')

    if (perfilesError) {
      console.log(`   ⚠️  Error: ${perfilesError.message}\n`)
    } else {
      console.log(`   Total de perfiles: ${perfiles?.length || 0}\n`)
      perfiles?.forEach((p: any) => {
        console.log(`   • ${p.nombre_completo} - ${p.rol} (RUT: ${p.rut})`)
      })
      console.log()
    }

    // 7. DIAGNOSIS
    console.log('\n7️⃣  DIAGNOSIS Y PRÓXIMOS PASOS\n')
    console.log('   Para hacer una auditoría completa y profesional:')
    console.log('   1. Ve a Supabase > SQL Editor')
    console.log('   2. Copia el archivo /AUDIT_QUERIES.sql (lo voy a crear)')
    console.log('   3. Ejecuta todo y toma screenshots')
    console.log('   4. Esto revelará:')
    console.log('      - Estructura exacta de tablas')
    console.log('      - Triggers problemáticos')
    console.log('      - Constraints y sus causas')
    console.log('      - Estado real de usuarios\n')

    console.log('\n═══════════════════════════════════════════════════')
    console.log('✅ AUDITORÍA INICIADA')
    console.log('═══════════════════════════════════════════════════\n')
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

auditSupabase()
