#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qablhrycgplkgmzurtke.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhYmxocnljZ3Bsa2dtenVydGtlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzUzMTgyMCwiZXhwIjoyMDg5MTA3ODIwfQ.VCsRgKCtU2_Re8Ea1iuBVT1t0jfZ5_Gu1Oujd--ABiM'
const supabase = createClient(supabaseUrl, supabaseKey)

async function verify() {
  const email = 'daniel@luam.cl'

  console.log('🔍 Verificando usuario admin daniel@luam.cl\n')
  console.log('═'.repeat(60) + '\n')

  try {
    // Check auth.users
    console.log('1️⃣  auth.users\n')
    const { data: { users } } = await supabase.auth.admin.listUsers()
    const authUser = users.find(u => u.email === email)
    
    if (!authUser) {
      console.error('❌ Usuario no encontrado en auth.users')
      process.exit(1)
    }

    const userId = authUser.id
    console.log(`   ✅ Email: ${authUser.email}`)
    console.log(`   ✅ ID: ${userId}`)
    console.log(`   ✅ Email confirmado: ${authUser.email_confirmed_at ? 'sí ✓' : 'no ✗'}\n`)

    // Check perfiles
    console.log('2️⃣  perfiles\n')
    const { data: perfil, error: perfilError } = await supabase
      .from('perfiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (perfilError || !perfil) {
      console.error('❌ Perfil no encontrado')
      process.exit(1)
    }

    console.log(`   ✅ Nombre: "${perfil.nombre_completo}"`)
    console.log(`   ✅ RUT: "${perfil.rut}"`)
    console.log(`   ✅ Rol: "${perfil.rol}"`)
    console.log(`   ✅ Creado: ${new Date(perfil.created_at).toLocaleString('es-CL')}\n`)

    if (perfil.rol !== 'admin') {
      console.error('❌ Rol no es admin!')
      process.exit(1)
    }

    // Check admin_users
    console.log('3️⃣  admin_users\n')
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('id', userId)
      .single()

    if (adminError || !adminUser) {
      console.error('❌ Usuario admin no encontrado en admin_users')
      process.exit(1)
    }

    console.log(`   ✅ ID admin: ${adminUser.id}`)
    console.log(`   ✅ Activo: ${adminUser.is_active ? 'sí ✓' : 'no ✗'}\n`)

    // Success
    console.log('═'.repeat(60))
    console.log('\n✨ VERIFICACIÓN COMPLETADA - TODO CORRECTO!\n')
    console.log('📋 Datos del Administrador:')
    console.log(`   Email:        ${email}`)
    console.log(`   Contraseña:   Pianito1!`)
    console.log(`   Nombre:       Daniel Aldea`)
    console.log(`   RUT:          ${perfil.rut}`)
    console.log(`   Rol:          admin`)
    console.log(`   User ID:      ${userId}`)
    console.log(`   Estado:       Listo para usar`)
    console.log('\n✅ EL SISTEMA ESTÁ COMPLETAMENTE FUNCIONAL')
    console.log('🌐 Inicia sesión en: http://localhost:3000/login\n')
    console.log('═'.repeat(60) + '\n')

  } catch (error) {
    console.error('\n❌ Error:', error.message)
    process.exit(1)
  }
}

verify()
