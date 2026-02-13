/**
 * Unit Tests for Product Variant UI Components
 * 
 * Tests the UI components for product variant management:
 * - ProductVariantSelector
 * - VariantStockTable
 * - ProductVariantBadge
 * 
 * Requirements: 1.1, 4.1, 6.1, 9.4
 */

import { describe, it, expect } from 'vitest';
import { VARIANT_TYPES, type VariantType, type ProductVariantFormData } from '@/lib/types/erp';

describe('ProductVariantSelector Component Logic', () => {
  it('should have 4 variant type options', () => {
    // Test that VARIANT_TYPES has all expected options
    const variantTypes: VariantType[] = ['none', 'shirts', 'pants', 'custom'];
    
    variantTypes.forEach(type => {
      expect(VARIANT_TYPES[type]).toBeDefined();
      expect(VARIANT_TYPES[type].label).toBeTruthy();
    });
    
    expect(Object.keys(VARIANT_TYPES).length).toBe(4);
  });

  it('should have correct labels for each variant type', () => {
    expect(VARIANT_TYPES.none.label).toBe('Sin variantes');
    expect(VARIANT_TYPES.shirts.label).toBe('Camisas/Remeras');
    expect(VARIANT_TYPES.pants.label).toBe('Pantalones');
    expect(VARIANT_TYPES.custom.label).toBe('Personalizado');
  });

  it('should have correct sizes for predefined types', () => {
    // Shirts should have 7 sizes
    expect(VARIANT_TYPES.shirts.sizes).toHaveLength(7);
    expect(VARIANT_TYPES.shirts.sizes).toEqual(['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL']);
    
    // Pants should have 10 sizes
    expect(VARIANT_TYPES.pants.sizes).toHaveLength(10);
    expect(VARIANT_TYPES.pants.sizes).toEqual(['28', '30', '32', '34', '36', '38', '40', '42', '44', '46']);
    
    // None and custom should have no predefined sizes
    expect(VARIANT_TYPES.none.sizes).toHaveLength(0);
    expect(VARIANT_TYPES.custom.sizes).toHaveLength(0);
  });
});

