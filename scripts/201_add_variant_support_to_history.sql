-- =====================================================
-- Add Variant Support to Stock and Price History
-- =====================================================
-- This migration adds variant_id columns to stock_movements
-- and price_changes tables to support product variants.
-- =====================================================

-- Add variant_id to stock_movements
ALTER TABLE stock_movements 
ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE;

-- Add index for variant lookups
CREATE INDEX IF NOT EXISTS idx_stock_movements_variant_id 
ON stock_movements(variant_id) WHERE variant_id IS NOT NULL;

-- Add variant_id to price_changes
ALTER TABLE price_changes 
ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE;

-- Add index for variant lookups
CREATE INDEX IF NOT EXISTS idx_price_changes_variant_id 
ON price_changes(variant_id) WHERE variant_id IS NOT NULL;

-- =====================================================
-- Update log_stock_movement function to support variants
-- =====================================================
CREATE OR REPLACE FUNCTION log_stock_movement()
RETURNS TRIGGER AS $$
DECLARE
  v_company_id UUID;
  v_user_id UUID;
  v_user_name VARCHAR(255);
  v_movement_type VARCHAR(50);
  v_quantity DECIMAL(10, 2);
  v_stock_before DECIMAL(10, 2);
  v_stock_after DECIMAL(10, 2);
  v_sale_id UUID := NULL;
  v_purchase_order_id UUID := NULL;
  v_notes TEXT := NULL;
  v_variant_id UUID := NULL;
BEGIN
  -- Obtener información del usuario actual
  v_user_id := auth.uid();
  
  SELECT company_id, COALESCE(full_name, email) 
  INTO v_company_id, v_user_name
  FROM profiles 
  WHERE id = v_user_id;
  
  -- Determinar el tipo de movimiento y cantidad
  IF TG_TABLE_NAME = 'products' THEN
    -- Cambio directo en la tabla products (ajuste manual)
    v_stock_before := OLD.stock_quantity;
    v_stock_after := NEW.stock_quantity;
    v_quantity := NEW.stock_quantity - OLD.stock_quantity;
    
    IF v_quantity > 0 THEN
      v_movement_type := 'adjustment_in';
      v_notes := 'Ajuste manual de inventario';
    ELSIF v_quantity < 0 THEN
      v_movement_type := 'adjustment_out';
      v_notes := 'Ajuste manual de inventario';
    ELSE
      -- No hay cambio en cantidad, no registrar
      RETURN NEW;
    END IF;
    
    -- Solo registrar si el producto tiene track_inventory activado
    IF NEW.track_inventory THEN
      INSERT INTO stock_movements (
        company_id,
        product_id,
        variant_id,
        movement_type,
        quantity,
        stock_before,
        stock_after,
        created_by,
        created_by_name,
        notes
      ) VALUES (
        v_company_id,
        NEW.id,
        NULL, -- No variant for direct product changes
        v_movement_type,
        v_quantity,
        v_stock_before,
        v_stock_after,
        v_user_id,
        v_user_name,
        v_notes
      );
    END IF;
  ELSIF TG_TABLE_NAME = 'product_variants' THEN
    -- Cambio en variante de producto
    v_stock_before := OLD.stock_quantity;
    v_stock_after := NEW.stock_quantity;
    v_quantity := NEW.stock_quantity - OLD.stock_quantity;
    
    IF v_quantity > 0 THEN
      v_movement_type := 'adjustment_in';
      v_notes := 'Ajuste manual de inventario - Variante: ' || NEW.variant_name;
    ELSIF v_quantity < 0 THEN
      v_movement_type := 'adjustment_out';
      v_notes := 'Ajuste manual de inventario - Variante: ' || NEW.variant_name;
    ELSE
      -- No hay cambio en cantidad, no registrar
      RETURN NEW;
    END IF;
    
    INSERT INTO stock_movements (
      company_id,
      product_id,
      variant_id,
      movement_type,
      quantity,
      stock_before,
      stock_after,
      created_by,
      created_by_name,
      notes
    ) VALUES (
      v_company_id,
      NEW.product_id,
      NEW.id,
      v_movement_type,
      v_quantity,
      v_stock_before,
      v_stock_after,
      v_user_id,
      v_user_name,
      v_notes
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for product_variants stock changes
DROP TRIGGER IF EXISTS track_variant_stock_changes ON product_variants;
CREATE TRIGGER track_variant_stock_changes
  AFTER UPDATE OF stock_quantity ON product_variants
  FOR EACH ROW
  WHEN (OLD.stock_quantity IS DISTINCT FROM NEW.stock_quantity)
  EXECUTE FUNCTION log_stock_movement();

-- =====================================================
-- Update log_price_change function to support variants
-- =====================================================
CREATE OR REPLACE FUNCTION log_price_change()
RETURNS TRIGGER AS $$
DECLARE
  v_user_name VARCHAR(255);
  v_user_role VARCHAR(50);
BEGIN
  -- Get user information
  SELECT full_name, role INTO v_user_name, v_user_role
  FROM profiles
  WHERE id = auth.uid();
  
  -- Use email if full_name is null
  IF v_user_name IS NULL THEN
    SELECT email INTO v_user_name
    FROM profiles
    WHERE id = auth.uid();
  END IF;
  
  -- Handle products table
  IF TG_TABLE_NAME = 'products' THEN
    -- Only log if price or cost actually changed
    IF (OLD.price IS DISTINCT FROM NEW.price) OR (OLD.cost IS DISTINCT FROM NEW.cost) THEN
      
      -- Log sale price change
      IF OLD.price IS DISTINCT FROM NEW.price THEN
        INSERT INTO price_changes (
          company_id,
          product_id,
          variant_id,
          price_type,
          old_value,
          new_value,
          changed_by,
          changed_by_name,
          changed_by_role
        ) VALUES (
          NEW.company_id,
          NEW.id,
          NULL,
          'sale_price',
          OLD.price,
          NEW.price,
          auth.uid(),
          v_user_name,
          v_user_role
        );
      END IF;
      
      -- Log cost price change
      IF OLD.cost IS DISTINCT FROM NEW.cost THEN
        INSERT INTO price_changes (
          company_id,
          product_id,
          variant_id,
          price_type,
          old_value,
          new_value,
          changed_by,
          changed_by_name,
          changed_by_role
        ) VALUES (
          NEW.company_id,
          NEW.id,
          NULL,
          'cost_price',
          OLD.cost,
          NEW.cost,
          auth.uid(),
          v_user_name,
          v_user_role
        );
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: Variants don't have individual prices, they inherit from the product
-- So we don't need a trigger on product_variants for price changes

-- =====================================================
-- Comments
-- =====================================================
COMMENT ON COLUMN stock_movements.variant_id IS 'ID de la variante del producto (NULL para productos sin variantes)';
COMMENT ON COLUMN price_changes.variant_id IS 'ID de la variante del producto (NULL para productos sin variantes)';

