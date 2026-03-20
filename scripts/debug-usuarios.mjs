#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qablhrycgplkgmzurtke.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhYmxocnljZ3Bsa2dtenVydGtlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzUzMTgyMCwiZXhwIjoyMDg5MTA3ODIwfQ.VCsRgKCtU2_Re8Ea1iuBVT1t0jfZ5_Gu1Oujd--ABiM'

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugUsuarios() {
  console.log('🔍 Debugging getUsuarios() error\n')

  try {
    // 1. Obtener usuarios auth
    console.log('1️⃣ Obteniendo usuarios de auth...')
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers()
    if (authError) throw authError
    console.log(`✅ ${users.length} usuarios en auth\n`)

    // 2. Obtener perfiles
    console.log('2️⃣ Obteniendo perfiles...')
    const { data: perfiles, error: perfilesError } = await supabase
      .from('perfiles')
      .select('id, nombre_completo, rut, created_at')
    if (perfilesError) throw perfilesError
    console.log(`✅ ${perfiles.length} perfiles\n`)

    // 3. Obtener admin_users
    console.log('3️⃣ Obteniendo admin_users...')
    const { data: admins, error: adminsError } = await supabase
      .from('admin_users')
      .select('id')
    if (adminsError) throw adminsError
    console.log(`✅ ${admins.length} admins\n`)

    // 4. TEST: Problema potencial - select con count
    console.log('4️⃣ Testing matriculas select (PROBLEMA POTENCIAL)...')
    const { data: matriculas, error: matriculasError } = await supabase
      .from('matriculas')
      .select('perfil_id', { count: 'exact' })

    if (matriculasError) {
      console.error('❌ ERROR EN MATRICULAS:')
      console.error('  Code:', matriculasError.code)
      console.error('  Message:', matriculasError.message)
      console.error('\n🔧 POSIBLE SOLUCIÓN:')
      console.error('  El problema es el .select() con count.')
      console.error('  Debería ser: .select("perfil_id").count("exact")')
      return
    }

    console.log(`✅ ${matriculas.length} registros de matriculas\n`)

    // Si llegamos aquí, todo funciona
    console.log('✅ TODOS LOS DATOS OBTENIDOS EXITOSAMENTE\n')
    console.log('Datos:')
    console.log(`  - Users: ${users.length}`)
    console.log(`  - Perfiles: ${perfiles.length}`)
    console.log(`  - Admins: ${admins.length}`)
    console.log(`  - Matriculas: ${matriculas.length}`)

  } catch (error) {
    console.error('❌ ERROR:', error.message)
  }
}

debugUsuarios()
