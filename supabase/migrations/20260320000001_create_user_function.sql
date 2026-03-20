-- Función para crear usuarios de forma confiable
-- Evita problemas con el admin API de Supabase
-- Uso: SELECT create_new_user('email@example.com', 'password123', 'Juan Pérez', '12345678-9');

CREATE OR REPLACE FUNCTION create_new_user(
  user_email TEXT,
  user_password TEXT,
  user_nombre TEXT,
  user_rut TEXT
)
RETURNS TABLE (
  success BOOLEAN,
  user_id UUID,
  error_message TEXT
) AS $$
DECLARE
  new_user_id UUID;
  v_error TEXT;
BEGIN
  -- Validar inputs
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

  -- Generar UUID
  new_user_id := gen_random_uuid();

  BEGIN
    -- Insertar en auth.users
    INSERT INTO auth.users (
      id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin
    ) VALUES (
      new_user_id,
      user_email,
      crypt(user_password, gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{}'::jsonb,
      false
    );

    -- Insertar en perfiles
    INSERT INTO perfiles (id, nombre_completo, rut, created_at)
    VALUES (new_user_id, user_nombre, user_rut, now());

    -- Retornar éxito
    RETURN QUERY SELECT true, new_user_id, NULL::TEXT;

  EXCEPTION WHEN OTHERS THEN
    v_error := SQLERRM;

    -- Intentar limpiar el usuario creado si falló el perfil
    BEGIN
      DELETE FROM auth.users WHERE id = new_user_id;
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;

    RETURN QUERY SELECT false, NULL::UUID, v_error;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Otorgar permisos
GRANT EXECUTE ON FUNCTION create_new_user(TEXT, TEXT, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION create_new_user(TEXT, TEXT, TEXT, TEXT) TO authenticated;
