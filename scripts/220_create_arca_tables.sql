-- =====================================================
-- ARCA Electronic Invoicing Module - Database Schema
-- =====================================================
-- This migration creates all tables needed for the ARCA
-- electronic invoicing system for Argentina.
-- 
-- Tables:
-- 1. arca_configurations: ARCA configuration per company
-- 2. arca_certificates: Digital certificates (encrypted)
-- 3. electronic_invoices: Electronic invoices
-- 4. electronic_invoice_items: Invoice line items
-- 5. electronic_invoice_vat_breakdown: VAT breakdown by rate
-- 6. arca_audit_logs: Immutable audit trail
-- 7. arca_retry_queue: Retry queue for failed operations
-- 8. arca_sequences: Invoice numbering sequences
-- =====================================================

-- =====================================================
-- 1. ARCA Certificates Table
-- =====================================================
-- Stores encrypted digital certificates (.pfx files)
-- Created first because arca_configurations references it
CREATE TABLE IF NOT EXISTS arca_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  pfx_data_encrypted BYTEA NOT NULL,
  password_encrypted TEXT NOT NULL,
  expiration_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES profiles(id),
  CONSTRAINT valid_expiration CHECK (expiration_date > CURRENT_DATE)
);

-- =====================================================
-- 2. ARCA Configurations Table
-- =====================================================
-- Stores ARCA configuration for each company
CREATE TABLE IF NOT EXISTS arca_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  cuit VARCHAR(11) NOT NULL CHECK (cuit ~ '^\d{11}$'),
  point_of_sale INTEGER NOT NULL CHECK (point_of_sale > 0 AND point_of_sale <= 9999),
  environment VARCHAR(20) NOT NULL CHECK (environment IN ('TESTING', 'PRODUCTION')),
  certificate_id UUID REFERENCES arca_certificates(id) ON DELETE SET NULL,
  last_sync TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id)
);

-- =====================================================
-- 3. Electronic Invoices Table
-- =====================================================
-- Main table for electronic invoices
CREATE TABLE IF NOT EXISTS electronic_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  sale_id UUID REFERENCES sales(id) ON DELETE SET NULL,
  
  -- Invoice identification
  invoice_type VARCHAR(20) NOT NULL CHECK (invoice_type IN (
    'FACTURA_A', 'FACTURA_B', 'FACTURA_C',
    'NOTA_CREDITO_A', 'NOTA_CREDITO_B', 'NOTA_CREDITO_C',
    'NOTA_DEBITO_A', 'NOTA_DEBITO_B', 'NOTA_DEBITO_C'
  )),
  point_of_sale INTEGER NOT NULL CHECK (point_of_sale > 0 AND point_of_sale <= 9999),
  invoice_number BIGINT NOT NULL CHECK (invoice_number > 0),
  issue_date DATE NOT NULL,
  
  -- Customer fiscal data
  customer_cuit_cuil VARCHAR(11) CHECK (customer_cuit_cuil IS NULL OR customer_cuit_cuil ~ '^\d{11}$'),
  customer_document_type VARCHAR(10) NOT NULL,
  customer_document_number VARCHAR(20) NOT NULL,
  customer_fiscal_condition VARCHAR(30) NOT NULL CHECK (customer_fiscal_condition IN (
    'RESPONSABLE_INSCRIPTO', 'CONSUMIDOR_FINAL', 'MONOTRIBUTISTA', 'EXENTO'
  )),
  customer_business_name TEXT NOT NULL,
  customer_fiscal_address TEXT NOT NULL,
  
  -- Invoice data
  concept VARCHAR(30) NOT NULL CHECK (concept IN (
    'PRODUCTS', 'SERVICES', 'PRODUCTS_AND_SERVICES'
  )),
  currency VARCHAR(3) NOT NULL DEFAULT 'ARS' CHECK (currency IN ('ARS', 'USD')),
  exchange_rate DECIMAL(10, 4) CHECK (exchange_rate IS NULL OR exchange_rate > 0),
  subtotal DECIMAL(12, 2) NOT NULL CHECK (subtotal >= 0),
  vat_amount DECIMAL(12, 2) NOT NULL CHECK (vat_amount >= 0),
  total DECIMAL(12, 2) NOT NULL CHECK (total >= 0),
  
  -- ARCA authorization data
  status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK (status IN (
    'DRAFT', 'PENDING', 'AUTHORIZED', 'REJECTED', 'CANCELLED'
  )),
  cae VARCHAR(14),
  cae_expiration_date DATE,
  qr_code TEXT,
  pdf_url TEXT,
  
  -- Related invoice (for credit/debit notes)
  related_invoice_id UUID REFERENCES electronic_invoices(id) ON DELETE SET NULL,
  
  -- Audit fields
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(company_id, point_of_sale, invoice_type, invoice_number),
  CONSTRAINT valid_exchange_rate CHECK (
    (currency = 'ARS' AND exchange_rate IS NULL) OR
    (currency != 'ARS' AND exchange_rate IS NOT NULL AND exchange_rate > 0)
  ),
  CONSTRAINT valid_cae CHECK (
    (status = 'AUTHORIZED' AND cae IS NOT NULL AND cae_expiration_date IS NOT NULL) OR
    (status != 'AUTHORIZED')
  )
);

