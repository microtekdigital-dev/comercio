-- =====================================================
-- HABILITAR RLS EN TABLAS ERP CRÍTICAS
-- =====================================================
-- Este script habilita Row Level Security en todas las
-- tablas ERP que actualmente no lo tienen
-- =====================================================

-- IMPORTANTE: Este script usa transacciones para poder
-- hacer rollback si algo falla

BEGIN;

-- =====================================================
-- PASO 1: VERIFICAR ESTADO ACTUAL
-- =====================================================

SELECT 
  '=== ESTADO ACTUAL DE RLS ===' as info,
  tablename,
  CASE WHEN rowsecurity THEN '✅ Habilitado' ELSE '❌ Deshabilitado' END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'customers', 'categories', 'products', 
    'sales', 'sale_items', 'sale_payments'
  )
ORDER BY tablename;

-- =====================================================
-- PASO 2: HABILITAR RLS EN TABLAS
-- =====================================================

-- Customers
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Sales
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

-- Sale Items
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;

-- Sale Payments
ALTER TABLE public.sale_payments ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PASO 3: CREAR POLÍTICAS RLS PARA CUSTOMERS
-- =====================================================

-- SELECT: Los usuarios pueden ver clientes de su empresa
CREATE POLICY "users_select_customers" ON public.customers
  FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id 
      FROM public.profiles 
      WHERE id = auth.uid()
      AND company_id IS NOT NULL
    )
  );

-- INSERT: Los usuarios pueden crear clientes en su empresa
CREATE POLICY "users_insert_customers" ON public.customers
  FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id 
      FROM public.profiles 
      WHERE id = auth.uid()
      AND company_id IS NOT NULL
    )
  );

-- UPDATE: Los usuarios pueden actualizar clientes de su empresa
CREATE POLICY "users_update_customers" ON public.customers
  FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id 
      FROM public.profiles 
      WHERE id = auth.uid()
      AND company_id IS NOT NULL
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT company_id 
      FROM public.profiles 
      WHERE id = auth.uid()
      AND company_id IS NOT NULL
    )
  );

-- DELETE: Los usuarios pueden eliminar clientes de su empresa
CREATE POLICY "users_delete_customers" ON public.customers
  FOR DELETE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id 
      FROM public.profiles 
      WHERE id = auth.uid()
      AND company_id IS NOT NULL
    )
  );

-- =====================================================
-- PASO 4: CREAR POLÍTICAS RLS PARA CATEGORIES
-- =====================================================

CREATE POLICY "users_select_categories" ON public.categories
  FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id 
      FROM public.profiles 
      WHERE id = auth.uid()
      AND company_id IS NOT NULL
    )
  );

CREATE POLICY "users_insert_categories" ON public.categories
  FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id 
      FROM public.profiles 
      WHERE id = auth.uid()
      AND company_id IS NOT NULL
    )
  );

CREATE POLICY "users_update_categories" ON public.categories
  FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id 
      FROM public.profiles 
      WHERE id = auth.uid()
      AND company_id IS NOT NULL
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT company_id 
      FROM public.profiles 
      WHERE id = auth.uid()
      AND company_id IS NOT NULL
    )
  );

CREATE POLICY "users_delete_categories" ON public.categories
  FOR DELETE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id 
      FROM public.profiles 
      WHERE id = auth.uid()
      AND company_id IS NOT NULL
    )
  );

-- =====================================================
-- PASO 5: CREAR POLÍTICAS RLS PARA PRODUCTS
-- =====================================================

CREATE POLICY "users_select_products" ON public.products
  FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id 
      FROM public.profiles 
      WHERE id = auth.uid()
      AND company_id IS NOT NULL
    )
  );

CREATE POLICY "users_insert_products" ON public.products
  FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id 
      FROM public.profiles 
      WHERE id = auth.uid()
      AND company_id IS NOT NULL
    )
  );

