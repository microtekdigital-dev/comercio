-- Add barcode column to products table
-- Unique per company (two companies can have the same barcode for different products)

ALTER TABLE products ADD COLUMN IF NOT EXISTS barcode TEXT;

-- Unique index: barcode must be unique within a company (ignoring NULLs)
CREATE UNIQUE INDEX IF NOT EXISTS products_company_barcode_unique
  ON products (company_id, barcode)
  WHERE barcode IS NOT NULL;
