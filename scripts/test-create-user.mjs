#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qablhrycgplkgmzurtke.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhYmxocnljZ3Bsa2dtenVydGtlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzUzMTgyMCwiZXhwIjoyMDg5MTA3ODIwfQ.VCsRgKCtU2_Re8Ea1iuBVT1t0jfZ5_Gu1Oujd--ABiM'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testCreate() {
  console.log('🧪 Probando creación de usuario...\n')

  const testCases = [
    { email: 'test1@example.com', password: 'TestPass123!' },
    { email: 'test2@example.com', password: 'Test123456' },
  ]

  for (const testCase of testCases) {
    console.log(`Probando: ${testCase.email}`)
    try {
      const { data, error } = await supabase.auth.admin.createUser({
        email: testCase.email,
        password: testCase.password,
        email_confirm: true
      })

      if (error) {
        console.error(`  ❌ ${error.message}`)
      } else {
        console.log(`  ✅ Creado: ${data.user.id}`)
      }
    } catch (e) {
      console.error(`  ❌ ${e.message}`)
    }
    console.log()
  }
}

testCreate()
