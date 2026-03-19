-- =====================================================
-- SETUP ADMIN USER - Copiar todo esto y ejecutar en Supabase
-- =====================================================
-- Fecha: 2026-03-19
-- Usuario: daniel@lifefocus.agency
-- =====================================================

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

-- Insertar admin user (daniel@lifefocus.agency)
INSERT INTO public.admin_users (id, is_active)
VALUES ('7983c049-fa7b-42d9-bfba-41fbdfc57eb2', true)
ON CONFLICT (id) DO UPDATE SET is_active = true;

-- =====================================================
-- Listo! Después de ejecutar esto:
-- 1. Login con daniel@lifefocus.agency en /login
-- 2. Ve a /admin
-- 3. Deberías ver "Dashboard Administrativo"
-- =====================================================
