-- =====================================================
-- Add Price Field to Product Variants
-- =====================================================
-- This migration adds the price field to product_variants
-- and creates a trigger to log price changes for variants.
-- 
-- This fixes the bug where variant price changes were not
-- being tracked in the price_changes table.
-- =====================================================

-- Add price column to product_variants
ALTER TABLE product_variants 
ADD COLUMN IF NOT EXISTS price DECIMAL(10, 2);

COMMENT ON COLUMN product_variants.price IS 'Sale price for this specific variant';

-- Create index for price queries
CREATE INDEX IF NOT EXISTS idx_product_variants_price 
ON product_variants(price) WHERE price IS NOT NULL;

-- =====================================================
-- Update log_price_change function to support variant prices
-- =====================================================
CREATE OR REPLACE FUNCTION log_price_change()
RETURNS TRIGGER AS $
DECLARE
  v_user_name VARCHAR(255);
  v_user_role VARCHAR(50);
BEGIN
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
  
  -- Handle products table
  IF TG_TABLE_NAME = 'products' THEN
    -- Only log if price or cost actually changed
    IF (OLD.price IS DISTINCT FROM NEW.price) OR (OLD.cost IS DISTINCT FROM NEW.cost) THEN
      
      -- Log sale price change
      IF OLD.price IS DISTINCT FROM NEW.price THEN
        INSERT INTO price_changes (
          company_id,
          product_id,
          variant_id,
          price_type,
          old_value,
          new_value,
          changed_by,
          changed_by_name,
          changed_by_role
        ) VALUES (
          NEW.company_id,
          NEW.id,
          NULL,
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
          variant_id,
          price_type,
          old_value,
          new_value,
          changed_by,
          changed_by_name,
          changed_by_role
        ) VALUES (
          NEW.company_id,
          NEW.id,
          NULL,
          'cost_price',
          OLD.cost,
          NEW.cost,
          auth.uid(),
          v_user_name,
          v_user_role
        );
      END IF;
    END IF;
  
  -- Handle product_variants table
  ELSIF TG_TABLE_NAME = 'product_variants' THEN
    -- Only log if price actually changed
    IF OLD.price IS DISTINCT FROM NEW.price THEN
      INSERT INTO price_changes (
        company_id,
        product_id,
        variant_id,
        price_type,
        old_value,
        new_value,
        changed_by,
        changed_by_name,
        changed_by_role
      ) VALUES (
        NEW.company_id,
        NEW.product_id,
        NEW.id,
        'sale_price',
        COALESCE(OLD.price, 0),
        NEW.price,
        auth.uid(),
        v_user_name,
        v_user_role
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for product_variants price changes
DROP TRIGGER IF EXISTS trigger_log_variant_price_change ON product_variants;
CREATE TRIGGER trigger_log_variant_price_change
  AFTER UPDATE OF price ON product_variants
  FOR EACH ROW
  WHEN (OLD.price IS DISTINCT FROM NEW.price)
  EXECUTE FUNCTION log_price_change();

-- =====================================================
-- Verification Queries
-- =====================================================
-- Run these queries after migration to verify setup:
--
-- 1. Check price column exists:
--    SELECT column_name, data_type FROM information_schema.columns 
--    WHERE table_name = 'product_variants' AND column_name = 'price';
--
-- 2. Check trigger exists:
--    SELECT tgname FROM pg_trigger WHERE tgname = 'trigger_log_variant_price_change';
--
-- 3. Test variant price change logging:
--    UPDATE product_variants SET price = 100 WHERE id = '<some_variant_id>';
--    SELECT * FROM price_changes WHERE variant_id = '<some_variant_id>';
-- =====================================================