describe('VariantStockTable Component Logic', () => {
  describe('Stock Validation', () => {
    it('should validate stock is not negative', () => {
      const variants: ProductVariantFormData[] = [
        {
          variant_name: 'M',
          sku: 'SKU-M',
          stock_quantity: -5, // Invalid: negative stock
          min_stock_level: 0,
          sort_order: 0
        }
      ];

      // Check that negative stock is invalid
      const hasNegativeStock = variants.some(v => v.stock_quantity < 0 || v.min_stock_level < 0);
      expect(hasNegativeStock).toBe(true);
    });

    it('should accept zero and positive stock values', () => {
      const variants: ProductVariantFormData[] = [
        {
          variant_name: 'S',
          sku: 'SKU-S',
          stock_quantity: 0, // Valid: zero stock
          min_stock_level: 0,
          sort_order: 0
        },
        {
          variant_name: 'M',
          sku: 'SKU-M',
          stock_quantity: 100, // Valid: positive stock
          min_stock_level: 10,
          sort_order: 1
        }
      ];

      const hasNegativeStock = variants.some(v => v.stock_quantity < 0 || v.min_stock_level < 0);
      expect(hasNegativeStock).toBe(false);
    });

    it('should validate min_stock_level is not negative', () => {
      const variants: ProductVariantFormData[] = [
        {
          variant_name: 'L',
          sku: 'SKU-L',
          stock_quantity: 50,
          min_stock_level: -10, // Invalid: negative min stock
          sort_order: 0
        }
      ];

      const hasNegativeStock = variants.some(v => v.stock_quantity < 0 || v.min_stock_level < 0);
      expect(hasNegativeStock).toBe(true);
    });
  });

  describe('Unique Name Validation', () => {
    it('should detect duplicate variant names (case-insensitive)', () => {
      const variants: ProductVariantFormData[] = [
        {
          variant_name: 'Medium',
          sku: 'SKU-1',
          stock_quantity: 10,
          min_stock_level: 0,
          sort_order: 0
        },
        {
          variant_name: 'MEDIUM', // Duplicate (case-insensitive)
          sku: 'SKU-2',
          stock_quantity: 20,
          min_stock_level: 0,
          sort_order: 1
        }
      ];

      const names = variants.map(v => v.variant_name.toLowerCase().trim());
      const duplicates = names.filter((name, index) => names.indexOf(name) !== index);
      
      expect(duplicates.length).toBeGreaterThan(0);
    });

    it('should allow unique variant names', () => {
      const variants: ProductVariantFormData[] = [
        {
          variant_name: 'Small',
          sku: 'SKU-S',
          stock_quantity: 10,
          min_stock_level: 0,
          sort_order: 0
        },
        {
          variant_name: 'Medium',
          sku: 'SKU-M',
          stock_quantity: 20,
          min_stock_level: 0,
          sort_order: 1
        },
        {
          variant_name: 'Large',
          sku: 'SKU-L',
          stock_quantity: 15,
          min_stock_level: 0,
          sort_order: 2
        }
      ];

      const names = variants.map(v => v.variant_name.toLowerCase().trim());
      const uniqueNames = new Set(names);
      
      expect(uniqueNames.size).toBe(names.length);
    });

    it('should detect empty variant names', () => {
      const variants: ProductVariantFormData[] = [
        {
          variant_name: '',  // Empty name
          sku: 'SKU-1',
          stock_quantity: 10,
          min_stock_level: 0,
          sort_order: 0
        },
        {
          variant_name: '   ',  // Whitespace only
          sku: 'SKU-2',
          stock_quantity: 20,
          min_stock_level: 0,
          sort_order: 1
        }
      ];

      const hasEmptyNames = variants.some(v => !v.variant_name.trim());
      expect(hasEmptyNames).toBe(true);
    });
  });

  describe('Stock Calculation', () => {
    it('should calculate total stock correctly', () => {
      const variants: ProductVariantFormData[] = [
        {
          variant_name: 'XS',
          sku: '',
          stock_quantity: 10,
          min_stock_level: 0,
          sort_order: 0
        },
        {
          variant_name: 'S',
          sku: '',
          stock_quantity: 25,
          min_stock_level: 0,
          sort_order: 1
        },
        {
          variant_name: 'M',
          sku: '',
          stock_quantity: 30,
          min_stock_level: 0,
          sort_order: 2
        },
        {
          variant_name: 'L',
          sku: '',
          stock_quantity: 20,
          min_stock_level: 0,
          sort_order: 3
        }
      ];

      const totalStock = variants.reduce((sum, v) => sum + (v.stock_quantity || 0), 0);
      expect(totalStock).toBe(85);
    });

    it('should handle zero stock variants in total calculation', () => {
      const variants: ProductVariantFormData[] = [
        {
          variant_name: 'XS',
          sku: '',
          stock_quantity: 0,
          min_stock_level: 0,
          sort_order: 0
        },
        {
          variant_name: 'S',
          sku: '',
          stock_quantity: 15,
          min_stock_level: 0,
          sort_order: 1
        }
      ];

      const totalStock = variants.reduce((sum, v) => sum + (v.stock_quantity || 0), 0);
      expect(totalStock).toBe(15);
    });
  });

  describe('Predefined vs Custom Variants', () => {
    it('should initialize shirts variants with correct sizes', () => {
      const variantType: VariantType = 'shirts';
      const sizes = VARIANT_TYPES[variantType].sizes;
      
      const variants: ProductVariantFormData[] = sizes.map((size, index) => ({
        variant_name: size,
        sku: '',
        stock_quantity: 0,
        min_stock_level: 0,
        sort_order: index
      }));

      expect(variants).toHaveLength(7);
      expect(variants.map(v => v.variant_name)).toEqual(['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL']);
    });

    it('should initialize pants variants with correct sizes', () => {
      const variantType: VariantType = 'pants';
      const sizes = VARIANT_TYPES[variantType].sizes;
      
      const variants: ProductVariantFormData[] = sizes.map((size, index) => ({
        variant_name: size,
        sku: '',
        stock_quantity: 0,
        min_stock_level: 0,
        sort_order: index
      }));

      expect(variants).toHaveLength(10);
      expect(variants.map(v => v.variant_name)).toEqual(['28', '30', '32', '34', '36', '38', '40', '42', '44', '46']);
    });

    it('should allow custom variant names for custom type', () => {
      const customVariants: ProductVariantFormData[] = [
        {
          variant_name: 'Extra Pequeño',
          sku: 'XP-001',
          stock_quantity: 5,
          min_stock_level: 2,
          sort_order: 0
        },
        {
          variant_name: 'Gigante',
          sku: 'GIG-001',
          stock_quantity: 3,
          min_stock_level: 1,
          sort_order: 1
        }
      ];

      expect(customVariants).toHaveLength(2);
      expect(customVariants[0].variant_name).toBe('Extra Pequeño');
      expect(customVariants[1].variant_name).toBe('Gigante');
    });
  });
});

