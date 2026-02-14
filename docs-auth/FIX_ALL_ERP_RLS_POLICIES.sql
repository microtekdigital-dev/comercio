-- ============================================================================
-- FIX COMPLETO: Todas las políticas RLS de tablas ERP
-- ============================================================================
-- PROBLEMA: Todas las políticas RLS que consultan la tabla profiles fallan
-- porque RLS está deshabilitado en profiles
-- 
-- SOLUCIÓN: Usar función SECURITY DEFINER para todas las políticas
-- ============================================================================

BEGIN;

-- ========================================
-- 1. CREAR/RECREAR FUNCIÓN HELPER
-- ========================================

-- Eliminar si existe
DROP FUNCTION IF EXISTS get_user_company_id();

-- Crear función que puede leer profiles sin RLS
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
-- 2. ELIMINAR TODAS LAS POLÍTICAS ANTIGUAS
-- ========================================

-- Companies
DROP POLICY IF EXISTS "Users can view their company" ON companies;
DROP POLICY IF EXISTS "Users can update their company" ON companies;
DROP POLICY IF EXISTS "users_select_companies" ON companies;
DROP POLICY IF EXISTS "users_update_companies" ON companies;

-- Categories
DROP POLICY IF EXISTS "users_select_categories" ON categories;
DROP POLICY IF EXISTS "users_insert_categories" ON categories;
DROP POLICY IF EXISTS "users_update_categories" ON categories;
DROP POLICY IF EXISTS "users_delete_categories" ON categories;

-- Products
DROP POLICY IF EXISTS "users_select_products" ON products;
DROP POLICY IF EXISTS "users_insert_products" ON products;
DROP POLICY IF EXISTS "users_update_products" ON products;
DROP POLICY IF EXISTS "users_delete_products" ON products;

-- Product Variants
DROP POLICY IF EXISTS "users_select_product_variants" ON product_variants;
DROP POLICY IF EXISTS "users_insert_product_variants" ON product_variants;
DROP POLICY IF EXISTS "users_update_product_variants" ON product_variants;
DROP POLICY IF EXISTS "users_delete_product_variants" ON product_variants;

-- Customers
DROP POLICY IF EXISTS "users_select_customers" ON customers;
DROP POLICY IF EXISTS "users_insert_customers" ON customers;
DROP POLICY IF EXISTS "users_update_customers" ON customers;
DROP POLICY IF EXISTS "users_delete_customers" ON customers;

-- Sales
DROP POLICY IF EXISTS "users_select_sales" ON sales;
DROP POLICY IF EXISTS "users_insert_sales" ON sales;
DROP POLICY IF EXISTS "users_update_sales" ON sales;
DROP POLICY IF EXISTS "users_delete_sales" ON sales;

-- Sale Items
DROP POLICY IF EXISTS "users_select_sale_items" ON sale_items;
DROP POLICY IF EXISTS "users_insert_sale_items" ON sale_items;
DROP POLICY IF EXISTS "users_update_sale_items" ON sale_items;
DROP POLICY IF EXISTS "users_delete_sale_items" ON sale_items;

-- Suppliers
DROP POLICY IF EXISTS "Users can view their company suppliers" ON suppliers;
DROP POLICY IF EXISTS "Users can insert suppliers" ON suppliers;
DROP POLICY IF EXISTS "Users can update their company suppliers" ON suppliers;
DROP POLICY IF EXISTS "Users can delete their company suppliers" ON suppliers;
DROP POLICY IF EXISTS "users_select_suppliers" ON suppliers;
DROP POLICY IF EXISTS "users_insert_suppliers" ON suppliers;
DROP POLICY IF EXISTS "users_update_suppliers" ON suppliers;
DROP POLICY IF EXISTS "users_delete_suppliers" ON suppliers;

-- Purchase Orders
DROP POLICY IF EXISTS "Users can view their company purchase orders" ON purchase_orders;
DROP POLICY IF EXISTS "Users can insert purchase orders" ON purchase_orders;
DROP POLICY IF EXISTS "Users can update their company purchase orders" ON purchase_orders;
DROP POLICY IF EXISTS "Users can delete their company purchase orders" ON purchase_orders;
DROP POLICY IF EXISTS "users_select_purchase_orders" ON purchase_orders;
DROP POLICY IF EXISTS "users_insert_purchase_orders" ON purchase_orders;
DROP POLICY IF EXISTS "users_update_purchase_orders" ON purchase_orders;
DROP POLICY IF EXISTS "users_delete_purchase_orders" ON purchase_orders;

