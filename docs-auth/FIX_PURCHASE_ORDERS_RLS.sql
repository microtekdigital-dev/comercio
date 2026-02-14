-- ============================================================================
-- FIX: Políticas RLS para Purchase Orders
-- ============================================================================
-- PROBLEMA: Las políticas RLS actuales consultan la tabla profiles,
-- pero RLS está deshabilitado en profiles, causando que las políticas fallen
-- 
-- SOLUCIÓN: Recrear políticas usando auth.uid() directamente
-- ============================================================================

BEGIN;

-- ========================================
-- 1. ELIMINAR POLÍTICAS ANTIGUAS
-- ========================================

-- Purchase Orders
DROP POLICY IF EXISTS "Users can view their company purchase orders" ON purchase_orders;
DROP POLICY IF EXISTS "Users can insert purchase orders" ON purchase_orders;
DROP POLICY IF EXISTS "Users can update their company purchase orders" ON purchase_orders;
DROP POLICY IF EXISTS "Users can delete their company purchase orders" ON purchase_orders;

-- Purchase Order Items
DROP POLICY IF EXISTS "Users can view purchase order items" ON purchase_order_items;
DROP POLICY IF EXISTS "Users can insert purchase order items" ON purchase_order_items;
DROP POLICY IF EXISTS "Users can update purchase order items" ON purchase_order_items;
DROP POLICY IF EXISTS "Users can delete purchase order items" ON purchase_order_items;

-- Suppliers
DROP POLICY IF EXISTS "Users can view their company suppliers" ON suppliers;
DROP POLICY IF EXISTS "Users can insert suppliers" ON suppliers;
DROP POLICY IF EXISTS "Users can update their company suppliers" ON suppliers;
DROP POLICY IF EXISTS "Users can delete their company suppliers" ON suppliers;

-- Supplier Payments
DROP POLICY IF EXISTS "Users can view their company supplier payments" ON supplier_payments;
DROP POLICY IF EXISTS "Users can insert supplier payments" ON supplier_payments;
DROP POLICY IF EXISTS "Users can update their company supplier payments" ON supplier_payments;
DROP POLICY IF EXISTS "Users can delete their company supplier payments" ON supplier_payments;

-- ========================================
-- 2. CREAR FUNCIÓN HELPER
-- ========================================

-- Función para obtener company_id del usuario actual
-- Esta función NO usa RLS, accede directamente a profiles
CREATE OR REPLACE FUNCTION get_user_company_id()
RETURNS UUID AS $
DECLARE
  user_company_id UUID;
BEGIN
  SELECT company_id INTO user_company_id
  FROM public.profiles
  WHERE id = auth.uid()
  LIMIT 1;
  
  RETURN user_company_id;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 3. NUEVAS POLÍTICAS PARA SUPPLIERS
-- ========================================

CREATE POLICY "users_select_suppliers" ON suppliers
  FOR SELECT
  TO authenticated
  USING (company_id = get_user_company_id());

CREATE POLICY "users_insert_suppliers" ON suppliers
  FOR INSERT
  TO authenticated
  WITH CHECK (company_id = get_user_company_id());

CREATE POLICY "users_update_suppliers" ON suppliers
  FOR UPDATE
  TO authenticated
  USING (company_id = get_user_company_id())
  WITH CHECK (company_id = get_user_company_id());

CREATE POLICY "users_delete_suppliers" ON suppliers
  FOR DELETE
  TO authenticated
  USING (company_id = get_user_company_id());

-- ========================================
-- 4. NUEVAS POLÍTICAS PARA PURCHASE_ORDERS
-- ========================================

CREATE POLICY "users_select_purchase_orders" ON purchase_orders
  FOR SELECT
  TO authenticated
  USING (company_id = get_user_company_id());

CREATE POLICY "users_insert_purchase_orders" ON purchase_orders
  FOR INSERT
  TO authenticated
  WITH CHECK (company_id = get_user_company_id());

CREATE POLICY "users_update_purchase_orders" ON purchase_orders
  FOR UPDATE
  TO authenticated
  USING (company_id = get_user_company_id())
  WITH CHECK (company_id = get_user_company_id());

