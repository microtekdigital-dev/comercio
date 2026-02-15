-- DIAGNÓSTICO SIMPLE: ¿Por qué no aparecen las compras en el reporte?
-- Ejecuta estas consultas UNA POR UNA en Supabase SQL Editor

-- ============================================
-- PASO 1: Ver tu company_id actual
-- ============================================
-- Primero necesitamos saber con qué empresa estás logueado
SELECT 
  u.email as "Tu Email",
  cu.role as "Tu Rol",
  c.id as "Company ID",
  c.name as "Nombre Empresa"
FROM auth.users u
JOIN company_users cu ON cu.user_id = u.id
JOIN companies c ON c.id = cu.company_id
WHERE u.email = 'TU_EMAIL_AQUI'  -- REEMPLAZA CON TU EMAIL
ORDER BY cu.created_at DESC
LIMIT 1;

-- ============================================
-- PASO 2: Ver TODAS las órdenes de compra con company_id
-- ============================================
SELECT 
  po.id as "ID Orden",
  po.order_number as "Número Orden",
  po.company_id as "Company ID",
  c.name as "Empresa",
  po.status as "Estado",
  po.order_date as "Fecha Orden",
  po.received_date as "Fecha Recepción",
  COUNT(poi.id) as "Cantidad Items"
FROM purchase_orders po
LEFT JOIN companies c ON c.id = po.company_id
LEFT JOIN purchase_order_items poi ON poi.purchase_order_id = po.id
GROUP BY po.id, po.order_number, po.company_id, c.name, po.status, po.order_date, po.received_date
ORDER BY po.created_at DESC
LIMIT 20;

-- ============================================
-- PASO 3: Ver órdenes RECIBIDAS con fechas específicas
-- ============================================
SELECT 
  po.order_number as "Número Orden",
  po.company_id as "Company ID",
  c.name as "Empresa",
  po.received_date as "Fecha Recepción",
  po.status as "Estado",
  COUNT(poi.id) as "Items",
  SUM(poi.quantity * poi.unit_cost) as "Valor Total"
FROM purchase_orders po
LEFT JOIN companies c ON c.id = po.company_id
LEFT JOIN purchase_order_items poi ON poi.purchase_order_id = po.id
WHERE po.status = 'received'
  AND po.received_date IS NOT NULL
  AND po.received_date >= '2026-02-01'  -- Ajusta estas fechas
  AND po.received_date <= '2026-02-28'  -- según tu reporte
GROUP BY po.id, po.order_number, po.company_id, c.name, po.received_date, po.status
ORDER BY po.received_date DESC;

-- ============================================
-- PASO 4: Ver items de órdenes recibidas
-- ============================================
SELECT 
  po.order_number as "Orden",
  po.company_id as "Company ID",
  c.name as "Empresa",
  po.received_date as "Fecha",
  p.name as "Producto",
  pv.variant_name as "Variante",
  poi.quantity as "Cantidad",
  poi.unit_cost as "Costo Unit.",
  (poi.quantity * poi.unit_cost) as "Total"
FROM purchase_orders po
JOIN companies c ON c.id = po.company_id
JOIN purchase_order_items poi ON poi.purchase_order_id = po.id
JOIN products p ON p.id = poi.product_id
LEFT JOIN product_variants pv ON pv.id = poi.variant_id
WHERE po.status = 'received'
  AND po.received_date IS NOT NULL
ORDER BY po.received_date DESC
LIMIT 50;

-- ============================================
-- PASO 5: COMPARAR - ¿Tu company_id coincide con las órdenes?
-- ============================================
-- Ejecuta PASO 1 primero para obtener tu company_id
-- Luego reemplaza 'TU_COMPANY_ID_AQUI' con ese valor

SELECT 
  'Órdenes en tu empresa' as "Tipo",
  COUNT(*) as "Cantidad"
FROM purchase_orders
WHERE company_id = 'TU_COMPANY_ID_AQUI'  -- REEMPLAZA CON TU COMPANY_ID
  AND status = 'received'
  AND received_date IS NOT NULL

UNION ALL

SELECT 
  'Órdenes en otras empresas' as "Tipo",
  COUNT(*) as "Cantidad"
FROM purchase_orders
WHERE company_id != 'TU_COMPANY_ID_AQUI'  -- REEMPLAZA CON TU COMPANY_ID
  AND status = 'received'
  AND received_date IS NOT NULL;

-- ============================================
-- PASO 6: PROBLEMA COMÚN - Órdenes sin fecha de recepción
-- ============================================
SELECT 
  po.order_number as "Orden con Problema",
  c.name as "Empresa",
  po.status as "Estado",
  po.received_date as "Fecha Recepción (NULL = PROBLEMA)",
  po.created_at as "Fecha Creación"
FROM purchase_orders po
LEFT JOIN companies c ON c.id = po.company_id
WHERE po.status = 'received'
  AND po.received_date IS NULL;

-- Si esta consulta devuelve resultados, ESE ES EL PROBLEMA
-- Las órdenes están marcadas como recibidas pero sin fecha

-- ============================================
-- PASO 7: FIX - Corregir órdenes sin fecha (SI ES NECESARIO)
-- ============================================
-- SOLO ejecuta esto SI el PASO 6 mostró órdenes con problema
-- Esto establecerá la fecha de recepción = fecha de creación

-- UPDATE purchase_orders
-- SET received_date = created_at::date
-- WHERE status = 'received' 
--   AND received_date IS NULL;

-- Después de ejecutar el UPDATE, verifica:
-- SELECT COUNT(*) FROM purchase_orders 
-- WHERE status = 'received' AND received_date IS NULL;
-- Debería devolver 0