-- Purchase Order Items
DROP POLICY IF EXISTS "Users can view purchase order items" ON purchase_order_items;
DROP POLICY IF EXISTS "Users can insert purchase order items" ON purchase_order_items;
DROP POLICY IF EXISTS "Users can update purchase order items" ON purchase_order_items;
DROP POLICY IF EXISTS "Users can delete purchase order items" ON purchase_order_items;
DROP POLICY IF EXISTS "users_select_purchase_order_items" ON purchase_order_items;
DROP POLICY IF EXISTS "users_insert_purchase_order_items" ON purchase_order_items;
DROP POLICY IF EXISTS "users_update_purchase_order_items" ON purchase_order_items;
DROP POLICY IF EXISTS "users_delete_purchase_order_items" ON purchase_order_items;

-- Supplier Payments
DROP POLICY IF EXISTS "Users can view their company supplier payments" ON supplier_payments;
DROP POLICY IF EXISTS "Users can insert supplier payments" ON supplier_payments;
DROP POLICY IF EXISTS "Users can update their company supplier payments" ON supplier_payments;
DROP POLICY IF EXISTS "Users can delete their company supplier payments" ON supplier_payments;
DROP POLICY IF EXISTS "users_select_supplier_payments" ON supplier_payments;
DROP POLICY IF EXISTS "users_insert_supplier_payments" ON supplier_payments;
DROP POLICY IF EXISTS "users_update_supplier_payments" ON supplier_payments;
DROP POLICY IF EXISTS "users_delete_supplier_payments" ON supplier_payments;

-- Stock Movements
DROP POLICY IF EXISTS "users_select_stock_movements" ON stock_movements;
DROP POLICY IF EXISTS "users_insert_stock_movements" ON stock_movements;

-- Price Changes
DROP POLICY IF EXISTS "users_select_price_changes" ON price_changes;
DROP POLICY IF EXISTS "users_insert_price_changes" ON price_changes;

-- Quotes
DROP POLICY IF EXISTS "users_select_quotes" ON quotes;
DROP POLICY IF EXISTS "users_insert_quotes" ON quotes;
DROP POLICY IF EXISTS "users_update_quotes" ON quotes;
DROP POLICY IF EXISTS "users_delete_quotes" ON quotes;

-- Quote Items
DROP POLICY IF EXISTS "users_select_quote_items" ON quote_items;
DROP POLICY IF EXISTS "users_insert_quote_items" ON quote_items;
DROP POLICY IF EXISTS "users_update_quote_items" ON quote_items;
DROP POLICY IF EXISTS "users_delete_quote_items" ON quote_items;

-- Notifications
DROP POLICY IF EXISTS "users_select_notifications" ON notifications;
DROP POLICY IF EXISTS "users_insert_notifications" ON notifications;
DROP POLICY IF EXISTS "users_update_notifications" ON notifications;
DROP POLICY IF EXISTS "users_delete_notifications" ON notifications;

-- ========================================
-- 3. CREAR NUEVAS POLÍTICAS - COMPANIES
-- ========================================

CREATE POLICY "users_select_companies" ON companies
  FOR SELECT TO authenticated
  USING (id = get_user_company_id());

CREATE POLICY "users_update_companies" ON companies
  FOR UPDATE TO authenticated
  USING (id = get_user_company_id())
  WITH CHECK (id = get_user_company_id());

-- ========================================
-- 4. CREAR NUEVAS POLÍTICAS - CATEGORIES
-- ========================================

CREATE POLICY "users_select_categories" ON categories
  FOR SELECT TO authenticated
  USING (company_id = get_user_company_id());

CREATE POLICY "users_insert_categories" ON categories
  FOR INSERT TO authenticated
  WITH CHECK (company_id = get_user_company_id());

CREATE POLICY "users_update_categories" ON categories
  FOR UPDATE TO authenticated
  USING (company_id = get_user_company_id())
  WITH CHECK (company_id = get_user_company_id());

CREATE POLICY "users_delete_categories" ON categories
  FOR DELETE TO authenticated
  USING (company_id = get_user_company_id());

