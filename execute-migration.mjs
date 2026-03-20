#!/usr/bin/env node

import fs from 'fs'
import https from 'https'

const supabaseUrl = 'https://qablhrycgplkgmzurtke.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhYmxocnljZ3Bsa2dtenVydGtlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzUzMTgyMCwiZXhwIjoyMDg5MTA3ODIwfQ.VCsRgKCtU2_Re8Ea1iuBVT1t0jfZ5_Gu1Oujd--ABiM'

// Read migration file
const migrationSql = fs.readFileSync('supabase/migrations/20260320000001_create_user_function.sql', 'utf-8')

console.log('Attempting to execute migration via Supabase...')
console.log('Note: This requires using REST API or raw query capability\n')

// Try via REST - Supabase SQL endpoint if it exists
const endpoint = `${supabaseUrl}/rest/v1/rpc/sql`

const options = {
  method: 'POST',
  headers: {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json'
  }
}

const req = https.request(endpoint.replace('https://', ''), options, (res) => {
  let data = ''
  res.on('data', chunk => data += chunk)
  res.on('end', () => {
    console.log('Response status:', res.statusCode)
    console.log('Response:', data)
  })
})

req.on('error', (e) => {
  console.error('❌ Request failed:', e.message)
  console.log('\n⚠️  The REST SQL endpoint is not available.')
  console.log('You need to manually execute the migration in Supabase console:')
  console.log('1. Go to https://app.supabase.com/project/qablhrycgplkgmzurtke/sql')
  console.log('2. Copy and paste the SQL from supabase/migrations/20260320000001_create_user_function.sql')
  console.log('3. Run it')
})

req.write(JSON.stringify({ sql: migrationSql }))
req.end()
