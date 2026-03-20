#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qablhrycgplkgmzurtke.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhYmxocnljZ3Bsa2dtenVydGtlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzUzMTgyMCwiZXhwIjoyMDg5MTA3ODIwfQ.VCsRgKCtU2_Re8Ea1iuBVT1t0jfZ5_Gu1Oujd--ABiM'
const supabase = createClient(supabaseUrl, supabaseKey)

const email = 'daniel@luam.cl'
const password = 'Pianito1!'
const nombre_completo = 'Daniel Aldea'
const rut = '15534564-0'

async function createAdminViaRest() {
  try {
    console.log('🔐 Creando administrador vía REST API...\n')

    // 1. Create user via REST API directly
    console.log('1️⃣  Creando usuario en auth via REST...')
    const authResponse = await fetch(
      `${supabaseUrl}/auth/v1/admin/users`,
      {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          password,
          email_confirm: true
        })
      }
    )

    const authData = await authResponse.json()

    if (!authResponse.ok) {
      console.error('❌ Error creando usuario auth:')
      console.error('Status:', authResponse.status)
      console.error('Error:', JSON.stringify(authData, null, 2))
      return
    }

    const userId = authData.user?.id
    if (!userId) {
      console.error('❌ No se obtuvo ID de usuario')
      return
    }

    console.log(`   ✅ Usuario creado con ID: ${userId}`)

    // 2. Create perfil
    console.log('\n2️⃣  Creando perfil...')
    const { error: perfilError } = await supabase
      .from('perfiles')
      .insert([
        {
          id: userId,
          nombre_completo,
          rut
        }
      ])

    if (perfilError) {
      console.error('❌ Error creando perfil:', perfilError.message)
      return
    }

    console.log('   ✅ Perfil creado')

    // 3. Assign admin role
    console.log('\n3️⃣  Asignando rol de admin...')
    const { error: adminError } = await supabase
      .from('admin_users')
      .insert([
        {
          id: userId,
          is_active: true
        }
      ])

    if (adminError) {
      console.error('❌ Error asignando rol admin:', adminError.message)
      return
    }

    console.log('   ✅ Rol admin asignado')

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

createAdminViaRest()