-- ========================================
-- 5. CREAR NUEVAS POLÍTICAS - PRODUCTS
-- ========================================

CREATE POLICY "users_select_products" ON products
  FOR SELECT TO authenticated
  USING (company_id = get_user_company_id());

CREATE POLICY "users_insert_products" ON products
  FOR INSERT TO authenticated
  WITH CHECK (company_id = get_user_company_id());

CREATE POLICY "users_update_products" ON products
  FOR UPDATE TO authenticated
  USING (company_id = get_user_company_id())
  WITH CHECK (company_id = get_user_company_id());

CREATE POLICY "users_delete_products" ON products
  FOR DELETE TO authenticated
  USING (company_id = get_user_company_id());

-- ========================================
-- 6. CREAR NUEVAS POLÍTICAS - PRODUCT_VARIANTS
-- ========================================

CREATE POLICY "users_select_product_variants" ON product_variants
  FOR SELECT TO authenticated
  USING (
    product_id IN (
      SELECT id FROM products WHERE company_id = get_user_company_id()
    )
  );

CREATE POLICY "users_insert_product_variants" ON product_variants
  FOR INSERT TO authenticated
  WITH CHECK (
    product_id IN (
      SELECT id FROM products WHERE company_id = get_user_company_id()
    )
  );

CREATE POLICY "users_update_product_variants" ON product_variants
  FOR UPDATE TO authenticated
  USING (
    product_id IN (
      SELECT id FROM products WHERE company_id = get_user_company_id()
    )
  )
  WITH CHECK (
    product_id IN (
      SELECT id FROM products WHERE company_id = get_user_company_id()
    )
  );

CREATE POLICY "users_delete_product_variants" ON product_variants
  FOR DELETE TO authenticated
  USING (
    product_id IN (
      SELECT id FROM products WHERE company_id = get_user_company_id()
    )
  );

-- ========================================
-- 7. CREAR NUEVAS POLÍTICAS - CUSTOMERS
-- ========================================

CREATE POLICY "users_select_customers" ON customers
  FOR SELECT TO authenticated
  USING (company_id = get_user_company_id());

CREATE POLICY "users_insert_customers" ON customers
  FOR INSERT TO authenticated
  WITH CHECK (company_id = get_user_company_id());

CREATE POLICY "users_update_customers" ON customers
  FOR UPDATE TO authenticated
  USING (company_id = get_user_company_id())
  WITH CHECK (company_id = get_user_company_id());

CREATE POLICY "users_delete_customers" ON customers
  FOR DELETE TO authenticated
  USING (company_id = get_user_company_id());

-- ========================================
-- 8. CREAR NUEVAS POLÍTICAS - SALES
-- ========================================

CREATE POLICY "users_select_sales" ON sales
  FOR SELECT TO authenticated
  USING (company_id = get_user_company_id());

CREATE POLICY "users_insert_sales" ON sales
  FOR INSERT TO authenticated
  WITH CHECK (company_id = get_user_company_id());

CREATE POLICY "users_update_sales" ON sales
  FOR UPDATE TO authenticated
  USING (company_id = get_user_company_id())
  WITH CHECK (company_id = get_user_company_id());

CREATE POLICY "users_delete_sales" ON sales
  FOR DELETE TO authenticated
  USING (company_id = get_user_company_id());

-- ========================================
-- 9. CREAR NUEVAS POLÍTICAS - SALE_ITEMS
-- ========================================

CREATE POLICY "users_select_sale_items" ON sale_items
  FOR SELECT TO authenticated
  USING (
    sale_id IN (
      SELECT id FROM sales WHERE company_id = get_user_company_id()
    )
  );

CREATE POLICY "users_insert_sale_items" ON sale_items
  FOR INSERT TO authenticated
  WITH CHECK (
    sale_id IN (
      SELECT id FROM sales WHERE company_id = get_user_company_id()
    )
  );

CREATE POLICY "users_update_sale_items" ON sale_items
  FOR UPDATE TO authenticated
  USING (
    sale_id IN (
      SELECT id FROM sales WHERE company_id = get_user_company_id()
    )
  )
  WITH CHECK (
    sale_id IN (
      SELECT id FROM sales WHERE company_id = get_user_company_id()
    )
  );