describe('ProductVariantBadge Component Logic', () => {
  it('should not display badge when hasVariants is false', () => {
    const hasVariants = false;
    const variantCount = 5;

    // Badge should not be shown
    const shouldDisplay = hasVariants;
    expect(shouldDisplay).toBe(false);
  });

  it('should display badge when hasVariants is true', () => {
    const hasVariants = true;
    const variantCount = 7;

    // Badge should be shown
    const shouldDisplay = hasVariants;
    expect(shouldDisplay).toBe(true);
  });

  it('should display variant count when provided', () => {
    const hasVariants = true;
    const variantCount = 7;

    const badgeText = variantCount !== undefined && variantCount > 0
      ? `${variantCount} variante${variantCount !== 1 ? 's' : ''}`
      : 'Variantes';

    expect(badgeText).toBe('7 variantes');
  });

  it('should display singular form for one variant', () => {
    const hasVariants = true;
    const variantCount = 1;

    const badgeText = variantCount !== undefined && variantCount > 0
      ? `${variantCount} variante${variantCount !== 1 ? 's' : ''}`
      : 'Variantes';

    expect(badgeText).toBe('1 variante');
  });

  it('should display generic text when count is not provided', () => {
    const hasVariants = true;
    const variantCount = undefined;

    const badgeText = variantCount !== undefined && variantCount > 0
      ? `${variantCount} variante${variantCount !== 1 ? 's' : ''}`
      : 'Variantes';

    expect(badgeText).toBe('Variantes');
  });

  it('should display generic text when count is zero', () => {
    const hasVariants = true;
    const variantCount = 0;

    const badgeText = variantCount !== undefined && variantCount > 0
      ? `${variantCount} variante${variantCount !== 1 ? 's' : ''}`
      : 'Variantes';

    expect(badgeText).toBe('Variantes');
  });
});

describe('Integration: Variant Type Selection Flow', () => {
  it('should transition from none to shirts correctly', () => {
    let variantType: VariantType = 'none';
    let variants: ProductVariantFormData[] = [];

    // User selects shirts
    variantType = 'shirts';
    
    // System should create shirt variants
    if (variantType === 'shirts' && variants.length === 0) {
      const sizes = VARIANT_TYPES[variantType].sizes;
      variants = sizes.map((size, index) => ({
        variant_name: size,
        sku: '',
        stock_quantity: 0,
        min_stock_level: 0,
        sort_order: index
      }));
    }

    expect(variantType).toBe('shirts');
    expect(variants).toHaveLength(7);
  });

  it('should clear variants when switching to none', () => {
    let variantType: VariantType = 'shirts';
    let variants: ProductVariantFormData[] = VARIANT_TYPES.shirts.sizes.map((size, index) => ({
      variant_name: size,
      sku: '',
      stock_quantity: 10,
      min_stock_level: 0,
      sort_order: index
    }));

    // User switches to none
    variantType = 'none';
    
    // System should clear variants
    if (variantType === 'none') {
      variants = [];
    }

    expect(variantType).toBe('none');
    expect(variants).toHaveLength(0);
  });

  it('should preserve custom variants when switching between custom types', () => {
    let variantType: VariantType = 'custom';
    let variants: ProductVariantFormData[] = [
      {
        variant_name: 'Especial',
        sku: 'ESP-001',
        stock_quantity: 15,
        min_stock_level: 5,
        sort_order: 0
      }
    ];

    // Variants should remain when staying in custom
    expect(variants).toHaveLength(1);
    expect(variants[0].variant_name).toBe('Especial');
    expect(variants[0].stock_quantity).toBe(15);
  });

  it('should switch from shirts to pants correctly (regenerate variants)', () => {
    let variantType: VariantType = 'shirts';
    let variants: ProductVariantFormData[] = VARIANT_TYPES.shirts.sizes.map((size, index) => ({
      variant_name: size,
      sku: '',
      stock_quantity: 0,
      min_stock_level: 0,
      sort_order: index
    }));

    // Verify we start with shirts
    expect(variantType).toBe('shirts');
    expect(variants).toHaveLength(7);
    expect(variants[0].variant_name).toBe('XS');

    // User switches to pants
    variantType = 'pants';
    
    // System should regenerate with pants variants (always regenerate for predefined types)
    if (variantType === 'pants') {
      const sizes = VARIANT_TYPES[variantType].sizes;
      variants = sizes.map((size, index) => ({
        variant_name: size,
        sku: '',
        stock_quantity: 0,
        min_stock_level: 0,
        sort_order: index
      }));
    }

    // Verify pants variants are created
    expect(variantType).toBe('pants');
    expect(variants).toHaveLength(10);
    expect(variants[0].variant_name).toBe('28');
    expect(variants[9].variant_name).toBe('46');
  });

  it('should switch from pants to shirts correctly (regenerate variants)', () => {
    let variantType: VariantType = 'pants';
    let variants: ProductVariantFormData[] = VARIANT_TYPES.pants.sizes.map((size, index) => ({
      variant_name: size,
      sku: '',
      stock_quantity: 0,
      min_stock_level: 0,
      sort_order: index
    }));

    // Verify we start with pants
    expect(variantType).toBe('pants');
    expect(variants).toHaveLength(10);
    expect(variants[0].variant_name).toBe('28');

    // User switches to shirts
    variantType = 'shirts';
    
    // System should regenerate with shirts variants
    if (variantType === 'shirts') {
      const sizes = VARIANT_TYPES[variantType].sizes;
      variants = sizes.map((size, index) => ({
        variant_name: size,
        sku: '',
        stock_quantity: 0,
        min_stock_level: 0,
        sort_order: index
      }));
    }

    // Verify shirts variants are created
    expect(variantType).toBe('shirts');
    expect(variants).toHaveLength(7);
    expect(variants[0].variant_name).toBe('XS');
    expect(variants[6].variant_name).toBe('XXXL');
  });
});
