-- Migration: Create Product Variants System
-- Description: Adds support for product variants (sizes) for clothing stores
-- Date: 2026-02-13

-- ============================================================================
-- STEP 1: Add variant columns to products table
-- ============================================================================

ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS has_variants BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS variant_type VARCHAR(20) CHECK (variant_type IN ('shirts', 'pants', 'custom')),
  ADD COLUMN IF NOT EXISTS variant_template_id UUID REFERENCES variant_templates(id) ON DELETE SET NULL;

COMMENT ON COLUMN products.has_variants IS 'Indicates if this product uses variants (sizes)';
COMMENT ON COLUMN products.variant_type IS 'Type of variant: shirts, pants, or custom';
COMMENT ON COLUMN products.variant_template_id IS 'Reference to template used (if custom type)';

CREATE INDEX IF NOT EXISTS idx_products_variant_template ON products(variant_template_id);

-- ============================================================================
-- STEP 2: Create variant_templates table
-- ============================================================================

CREATE TABLE IF NOT EXISTS variant_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  template_name VARCHAR(100) NOT NULL,
  sizes TEXT[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_template_per_company UNIQUE(company_id, template_name),
  CONSTRAINT non_empty_sizes CHECK (array_length(sizes, 1) > 0)
);

COMMENT ON TABLE variant_templates IS 'Stores saved variant templates for reuse across products';
COMMENT ON COLUMN variant_templates.template_name IS 'User-defined name for the template (e.g., "Ropa Estándar")';
COMMENT ON COLUMN variant_templates.sizes IS 'Array of size names in this template';

CREATE INDEX IF NOT EXISTS idx_variant_templates_company ON variant_templates(company_id);

-- ============================================================================
-- STEP 3: Create product_variants table
-- ============================================================================

CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_name VARCHAR(50) NOT NULL,
  sku VARCHAR(100),
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  min_stock_level INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_variant_per_product UNIQUE(product_id, variant_name),
  CONSTRAINT positive_stock CHECK (stock_quantity >= 0),
  CONSTRAINT positive_min_stock CHECK (min_stock_level >= 0)
);

COMMENT ON TABLE product_variants IS 'Stores product variants (sizes) for products with has_variants=true';
COMMENT ON COLUMN product_variants.variant_name IS 'Name of the variant (e.g., "M", "L", "32", "34")';
COMMENT ON COLUMN product_variants.sku IS 'Optional SKU specific to this variant';
COMMENT ON COLUMN product_variants.stock_quantity IS 'Current stock for this variant';
COMMENT ON COLUMN product_variants.min_stock_level IS 'Minimum stock level for low stock alerts';
COMMENT ON COLUMN product_variants.sort_order IS 'Display order for variants';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_product_variants_product ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_company ON product_variants(company_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_active ON product_variants(is_active) WHERE is_active = true;

-- ============================================================================
-- STEP 4: Add variant_id to stock_movements table
-- ============================================================================

ALTER TABLE stock_movements
  ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL;

COMMENT ON COLUMN stock_movements.variant_id IS 'Reference to variant if product has variants';

CREATE INDEX IF NOT EXISTS idx_stock_movements_variant ON stock_movements(variant_id);

-- ============================================================================
-- STEP 5: Add variant columns to sale_items table
-- ============================================================================

ALTER TABLE sale_items
  ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS variant_name VARCHAR(50);

COMMENT ON COLUMN sale_items.variant_id IS 'Reference to variant sold';
COMMENT ON COLUMN sale_items.variant_name IS 'Snapshot of variant name at time of sale';

CREATE INDEX IF NOT EXISTS idx_sale_items_variant ON sale_items(variant_id);

-- ============================================================================
-- STEP 6: Add variant columns to purchase_order_items table
-- ============================================================================

ALTER TABLE purchase_order_items
  ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS variant_name VARCHAR(50);

COMMENT ON COLUMN purchase_order_items.variant_id IS 'Reference to variant in purchase order';
COMMENT ON COLUMN purchase_order_items.variant_name IS 'Snapshot of variant name at time of order';

CREATE INDEX IF NOT EXISTS idx_purchase_order_items_variant ON purchase_order_items(variant_id);

-- ============================================================================
-- STEP 7: Add variant columns to quote_items table
-- ============================================================================

ALTER TABLE quote_items
  ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS variant_name VARCHAR(50);

COMMENT ON COLUMN quote_items.variant_id IS 'Reference to variant in quote';
COMMENT ON COLUMN quote_items.variant_name IS 'Snapshot of variant name at time of quote';

CREATE INDEX IF NOT EXISTS idx_quote_items_variant ON quote_items(variant_id);

-- ============================================================================
-- STEP 8: Enable Row Level Security on product_variants
-- ============================================================================

ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view variants from their company
CREATE POLICY "Users can view variants from their company"
  ON product_variants FOR SELECT
  USING (company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  ));

