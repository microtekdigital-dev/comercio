-- Migration: Create ARCA sequence function for atomic number generation
-- This function ensures thread-safe sequence number generation using database locks

-- Function to get next sequence number atomically
CREATE OR REPLACE FUNCTION get_next_arca_sequence(
  p_company_id UUID,
  p_point_of_sale INTEGER,
  p_invoice_type VARCHAR(20)
)
RETURNS BIGINT
LANGUAGE plpgsql
AS $$
DECLARE
  v_next_number BIGINT;
BEGIN
  -- Lock the row for update to prevent race conditions
  -- If the sequence doesn't exist, insert it with number 1
  INSERT INTO arca_sequences (
    company_id,
    point_of_sale,
    invoice_type,
    last_number,
    updated_at
  )
  VALUES (
    p_company_id,
    p_point_of_sale,
    p_invoice_type,
    1,
    NOW()
  )
  ON CONFLICT (company_id, point_of_sale, invoice_type)
  DO UPDATE SET
    last_number = arca_sequences.last_number + 1,
    updated_at = NOW()
  RETURNING last_number INTO v_next_number;
  
  RETURN v_next_number;
END;
$$;

-- Add comment to function
COMMENT ON FUNCTION get_next_arca_sequence IS 'Atomically generates the next invoice number for a given company, point of sale, and invoice type. Uses row-level locking to prevent race conditions.';