-- =====================================================
-- 4. Electronic Invoice Items Table
-- =====================================================
-- Line items for each invoice
CREATE TABLE IF NOT EXISTS electronic_invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES electronic_invoices(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(12, 2) NOT NULL CHECK (unit_price >= 0),
  vat_rate DECIMAL(5, 2) NOT NULL CHECK (vat_rate IN (0, 2.5, 5, 10.5, 21, 27)),
  subtotal DECIMAL(12, 2) NOT NULL CHECK (subtotal >= 0),
  vat_amount DECIMAL(12, 2) NOT NULL CHECK (vat_amount >= 0),
  total DECIMAL(12, 2) NOT NULL CHECK (total >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 5. Electronic Invoice VAT Breakdown Table
-- =====================================================
-- VAT breakdown by rate for each invoice
CREATE TABLE IF NOT EXISTS electronic_invoice_vat_breakdown (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES electronic_invoices(id) ON DELETE CASCADE,
  vat_rate DECIMAL(5, 2) NOT NULL CHECK (vat_rate IN (0, 2.5, 5, 10.5, 21, 27)),
  taxable_base DECIMAL(12, 2) NOT NULL CHECK (taxable_base >= 0),
  vat_amount DECIMAL(12, 2) NOT NULL CHECK (vat_amount >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(invoice_id, vat_rate)
);

-- =====================================================
-- 6. ARCA Audit Logs Table
-- =====================================================
-- Immutable audit trail for all ARCA operations
CREATE TABLE IF NOT EXISTS arca_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  operation_type VARCHAR(20) NOT NULL CHECK (operation_type IN (
    'CREATE', 'UPDATE', 'DELETE', 'AUTHORIZE', 'CANCEL', 'QUERY', 'SYNC', 'RETRY'
  )),
  entity_type VARCHAR(20) NOT NULL CHECK (entity_type IN (
    'INVOICE', 'CREDIT_NOTE', 'DEBIT_NOTE', 'CERTIFICATE', 'CONFIGURATION'
  )),
  entity_id UUID NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 7. ARCA Retry Queue Table
-- =====================================================
-- Queue for automatic retries of failed operations
CREATE TABLE IF NOT EXISTS arca_retry_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES electronic_invoices(id) ON DELETE CASCADE,
  attempt_number INTEGER NOT NULL DEFAULT 1 CHECK (attempt_number > 0 AND attempt_number <= 5),
  scheduled_at TIMESTAMPTZ NOT NULL,
  processed_at TIMESTAMPTZ,
  success BOOLEAN,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_processing CHECK (
    (processed_at IS NULL AND success IS NULL) OR
    (processed_at IS NOT NULL AND success IS NOT NULL)
  )
);

-- =====================================================
-- 8. ARCA Sequences Table
-- =====================================================
-- Invoice numbering sequences per company, point of sale, and type
CREATE TABLE IF NOT EXISTS arca_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  point_of_sale INTEGER NOT NULL CHECK (point_of_sale > 0 AND point_of_sale <= 9999),
  invoice_type VARCHAR(20) NOT NULL CHECK (invoice_type IN (
    'FACTURA_A', 'FACTURA_B', 'FACTURA_C',
    'NOTA_CREDITO_A', 'NOTA_CREDITO_B', 'NOTA_CREDITO_C',
    'NOTA_DEBITO_A', 'NOTA_DEBITO_B', 'NOTA_DEBITO_C'
  )),
  last_number BIGINT NOT NULL DEFAULT 0 CHECK (last_number >= 0),
  last_sync TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, point_of_sale, invoice_type)
);

