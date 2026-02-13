-- Script 205: Crear función para detectar productos con stock bajo (incluyendo variantes)
-- Fecha: 2026-02-13
-- Descripción: Función que retorna productos con stock bajo considerando tanto productos simples como variantes

-- Drop function if exists
DROP FUNCTION IF EXISTS get_products_with_low_stock(uuid);

-- Create function to get products with low stock
CREATE OR REPLACE FUNCTION get_products_with_low_stock(p_company_id uuid)
RETURNS TABLE (product_id uuid) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  -- Productos simples con stock bajo
  SELECT p.id
  FROM products p
  WHERE p.company_id = p_company_id
    AND p.track_inventory = true
    AND p.has_variants = false
    AND p.stock_quantity <= p.min_stock_level
    AND p.is_active = true
  
  UNION
  
  -- Productos con variantes que tienen al menos una variante con stock bajo
  SELECT DISTINCT p.id
  FROM products p
  INNER JOIN product_variants pv ON pv.product_id = p.id
  WHERE p.company_id = p_company_id
    AND p.has_variants = true
    AND pv.is_active = true
    AND pv.stock_quantity <= pv.min_stock_level
    AND p.is_active = true;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_products_with_low_stock(uuid) TO authenticated;

-- Add comment
COMMENT ON FUNCTION get_products_with_low_stock(uuid) IS 
'Retorna IDs de productos con stock bajo. Considera productos simples y productos con variantes (si al menos una variante tiene stock bajo).';
