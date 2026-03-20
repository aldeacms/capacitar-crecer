#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qablhrycgplkgmzurtke.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhYmxocnljZ3Bsa2dtenVydGtlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzUzMTgyMCwiZXhwIjoyMDg5MTA3ODIwfQ.VCsRgKCtU2_Re8Ea1iuBVT1t0jfZ5_Gu1Oujd--ABiM'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkUsers() {
  console.log('📋 Verificando usuarios existentes...\n')

  try {
    const { data: { users }, error } = await supabase.auth.admin.listUsers()
    
    if (error) {
      console.error('❌ Error:', error.message)
      return
    }

    if (users.length === 0) {
      console.log('No hay usuarios en el sistema aún.')
      return
    }

    console.log(`Total de usuarios: ${users.length}\n`)
    users.forEach((user, idx) => {
      console.log(`${idx + 1}. ${user.email}`)
      console.log(`   ID: ${user.id}`)
      console.log(`   Creado: ${new Date(user.created_at).toLocaleString('es-CL')}`)
      console.log()
    })
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

checkUsers()
