-- =====================================================
-- FIX COMPANIES RLS - VERSIÓN SEGURA
-- =====================================================
-- Este script corrige las políticas RLS de companies
-- de forma segura, con validaciones y rollback
-- =====================================================

-- =====================================================
-- PARTE 1: SOLO DIAGNÓSTICO (EJECUTAR PRIMERO)
-- =====================================================
-- Ejecuta esta parte primero para ver el estado actual
-- NO hace cambios en la base de datos
-- =====================================================

-- Ver estado de RLS
SELECT 
  'RLS Status' as check_type,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'companies';

-- Ver políticas actuales
SELECT 
  'Current Policies' as check_type,
  policyname,
  cmd as operation
FROM pg_policies 
WHERE tablename = 'companies'
ORDER BY policyname;

-- Ver datos de prueba (primeros 5 registros)
SELECT 
  'Sample Data' as check_type,
  c.id as company_id,
  c.name as company_name,
  COUNT(p.id) as user_count
FROM companies c
LEFT JOIN profiles p ON p.company_id = c.id
GROUP BY c.id, c.name
ORDER BY c.created_at DESC
LIMIT 5;

-- =====================================================
-- PARTE 2: BACKUP DE POLÍTICAS ACTUALES
-- =====================================================
-- Guarda las políticas actuales por si necesitas revertir
-- Copia el resultado de esta consulta antes de continuar
-- =====================================================

SELECT 
  'BACKUP - Save this output!' as backup_note,
  policyname,
  cmd,
  qual::text as using_clause,
  with_check::text as with_check_clause
FROM pg_policies 
WHERE tablename = 'companies';

-- =====================================================
-- PARTE 3: APLICAR CAMBIOS (EJECUTAR CON CUIDADO)
-- =====================================================
-- Esta parte hace cambios reales en la base de datos
-- Solo ejecuta si estás seguro después de revisar PARTE 1 y 2
-- =====================================================

-- Iniciar transacción para poder hacer rollback si algo falla
BEGIN;

-- Paso 1: Deshabilitar RLS temporalmente (para evitar bloqueos durante cambios)
ALTER TABLE public.companies DISABLE ROW LEVEL SECURITY;

-- Paso 2: Eliminar políticas existentes (solo si existen)
DO $$ 
BEGIN
  -- Eliminar política de SELECT si existe
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'companies' 
    AND policyname = 'Users can view their company'
  ) THEN
    DROP POLICY "Users can view their company" ON public.companies;
    RAISE NOTICE 'Política "Users can view their company" eliminada';
  END IF;

  -- Eliminar política de UPDATE si existe
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'companies' 
    AND policyname = 'Admins can update their company'
  ) THEN
    DROP POLICY "Admins can update their company" ON public.companies;
    RAISE NOTICE 'Política "Admins can update their company" eliminada';
  END IF;

  -- Eliminar política de INSERT si existe
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'companies' 
    AND policyname = 'Allow insert for authenticated users'
  ) THEN
    DROP POLICY "Allow insert for authenticated users" ON public.companies;
    RAISE NOTICE 'Política "Allow insert for authenticated users" eliminada';
  END IF;

  RAISE NOTICE 'Políticas antiguas eliminadas exitosamente';
END $$;

-- Paso 3: Crear nuevas políticas con nombres únicos
-- Política SELECT - Usuarios pueden ver su company
CREATE POLICY "users_select_own_company" ON public.companies
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT company_id 
      FROM public.profiles 
      WHERE id = auth.uid()
      AND company_id IS NOT NULL
    )
  );

-- Política INSERT - Permitir crear companies durante registro
CREATE POLICY "authenticated_insert_company" ON public.companies
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- Política UPDATE - Solo admins pueden actualizar
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

-- Paso 4: Habilitar RLS nuevamente
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Paso 5: Verificar que todo se creó correctamente
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies 
  WHERE tablename = 'companies';
  
  IF policy_count >= 3 THEN
    RAISE NOTICE 'Verificación exitosa: % políticas creadas', policy_count;
  ELSE
    RAISE EXCEPTION 'Error: Solo se crearon % políticas, se esperaban al menos 3', policy_count;
  END IF;
END $$;

-- Si todo salió bien, confirma los cambios
-- Si algo falló, se hará rollback automático
COMMIT;

-- =====================================================
-- PARTE 4: VERIFICACIÓN POST-APLICACIÓN
-- =====================================================
-- Ejecuta esto después de COMMIT para verificar
-- =====================================================

-- Ver nuevas políticas
SELECT 
  'New Policies' as check_type,
  policyname,
  cmd as operation,
  CASE 
    WHEN qual IS NOT NULL THEN 'Has USING'
    ELSE 'No USING'
  END as using_status,
  CASE 
    WHEN with_check IS NOT NULL THEN 'Has WITH CHECK'
    ELSE 'No WITH CHECK'
  END as check_status
FROM pg_policies 
WHERE tablename = 'companies'
ORDER BY policyname;

-- Verificar que RLS está habilitado
SELECT 
  'RLS Final Status' as check_type,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'companies';

-- =====================================================
-- PARTE 5: ROLLBACK (SOLO SI ALGO SALIÓ MAL)
-- =====================================================
-- Si necesitas revertir los cambios, ejecuta esto:
-- =====================================================

/*
BEGIN;

-- Deshabilitar RLS
ALTER TABLE public.companies DISABLE ROW LEVEL SECURITY;

-- Eliminar nuevas políticas
DROP POLICY IF EXISTS "users_select_own_company" ON public.companies;
DROP POLICY IF EXISTS "authenticated_insert_company" ON public.companies;
DROP POLICY IF EXISTS "admins_update_own_company" ON public.companies;

-- Recrear políticas originales (copia del BACKUP en PARTE 2)
CREATE POLICY "Users can view their company" ON public.companies
  FOR SELECT USING (
    id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Admins can update their company" ON public.companies
  FOR UPDATE USING (
    id IN (
      SELECT company_id FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Allow insert for authenticated users" ON public.companies
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Habilitar RLS
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

COMMIT;
*/

-- =====================================================
-- NOTAS DE SEGURIDAD
-- =====================================================
-- 1. Este script usa transacciones (BEGIN/COMMIT) para seguridad
-- 2. Si algo falla, se hace rollback automático
-- 3. Verifica el estado antes y después de aplicar
-- 4. Guarda el backup de políticas antes de ejecutar
-- 5. Prueba primero en desarrollo, nunca directo en producción
-- 6. Si tienes dudas, NO ejecutes PARTE 3, solo PARTE 1 (diagnóstico)

-- =====================================================
-- INSTRUCCIONES DE USO
-- =====================================================
-- 1. Ejecuta PARTE 1 (Diagnóstico) - Ver estado actual
-- 2. Ejecuta PARTE 2 (Backup) - Guarda el resultado
-- 3. Ejecuta PARTE 3 (Cambios) - Solo si estás seguro
-- 4. Ejecuta PARTE 4 (Verificación) - Confirma que funcionó
-- 5. Si algo falla, usa PARTE 5 (Rollback) - Revierte cambios