-- =====================================================
-- INDEXES FOR OPTIMIZATION
-- =====================================================

-- Electronic invoices indexes
CREATE INDEX IF NOT EXISTS idx_electronic_invoices_company 
  ON electronic_invoices(company_id);

CREATE INDEX IF NOT EXISTS idx_electronic_invoices_sale 
  ON electronic_invoices(sale_id) 
  WHERE sale_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_electronic_invoices_status 
  ON electronic_invoices(status);

CREATE INDEX IF NOT EXISTS idx_electronic_invoices_cae 
  ON electronic_invoices(cae) 
  WHERE cae IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_electronic_invoices_issue_date 
  ON electronic_invoices(issue_date DESC);

CREATE INDEX IF NOT EXISTS idx_electronic_invoices_type_pos 
  ON electronic_invoices(company_id, point_of_sale, invoice_type, invoice_number);

CREATE INDEX IF NOT EXISTS idx_electronic_invoices_related 
  ON electronic_invoices(related_invoice_id) 
  WHERE related_invoice_id IS NOT NULL;

-- Invoice items indexes
CREATE INDEX IF NOT EXISTS idx_electronic_invoice_items_invoice 
  ON electronic_invoice_items(invoice_id);

CREATE INDEX IF NOT EXISTS idx_electronic_invoice_items_product 
  ON electronic_invoice_items(product_id) 
  WHERE product_id IS NOT NULL;

-- VAT breakdown indexes
CREATE INDEX IF NOT EXISTS idx_electronic_invoice_vat_breakdown_invoice 
  ON electronic_invoice_vat_breakdown(invoice_id);

-- Audit logs indexes
CREATE INDEX IF NOT EXISTS idx_arca_audit_logs_company 
  ON arca_audit_logs(company_id);

