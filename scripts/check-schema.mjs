#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qablhrycgplkgmzurtke.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhYmxocnljZ3Bsa2dtenVydGtlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzUzMTgyMCwiZXhwIjoyMDg5MTA3ODIwfQ.VCsRgKCtU2_Re8Ea1iuBVT1t0jfZ5_Gu1Oujd--ABiM'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkSchema() {
  console.log('📋 Verificando schema de perfiles...\n')

  try {
    // Obtener un perfil existente
    const { data, error } = await supabase
      .from('perfiles')
      .select('*')
      .limit(1)

    if (error) {
      console.error('Error:', error)
      return
    }

    if (data && data.length > 0) {
      console.log('Ejemplo de perfil:')
      console.log(JSON.stringify(data[0], null, 2))
    }

  } catch (error) {
    console.error('Error:', error.message)
  }
}

checkSchema()
