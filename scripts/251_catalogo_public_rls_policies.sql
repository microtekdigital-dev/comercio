-- Políticas RLS para el catálogo público (acceso anónimo)
-- Reemplaza políticas con roles:{public} por TO anon explícito

-- catalog_settings
DROP POLICY IF EXISTS "catalog_settings_public_read" ON catalog_settings;
CREATE POLICY "catalog_settings_public_read" ON catalog_settings
  FOR SELECT TO anon USING (is_active = true);

-- companies
DROP POLICY IF EXISTS "companies_public_read" ON companies;
CREATE POLICY "companies_public_read" ON companies
  FOR SELECT TO anon USING (true);

-- subscriptions
DROP POLICY IF EXISTS "subscriptions_public_read" ON subscriptions;
CREATE POLICY "subscriptions_public_read" ON subscriptions
  FOR SELECT TO anon USING (status = 'active');

-- plans
DROP POLICY IF EXISTS "plans_public_read" ON plans;
CREATE POLICY "plans_public_read" ON plans
  FOR SELECT TO anon USING (true);

-- products
DROP POLICY IF EXISTS "products_public_read" ON products;
CREATE POLICY "products_public_read" ON products
  FOR SELECT TO anon USING (published = true AND is_active = true);

-- product_variants
DROP POLICY IF EXISTS "product_variants_public_read" ON product_variants;
CREATE POLICY "product_variants_public_read" ON product_variants
  FOR SELECT TO anon USING (is_active = true);

-- online_orders (solo conteo)
DROP POLICY IF EXISTS "online_orders_public_count" ON online_orders;
CREATE POLICY "online_orders_public_count" ON online_orders
  FOR SELECT TO anon USING (true);
