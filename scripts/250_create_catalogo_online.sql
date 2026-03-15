-- =====================================================
-- Script 250: Catálogo Online / Link de Ventas
-- =====================================================

-- 1. Campo published en products
ALTER TABLE products ADD COLUMN IF NOT EXISTS published boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_products_published
  ON products(company_id, published)
  WHERE published = true;

-- 2. Tabla catalog_settings
CREATE TABLE IF NOT EXISTS catalog_settings (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  is_active     boolean NOT NULL DEFAULT false,
  primary_color varchar(7) NOT NULL DEFAULT '#3B82F6',
  logo_url      text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id)
);

-- 3. Tabla online_orders
CREATE TABLE IF NOT EXISTS online_orders (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  order_number    text NOT NULL,
  status          text NOT NULL DEFAULT 'pendiente'
                  CHECK (status IN ('pendiente', 'confirmado', 'rechazado')),
  visitor_name    text NOT NULL,
  visitor_phone   text NOT NULL,
  visitor_address text,
  visitor_notes   text,
  items           jsonb NOT NULL DEFAULT '[]',
  subtotal        numeric(12,2) NOT NULL DEFAULT 0,
  total           numeric(12,2) NOT NULL DEFAULT 0,
  currency        text NOT NULL DEFAULT 'ARS',
  confirmed_at    timestamptz,
  rejected_at     timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_online_orders_company_id ON online_orders(company_id);
CREATE INDEX IF NOT EXISTS idx_online_orders_status ON online_orders(status);
CREATE INDEX IF NOT EXISTS idx_online_orders_created_at ON online_orders(created_at DESC);

-- Número de pedido único por empresa
CREATE UNIQUE INDEX IF NOT EXISTS idx_online_orders_order_number
  ON online_orders(company_id, order_number);

-- 4. Trigger updated_at para catalog_settings
CREATE OR REPLACE FUNCTION update_catalog_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_catalog_settings_updated_at ON catalog_settings;
CREATE TRIGGER trg_catalog_settings_updated_at
  BEFORE UPDATE ON catalog_settings
  FOR EACH ROW EXECUTE FUNCTION update_catalog_settings_updated_at();

-- Trigger updated_at para online_orders
CREATE OR REPLACE FUNCTION update_online_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_online_orders_updated_at ON online_orders;
CREATE TRIGGER trg_online_orders_updated_at
  BEFORE UPDATE ON online_orders
  FOR EACH ROW EXECUTE FUNCTION update_online_orders_updated_at();

-- 5. RLS para catalog_settings
ALTER TABLE catalog_settings ENABLE ROW LEVEL SECURITY;

-- Dueño: acceso completo
CREATE POLICY "catalog_settings_company_access" ON catalog_settings
  FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Lectura pública (anon) solo si activo
CREATE POLICY "catalog_settings_public_read" ON catalog_settings
  FOR SELECT
  USING (is_active = true);

-- 6. RLS para online_orders
ALTER TABLE online_orders ENABLE ROW LEVEL SECURITY;

-- Dueño: acceso completo a sus pedidos
CREATE POLICY "online_orders_company_access" ON online_orders
  FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Inserción pública (visitantes anónimos pueden crear pedidos)
CREATE POLICY "online_orders_public_insert" ON online_orders
  FOR INSERT
  WITH CHECK (true);

-- 7. RLS para products: lectura pública de publicados
-- (Política adicional; las políticas existentes del dueño se mantienen)
CREATE POLICY "products_public_read" ON products
  FOR SELECT
  USING (published = true AND is_active = true);
