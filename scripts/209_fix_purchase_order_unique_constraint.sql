-- =====================================================
-- Fix Purchase Order Number Uniqueness by Company
-- =====================================================
-- This script ensures order_number is unique per company,
-- not globally unique. This allows different companies
-- to use the same order numbers independently.
-- =====================================================

-- Step 1: Drop the old global unique constraint if it exists
DO $$
BEGIN
  -- Drop old constraint from column definition
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'purchase_orders_order_number_key'
  ) THEN
    ALTER TABLE purchase_orders 
    DROP CONSTRAINT purchase_orders_order_number_key;
    RAISE NOTICE 'Dropped old global unique constraint on order_number';
  END IF;
EXCEPTION
  WHEN undefined_object THEN
    RAISE NOTICE 'Old global unique constraint does not exist, skipping';
END $$;

-- Step 2: Drop any existing company-scoped constraint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'purchase_orders_company_order_number_unique'
  ) THEN
    ALTER TABLE purchase_orders 
    DROP CONSTRAINT purchase_orders_company_order_number_unique;
    RAISE NOTICE 'Dropped existing company-scoped constraint';
  END IF;
EXCEPTION
  WHEN undefined_object THEN
    RAISE NOTICE 'Company-scoped constraint does not exist, skipping';
END $$;

-- Step 3: Add the correct unique constraint (company_id, order_number)
DO $$
BEGIN
  ALTER TABLE purchase_orders 
  ADD CONSTRAINT purchase_orders_company_order_number_unique 
  UNIQUE (company_id, order_number);
  
  RAISE NOTICE 'Added unique constraint on (company_id, order_number)';
EXCEPTION
  WHEN duplicate_key THEN
    RAISE NOTICE 'Constraint already exists or duplicate data found';
  WHEN others THEN
    RAISE NOTICE 'Error adding constraint: %', SQLERRM;
END $$;

-- Step 4: Add index for performance
CREATE INDEX IF NOT EXISTS idx_purchase_orders_company_order_number 
ON purchase_orders(company_id, order_number);

-- Step 5: Add comment
COMMENT ON CONSTRAINT purchase_orders_company_order_number_unique ON purchase_orders IS 
'Ensures order numbers are unique per company, allowing different companies to use the same order numbers independently.';

-- Step 6: Verify the constraint
DO $$
DECLARE
  constraint_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'purchase_orders_company_order_number_unique'
  ) INTO constraint_exists;
  
  IF constraint_exists THEN
    RAISE NOTICE '✓ Constraint successfully created: purchase_orders_company_order_number_unique';
  ELSE
    RAISE WARNING '✗ Constraint was not created successfully';
  END IF;
END $$;
