-- ============================================================================
-- DIAGNÓSTICO ESPECÍFICO: vanithegameplay@gmail.com
-- ============================================================================
-- El problema es que vanithegameplay NO puede crear órdenes de compra
-- pero microtekdigital SÍ puede
-- ============================================================================

-- ========================================
-- 1. BUSCAR USUARIO VANITHEGAMEPLAY
-- ========================================

SELECT 
  '👤 USUARIO VANITHEGAMEPLAY' as seccion,
  id as user_id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users
WHERE email = 'vanithegameplay@gmail.com';

-- ========================================
-- 2. VERIFICAR PROFILE
-- ========================================

SELECT 
  '📋 PROFILE DE VANITHEGAMEPLAY' as seccion,
  p.id as user_id,
  p.company_id,
  p.role,
  p.full_name,
  p.email,
  CASE 
    WHEN p.company_id IS NULL THEN '❌ SIN COMPANY_ID'
    ELSE '✅ Tiene company_id'
  END as estado_company
FROM profiles p
WHERE p.email = 'vanithegameplay@gmail.com'
   OR p.id IN (SELECT id FROM auth.users WHERE email = 'vanithegameplay@gmail.com');

-- ========================================
-- 3. VERIFICAR COMPANY
-- ========================================

SELECT 
  '🏢 COMPANY DE VANITHEGAMEPLAY' as seccion,
  c.id as company_id,
  c.name as company_name,
  c.created_at
FROM companies c
WHERE c.id IN (
  SELECT company_id FROM profiles 
  WHERE email = 'vanithegameplay@gmail.com'
);

-- ========================================
-- 4. VERIFICAR SUSCRIPCIÓN
-- ========================================

SELECT 
  '💳 SUSCRIPCIÓN DE VANITHEGAMEPLAY' as seccion,
  s.id as subscription_id,
  s.company_id,
  s.status,
  p.name as plan_name,
  p.price,
  s.current_period_start,
  s.current_period_end,
  CASE 
    WHEN s.status = 'active' THEN '✅ Activa'
    WHEN s.status = 'cancelled' THEN '❌ Cancelada'
    ELSE '⚠️ ' || s.status
  END as estado
FROM subscriptions s
LEFT JOIN plans p ON s.plan_id = p.id
WHERE s.company_id IN (
  SELECT company_id FROM profiles 
  WHERE email = 'vanithegameplay@gmail.com'
)
ORDER BY s.created_at DESC;

-- ========================================
-- 5. VERIFICAR ACCESO A PURCHASE ORDERS
-- ========================================

-- Verificar si el plan permite purchase orders
SELECT 
  '🔐 ACCESO A PURCHASE ORDERS' as seccion,
  p.name as plan_name,
  CASE 
    WHEN p.name IN ('Pro', 'Profesional', 'Profesional Anual', 'Empresarial', 'Empresarial Anual') 
    THEN '✅ Plan permite purchase orders'
    ELSE '❌ Plan NO permite purchase orders'
  END as acceso_permitido
FROM subscriptions s
JOIN plans p ON s.plan_id = p.id
WHERE s.company_id IN (
  SELECT company_id FROM profiles 
  WHERE email = 'vanithegameplay@gmail.com'
)
AND s.status = 'active'
ORDER BY s.created_at DESC
LIMIT 1;

-- ========================================
-- 6. VERIFICAR SUPPLIERS
-- ========================================

SELECT 
  '🏭 SUPPLIERS DE VANITHEGAMEPLAY' as seccion,
  COUNT(*) as total_suppliers,
  CASE 
    WHEN COUNT(*) = 0 THEN '❌ Sin suppliers (necesita crear uno primero)'
    ELSE '✅ Tiene ' || COUNT(*) || ' suppliers'
  END as estado
FROM suppliers
WHERE company_id IN (
  SELECT company_id FROM profiles 
  WHERE email = 'vanithegameplay@gmail.com'
);

-- Listar suppliers
SELECT 
  '📋 LISTA DE SUPPLIERS' as seccion,
  id,
  name,
  status,
  created_at
FROM suppliers
WHERE company_id IN (
  SELECT company_id FROM profiles 
  WHERE email = 'vanithegameplay@gmail.com'
)
ORDER BY created_at DESC
LIMIT 5;

-- ========================================
-- 7. VERIFICAR PURCHASE ORDERS EXISTENTES
-- ========================================

SELECT 
  '📦 PURCHASE ORDERS DE VANITHEGAMEPLAY' as seccion,
  COUNT(*) as total_orders
FROM purchase_orders
WHERE company_id IN (
  SELECT company_id FROM profiles 
  WHERE email = 'vanithegameplay@gmail.com'
);

-- Listar últimas órdenes
SELECT 
  '📋 ÚLTIMAS PURCHASE ORDERS' as seccion,
  id,
  order_number,
  status,
  total,
  created_at
FROM purchase_orders
WHERE company_id IN (
  SELECT company_id FROM profiles 
  WHERE email = 'vanithegameplay@gmail.com'
)
ORDER BY created_at DESC
LIMIT 5;

-- ========================================
-- 8. VERIFICAR PRODUCTOS
-- ========================================

SELECT 
  '📦 PRODUCTOS DE VANITHEGAMEPLAY' as seccion,
  COUNT(*) as total_productos,
  CASE 
    WHEN COUNT(*) = 0 THEN '⚠️ Sin productos (puede afectar creación de órdenes)'
    ELSE '✅ Tiene ' || COUNT(*) || ' productos'
  END as estado
FROM products
WHERE company_id IN (
  SELECT company_id FROM profiles 
  WHERE email = 'vanithegameplay@gmail.com'
);

