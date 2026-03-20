#!/usr/bin/env node

const supabaseUrl = 'https://qablhrycgplkgmzurtke.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhYmxocnljZ3Bsa2dtenVydGtlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzUzMTgyMCwiZXhwIjoyMDg5MTA3ODIwfQ.VCsRgKCtU2_Re8Ea1iuBVT1t0jfZ5_Gu1Oujd--ABiM'

async function createAdminViaAPI() {
  const email = 'daniel@luam.cl'
  const password = 'Pianito1!'
  const nombre_completo = 'Daniel Aldea'

  console.log('🔐 Creando admin via REST API...\n')

  try {
    // Intentar crear usuario via API REST
    console.log('1️⃣  Creando usuario en auth...')
    
    const response = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({
        email: email,
        password: password,
        email_confirm: true
      })
    })

    const data = await response.json()

    if (!response.ok) {
      console.error(`❌ Error (${response.status}):`, data)
      return
    }

    const userId = data.id
    console.log(`✅ Usuario creado: ${userId}\n`)

    // Crear perfil
    console.log('2️⃣  Creando perfil...')
    const perfilResponse = await fetch(`${supabaseUrl}/rest/v1/perfiles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({
        id: userId,
        nombre_completo: nombre_completo,
        rut: null
      })
    })

    if (!perfilResponse.ok) {
      const perfilError = await perfilResponse.json()
      console.error(`❌ Error creando perfil:`, perfilError)
      return
    }
    console.log('✅ Perfil creado\n')

    // Crear admin_user
    console.log('3️⃣  Asignando rol admin...')
    const adminResponse = await fetch(`${supabaseUrl}/rest/v1/admin_users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({
        id: userId,
        is_active: true
      })
    })

    if (!adminResponse.ok) {
      const adminError = await adminResponse.json()
      console.error(`❌ Error asignando admin:`, adminError)
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

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

createAdminViaAPI()
