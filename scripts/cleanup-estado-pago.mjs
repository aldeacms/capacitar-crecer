#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qablhrycgplkgmzurtke.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhYmxocnljZ3Bsa2dtenVydGtlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzUzMTgyMCwiZXhwIjoyMDg5MTA3ODIwfQ.VCsRgKCtU2_Re8Ea1iuBVT1t0jfZ5_Gu1Oujd--ABiM'

const supabase = createClient(supabaseUrl, supabaseKey)

async function cleanup() {
  console.log('🧹 Limpiando estado_pago_curso en matriculas...\n')

  // Obtener todas las matrículas
  const { data: matriculas, error: getError } = await supabase
    .from('matriculas')
    .select('id, estado_pago_curso')

  if (getError) {
    console.error('❌ Error al obtener matrículas:', getError.message)
    return
  }

  if (!matriculas || matriculas.length === 0) {
    console.log('ℹ️  No hay matrículas para limpiar')
    return
  }

  console.log(`Encontradas ${matriculas.length} matrículas\n`)

  // Actualizar todas las matrículas a estado_pago_curso = false
  // (sin sistema de pagos real, ninguna ha sido pagada)
  const { data, error: updateError } = await supabase
    .from('matriculas')
    .update({ estado_pago_curso: false })
    .neq('estado_pago_curso', false) // Solo actualizar si no es false ya

  if (updateError) {
    console.error('❌ Error al actualizar:', updateError.message)
    return
  }

  console.log('✅ Actualización completada')
  console.log('\nDetalles:')
  console.log('─'.repeat(60))

  // Mostrar resultado
  const { data: updated, error: verifyError } = await supabase
    .from('matriculas')
    .select('id, perfil_id, curso_id, estado_pago_curso, cursos(titulo)')

  if (verifyError) {
    console.error('❌ Error al verificar:', verifyError.message)
    return
  }

  updated?.forEach((m, idx) => {
    console.log(`${idx + 1}. ${m.cursos?.titulo}`)
    console.log(`   Matrícula ID: ${m.id}`)
    console.log(`   estado_pago_curso: ${m.estado_pago_curso}`)
    console.log()
  })

  console.log('─'.repeat(60))
  console.log(`\n💰 INGRESOS TOTALES: $0`)
  console.log(`   (Sin sistema de pagos real configurado)`)
  console.log('\n📝 Próximos pasos:')
  console.log('   1. Crear tabla "pagos" cuando se implemente sistema real')
  console.log('   2. Actualizar dashboard para consultar tabla "pagos"')
  console.log('   3. Usar estado_pago_curso solo para matrículas con pago de certificado')
}

cleanup()
