-- Add return totals columns to cash_register_closures
ALTER TABLE cash_register_closures
  ADD COLUMN IF NOT EXISTS total_returns_cash     NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_returns_transfer NUMERIC(12,2) NOT NULL DEFAULT 0;
