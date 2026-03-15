-- =====================================================
-- Migration: Sale Returns Module
-- =====================================================

-- 1. Create sale_returns table
CREATE TABLE IF NOT EXISTS sale_returns (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES companies(id),
  sale_id         UUID NOT NULL REFERENCES sales(id),
  return_number   TEXT NOT NULL,
  return_date     TIMESTAMPTZ NOT NULL DEFAULT now(),
  total_amount    NUMERIC(12,2) NOT NULL,
  refund_method   TEXT NOT NULL CHECK (refund_method IN ('cash', 'transfer', 'customer_credit')),
  reason          TEXT NOT NULL CHECK (reason IN ('defective_product','wrong_product','customer_changed_mind','damaged_in_transit','other')),
  reason_notes    TEXT,
  status          TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'cancelled')),
  created_by      UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Create sale_return_items table
CREATE TABLE IF NOT EXISTS sale_return_items (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_id        UUID NOT NULL REFERENCES sale_returns(id) ON DELETE CASCADE,
  sale_item_id     UUID NOT NULL REFERENCES sale_items(id),
  product_id       UUID REFERENCES products(id),
  variant_id       UUID REFERENCES product_variants(id),
  product_name     TEXT NOT NULL,
  variant_name     TEXT,
  quantity         INTEGER NOT NULL CHECK (quantity > 0),
  unit_price       NUMERIC(12,2) NOT NULL,
  tax_rate         NUMERIC(5,2) NOT NULL DEFAULT 0,
  discount_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
  subtotal         NUMERIC(12,2) NOT NULL,
  tax_amount       NUMERIC(12,2) NOT NULL,
  total            NUMERIC(12,2) NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Create credit_notes table
CREATE TABLE IF NOT EXISTS credit_notes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID NOT NULL REFERENCES companies(id),
  return_id   UUID NOT NULL REFERENCES sale_returns(id),
  sale_id     UUID NOT NULL REFERENCES sales(id),
  customer_id UUID REFERENCES customers(id),
  note_number TEXT NOT NULL,
  amount      NUMERIC(12,2) NOT NULL,
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'applied')),
  applied_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Create customer_credits table
CREATE TABLE IF NOT EXISTS customer_credits (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id     UUID NOT NULL REFERENCES companies(id),
  customer_id    UUID NOT NULL REFERENCES customers(id),
  credit_note_id UUID REFERENCES credit_notes(id),
  amount         NUMERIC(12,2) NOT NULL,
  description    TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Add return_id column to stock_movements
ALTER TABLE stock_movements
  ADD COLUMN IF NOT EXISTS return_id UUID REFERENCES sale_returns(id);

-- 6. Update sales.payment_status CHECK constraint to include partial_refund
ALTER TABLE sales DROP CONSTRAINT IF EXISTS sales_payment_status_check;
ALTER TABLE sales ADD CONSTRAINT sales_payment_status_check
  CHECK (payment_status IN ('pending', 'partial', 'paid', 'refunded', 'partial_refund'));

-- 7. Indexes
CREATE INDEX IF NOT EXISTS idx_sale_returns_company_sale ON sale_returns(company_id, sale_id);
CREATE INDEX IF NOT EXISTS idx_credit_notes_company_return ON credit_notes(company_id, return_id);
CREATE INDEX IF NOT EXISTS idx_customer_credits_company_customer ON customer_credits(company_id, customer_id);

-- 8. RLS Policies
ALTER TABLE sale_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_return_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_credits ENABLE ROW LEVEL SECURITY;

-- sale_returns policies
CREATE POLICY "sale_returns_company_isolation" ON sale_returns
  FOR ALL USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- sale_return_items policies (via return_id → sale_returns)
CREATE POLICY "sale_return_items_company_isolation" ON sale_return_items
  FOR ALL USING (
    return_id IN (
      SELECT id FROM sale_returns WHERE company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- credit_notes policies
CREATE POLICY "credit_notes_company_isolation" ON credit_notes
  FOR ALL USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- customer_credits policies
CREATE POLICY "customer_credits_company_isolation" ON customer_credits
  FOR ALL USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );
