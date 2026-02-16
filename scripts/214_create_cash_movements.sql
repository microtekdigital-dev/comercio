-- Migration: Create cash_movements table
-- Description: Adds table to track cash income and withdrawal movements
-- Date: 2026-02-16

-- Create cash_movements table
CREATE TABLE IF NOT EXISTS cash_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  opening_id UUID NOT NULL REFERENCES cash_register_openings(id) ON DELETE CASCADE,
  movement_type VARCHAR(20) NOT NULL CHECK (movement_type IN ('income', 'withdrawal')),
  amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
  description TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_by_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_cash_movements_company_id ON cash_movements(company_id);
CREATE INDEX IF NOT EXISTS idx_cash_movements_opening_id ON cash_movements(opening_id);
CREATE INDEX IF NOT EXISTS idx_cash_movements_created_at ON cash_movements(created_at DESC);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_cash_movements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_cash_movements_updated_at
  BEFORE UPDATE ON cash_movements
  FOR EACH ROW
  EXECUTE FUNCTION update_cash_movements_updated_at();

-- Enable Row Level Security
ALTER TABLE cash_movements ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view movements from their company
CREATE POLICY "Users can view cash movements from their company"
  ON cash_movements
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id 
      FROM profiles 
      WHERE id = auth.uid()
    )
  );

-- RLS Policy: Users can insert movements for their company
CREATE POLICY "Users can insert cash movements for their company"
  ON cash_movements
  FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id 
      FROM profiles 
      WHERE id = auth.uid()
    )
  );

-- RLS Policy: Users can update movements from their company
CREATE POLICY "Users can update cash movements from their company"
  ON cash_movements
  FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id 
      FROM profiles 
      WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT company_id 
      FROM profiles 
      WHERE id = auth.uid()
    )
  );

-- RLS Policy: Users can delete movements from their company
CREATE POLICY "Users can delete cash movements from their company"
  ON cash_movements
  FOR DELETE
  USING (
    company_id IN (
      SELECT company_id 
      FROM profiles 
      WHERE id = auth.uid()
    )
  );

-- Add comment to table
COMMENT ON TABLE cash_movements IS 'Tracks cash income and withdrawal movements for cash register management';
COMMENT ON COLUMN cash_movements.movement_type IS 'Type of movement: income or withdrawal';
COMMENT ON COLUMN cash_movements.amount IS 'Amount of the movement (always positive, type determines if it adds or subtracts)';
COMMENT ON COLUMN cash_movements.description IS 'Description or reason for the movement';
COMMENT ON COLUMN cash_movements.opening_id IS 'Associated cash register opening';
