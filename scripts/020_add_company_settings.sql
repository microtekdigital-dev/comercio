-- Add company settings fields
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Argentina',
ADD COLUMN IF NOT EXISTS postal_code TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS tax_id TEXT,
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS default_tax_rate DECIMAL(5,2) DEFAULT 21.00,
ADD COLUMN IF NOT EXISTS invoice_prefix TEXT DEFAULT 'FAC',
ADD COLUMN IF NOT EXISTS invoice_next_number INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS terms_and_conditions TEXT;

-- Add comment
COMMENT ON COLUMN public.companies.default_tax_rate IS 'Default tax rate percentage (e.g., 21.00 for 21%)';
COMMENT ON COLUMN public.companies.invoice_prefix IS 'Prefix for invoice numbers (e.g., FAC for FAC-0001)';
COMMENT ON COLUMN public.companies.invoice_next_number IS 'Next invoice number to use';
