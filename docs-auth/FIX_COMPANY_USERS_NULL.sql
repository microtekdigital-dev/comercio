-- =====================================================
-- FIX COMPANY_USERS NULL VALUES
-- =====================================================
-- Corrige valores NULL en company_users y sincroniza
-- con la tabla profiles
-- =====================================================

-- =====================================================
-- PARTE 1: DIAGNÓSTICO DETALLADO
-- =====================================================

-- Ver registros con role NULL
SELECT 
  'Records with NULL role' as issue,
  cu.id,
  cu.company_id,
  cu.user_id,
  cu.role,
  p.email,
  p.role as profile_role,
  c.name as company_name
FROM company_users cu
LEFT JOIN profiles p ON cu.user_id = p.id
LEFT JOIN companies c ON cu.company_id = c.id
WHERE cu.role IS NULL
ORDER BY cu.created_at DESC;

-- Ver usuarios en profiles pero no en company_users
SELECT 
  'Users missing in company_users' as issue,
  p.id as user_id,
  p.email,
  p.company_id,
  p.role as profile_role,
  c.name as company_name
FROM profiles p
LEFT JOIN companies c ON p.company_id = c.id
LEFT JOIN company_users cu ON cu.user_id = p.id AND cu.company_id = p.company_id
WHERE p.company_id IS NOT NULL
  AND cu.user_id IS NULL
ORDER BY p.created_at DESC;

-- =====================================================
-- PARTE 2: CORRECCIÓN (EJECUTAR CON CUIDADO)
-- =====================================================

BEGIN;

-- Paso 1: Actualizar role NULL con el role de profiles
UPDATE company_users cu
SET role = p.role
FROM profiles p
WHERE cu.user_id = p.id
  AND cu.role IS NULL
  AND p.role IS NOT NULL;

-- Verificar cuántos se actualizaron
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO updated_count
  FROM company_users
  WHERE role IS NULL;
  
  IF updated_count > 0 THEN
    RAISE WARNING 'Aún quedan % registros con role NULL', updated_count;
  ELSE
    RAISE NOTICE 'Todos los roles NULL fueron actualizados';
  END IF;
END $$;

-- Paso 2: Insertar usuarios faltantes de profiles a company_users
INSERT INTO company_users (company_id, user_id, role)
SELECT 
  p.company_id,
  p.id as user_id,
  COALESCE(p.role, 'employee') as role
FROM profiles p
WHERE p.company_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 
    FROM company_users cu 
    WHERE cu.user_id = p.id 
    AND cu.company_id = p.company_id
  )
ON CONFLICT (company_id, user_id) DO NOTHING;

-- Verificar resultado
DO $$
DECLARE
  profiles_count INTEGER;
  company_users_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO profiles_count
  FROM profiles
  WHERE company_id IS NOT NULL;
  
  SELECT COUNT(DISTINCT user_id) INTO company_users_count
  FROM company_users
  WHERE company_id IS NOT NULL;
  
  RAISE NOTICE 'Profiles con company: %, Users en company_users: %', 
    profiles_count, company_users_count;
    
  IF profiles_count = company_users_count THEN
    RAISE NOTICE '✅ Sincronización exitosa';
  ELSE
    RAISE WARNING '⚠️ Aún hay diferencia: % vs %', profiles_count, company_users_count;
  END IF;
END $$;

COMMIT;

-- =====================================================
-- PARTE 3: HABILITAR RLS (OPCIONAL)
-- =====================================================
-- Solo ejecuta esto si quieres habilitar RLS en company_users
-- =====================================================

/*
-- Habilitar RLS
ALTER TABLE public.company_users ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS para company_users

-- Política SELECT: Los usuarios pueden ver membresías de su company
CREATE POLICY "users_select_company_users" ON public.company_users
  FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id 
      FROM public.profiles 
      WHERE id = auth.uid()
      AND company_id IS NOT NULL
    )
  );

-- Política INSERT: Solo admins pueden agregar usuarios
CREATE POLICY "admins_insert_company_users" ON public.company_users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id 
      FROM public.profiles 
      WHERE id = auth.uid()
      AND role = 'admin'
      AND company_id IS NOT NULL
    )
  );

-- Política UPDATE: Solo admins pueden actualizar roles
CREATE POLICY "admins_update_company_users" ON public.company_users
  FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id 
      FROM public.profiles 
      WHERE id = auth.uid()
      AND role = 'admin'
      AND company_id IS NOT NULL
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT company_id 
      FROM public.profiles 
      WHERE id = auth.uid()
      AND role = 'admin'
      AND company_id IS NOT NULL
    )
  );

-- Política DELETE: Solo admins pueden eliminar usuarios
CREATE POLICY "admins_delete_company_users" ON public.company_users
  FOR DELETE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id 
      FROM public.profiles 
      WHERE id = auth.uid()
      AND role = 'admin'
      AND company_id IS NOT NULL
    )
  );
*/

-- =====================================================
-- PARTE 4: VERIFICACIÓN POST-CORRECCIÓN
-- =====================================================

-- Resumen final
SELECT 
  'Final Summary' as report,
  (SELECT COUNT(*) FROM company_users) as total_company_users,
  (SELECT COUNT(*) FROM company_users WHERE role IS NULL) as null_roles,
  (SELECT COUNT(*) FROM profiles WHERE company_id IS NOT NULL) as profiles_with_company,
  (SELECT COUNT(DISTINCT user_id) FROM company_users WHERE company_id IS NOT NULL) as users_in_company_users,
  CASE 
    WHEN (SELECT COUNT(*) FROM company_users WHERE role IS NULL) = 0 THEN '✅ Sin NULL'
    ELSE '❌ Aún hay NULL'
  END as null_status,
  CASE 
    WHEN (SELECT COUNT(*) FROM profiles WHERE company_id IS NOT NULL) = 
         (SELECT COUNT(DISTINCT user_id) FROM company_users WHERE company_id IS NOT NULL)
    THEN '✅ Sincronizado'
    ELSE '⚠️ Desincronizado'
  END as sync_status;

-- Ver todos los registros de company_users
SELECT 
  cu.id,
  cu.company_id,
  c.name as company_name,
  cu.user_id,
  p.email,
  cu.role as cu_role,
  p.role as profile_role,
  CASE 
    WHEN cu.role IS NULL THEN '❌ NULL role'
    WHEN cu.role != p.role THEN '⚠️ Role diferente'
    ELSE '✅ OK'
  END as status
FROM company_users cu
LEFT JOIN profiles p ON cu.user_id = p.id
LEFT JOIN companies c ON cu.company_id = c.id
ORDER BY cu.created_at DESC;

-- =====================================================
-- NOTAS IMPORTANTES
-- =====================================================
-- 1. PARTE 2 corrige los NULL y sincroniza con profiles
-- 2. PARTE 3 (comentada) habilita RLS - solo si lo necesitas
-- 3. Si habilitas RLS, prueba que el layout siga funcionando
-- 4. Los roles se toman de la tabla profiles
-- 5. Si un profile no tiene role, se usa 'employee' por defecto

-- =====================================================
-- INSTRUCCIONES
-- =====================================================
-- 1. Ejecuta PARTE 1 para ver el problema en detalle
-- 2. Ejecuta PARTE 2 para corregir NULL y sincronizar
-- 3. Ejecuta PARTE 4 para verificar que se corrigió
-- 4. (Opcional) Ejecuta PARTE 3 si quieres habilitar RLS