CREATE POLICY "users_delete_sale_items" ON sale_items
  FOR DELETE TO authenticated
  USING (
    sale_id IN (
      SELECT id FROM sales WHERE company_id = get_user_company_id()
    )
  );

-- ========================================
-- 10. CREAR NUEVAS POLÍTICAS - SUPPLIERS
-- ========================================

CREATE POLICY "users_select_suppliers" ON suppliers
  FOR SELECT TO authenticated
  USING (company_id = get_user_company_id());

CREATE POLICY "users_insert_suppliers" ON suppliers
  FOR INSERT TO authenticated
  WITH CHECK (company_id = get_user_company_id());

CREATE POLICY "users_update_suppliers" ON suppliers
  FOR UPDATE TO authenticated
  USING (company_id = get_user_company_id())
  WITH CHECK (company_id = get_user_company_id());

CREATE POLICY "users_delete_suppliers" ON suppliers
  FOR DELETE TO authenticated
  USING (company_id = get_user_company_id());

-- ========================================
-- 11. CREAR NUEVAS POLÍTICAS - PURCHASE_ORDERS
-- ========================================

CREATE POLICY "users_select_purchase_orders" ON purchase_orders
  FOR SELECT TO authenticated
  USING (company_id = get_user_company_id());

CREATE POLICY "users_insert_purchase_orders" ON purchase_orders
  FOR INSERT TO authenticated
  WITH CHECK (company_id = get_user_company_id());

CREATE POLICY "users_update_purchase_orders" ON purchase_orders
  FOR UPDATE TO authenticated
  USING (company_id = get_user_company_id())
  WITH CHECK (company_id = get_user_company_id());

CREATE POLICY "users_delete_purchase_orders" ON purchase_orders
  FOR DELETE TO authenticated
  USING (company_id = get_user_company_id());

-- ========================================
-- 12. CREAR NUEVAS POLÍTICAS - PURCHASE_ORDER_ITEMS
-- ========================================

CREATE POLICY "users_select_purchase_order_items" ON purchase_order_items
  FOR SELECT TO authenticated
  USING (
    purchase_order_id IN (
      SELECT id FROM purchase_orders WHERE company_id = get_user_company_id()
    )
  );

CREATE POLICY "users_insert_purchase_order_items" ON purchase_order_items
  FOR INSERT TO authenticated
  WITH CHECK (
    purchase_order_id IN (
      SELECT id FROM purchase_orders WHERE company_id = get_user_company_id()
    )
  );

CREATE POLICY "users_update_purchase_order_items" ON purchase_order_items
  FOR UPDATE TO authenticated
  USING (
    purchase_order_id IN (
      SELECT id FROM purchase_orders WHERE company_id = get_user_company_id()
    )
  )
  WITH CHECK (
    purchase_order_id IN (
      SELECT id FROM purchase_orders WHERE company_id = get_user_company_id()
    )
  );

CREATE POLICY "users_delete_purchase_order_items" ON purchase_order_items
  FOR DELETE TO authenticated
  USING (
    purchase_order_id IN (
      SELECT id FROM purchase_orders WHERE company_id = get_user_company_id()
    )
  );

-- ========================================
-- 13. CREAR NUEVAS POLÍTICAS - SUPPLIER_PAYMENTS
-- ========================================

CREATE POLICY "users_select_supplier_payments" ON supplier_payments
  FOR SELECT TO authenticated
  USING (company_id = get_user_company_id());

CREATE POLICY "users_insert_supplier_payments" ON supplier_payments
  FOR INSERT TO authenticated
  WITH CHECK (company_id = get_user_company_id());

CREATE POLICY "users_update_supplier_payments" ON supplier_payments
  FOR UPDATE TO authenticated
  USING (company_id = get_user_company_id())
  WITH CHECK (company_id = get_user_company_id());

CREATE POLICY "users_delete_supplier_payments" ON supplier_payments
  FOR DELETE TO authenticated
  USING (company_id = get_user_company_id());

-- ========================================
-- 14. CREAR NUEVAS POLÍTICAS - STOCK_MOVEMENTS
-- ========================================

CREATE POLICY "users_select_stock_movements" ON stock_movements
  FOR SELECT TO authenticated
  USING (company_id = get_user_company_id());

CREATE POLICY "users_insert_stock_movements" ON stock_movements
  FOR INSERT TO authenticated
  WITH CHECK (company_id = get_user_company_id());

