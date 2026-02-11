-- =====================================================
-- CLEANUP COMPANIES RLS DUPLICATES - Limpieza Segura
-- =====================================================
-- Este script elimina políticas RLS duplicadas de companies
-- manteniendo solo las políticas necesarias y modernas
-- =====================================================

-- =====================================================
-- PARTE 1: DIAGNÓSTICO (EJECUTAR PRIMERO)
-- =====================================================

-- Ver todas las políticas actuales
SELECT 
  'Current Policies' as status,
  policyname,
  cmd as operation,
  CASE 
    WHEN policyname IN (
      'Admins can view companies',
      'Admins can view their company', 
      'Users can view their own company'
    ) THEN 'DUPLICADA - Eliminar'
    WHEN policyname IN (
      'users_select_own_company',
      'authenticated_insert_company',
      'admins_update_own_company',
      'Admins can manage companies'
    ) THEN 'MANTENER'
    ELSE 'REVISAR'
  END as action_recommended
FROM pg_policies 
WHERE tablename = 'companies'
ORDER BY cmd, policyname;

-- Contar políticas por operación
SELECT 
  'Policy Count by Operation' as status,
  cmd as operation,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename = 'companies'
GROUP BY cmd
ORDER BY cmd;

-- =====================================================
-- PARTE 2: BACKUP (GUARDAR ESTE OUTPUT)
-- =====================================================

SELECT 
  'BACKUP - Save this!' as backup_note,
  policyname,
  cmd,
  permissive,
  roles::text,
  qual::text as using_clause,
  with_check::text as with_check_clause
FROM pg_policies 
WHERE tablename = 'companies'
ORDER BY policyname;

-- =====================================================
-- PARTE 3: LIMPIEZA (EJECUTAR CON CUIDADO)
-- =====================================================
-- Elimina políticas duplicadas manteniendo las modernas
-- =====================================================

BEGIN;

-- Paso 1: Verificar que existen las políticas modernas
DO $$
DECLARE
  modern_policies_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO modern_policies_count
  FROM pg_policies 
  WHERE tablename = 'companies'
  AND policyname IN (
    'users_select_own_company',
    'authenticated_insert_company',
    'admins_update_own_company'
  );
  
  IF modern_policies_count < 3 THEN
    RAISE EXCEPTION 'Error: No se encontraron todas las políticas modernas. Abortando limpieza.';
  END IF;
  
  RAISE NOTICE 'Verificación exitosa: % políticas modernas encontradas', modern_policies_count;
END $$;

-- Paso 2: Eliminar políticas duplicadas antiguas
DO $$ 
BEGIN
  -- Eliminar "Admins can view companies" (duplicada de users_select_own_company)
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'companies' 
    AND policyname = 'Admins can view companies'
  ) THEN
    DROP POLICY "Admins can view companies" ON public.companies;
    RAISE NOTICE 'Eliminada: "Admins can view companies"';
  END IF;

  -- Eliminar "Admins can view their company" (duplicada de users_select_own_company)
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'companies' 
    AND policyname = 'Admins can view their company'
  ) THEN
    DROP POLICY "Admins can view their company" ON public.companies;
    RAISE NOTICE 'Eliminada: "Admins can view their company"';
  END IF;

  -- Eliminar "Users can view their own company" (duplicada de users_select_own_company)
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'companies' 
    AND policyname = 'Users can view their own company'
  ) THEN
    DROP POLICY "Users can view their own company" ON public.companies;
    RAISE NOTICE 'Eliminada: "Users can view their own company"';
  END IF;

  RAISE NOTICE 'Limpieza de políticas duplicadas completada';
END $$;

-- Paso 3: Verificar que quedaron las políticas correctas
DO $$
DECLARE
  final_policy_count INTEGER;
  select_policy_count INTEGER;
BEGIN
  -- Contar políticas totales
  SELECT COUNT(*) INTO final_policy_count
  FROM pg_policies 
  WHERE tablename = 'companies';
  
  -- Contar políticas SELECT (debe ser 1 o 2 máximo)
  SELECT COUNT(*) INTO select_policy_count
  FROM pg_policies 
  WHERE tablename = 'companies'
  AND cmd = 'SELECT';
  
  RAISE NOTICE 'Políticas finales: % total, % SELECT', final_policy_count, select_policy_count;
  
  IF select_policy_count > 2 THEN
    RAISE WARNING 'Advertencia: Aún hay % políticas SELECT, se esperaban 1-2', select_policy_count;
  END IF;
