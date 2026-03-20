#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qablhrycgplkgmzurtke.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhYmxocnljZ3Bsa2dtenVydGtlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzUzMTgyMCwiZXhwIjoyMDg5MTA3ODIwfQ.VCsRgKCtU2_Re8Ea1iuBVT1t0jfZ5_Gu1Oujd--ABiM'

const supabase = createClient(supabaseUrl, supabaseKey)

async function setupAdmin() {
  const email = 'daniel@luam.cl'
  const password = 'Pianito1!'
  const nombre = 'Daniel Aldea'

  console.log('🔧 Setup de Administrador Daniel Aldea\n')

  try {
    // 1. Buscar usuario existente
    console.log('1️⃣  Verificando estado actual...')
    
    const { data: { users: allUsers } } = await supabase.auth.admin.listUsers()
    let targetUser = allUsers.find(u => u.email === email)

    if (!targetUser) {
      console.log(`   Usuario ${email} NO existe en auth`)
      console.log(`   Intentando crear...`)
      
      try {
        const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
          email: email,
          password: password,
          email_confirm: true
        })

        if (createErr) throw new Error(createErr.message)
        targetUser = newUser.user
        console.log(`   ✅ Creado con ID: ${targetUser.id}`)
      } catch (createError) {
        console.error(`   ❌ Error al crear: ${createError.message}`)
        return
      }
    } else {
      console.log(`   ✅ Usuario existe con ID: ${targetUser.id}`)
    }

    console.log()

    // 2. Crear o actualizar perfil
    console.log('2️⃣  Configurando perfil...')
    
    const { data: existingProfile } = await supabase
      .from('perfiles')
      .select('id')
      .eq('id', targetUser.id)
      .single()

    if (existingProfile) {
      console.log(`   ✅ Perfil ya existe`)
    } else {
      const { error: perfilError } = await supabase
        .from('perfiles')
        .insert({
          id: targetUser.id,
          nombre_completo: nombre,
          rut: null
        })

      if (perfilError && perfilError.code !== '23505') {
        console.error(`   ❌ Error: ${perfilError.message}`)
        return
      }
      console.log(`   ✅ Perfil creado`)
    }

    console.log()

    // 3. Asignar rol admin
    console.log('3️⃣  Asignando rol administrativo...')
    
    const { data: existingAdmin } = await supabase
      .from('admin_users')
      .select('id')
      .eq('id', targetUser.id)
      .single()

    if (existingAdmin) {
      console.log(`   ✅ Ya es administrador`)
    } else {
      const { error: adminError } = await supabase
        .from('admin_users')
        .insert({
          id: targetUser.id,
          is_active: true
        })

      if (adminError && adminError.code !== '23505') {
        console.error(`   ❌ Error: ${adminError.message}`)
        return
      }
      console.log(`   ✅ Rol asignado`)
    }

    console.log('\n' + '═'.repeat(70))
    console.log('✨ ADMINISTRADOR LISTO PARA USAR')
    console.log('═'.repeat(70))
    console.log(`\n👤 Nombre:       Daniel Aldea`)
    console.log(`📧 Email:        ${email}`)
    console.log(`🔐 Contraseña:   Pianito1!`)
    console.log(`🛡️  Rol:          Administrador`)
    console.log(`\n🌐 Inicia sesión en: http://localhost:3000/login`)
    console.log('═'.repeat(70))

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

setupAdmin()
