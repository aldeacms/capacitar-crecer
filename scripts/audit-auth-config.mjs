#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qablhrycgplkgmzurtke.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhYmxocnljZ3Bsa2dtenVydGtlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzUzMTgyMCwiZXhwIjoyMDg5MTA3ODIwfQ.VCsRgKCtU2_Re8Ea1iuBVT1t0jfZ5_Gu1Oujd--ABiM'

const supabase = createClient(supabaseUrl, supabaseKey)

async function auditAuth() {
  console.log('🔍 AUDITORÍA DE CONFIGURACIÓN DE AUTH\n')

  try {
    // 1. Verificar extensiones habilitadas
    console.log('1️⃣  Extensiones habilitadas:')
    const { data: extensions, error: extError } = await supabase
      .rpc('get_extensions', {}, { count: 'exact' })
      .catch(e => ({ data: null, error: e }))
    
    if (extensions) {
      console.log('   ✅ Se puede acceder a extensiones')
    } else {
      console.log('   ⚠️  No se puede verificar extensiones (RPC no disponible)')
    }

    console.log()

    // 2. Verificar triggers en auth.users
    console.log('2️⃣  Buscando triggers en auth.users:')
    const triggersQuery = `
      SELECT trigger_name, event_object_table, action_statement
      FROM information_schema.triggers
      WHERE event_object_schema = 'auth' AND event_object_table = 'users'
    `
    
    const { data: triggers, error: trigError } = await supabase
      .rpc('execute_sql', { query: triggersQuery })
      .catch(e => ({ data: null, error: e }))

    if (triggers) {
      console.log(`   ✅ Triggers encontrados: ${triggers.length}`)
      triggers.forEach(t => console.log(`      - ${t.trigger_name}`))
    } else {
      console.log('   ℹ️  No se pudo verificar triggers (RPC no disponible)')
    }

    console.log()

    // 3. Verificar políticas RLS en auth.users
    console.log('3️⃣  Políticas RLS en auth.users:')
    const { data: policies, error: polError } = await supabase
      .from('information_schema.applicable_row_security_policies')
      .select('*')
      .eq('schema', 'auth')
      .eq('table_name', 'users')
      .catch(e => ({ data: null, error: e }))

    if (policies && policies.length > 0) {
      console.log(`   ✅ ${policies.length} políticas encontradas`)
      policies.forEach(p => console.log(`      - ${p.policyname}`))
    } else {
      console.log('   ℹ️  No se puede verificar RLS (tabla no accesible)')
    }

    console.log()

    // 4. Intentar crear usuario con el admin API y capturar error detallado
    console.log('4️⃣  Intentando crear usuario de prueba:')
    
    const testEmail = `test-${Date.now()}@example.com`
    const { data, error } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: 'TestPassword123!',
      email_confirm: false
    })

    if (error) {
      console.log(`   ❌ Error: ${error.message}`)
      console.log(`   Código: ${error.status}`)
      console.log(`   Detalles: ${JSON.stringify(error, null, 2)}`)
    } else {
      console.log(`   ✅ Usuario creado exitosamente: ${data.user.id}`)
      console.log(`   Limpiando...`)
      await supabase.auth.admin.deleteUser(data.user.id)
    }

    console.log()
    console.log('═'.repeat(70))
    console.log('CONCLUSIÓN:')
    console.log('═'.repeat(70))
    
    if (error && error.message.includes('Database error')) {
      console.log('\n⚠️  PROBLEMA IDENTIFICADO: Error interno de BD en Auth')
      console.log('\nPosibles causas:')
      console.log('1. Trigger en auth.users está fallando')
      console.log('2. Función de trigger está mal configurada')
      console.log('3. Webhook de Auth está fallando')
      console.log('4. Problema con extensión pgsodium (encriptación)')
      console.log('\nRECOMENDACIÓN: Revisar logs de Supabase en el dashboard')
    }

  } catch (error) {
    console.error('Error en auditoría:', error.message)
  }
}

auditAuth()