CREATE POLICY "users_update_products" ON public.products
  FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id 
      FROM public.profiles 
      WHERE id = auth.uid()
      AND company_id IS NOT NULL
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT company_id 
      FROM public.profiles 
      WHERE id = auth.uid()
      AND company_id IS NOT NULL
    )
  );

CREATE POLICY "users_delete_products" ON public.products
  FOR DELETE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id 
      FROM public.profiles 
      WHERE id = auth.uid()
      AND company_id IS NOT NULL
    )
  );

-- =====================================================
-- PASO 6: CREAR POLÍTICAS RLS PARA SALES
-- =====================================================

CREATE POLICY "users_select_sales" ON public.sales
  FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id 
      FROM public.profiles 
      WHERE id = auth.uid()
      AND company_id IS NOT NULL
    )
  );

CREATE POLICY "users_insert_sales" ON public.sales
  FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id 
      FROM public.profiles 
      WHERE id = auth.uid()
      AND company_id IS NOT NULL
    )
  );

CREATE POLICY "users_update_sales" ON public.sales
  FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id 
      FROM public.profiles 
      WHERE id = auth.uid()
      AND company_id IS NOT NULL
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT company_id 
      FROM public.profiles 
      WHERE id = auth.uid()
      AND company_id IS NOT NULL
    )
  );

CREATE POLICY "users_delete_sales" ON public.sales
  FOR DELETE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id 
      FROM public.profiles 
      WHERE id = auth.uid()
      AND company_id IS NOT NULL
    )
  );

-- =====================================================
-- PASO 7: CREAR POLÍTICAS RLS PARA SALE_ITEMS
-- =====================================================

-- Los sale_items se protegen a través de la relación con sales
CREATE POLICY "users_select_sale_items" ON public.sale_items
  FOR SELECT
  TO authenticated
  USING (
    sale_id IN (
      SELECT id 
      FROM public.sales 
      WHERE company_id IN (
        SELECT company_id 
        FROM public.profiles 
        WHERE id = auth.uid()
        AND company_id IS NOT NULL
      )
    )
  );

CREATE POLICY "users_insert_sale_items" ON public.sale_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    sale_id IN (
      SELECT id 
      FROM public.sales 
      WHERE company_id IN (
        SELECT company_id 
        FROM public.profiles 
        WHERE id = auth.uid()
        AND company_id IS NOT NULL
      )
    )
  );

CREATE POLICY "users_update_sale_items" ON public.sale_items
  FOR UPDATE
  TO authenticated
  USING (
    sale_id IN (
      SELECT id 
      FROM public.sales 
      WHERE company_id IN (
        SELECT company_id 
        FROM public.profiles 
        WHERE id = auth.uid()
        AND company_id IS NOT NULL
      )
    )
  )
  WITH CHECK (
    sale_id IN (
      SELECT id 
      FROM public.sales 
      WHERE company_id IN (
        SELECT company_id 
        FROM public.profiles 
        WHERE id = auth.uid()
        AND company_id IS NOT NULL
      )
    )
  );

CREATE POLICY "users_delete_sale_items" ON public.sale_items
  FOR DELETE
  TO authenticated
  USING (
    sale_id IN (
      SELECT id 
      FROM public.sales 
      WHERE company_id IN (
        SELECT company_id 
        FROM public.profiles 
        WHERE id = auth.uid()
        AND company_id IS NOT NULL
      )
    )
  );

-- =====================================================
-- PASO 8: CREAR POLÍTICAS RLS PARA SALE_PAYMENTS
-- =====================================================

CREATE POLICY "users_select_sale_payments" ON public.sale_payments
  FOR SELECT
  TO authenticated
  USING (
    sale_id IN (
      SELECT id 
      FROM public.sales 
      WHERE company_id IN (
        SELECT company_id 
        FROM public.profiles 
        WHERE id = auth.uid()
        AND company_id IS NOT NULL
      )
    )
  );

