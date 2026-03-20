#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qablhrycgplkgmzurtke.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhYmxocnljZ3Bsa2dtenVydGtlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzUzMTgyMCwiZXhwIjoyMDg5MTA3ODIwfQ.VCsRgKCtU2_Re8Ea1iuBVT1t0jfZ5_Gu1Oujd--ABiM'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkDaniel() {
  console.log('🔍 Buscando daniel@luam.cl en la BD...\n')

  try {
    // Buscar en perfiles
    const { data: perfiles, error: perfilError } = await supabase
      .from('perfiles')
      .select('*')
      .ilike('email', '%daniel%')

    console.log('Perfiles encontrados:')
    console.log(JSON.stringify(perfiles, null, 2))
    console.log()

    // Buscar en admin_users
    const { data: admins, error: adminError } = await supabase
      .from('admin_users')
      .select('*')

    console.log('Admin users:')
    console.log(JSON.stringify(admins, null, 2))

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

checkDaniel()