CREATE INDEX IF NOT EXISTS idx_arca_audit_logs_timestamp 
  ON arca_audit_logs(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_arca_audit_logs_entity 
  ON arca_audit_logs(entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_arca_audit_logs_user 
  ON arca_audit_logs(user_id);

-- Retry queue indexes
CREATE INDEX IF NOT EXISTS idx_arca_retry_queue_scheduled 
  ON arca_retry_queue(scheduled_at) 
  WHERE processed_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_arca_retry_queue_invoice 
  ON arca_retry_queue(invoice_id);

-- Certificates indexes
CREATE INDEX IF NOT EXISTS idx_arca_certificates_company 
  ON arca_certificates(company_id);

CREATE INDEX IF NOT EXISTS idx_arca_certificates_expiration 
  ON arca_certificates(expiration_date);

-- Sequences indexes
CREATE INDEX IF NOT EXISTS idx_arca_sequences_lookup 
  ON arca_sequences(company_id, point_of_sale, invoice_type);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE arca_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE arca_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE electronic_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE electronic_invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE electronic_invoice_vat_breakdown ENABLE ROW LEVEL SECURITY;
ALTER TABLE arca_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE arca_retry_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE arca_sequences ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS Policies for arca_configurations
-- =====================================================
CREATE POLICY "Users can view their company's ARCA configuration"
  ON arca_configurations FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM company_users 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert ARCA configuration"
  ON arca_configurations FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM company_users 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update ARCA configuration"
  ON arca_configurations FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM company_users 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- RLS Policies for arca_certificates
-- =====================================================
CREATE POLICY "Users can view their company's certificates"
  ON arca_certificates FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM company_users 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert certificates"
  ON arca_certificates FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM company_users 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- RLS Policies for electronic_invoices
-- =====================================================
CREATE POLICY "Users can view their company's invoices"
  ON electronic_invoices FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM company_users 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert invoices for their company"
  ON electronic_invoices FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM company_users 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their company's invoices"
  ON electronic_invoices FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM company_users 
      WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- RLS Policies for electronic_invoice_items
-- =====================================================
CREATE POLICY "Users can view items from their company's invoices"
  ON electronic_invoice_items FOR SELECT
  USING (
    invoice_id IN (
      SELECT id FROM electronic_invoices 
      WHERE company_id IN (
        SELECT company_id FROM company_users 
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert items for their company's invoices"
  ON electronic_invoice_items FOR INSERT
  WITH CHECK (
    invoice_id IN (
      SELECT id FROM electronic_invoices 
      WHERE company_id IN (
        SELECT company_id FROM company_users 
        WHERE user_id = auth.uid()
      )
    )
  );

-- =====================================================
-- RLS Policies for electronic_invoice_vat_breakdown
-- =====================================================
CREATE POLICY "Users can view VAT breakdown from their company's invoices"
  ON electronic_invoice_vat_breakdown FOR SELECT
  USING (
    invoice_id IN (
      SELECT id FROM electronic_invoices 
      WHERE company_id IN (
        SELECT company_id FROM company_users 
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert VAT breakdown for their company's invoices"
  ON electronic_invoice_vat_breakdown FOR INSERT
  WITH CHECK (
    invoice_id IN (
      SELECT id FROM electronic_invoices 
      WHERE company_id IN (
        SELECT company_id FROM company_users 
        WHERE user_id = auth.uid()
      )
    )
  );

-- =====================================================
-- RLS Policies for arca_audit_logs
-- =====================================================
CREATE POLICY "Users can view their company's audit logs"
  ON arca_audit_logs FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM company_users 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert audit logs"
  ON arca_audit_logs FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM company_users 
      WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- RLS Policies for arca_retry_queue
-- =====================================================
CREATE POLICY "Users can view retry queue for their company's invoices"
  ON arca_retry_queue FOR SELECT
  USING (
    invoice_id IN (
      SELECT id FROM electronic_invoices 
      WHERE company_id IN (
        SELECT company_id FROM company_users 
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "System can manage retry queue"
  ON arca_retry_queue FOR ALL
  USING (
    invoice_id IN (
      SELECT id FROM electronic_invoices 
      WHERE company_id IN (
        SELECT company_id FROM company_users 
        WHERE user_id = auth.uid()
      )
    )
  );

-- =====================================================
-- RLS Policies for arca_sequences
-- =====================================================
CREATE POLICY "Users can view their company's sequences"
  ON arca_sequences FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM company_users 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can manage sequences for user's company"
  ON arca_sequences FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM company_users 
      WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update updated_at timestamp on arca_configurations
CREATE OR REPLACE FUNCTION update_arca_configurations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_arca_configurations_updated_at
  BEFORE UPDATE ON arca_configurations
  FOR EACH ROW
  EXECUTE FUNCTION update_arca_configurations_updated_at();

-- Update updated_at timestamp on electronic_invoices
CREATE OR REPLACE FUNCTION update_electronic_invoices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_electronic_invoices_updated_at
  BEFORE UPDATE ON electronic_invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_electronic_invoices_updated_at();

-- Update updated_at timestamp on arca_sequences
CREATE OR REPLACE FUNCTION update_arca_sequences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_arca_sequences_updated_at
  BEFORE UPDATE ON arca_sequences
  FOR EACH ROW
  EXECUTE FUNCTION update_arca_sequences_updated_at();

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE arca_configurations IS 'ARCA configuration per company including CUIT, point of sale, and environment';
COMMENT ON TABLE arca_certificates IS 'Encrypted digital certificates for ARCA authentication';
COMMENT ON TABLE electronic_invoices IS 'Electronic invoices, credit notes, and debit notes';
COMMENT ON TABLE electronic_invoice_items IS 'Line items for electronic invoices';
COMMENT ON TABLE electronic_invoice_vat_breakdown IS 'VAT breakdown by rate for each invoice';
COMMENT ON TABLE arca_audit_logs IS 'Immutable audit trail for all ARCA operations';
COMMENT ON TABLE arca_retry_queue IS 'Queue for automatic retries of failed ARCA operations';
COMMENT ON TABLE arca_sequences IS 'Invoice numbering sequences per company, point of sale, and type';

-- =====================================================
-- END OF MIGRATION
-- =====================================================