END $$;

-- Si todo salió bien, confirma los cambios
COMMIT;

-- =====================================================
-- PARTE 4: VERIFICACIÓN POST-LIMPIEZA
-- =====================================================

-- Ver políticas finales
SELECT 
  'Final Policies' as status,
  policyname,
  cmd as operation,
  CASE 
    WHEN qual IS NOT NULL THEN 'Has USING'
    ELSE 'No USING'
  END as using_status
FROM pg_policies 
WHERE tablename = 'companies'
ORDER BY cmd, policyname;

-- Contar políticas finales por operación
SELECT 
  'Final Count' as status,
  cmd as operation,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename = 'companies'
GROUP BY cmd
ORDER BY cmd;

-- Verificar RLS sigue habilitado
SELECT 
  'RLS Status' as status,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'companies';

-- =====================================================
-- PARTE 5: PRUEBA DE FUNCIONAMIENTO
-- =====================================================
-- Ejecuta esto para verificar que el layout sigue funcionando
-- =====================================================

-- Esta consulta simula lo que hace el layout
-- Reemplaza 'TU_USER_ID' con tu ID de usuario real para probar
/*
SELECT 
  'Layout Test' as test_type,
  p.company_id,
  p.role,
  c.name as company_name
FROM profiles p
LEFT JOIN companies c ON c.id = p.company_id
WHERE p.id = 'TU_USER_ID';
*/

-- =====================================================
-- PARTE 6: ROLLBACK (SOLO SI ALGO SALIÓ MAL)
-- =====================================================
-- Si el layout se bloqueó después de la limpieza,
-- ejecuta esto para restaurar las políticas antiguas
-- =====================================================

/*
BEGIN;

-- Restaurar políticas antiguas desde el backup de PARTE 2
-- Copia las políticas del backup y pégalas aquí

-- Ejemplo (ajusta según tu backup):
CREATE POLICY "Admins can view companies" ON public.companies
  FOR SELECT USING (...);

CREATE POLICY "Admins can view their company" ON public.companies
  FOR SELECT USING (...);

CREATE POLICY "Users can view their own company" ON public.companies
  FOR SELECT USING (...);

COMMIT;
*/

-- =====================================================
-- RESUMEN DE POLÍTICAS RECOMENDADAS (ESTADO FINAL)
-- =====================================================
-- Después de la limpieza, deberías tener estas políticas:
--
-- 1. users_select_own_company (SELECT)
--    - Permite a usuarios ver su company
--
-- 2. authenticated_insert_company (INSERT)
--    - Permite crear companies durante registro
--
-- 3. admins_update_own_company (UPDATE)
--    - Permite a admins actualizar su company
--
-- 4. Admins can manage companies (ALL)
--    - Permite a admins hacer todo con companies
--
-- Total: 4 políticas (óptimo)
-- =====================================================

-- =====================================================
-- NOTAS IMPORTANTES
-- =====================================================
-- 1. Este script usa transacciones (BEGIN/COMMIT)
-- 2. Si algo falla, hace rollback automático
-- 3. Verifica que las políticas modernas existen antes de eliminar
-- 4. Mantiene la política "Admins can manage companies" (ALL)
-- 5. Elimina solo las políticas SELECT duplicadas
-- 6. El layout debe seguir funcionando después de la limpieza
-- 7. Si el layout se bloquea, usa PARTE 6 (Rollback)

-- =====================================================
-- INSTRUCCIONES DE USO
-- =====================================================
-- 1. Ejecuta PARTE 1 - Ver qué políticas se eliminarán
-- 2. Ejecuta PARTE 2 - Guardar backup (IMPORTANTE)
-- 3. Ejecuta PARTE 3 - Hacer limpieza (solo si estás seguro)
-- 4. Ejecuta PARTE 4 - Verificar resultado
-- 5. Prueba el layout en tu aplicación
-- 6. Si algo falla, usa PARTE 6 (Rollback)
