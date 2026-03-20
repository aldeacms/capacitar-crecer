#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qablhrycgplkgmzurtke.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhYmxocnljZ3Bsa2dtenVydGtlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzUzMTgyMCwiZXhwIjoyMDg5MTA3ODIwfQ.VCsRgKCtU2_Re8Ea1iuBVT1t0jfZ5_Gu1Oujd--ABiM'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkAdmin() {
  console.log('🔍 Verificando estado del admin actual...\n')

  const userId = '7983c049-fa7b-42d9-bfba-41fbdfc57eb2' // daniel@lifefocus.agency

  try {
    // Verificar en admin_users
    console.log('1️⃣  Buscando en admin_users...')
    const { data: adminData, error: adminError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('id', userId)
      .single()

    if (adminError && adminError.code === 'PGRST116') {
      console.log('   ❌ NO ESTÁ EN admin_users')
    } else if (adminError) {
      console.error('   Error:', adminError)
    } else {
      console.log('   ✅ ESTÁ en admin_users')
      console.log('   ', adminData)
    }

    console.log()
    console.log('2️⃣  Buscando en perfiles...')
    const { data: perfilData, error: perfilError } = await supabase
      .from('perfiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (perfilError) {
      console.error('   Error:', perfilError)
    } else {
      console.log('   ✅ Perfil encontrado:')
      console.log('   ', perfilData)
    }

  } catch (error) {
    console.error('Error:', error.message)
  }
}

checkAdmin()
