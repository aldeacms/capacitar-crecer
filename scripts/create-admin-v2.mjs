#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qablhrycgplkgmzurtke.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhYmxocnljZ3Bsa2dtenVydGtlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzUzMTgyMCwiZXhwIjoyMDg5MTA3ODIwfQ.VCsRgKCtU2_Re8Ea1iuBVT1t0jfZ5_Gu1Oujd--ABiM'

const supabase = createClient(supabaseUrl, supabaseKey)

async function createAdmin() {
  const email = 'daniel@luam.cl'
  const password = 'Pianito1!'
  const nombre_completo = 'Daniel Aldea'

  console.log('🔐 Intentando crear administrador...\n')
  console.log(`Email: ${email}`)
  console.log(`Nombre: ${nombre_completo}\n`)

  try {
    // Verificar si el usuario ya existe
    console.log('Verificando si el usuario ya existe...')
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
    
    const existingUser = users.find(u => u.email === email)
    if (existingUser) {
      console.log(`⚠️  El usuario ${email} ya existe con ID: ${existingUser.id}`)
      return
    }

    console.log('✅ Usuario no existe, procediendo...\n')

    // Crear usuario
    console.log('1️⃣  Creando usuario en auth...')
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true
    })

    if (authError) {
      console.error(`❌ Error: ${authError.message}`)
      console.error(`Detalles: ${JSON.stringify(authError, null, 2)}`)
      return
    }

    const userId = authData.user.id
    console.log(`✅ Usuario creado: ${userId}\n`)

    // Crear perfil
    console.log('2️⃣  Creando perfil...')
    const { error: perfilError } = await supabase
      .from('perfiles')
      .insert({
        id: userId,
        nombre_completo: nombre_completo,
        rut: null
      })

    if (perfilError) {
      console.error(`❌ Error: ${perfilError.message}`)
      await supabase.auth.admin.deleteUser(userId)
      return
    }
    console.log('✅ Perfil creado\n')

    // Crear admin_user
    console.log('3️⃣  Asignando rol admin...')
    const { error: adminError } = await supabase
      .from('admin_users')
      .insert({
        id: userId,
        is_active: true
      })

    if (adminError) {
      console.error(`❌ Error: ${adminError.message}`)
      return
    }
    console.log('✅ Rol admin asignado\n')

    console.log('═'.repeat(60))
    console.log('✨ ADMINISTRADOR CREADO EXITOSAMENTE')
    console.log('═'.repeat(60))
    console.log(`\n📧 Email:    ${email}`)
    console.log(`🔐 Clave:    ${password}`)
    console.log(`👤 Nombre:   ${nombre_completo}`)
    console.log(`🛡️  Rol:      Admin`)
    console.log(`\n🌐 Acceder en: https://qablhrycgplkgmzurtke.supabase.co/auth/v1`)

  } catch (error) {
    console.error('❌ Error inesperado:', error.message)
  }
}

createAdmin()