-- ========================================
-- 15. CREAR NUEVAS POLÍTICAS - PRICE_CHANGES
-- ========================================

CREATE POLICY "users_select_price_changes" ON price_changes
  FOR SELECT TO authenticated
  USING (company_id = get_user_company_id());

CREATE POLICY "users_insert_price_changes" ON price_changes
  FOR INSERT TO authenticated
  WITH CHECK (company_id = get_user_company_id());

-- ========================================
-- 16. CREAR NUEVAS POLÍTICAS - QUOTES
-- ========================================

CREATE POLICY "users_select_quotes" ON quotes
  FOR SELECT TO authenticated
  USING (company_id = get_user_company_id());

CREATE POLICY "users_insert_quotes" ON quotes
  FOR INSERT TO authenticated
  WITH CHECK (company_id = get_user_company_id());

CREATE POLICY "users_update_quotes" ON quotes
  FOR UPDATE TO authenticated
  USING (company_id = get_user_company_id())
  WITH CHECK (company_id = get_user_company_id());

CREATE POLICY "users_delete_quotes" ON quotes
  FOR DELETE TO authenticated
  USING (company_id = get_user_company_id());

-- ========================================
-- 17. CREAR NUEVAS POLÍTICAS - QUOTE_ITEMS
-- ========================================

CREATE POLICY "users_select_quote_items" ON quote_items
  FOR SELECT TO authenticated
  USING (
    quote_id IN (
      SELECT id FROM quotes WHERE company_id = get_user_company_id()
    )
  );

CREATE POLICY "users_insert_quote_items" ON quote_items
  FOR INSERT TO authenticated
  WITH CHECK (
    quote_id IN (
      SELECT id FROM quotes WHERE company_id = get_user_company_id()
    )
  );

CREATE POLICY "users_update_quote_items" ON quote_items
  FOR UPDATE TO authenticated
  USING (
    quote_id IN (
      SELECT id FROM quotes WHERE company_id = get_user_company_id()
    )
  )
  WITH CHECK (
    quote_id IN (
      SELECT id FROM quotes WHERE company_id = get_user_company_id()
    )
  );

CREATE POLICY "users_delete_quote_items" ON quote_items
  FOR DELETE TO authenticated
  USING (
    quote_id IN (
      SELECT id FROM quotes WHERE company_id = get_user_company_id()
    )
  );

-- ========================================
-- 18. CREAR NUEVAS POLÍTICAS - NOTIFICATIONS
-- ========================================

CREATE POLICY "users_select_notifications" ON notifications
  FOR SELECT TO authenticated
  USING (company_id = get_user_company_id() OR user_id = auth.uid());

CREATE POLICY "users_insert_notifications" ON notifications
  FOR INSERT TO authenticated
  WITH CHECK (company_id = get_user_company_id());

CREATE POLICY "users_update_notifications" ON notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_delete_notifications" ON notifications
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ========================================
-- 19. VERIFICACIÓN FINAL
-- ========================================

SELECT 
  '✅ POLÍTICAS RECREADAS' as resultado,
  COUNT(*) as total_politicas
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'companies', 'categories', 'products', 'product_variants',
    'customers', 'sales', 'sale_items',
    'suppliers', 'purchase_orders', 'purchase_order_items', 'supplier_payments',
    'stock_movements', 'price_changes',
    'quotes', 'quote_items', 'notifications'
  );

-- Resumen por tabla
SELECT 
  '📊 RESUMEN POR TABLA' as seccion,
  tablename,
  COUNT(*) as num_politicas
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'companies', 'categories', 'products', 'product_variants',
    'customers', 'sales', 'sale_items',
    'suppliers', 'purchase_orders', 'purchase_order_items', 'supplier_payments',
    'stock_movements', 'price_changes',
    'quotes', 'quote_items', 'notifications'
  )
GROUP BY tablename
ORDER BY tablename;

COMMIT;

-- ============================================================================
-- RESULTADO ESPERADO
-- ============================================================================
-- ✅ Todas las tablas ERP ahora usan get_user_company_id()
-- ✅ Las políticas funcionan sin depender de RLS en profiles
-- ✅ Órdenes de compra, ventas, productos, etc. funcionan correctamente
-- ✅ La seguridad se mantiene intacta
-- ============================================================================