-- Policy: Users can insert variants for their company
CREATE POLICY "Users can insert variants for their company"
  ON product_variants FOR INSERT
  WITH CHECK (company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  ));

-- Policy: Users can update variants from their company
CREATE POLICY "Users can update variants from their company"
  ON product_variants FOR UPDATE
  USING (company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  ));

-- Policy: Users can delete variants from their company
CREATE POLICY "Users can delete variants from their company"
  ON product_variants FOR DELETE
  USING (company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  ));

-- ============================================================================
-- STEP 9: Enable Row Level Security on variant_templates
-- ============================================================================

ALTER TABLE variant_templates ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view templates from their company
CREATE POLICY "Users can view templates from their company"
  ON variant_templates FOR SELECT
  USING (company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  ));

-- Policy: Users can insert templates for their company
CREATE POLICY "Users can insert templates for their company"
  ON variant_templates FOR INSERT
  WITH CHECK (company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  ));

-- Policy: Users can update templates from their company
CREATE POLICY "Users can update templates from their company"
  ON variant_templates FOR UPDATE
  USING (company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  ));

-- Policy: Users can delete templates from their company
CREATE POLICY "Users can delete templates from their company"
  ON variant_templates FOR DELETE
  USING (company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  ));

-- ============================================================================
-- STEP 10: Create triggers to update updated_at timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION update_product_variants_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_product_variants_updated_at
  BEFORE UPDATE ON product_variants
  FOR EACH ROW
  EXECUTE FUNCTION update_product_variants_updated_at();

CREATE OR REPLACE FUNCTION update_variant_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_variant_templates_updated_at
  BEFORE UPDATE ON variant_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_variant_templates_updated_at();

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify products table columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'products' 
  AND column_name IN ('has_variants', 'variant_type', 'variant_template_id')
ORDER BY ordinal_position;

-- Verify product_variants table exists
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_name IN ('product_variants', 'variant_templates');

-- Verify indexes
SELECT indexname, tablename
FROM pg_indexes
WHERE tablename IN ('product_variants', 'variant_templates', 'products', 'stock_movements', 'sale_items', 'purchase_order_items', 'quote_items')
  AND indexname LIKE '%variant%'
ORDER BY tablename, indexname;

-- Verify RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename IN ('product_variants', 'variant_templates')
ORDER BY tablename, policyname;

-- ============================================================================
-- ROLLBACK SCRIPT (if needed)
-- ============================================================================

/*
-- To rollback this migration, run:

DROP TRIGGER IF EXISTS trigger_update_variant_templates_updated_at ON variant_templates;
DROP FUNCTION IF EXISTS update_variant_templates_updated_at();

DROP TRIGGER IF EXISTS trigger_update_product_variants_updated_at ON product_variants;
DROP FUNCTION IF EXISTS update_product_variants_updated_at();

DROP POLICY IF EXISTS "Users can delete templates from their company" ON variant_templates;
DROP POLICY IF EXISTS "Users can update templates from their company" ON variant_templates;
DROP POLICY IF EXISTS "Users can insert templates for their company" ON variant_templates;
DROP POLICY IF EXISTS "Users can view templates from their company" ON variant_templates;

DROP POLICY IF EXISTS "Users can delete variants from their company" ON product_variants;
DROP POLICY IF EXISTS "Users can update variants from their company" ON product_variants;
DROP POLICY IF EXISTS "Users can insert variants for their company" ON product_variants;
DROP POLICY IF EXISTS "Users can view variants from their company" ON product_variants;

ALTER TABLE quote_items DROP COLUMN IF EXISTS variant_name;
ALTER TABLE quote_items DROP COLUMN IF EXISTS variant_id;

ALTER TABLE purchase_order_items DROP COLUMN IF EXISTS variant_name;
ALTER TABLE purchase_order_items DROP COLUMN IF EXISTS variant_id;

ALTER TABLE sale_items DROP COLUMN IF EXISTS variant_name;
ALTER TABLE sale_items DROP COLUMN IF EXISTS variant_id;

ALTER TABLE stock_movements DROP COLUMN IF EXISTS variant_id;

ALTER TABLE products DROP COLUMN IF EXISTS variant_template_id;

DROP TABLE IF EXISTS product_variants;
DROP TABLE IF EXISTS variant_templates;

ALTER TABLE products DROP COLUMN IF EXISTS variant_type;
ALTER TABLE products DROP COLUMN IF EXISTS has_variants;
*/
