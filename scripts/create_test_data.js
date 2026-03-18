#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const crypto = require('crypto')

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('MISSING_ENV: check .env.local for NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
    process.exit(2)
  }

  const admin = createClient(url, key)

  try {
    const userId = crypto.randomUUID()
    const courseId = crypto.randomUUID()
    const slug = `test-course-${userId.slice(0,8)}`

    console.log('TEST_IDS', { userId, courseId, slug })

    const perfil = await admin.from('perfiles').insert({ id: userId, nombre_completo: 'Test User', rol: 'alumno', rut: userId }).select()
    console.log('PERFIL_INSERT', JSON.stringify(perfil, null, 2))

    const curso = await admin.from('cursos').insert({ id: courseId, titulo: 'Test Course', slug }).select()
    console.log('CURSO_INSERT', JSON.stringify(curso, null, 2))

    const matricula = await admin.from('matriculas').insert({ perfil_id: userId, curso_id: courseId, estado_pago_curso: true, progreso_porcentaje: 0 }).select()
    console.log('MATRICULA_INSERT', JSON.stringify(matricula, null, 2))

    console.log('DONE')
  } catch (e) {
    console.error('ERROR', e && e.message ? e.message : e)
    process.exit(1)
  }
}

main()
