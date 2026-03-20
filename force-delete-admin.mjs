#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qablhrycgplkgmzurtke.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhYmxocnljZ3Bsa2dtenVydGtlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzUzMTgyMCwiZXhwIjoyMDg5MTA3ODIwfQ.VCsRgKCtU2_Re8Ea1iuBVT1t0jfZ5_Gu1Oujd--ABiM'

const email = 'daniel@luam.cl'

async function forceDeleteViaRest() {
  try {
    // List all users to find the one to delete
    console.log('🔍 Listando usuarios...')
    const listResponse = await fetch(
      `${supabaseUrl}/auth/v1/admin/users`,
      {
        method: 'GET',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      }
    )

    const listData = await listResponse.json()
    
    if (!listResponse.ok) {
      console.error('❌ Error listando usuarios:', JSON.stringify(listData))
      return
    }

    const users = listData.users || []
    const targetUser = users.find(u => u.email === email)

    if (!targetUser) {
      console.log(`✅ No se encontró usuario ${email}`)
      console.log(`Total usuarios en el sistema: ${users.length}`)
      return
    }

    console.log(`Found user ${email} with ID: ${targetUser.id}`)
    console.log(`Deleting...`)

    // Delete via REST API
    const deleteResponse = await fetch(
      `${supabaseUrl}/auth/v1/admin/users/${targetUser.id}`,
      {
        method: 'DELETE',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      }
    )

    if (!deleteResponse.ok) {
      const deleteData = await deleteResponse.json()
      console.error('❌ Error deleting:', JSON.stringify(deleteData))
      return
    }

    console.log(`✅ User ${email} deleted successfully`)

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

forceDeleteViaRest()
