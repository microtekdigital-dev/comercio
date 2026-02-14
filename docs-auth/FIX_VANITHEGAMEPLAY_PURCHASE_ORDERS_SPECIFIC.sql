-- ============================================================================
-- FIX ESPECÍFICO: vanithegameplay@gmail.com - Purchase Orders
-- ============================================================================
-- Este script corrige los problemas más comunes que impiden crear órdenes
-- ============================================================================

BEGIN;

-- ========================================
-- 1. VERIFICAR ESTADO ACTUAL
-- ========================================

DO $
DECLARE
  v_user_id UUID;
  v_company_id UUID;
  v_role TEXT;
  v_has_subscription BOOLEAN;
  v_plan_name TEXT;
BEGIN
  -- Obtener datos del usuario
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'vanithegameplay@gmail.com';
  SELECT company_id, role INTO v_company_id, v_role FROM profiles WHERE email = 'vanithegameplay@gmail.com';
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'DIAGNÓSTICO VANITHEGAMEPLAY';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'User ID: %', v_user_id;
  RAISE NOTICE 'Company ID: %', COALESCE(v_company_id::TEXT, 'NULL');
  RAISE NOTICE 'Role: %', COALESCE(v_role, 'NULL');
  
  -- Verificar suscripción
  SELECT EXISTS(
    SELECT 1 FROM subscriptions 
    WHERE company_id = v_company_id 
    AND status = 'active'
  ) INTO v_has_subscription;
  
  SELECT p.name INTO v_plan_name
  FROM subscriptions s
  JOIN plans p ON s.plan_id = p.id
  WHERE s.company_id = v_company_id
  AND s.status = 'active'
  ORDER BY s.created_at DESC
  LIMIT 1;
  
  RAISE NOTICE 'Tiene suscripción activa: %', v_has_subscription;
  RAISE NOTICE 'Plan: %', COALESCE(v_plan_name, 'NULL');
  RAISE NOTICE '========================================';
END $;

-- ========================================
-- 2. FIX: Asegurar company_id
-- ========================================

-- Si el usuario no tiene company_id, asignarlo
UPDATE profiles
SET company_id = (
  SELECT id FROM companies 
  WHERE name LIKE '%vanithegameplay%' 
  OR name LIKE '%Vani%'
  ORDER BY created_at DESC
  LIMIT 1
)
WHERE email = 'vanithegameplay@gmail.com'
AND company_id IS NULL;

-- Verificar resultado
DO $
DECLARE
  v_company_id UUID;
BEGIN
  SELECT company_id INTO v_company_id FROM profiles WHERE email = 'vanithegameplay@gmail.com';
  
  IF v_company_id IS NULL THEN
    RAISE NOTICE '❌ PROBLEMA: Usuario sigue sin company_id';
    RAISE NOTICE 'Solución: Crear company manualmente';
  ELSE
    RAISE NOTICE '✅ Usuario tiene company_id: %', v_company_id;
  END IF;
END $;

-- ========================================
-- 3. FIX: Asegurar rol correcto
-- ========================================

-- Si el usuario es employee, cambiarlo a owner/admin
UPDATE profiles
SET role = 'owner'
WHERE email = 'vanithegameplay@gmail.com'
AND role = 'employee';

-- Verificar resultado
DO $
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role FROM profiles WHERE email = 'vanithegameplay@gmail.com';
  
  IF v_role NOT IN ('owner', 'admin', 'member') THEN
    RAISE NOTICE '⚠️ ADVERTENCIA: Rol es "%", puede no tener permisos', v_role;
  ELSE
    RAISE NOTICE '✅ Rol correcto: %', v_role;
  END IF;
END $;

-- ========================================
-- 4. FIX: Asegurar company_users
-- ========================================

-- Insertar en company_users si no existe
INSERT INTO company_users (user_id, company_id, role)
SELECT 
  p.id,
  p.company_id,
  p.role
FROM profiles p
WHERE p.email = 'vanithegameplay@gmail.com'
AND p.company_id IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM company_users cu 
  WHERE cu.user_id = p.id 
  AND cu.company_id = p.company_id
)
ON CONFLICT (user_id, company_id) DO NOTHING;

-- Verificar resultado
DO $
DECLARE
  v_exists BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM company_users cu
    JOIN profiles p ON cu.user_id = p.id
    WHERE p.email = 'vanithegameplay@gmail.com'
  ) INTO v_exists;
  
  IF v_exists THEN
    RAISE NOTICE '✅ Usuario existe en company_users';
  ELSE
    RAISE NOTICE '❌ Usuario NO existe en company_users';
  END IF;
END $;

-- ========================================
-- 5. VERIFICAR SUSCRIPCIÓN
-- ========================================

DO $
DECLARE
  v_company_id UUID;
  v_has_active_sub BOOLEAN;
  v_plan_name TEXT;
  v_allows_po BOOLEAN;
