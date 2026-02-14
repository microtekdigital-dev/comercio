-- ============================================================================
-- COMPARAR: microtekdigital@gmail.com vs vanitoadette1985@gmail.com
-- ============================================================================
-- Compara ambos usuarios para identificar diferencias que expliquen
-- por qué uno puede crear órdenes y el otro no
-- ============================================================================

-- ========================================
-- 1. COMPARAR DATOS DE USUARIOS
-- ========================================

SELECT 
  '👤 DATOS USUARIOS' as seccion,
  p.email,
  p.id as user_id,
  p.company_id,
  p.role,
  c.name as empresa,
  CASE 
    WHEN p.company_id IS NULL THEN '❌ Sin empresa'
    ELSE '✅ Con empresa'
  END as estado_empresa
FROM profiles p
LEFT JOIN companies c ON c.id = p.company_id
WHERE p.email IN ('microtekdigital@gmail.com', 'vanitoadette1985@gmail.com')
ORDER BY p.email;

-- ========================================
-- 2. COMPARAR SUSCRIPCIONES
-- ========================================

SELECT 
  '📋 SUSCRIPCIONES' as seccion,
  p.email,
  pl.name as plan,
  s.status,
  s.current_period_start as inicio,
  s.current_period_end as fin,
  CASE 
    WHEN s.status = 'active' THEN '✅ Activa'
    WHEN s.status = 'trialing' THEN '⚠️ Trial'
    ELSE '❌ Inactiva'
  END as estado
FROM profiles p
JOIN subscriptions s ON s.company_id = p.company_id
JOIN plans pl ON pl.id = s.plan_id
WHERE p.email IN ('microtekdigital@gmail.com', 'vanitoadette1985@gmail.com')
  AND s.status IN ('active', 'trialing')
ORDER BY p.email;

-- ========================================
-- 3. COMPARAR COMPANY_USERS
-- ========================================

SELECT 
  '🏢 COMPANY_USERS' as seccion,
  p.email,
  cu.user_id,
  cu.company_id,
  cu.role,
  CASE 
    WHEN cu.id IS NULL THEN '❌ NO existe en company_users'
    ELSE '✅ Existe en company_users'
  END as estado
FROM profiles p
LEFT JOIN company_users cu ON cu.user_id = p.id
WHERE p.email IN ('microtekdigital@gmail.com', 'vanitoadette1985@gmail.com')
ORDER BY p.email;

-- ========================================
-- 4. COMPARAR PROVEEDORES
-- ========================================

SELECT 
  '🏢 PROVEEDORES' as seccion,
  p.email,
  COUNT(s.id) as total_proveedores
FROM profiles p
LEFT JOIN suppliers s ON s.company_id = p.company_id
WHERE p.email IN ('microtekdigital@gmail.com', 'vanitoadette1985@gmail.com')
GROUP BY p.email
ORDER BY p.email;

-- ========================================
-- 5. COMPARAR PRODUCTOS
-- ========================================

SELECT 
  '📦 PRODUCTOS' as seccion,
  p.email,
  COUNT(pr.id) as total_productos
FROM profiles p
LEFT JOIN products pr ON pr.company_id = p.company_id
WHERE p.email IN ('microtekdigital@gmail.com', 'vanitoadette1985@gmail.com')
GROUP BY p.email
ORDER BY p.email;

-- ========================================
-- 6. COMPARAR ÓRDENES DE COMPRA EXISTENTES
-- ========================================

SELECT 
  '📋 ÓRDENES COMPRA' as seccion,
  p.email,
  COUNT(po.id) as total_ordenes,
  MAX(po.created_at) as ultima_orden
FROM profiles p
LEFT JOIN purchase_orders po ON po.company_id = p.company_id
WHERE p.email IN ('microtekdigital@gmail.com', 'vanitoadette1985@gmail.com')
GROUP BY p.email
ORDER BY p.email;

-- ========================================
-- 7. VERIFICAR PERMISOS RLS
-- ========================================

-- Verificar si ambos usuarios pueden ver sus propios datos
SELECT 
  '🔐 TEST RLS - PROFILES' as seccion,
  p.email,
  CASE 
    WHEN p.id IS NOT NULL THEN '✅ Puede ver su profile'
    ELSE '❌ NO puede ver su profile'
  END as acceso_profile
