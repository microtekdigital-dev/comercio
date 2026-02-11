-- =====================================================
-- SISTEMA DE PRESUPUESTOS (QUOTES)
-- =====================================================

-- Tabla de Presupuestos
CREATE TABLE IF NOT EXISTS quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  quote_number VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired')),
  quote_date TIMESTAMPTZ DEFAULT now(),
  valid_until TIMESTAMPTZ NOT NULL,
  subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(12, 2) DEFAULT 0,
  discount_amount DECIMAL(12, 2) DEFAULT 0,
  total DECIMAL(12, 2) NOT NULL DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'ARS',
  notes TEXT,
  terms TEXT,
  sent_at TIMESTAMPTZ,
  sent_to_email VARCHAR(255),
  accepted_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  converted_to_sale_id UUID REFERENCES sales(id) ON DELETE SET NULL,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, quote_number)
);

-- Tabla de Items de Presupuesto
CREATE TABLE IF NOT EXISTS quote_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name VARCHAR(255) NOT NULL,
  product_sku VARCHAR(100),
  quantity DECIMAL(10, 2) NOT NULL DEFAULT 1,
  unit_price DECIMAL(12, 2) NOT NULL,
  tax_rate DECIMAL(5, 2) DEFAULT 0,
  discount_percent DECIMAL(5, 2) DEFAULT 0,
  subtotal DECIMAL(12, 2) NOT NULL,
  tax_amount DECIMAL(12, 2) DEFAULT 0,
  total DECIMAL(12, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX idx_quotes_company_id ON quotes(company_id);
CREATE INDEX idx_quotes_customer_id ON quotes(customer_id);
CREATE INDEX idx_quotes_quote_number ON quotes(quote_number);
CREATE INDEX idx_quotes_status ON quotes(status);
CREATE INDEX idx_quotes_quote_date ON quotes(quote_date DESC);
CREATE INDEX idx_quotes_valid_until ON quotes(valid_until);
CREATE INDEX idx_quotes_created_at ON quotes(created_at DESC);

CREATE INDEX idx_quote_items_quote_id ON quote_items(quote_id);
CREATE INDEX idx_quote_items_product_id ON quote_items(product_id);

-- Trigger para updated_at
CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON quotes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para generar número de presupuesto automático
CREATE OR REPLACE FUNCTION generate_quote_number()
RETURNS TRIGGER AS $$
DECLARE
  next_number INTEGER;
  year_prefix VARCHAR(4);
BEGIN
  IF NEW.quote_number IS NULL OR NEW.quote_number = '' THEN
    year_prefix := TO_CHAR(CURRENT_DATE, 'YYYY');
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(quote_number FROM '\d+$') AS INTEGER)), 0) + 1
    INTO next_number
    FROM quotes
    WHERE company_id = NEW.company_id
      AND quote_number LIKE 'PRES-' || year_prefix || '-%';
    
    NEW.quote_number := 'PRES-' || year_prefix || '-' || LPAD(next_number::TEXT, 6, '0');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para generar número de presupuesto
CREATE TRIGGER generate_quote_number_trigger
  BEFORE INSERT ON quotes
  FOR EACH ROW
  EXECUTE FUNCTION generate_quote_number();

-- Habilitar RLS
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_items ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para quotes
CREATE POLICY "users_select_quotes" ON quotes
  FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id 
      FROM profiles 
      WHERE id = auth.uid()
      AND company_id IS NOT NULL
    )
  );

CREATE POLICY "users_insert_quotes" ON quotes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id 
      FROM profiles 
      WHERE id = auth.uid()
      AND company_id IS NOT NULL
    )
  );

CREATE POLICY "users_update_quotes" ON quotes
  FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id 
      FROM profiles 
      WHERE id = auth.uid()
      AND company_id IS NOT NULL
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT company_id 
      FROM profiles 
      WHERE id = auth.uid()
      AND company_id IS NOT NULL
    )
  );

CREATE POLICY "users_delete_quotes" ON quotes
  FOR DELETE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id 
      FROM profiles 
      WHERE id = auth.uid()
      AND company_id IS NOT NULL
    )
  );

-- Políticas RLS para quote_items
CREATE POLICY "users_select_quote_items" ON quote_items
  FOR SELECT
  TO authenticated
  USING (
    quote_id IN (
      SELECT id 
      FROM quotes 
      WHERE company_id IN (
        SELECT company_id 
        FROM profiles 
        WHERE id = auth.uid()
        AND company_id IS NOT NULL
      )
    )
  );

CREATE POLICY "users_insert_quote_items" ON quote_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    quote_id IN (
      SELECT id 
      FROM quotes 
      WHERE company_id IN (
        SELECT company_id 
        FROM profiles 
        WHERE id = auth.uid()
        AND company_id IS NOT NULL
      )
    )
  );

CREATE POLICY "users_update_quote_items" ON quote_items
  FOR UPDATE
  TO authenticated
  USING (
    quote_id IN (
      SELECT id 
      FROM quotes 
      WHERE company_id IN (
        SELECT company_id 
        FROM profiles 
        WHERE id = auth.uid()
        AND company_id IS NOT NULL
      )
    )
  )
  WITH CHECK (
    quote_id IN (
      SELECT id 
      FROM quotes 
      WHERE company_id IN (
        SELECT company_id 
        FROM profiles 
        WHERE id = auth.uid()
        AND company_id IS NOT NULL
      )
    )
  );

CREATE POLICY "users_delete_quote_items" ON quote_items
  FOR DELETE
  TO authenticated
  USING (
    quote_id IN (
      SELECT id 
      FROM quotes 
      WHERE company_id IN (
        SELECT company_id 
        FROM profiles 
        WHERE id = auth.uid()
        AND company_id IS NOT NULL
      )
    )
  );

-- Comentarios
COMMENT ON TABLE quotes IS 'Presupuestos/cotizaciones para clientes';
COMMENT ON TABLE quote_items IS 'Items/líneas de cada presupuesto';

COMMENT ON COLUMN quotes.status IS 'Estado: draft, sent, accepted, rejected, expired';
COMMENT ON COLUMN quotes.valid_until IS 'Fecha hasta la cual el presupuesto es válido';
COMMENT ON COLUMN quotes.sent_at IS 'Fecha y hora en que se envió el presupuesto';
COMMENT ON COLUMN quotes.sent_to_email IS 'Email al que se envió el presupuesto';
COMMENT ON COLUMN quotes.converted_to_sale_id IS 'ID de la venta si el presupuesto fue convertido';

SELECT '✅ Tablas de presupuestos creadas exitosamente' as resultado;
