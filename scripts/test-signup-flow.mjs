#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qablhrycgplkgmzurtke.supabase.co'
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhYmxocnljZ3Bsa2dtenVydGtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1MzE4MjAsImV4cCI6MjA4OTEwNzgyMH0.VCq7WpmA3j3Dx6a_2ZmDnnI6S8q1RLMZoS2PvC6c1io'

const supabase = createClient(supabaseUrl, anonKey)

async function testSignup() {
  console.log('🧪 Probando signup flow regular...\n')

  const email = 'test-signup@example.com'
  const password = 'TestPass123!'

  try {
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password
    })

    if (error) {
      console.log(`❌ Error en signup: ${error.message}`)
      console.log(`   Status: ${error.status}`)
    } else {
      console.log(`✅ Signup exitoso`)
      console.log(`   User ID: ${data.user?.id}`)
      console.log(`   Confirmed: ${data.user?.email_confirmed_at ? 'Sí' : 'No'}`)
    }

  } catch (error) {
    console.error('Error:', error.message)
  }
}

testSignup()
