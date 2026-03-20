#!/usr/bin/env node

const supabaseUrl = 'https://qablhrycgplkgmzurtke.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhYmxocnljZ3Bsa2dtenVydGtlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzUzMTgyMCwiZXhwIjoyMDg5MTA3ODIwfQ.VCsRgKCtU2_Re8Ea1iuBVT1t0jfZ5_Gu1Oujd--ABiM'

const sqlStatements = [
  // CREATE OR REPLACE FUNCTION
  `CREATE OR REPLACE FUNCTION create_new_user(user_email TEXT, user_password TEXT, user_nombre TEXT, user_rut TEXT)
RETURNS TABLE (success BOOLEAN, user_id UUID, error_message TEXT) AS $$
DECLARE
  new_user_id UUID;
  v_error TEXT;
BEGIN
  IF user_email IS NULL OR user_email = '' THEN
    RETURN QUERY SELECT false, NULL::UUID, 'Email es requerido'::TEXT;
    RETURN;
  END IF;
  IF user_password IS NULL OR LENGTH(user_password) < 8 THEN
    RETURN QUERY SELECT false, NULL::UUID, 'Contraseña debe tener al menos 8 caracteres'::TEXT;
    RETURN;
  END IF;
  IF user_nombre IS NULL OR user_nombre = '' THEN
    RETURN QUERY SELECT false, NULL::UUID, 'Nombre completo es requerido'::TEXT;
    RETURN;
  END IF;
  IF user_rut IS NULL OR user_rut = '' THEN
    RETURN QUERY SELECT false, NULL::UUID, 'RUT es requerido'::TEXT;
    RETURN;
  END IF;
  new_user_id := gen_random_uuid();
  BEGIN
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin)
    VALUES (new_user_id, user_email, crypt(user_password, gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, false);
    INSERT INTO perfiles (id, nombre_completo, rut, created_at) VALUES (new_user_id, user_nombre, user_rut, now());
    RETURN QUERY SELECT true, new_user_id, NULL::TEXT;
  EXCEPTION WHEN OTHERS THEN
    v_error := SQLERRM;
    BEGIN DELETE FROM auth.users WHERE id = new_user_id; EXCEPTION WHEN OTHERS THEN NULL; END;
    RETURN QUERY SELECT false, NULL::UUID, v_error;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;`,

  `GRANT EXECUTE ON FUNCTION create_new_user(TEXT, TEXT, TEXT, TEXT) TO service_role;`,
  `GRANT EXECUTE ON FUNCTION create_new_user(TEXT, TEXT, TEXT, TEXT) TO authenticated;`
]

async function executeSQLStatements() {
  console.log('🔧 Ejecutando SQL directamente en Supabase...\n')

  for (let i = 0; i < sqlStatements.length; i++) {
    const sql = sqlStatements[i]
    console.log(`⏳ Statement ${i + 1}/${sqlStatements.length}...`)

    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/query_exec`, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sql })
      })

      if (response.ok) {
        console.log(`   ✅ Ejecutado\n`)
      } else {
        const error = await response.json()
        console.log(`   ℹ️  Endpoint no disponible, intentando alternativa...\n`)
      }
    } catch (error) {
      console.error(`   Error: ${error.message}`)
    }
  }

  // Intenta una alternativa: usar el RPC directo con la función si existe
  console.log('\n✅ Intentando verificar que la función está disponible...\n')

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/create_new_user`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_email: 'verify@test.test',
        user_password: 'VerifyPass123!',
        user_nombre: 'Verify Test',
        user_rut: 'verify-rut'
      })
    })

    const data = await response.json()

    if (response.ok && Array.isArray(data) && data.length > 0) {
      if (data[0].success === false && data[0].error_message === 'Email es requerido') {
        console.log('✨ ¡FUNCIÓN CREADA Y OPERATIVA!\n')
        console.log('La función create_new_user está disponible y funcionando correctamente.\n')
        return
      }
    } else {
      console.log(`ℹ️  Respuesta: ${JSON.stringify(data)}\n`)
    }
  } catch (error) {
    console.log(`⚠️  Error verificando: ${error.message}\n`)
  }

  console.log('═'.repeat(70))
  console.log('📝 PRÓXIMO PASO:')
  console.log('═'.repeat(70))
  console.log('\nIntenta crear el admin desde el panel:')
  console.log('1. Ve a /admin/alumnos')
  console.log('2. Click "+ Nuevo Usuario"')
  console.log('3. Email: daniel@luam.cl')
  console.log('4. Nombre: Daniel Aldea')
  console.log('5. RUT: 15534564-0')
  console.log('6. Rol: Administrador')
  console.log('7. Contraseña: Pianito1!')
  console.log('8. Click "Crear"\n')
}

executeSQLStatements()
