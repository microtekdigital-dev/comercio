-- =====================================================
-- Price History System Migration
-- =====================================================
-- This migration creates the price_changes table and trigger
-- to automatically track all price modifications for products.
-- 
-- Features:
-- - Automatic logging of sale price and cost price changes
-- - Employee attribution with preserved historical data
-- - Immutable audit trail (no updates allowed)
-- - Optional reason field for documenting changes
-- - RLS policies for company-level data isolation
-- =====================================================

-- Create price_changes table
CREATE TABLE IF NOT EXISTS price_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  
  -- Price type classification
  price_type VARCHAR(20) NOT NULL CHECK (price_type IN ('sale_price', 'cost_price')),
  
  -- Price tracking
  old_value DECIMAL(10, 2) NOT NULL,
  new_value DECIMAL(10, 2) NOT NULL,
  
  -- Employee tracking
  changed_by UUID NOT NULL REFERENCES profiles(id),
  changed_by_name VARCHAR(255) NOT NULL,
  changed_by_role VARCHAR(50) NOT NULL,
  
  -- Additional info
  reason TEXT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraints
  CONSTRAINT valid_price_change CHECK (old_value != new_value),
  CONSTRAINT positive_prices CHECK (old_value >= 0 AND new_value >= 0)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_price_changes_company ON price_changes(company_id);
CREATE INDEX IF NOT EXISTS idx_price_changes_product ON price_changes(product_id);
CREATE INDEX IF NOT EXISTS idx_price_changes_employee ON price_changes(changed_by);
CREATE INDEX IF NOT EXISTS idx_price_changes_date ON price_changes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_price_changes_type ON price_changes(price_type);

-- Enable Row Level Security
ALTER TABLE price_changes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view price changes for their company" ON price_changes;
DROP POLICY IF EXISTS "Prevent price change updates" ON price_changes;
DROP POLICY IF EXISTS "Only admins can delete price changes" ON price_changes;

-- Policy: Users can view price changes for their company
CREATE POLICY "Users can view price changes for their company"
  ON price_changes FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Policy: Prevent updates (immutability)
CREATE POLICY "Prevent price change updates"
  ON price_changes FOR UPDATE
  USING (false);

-- Policy: Only admins can delete (exceptional cases)
CREATE POLICY "Only admins can delete price changes"
  ON price_changes FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND company_id = price_changes.company_id
      AND role IN ('owner', 'admin')
    )
  );

-- =====================================================
-- Trigger Function: log_price_change
-- =====================================================
-- Automatically logs price changes when products are updated.
-- Creates separate records for sale price and cost price changes.
-- Preserves employee information for historical accuracy.
-- =====================================================

CREATE OR REPLACE FUNCTION log_price_change()
RETURNS TRIGGER AS $$
DECLARE
  v_user_name VARCHAR(255);
  v_user_role VARCHAR(50);
BEGIN
  -- Only log if price or cost actually changed
  IF (OLD.price IS DISTINCT FROM NEW.price) OR (OLD.cost IS DISTINCT FROM NEW.cost) THEN
    
    -- Get user information
    SELECT full_name, role INTO v_user_name, v_user_role
    FROM profiles
    WHERE id = auth.uid();
    
    -- Use email if full_name is null
    IF v_user_name IS NULL THEN
      SELECT email INTO v_user_name
      FROM profiles
      WHERE id = auth.uid();
    END IF;
    
    -- Log sale price change
    IF OLD.price IS DISTINCT FROM NEW.price THEN
      INSERT INTO price_changes (
        company_id,
        product_id,
        price_type,
        old_value,
        new_value,
        changed_by,
        changed_by_name,
        changed_by_role
      ) VALUES (
        NEW.company_id,
        NEW.id,
        'sale_price',
        OLD.price,
        NEW.price,
        auth.uid(),
        v_user_name,
        v_user_role
      );
    END IF;
    
    -- Log cost price change
    IF OLD.cost IS DISTINCT FROM NEW.cost THEN
      INSERT INTO price_changes (
        company_id,
        product_id,
        price_type,
        old_value,
        new_value,
        changed_by,
        changed_by_name,
        changed_by_role
      ) VALUES (
        NEW.company_id,
        NEW.id,
        'cost_price',
        OLD.cost,
        NEW.cost,
        auth.uid(),
        v_user_name,
        v_user_role
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_log_price_change ON products;

-- Create trigger on products table
CREATE TRIGGER trigger_log_price_change
  AFTER UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION log_price_change();

-- =====================================================
-- Verification Queries
-- =====================================================
-- Run these queries after migration to verify setup:
--
-- 1. Check table exists:
--    SELECT * FROM price_changes LIMIT 1;
--
-- 2. Check indexes:
--    SELECT indexname FROM pg_indexes WHERE tablename = 'price_changes';
--
-- 3. Check RLS policies:
--    SELECT policyname FROM pg_policies WHERE tablename = 'price_changes';
--
-- 4. Check trigger:
--    SELECT tgname FROM pg_trigger WHERE tgname = 'trigger_log_price_change';
--
-- 5. Test price change logging:
--    UPDATE products SET price = price + 1 WHERE id = '<some_product_id>';
--    SELECT * FROM price_changes WHERE product_id = '<some_product_id>';
-- =====================================================
