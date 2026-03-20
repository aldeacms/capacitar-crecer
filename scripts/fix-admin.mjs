#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qablhrycgplkgmzurtke.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhYmxocnljZ3Bsa2dtenVydGtlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzUzMTgyMCwiZXhwIjoyMDg5MTA3ODIwfQ.VCsRgKCtU2_Re8Ea1iuBVT1t0jfZ5_Gu1Oujd--ABiM'

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixAdmin() {
  const email = 'daniel@luam.cl'
  const nombre_completo = 'Daniel Aldea'

  console.log('🔧 Limpiando y creando admin correctamente...\n')

  try {
    // 1. Obtener ID del usuario existente
    console.log('1️⃣  Buscando usuario existente...')
    const { data: { users } } = await supabase.auth.admin.listUsers()
    const existingUser = users.find(u => u.email === email)
    
    if (!existingUser) {
      console.error('❌ Usuario no encontrado')
      return
    }

    const userId = existingUser.id
    console.log(`✅ Encontrado: ${userId}\n`)

    // 2. Eliminar de admin_users si existe
    console.log('2️⃣  Limpiando admin_users...')
    const { error: deleteAdminError } = await supabase
      .from('admin_users')
      .delete()
      .eq('id', userId)
    console.log('✅ Limpiado\n')

    // 3. Crear/actualizar perfil
    console.log('3️⃣  Creando perfil...')
    const { error: perfilError } = await supabase
      .from('perfiles')
      .upsert({
        id: userId,
        nombre_completo: nombre_completo,
        rut: null
      }, { onConflict: 'id' })

    if (perfilError) {
      console.error('❌ Error:', perfilError.message)
      return
    }
    console.log('✅ Perfil creado\n')

    // 4. Asignar admin
    console.log('4️⃣  Asignando rol admin...')
    const { error: adminError } = await supabase
      .from('admin_users')
      .insert({
        id: userId,
        is_active: true
      })

    if (adminError) {
      console.error('❌ Error:', adminError.message)
      return
    }
    console.log('✅ Admin asignado\n')

    console.log('═'.repeat(60))
    console.log('✨ ADMINISTRADOR CONFIGURADO EXITOSAMENTE')
    console.log('═'.repeat(60))
    console.log(`\n📧 Email:    ${email}`)
    console.log(`🔐 Clave:    Pianito1!`)
    console.log(`👤 Nombre:   ${nombre_completo}`)
    console.log(`🛡️  Rol:      Admin`)
    console.log(`\n🚀 Puedes acceder en /login`)

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

fixAdmin()
