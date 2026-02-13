# Implementation Plan: Product Image Placeholder

## Overview

Este plan implementa un sistema centralizado para manejar imágenes de productos con soporte automático para placeholders. La implementación se realizará en fases incrementales, comenzando con el componente core y luego integrándolo en todas las páginas que muestran productos.

## Tasks

- [x] 1. Create ProductImage component with validation logic
  - Create `components/dashboard/product-image.tsx` with TypeScript
  - Implement `isValidImageUrl` validation function to detect null, empty, and whitespace-only URLs
  - Implement ProductImage component with error handling using React state
  - Add Next.js Image integration with onError callback
  - Support all Next.js Image props (fill, width, height, sizes, priority, className)
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 5.1, 5.2, 5.3_

- [ ]* 1.1 Write property test for invalid URL detection
  - **Property 1: Invalid Image URL Detection**
  - **Validates: Requirements 1.1, 1.2, 1.3**

- [ ]* 1.2 Write property test for placeholder rendering
  - **Property 2: Placeholder Rendering for Missing Images**
  - **Validates: Requirements 2.1, 2.3**

- [ ]* 1.3 Write property test for valid image rendering
  - **Property 3: Actual Image Rendering for Valid URLs**
  - **Validates: Requirements 2.2**

- [ ]* 1.4 Write property test for error handling
  - **Property 4: Error Handling with Placeholder Fallback**
  - **Validates: Requirements 5.1, 5.2, 5.3**

- [ ]* 1.5 Write unit tests for ProductImage component
  - Test null image_url renders placeholder
  - Test empty string renders placeholder
  - Test whitespace-only string renders placeholder
  - Test valid URL renders actual image
  - Test image load error triggers placeholder
  - Test component doesn't throw on errors
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 5.1, 5.3_

- [x] 2. Integrate ProductImage in products listing page
  - Update `app/dashboard/products/page.tsx`
  - Replace existing conditional image rendering with ProductImage component
  - Remove the `{product.image_url && ...}` conditional wrapper
  - Pass appropriate props: imageUrl, productName, fill, className, sizes
  - Ensure grid layout and styling remain consistent
  - _Requirements: 2.1, 2.2, 2.3, 3.1_

- [ ]* 2.1 Write integration test for products listing page
  - Test products without images show placeholder
  - Test products with images show actual images
  - Test mixed list of products renders correctly
  - _Requirements: 3.1_

- [ ] 3. Integrate ProductImage in product details page
  - Update `app/dashboard/products/[id]/page.tsx`
  - Replace existing image rendering with ProductImage component
  - Handle both view and edit modes
  - Maintain existing ImageUpload component for editing
  - _Requirements: 2.1, 2.2, 2.3, 3.2_

- [ ] 4. Integrate ProductImage in sales form
  - Update `app/dashboard/sales/new/page.tsx`
  - Add ProductImage component to product selection items
  - Display small thumbnail next to product name in dropdown or item list
  - Ensure responsive sizing for mobile views
  - _Requirements: 2.1, 2.2, 2.3, 3.3_

- [ ] 5. Integrate ProductImage in purchase orders form
  - Update `app/dashboard/purchase-orders/new/page.tsx`
  - Add ProductImage component to product selection items
  - Display small thumbnail next to product name
  - Maintain consistent styling with sales form
  - _Requirements: 2.1, 2.2, 2.3, 3.4_

- [ ] 6. Integrate ProductImage in quotes form
  - Update `app/dashboard/quotes/new/quote-form.tsx`
  - Add ProductImage component to product selection items
  - Display small thumbnail next to product name
  - Ensure consistent behavior with other forms
  - _Requirements: 2.1, 2.2, 2.3, 3.5_

- [ ] 7. Checkpoint - Verify all integrations
  - Test all pages manually to ensure placeholders appear correctly
  - Verify products with images still display correctly
  - Check responsive behavior on mobile and desktop
  - Ensure no console errors or warnings
  - Ask the user if questions arise

- [ ]* 8. Write end-to-end integration tests
  - Test placeholder consistency across all pages
  - Test navigation between pages maintains correct image display
  - Test error scenarios don't break page functionality
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 9. Final checkpoint - Ensure all tests pass
  - Run all unit tests and verify they pass
  - Run all property tests and verify they pass
  - Run all integration tests and verify they pass
  - Ensure no regressions in existing functionality
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- The ProductImage component is the core of this feature and must be implemented first
- Integration tasks can be done in parallel after the component is complete
- Each integration maintains existing functionality while adding placeholder support
- Property tests use fast-check library with minimum 100 iterations
- All tests reference specific requirements for traceability
