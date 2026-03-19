#!/usr/bin/env node

/**
 * Setup Admin User Script
 * Crea la tabla admin_users y configura daniel@lifefocus.agency como admin
 *
 * Uso: node scripts/setup-admin.mjs
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ ERROR: Variables de entorno no configuradas')
  console.error('Asegúrate que .env.local tenga:')
  console.error('  - NEXT_PUBLIC_SUPABASE_URL')
  console.error('  - SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function setupAdmin() {
  console.log('🔧 SETUP ADMIN USER\n')
  console.log('Pasos:')
  console.log('1. Crear tabla admin_users')
  console.log('2. Insertar usuario como admin\n')

  try {
    // Intentar insertar (esto nos dirá si la tabla existe)
    console.log('📋 Verificando tabla admin_users...')
    const { data: checkData, error: checkError } = await supabase
      .from('admin_users')
      .select('id')
      .limit(1)

    if (checkError) {
      // Tabla no existe
      console.log('❌ Tabla admin_users NO EXISTE')
      console.log('\n⚠️  NECESITAS EJECUTAR ESTE SQL EN SUPABASE MANUALMENTE:\n')

      const sql = `
-- Crear tabla admin_users
CREATE TABLE public.admin_users (
    id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- Habilitar RLS
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Política de seguridad
CREATE POLICY "Admins can view own record" ON public.admin_users
  FOR SELECT TO authenticated
  USING (id = auth.uid());

-- Insertar admin user
INSERT INTO public.admin_users (id, is_active)
VALUES ('7983c049-fa7b-42d9-bfba-41fbdfc57eb2', true)
ON CONFLICT (id) DO UPDATE SET is_active = true;
`
      console.log(sql)
      console.log('\n📍 Dónde copiar esto:')
      console.log('1. Ve a: https://app.supabase.com')
      console.log('2. Selecciona tu proyecto')
      console.log('3. SQL Editor → New Query')
      console.log('4. Copia todo el SQL arriba')
      console.log('5. Presiona RUN\n')
      process.exit(1)
    }

    if (checkError) {
      throw checkError
    }

    // Tabla existe, insertar el admin user
    console.log('✅ Tabla admin_users existe')
    console.log('👤 Insertando usuario admin...\n')

    const { data, error: insertError } = await supabase
      .from('admin_users')
      .upsert([
        {
          id: '7983c049-fa7b-42d9-bfba-41fbdfc57eb2',
          is_active: true
        }
      ])
      .select()

    if (insertError) {
      throw insertError
    }

    console.log('✅ ¡ÉXITO! Admin user configurado correctamente\n')
    console.log('📊 Detalles:')
    console.log('  Email: daniel@lifefocus.agency')
    console.log('  ID: 7983c049-fa7b-42d9-bfba-41fbdfc57eb2')
    console.log('  Estado: Activo\n')
    console.log('🎉 Ahora puedes:')
    console.log('  1. Login con daniel@lifefocus.agency')
    console.log('  2. Navegar a /admin')
    console.log('  3. Ver "Dashboard Administrativo"\n')

  } catch (error) {
    console.error('❌ ERROR:', error.message)
    process.exit(1)
  }
}

setupAdmin()
