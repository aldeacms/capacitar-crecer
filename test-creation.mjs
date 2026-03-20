#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qablhrycgplkgmzurtke.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhYmxocnljZ3Bsa2dtenVydGtlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzUzMTgyMCwiZXhwIjoyMDg5MTA3ODIwfQ.VCsRgKCtU2_Re8Ea1iuBVT1t0jfZ5_Gu1Oujd--ABiM'
const supabase = createClient(supabaseUrl, supabaseKey)

async function testCreation() {
  // Test with a temporary email first
  const testEmail = `test-${Date.now()}@luam.cl`
  
  console.log('Testing admin creation with:', testEmail)
  
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: testEmail,
    password: 'TestPassword123!',
    email_confirm: true
  })
  
  if (authError) {
    console.error('❌ Admin API failed:', authError.message)
    return false
  }
  
  if (!authData?.user?.id) {
    console.error('❌ No user ID returned')
    return false
  }
  
  console.log('✅ Admin API works! User created:', authData.user.id)
  
  // Clean up
  await supabase.auth.admin.deleteUser(authData.user.id)
  console.log('✅ Test user cleaned up')
  
  return true
}

testCreation()
