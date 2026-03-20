#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qablhrycgplkgmzurtke.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhYmxocnljZ3Bsa2dtenVydGtlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzUzMTgyMCwiZXhwIjoyMDg5MTA3ODIwfQ.VCsRgKCtU2_Re8Ea1iuBVT1t0jfZ5_Gu1Oujd--ABiM'

const supabase = createClient(supabaseUrl, supabaseKey)

async function verify() {
  console.log('🔍 Verificando estado_pago_curso en matriculas...\n')

  const { data: matriculas, error } = await supabase
    .from('matriculas')
    .select('id, perfil_id, curso_id, estado_pago_curso, cursos(titulo, precio_curso)')

  if (error) {
    console.error('❌ Error:', error.message)
    return
  }

  console.log(`Total matrículas: ${matriculas.length}\n`)

  console.log('Detalles por matrícula:')
  console.log('─'.repeat(100))

  let totalIngresos = 0

  matriculas.forEach((m, idx) => {
    const curso = m.cursos
    const estadoPago = m.estado_pago_curso
    const precio = curso?.precio_curso || 0

    // Si estado_pago_curso es true (boolean), cuenta para ingresos
    const ingreso = estadoPago === true ? precio : 0
    totalIngresos += ingreso

    console.log(`${idx + 1}. ID: ${m.id}`)
    console.log(`   Curso: ${curso?.titulo}`)
    console.log(`   Precio curso: $${precio}`)
    console.log(`   estado_pago_curso: ${estadoPago} (tipo: ${typeof estadoPago})`)
    console.log(`   Contribuye a ingresos: ${ingreso > 0 ? `✅ $${ingreso}` : '❌ No'}`)
    console.log()
  })

  console.log('─'.repeat(100))
  console.log(`\n💰 INGRESOS TOTALES REALES: $${totalIngresos}`)
  console.log(`   (Solo incluye matrículas donde estado_pago_curso === true)`)
}

verify()
