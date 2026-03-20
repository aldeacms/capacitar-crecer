#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qablhrycgplkgmzurtke.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhYmxocnljZ3Bsa2dtenVydGtlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzUzMTgyMCwiZXhwIjoyMDg5MTA3ODIwfQ.VCsRgKCtU2_Re8Ea1iuBVT1t0jfZ5_Gu1Oujd--ABiM'

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixOrphanedProfiles() {
  console.log('🔧 Iniciando proceso de limpieza de perfiles huérfanos...\n')

  try {
    // 1. Obtener usuarios de auth
    console.log('1️⃣ Obteniendo usuarios de auth.users...')
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers()
    if (authError) throw authError

    const authIds = new Set(users.map(u => u.id))
    console.log(`✅ Found ${users.length} users in auth.users`)

    // 2. Obtener perfiles
    console.log('\n2️⃣ Obteniendo perfiles...')
    const { data: perfiles, error: perfilesError } = await supabase
      .from('perfiles')
      .select('id, nombre_completo, rut')
      .order('created_at', { ascending: false })
    if (perfilesError) throw perfilesError

    console.log(`✅ Found ${perfiles.length} profiles`)

    // 3. Identificar perfiles huérfanos
    const orphaned = perfiles.filter(p => !authIds.has(p.id))

    if (orphaned.length === 0) {
      console.log('\n✅ No se encontraron perfiles huérfanos. BD está sincronizada.')
      return
    }

    console.log(`\n⚠️  Encontrados ${orphaned.length} perfiles huérfanos:\n`)
    orphaned.forEach((p, i) => {
      console.log(`${i + 1}. ${p.nombre_completo} (${p.id})`)
      console.log(`   RUT: ${p.rut || 'N/A'}\n`)
    })

    // 4. Eliminar perfiles huérfanos
    console.log('🗑️ Eliminando perfiles huérfanos...\n')

    for (const orphan of orphaned) {
      const { error: deleteError } = await supabase
        .from('perfiles')
        .delete()
        .eq('id', orphan.id)

      if (deleteError) {
        console.error(`❌ Error eliminando ${orphan.nombre_completo}:`, deleteError.message)
        throw deleteError
      }

      console.log(`✅ Eliminado: ${orphan.nombre_completo}`)
    }

    // 5. Verificar resultado
    console.log('\n📊 Verificando resultado...')
    const { data: remainingProfiles, error: verifyError } = await supabase
      .from('perfiles')
      .select('id, nombre_completo')

    if (verifyError) throw verifyError

    const stillOrphaned = remainingProfiles.filter(p => !authIds.has(p.id))

    if (stillOrphaned.length === 0) {
      console.log(`\n✅ ¡ÉXITO! Ahora hay ${remainingProfiles.length} perfiles, todos sincronizados con auth.users`)
      console.log('\n📈 Estado final:')
      console.log(`   - Usuarios en auth.users: ${users.length}`)
      console.log(`   - Perfiles sincronizados: ${remainingProfiles.length}`)
      console.log(`   - Perfiles huérfanos eliminados: ${orphaned.length}`)
    } else {
      console.error(`\n❌ Aún hay ${stillOrphaned.length} perfiles huérfanos`)
      throw new Error('Failed to remove all orphaned profiles')
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error.message)
    process.exit(1)
  }
}

fixOrphanedProfiles()
