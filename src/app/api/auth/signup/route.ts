'use server'

import { createClient } from '@supabase/supabase-js'
import { validateAndNormalizeRUT } from '@/lib/rut-validator'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Endpoint para auto-registro de alumnos
 * POST /api/auth/signup
 * Body: { email, password, nombre_completo, rut }
 *
 * Arquitectura:
 * - Alumno se auto-registra (no requiere admin)
 * - Valida RUT con módulo 11 chileno
 * - Crea usuario en auth.users
 * - El trigger handle_new_user() auto-crea perfil con rut='pendiente'
 * - Actualiza perfil con RUT validado
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, nombre_completo, rut } = body

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

    // Validar RUT (módulo 11 chileno)
    const rutValidation = validateAndNormalizeRUT(rut)
    if (!rutValidation.valid) {
      return NextResponse.json(
        { error: rutValidation.error },
        { status: 400 }
      )
    }
    const rutNormalizado = rutValidation.normalized!

    // Crear cliente Supabase anon para signup (sin admin privileges)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Intentar registrar usuario
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: nombre_completo,
          rut: rutNormalizado
        }
      }
    })

    if (signUpError) {
      console.error('Signup error:', signUpError)
      return NextResponse.json(
        {
          error: signUpError.message || 'Error registrando usuario',
          details: signUpError
        },
        { status: 400 }
      )
    }

    if (!signUpData.user?.id) {
      return NextResponse.json(
        { error: 'No se obtuvo ID del usuario registrado' },
        { status: 500 }
      )
    }

    const userId = signUpData.user.id
    console.log(`Usuario registrado: ${userId}`)

    // Actualizar perfil con RUT validado
    // (el trigger ya creó el perfil con rut='pendiente')
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { error: perfilError } = await supabaseAdmin
      .from('perfiles')
      .update({
        rut: rutNormalizado,
        nombre_completo // Actualizar nombre por si el usuario no lo proporcionó en signup
      })
      .eq('id', userId)

    if (perfilError) {
      console.error('Perfil update error:', perfilError)
      // No hacemos rollback - el usuario está creado, solo faltó actualizar RUT
      return NextResponse.json(
        { error: `Perfil creado pero no se pudo actualizar RUT: ${perfilError.message}` },
        { status: 500 }
      )
    }

    console.log(`Perfil actualizado: ${userId}`)

    return NextResponse.json({
      success: true,
      userId,
      email,
      nombre_completo,
      rut: rutNormalizado,
      rol: 'alumno',
      message: 'Registrado exitosamente. Por favor confirma tu email.',
      user: signUpData.user
    })
  } catch (error) {
    console.error('Error en signup:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Error desconocido' },
      { status: 500 }
    )
  }
}
