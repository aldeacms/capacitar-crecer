#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qablhrycgplkgmzurtke.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhYmxocnljZ3Bsa2dtenVydGtlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzUzMTgyMCwiZXhwIjoyMDg5MTA3ODIwfQ.VCsRgKCtU2_Re8Ea1iuBVT1t0jfZ5_Gu1Oujd--ABiM'
const supabase = createClient(supabaseUrl, supabaseKey)

async function createAdmin() {
  const email = 'daniel@luam.cl'
  const password = 'Pianito1!'
  const nombre_completo = 'Daniel Aldea'
  const rut = '15.534.564-0'

  console.log('🧪 QA: Crear usuario admin\n')
  console.log('═'.repeat(60))

  try {
    // Step 1: Cleanup
    console.log('\n1️⃣  Limpiando usuario anterior...')
    const { data: { users } } = await supabase.auth.admin.listUsers()
    const existing = users.find(u => u.email === email)
    if (existing) {
      await supabase.auth.admin.deleteUser(existing.id)
      console.log('   ✅ Usuario anterior eliminado\n')
    } else {
      console.log('   ℹ️  No existía usuario anterior\n')
    }

    // Step 2: Create auth user
    console.log('2️⃣  Creando usuario en auth.users...')
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
      throw new Error(`Auth API: ${err.error_description || err.message}`)
    }

    const authData = await authResponse.json()
    const userId = authData.user?.id
    if (!userId) throw new Error('No user ID returned')
    console.log(`   ✅ Usuario auth creado: ${userId}\n`)

    // Step 3: Create perfil
    console.log('3️⃣  Creando perfil...')
    const { error: perfilError } = await supabase.from('perfiles').insert({
      id: userId,
      nombre_completo,
      rut,
      rol: 'admin',
      created_at: new Date().toISOString()
    })
    if (perfilError) throw new Error(`Perfil: ${perfilError.message}`)
    console.log('   ✅ Perfil creado\n')

    // Step 4: Assign admin
    console.log('4️⃣  Asignando rol admin...')
    const { error: adminError } = await supabase
      .from('admin_users')
      .insert({ id: userId, is_active: true })
    if (adminError) throw new Error(`Admin: ${adminError.message}`)
    console.log('   ✅ Rol admin asignado\n')

    // Step 5: Verify
    console.log('═'.repeat(60))
    console.log('\n5️⃣  Verificando integridad de datos...\n')

    // Check auth.users
    console.log('   a) auth.users')
    const { data: { users: allUsers } } = await supabase.auth.admin.listUsers()
    const authUser = allUsers.find(u => u.email === email)
    if (!authUser) throw new Error('User not found in auth.users')
    console.log(`      ✅ Email: ${authUser.email}`)
    console.log(`      ✅ Email confirmado: ${authUser.email_confirmed_at ? 'sí' : 'no'}\n`)

    // Check perfiles
    console.log('   b) perfiles')
    const { data: perfil } = await supabase
      .from('perfiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (!perfil) throw new Error('Perfil not found')
    console.log(`      ✅ Nombre: ${perfil.nombre_completo}`)
    console.log(`      ✅ RUT: ${perfil.rut}`)
    console.log(`      ✅ Rol: ${perfil.rol}`)
    if (perfil.rol !== 'admin') throw new Error('Role is not admin!')
    console.log()

    // Check admin_users
    console.log('   c) admin_users')
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('*')
      .eq('id', userId)
      .single()
    if (!adminUser) throw new Error('Admin record not found')
    console.log(`      ✅ Activo: ${adminUser.is_active}\n`)

    // Success
    console.log('═'.repeat(60))
    console.log('\n✨ QA PASSOU - SISTEMA FUNCIONA CORRECTAMENTE!\n')
    console.log('📊 Datos del Administrador:')
    console.log(`   Email:        ${email}`)
    console.log(`   Contraseña:   ${password}`)
    console.log(`   Nombre:       ${nombre_completo}`)
    console.log(`   RUT:          ${rut}`)
    console.log(`   Rol:          admin`)
    console.log(`   User ID:      ${userId}`)
    console.log('\n✅ LISTO PARA PRODUCCIÓN')
    console.log('🌐 Inicia sesión en: /login\n')
    console.log('═'.repeat(60) + '\n')

  } catch (error) {
    console.error('\n❌ QA FALLÓ:\n', error.message, '\n')
    process.exit(1)
  }
}

createAdmin()
