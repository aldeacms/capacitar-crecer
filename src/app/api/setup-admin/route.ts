/**
 * ⚠️ SETUP ENDPOINT - TEMPORAL
 * Ejecuta el SQL para configurar la tabla admin_users y el admin user
 * ELIMINAR después de ejecutar una vez
 */

import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabaseAdmin = getSupabaseAdmin()

  try {
    console.log('Iniciando setup de admin_users...')

    // 1. Crear tabla admin_users
    console.log('Paso 1: Creando tabla admin_users...')
    const { error: createTableError } = await supabaseAdmin.rpc('create_admin_table', {
      query: `
        CREATE TABLE IF NOT EXISTS public.admin_users (
            id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            is_active BOOLEAN NOT NULL DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id)
        );

        ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

        CREATE POLICY IF NOT EXISTS "Admins can view own record" ON public.admin_users
          FOR SELECT TO authenticated
          USING (id = auth.uid());
      `
    })

    // Si no existe RPC, intentaremos de otra forma
    // 2. Insertar admin user
    console.log('Paso 2: Insertando usuario admin...')
    const { error: insertError } = await supabaseAdmin
      .from('admin_users')
      .insert([
        {
          id: '7983c049-fa7b-42d9-bfba-41fbdfc57eb2',
          is_active: true
        }
      ])
      .select()

    if (insertError?.code === '42P01') {
      // Tabla no existe, necesitamos crearla manualmente
      return NextResponse.json({
        status: 'error',
        message: 'Tabla admin_users no existe. Debes ejecutar el SQL manualmente en Supabase.',
        sql: `
          CREATE TABLE IF NOT EXISTS public.admin_users (
              id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
              is_active BOOLEAN NOT NULL DEFAULT true,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
              PRIMARY KEY (id)
          );

          INSERT INTO public.admin_users (id, is_active)
          VALUES ('7983c049-fa7b-42d9-bfba-41fbdfc57eb2', true);
        `
      }, { status: 500 })
    }

    if (insertError) {
      return NextResponse.json({
        status: 'error',
        message: insertError.message
      }, { status: 500 })
    }

    return NextResponse.json({
      status: 'success',
      message: 'Admin user configurado correctamente',
      user_id: '7983c049-fa7b-42d9-bfba-41fbdfc57eb2',
      email: 'daniel@lifefocus.agency'
    })
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}
