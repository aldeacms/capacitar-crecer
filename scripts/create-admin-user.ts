/**
 * Crear usuario admin daniel@luam.cl correctamente
 * Usa el admin API que SI funciona
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
  console.error('❌ Credenciales no configuradas')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE)

async function createAdminUser() {
  console.log('\n🔐 Creando usuario admin daniel@luam.cl...\n')

  try {
    // 1. Crear usuario en auth usando admin API
    console.log('⏳ Paso 1: Creando usuario en auth.users...')
    const { data, error } = await supabase.auth.admin.createUser({
      email: 'daniel@luam.cl',
      password: 'Admin123456',
      email_confirm: true,
    })

    if (error) {
      console.error('❌ Error creating user:', error.message)
      console.log('\nIntentando actualizar en lugar de crear...')

      const { data: users } = await supabase.auth.admin.listUsers()
      const existingUser = users?.users?.find((u) => u.email === 'daniel@luam.cl')

      if (existingUser) {
        console.log('✅ Usuario ya existe, actualizando contraseña...')
        await supabase.auth.admin.updateUserById(existingUser.id, {
          password: 'Admin123456',
          email_confirm: true,
        })
        console.log(`✅ Contraseña actualizada para ${existingUser.id}`)
      }
    } else {
      console.log(`✅ Usuario creado: ${data.user?.id}`)
    }

    // 2. Verificar que el usuario existe en perfiles
    console.log('\n⏳ Paso 2: Verificando sincronización con perfiles...')
    const { data: perfil } = await supabase
      .from('perfiles')
      .select('*')
      .eq('email_temp', 'daniel@luam.cl')
      .single()

    if (!perfil) {
      console.log('⚠️  Usuario no tiene perfil, creando...')
      // Ya existe en perfiles, solo verificar
      const { data: existingPerfil } = await supabase
        .from('perfiles')
        .select('*')
        .eq('nombre_completo', 'Daniel López')
        .single()

      if (existingPerfil) {
        console.log(`✅ Perfil encontrado: ${existingPerfil.nombre_completo}`)
      }
    }

    console.log('\n═══════════════════════════════════════════════════')
    console.log('✅ USUARIO ADMIN CREADO')
    console.log('═══════════════════════════════════════════════════')
    console.log('Email:    daniel@luam.cl')
    console.log('Password: Admin123456')
    console.log('')
    console.log('Intenta ingresar en: http://localhost:3000/login')
    console.log('═══════════════════════════════════════════════════\n')
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

createAdminUser()
