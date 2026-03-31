-- Función transaccional para eliminar usuarios de forma atómica
-- Elimina matrículas, admin_users (si existe), perfil y usuario auth en una transacción
-- Uso: SELECT delete_user_transactional('user-uuid-here');

CREATE OR REPLACE FUNCTION delete_user_transactional(
  user_id UUID
)
RETURNS TABLE (
  success BOOLEAN,
  error_message TEXT
) AS $$
DECLARE
  v_error TEXT;
  v_admin_user_exists BOOLEAN;
BEGIN
  -- Validar input
  IF user_id IS NULL THEN
    RETURN QUERY SELECT false, 'ID de usuario es requerido'::TEXT;
    RETURN;
  END IF;

  -- Verificar si el usuario existe en auth.users
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = user_id) THEN
    RETURN QUERY SELECT false, 'Usuario no encontrado en auth.users'::TEXT;
    RETURN;
  END IF;

  BEGIN
    -- 1. Eliminar matrículas (depende de perfil_id)
    DELETE FROM matriculas WHERE perfil_id = user_id;
    
    -- 2. Eliminar de admin_users si existe (no hay FK, solo relación lógica)
    DELETE FROM admin_users WHERE id = user_id;
    
    -- 3. Eliminar perfil (tiene FK a auth.users)
    DELETE FROM perfiles WHERE id = user_id;
    
    -- 4. Eliminar usuario de auth.users (último porque perfiles tiene FK a auth.users)
    DELETE FROM auth.users WHERE id = user_id;
    
    -- Retornar éxito
    RETURN QUERY SELECT true, NULL::TEXT;
    
  EXCEPTION WHEN OTHERS THEN
    v_error := SQLERRM;
    
    -- En caso de error, intentar revertir operaciones si es posible
    -- Nota: No podemos revertir DELETE fácilmente, pero al menos registramos el error
    -- La transacción se revierte automáticamente debido al bloque EXCEPTION
    
    RETURN QUERY SELECT false, v_error;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Otorgar permisos para ejecutar la función
GRANT EXECUTE ON FUNCTION delete_user_transactional(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION delete_user_transactional(UUID) TO authenticated;