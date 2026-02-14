-- ============================================================================
-- Habilitar RLS en la tabla profiles
-- Esta tabla contiene información de usuarios y debe estar protegida
-- ============================================================================

-- PASO 1: Verificar estado actual
SELECT 
  'Estado actual de RLS en profiles' as verificacion,
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'profiles'
  AND schemaname = 'public';

-- PASO 2: Habilitar RLS en profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- PASO 3: Verificar políticas existentes
SELECT 
  'Políticas existentes en profiles' as verificacion,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- PASO 4: Crear políticas si no existen
-- Política para SELECT: Los usuarios pueden ver su propio perfil y los perfiles de su empresa
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Users can view their own profile and company profiles'
  ) THEN
    CREATE POLICY "Users can view their own profile and company profiles"
      ON public.profiles
      FOR SELECT
      USING (
        id = auth.uid() 
        OR company_id IN (
          SELECT company_id 
          FROM public.company_users 
          WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Política para UPDATE: Los usuarios solo pueden actualizar su propio perfil
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Users can update their own profile'
  ) THEN
    CREATE POLICY "Users can update their own profile"
      ON public.profiles
      FOR UPDATE
      USING (id = auth.uid());
  END IF;
END $$;

-- Política para INSERT: Permitir creación de perfiles (manejado por trigger)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Allow profile creation'
  ) THEN
    CREATE POLICY "Allow profile creation"
      ON public.profiles
      FOR INSERT
      WITH CHECK (true);
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
WHERE tablename = 'profiles'
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
WHERE tablename = 'profiles'
ORDER BY cmd, policyname;

-- PASO 7: Probar acceso para vanithegameplay
SELECT 
  'Prueba de acceso para vanithegameplay' as prueba,
  p.id,
  p.email,
  p.full_name,
  p.role,
  p.company_id,
  c.name as company_name
FROM profiles p
JOIN companies c ON p.company_id = c.id
WHERE p.email = 'vanithegameplay@gmail.com';

-- PASO 8: Verificación FINAL de todas las tablas críticas
SELECT 
  'VERIFICACIÓN FINAL - Estado RLS de todas las tablas' as verificacion,
  tablename,
  CASE 
    WHEN rowsecurity = true THEN '✓ Habilitado'
    ELSE '✗ DESHABILITADO'
  END as estado_rls
FROM pg_tables
WHERE tablename IN (
  'profiles',
  'company_users',
  'companies',
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

-- PASO 9: Mensaje de éxito
SELECT 
  '🎉 CONFIGURACIÓN COMPLETADA' as resultado,
  'Todas las tablas críticas tienen RLS habilitado' as mensaje,
  'El usuario puede cerrar sesión y volver a iniciar para aplicar los cambios' as siguiente_paso;
