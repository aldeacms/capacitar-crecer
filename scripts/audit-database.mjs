#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

const supabaseUrl = 'https://qablhrycgplkgmzurtke.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhYmxocnljZ3Bsa2dtenVydGtlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzUzMTgyMCwiZXhwIjoyMDg5MTA3ODIwfQ.VCsRgKCtU2_Re8Ea1iuBVT1t0jfZ5_Gu1Oujd--ABiM'

const supabase = createClient(supabaseUrl, supabaseKey)

async function auditDatabase() {
  console.log('🔍 Starting comprehensive database audit...\n')

  const report = {
    timestamp: new Date().toISOString(),
    sections: {}
  }

  try {
    // 1. Auth Users
    console.log('1️⃣ Auditing auth.users...')
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers()
    if (authError) throw authError

    report.sections.auth_users = {
      total: users.length,
      users: users.map(u => ({
        id: u.id,
        email: u.email,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at
      }))
    }
    console.log(`✅ Found ${users.length} users in auth.users`)

    // 2. Perfiles
    console.log('\n2️⃣ Auditing perfiles table...')
    const { data: perfiles, error: perfilesError } = await supabase
      .from('perfiles')
      .select('*')
      .order('created_at', { ascending: false })
    if (perfilesError) throw perfilesError

    report.sections.perfiles = {
      total: perfiles.length,
      columns: perfiles.length > 0 ? Object.keys(perfiles[0]) : [],
      records: perfiles.map(p => ({
        id: p.id,
        nombre_completo: p.nombre_completo,
        email: p.email || 'N/A',
        rut: p.rut,
        rol: p.rol,
        created_at: p.created_at
      }))
    }
    console.log(`✅ Found ${perfiles.length} profiles`)

    // 3. Admin Users
    console.log('\n3️⃣ Auditing admin_users table...')
    const { data: admins, error: adminsError } = await supabase
      .from('admin_users')
      .select('*')
      .order('created_at', { ascending: false })
    if (adminsError) throw adminsError

    report.sections.admin_users = {
      total: admins.length,
      columns: admins.length > 0 ? Object.keys(admins[0]) : [],
      records: admins.map(a => ({
        id: a.id,
        email: a.email,
        is_active: a.is_active,
        created_at: a.created_at,
        created_by: a.created_by
      }))
    }
    console.log(`✅ Found ${admins.length} admin users`)

    // 4. Cursos
    console.log('\n4️⃣ Auditing cursos table...')
    const { data: cursos, error: cursosError, count: cursosCount } = await supabase
      .from('cursos')
      .select('id, titulo, slug, tipo_acceso, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
    if (cursosError) throw cursosError

    report.sections.cursos = {
      total: cursosCount,
      records: (cursos || []).slice(0, 10).map(c => ({
        id: c.id,
        titulo: c.titulo,
        slug: c.slug,
        tipo_acceso: c.tipo_acceso,
        created_at: c.created_at
      }))
    }
    console.log(`✅ Found ${cursosCount} courses`)

    // 5. Matriculas
    console.log('\n5️⃣ Auditing matriculas table...')
    const { data: matriculas, error: matriculasError, count: matriculasCount } = await supabase
      .from('matriculas')
      .select('id, perfil_id, curso_id, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(10)
    if (matriculasError) throw matriculasError

    report.sections.matriculas = {
      total: matriculasCount,
      records: (matriculas || []).map(m => ({
        id: m.id,
        perfil_id: m.perfil_id,
        curso_id: m.curso_id,
        created_at: m.created_at
      }))
    }
    console.log(`✅ Found ${matriculasCount} matriculas`)

    // 6. Categorias
    console.log('\n6️⃣ Auditing categorias table...')
    const { data: categorias, error: categoriasError, count: categoriasCount } = await supabase
      .from('categorias')
      .select('id, nombre, slug', { count: 'exact' })
    if (categoriasError) throw categoriasError

    report.sections.categorias = {
      total: categoriasCount,
      records: (categorias || []).map(c => ({
        id: c.id,
        nombre: c.nombre,
        slug: c.slug
      }))
    }
    console.log(`✅ Found ${categoriasCount} categories`)

    // 7. Modulos
    console.log('\n7️⃣ Auditing modulos table...')
    const { data: modulos, error: modulosError, count: modulosCount } = await supabase
      .from('modulos')
      .select('id, curso_id, titulo, orden, created_at', { count: 'exact' })
      .limit(10)
    if (modulosError) throw modulosError

    report.sections.modulos = {
      total: modulosCount,
      records: (modulos || []).map(m => ({
        id: m.id,
        curso_id: m.curso_id,
        titulo: m.titulo,
        orden: m.orden,
        created_at: m.created_at
      }))
    }
    console.log(`✅ Found ${modulosCount} modules`)

    // 8. Lecciones
    console.log('\n8️⃣ Auditing lecciones table...')
    const { data: lecciones, error: leccionesError, count: leccionesCount } = await supabase
      .from('lecciones')
      .select('id, modulo_id, titulo', { count: 'exact' })
      .limit(10)
    if (leccionesError) throw leccionesError

    report.sections.lecciones = {
      total: leccionesCount,
      records: (lecciones || []).map(l => ({
        id: l.id,
        modulo_id: l.modulo_id,
        titulo: l.titulo
      }))
    }
    console.log(`✅ Found ${leccionesCount} lessons`)

    // 9. Cupones
    console.log('\n9️⃣ Auditing cupones table...')
    const { data: cupones, error: cuponesError, count: cuponesCount } = await supabase
      .from('cupones')
      .select('id, codigo, descuento_porcentaje, usos_maximos, activo, created_at', { count: 'exact' })
    if (cuponesError) throw cuponesError

    report.sections.cupones = {
      total: cuponesCount,
      records: (cupones || []).map(c => ({
        id: c.id,
        codigo: c.codigo,
        descuento_porcentaje: c.descuento_porcentaje,
        usos_maximos: c.usos_maximos,
        activo: c.activo,
        created_at: c.created_at
      }))
    }
    console.log(`✅ Found ${cuponesCount} coupons`)

    // 10. Certificate Downloads
    console.log('\n🔟 Auditing certificate_downloads table...')
    const { data: certs, error: certsError, count: certsCount } = await supabase
      .from('certificate_downloads')
      .select('id, perfil_id, curso_id', { count: 'exact' })
      .limit(10)
    if (certsError) throw certsError

    report.sections.certificate_downloads = {
      total: certsCount,
      records: (certs || []).map(c => ({
        id: c.id,
        perfil_id: c.perfil_id,
        curso_id: c.curso_id
      }))
    }
    console.log(`✅ Found ${certsCount} certificate downloads`)

    // DATA CONSISTENCY CHECKS
    console.log('\n\n📊 DATA CONSISTENCY CHECKS:\n')

    // Check 1: auth.users vs perfiles
    const authIds = new Set(users.map(u => u.id))
    const perfilesIds = new Set(perfiles.map(p => p.id))

    const orfanosPerfil = perfiles.filter(p => !authIds.has(p.id))
    const ausentisPerfil = users.filter(u => !perfilesIds.has(u.id))

    if (orfanosPerfil.length > 0) {
      console.log('⚠️  PROBLEMA: Perfiles sin usuario en auth.users:')
      orfanosPerfil.forEach(p => {
        console.log(`   - ${p.nombre_completo} (${p.id})`)
      })
      report.sections.consistency_issues = report.sections.consistency_issues || {}
      report.sections.consistency_issues.orfanos_perfil = orfanosPerfil
    } else {
      console.log('✅ Todos los perfiles tienen usuario en auth.users')
    }

    if (ausentisPerfil.length > 0) {
      console.log('\n⚠️  PROBLEMA: Usuarios en auth.users sin perfil:')
      ausentisPerfil.forEach(u => {
        console.log(`   - ${u.email} (${u.id})`)
      })
      report.sections.consistency_issues = report.sections.consistency_issues || {}
      report.sections.consistency_issues.ausentes_perfil = ausentisPerfil
    } else {
      console.log('✅ Todos los usuarios en auth.users tienen perfil')
    }

    // Check 2: admin_users referencing valid users
    const adminUserIds = new Set(admins.map(a => a.id))
    const adminsSinUsuario = [...adminUserIds].filter(id => !authIds.has(id))

    if (adminsSinUsuario.length > 0) {
      console.log('\n⚠️  PROBLEMA: Admin users sin usuario en auth.users:')
      adminsSinUsuario.forEach(id => {
        console.log(`   - ${id}`)
      })
      report.sections.consistency_issues = report.sections.consistency_issues || {}
      report.sections.consistency_issues.admin_sin_usuario = adminsSinUsuario
    } else {
      console.log('\n✅ Todos los admin users tienen usuario en auth.users')
    }

    // Check 3: matriculas referencing valid profiles
    const matriculasInvalidas = (matriculas || []).filter(m => !perfilesIds.has(m.perfil_id) || m.curso_id && !new Set(cursos.map(c => c.id)).has(m.curso_id))
    if (matriculasInvalidas.length > 0) {
      console.log('\n⚠️  PROBLEMA: Matrículas con referencias inválidas:')
      console.log(`   - ${matriculasInvalidas.length} registros inválidos`)
      report.sections.consistency_issues = report.sections.consistency_issues || {}
      report.sections.consistency_issues.matriculas_invalidas = matriculasInvalidas
    } else {
      console.log('\n✅ Todas las matrículas tienen referencias válidas')
    }

    // Summary
    console.log('\n\n📈 RESUMEN:\n')
    console.log(`Total de usuarios: ${users.length}`)
    console.log(`Total de perfiles: ${perfiles.length}`)
    console.log(`Total de admins: ${admins.length}`)
    console.log(`Total de cursos: ${cursosCount}`)
    console.log(`Total de matrículas: ${matriculasCount}`)
    console.log(`Total de categorías: ${categoriasCount}`)
    console.log(`Total de módulos: ${modulosCount}`)
    console.log(`Total de lecciones: ${leccionesCount}`)
    console.log(`Total de cupones: ${cuponesCount}`)
    console.log(`Total de descargas certificado: ${certsCount}`)

    // Save audit report
    const auditPath = path.join(process.cwd(), 'audit', 'DATABASE_AUDIT.json')
    const auditDir = path.dirname(auditPath)

    if (!fs.existsSync(auditDir)) {
      fs.mkdirSync(auditDir, { recursive: true })
    }

    fs.writeFileSync(auditPath, JSON.stringify(report, null, 2))
    console.log(`\n✅ Audit report saved to: ${auditPath}`)

  } catch (error) {
    console.error('❌ ERROR:', error.message)
    process.exit(1)
  }
}

auditDatabase()
