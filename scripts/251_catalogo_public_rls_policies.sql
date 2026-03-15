-- =====================================================
-- Script 251: Políticas RLS para lectura pública del catálogo
-- Permite que el cliente anónimo lea los datos necesarios
-- para mostrar el catálogo sin requerir service role key.
-- =====================================================

-- Lectura pública de companies (solo slug y nombre, para el catálogo)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'companies' AND policyname = 'companies_public_catalog_read'
  ) THEN
    CREATE POLICY "companies_public_catalog_read" ON companies
      FOR SELECT
      USING (
        id IN (SELECT company_id FROM catalog_settings WHERE is_active = true)
      );
  END IF;
END $$;

-- Lectura pública de subscriptions (solo para verificar que está activa)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'subscriptions' AND policyname = 'subscriptions_public_catalog_read'
  ) THEN
    CREATE POLICY "subscriptions_public_catalog_read" ON subscriptions
      FOR SELECT
      USING (
        status = 'active'
        AND company_id IN (SELECT company_id FROM catalog_settings WHERE is_active = true)
      );
  END IF;
END $$;

-- Lectura pública de plans (para obtener el nombre del plan)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'plans' AND policyname = 'plans_public_read'
  ) THEN
    CREATE POLICY "plans_public_read" ON plans
      FOR SELECT
      USING (true);
  END IF;
END $$;

-- Lectura pública de products (solo publicados y activos, de empresas con catálogo activo)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'products' AND policyname = 'products_public_catalog_read'
  ) THEN
    CREATE POLICY "products_public_catalog_read" ON products
      FOR SELECT
      USING (
        published = true
        AND is_active = true
        AND company_id IN (SELECT company_id FROM catalog_settings WHERE is_active = true)
      );
  END IF;
END $$;

-- Lectura pública de product_variants (de productos publicados)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'product_variants' AND policyname = 'product_variants_public_catalog_read'
  ) THEN
    CREATE POLICY "product_variants_public_catalog_read" ON product_variants
      FOR SELECT
      USING (
        is_active = true
        AND product_id IN (
          SELECT id FROM products
          WHERE published = true AND is_active = true
          AND company_id IN (SELECT company_id FROM catalog_settings WHERE is_active = true)
        )
      );
  END IF;
END $$;

-- Lectura pública de online_orders (para contar pedidos del mes)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'online_orders' AND policyname = 'online_orders_public_count_read'
  ) THEN
    CREATE POLICY "online_orders_public_count_read" ON online_orders
      FOR SELECT
      USING (
        company_id IN (SELECT company_id FROM catalog_settings WHERE is_active = true)
      );
  END IF;
END $$;

-- Inserción pública de online_orders (para que los clientes puedan hacer pedidos)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'online_orders' AND policyname = 'online_orders_public_insert'
  ) THEN
    CREATE POLICY "online_orders_public_insert" ON online_orders
      FOR INSERT
      WITH CHECK (true);
  END IF;
END $$;

-- Inserción pública de online_order_items
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'online_order_items' AND policyname = 'online_order_items_public_insert'
  ) THEN
    CREATE POLICY "online_order_items_public_insert" ON online_order_items
      FOR INSERT
      WITH CHECK (true);
  END IF;
END $$;
