/**
 * Script para crear/resetear usuario administrador
 *
 * Usa SQL directo vía client.rpc() para máxima confiabilidad
 *
 * Uso:
 *   npx tsx scripts/seed-admin.ts                              [modo interactivo]
 *   npx tsx scripts/seed-admin.ts daniel@luam.cl Pwd123!@# "Daniel López" "12345678-K"  [con argumentos]
 *   npm run seed:admin                                         [alias en package.json]
 */

import { createClient } from '@supabase/supabase-js'
import * as readline from 'readline'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
  console.error('❌ Error: Variables de entorno no configuradas')
  console.error('Necesitas: NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE)

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer)
    })
  })
}

function validateRUT(rut: string): boolean {
  // Formato básico: XXXXXXXX-K o XXXXXXXX-N (8 dígitos, guion, 1 carácter)
  return /^\d{7,8}-[KK0-9]$/i.test(rut)
}

async function main() {
  console.log('\n📋 === SEED DE USUARIO ADMINISTRADOR ===\n')

  // Obtener credenciales desde argumentos o modo interactivo
  let email = process.argv[2]
  let password = process.argv[3]
  let fullName = process.argv[4]
  let rut = process.argv[5]

  if (!email) {
    email = await question('Email del admin (ej: daniel@luam.cl): ')
  }
  if (!password) {
    password = await question('Contraseña (mín 8 caracteres): ')
  }
  if (!fullName) {
    fullName = await question('Nombre completo (ej: Daniel López): ')
  }
  if (!rut) {
    rut = await question('RUT (formato: 12345678-K): ')
  }

  // Validaciones
  if (!email || !password || !fullName || !rut) {
    console.error('❌ Error: Todos los campos son requeridos')
    rl.close()
    process.exit(1)
  }

  if (password.length < 8) {
    console.error('❌ Error: La contraseña debe tener al menos 8 caracteres')
    rl.close()
    process.exit(1)
  }

  if (!validateRUT(rut)) {
    console.error('❌ Error: RUT inválido. Formato: 12345678-K')
    rl.close()
    process.exit(1)
  }

  if (!email.includes('@')) {
    console.error('❌ Error: Email inválido')
    rl.close()
    process.exit(1)
  }

  try {
    console.log('\n⏳ Procesando...\n')

    // Usar SQL raw para máxima confiabilidad
    const { data, error } = await supabaseAdmin.rpc('create_or_update_admin', {
      p_email: email.toLowerCase(),
      p_password: password,
      p_rut: rut.toUpperCase(),
      p_nombre: fullName,
    })

    if (error) {
      console.error('❌ Error:', error.message)
      rl.close()
      process.exit(1)
    }

    console.log('═══════════════════════════════════════════')
    console.log('✅ ADMIN CREADO EXITOSAMENTE\n')
    console.log('Credenciales:')
    console.log(`  Email:    ${email}`)
    console.log(`  Password: ${password}`)
    console.log(`  RUT:      ${rut.toUpperCase()}\n`)
    console.log('Accede en: http://localhost:3000/login')
    console.log('═══════════════════════════════════════════\n')

    rl.close()
  } catch (error) {
    console.error('❌ Error inesperado:', error)
    rl.close()
    process.exit(1)
  }
}

main()
