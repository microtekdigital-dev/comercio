-- =====================================================
-- Script: Create Repairs Module
-- Description: Creates tables and functions for device repair management
-- Version: 1.0
-- Date: 2026-02-20
-- =====================================================

-- Create repair_status enum type (drop if exists first)
DROP TYPE IF EXISTS repair_status CASCADE;

CREATE TYPE repair_status AS ENUM (
  'received',
  'diagnosing',
  'waiting_parts',
  'repairing',
  'repaired',
  'delivered',
  'cancelled'
);

-- =====================================================
-- Table: technicians
-- Description: Stores technicians who perform repairs
-- =====================================================
CREATE TABLE IF NOT EXISTS technicians (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  specialty VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_technicians_company ON technicians(company_id);
CREATE INDEX IF NOT EXISTS idx_technicians_active ON technicians(company_id, is_active);

-- =====================================================
-- Table: repair_orders
-- Description: Main table for repair orders
-- =====================================================
CREATE TABLE IF NOT EXISTS repair_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  order_number INTEGER NOT NULL,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  technician_id UUID REFERENCES technicians(id) ON DELETE SET NULL,
  
  -- Device information
  device_type VARCHAR(100) NOT NULL,
  brand VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  serial_number VARCHAR(100),
  accessories TEXT,
  
  -- Problem and diagnosis
  reported_problem TEXT NOT NULL,
  diagnosis TEXT,
  diagnosis_date TIMESTAMPTZ,
  
  -- Status and dates
  status repair_status DEFAULT 'received',
  received_date TIMESTAMPTZ DEFAULT NOW(),
  estimated_delivery_date DATE,
  repair_completed_date TIMESTAMPTZ,
  delivered_date TIMESTAMPTZ,
  
  -- Budget and approval
  labor_cost DECIMAL(10,2) DEFAULT 0,
  budget_approved BOOLEAN,
  approval_date TIMESTAMPTZ,
  approval_notes TEXT,
  
  -- Photos (array of URLs)
  photos TEXT[],
  
  -- Internal notes
  internal_notes TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  
  UNIQUE(company_id, order_number)
);

CREATE INDEX IF NOT EXISTS idx_repair_orders_company ON repair_orders(company_id);
CREATE INDEX IF NOT EXISTS idx_repair_orders_customer ON repair_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_repair_orders_technician ON repair_orders(technician_id);
CREATE INDEX IF NOT EXISTS idx_repair_orders_status ON repair_orders(company_id, status);
CREATE INDEX IF NOT EXISTS idx_repair_orders_dates ON repair_orders(company_id, received_date);

-- =====================================================
-- Table: repair_items
-- Description: Stores parts/products used in repairs
-- =====================================================
CREATE TABLE IF NOT EXISTS repair_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  repair_order_id UUID NOT NULL REFERENCES repair_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity DECIMAL(10,2) NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
  subtotal DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  is_used BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_repair_items_order ON repair_items(repair_order_id);
CREATE INDEX IF NOT EXISTS idx_repair_items_product ON repair_items(product_id);

