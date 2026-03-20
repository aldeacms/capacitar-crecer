#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qablhrycgplkgmzurtke.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhYmxocnljZ3Bsa2dtenVydGtlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzUzMTgyMCwiZXhwIjoyMDg5MTA3ODIwfQ.VCsRgKCtU2_Re8Ea1iuBVT1t0jfZ5_Gu1Oujd--ABiM'

const supabase = createClient(supabaseUrl, supabaseKey)

async function createAdminSQLDirect() {
  const email = 'daniel@luam.cl'
  const password = 'Pianito1!'
  const nombre = 'Daniel Aldea'
  const rut = '15534564-0'

  console.log('🔐 Creando admin con SQL directo (método correcto)\n')
  console.log(`Email: ${email}`)
  console.log(`Nombre: ${nombre}`)
  console.log(`RUT: ${rut}`)
  console.log(`Rol: Admin\n`)

  try {
    // 1. Insertar en auth.users usando SQL con crypt()
    console.log('1️⃣  Insertando en auth.users con SQL...')
    
    const createAuthSQL = `
      INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin)
      VALUES (
        gen_random_uuid(),
        '${email}',
        crypt('${password}', gen_salt('bf')),
        now(),
        now(),
        now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        '{}'::jsonb,
        false
      )
      RETURNING id;
    `

    const { data: authData, error: authError } = await supabase
      .rpc('query', { query_string: createAuthSQL })
      .catch(() => null)

    if (authError || !authData) {
      // Si RPC no funciona, intentar con SQL query directo via función
      console.log('   ℹ️  RPC no disponible, intentando método alternativo...')
      
      // Usar Supabase SQL editor via REST si está disponible
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sql: createAuthSQL
        })
      }).catch(e => ({ ok: false, error: e }))

      if (!response.ok) {
        throw new Error('No se puede ejecutar SQL directo - usar Supabase Console')
      }
    }

    // Si llegamos aquí, obtener el ID del usuario creado
    console.log('   ⏳ Obteniendo usuario creado...')
    
    const { data: { users } } = await supabase.auth.admin.listUsers()
    const newUser = users.find(u => u.email === email)

    if (!newUser) {
      throw new Error('Usuario no encontrado después de crear')
    }

    const userId = newUser.id
    console.log(`   ✅ Usuario creado con ID: ${userId}\n`)

    // 2. Insertar en perfiles
    console.log('2️⃣  Insertando perfil...')
    
    const { error: perfilError } = await supabase
      .from('perfiles')
      .insert({
        id: userId,
        nombre_completo: nombre,
        rut: rut
      })

    if (perfilError) {
      throw new Error(`Error en perfil: ${perfilError.message}`)
    }
    console.log('   ✅ Perfil creado\n')

    // 3. Insertar en admin_users
    console.log('3️⃣  Asignando rol admin...')
    
    const { error: adminError } = await supabase
      .from('admin_users')
      .insert({
        id: userId,
        is_active: true
      })

    if (adminError) {
      throw new Error(`Error en admin: ${adminError.message}`)
    }
    console.log('   ✅ Rol asignado\n')

    // ✅ ÉXITO
    console.log('═'.repeat(70))
    console.log('✨ ADMINISTRADOR CREADO EXITOSAMENTE')
    console.log('═'.repeat(70))
    console.log(`\n👤 Nombre:       ${nombre}`)
    console.log(`📧 Email:        ${email}`)
    console.log(`🔐 Contraseña:   ${password}`)
    console.log(`🔑 RUT:          ${rut}`)
    console.log(`🛡️  Rol:          Admin`)
    console.log(`\n🌐 Inicia sesión en: http://localhost:3000/login`)
    console.log('═'.repeat(70))

  } catch (error) {
    console.error('\n❌ Error:', error.message)
    console.log('\n📋 SOLUCIÓN MANUAL (si SQL directo no funciona):')
    console.log('\n1. Ve a: https://supabase.com/dashboard/project/qablhrycgplkgmzurtke')
    console.log('2. SQL Editor → Nueva query')
    console.log('3. Ejecuta este SQL:\n')
    console.log(`INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin)
VALUES (
  gen_random_uuid(),
  '${email}',
  crypt('${password}', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb,
  false
) RETURNING id;\n`)
    console.log('4. Copia el ID retornado')
    console.log('5. Ejecuta este SQL con el ID:\n')
    console.log(`INSERT INTO perfiles (id, nombre_completo, rut) VALUES ('<ID>', '${nombre}', '${rut}');\n`)
    console.log('6. Ejecuta este SQL con el ID:\n')
    console.log(`INSERT INTO admin_users (id, is_active) VALUES ('<ID>', true);\n`)
  }
}

createAdminSQLDirect()