CREATE POLICY "users_delete_purchase_orders" ON purchase_orders
  FOR DELETE
  TO authenticated
  USING (company_id = get_user_company_id());

-- ========================================
-- 5. NUEVAS POLÍTICAS PARA PURCHASE_ORDER_ITEMS
-- ========================================

CREATE POLICY "users_select_purchase_order_items" ON purchase_order_items
  FOR SELECT
  TO authenticated
  USING (
    purchase_order_id IN (
      SELECT id FROM purchase_orders 
      WHERE company_id = get_user_company_id()
    )
  );

CREATE POLICY "users_insert_purchase_order_items" ON purchase_order_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    purchase_order_id IN (
      SELECT id FROM purchase_orders 
      WHERE company_id = get_user_company_id()
    )
  );

CREATE POLICY "users_update_purchase_order_items" ON purchase_order_items
  FOR UPDATE
  TO authenticated
  USING (
    purchase_order_id IN (
      SELECT id FROM purchase_orders 
      WHERE company_id = get_user_company_id()
    )
  )
  WITH CHECK (
    purchase_order_id IN (
      SELECT id FROM purchase_orders 
      WHERE company_id = get_user_company_id()
    )
  );

CREATE POLICY "users_delete_purchase_order_items" ON purchase_order_items
  FOR DELETE
  TO authenticated
  USING (
    purchase_order_id IN (
      SELECT id FROM purchase_orders 
      WHERE company_id = get_user_company_id()
    )
  );

-- ========================================
-- 6. NUEVAS POLÍTICAS PARA SUPPLIER_PAYMENTS
-- ========================================

CREATE POLICY "users_select_supplier_payments" ON supplier_payments
  FOR SELECT
  TO authenticated
  USING (company_id = get_user_company_id());

CREATE POLICY "users_insert_supplier_payments" ON supplier_payments
  FOR INSERT
  TO authenticated
  WITH CHECK (company_id = get_user_company_id());

CREATE POLICY "users_update_supplier_payments" ON supplier_payments
  FOR UPDATE
  TO authenticated
  USING (company_id = get_user_company_id())
  WITH CHECK (company_id = get_user_company_id());

CREATE POLICY "users_delete_supplier_payments" ON supplier_payments
  FOR DELETE
  TO authenticated
  USING (company_id = get_user_company_id());

-- ========================================
-- 7. VERIFICACIÓN
-- ========================================

SELECT 
  '📊 POLÍTICAS CREADAS' as seccion,
  schemaname,
  tablename,
  policyname,
  cmd as operacion
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('suppliers', 'purchase_orders', 'purchase_order_items', 'supplier_payments')
ORDER BY tablename, cmd;

-- Verificar RLS habilitado
SELECT 
  '🔒 ESTADO RLS' as seccion,
  tablename,
  CASE 
    WHEN rowsecurity = true THEN '✅ Habilitado'
    ELSE '❌ Deshabilitado'
  END as estado
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('suppliers', 'purchase_orders', 'purchase_order_items', 'supplier_payments')
ORDER BY tablename;

-- Mensaje final
SELECT 
  '✅ CORRECCIÓN APLICADA' as resultado,
  'Políticas RLS recreadas con función SECURITY DEFINER' as cambio,
  'Las políticas ahora funcionan sin depender de RLS en profiles' as detalle,
  'Intenta crear una orden de compra nuevamente' as siguiente_paso;

COMMIT;

-- ============================================================================
-- NOTAS IMPORTANTES
-- ============================================================================
-- 1. La función get_user_company_id() usa SECURITY DEFINER
--    Esto significa que ejecuta con permisos elevados y puede leer profiles
--    sin ser bloqueada por RLS
--
-- 2. Las políticas ahora usan esta función en lugar de subconsultas
--    Esto evita problemas cuando RLS está deshabilitado en profiles
--
-- 3. Esta es la solución correcta para trabajar con RLS deshabilitado
--    en tablas de sistema como profiles
-- ============================================================================
