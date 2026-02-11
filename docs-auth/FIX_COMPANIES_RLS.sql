-- =====================================================
-- FIX COMPANIES RLS - Diagnóstico y Corrección
-- =====================================================
-- Este script diagnostica y corrige las políticas RLS
-- de la tabla companies que bloquean el layout
-- =====================================================

-- PASO 1: Verificar estado actual de RLS
-- =====================================================
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'companies';

-- PASO 2: Ver políticas actuales
-- =====================================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'companies';

-- PASO 3: Verificar datos de prueba
-- =====================================================
-- Ver si hay companies y profiles
SELECT 
  c.id as company_id,
  c.name as company_name,
  p.id as user_id,
  p.email,
  p.role
FROM companies c
LEFT JOIN profiles p ON p.company_id = c.id
ORDER BY c.created_at DESC
LIMIT 10;

-- PASO 4: Probar consulta que falla en layout
-- =====================================================
-- Esta consulta simula lo que hace el layout
-- Reemplaza 'USER_ID_AQUI' con un ID real de usuario
/*
SELECT 
  p.company_id,
  p.role,
  c.name as company_name
FROM profiles p
LEFT JOIN companies c ON c.id = p.company_id
WHERE p.id = 'USER_ID_AQUI';
*/

-- =====================================================
-- SOLUCIÓN: Eliminar políticas problemáticas y crear nuevas
-- =====================================================

-- PASO 5: Eliminar políticas existentes
-- =====================================================
DROP POLICY IF EXISTS "Users can view their company" ON public.companies;
DROP POLICY IF EXISTS "Admins can update their company" ON public.companies;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.companies;

-- PASO 6: Crear políticas RLS correctas
-- =====================================================

-- Política 1: SELECT - Los usuarios pueden ver su propia company
-- Esta política permite que cualquier usuario autenticado vea la company
-- a la que pertenece según su profile
CREATE POLICY "users_select_own_company" ON public.companies
  FOR SELECT
  TO authenticated
  USING (
    -- El usuario puede ver la company si está en profiles con ese company_id
    id IN (
      SELECT company_id 
      FROM public.profiles 
      WHERE id = auth.uid()
      AND company_id IS NOT NULL
    )
  );

-- Política 2: INSERT - Permitir crear companies durante registro
-- Necesario para el flujo de registro de nuevos usuarios
CREATE POLICY "authenticated_insert_company" ON public.companies
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Cualquier usuario autenticado puede crear una company
    auth.uid() IS NOT NULL
  );

-- Política 3: UPDATE - Solo admins pueden actualizar su company
-- Los admins pueden actualizar los datos de su company
CREATE POLICY "admins_update_own_company" ON public.companies
  FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT company_id 
      FROM public.profiles 
      WHERE id = auth.uid()
      AND role = 'admin'
      AND company_id IS NOT NULL
    )
  )
  WITH CHECK (
    id IN (
      SELECT company_id 
      FROM public.profiles 
      WHERE id = auth.uid()
      AND role = 'admin'
      AND company_id IS NOT NULL
    )
  );

-- Política 4: DELETE - Solo admins pueden eliminar (opcional, generalmente no se usa)
CREATE POLICY "admins_delete_own_company" ON public.companies
  FOR DELETE
  TO authenticated
  USING (
    id IN (
      SELECT company_id 
      FROM public.profiles 
      WHERE id = auth.uid()
      AND role = 'admin'
      AND company_id IS NOT NULL
    )
  );

-- PASO 7: Habilitar RLS
-- =====================================================
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- PASO 8: Verificar que las políticas se crearon correctamente
-- =====================================================
SELECT 
  policyname,
  cmd as operation,
  roles,
  CASE 
    WHEN qual IS NOT NULL THEN 'USING clause present'
    ELSE 'No USING clause'
  END as using_clause,
  CASE 
    WHEN with_check IS NOT NULL THEN 'WITH CHECK clause present'
    ELSE 'No WITH CHECK clause'
  END as with_check_clause
FROM pg_policies 
WHERE tablename = 'companies'
ORDER BY policyname;

-- =====================================================
-- NOTAS IMPORTANTES
-- =====================================================
-- 1. Las políticas usan auth.uid() que obtiene el ID del usuario autenticado
-- 2. La política SELECT permite que los usuarios vean su company mediante JOIN con profiles
-- 3. La política INSERT permite crear companies durante el registro
-- 4. La política UPDATE solo permite a admins modificar su company
-- 5. Si el layout sigue bloqueado, verifica que:
--    - El usuario tiene un profile con company_id válido
--    - La sesión de Supabase está correctamente configurada
--    - No hay otras políticas RLS en profiles que bloqueen la consulta

-- =====================================================
-- PRUEBA FINAL
-- =====================================================
-- Ejecuta esta consulta como usuario autenticado para verificar
-- que puedes ver tu company:
/*
SELECT 
  c.id,
  c.name,
  c.slug,
  c.created_at
FROM companies c
WHERE c.id IN (
  SELECT company_id 
  FROM profiles 
  WHERE id = auth.uid()
);
*/
