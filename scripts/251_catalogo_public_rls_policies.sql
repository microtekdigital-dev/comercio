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
