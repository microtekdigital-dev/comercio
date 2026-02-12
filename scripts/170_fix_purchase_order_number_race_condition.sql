-- Fix purchase order number generation race condition
-- SIMPLE VERSION: Just remove the trigger, let the app handle it

-- Drop the old trigger and function that causes race conditions
DROP TRIGGER IF EXISTS auto_purchase_order_number ON purchase_orders;
DROP FUNCTION IF EXISTS generate_purchase_order_number();

-- Optional: Clean up any duplicate order numbers that may exist
-- This will add a suffix to duplicates
DO $$
DECLARE
  duplicate_record RECORD;
  new_number VARCHAR(50);
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
    END LOOP;
  END LOOP;
END $$;

-- Make order_number nullable temporarily to allow app-side generation
ALTER TABLE purchase_orders ALTER COLUMN order_number DROP NOT NULL;

-- Note: The application code now handles order number generation with retry logic
-- This is more reliable than database triggers for avoiding race conditions
