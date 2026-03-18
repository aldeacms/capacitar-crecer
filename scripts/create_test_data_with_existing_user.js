#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('MISSING_ENV: check .env.local for NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
    process.exit(2)
  }

  const admin = createClient(url, key)

  try {
    const usersRes = await admin.auth.admin.listUsers()
    if (usersRes.error) {
      console.error('LIST_USERS_ERROR', usersRes.error)
      process.exit(1)
    }

    const users = usersRes.data.users
    if (!users || users.length === 0) {
      console.error('NO_AUTH_USERS_FOUND')
      process.exit(1)
    }

    const user = users[0]
    const userId = user.id
    const nombre = (user.user_metadata && user.user_metadata.full_name) || user.email || 'Test User'
    console.log('USING_USER', { userId, nombre })

    // ensure perfil exists
    const perfilCheck = await admin.from('perfiles').select('*').eq('id', userId).maybeSingle()
    if (perfilCheck.error) {
      console.error('PERFIL_CHECK_ERROR', perfilCheck.error)
      process.exit(1)
    }

    if (!perfilCheck.data) {
      const rut = `rut-${userId.slice(0,8)}`
      const insertPerfil = await admin.from('perfiles').insert({ id: userId, nombre_completo: nombre, rol: 'alumno', rut }).select()
      console.log('PERFIL_INSERT', JSON.stringify(insertPerfil, null, 2))
      if (insertPerfil.error) {
        console.error('PERFIL_INSERT_ERROR', insertPerfil.error)
        process.exit(1)
      }
    } else {
      console.log('PERFIL_EXISTS', perfilCheck.data)
    }

    // create course
    const crypto = require('crypto')
    const courseId = crypto.randomUUID()
    const slug = `test-course-${courseId.slice(0,8)}`
    const curso = await admin.from('cursos').insert({ id: courseId, titulo: 'Test Course (integration)', slug }).select()
    console.log('CURSO_INSERT', JSON.stringify(curso, null, 2))
    if (curso.error) {
      console.error('CURSO_INSERT_ERROR', curso.error)
      process.exit(1)
    }

    // create matricula
    const matricula = await admin.from('matriculas').insert({ perfil_id: userId, curso_id: courseId, estado_pago_curso: true, progreso_porcentaje: 0 }).select()
    console.log('MATRICULA_INSERT', JSON.stringify(matricula, null, 2))
    if (matricula.error) {
      console.error('MATRICULA_INSERT_ERROR', matricula.error)
      process.exit(1)
    }

    console.log('INTEGRATION_TEST_DONE')
  } catch (e) {
    console.error('ERROR', e && e.message ? e.message : e)
    process.exit(1)
  }
}

main()