CREATE POLICY "users_insert_sale_payments" ON public.sale_payments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    sale_id IN (
      SELECT id 
      FROM public.sales 
      WHERE company_id IN (
        SELECT company_id 
        FROM public.profiles 
        WHERE id = auth.uid()
        AND company_id IS NOT NULL
      )
    )
  );

CREATE POLICY "users_update_sale_payments" ON public.sale_payments
  FOR UPDATE
  TO authenticated
  USING (
    sale_id IN (
      SELECT id 
      FROM public.sales 
      WHERE company_id IN (
        SELECT company_id 
        FROM public.profiles 
        WHERE id = auth.uid()
        AND company_id IS NOT NULL
      )
    )
  )
  WITH CHECK (
    sale_id IN (
      SELECT id 
      FROM public.sales 
      WHERE company_id IN (
        SELECT company_id 
        FROM public.profiles 
        WHERE id = auth.uid()
        AND company_id IS NOT NULL
      )
    )
  );

CREATE POLICY "users_delete_sale_payments" ON public.sale_payments
  FOR DELETE
  TO authenticated
  USING (
    sale_id IN (
      SELECT id 
      FROM public.sales 
      WHERE company_id IN (
        SELECT company_id 
        FROM public.profiles 
        WHERE id = auth.uid()
        AND company_id IS NOT NULL
      )
    )
  );

-- =====================================================
-- PASO 9: VERIFICAR RESULTADO
-- =====================================================

SELECT 
  '=== ESTADO FINAL DE RLS ===' as info,
  tablename,
  CASE WHEN rowsecurity THEN '✅ Habilitado' ELSE '❌ Deshabilitado' END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'customers', 'categories', 'products', 
    'sales', 'sale_items', 'sale_payments'
  )
ORDER BY tablename;

-- Ver políticas creadas
SELECT 
  '=== POLÍTICAS CREADAS ===' as info,
  tablename,
  COUNT(*) as num_policies
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'customers', 'categories', 'products', 
    'sales', 'sale_items', 'sale_payments'
  )
GROUP BY tablename
ORDER BY tablename;

-- Resumen final - Conteo de tablas con RLS
SELECT 
  '=== RESUMEN FINAL ===' as info,
  COUNT(*) as tables_with_rls
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'customers', 'categories', 'products', 
    'sales', 'sale_items', 'sale_payments'
  )
  AND rowsecurity = true;

-- Conteo total de políticas
SELECT 
  '=== TOTAL POLÍTICAS ===' as info,
  COUNT(*) as total_policies
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'customers', 'categories', 'products', 
    'sales', 'sale_items', 'sale_payments'
  );

-- =====================================================
-- COMMIT O ROLLBACK
-- =====================================================
-- Si todo se ve bien, ejecuta: COMMIT;
-- Si algo salió mal, ejecuta: ROLLBACK;

-- Por ahora, hacemos COMMIT automático
COMMIT;

-- =====================================================
-- NOTAS IMPORTANTES
-- =====================================================
-- 1. Este script habilita RLS en 6 tablas críticas
-- 2. Crea 4 políticas por tabla (SELECT, INSERT, UPDATE, DELETE)
-- 3. Total: 24 políticas de seguridad
-- 4. Las políticas permiten acceso solo a datos de la empresa del usuario
-- 5. Si algo falla, la transacción hace rollback automático
-- 6. Después de ejecutar, prueba que tu aplicación siga funcionando

-- =====================================================
-- PRUEBAS RECOMENDADAS
-- =====================================================
-- Después de ejecutar este script:
-- 1. Inicia sesión en tu aplicación
-- 2. Verifica que puedes ver tus clientes
-- 3. Verifica que puedes ver tus productos
-- 4. Verifica que puedes ver tus ventas
-- 5. Intenta crear un nuevo cliente/producto/venta
-- 6. Si algo no funciona, revisa los logs de Supabase

