#!/usr/bin/env node

import https from 'https'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qablhrycgplkgmzurtke.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhYmxocnljZ3Bsa2dtenVydGtlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzUzMTgyMCwiZXhwIjoyMDg5MTA3ODIwfQ.VCsRgKCtU2_Re8Ea1iuBVT1t0jfZ5_Gu1Oujd--ABiM'
const supabase = createClient(supabaseUrl, supabaseKey)

const email = 'daniel@luam.cl'
const password = 'Pianito1!'
const nombre_completo = 'Daniel Aldea'
const rut = '15534564-0'
const rol = 'admin'

async function createAdminTest() {
  console.log('🧪 QA Test: Crear usuario admin\n')
  
  try {
    // Step 1: Create auth user via REST API
    console.log('1️⃣  Creando usuario en auth.users via REST API...')
    const authResponse = await fetch(
      `${supabaseUrl}/auth/v1/admin/users`,
      {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password, email_confirm: true })
      }
    )

    if (!authResponse.ok) {
      const err = await authResponse.json()
      throw new Error(`Auth API failed: ${err.error_description || err.message}`)
    }

    const authData = await authResponse.json()
    const userId = authData.user?.id
    if (!userId) throw new Error('No user ID returned from auth API')
    console.log(`   ✅ Usuario auth creado: ${userId}\n`)

    // Step 2: Create perfil with rol
    console.log('2️⃣  Creando perfil en tabla perfiles...')
    const { error: perfilError } = await supabase.from('perfiles').insert({
      id: userId,
      nombre_completo,
      rut,
      rol,
      created_at: new Date().toISOString()
    })

    if (perfilError) throw new Error(`Perfil creation failed: ${perfilError.message}`)
    console.log('   ✅ Perfil creado\n')

    // Step 3: Assign admin role
    console.log('3️⃣  Asignando rol admin en admin_users...')
    const { error: adminError } = await supabase
      .from('admin_users')
      .insert({ id: userId, is_active: true })

    if (adminError) throw new Error(`Admin assignment failed: ${adminError.message}`)
    console.log('   ✅ Rol admin asignado\n')

    // QA: Verify data integrity
    console.log('🔍 QA: Verificando integridad de datos...\n')

    // Check auth.users
    console.log('a) Verificando auth.users...')
    const { data: { users } } = await supabase.auth.admin.listUsers()
    const authUser = users.find(u => u.email === email)
    if (!authUser) throw new Error('Usuario no encontrado en auth.users')
    console.log(`   ✅ Email confirmado: ${authUser.email_confirmed_at ? '✓' : '✗'} (debe ser ✓)`)
    console.log(`   ✅ Usuario existe: ${authUser.id}\n`)

    // Check perfiles
    console.log('b) Verificando tabla perfiles...')
    const { data: perfil, error: perfilCheckError } = await supabase
      .from('perfiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (perfilCheckError) throw new Error(`Perfil check failed: ${perfilCheckError.message}`)
    if (!perfil) throw new Error('Perfil no encontrado')
    console.log(`   ✅ Nombre: "${perfil.nombre_completo}"`)
    console.log(`   ✅ RUT: "${perfil.rut}"`)
    console.log(`   ✅ Rol: "${perfil.rol}" (debe ser "admin")`)
    if (perfil.rol !== 'admin') throw new Error('Rol no es admin!')
    console.log(`   ✅ Fecha creación: ${perfil.created_at}\n`)

    // Check admin_users
    console.log('c) Verificando tabla admin_users...')
    const { data: adminUser, error: adminCheckError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('id', userId)
      .single()

    if (adminCheckError) throw new Error(`Admin check failed: ${adminCheckError.message}`)
    if (!adminUser) throw new Error('Usuario no encontrado en admin_users')
    console.log(`   ✅ Es admin: ${adminUser.is_active ? '✓ activo' : '✗ inactivo'}`)
    if (!adminUser.is_active) throw new Error('Admin no está activo!')
    console.log()

    // Final summary
    console.log('═'.repeat(60))
    console.log('✨ QA PASSOU - USUARIO ADMIN CREADO CORRECTAMENTE\n')
    console.log('Datos creados:')
    console.log(`  Email:        ${email}`)
    console.log(`  Password:     ${password}`)
    console.log(`  Nombre:       ${nombre_completo}`)
    console.log(`  RUT:          ${rut}`)
    console.log(`  Rol:          ${rol}`)
    console.log(`  User ID:      ${userId}`)
    console.log('═'.repeat(60))
    console.log('\n✅ El sistema está LISTO para usar')
    console.log('Puedes iniciar sesión en: /login\n')

  } catch (error) {
    console.error('\n❌ QA FALLÓ:\n', error.message)
    console.error(error)
    process.exit(1)
  }
}

createAdminTest()
