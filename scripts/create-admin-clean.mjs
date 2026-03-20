#!/usr/bin/env node

const supabaseUrl = 'https://qablhrycgplkgmzurtke.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhYmxocnljZ3Bsa2dtenVydGtlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzUzMTgyMCwiZXhwIjoyMDg5MTA3ODIwfQ.VCsRgKCtU2_Re8Ea1iuBVT1t0jfZ5_Gu1Oujd--ABiM'

async function createAdmin() {
  const email = 'daniel@luam.cl'
  const password = 'Pianito1!'
  const nombre = 'Daniel Aldea'

  console.log('🔐 Creando administrador Daniel Aldea...\n')

  try {
    // Crear en auth
    console.log('1️⃣  Creando usuario en Authentication...')
    
    const createResp = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
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

    if (!createResp.ok) {
      const err = await createResp.json()
      if (err.message && err.message.includes('duplicate')) {
        console.log(`⚠️  El email ${email} ya estaba registrado`)
        console.log(`   Actualizando contraseña...`)
        
        // Intentar obtener ID y actualizar
        const listResp = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
          method: 'GET',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          }
        })
        
        const { users } = await listResp.json()
        const user = users.find(u => u.email === email)
        
        if (!user) {
          console.error('❌ No se pudo encontrar el usuario para actualizar')
          return
        }
        
        const updateResp = await fetch(`${supabaseUrl}/auth/v1/admin/users/${user.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          },
          body: JSON.stringify({ password: password })
        })
        
        if (!updateResp.ok) {
          console.error('❌ Error al actualizar contraseña:', updateResp.status)
          return
        }
        
        console.log(`✅ Contraseña actualizada (ID: ${user.id})`)
      } else {
        console.error('❌ Error:', err)
        return
      }
    } else {
      const userData = await createResp.json()
      console.log(`✅ Usuario creado (ID: ${userData.user.id})`)
    }

    // Obtener usuario
    const listResp = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
      method: 'GET',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    })
    const { users } = await listResp.json()
    const user = users.find(u => u.email === email)
    
    if (!user) {
      console.error('❌ No se puede encontrar el usuario creado')
      return
    }

    const userId = user.id
    console.log()

    // Crear perfil
    console.log('2️⃣  Creando perfil en Base de Datos...')
    
    const perfilResp = await fetch(`${supabaseUrl}/rest/v1/perfiles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({
        id: userId,
        nombre_completo: nombre,
        rut: null
      })
    })

    if (!perfilResp.ok) {
      const perfilErr = await perfilResp.json()
      if (perfilErr.code === '23505') {
        console.log('✅ Perfil ya existe')
      } else {
        console.error('❌ Error:', perfilErr)
        return
      }
    } else {
      console.log('✅ Perfil creado')
    }

    console.log()

    // Asignar admin
    console.log('3️⃣  Asignando rol de Administrador...')
    
    const adminResp = await fetch(`${supabaseUrl}/rest/v1/admin_users`, {
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

    if (!adminResp.ok) {
      const adminErr = await adminResp.json()
      if (adminErr.code === '23505') {
        console.log('✅ Ya es administrador')
      } else {
        console.error('❌ Error:', adminErr)
        return
      }
    } else {
      console.log('✅ Rol de administrador asignado')
    }

    console.log('\n' + '═'.repeat(60))
    console.log('✨ ADMINISTRADOR CREADO EXITOSAMENTE')
    console.log('═'.repeat(60))
    console.log(`\n👤 Nombre:    Daniel Aldea`)
    console.log(`📧 Email:     ${email}`)
    console.log(`🔐 Contraseña: Pianito1!`)
    console.log(`🛡️  Rol:       Admin`)
    console.log(`\n🌐 Acceder en: /login`)
    console.log('═'.repeat(60))

  } catch (error) {
    console.error('❌ Error inesperado:', error.message)
  }
}

createAdmin()