BEGIN
  SELECT company_id INTO v_company_id FROM profiles WHERE email = 'vanithegameplay@gmail.com';
  
  SELECT EXISTS(
    SELECT 1 FROM subscriptions 
    WHERE company_id = v_company_id 
    AND status = 'active'
  ) INTO v_has_active_sub;
  
  IF NOT v_has_active_sub THEN
    RAISE NOTICE '❌ PROBLEMA: Sin suscripción activa';
    RAISE NOTICE 'Solución: Usuario debe activar un plan desde /dashboard/billing';
  ELSE
    SELECT p.name INTO v_plan_name
    FROM subscriptions s
    JOIN plans p ON s.plan_id = p.id
    WHERE s.company_id = v_company_id
    AND s.status = 'active'
    ORDER BY s.created_at DESC
    LIMIT 1;
    
    v_allows_po := v_plan_name IN ('Pro', 'Profesional', 'Profesional Anual', 'Empresarial', 'Empresarial Anual');
    
    IF v_allows_po THEN
      RAISE NOTICE '✅ Plan "%" permite purchase orders', v_plan_name;
    ELSE
      RAISE NOTICE '❌ PROBLEMA: Plan "%" NO permite purchase orders', v_plan_name;
      RAISE NOTICE 'Solución: Cambiar a plan Profesional o Empresarial';
    END IF;
  END IF;
END $;

-- ========================================
-- 6. VERIFICAR SUPPLIERS
-- ========================================

DO $
DECLARE
  v_company_id UUID;
  v_supplier_count INTEGER;
BEGIN
  SELECT company_id INTO v_company_id FROM profiles WHERE email = 'vanithegameplay@gmail.com';
  
  SELECT COUNT(*) INTO v_supplier_count
  FROM suppliers
  WHERE company_id = v_company_id;
  
  IF v_supplier_count = 0 THEN
    RAISE NOTICE '⚠️ ADVERTENCIA: Sin suppliers';
    RAISE NOTICE 'Solución: Usuario debe crear un supplier desde /dashboard/suppliers';
  ELSE
    RAISE NOTICE '✅ Tiene % suppliers', v_supplier_count;
  END IF;
END $;

-- ========================================
-- 7. RESUMEN FINAL
-- ========================================

SELECT 
  '📊 RESUMEN FINAL' as seccion,
  p.email,
  p.company_id,
  p.role,
  CASE 
    WHEN p.company_id IS NULL THEN '❌ Sin company_id'
    ELSE '✅ Tiene company_id'
  END as estado_company,
  CASE 
    WHEN p.role IN ('owner', 'admin', 'member') THEN '✅ Rol correcto'
    ELSE '❌ Rol incorrecto'
  END as estado_role,
  CASE 
    WHEN EXISTS(SELECT 1 FROM company_users WHERE user_id = p.id) THEN '✅ En company_users'
    ELSE '❌ No en company_users'
  END as estado_company_users,
  CASE 
    WHEN EXISTS(SELECT 1 FROM subscriptions WHERE company_id = p.company_id AND status = 'active') THEN '✅ Suscripción activa'
    ELSE '❌ Sin suscripción'
  END as estado_subscription
FROM profiles p
WHERE p.email = 'vanithegameplay@gmail.com';

-- ========================================
-- 8. SIGUIENTE PASO
-- ========================================

SELECT 
  '🎯 SIGUIENTE PASO' as accion,
  CASE 
    WHEN (SELECT company_id FROM profiles WHERE email = 'vanithegameplay@gmail.com') IS NULL
    THEN 'CRÍTICO: Crear company manualmente y asignar al usuario'
    
    WHEN NOT EXISTS(SELECT 1 FROM subscriptions WHERE company_id = (SELECT company_id FROM profiles WHERE email = 'vanithegameplay@gmail.com') AND status = 'active')
    THEN 'Usuario debe activar un plan desde /dashboard/billing'
    
    WHEN (SELECT COUNT(*) FROM suppliers WHERE company_id = (SELECT company_id FROM profiles WHERE email = 'vanithegameplay@gmail.com')) = 0
    THEN 'Usuario debe crear un supplier desde /dashboard/suppliers'
    
    ELSE 'Todo correcto - Intenta crear una orden de compra nuevamente'
  END as instruccion;

COMMIT;

-- ============================================================================
-- INSTRUCCIONES POST-EJECUCIÓN
-- ============================================================================
-- 1. Ejecuta este script en Supabase SQL Editor
-- 2. Lee los mensajes NOTICE en la salida
-- 3. Sigue las instrucciones del "SIGUIENTE PASO"
-- 4. Si todo está correcto, intenta crear una orden de compra
-- 5. Si sigue fallando, comparte los logs del navegador (F12)
-- ============================================================================
