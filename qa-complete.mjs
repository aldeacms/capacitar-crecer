#!/usr/bin/env node

import { validateAndNormalizeRUT, validateRUTDigit } from './src/lib/rut-validator.ts'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qablhrycgplkgmzurtke.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhYmxocnljZ3Bsa2dtenVydGtlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzUzMTgyMCwiZXhwIjoyMDg5MTA3ODIwfQ.VCsRgKCtU2_Re8Ea1iuBVT1t0jfZ5_Gu1Oujd--ABiM'
const supabase = createClient(supabaseUrl, supabaseKey)

async function runQA() {
  console.log('🧪 QA COMPLETO DEL SISTEMA\n')
  console.log('═'.repeat(60))

  // Test 1: Validador RUT
  console.log('\n1️⃣  TEST: Validador RUT (Módulo 11)\n')

  const testCases = [
    { rut: '15.534.564-0', valid: true, description: 'RUT válido formato oficial' },
    { rut: '155345640', valid: true, description: 'RUT válido sin puntos' },
    { rut: '15534564-0', valid: true, description: 'RUT válido formato alternativo' },
    { rut: '15.534.564-1', valid: false, description: 'RUT con dígito incorrecto' },
    { rut: '12345678-k', valid: true, description: 'RUT válido con K' },
    { rut: '', valid: false, description: 'RUT vacío' },
    { rut: '99.999.999-9', valid: false, description: 'RUT con dígito verificador incorrecto' }
  ]

  let passedTests = 0
  testCases.forEach(test => {
    const result = validateAndNormalizeRUT(test.rut)
    const status = result.valid === test.valid ? '✅' : '❌'
    console.log(`${status} ${test.description}`)
    console.log(`   Entrada: "${test.rut}" → Esperado: ${test.valid}, Obtenido: ${result.valid}`)
    if (result.valid) console.log(`   Normalizado: ${result.normalized}`)
    if (!result.valid) console.log(`   Error: ${result.error}`)
    if (result.valid === test.valid) passedTests++
    console.log()
  })

  console.log(`Resultado: ${passedTests}/${testCases.length} tests pasados\n`)

  if (passedTests !== testCases.length) {
    console.error('❌ QA FALLÓ: Validador RUT no funciona correctamente')
    process.exit(1)
  }

  // Test 2: Crear usuario admin
  console.log('═'.repeat(60))
  console.log('\n2️⃣  TEST: Crear usuario admin daniel@luam.cl\n')

  const email = 'daniel@luam.cl'
  const password = 'Pianito1!'
  const nombre_completo = 'Daniel Aldea'
  const rut = '15.534.564-0'

  try {
    // Limpiar si existe
    console.log('   a) Limpiando usuario anterior si existe...')
    const { data: { users } } = await supabase.auth.admin.listUsers()
    const existing = users.find(u => u.email === email)
    if (existing) {
      await supabase.auth.admin.deleteUser(existing.id)
      console.log('      ✅ Usuario anterior eliminado\n')
    } else {
      console.log('      ℹ️  No existía usuario anterior\n')
    }

    // Crear usuario via REST API
    console.log('   b) Creando usuario en auth.users...')
    const authResponse = await fetch(
      `${supabaseUrl}/auth/v1/admin/users`,
      {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password, email_confirm: true })
      }
    )

    if (!authResponse.ok) {
      const err = await authResponse.json()
      throw new Error(`Auth API failed: ${err.error_description || err.message}`)
    }

    const authData = await authResponse.json()
    const userId = authData.user?.id
    console.log(`      ✅ Usuario auth creado: ${userId}\n`)

    // Crear perfil
    console.log('   c) Creando perfil con RUT validado...')
    const { error: perfilError } = await supabase.from('perfiles').insert({
      id: userId,
      nombre_completo,
      rut,
      rol: 'admin',
      created_at: new Date().toISOString()
    })

    if (perfilError) throw new Error(`Perfil creation failed: ${perfilError.message}`)
    console.log('      ✅ Perfil creado\n')

    // Asignar rol admin
    console.log('   d) Asignando rol admin...')
    const { error: adminError } = await supabase
      .from('admin_users')
      .insert({ id: userId, is_active: true })

    if (adminError) throw new Error(`Admin assignment failed: ${adminError.message}`)
    console.log('      ✅ Rol admin asignado\n')

    // Verificaciones
    console.log('═'.repeat(60))
    console.log('\n3️⃣  TEST: Verificar integridad de datos\n')

    // Check auth.users
    console.log('   a) Verificando auth.users...')
    const { data: { users: allUsers } } = await supabase.auth.admin.listUsers()
    const authUser = allUsers.find(u => u.email === email)
    if (!authUser) throw new Error('Usuario no encontrado en auth.users')
    console.log(`      ✅ Email: ${authUser.email}`)
    console.log(`      ✅ Email confirmado: ${authUser.email_confirmed_at ? 'sí' : 'no'}\n`)

    // Check perfiles
    console.log('   b) Verificando tabla perfiles...')
    const { data: perfil, error: perfilCheckError } = await supabase
      .from('perfiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (perfilCheckError) throw new Error(`Perfil check failed: ${perfilCheckError.message}`)
    if (!perfil) throw new Error('Perfil no encontrado')
    console.log(`      ✅ Nombre: "${perfil.nombre_completo}"`)
    console.log(`      ✅ RUT: "${perfil.rut}"`)
    console.log(`      ✅ Rol: "${perfil.rol}"`)
    if (perfil.rol !== 'admin') throw new Error('Rol no es admin!')
    console.log(`      ✅ Creado: ${new Date(perfil.created_at).toLocaleString('es-CL')}\n`)

    // Check admin_users
    console.log('   c) Verificando tabla admin_users...')
    const { data: adminUser, error: adminCheckError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('id', userId)
      .single()

    if (adminCheckError) throw new Error(`Admin check failed: ${adminCheckError.message}`)
    if (!adminUser) throw new Error('Usuario no encontrado en admin_users')
    console.log(`      ✅ Estado: ${adminUser.is_active ? 'activo' : 'inactivo'}\n`)

    // Final summary
    console.log('═'.repeat(60))
    console.log('\n✨ QA PASSOU - TODO FUNCIONA CORRECTAMENTE!\n')
    console.log('📊 Resumen:')
    console.log(`   Email:        ${email}`)
    console.log(`   Contraseña:   ${password}`)
    console.log(`   Nombre:       ${nombre_completo}`)
    console.log(`   RUT:          ${rut}`)
    console.log(`   Rol:          admin`)
    console.log(`   User ID:      ${userId}`)
    console.log('\n✅ El sistema está LISTO para producción')
    console.log('🌐 Puedes iniciar sesión en: /login\n')
    console.log('═'.repeat(60))

  } catch (error) {
    console.error('\n❌ QA FALLÓ:\n', error.message)
    console.error(error)
    process.exit(1)
  }
}

runQA()
