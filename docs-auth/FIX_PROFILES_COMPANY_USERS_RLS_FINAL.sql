-- ============================================================================
-- FIX FINAL: Políticas RLS Correctas para profiles y company_users
-- ============================================================================
-- Este script crea políticas RLS que permiten el acceso correcto sin bloquear
-- el dashboard
-- ============================================================================

-- ============================================================================
-- PASO 1: Limpiar políticas existentes en profiles
-- ============================================================================
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view profiles in their company" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Service role can manage profiles" ON public.profiles;

-- ============================================================================
-- PASO 2: Crear políticas CORRECTAS para profiles
-- ============================================================================

-- Política 1: Los usuarios pueden ver su propio perfil
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Política 2: Los usuarios pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Política 3: Los usuarios pueden ver perfiles de su misma empresa
CREATE POLICY "Users can view company profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  company_id IN (
    SELECT company_id 
    FROM public.profiles 
    WHERE id = auth.uid()
  )
);

-- Política 4: Service role tiene acceso completo (para triggers)
CREATE POLICY "Service role full access"
ON public.profiles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- PASO 3: Limpiar políticas existentes en company_users
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their company memberships" ON public.company_users;
DROP POLICY IF EXISTS "Users can view company members" ON public.company_users;
DROP POLICY IF EXISTS "Admins can manage company users" ON public.company_users;
DROP POLICY IF EXISTS "Service role can manage company users" ON public.company_users;
DROP POLICY IF EXISTS "Users can insert company memberships" ON public.company_users;
DROP POLICY IF EXISTS "Users can update company memberships" ON public.company_users;
DROP POLICY IF EXISTS "Users can delete company memberships" ON public.company_users;

-- ============================================================================
-- PASO 4: Crear políticas CORRECTAS para company_users
-- ============================================================================

-- Política 1: Los usuarios pueden ver sus propias membresías
CREATE POLICY "Users can view own memberships"
ON public.company_users
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Política 2: Los usuarios pueden ver membresías de su empresa
CREATE POLICY "Users can view company memberships"
ON public.company_users
FOR SELECT
TO authenticated
USING (
  company_id IN (
    SELECT company_id 
    FROM public.profiles 
    WHERE id = auth.uid()
  )
);

-- Política 3: Los admins pueden insertar membresías en su empresa
CREATE POLICY "Admins can insert memberships"
ON public.company_users
FOR INSERT
TO authenticated
WITH CHECK (
  company_id IN (
    SELECT p.company_id 
    FROM public.profiles p
    WHERE p.id = auth.uid()
    AND p.role IN ('admin', 'owner')
  )
);

-- Política 4: Los admins pueden actualizar membresías en su empresa
CREATE POLICY "Admins can update memberships"
ON public.company_users
FOR UPDATE
TO authenticated
USING (
  company_id IN (
    SELECT p.company_id 
    FROM public.profiles p
    WHERE p.id = auth.uid()
    AND p.role IN ('admin', 'owner')
  )
)
WITH CHECK (
  company_id IN (
    SELECT p.company_id 
    FROM public.profiles p
    WHERE p.id = auth.uid()
    AND p.role IN ('admin', 'owner')
  )
);

-- Política 5: Los admins pueden eliminar membresías en su empresa
CREATE POLICY "Admins can delete memberships"
ON public.company_users
FOR DELETE
TO authenticated
USING (
  company_id IN (
    SELECT p.company_id 
    FROM public.profiles p
    WHERE p.id = auth.uid()
    AND p.role IN ('admin', 'owner')
  )
);

-- Política 6: Service role tiene acceso completo (para triggers)
CREATE POLICY "Service role full access"
ON public.company_users
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- PASO 5: Asegurar que RLS esté habilitado
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_users ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PASO 6: Verificar políticas creadas
-- ============================================================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'company_users')
ORDER BY tablename, policyname;

-- ============================================================================
-- RESULTADO ESPERADO:
-- ============================================================================
-- profiles:
--   - Users can view own profile (SELECT)
--   - Users can update own profile (UPDATE)
--   - Users can view company profiles (SELECT)
--   - Service role full access (ALL)
--
-- company_users:
--   - Users can view own memberships (SELECT)
--   - Users can view company memberships (SELECT)
--   - Admins can insert memberships (INSERT)
--   - Admins can update memberships (UPDATE)
--   - Admins can delete memberships (DELETE)
--   - Service role full access (ALL)
-- ============================================================================

-- ============================================================================
-- INSTRUCCIONES POST-EJECUCIÓN:
-- ============================================================================
-- 1. Ejecuta este script en Supabase SQL Editor
-- 2. Cierra sesión en la aplicación
-- 3. Limpia el caché del navegador (Ctrl + Shift + Delete)
-- 4. Vuelve a iniciar sesión
-- 5. El dashboard debería cargar correctamente
-- ============================================================================
