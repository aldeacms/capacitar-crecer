'use server'

import { createClient } from '@/lib/supabase-server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { validateAndNormalizeRUT } from '@/lib/rut-validator'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Endpoint para crear usuarios de forma segura y transaccional
 * POST /api/admin/create-user
 * Body: { email, password, nombre_completo, rut, rol? }
 *
 * Arquitectura:
 * - Verifica autenticación y permisos del admin
 * - Crea usuario en auth.users via REST API (Supabase admin)
 * - Crea perfil en tabla perfiles con rol correctamente asignado
 * - Rollback automático si algo falla
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, nombre_completo, rut, rol = 'alumno' } = body

    // Validaciones de entrada
    if (!email || !password || !nombre_completo || !rut) {
      return NextResponse.json(
        { error: 'Email, contraseña, nombre y RUT son requeridos' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Contraseña debe tener al menos 8 caracteres' },
        { status: 400 }
      )
    }

    if (!['alumno', 'admin'].includes(rol)) {
      return NextResponse.json(
        { error: 'Rol debe ser "alumno" o "admin"' },
        { status: 400 }
      )
    }

    // Validar RUT (módulo 11 chileno)
    const rutValidation = validateAndNormalizeRUT(rut)
    if (!rutValidation.valid) {
      return NextResponse.json(
        { error: rutValidation.error },
        { status: 400 }
      )
    }
    const rutNormalizado = rutValidation.normalized!

    // Verificar autenticación
    const supabase = await createClient()
    const { data: { user: currentUser } } = await supabase.auth.getUser()

    if (!currentUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar que el usuario actual es admin
    const supabaseAdmin = getSupabaseAdmin()
    const { data: adminCheck } = await supabaseAdmin
      .from('admin_users')
      .select('id')
      .eq('id', currentUser.id)
      .single()

    if (!adminCheck) {
      return NextResponse.json(
        { error: 'Solo administradores pueden crear usuarios' },
        { status: 403 }
      )
    }

    // Crear usuario en auth.users via REST API
    const authUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users`
    const authHeaders = {
      'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
      'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
      'Content-Type': 'application/json'
    }

    const authResponse = await fetch(authUrl, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        email,
        password,
        email_confirm: true
      })
    })

    let userId: string

    if (!authResponse.ok) {
      const errorData = await authResponse.json()
      console.error('Auth API error:', errorData)
      return NextResponse.json(
        {
          error: `No se pudo crear usuario en auth: ${errorData.error_description || errorData.message || 'Error desconocido'}`,
          details: errorData
        },
        { status: 500 }
      )
    }

    const authData = await authResponse.json()
    userId = authData.user?.id

    if (!userId) {
      return NextResponse.json(
        { error: 'No se obtuvo ID del usuario creado' },
        { status: 500 }
      )
    }

    console.log(`Usuario creado en auth: ${userId}`)

    // Crear perfil con rol correctamente asignado
    const { error: perfilError } = await supabaseAdmin
      .from('perfiles')
      .insert({
        id: userId,
        nombre_completo,
        rut: rutNormalizado,
        rol,
        created_at: new Date().toISOString()
      })

    if (perfilError) {
      console.error('Perfil creation failed, rolling back auth user:', perfilError)

      // Rollback: eliminar usuario de auth si falló crear perfil
      try {
        await fetch(`${authUrl}/${userId}`, {
          method: 'DELETE',
          headers: authHeaders
        })
        console.log(`Rollback: usuario auth ${userId} eliminado`)
      } catch (rollbackError) {
        console.error('Rollback falló:', rollbackError)
      }

      return NextResponse.json(
        { error: `Error creando perfil: ${perfilError.message}` },
        { status: 500 }
      )
    }

    console.log(`Perfil creado: ${userId}`)

    // Si es admin, registrar en admin_users
    if (rol === 'admin') {
      const { error: adminError } = await supabaseAdmin
        .from('admin_users')
        .insert({
          id: userId,
          is_active: true
        })

      if (adminError) {
        console.error('Admin assignment failed:', adminError)
        // No hacemos rollback aquí - el usuario existe, solo que sin rol admin
        return NextResponse.json(
          { error: `Error asignando rol admin: ${adminError.message}` },
          { status: 500 }
        )
      }
      console.log(`Rol admin asignado: ${userId}`)
    }

    return NextResponse.json({
      success: true,
      userId,
      email,
      nombre_completo,
      rut: rutNormalizado,
      rol,
      message: 'Usuario creado exitosamente'
    })
  } catch (error) {
    console.error('Error en create-user:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Error desconocido' },
      { status: 500 }
    )
  }
}
