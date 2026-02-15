-- Add initial cash amount fields to companies table
-- This allows companies to configure an initial cash amount that will be used
-- as a suggestion when creating the first cash register opening

-- Add columns for initial cash configuration
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS initial_cash_amount DECIMAL(15, 2),
ADD COLUMN IF NOT EXISTS initial_cash_configured_at TIMESTAMPTZ;

-- Add comment to explain the purpose
COMMENT ON COLUMN public.companies.initial_cash_amount IS 'Initial cash amount configured for the company, used as suggestion for first cash register opening';
COMMENT ON COLUMN public.companies.initial_cash_configured_at IS 'Timestamp when the initial cash amount was configured';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_companies_initial_cash 
ON public.companies(id, initial_cash_amount) 
WHERE initial_cash_amount IS NOT NULL;
