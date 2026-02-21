-- Add currency fields to company_settings
ALTER TABLE public.company_settings
ADD COLUMN IF NOT EXISTS currency_code VARCHAR(3) DEFAULT 'USD' NOT NULL,
ADD COLUMN IF NOT EXISTS currency_symbol VARCHAR(10) DEFAULT '$' NOT NULL,
ADD COLUMN IF NOT EXISTS currency_position VARCHAR(10) DEFAULT 'before' NOT NULL;

-- Add check constraint for currency_position
ALTER TABLE public.company_settings
DROP CONSTRAINT IF EXISTS check_currency_position;

ALTER TABLE public.company_settings
ADD CONSTRAINT check_currency_position 
CHECK (currency_position IN ('before', 'after'));

-- Add comments
COMMENT ON COLUMN public.company_settings.currency_code IS 'ISO 4217 currency code (USD, EUR, ARS, etc.)';
COMMENT ON COLUMN public.company_settings.currency_symbol IS 'Currency symbol for display ($, €, etc.)';
COMMENT ON COLUMN public.company_settings.currency_position IS 'Position of currency symbol: before or after amount';

-- Set default values for existing companies
UPDATE public.company_settings
SET 
  currency_code = 'USD',
  currency_symbol = '$',
  currency_position = 'before'
WHERE currency_code IS NULL OR currency_symbol IS NULL OR currency_position IS NULL;
