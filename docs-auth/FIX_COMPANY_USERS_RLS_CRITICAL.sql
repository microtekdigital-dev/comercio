-- ============================================================================
-- CRÍTICO: Habilitar RLS en company_users
-- Esta tabla es fundamental para el control de acceso de todas las demás tablas
-- ============================================================================

-- PASO 1: Verificar estado actual
SELECT 
  'Estado actual de RLS' as verificacion,
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'company_users'
  AND schemaname = 'public';

-- PASO 2: Habilitar RLS en company_users
ALTER TABLE public.company_users ENABLE ROW LEVEL SECURITY;

-- PASO 3: Verificar políticas existentes
SELECT 
  'Políticas existentes' as verificacion,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'company_users'
ORDER BY policyname;

-- PASO 4: Crear políticas si no existen
-- Política para SELECT: Los usuarios pueden ver sus propias relaciones con empresas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'company_users' 
    AND policyname = 'Users can view their own company relationships'
  ) THEN
    CREATE POLICY "Users can view their own company relationships"
      ON public.company_users
      FOR SELECT
      USING (user_id = auth.uid());
  END IF;
END $$;

-- Política para INSERT: Los administradores pueden agregar usuarios a su empresa
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'company_users' 
    AND policyname = 'Admins can add users to their company'
  ) THEN
    CREATE POLICY "Admins can add users to their company"
      ON public.company_users
      FOR INSERT
      WITH CHECK (
        company_id IN (
          SELECT company_id 
          FROM public.company_users 
          WHERE user_id = auth.uid() 
          AND role = 'admin'
        )
      );
  END IF;
END $$;

-- Política para UPDATE: Los administradores pueden actualizar usuarios de su empresa
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'company_users' 
    AND policyname = 'Admins can update users in their company'
  ) THEN
    CREATE POLICY "Admins can update users in their company"
      ON public.company_users
      FOR UPDATE
      USING (
        company_id IN (
          SELECT company_id 
          FROM public.company_users 
          WHERE user_id = auth.uid() 
          AND role = 'admin'
        )
      );
  END IF;
END $$;

-- Política para DELETE: Los administradores pueden eliminar usuarios de su empresa
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'company_users' 
    AND policyname = 'Admins can remove users from their company'
  ) THEN
    CREATE POLICY "Admins can remove users from their company"
      ON public.company_users
      FOR DELETE
      USING (
        company_id IN (
          SELECT company_id 
          FROM public.company_users 
          WHERE user_id = auth.uid() 
          AND role = 'admin'
        )
      );
  END IF;
END $$;

-- PASO 5: Verificar que RLS esté habilitado
SELECT 
  'Verificación final' as paso,
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  CASE 
    WHEN rowsecurity = true THEN '✓ RLS HABILITADO'
    ELSE '✗ RLS DESHABILITADO'
  END as estado
FROM pg_tables
WHERE tablename = 'company_users'
  AND schemaname = 'public';

-- PASO 6: Verificar políticas creadas
SELECT 
  'Políticas después del fix' as verificacion,
  policyname,
  cmd as operacion,
  CASE 
    WHEN cmd = 'SELECT' THEN 'Lectura'
    WHEN cmd = 'INSERT' THEN 'Creación'
    WHEN cmd = 'UPDATE' THEN 'Actualización'
    WHEN cmd = 'DELETE' THEN 'Eliminación'
    ELSE cmd
  END as tipo_operacion
FROM pg_policies
WHERE tablename = 'company_users'
ORDER BY cmd, policyname;

-- PASO 7: Probar acceso para vanithegameplay
SELECT 
  'Prueba de acceso para vanithegameplay' as prueba,
  cu.user_id,
  cu.company_id,
  cu.role,
  c.name as company_name,
  p.email
FROM company_users cu
JOIN companies c ON cu.company_id = c.id
JOIN profiles p ON cu.user_id = p.id
WHERE p.email = 'vanithegameplay@gmail.com';

-- PASO 8: Verificar que todas las tablas ERP tengan RLS habilitado
SELECT 
  'Estado RLS de todas las tablas críticas' as verificacion,
  tablename,
  CASE 
    WHEN rowsecurity = true THEN '✓ Habilitado'
    ELSE '✗ DESHABILITADO'
  END as estado_rls
FROM pg_tables
WHERE tablename IN (
  'company_users',
  'companies',
  'profiles',
  'products',
  'suppliers',
  'purchase_orders',
  'sales',
  'customers',
  'categories'
)
AND schemaname = 'public'
ORDER BY 
  CASE WHEN rowsecurity = false THEN 0 ELSE 1 END,
  tablename;
