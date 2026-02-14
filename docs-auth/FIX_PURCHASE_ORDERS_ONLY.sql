-- ============================================================================
-- FIX: Actualizar solo políticas de purchase_orders (SIN tocar company_users)
-- ============================================================================
-- Este script NO habilita RLS en company_users para evitar errores
-- Solo actualiza las políticas de purchase_orders para usar la función helper
-- ============================================================================

-- ========================================
-- 1. CREAR FUNCIÓN HELPER (si no existe)
-- ========================================

CREATE OR REPLACE FUNCTION public.get_user_company_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT company_id 
    FROM public.profiles 
    WHERE id = auth.uid()
    LIMIT 1
  );
END;
$$;

-- ========================================
-- 2. ACTUALIZAR POLÍTICAS DE PURCHASE_ORDERS
-- ========================================

-- Eliminar políticas antiguas
DROP POLICY IF EXISTS "Users can view purchase orders from their company" ON purchase_orders;
DROP POLICY IF EXISTS "Users can insert purchase orders for their company" ON purchase_orders;
DROP POLICY IF EXISTS "Users can update purchase orders from their company" ON purchase_orders;
DROP POLICY IF EXISTS "Users can delete purchase orders from their company" ON purchase_orders;

-- Crear nuevas políticas usando la función helper
CREATE POLICY "Users can view purchase orders from their company"
  ON purchase_orders FOR SELECT
  USING (company_id = get_user_company_id());

CREATE POLICY "Users can insert purchase orders for their company"
  ON purchase_orders FOR INSERT
  WITH CHECK (company_id = get_user_company_id());

CREATE POLICY "Users can update purchase orders from their company"
  ON purchase_orders FOR UPDATE
  USING (company_id = get_user_company_id())
  WITH CHECK (company_id = get_user_company_id());

CREATE POLICY "Users can delete purchase orders from their company"
  ON purchase_orders FOR DELETE
  USING (company_id = get_user_company_id());

-- ========================================
-- 3. ACTUALIZAR POLÍTICAS DE PURCHASE_ORDER_ITEMS
-- ========================================

-- Eliminar políticas antiguas
DROP POLICY IF EXISTS "Users can view purchase order items from their company" ON purchase_order_items;
DROP POLICY IF EXISTS "Users can insert purchase order items for their company" ON purchase_order_items;
DROP POLICY IF EXISTS "Users can update purchase order items from their company" ON purchase_order_items;
DROP POLICY IF EXISTS "Users can delete purchase order items from their company" ON purchase_order_items;

-- Crear nuevas políticas usando la función helper
CREATE POLICY "Users can view purchase order items from their company"
  ON purchase_order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM purchase_orders
      WHERE purchase_orders.id = purchase_order_items.purchase_order_id
      AND purchase_orders.company_id = get_user_company_id()
    )
  );

CREATE POLICY "Users can insert purchase order items for their company"
  ON purchase_order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM purchase_orders
      WHERE purchase_orders.id = purchase_order_items.purchase_order_id
      AND purchase_orders.company_id = get_user_company_id()
    )
  );

CREATE POLICY "Users can update purchase order items from their company"
  ON purchase_order_items FOR UPDATE
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

CREATE POLICY "Users can delete purchase order items from their company"
  ON purchase_order_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM purchase_orders
      WHERE purchase_orders.id = purchase_order_items.purchase_order_id
      AND purchase_orders.company_id = get_user_company_id()
    )
  );

-- ========================================
-- 4. ACTUALIZAR POLÍTICAS DE SUPPLIERS
-- ========================================

-- Eliminar políticas antiguas
DROP POLICY IF EXISTS "Users can view suppliers from their company" ON suppliers;
DROP POLICY IF EXISTS "Users can insert suppliers for their company" ON suppliers;
DROP POLICY IF EXISTS "Users can update suppliers from their company" ON suppliers;
DROP POLICY IF EXISTS "Users can delete suppliers from their company" ON suppliers;

-- Crear nuevas políticas usando la función helper
CREATE POLICY "Users can view suppliers from their company"
  ON suppliers FOR SELECT
  USING (company_id = get_user_company_id());

CREATE POLICY "Users can insert suppliers for their company"
  ON suppliers FOR INSERT
  WITH CHECK (company_id = get_user_company_id());

CREATE POLICY "Users can update suppliers from their company"
  ON suppliers FOR UPDATE
  USING (company_id = get_user_company_id())
  WITH CHECK (company_id = get_user_company_id());

CREATE POLICY "Users can delete suppliers from their company"
  ON suppliers FOR DELETE
  USING (company_id = get_user_company_id());

-- ========================================
-- 5. VERIFICAR RESULTADO
-- ========================================

SELECT 
  '✅ VERIFICACIÓN' as resultado,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_proc 
      WHERE proname = 'get_user_company_id' 
      AND prosecdef = true
    ) THEN '✅ Función helper creada'
    ELSE '❌ Función helper falta'
  END as funcion_helper,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'purchase_orders' 
      AND qual::text LIKE '%get_user_company_id%'
    ) THEN '✅ Políticas purchase_orders actualizadas'
    ELSE '❌ Políticas purchase_orders NO actualizadas'
  END as politicas_purchase_orders,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'suppliers' 
      AND qual::text LIKE '%get_user_company_id%'
    ) THEN '✅ Políticas suppliers actualizadas'
    ELSE '❌ Políticas suppliers NO actualizadas'
  END as politicas_suppliers;

-- ============================================================================
-- RESULTADO ESPERADO
-- ============================================================================
-- 
-- ✅ Función helper creada
-- ✅ Políticas purchase_orders actualizadas
-- ✅ Políticas suppliers actualizadas
-- 
-- IMPORTANTE:
-- - Este script NO toca company_users para evitar errores
-- - Solo actualiza las políticas de purchase_orders y suppliers
-- - Después de ejecutar, el usuario debe cerrar sesión y volver a iniciar
-- 
-- SIGUIENTE PASO:
-- 1. Ejecutar este script
-- 2. Cerrar sesión con vanitoadette1985@gmail.com
-- 3. Cerrar el navegador
-- 4. Abrir el navegador e iniciar sesión nuevamente
-- 5. Intentar crear una orden de compra
-- ============================================================================
