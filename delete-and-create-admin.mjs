#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qablhrycgplkgmzurtke.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhYmxocnljZ3Bsa2dtenVydGtlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzUzMTgyMCwiZXhwIjoyMDg5MTA3ODIwfQ.VCsRgKCtU2_Re8Ea1iuBVT1t0jfZ5_Gu1Oujd--ABiM'

const supabase = createClient(supabaseUrl, supabaseKey)

async function deleteAndCreateAdmin() {
  const email = 'daniel@luam.cl'
  const password = 'Pianito1!'
  const nombre_completo = 'Daniel Aldea'
  const rut = '15534564-0'

  try {
    // Step 1: Delete existing user if present
    console.log('🗑️  Buscando usuario existente:', email)
    
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
    if (listError) {
      console.error('❌ Error listando usuarios:', listError.message)
      return
    }

    const existingUser = users.find(u => u.email === email)
    if (existingUser) {
      console.log('   Encontrado:', existingUser.id)
      console.log('   Eliminando...')
      const { error: deleteError } = await supabase.auth.admin.deleteUser(existingUser.id)
      if (deleteError) {
        console.error('❌ Error eliminando usuario:', deleteError.message)
        return
      }
      console.log('   ✅ Usuario eliminado')
    } else {
      console.log('   (no existe, continuando...)')
    }

    // Step 2: Create fresh admin
    console.log('\n🔐 Creando administrador...')
    console.log(`Email: ${email}`)
    console.log(`Nombre: ${nombre_completo}`)
    console.log(`RUT: ${rut}`)
    console.log(`Rol: Administrador\n`)

    // 1. Crear usuario en auth
    console.log('1️⃣  Creando usuario en auth...')
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true
    })

    if (authError) {
      console.error('❌ Error creando usuario auth:', authError.message)
      return
    }

    if (!authUser.user) {
      console.error('❌ No se creó el usuario')
      return
    }

    console.log(`   ✅ Usuario creado con ID: ${authUser.user.id}`)

    // 2. Crear perfil
    console.log('\n2️⃣  Creando perfil...')
    const { error: perfilError } = await supabase
      .from('perfiles')
      .insert([
        {
          id: authUser.user.id,
          nombre_completo: nombre_completo,
          rut: rut
        }
      ])

    if (perfilError) {
      console.error('❌ Error creando perfil:', perfilError.message)
      // Limpiar usuario creado
      await supabase.auth.admin.deleteUser(authUser.user.id)
      return
    }

    console.log(`   ✅ Perfil creado`)

    // 3. Asignar rol admin
    console.log('\n3️⃣  Asignando rol de admin...')
    const { error: adminError } = await supabase
      .from('admin_users')
      .insert([
        {
          id: authUser.user.id,
          is_active: true
        }
      ])

    if (adminError) {
      console.error('❌ Error asignando rol admin:', adminError.message)
      return
    }

    console.log(`   ✅ Rol admin asignado`)

    console.log('\n' + '═'.repeat(60))
    console.log('✨ ADMINISTRADOR CREADO EXITOSAMENTE\n')
    console.log('Datos de acceso:')
    console.log(`  Email:    ${email}`)
    console.log(`  Clave:    ${password}`)
    console.log(`  Nombre:   ${nombre_completo}`)
    console.log(`  RUT:      ${rut}`)
    console.log(`  Rol:      Admin`)
    console.log('═'.repeat(60))
    console.log('\nPuedes iniciar sesión en: /login')

  } catch (error) {
    console.error('❌ Error inesperado:', error.message)
  }
}

deleteAndCreateAdmin()
