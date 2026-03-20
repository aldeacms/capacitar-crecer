#!/usr/bin/env node

const supabaseUrl = 'https://qablhrycgplkgmzurtke.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhYmxocnljZ3Bsa2dtenVydGtlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzUzMTgyMCwiZXhwIjoyMDg5MTA3ODIwfQ.VCsRgKCtU2_Re8Ea1iuBVT1t0jfZ5_Gu1Oujd--ABiM'

async function listUsers() {
  console.log('📋 Listando TODOS los usuarios de Auth...\n')

  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
      method: 'GET',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    })

    const data = await response.json()
    
    if (!response.ok) {
      console.error('Error:', data)
      return
    }

    console.log(`Total: ${data.users.length} usuarios\n`)
    data.users.forEach((user, idx) => {
      console.log(`${idx + 1}. ${user.email}`)
      console.log(`   ID: ${user.id}`)
      console.log(`   Confirmado: ${user.email_confirmed_at ? 'Sí' : 'No'}`)
      console.log()
    })

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

listUsers()
