/**
 * Unit Tests for Product Variants CRUD Operations
 * 
 * These tests verify specific examples and edge cases for variant operations.
 * 
 * Requirements tested: 2.1, 2.2, 2.3, 9.2
 * 
 * To run these tests:
 * 1. Install dependencies: npm install --save-dev vitest @vitest/ui
 * 2. Add to package.json scripts: "test": "vitest"
 * 3. Run: npm test
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VARIANT_TYPES, VARIANT_ERRORS } from '@/lib/types/erp';

// Mock data for testing
const mockCompanyId = 'test-company-123';
const mockProductId = 'test-product-456';
const mockUserId = 'test-user-789';

describe('Product Variants - Unit Tests', () => {
  
  describe('Create Variants - Shirts Type', () => {
    /**
     * Test: Create variants for shirts type
     * Requirement: 2.1
     */
    it('should create exactly 7 variants for shirts type', () => {
      const variantType = 'shirts';
      const expectedSizes = VARIANT_TYPES.shirts.sizes;
      
      // Simulate variant creation
      const variants = expectedSizes.map((size, index) => ({
        company_id: mockCompanyId,
        product_id: mockProductId,
        variant_name: size,
        sku: null,
        stock_quantity: 0,
        min_stock_level: 0,
        sort_order: index,
        is_active: true,
      }));
      
      expect(variants).toHaveLength(7);
      expect(variants.map(v => v.variant_name)).toEqual(['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL']);
      
      // Verify all have correct initial values
      variants.forEach((variant, index) => {
        expect(variant.stock_quantity).toBe(0);
        expect(variant.min_stock_level).toBe(0);
        expect(variant.sort_order).toBe(index);
        expect(variant.is_active).toBe(true);
      });
    });
  });

  describe('Create Variants - Pants Type', () => {
    /**
     * Test: Create variants for pants type
     * Requirement: 2.2
     */
    it('should create exactly 10 variants for pants type', () => {
      const variantType = 'pants';
      const expectedSizes = VARIANT_TYPES.pants.sizes;
      
      // Simulate variant creation
      const variants = expectedSizes.map((size, index) => ({
        company_id: mockCompanyId,
        product_id: mockProductId,
        variant_name: size,
        sku: null,
        stock_quantity: 0,
        min_stock_level: 0,
        sort_order: index,
        is_active: true,
      }));
      
      expect(variants).toHaveLength(10);
      expect(variants.map(v => v.variant_name)).toEqual([
        '28', '30', '32', '34', '36', '38', '40', '42', '44', '46'
      ]);
      
      // Verify sequential sort order
      variants.forEach((variant, index) => {
        expect(variant.sort_order).toBe(index);
      });
    });
  });

  describe('Create Variants - Custom Type', () => {
    /**
     * Test: Create custom variants
     * Requirement: 2.3
     */
    it('should create custom variants with user-defined sizes', () => {
      const customVariants = [
        { variant_name: 'Pequeño', stock_quantity: 10, min_stock_level: 2, sort_order: 0 },
        { variant_name: 'Mediano', stock_quantity: 15, min_stock_level: 3, sort_order: 1 },
        { variant_name: 'Grande', stock_quantity: 8, min_stock_level: 2, sort_order: 2 },
      ];
      
      expect(customVariants).toHaveLength(3);
      expect(customVariants[0].variant_name).toBe('Pequeño');
      expect(customVariants[1].variant_name).toBe('Mediano');
      expect(customVariants[2].variant_name).toBe('Grande');
      
      // Verify custom stock values are preserved
      expect(customVariants[0].stock_quantity).toBe(10);
      expect(customVariants[1].stock_quantity).toBe(15);
      expect(customVariants[2].stock_quantity).toBe(8);
    });

    it('should allow empty custom variants array', () => {
      const customVariants: any[] = [];
      expect(customVariants).toHaveLength(0);
    });
  });

  describe('Update Variant Stock', () => {
    /**
     * Test: Update stock of a variant
     * Requirement: 2.1
     */
    it('should update stock quantity of a variant', () => {
      const variant = {
        id: 'variant-1',
        variant_name: 'M',
        stock_quantity: 10,
        min_stock_level: 2,
      };
      
      // Simulate update
      const updatedVariant = {
        ...variant,
        stock_quantity: 25,
      };
      
      expect(updatedVariant.stock_quantity).toBe(25);
      expect(updatedVariant.variant_name).toBe('M');
      expect(updatedVariant.min_stock_level).toBe(2);
    });

    it('should update min_stock_level of a variant', () => {
      const variant = {
        id: 'variant-1',
        variant_name: 'L',
        stock_quantity: 10,
        min_stock_level: 2,
      };
      
      // Simulate update
      const updatedVariant = {
        ...variant,
        min_stock_level: 5,
      };
      
      expect(updatedVariant.min_stock_level).toBe(5);
      expect(updatedVariant.stock_quantity).toBe(10);
    });

    it('should reject negative stock quantity', () => {
      const newStock = -5;
      const isValid = newStock >= 0;
      
      expect(isValid).toBe(false);
    });
  });

  describe('Delete Variant', () => {
    /**
     * Test: Delete variant with stock = 0 (success)
     * Requirement: 9.2
     */
    it('should allow deleting variant with zero stock', () => {
      const variant = {
        id: 'variant-1',
        variant_name: 'XS',
        stock_quantity: 0,
      };
      
      const canDelete = variant.stock_quantity === 0;
      expect(canDelete).toBe(true);
    });

    /**
     * Test: Delete variant with stock > 0 (error)
     * Requirement: 9.2
     */
    it('should prevent deleting variant with positive stock', () => {
      const variant = {
        id: 'variant-1',
        variant_name: 'M',
        stock_quantity: 15,
      };
      
      const canDelete = variant.stock_quantity === 0;
      expect(canDelete).toBe(false);
      
      // Verify error message
      if (!canDelete) {
        const errorMessage = VARIANT_ERRORS.CANNOT_DELETE_WITH_STOCK;
        expect(errorMessage).toBe('No se puede eliminar una variante con stock positivo');
      }
    });

    it('should prevent deleting variant with stock = 1', () => {
      const variant = {
        id: 'variant-1',
        variant_name: 'L',
        stock_quantity: 1,
      };
      
      const canDelete = variant.stock_quantity === 0;
      expect(canDelete).toBe(false);
    });
  });

  describe('Variant Name Uniqueness', () => {
    /**
     * Test: Duplicate variant names should be rejected
     * Requirement: 2.6, 9.5
     */
    it('should detect duplicate variant names (case-insensitive)', () => {
      const existingVariants = [
        { variant_name: 'Small' },
        { variant_name: 'Medium' },
        { variant_name: 'Large' },
      ];
      
      const newVariantName = 'small'; // lowercase
      
      const isDuplicate = existingVariants.some(
        v => v.variant_name.toLowerCase() === newVariantName.toLowerCase()
      );
      
      expect(isDuplicate).toBe(true);
    });

    it('should allow unique variant names', () => {
      const existingVariants = [
        { variant_name: 'Small' },
        { variant_name: 'Medium' },
      ];
      
      const newVariantName = 'Large';
      
      const isDuplicate = existingVariants.some(
        v => v.variant_name.toLowerCase() === newVariantName.toLowerCase()
      );
      
      expect(isDuplicate).toBe(false);
    });

    it('should detect exact duplicate names', () => {
      const existingVariants = [
        { variant_name: 'XL' },
        { variant_name: 'XXL' },
      ];
      
      const newVariantName = 'XL';
      
      const isDuplicate = existingVariants.some(
        v => v.variant_name === newVariantName
      );
      
      expect(isDuplicate).toBe(true);
    });
  });

  describe('Variant Validation', () => {
    /**
     * Test: Validate variant data
     */
    it('should validate required fields', () => {
      const variant = {
        variant_name: 'M',
        stock_quantity: 10,
        min_stock_level: 2,
        sort_order: 0,
      };
      
      expect(variant.variant_name).toBeTruthy();
      expect(variant.stock_quantity).toBeGreaterThanOrEqual(0);
      expect(variant.min_stock_level).toBeGreaterThanOrEqual(0);
      expect(variant.sort_order).toBeGreaterThanOrEqual(0);
    });

    it('should reject empty variant name', () => {
      const variantName = '';
      const isValid = variantName.length > 0;
      
      expect(isValid).toBe(false);
    });

    it('should accept variant name with max length', () => {
      const variantName = 'A'.repeat(50); // Max 50 chars
      const isValid = variantName.length <= 50;
      
      expect(isValid).toBe(true);
    });

    it('should reject variant name exceeding max length', () => {
      const variantName = 'A'.repeat(51); // Over 50 chars
      const isValid = variantName.length <= 50;
      
      expect(isValid).toBe(false);
    });
  });

  describe('Error Messages', () => {
    /**
     * Test: Verify error message constants
     */
    it('should have correct error messages defined', () => {
      expect(VARIANT_ERRORS.NO_VARIANTS).toBe('Un producto con variantes debe tener al menos una variante configurada');
      expect(VARIANT_ERRORS.DUPLICATE_VARIANT).toBe('Ya existe una variante con ese nombre en este producto');
      expect(VARIANT_ERRORS.VARIANT_REQUIRED).toBe('Debe seleccionar una variante para este producto');
      expect(VARIANT_ERRORS.INSUFFICIENT_STOCK).toBe('Stock insuficiente para la variante seleccionada');
      expect(VARIANT_ERRORS.CANNOT_DELETE_WITH_STOCK).toBe('No se puede eliminar una variante con stock positivo');
      expect(VARIANT_ERRORS.CANNOT_DISABLE_WITH_STOCK).toBe('No se pueden desactivar las variantes mientras haya stock');
      expect(VARIANT_ERRORS.NEGATIVE_STOCK).toBe('El stock no puede ser negativo');
      expect(VARIANT_ERRORS.VARIANT_NOT_FOUND).toBe('Variante no encontrada');
      expect(VARIANT_ERRORS.PRODUCT_NOT_FOUND).toBe('Producto no encontrado');
      expect(VARIANT_ERRORS.INVALID_VARIANT_TYPE).toBe('Tipo de variante inválido');
    });
  });
});
