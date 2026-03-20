#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qablhrycgplkgmzurtke.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhYmxocnljZ3Bsa2dtenVydGtlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzUzMTgyMCwiZXhwIjoyMDg5MTA3ODIwfQ.VCsRgKCtU2_Re8Ea1iuBVT1t0jfZ5_Gu1Oujd--ABiM'
const supabase = createClient(supabaseUrl, supabaseKey)

const email = 'daniel@luam.cl'
const password = 'Pianito1!'
const nombre_completo = 'Daniel Aldea'
const rut = '15534564-0'
const rol = 'admin'

async function createAdmin() {
  try {
    console.log('🔧 Creando administrador via RPC...\n')
    
    const { data: rpcResult, error: rpcError } = await supabase.rpc('create_new_user', {
      p_email: email,
      p_password: password,
      p_nombre: nombre_completo,
      p_rut: rut,
      p_rol: rol
    })
    
    if (rpcError) {
      console.error('❌ RPC Error:', rpcError.message)
      return
    }
    
    if (!rpcResult || !rpcResult[0]) {
      console.error('❌ No result from RPC')
      return
    }
    
    const result = rpcResult[0]
    
    if (!result.success) {
      console.error('❌ RPC returned failure:', result.error_message)
      return
    }
    
    const userId = result.user_id
    console.log(`✅ Usuario creado via RPC con ID: ${userId}`)
    
    console.log('\n' + '═'.repeat(60))
    console.log('✨ ADMINISTRADOR CREADO EXITOSAMENTE\n')
    console.log('Datos de acceso:')
    console.log(`  Email:    ${email}`)
    console.log(`  Clave:    ${password}`)
    console.log(`  Nombre:   ${nombre_completo}`)
    console.log(`  RUT:      ${rut}`)
    console.log(`  Rol:      ${rol.toUpperCase()}`)
    console.log('═'.repeat(60))
    console.log('\nPuedes iniciar sesión en: /login')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

createAdmin()
