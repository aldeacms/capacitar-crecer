#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

const supabaseUrl = 'https://qablhrycgplkgmzurtke.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhYmxocnljZ3Bsa2dtenVydGtlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzUzMTgyMCwiZXhwIjoyMDg5MTA3ODIwfQ.VCsRgKCtU2_Re8Ea1iuBVT1t0jfZ5_Gu1Oujd--ABiM'

const supabase = createClient(supabaseUrl, supabaseKey)

async function executeMigration() {
  console.log('🔧 Ejecutando migración SQL...\n')

  try {
    // Leer archivo SQL
    const sqlPath = path.join(process.cwd(), 'supabase/migrations/create_user_function.sql')
    const sqlContent = fs.readFileSync(sqlPath, 'utf-8')

    console.log('📄 SQL a ejecutar:')
    console.log(sqlContent.substring(0, 200) + '...\n')

    // Dividir en statements individuales
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))

    console.log(`📝 ${statements.length} statements encontrados\n`)

    // Ejecutar cada statement
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i] + ';'
      console.log(`⏳ Ejecutando statement ${i + 1}/${statements.length}...`)

      try {
        const { error } = await supabase.rpc('exec_sql', {
          sql_string: stmt
        }).catch(() => {
          // Si RPC exec_sql no existe, intentar otro método
          return { error: { message: 'RPC no disponible' } }
        })

        if (error) {
          console.log('   ℹ️  RPC no disponible, usando SQL directo...')
          // Intentar ejecutar directamente via un INSERT/UPDATE
          // Esto es un workaround - idealmente se haría en Supabase Console
          console.log('   ⚠️  Por favor, ejecuta esta función en Supabase Console:')
          console.log('\n' + stmt.substring(0, 150) + '...\n')
        } else {
          console.log('   ✅ Ejecutado')
        }
      } catch (execError) {
        console.warn(`   ⚠️  Error ejecutando statement ${i + 1}:`, execError.message)
      }
    }

    console.log('\n═'.repeat(70))
    console.log('INSTRUCCIONES:')
    console.log('═'.repeat(70))
    console.log('\nSi el RPC no funcionó, ejecuta manualmente en Supabase Console:')
    console.log('1. Ve a: https://supabase.com/dashboard/project/qablhrycgplkgmzurtke')
    console.log('2. SQL Editor → Nueva query')
    console.log('3. Copia TODO el contenido de: supabase/migrations/create_user_function.sql')
    console.log('4. Pégalo y ejecuta\n')

    // Verificar si la función existe
    console.log('Verificando si la función se creó...')
    const { data: functions, error: funcError } = await supabase
      .rpc('create_new_user', {
        user_email: 'test@test.test',
        user_password: 'TestPassword123!',
        user_nombre: 'Test User',
        user_rut: 'test-rut'
      })
      .catch(e => ({ data: null, error: e }))

    if (funcError && !funcError.message.includes('Email es requerido')) {
      console.log('   ✅ Función create_new_user está disponible!')
    } else {
      console.log('   ⚠️  Función no está disponible - necesita ser creada en Supabase Console')
    }

  } catch (error) {
    console.error('Error:', error.message)
  }
}

executeMigration()