-- ========================================
-- 9. COMPARAR CON MICROTEKDIGITAL
-- ========================================

SELECT 
  '🔍 COMPARACIÓN CON MICROTEKDIGITAL' as seccion,
  'vanithegameplay' as usuario,
  (SELECT company_id FROM profiles WHERE email = 'vanithegameplay@gmail.com') as company_id,
  (SELECT role FROM profiles WHERE email = 'vanithegameplay@gmail.com') as role,
  (SELECT COUNT(*) FROM suppliers WHERE company_id = (SELECT company_id FROM profiles WHERE email = 'vanithegameplay@gmail.com')) as suppliers,
  (SELECT COUNT(*) FROM purchase_orders WHERE company_id = (SELECT company_id FROM profiles WHERE email = 'vanithegameplay@gmail.com')) as purchase_orders

UNION ALL

SELECT 
  '🔍 COMPARACIÓN CON MICROTEKDIGITAL' as seccion,
  'microtekdigital' as usuario,
  (SELECT company_id FROM profiles WHERE email = 'microtekdigital@gmail.com') as company_id,
  (SELECT role FROM profiles WHERE email = 'microtekdigital@gmail.com') as role,
  (SELECT COUNT(*) FROM suppliers WHERE company_id = (SELECT company_id FROM profiles WHERE email = 'microtekdigital@gmail.com')) as suppliers,
  (SELECT COUNT(*) FROM purchase_orders WHERE company_id = (SELECT company_id FROM profiles WHERE email = 'microtekdigital@gmail.com')) as purchase_orders;

-- ========================================
-- 10. VERIFICAR PERMISOS DEL ROL
-- ========================================

SELECT 
  '🔐 PERMISOS DEL ROL' as seccion,
  p.email,
  p.role,
  CASE 
    WHEN p.role IN ('owner', 'admin', 'member') THEN '✅ Rol permite crear purchase orders'
    WHEN p.role = 'employee' THEN '❌ Employee NO puede crear purchase orders'
    ELSE '⚠️ Rol desconocido: ' || COALESCE(p.role, 'NULL')
  END as permisos
FROM profiles p
WHERE p.email IN ('vanithegameplay@gmail.com', 'microtekdigital@gmail.com')
ORDER BY p.email;

-- ========================================
-- 11. VERIFICAR COMPANY_USERS
-- ========================================

SELECT 
  '👥 COMPANY_USERS' as seccion,
  cu.user_id,
  cu.company_id,
  cu.role,
  p.email,
  CASE 
    WHEN cu.user_id IS NULL THEN '❌ No existe en company_users'
    ELSE '✅ Existe en company_users'
  END as estado
FROM profiles p
LEFT JOIN company_users cu ON cu.user_id = p.id
WHERE p.email = 'vanithegameplay@gmail.com';

-- ========================================
-- 12. DIAGNÓSTICO FINAL
-- ========================================

SELECT 
  '🎯 DIAGNÓSTICO FINAL' as seccion,
  CASE 
    WHEN (SELECT company_id FROM profiles WHERE email = 'vanithegameplay@gmail.com') IS NULL
    THEN '❌ PROBLEMA: Usuario sin company_id'
    
    WHEN (SELECT role FROM profiles WHERE email = 'vanithegameplay@gmail.com') = 'employee'
    THEN '❌ PROBLEMA: Usuario es employee (no puede crear purchase orders)'
    
    WHEN (SELECT COUNT(*) FROM subscriptions WHERE company_id = (SELECT company_id FROM profiles WHERE email = 'vanithegameplay@gmail.com') AND status = 'active') = 0
    THEN '❌ PROBLEMA: Sin suscripción activa'
    
    WHEN (SELECT p.name FROM subscriptions s JOIN plans p ON s.plan_id = p.id WHERE s.company_id = (SELECT company_id FROM profiles WHERE email = 'vanithegameplay@gmail.com') AND s.status = 'active' ORDER BY s.created_at DESC LIMIT 1) NOT IN ('Pro', 'Profesional', 'Profesional Anual', 'Empresarial', 'Empresarial Anual')
    THEN '❌ PROBLEMA: Plan no permite purchase orders'
    
    WHEN (SELECT COUNT(*) FROM suppliers WHERE company_id = (SELECT company_id FROM profiles WHERE email = 'vanithegameplay@gmail.com')) = 0
    THEN '⚠️ ADVERTENCIA: Sin suppliers (necesita crear uno primero)'
    
    ELSE '✅ Todo parece correcto - revisar logs del servidor'
  END as diagnostico,
  
  CASE 
    WHEN (SELECT company_id FROM profiles WHERE email = 'vanithegameplay@gmail.com') IS NULL
    THEN 'Ejecutar: UPDATE profiles SET company_id = (SELECT id FROM companies WHERE name LIKE ''%vanithegameplay%'' LIMIT 1) WHERE email = ''vanithegameplay@gmail.com'''
    
    WHEN (SELECT role FROM profiles WHERE email = 'vanithegameplay@gmail.com') = 'employee'
    THEN 'Ejecutar: UPDATE profiles SET role = ''owner'' WHERE email = ''vanithegameplay@gmail.com'''
    
    WHEN (SELECT COUNT(*) FROM suppliers WHERE company_id = (SELECT company_id FROM profiles WHERE email = 'vanithegameplay@gmail.com')) = 0
    THEN 'Usuario debe crear un supplier primero desde la interfaz'
    
    ELSE 'Revisar logs del navegador (F12) y del servidor'
  END as solucion_recomendada;