-- =====================================================
-- Table: repair_payments
-- Description: Stores payments for repair orders
-- =====================================================
CREATE TABLE IF NOT EXISTS repair_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  repair_order_id UUID NOT NULL REFERENCES repair_orders(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  payment_method VARCHAR(50) NOT NULL,
  payment_date TIMESTAMPTZ DEFAULT NOW(),
  cash_register_closure_id UUID REFERENCES cash_register_closures(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_repair_payments_order ON repair_payments(repair_order_id);
CREATE INDEX IF NOT EXISTS idx_repair_payments_company ON repair_payments(company_id);
CREATE INDEX IF NOT EXISTS idx_repair_payments_closure ON repair_payments(cash_register_closure_id);

-- =====================================================
-- Table: repair_notes
-- Description: Stores internal notes for repair orders
-- =====================================================
CREATE TABLE IF NOT EXISTS repair_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  repair_order_id UUID NOT NULL REFERENCES repair_orders(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ,
  updated_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_repair_notes_order ON repair_notes(repair_order_id);

-- =====================================================
-- Function: get_next_repair_order_number
-- Description: Generates sequential order numbers per company
-- =====================================================
CREATE OR REPLACE FUNCTION get_next_repair_order_number(p_company_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_next_number INTEGER;
BEGIN
  -- Get the maximum order number for this company and add 1
  SELECT COALESCE(MAX(order_number), 0) + 1
  INTO v_next_number
  FROM repair_orders
  WHERE company_id = p_company_id;
  
  RETURN v_next_number;
END;
$$;

-- =====================================================
-- RLS Policies for technicians
-- =====================================================
ALTER TABLE technicians ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view technicians from their company"
  ON technicians FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM company_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert technicians for their company"
  ON technicians FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM company_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update technicians from their company"
  ON technicians FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM company_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete technicians from their company"
  ON technicians FOR DELETE
  USING (
    company_id IN (
      SELECT company_id FROM company_users WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- RLS Policies for repair_orders
-- =====================================================
ALTER TABLE repair_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view repair orders from their company"
  ON repair_orders FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM company_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert repair orders for their company"
  ON repair_orders FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM company_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update repair orders from their company"
  ON repair_orders FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM company_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete repair orders from their company"
  ON repair_orders FOR DELETE
  USING (
    company_id IN (
      SELECT company_id FROM company_users WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- RLS Policies for repair_items
-- =====================================================
ALTER TABLE repair_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view repair items from their company"
  ON repair_items FOR SELECT
  USING (
    repair_order_id IN (
      SELECT id FROM repair_orders WHERE company_id IN (
        SELECT company_id FROM company_users WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert repair items for their company"
  ON repair_items FOR INSERT
  WITH CHECK (
    repair_order_id IN (
      SELECT id FROM repair_orders WHERE company_id IN (
        SELECT company_id FROM company_users WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update repair items from their company"
  ON repair_items FOR UPDATE
  USING (
    repair_order_id IN (
      SELECT id FROM repair_orders WHERE company_id IN (
        SELECT company_id FROM company_users WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete repair items from their company"
  ON repair_items FOR DELETE
  USING (
    repair_order_id IN (
      SELECT id FROM repair_orders WHERE company_id IN (
        SELECT company_id FROM company_users WHERE user_id = auth.uid()
      )
    )
  );

-- =====================================================
-- RLS Policies for repair_payments
-- =====================================================
ALTER TABLE repair_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view repair payments from their company"
  ON repair_payments FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM company_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert repair payments for their company"
  ON repair_payments FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM company_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update repair payments from their company"
  ON repair_payments FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM company_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete repair payments from their company"
  ON repair_payments FOR DELETE
  USING (
    company_id IN (
      SELECT company_id FROM company_users WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- RLS Policies for repair_notes
-- =====================================================
ALTER TABLE repair_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view repair notes from their company"
  ON repair_notes FOR SELECT
  USING (
    repair_order_id IN (
      SELECT id FROM repair_orders WHERE company_id IN (
        SELECT company_id FROM company_users WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert repair notes for their company"
  ON repair_notes FOR INSERT
  WITH CHECK (
    repair_order_id IN (
      SELECT id FROM repair_orders WHERE company_id IN (
        SELECT company_id FROM company_users WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update their own repair notes"
  ON repair_notes FOR UPDATE
  USING (
    created_by = auth.uid()
  );

CREATE POLICY "Users can delete their own repair notes"
  ON repair_notes FOR DELETE
  USING (
    created_by = auth.uid()
  );

-- =====================================================
-- Grant permissions
-- =====================================================
GRANT ALL ON technicians TO authenticated;
GRANT ALL ON repair_orders TO authenticated;
GRANT ALL ON repair_items TO authenticated;
GRANT ALL ON repair_payments TO authenticated;
GRANT ALL ON repair_notes TO authenticated;

-- =====================================================
-- Comments
-- =====================================================
COMMENT ON TABLE technicians IS 'Stores technicians who perform device repairs';
COMMENT ON TABLE repair_orders IS 'Main table for device repair orders';
COMMENT ON TABLE repair_items IS 'Stores parts/products used in repairs';
COMMENT ON TABLE repair_payments IS 'Stores payments for repair orders';
COMMENT ON TABLE repair_notes IS 'Stores internal notes for repair orders';
COMMENT ON FUNCTION get_next_repair_order_number IS 'Generates sequential order numbers per company';
