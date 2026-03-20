#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabaseUrl = 'https://qablhrycgplkgmzurtke.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhYmxocnljZ3Bsa2dtenVydGtlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzUzMTgyMCwiZXhwIjoyMDg5MTA3ODIwfQ.VCsRgKCtU2_Re8Ea1iuBVT1t0jfZ5_Gu1Oujd--ABiM'

const supabase = createClient(supabaseUrl, supabaseKey)

async function createAdminSQL() {
  const email = 'daniel@luam.cl'
  const password = 'Pianito1!'
  const nombre = 'Daniel Aldea'
  const userId = crypto.randomUUID()

  console.log('🔐 Creando admin con SQL directo...\n')

  try {
    // Intentar crear usuario directamente con RPC si existe
    console.log('Intentando con RPC de Supabase...')
    
    const { data, error } = await supabase.rpc('create_user', {
      user_email: email,
      user_password: password
    })

    if (error) {
      console.log(`RPC no disponible: ${error.message}\n`)
      
      // Alternativa: Crear solo en perfiles y admin_users (sin auth)
      console.log('Intentando crear en perfiles y admin_users...')
      console.log('⚠️  NOTA: Esto requiere un flujo de invitación después\n')
      
      const { error: perfilError } = await supabase
        .from('perfiles')
        .insert({
          id: userId,
          nombre_completo: nombre,
          rut: null
        })

      if (perfilError) {
        console.error('❌ Error en perfiles:', perfilError)
        return
      }

      const { error: adminError } = await supabase
        .from('admin_users')
        .insert({
          id: userId,
          is_active: true
        })

      if (adminError) {
        console.error('❌ Error en admin_users:', adminError)
        return
      }

      console.log('═'.repeat(70))
      console.log('⚠️  ADMIN CREADO SIN AUTH')
      console.log('═'.repeat(70))
      console.log(`\nID: ${userId}`)
      console.log(`Nombre: ${nombre}`)
      console.log(`\nACCION REQUERIDA:`)
      console.log(`1. Crear usuario en Supabase manualmente:`)
      console.log(`   - Auth → Users → Add user`)
      console.log(`   - Email: ${email}`)
      console.log(`   - Password: ${password}`)
      console.log(`   - User ID: ${userId}`)
      console.log(`\n2. O ejecutar SQL en Supabase Console:`)
      console.log(`   INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at)`)
      console.log(`   VALUES ('${userId}', '${email}', ..., NOW());`)

    } else {
      console.log('✅ Usuario creado vía RPC')
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

createAdminSQL()
