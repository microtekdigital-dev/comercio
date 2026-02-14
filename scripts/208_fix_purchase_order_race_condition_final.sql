-- Fix purchase order number race condition - Final solution
-- This script adds a unique constraint and optimizes the order number generation

-- Step 1: Clean up any existing duplicates first
DO $$
DECLARE
  duplicate_record RECORD;
  counter INTEGER;
BEGIN
  FOR duplicate_record IN
    SELECT order_number, company_id, array_agg(id ORDER BY created_at) as ids
    FROM purchase_orders
    WHERE order_number IS NOT NULL
    GROUP BY order_number, company_id
    HAVING COUNT(*) > 1
  LOOP
    counter := 1;
    -- Keep the first one, rename the rest
    FOR i IN 2..array_length(duplicate_record.ids, 1) LOOP
      UPDATE purchase_orders
      SET order_number = duplicate_record.order_number || '-DUP' || counter
      WHERE id = duplicate_record.ids[i];
      counter := counter + 1;
      
      RAISE NOTICE 'Fixed duplicate order number: % for company: %', 
        duplicate_record.order_number, duplicate_record.company_id;
    END LOOP;
  END LOOP;
END $$;

-- Step 2: Add unique constraint on (company_id, order_number)
-- This prevents duplicates at the database level
DO $$
BEGIN
  -- Drop existing constraint if it exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'purchase_orders_company_order_number_unique'
  ) THEN
    ALTER TABLE purchase_orders 
    DROP CONSTRAINT purchase_orders_company_order_number_unique;
  END IF;

  -- Add the unique constraint
  ALTER TABLE purchase_orders 
  ADD CONSTRAINT purchase_orders_company_order_number_unique 
  UNIQUE (company_id, order_number);
  
  RAISE NOTICE 'Added unique constraint on (company_id, order_number)';
EXCEPTION
  WHEN duplicate_key THEN
    RAISE NOTICE 'Constraint already exists or duplicates still present';
END $$;

-- Step 3: Create an index to optimize order number lookups
-- This improves performance when finding the max order number
CREATE INDEX IF NOT EXISTS idx_purchase_orders_company_created 
ON purchase_orders(company_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_order_number 
ON purchase_orders(order_number) 
WHERE order_number IS NOT NULL;

-- Step 4: Verify the fix
DO $$
DECLARE
  duplicate_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO duplicate_count
  FROM (
    SELECT order_number, company_id
    FROM purchase_orders
    WHERE order_number IS NOT NULL
    GROUP BY order_number, company_id
    HAVING COUNT(*) > 1
  ) duplicates;
  
  IF duplicate_count > 0 THEN
    RAISE WARNING 'Still have % duplicate order numbers!', duplicate_count;
  ELSE
    RAISE NOTICE 'No duplicate order numbers found. Fix successful!';
  END IF;
END $$;

-- Step 5: Add a comment explaining the solution
COMMENT ON CONSTRAINT purchase_orders_company_order_number_unique ON purchase_orders IS 
'Ensures order numbers are unique per company. The application handles number generation with retry logic.';

