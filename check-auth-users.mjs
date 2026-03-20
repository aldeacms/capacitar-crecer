#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qablhrycgplkgmzurtke.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhYmxocnljZ3Bsa2dtenVydGtlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzUzMTgyMCwiZXhwIjoyMDg5MTA3ODIwfQ.VCsRgKCtU2_Re8Ea1iuBVT1t0jfZ5_Gu1Oujd--ABiM'
const supabase = createClient(supabaseUrl, supabaseKey)

const email = 'daniel@luam.cl'

async function checkAuthUsers() {
  try {
    console.log('🔍 Querying auth.users for email:', email)
    
    // Try to query auth.users directly - this might show deleted records
    const { data, error } = await supabase.rpc('get_all_users')
    
    if (error) {
      console.log('RPC approach not available, trying different method...')
      
      // Alternative: try to see if we can query via the anon client with a problematic call
      console.log('\nTrying to identify the issue by attempting recreation...')
      
      // Let's check if maybe the issue is that the email exists in a special state
      // Try with email_confirm false instead
      console.log('Attempting with email_confirm: false...')
      const { data: authData2, error: error2 } = await supabase.auth.admin.createUser({
        email: email,
        password: 'Pianito1!',
        email_confirm: false  // Try without confirming
      })
      
      if (error2) {
        console.error('Error with email_confirm=false:', error2.message)
        
        // Let's try one more thing - maybe the constraint is at the Postgres level
        // and we need to see what's ACTUALLY in the database
        console.log('\n📊 Checking database state...')
        
        // Try a raw SQL query via postgres
        const { data: rawData, error: rawError } = await supabase
          .from('auth.users')
          .select('*')
          .eq('email', email)
        
        console.log('Direct table query result:', { data: rawData, error: rawError })
        return
      }
      
      console.log('✅ Created with email_confirm=false!')
      console.log('User ID:', authData2?.user?.id)
      return
    }
    
    console.log('Users found:', JSON.stringify(data, null, 2))
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error(error.stack)
  }
}

checkAuthUsers()
