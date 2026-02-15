-- DEBUG: Órdenes de Compra en Reporte de Liquidación
-- Este script ayuda a diagnosticar por qué las órdenes recibidas no aparecen en el reporte

-- ============================================================================
-- DIAGNÓSTICO COMPLETO - SIGUE ESTOS PASOS EN ORDEN
-- ============================================================================

-- PASO 1: Identificar tu company_id
-- Ejecuta esto primero para saber qué company_id usar en las siguientes consultas
SELECT 
  u.id as user_id,
  u.email,
  cu.company_id,
  c.name as company_name,
  cu.role
FROM auth.users u
LEFT JOIN company_users cu ON u.id = cu.user_id
LEFT JOIN companies c ON cu.company_id = c.id
WHERE u.email = 'TU_EMAIL_AQUI'  -- ⚠️ REEMPLAZAR CON TU EMAIL
LIMIT 1;

-- ============================================================================
-- PASO 2: Ver todas las órdenes de compra recibidas (todos los company_ids)
-- Esto te mostrará TODAS las órdenes recibidas en el sistema
-- ============================================================================
SELECT 
  po.id,
  po.order_number,
  po.company_id,
  c.name as company_name,
  po.status,
  po.order_date,
  po.received_date,
  po.total,
  COUNT(poi.id) as items_count
FROM purchase_orders po
LEFT JOIN companies c ON c.id = po.company_id
LEFT JOIN purchase_order_items poi ON poi.purchase_order_id = po.id
WHERE po.status = 'received'
  AND po.received_date IS NOT NULL
GROUP BY po.id, po.order_number, po.company_id, c.name, po.status, po.order_date, po.received_date, po.total
ORDER BY po.received_date DESC
LIMIT 50;

-- ============================================================================
-- PASO 3: Ver items de órdenes recibidas con detalles completos
-- Esto simula exactamente lo que hace el reporte
-- ============================================================================
SELECT 
  poi.product_id,
  poi.variant_id,
  poi.quantity,
  poi.unit_cost,
  po.status,
  po.received_date,
  po.company_id,
  p.name as product_name,
  p.category_id,
  c.name as category_name,
  pv.variant_name
FROM purchase_order_items poi
INNER JOIN purchase_orders po ON poi.purchase_order_id = po.id
INNER JOIN products p ON poi.product_id = p.id
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN product_variants pv ON poi.variant_id = pv.id
WHERE po.status = 'received'
  AND po.received_date IS NOT NULL
  AND po.received_date >= '2026-02-01'  -- ⚠️ AJUSTAR FECHA INICIO
  AND po.received_date <= '2026-02-28'  -- ⚠️ AJUSTAR FECHA FIN
ORDER BY po.received_date DESC, p.name;

-- ============================================================================
-- PASO 4: Filtrar por TU company_id específico
-- Reemplaza 'YOUR_COMPANY_ID' con el valor que obtuviste en PASO 1
-- ============================================================================
SELECT 
  poi.product_id,
  poi.variant_id,
  poi.quantity,
  poi.unit_cost,
  po.status,
  po.received_date,
  po.company_id,
  p.name as product_name
FROM purchase_order_items poi
INNER JOIN purchase_orders po ON poi.purchase_order_id = po.id
INNER JOIN products p ON poi.product_id = p.id
WHERE po.company_id = 'YOUR_COMPANY_ID'  -- ⚠️ REEMPLAZAR CON TU COMPANY_ID
  AND po.status = 'received'
  AND po.received_date IS NOT NULL
  AND po.received_date >= '2026-02-01'  -- ⚠️ AJUSTAR FECHA INICIO
  AND po.received_date <= '2026-02-28'  -- ⚠️ AJUSTAR FECHA FIN
ORDER BY po.received_date DESC, p.name;

-- ============================================================================
-- PASO 5: Ver resumen por company_id
-- Esto te ayuda a identificar qué empresas tienen órdenes
-- ============================================================================
SELECT DISTINCT 
  po.company_id,
  c.name as company_name,
  COUNT(DISTINCT po.id) as total_orders,
  COUNT(DISTINCT CASE WHEN po.status = 'received' THEN po.id END) as received_orders,
  MIN(po.received_date) as first_received_date,
  MAX(po.received_date) as last_received_date
FROM purchase_orders po
LEFT JOIN companies c ON po.company_id = c.id
WHERE po.received_date IS NOT NULL
GROUP BY po.company_id, c.name
ORDER BY received_orders DESC;

-- ============================================================================
-- PASO 6: Verificar tipos de datos de las columnas de fecha
-- ============================================================================
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'purchase_orders'
  AND column_name IN ('order_date', 'received_date', 'expected_date');

-- ============================================================================
-- PASO 7: Verificar si hay problema con formato de fecha
-- Prueba diferentes formatos de comparación
-- ============================================================================
SELECT 
  po.order_number,
  po.received_date,
  po.received_date::text as received_date_text,
  CASE 
    WHEN po.received_date >= '2026-02-01' THEN 'Cumple >= 2026-02-01'
    ELSE 'NO cumple >= 2026-02-01'
  END as test_gte,
  CASE 
    WHEN po.received_date <= '2026-02-28' THEN 'Cumple <= 2026-02-28'
    ELSE 'NO cumple <= 2026-02-28'
  END as test_lte
FROM purchase_orders po
WHERE po.status = 'received'
  AND po.received_date IS NOT NULL
ORDER BY po.received_date DESC
LIMIT 20;

-- ============================================================================
-- DIAGNÓSTICO COMÚN: PROBLEMAS TÍPICOS
-- ============================================================================

-- Problema 1: company_id incorrecto
-- Solución: Verifica que estés usando el company_id correcto (PASO 1)

-- Problema 2: Fechas fuera del rango
-- Solución: Verifica que las fechas received_date estén dentro del período (PASO 7)

-- Problema 3: Status no es 'received'
-- Solución: Verifica que las órdenes tengan status = 'received' (PASO 2)

-- Problema 4: received_date es NULL
-- Solución: Las órdenes deben tener received_date no nulo (PASO 2)

-- Problema 5: RLS (Row Level Security) bloqueando acceso
-- Solución: Verifica políticas RLS en purchase_orders y purchase_order_items