FROM profiles p
WHERE p.email IN ('microtekdigital@gmail.com', 'vanitoadette1985@gmail.com')
ORDER BY p.email;

-- ========================================
-- 8. COMPARAR COMPANY_ID EN AMBAS TABLAS
-- ========================================

SELECT 
  '🔍 COMPANY_ID CONSISTENCY' as seccion,
  p.email,
  p.company_id as company_id_profiles,
  cu.company_id as company_id_company_users,
  CASE 
    WHEN p.company_id = cu.company_id THEN '✅ Consistente'
    WHEN p.company_id IS NULL THEN '❌ NULL en profiles'
    WHEN cu.company_id IS NULL THEN '❌ NULL en company_users'
    ELSE '❌ Inconsistente'
  END as consistencia
FROM profiles p
LEFT JOIN company_users cu ON cu.user_id = p.id
WHERE p.email IN ('microtekdigital@gmail.com', 'vanitoadette1985@gmail.com')
ORDER BY p.email;

-- ========================================
-- 9. VERIFICAR FUNCIÓN GET_USER_COMPANY_ID
-- ========================================

SELECT 
  '🔧 FUNCIÓN HELPER' as seccion,
  proname as nombre_funcion,
  prosecdef as es_security_definer,
  CASE 
    WHEN prosecdef = true THEN '✅ SECURITY DEFINER OK'
    ELSE '❌ Falta SECURITY DEFINER'
  END as estado
FROM pg_proc
WHERE proname = 'get_user_company_id';

-- ========================================
-- 10. VERIFICAR POLÍTICAS RLS PURCHASE_ORDERS
-- ========================================

SELECT 
  '📜 POLÍTICAS PURCHASE_ORDERS' as seccion,
  policyname as politica,
  cmd as comando,
  CASE 
    WHEN qual::text LIKE '%get_user_company_id%' THEN '✅ Usa función helper'
    WHEN qual::text LIKE '%company_users%' THEN '⚠️ Usa company_users'
    WHEN qual::text LIKE '%profiles%' THEN '⚠️ Usa profiles'
    ELSE '❓ Revisar'
  END as tipo
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'purchase_orders'
ORDER BY policyname;

-- ========================================
-- 11. RESUMEN COMPARATIVO
-- ========================================

SELECT 
  '✅ RESUMEN COMPARATIVO' as resultado,
  (SELECT COUNT(*) FROM profiles WHERE email = 'microtekdigital@gmail.com' AND company_id IS NOT NULL) as microtek_tiene_company,
  (SELECT COUNT(*) FROM profiles WHERE email = 'vanitoadette1985@gmail.com' AND company_id IS NOT NULL) as vanitoadette_tiene_company,
  (SELECT COUNT(*) FROM company_users cu JOIN profiles p ON p.id = cu.user_id WHERE p.email = 'microtekdigital@gmail.com') as microtek_en_company_users,
  (SELECT COUNT(*) FROM company_users cu JOIN profiles p ON p.id = cu.user_id WHERE p.email = 'vanitoadette1985@gmail.com') as vanitoadette_en_company_users,
  (SELECT COUNT(*) FROM purchase_orders po JOIN profiles p ON p.company_id = po.company_id WHERE p.email = 'microtekdigital@gmail.com') as microtek_ordenes,
  (SELECT COUNT(*) FROM purchase_orders po JOIN profiles p ON p.company_id = po.company_id WHERE p.email = 'vanitoadette1985@gmail.com') as vanitoadette_ordenes;

-- ============================================================================
-- INTERPRETACIÓN DE RESULTADOS
-- ============================================================================
-- 
-- Busca diferencias en:
-- 1. company_id: Ambos deben tener un company_id válido
-- 2. company_users: Ambos deben existir en esta tabla
-- 3. Consistencia: company_id debe ser igual en profiles y company_users
-- 4. Políticas RLS: Deben usar get_user_company_id() o estar actualizadas
-- 
-- Si encuentras diferencias, esa es la causa del problema
-- ============================================================================
