#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qablhrycgplkgmzurtke.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhYmxocnljZ3Bsa2dtenVydGtlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzUzMTgyMCwiZXhwIjoyMDg5MTA3ODIwfQ.VCsRgKCtU2_Re8Ea1iuBVT1t0jfZ5_Gu1Oujd--ABiM'

const supabase = createClient(supabaseUrl, supabaseKey)

async function findOrphaned() {
  console.log('🔍 Buscando perfiles huérfanos o inconsistencias...\n')

  try {
    // Obtener todos los users de auth
    const { data: { users: authUsers } } = await supabase.auth.admin.listUsers()
    console.log(`1️⃣  Users en auth.users: ${authUsers.length}`)
    authUsers.forEach(u => console.log(`   - ${u.id}: ${u.email}`))

    console.log()

    // Obtener todos los perfiles
    const { data: perfiles, error: perfilError } = await supabase
      .from('perfiles')
      .select('*')

    console.log(`2️⃣  Perfiles en tabla perfiles: ${perfiles?.length || 0}`)
    perfiles?.forEach(p => {
      console.log(`   - ${p.id}: ${p.nombre_completo}`)
    })

    console.log()
    console.log('3️⃣  Verificando consistencia:')

    // Perfiles sin usuario en auth
    const authIds = new Set(authUsers.map(u => u.id))
    const orphanedProfiles = perfiles?.filter(p => !authIds.has(p.id)) || []

    if (orphanedProfiles.length > 0) {
      console.log(`   ❌ Perfiles sin usuario en auth (${orphanedProfiles.length}):`)
      orphanedProfiles.forEach(p => {
        console.log(`      - ${p.id}: ${p.nombre_completo}`)
      })
    } else {
      console.log('   ✅ Todos los perfiles tienen usuario en auth')
    }

    console.log()

    // Users sin perfil
    const profileIds = new Set(perfiles?.map(p => p.id) || [])
    const usersWithoutProfile = authUsers.filter(u => !profileIds.has(u.id))

    if (usersWithoutProfile.length > 0) {
      console.log(`   ⚠️  Usuarios sin perfil (${usersWithoutProfile.length}):`)
      usersWithoutProfile.forEach(u => {
        console.log(`      - ${u.id}: ${u.email}`)
      })
    } else {
      console.log('   ✅ Todos los usuarios tienen perfil')
    }

  } catch (error) {
    console.error('Error:', error.message)
  }
}

findOrphaned()
