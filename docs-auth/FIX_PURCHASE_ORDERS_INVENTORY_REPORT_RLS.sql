-- ============================================================================
-- FIX: RLS para Purchase Orders en Reporte de Liquidación
-- ============================================================================
-- Este script corrige las políticas RLS para que las órdenes de compra
-- aparezcan correctamente en el reporte de liquidación de inventario
-- ============================================================================

-- ========================================
-- PASO 1: Crear función helper SECURITY DEFINER
-- ========================================
-- Esta función puede leer profiles incluso si RLS está habilitado

CREATE OR REPLACE FUNCTION get_user_company_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Intenta obtener company_id desde company_users (más confiable)
  RETURN (
    SELECT company_id 
    FROM company_users 
    WHERE user_id = auth.uid() 
    LIMIT 1
  );
END;
$$;

-- ========================================
-- PASO 2: Eliminar políticas antiguas de purchase_orders
-- ========================================

DROP POLICY IF EXISTS "Users can view purchase orders from their company" ON purchase_orders;
DROP POLICY IF EXISTS "Users can insert purchase orders for their company" ON purchase_orders;
DROP POLICY IF EXISTS "Users can update purchase orders from their company" ON purchase_orders;
DROP POLICY IF EXISTS "Users can delete purchase orders from their company" ON purchase_orders;

-- Políticas alternativas que podrían existir
DROP POLICY IF EXISTS "purchase_orders_select_policy" ON purchase_orders;
DROP POLICY IF EXISTS "purchase_orders_insert_policy" ON purchase_orders;
DROP POLICY IF EXISTS "purchase_orders_update_policy" ON purchase_orders;
DROP POLICY IF EXISTS "purchase_orders_delete_policy" ON purchase_orders;

-- ========================================
-- PASO 3: Crear nuevas políticas para purchase_orders
-- ========================================

-- SELECT: Ver órdenes de tu empresa
CREATE POLICY "purchase_orders_select_policy"
ON purchase_orders
FOR SELECT
USING (
  company_id = get_user_company_id()
);

-- INSERT: Crear órdenes para tu empresa
CREATE POLICY "purchase_orders_insert_policy"
ON purchase_orders
FOR INSERT
WITH CHECK (
  company_id = get_user_company_id()
);

-- UPDATE: Actualizar órdenes de tu empresa
CREATE POLICY "purchase_orders_update_policy"
ON purchase_orders
FOR UPDATE
USING (
  company_id = get_user_company_id()
)
WITH CHECK (
  company_id = get_user_company_id()
);

-- DELETE: Eliminar órdenes de tu empresa (solo admin/owner)
CREATE POLICY "purchase_orders_delete_policy"
ON purchase_orders
FOR DELETE
USING (
  company_id = get_user_company_id()
  AND EXISTS (
    SELECT 1 FROM company_users
    WHERE user_id = auth.uid()
    AND company_id = purchase_orders.company_id
    AND role IN ('admin', 'owner')
  )
);

-- ========================================
-- PASO 4: Eliminar políticas antiguas de purchase_order_items
-- ========================================

DROP POLICY IF EXISTS "Users can view purchase order items from their company" ON purchase_order_items;
DROP POLICY IF EXISTS "Users can insert purchase order items for their company" ON purchase_order_items;
DROP POLICY IF EXISTS "Users can update purchase order items from their company" ON purchase_order_items;
DROP POLICY IF EXISTS "Users can delete purchase order items from their company" ON purchase_order_items;

-- Políticas alternativas
DROP POLICY IF EXISTS "purchase_order_items_select_policy" ON purchase_order_items;
DROP POLICY IF EXISTS "purchase_order_items_insert_policy" ON purchase_order_items;
DROP POLICY IF EXISTS "purchase_order_items_update_policy" ON purchase_order_items;
DROP POLICY IF EXISTS "purchase_order_items_delete_policy" ON purchase_order_items;

-- ========================================
-- PASO 5: Crear nuevas políticas para purchase_order_items
-- ========================================

-- SELECT: Ver items de órdenes de tu empresa
CREATE POLICY "purchase_order_items_select_policy"
ON purchase_order_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM purchase_orders
    WHERE purchase_orders.id = purchase_order_items.purchase_order_id
    AND purchase_orders.company_id = get_user_company_id()
  )
);

-- INSERT: Crear items para órdenes de tu empresa
CREATE POLICY "purchase_order_items_insert_policy"
ON purchase_order_items
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM purchase_orders
    WHERE purchase_orders.id = purchase_order_items.purchase_order_id
    AND purchase_orders.company_id = get_user_company_id()
  )
);

-- UPDATE: Actualizar items de órdenes de tu empresa
CREATE POLICY "purchase_order_items_update_policy"
ON purchase_order_items
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM purchase_orders
    WHERE purchase_orders.id = purchase_order_items.purchase_order_id
    AND purchase_orders.company_id = get_user_company_id()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM purchase_orders
    WHERE purchase_orders.id = purchase_order_items.purchase_order_id
    AND purchase_orders.company_id = get_user_company_id()
  )
);

-- DELETE: Eliminar items de órdenes de tu empresa
CREATE POLICY "purchase_order_items_delete_policy"
ON purchase_order_items
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM purchase_orders
    WHERE purchase_orders.id = purchase_order_items.purchase_order_id
    AND purchase_orders.company_id = get_user_company_id()
  )
);

-- ========================================
-- PASO 6: Asegurar que RLS está habilitado
-- ========================================

ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;

-- ========================================
-- PASO 7: Verificar instalación
-- ========================================

-- Ver políticas creadas
SELECT 
  '✅ POLÍTICAS CREADAS' as resultado,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('purchase_orders', 'purchase_order_items')
ORDER BY tablename, cmd;

-- Ver función helper
SELECT 
  '✅ FUNCIÓN HELPER' as resultado,
  proname,
  CASE 
    WHEN prosecdef = true THEN 'SECURITY DEFINER ✅'
    ELSE 'Normal ❌'
  END as tipo
FROM pg_proc
WHERE proname = 'get_user_company_id'
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- Probar acceso
SELECT 
  '✅ PRUEBA DE ACCESO' as resultado,
  COUNT(*) as ordenes_visibles
FROM purchase_orders;

-- ========================================
-- NOTAS IMPORTANTES
-- ========================================

/*
DESPUÉS DE EJECUTAR ESTE SCRIPT:

1. Las políticas RLS ahora usan get_user_company_id() que es SECURITY DEFINER
2. Esto permite que las políticas funcionen incluso si RLS está habilitado en profiles
3. Las órdenes de compra deberían aparecer en el reporte de liquidación

PARA VERIFICAR:
1. Ejecuta DEBUG_PURCHASE_ORDERS_INVENTORY_REPORT_RLS.sql
2. Verifica que "DIAGNÓSTICO" muestre "✅ RLS funciona correctamente"
3. Genera el reporte de liquidación
4. Las compras deberían aparecer ahora

SI AÚN NO APARECEN:
1. Verifica que estás logueado con la empresa correcta
2. Verifica que las órdenes tienen status='received' y received_date no es NULL
3. Verifica que el rango de fechas incluye las fechas de las órdenes
4. Revisa los logs del servidor (terminal donde corre npm run dev)
*/
