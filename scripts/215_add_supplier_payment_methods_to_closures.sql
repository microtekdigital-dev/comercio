-- Add supplier payment method columns to cash_register_closures table
-- This allows tracking supplier payments by payment method (cash, card, transfer, other)

-- Add new columns for supplier payment methods
ALTER TABLE cash_register_closures
ADD COLUMN IF NOT EXISTS supplier_payments_total DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS supplier_payments_card DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS supplier_payments_transfer DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS supplier_payments_other DECIMAL(10, 2) DEFAULT 0;

-- Update existing records to set supplier_payments_total equal to supplier_payments_cash
UPDATE cash_register_closures
SET supplier_payments_total = supplier_payments_cash
WHERE supplier_payments_total IS NULL OR supplier_payments_total = 0;

-- Add comment to explain the columns
COMMENT ON COLUMN cash_register_closures.supplier_payments_total IS 'Total amount paid to suppliers (all payment methods)';
COMMENT ON COLUMN cash_register_closures.supplier_payments_cash IS 'Amount paid to suppliers in cash';
COMMENT ON COLUMN cash_register_closures.supplier_payments_card IS 'Amount paid to suppliers by card';
COMMENT ON COLUMN cash_register_closures.supplier_payments_transfer IS 'Amount paid to suppliers by transfer';
COMMENT ON COLUMN cash_register_closures.supplier_payments_other IS 'Amount paid to suppliers by other methods';
