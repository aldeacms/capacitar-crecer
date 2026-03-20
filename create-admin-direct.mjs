#!/usr/bin/env node

import https from 'https'

const supabaseUrl = 'https://qablhrycgplkgmzurtke.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhYmxocnljZ3Bsa2dtenVydGtlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzUzMTgyMCwiZXhwIjoyMDg5MTA3ODIwfQ.VCsRgKCtU2_Re8Ea1iuBVT1t0jfZ5_Gu1Oujd--ABiM'

const email = 'daniel@luam.cl'
const password = 'Pianito1!'
const nombre_completo = 'Daniel Aldea'
const rut = '15534564-0'

async function executeSQL(sql) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'qablhrycgplkgmzurtke.supabase.co',
      port: 443,
      path: '/rest/v1/rpc/sql',
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    }

    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ success: true, data })
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`))
        }
      })
    })

    req.on('error', reject)
    req.write(JSON.stringify({ sql }))
    req.end()
  })
}

async function createAdminDirect() {
  try {
    console.log('🔧 Creando administrador via SQL directo...\n')
    
    // Generar UUID
    const uuidSql = "SELECT gen_random_uuid()::TEXT as id;"
    const uuidRes = await executeSQL(uuidSql)
    console.log('Response:', uuidRes)
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.log('\nAlternative: ejecutar manualmente en Supabase console:')
    console.log(`
SELECT gen_random_uuid() as new_id;
-- Copia el ID generado y ejecuta:
-- INSERT INTO auth.users ... 
-- INSERT INTO perfiles ...
    `)
  }
}

createAdminDirect()
