# Implementation Plan: Price History System

## Overview

This implementation plan breaks down the price history system into discrete coding tasks. The system will automatically track all price changes (sale price and cost price) for products, storing complete audit information including who made the change, when, and optionally why. The implementation follows the established patterns from the stock history system.

## Tasks

- [x] 1. Create database schema and trigger
  - Create `scripts/150_create_price_history.sql` migration file
  - Define `price_changes` table with all required columns and constraints
  - Create indexes for performance (company_id, product_id, changed_by, created_at, price_type)
  - Implement RLS policies (SELECT for company users, prevent UPDATE, DELETE for admins only)
  - Create `log_price_change()` trigger function to automatically log price changes
  - Create trigger on `products` table to fire on UPDATE
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 4.1, 4.2_

- [x] 2. Add TypeScript type definitions
  - Add `PriceChange` interface to `lib/types/erp.ts`
  - Add `PriceChangeFilters` interface for query filtering
  - Add `PriceChangeFormData` interface for price updates
  - Ensure types match database schema exactly
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1_

- [ ] 3. Implement server actions for price changes
  - [x] 3.1 Create `lib/actions/price-changes.ts` file
    - Implement `getPriceChanges(filters?)` function with support for all filters
    - Implement `getProductPriceHistory(productId)` function
    - Implement `updateProductPrice(productId, formData)` function
    - Add comprehensive JSDoc documentation for all functions
    - Include proper error handling and validation
    - _Requirements: 1.1, 1.2, 2.1, 2.2, 2.3, 3.1, 3.2, 3.4, 3.5, 3.6, 3.7, 5.1, 5.3_

  - [ ]* 3.2 Write property test for sale price change recording
    - **Property 1: Sale Price Change Recording**
    - **Validates: Requirements 1.1**

  - [ ]* 3.3 Write property test for cost price change recording
    - **Property 2: Cost Price Change Recording**
    - **Validates: Requirements 1.2**

  - [ ]* 3.4 Write property test for timestamp recording
    - **Property 3: Timestamp Recording**
    - **Validates: Requirements 1.3**

  - [ ]* 3.5 Write property test for employee attribution
    - **Property 4: Employee Attribution**
    - **Validates: Requirements 1.4**

  - [ ]* 3.6 Write property test for dual price change recording
    - **Property 5: Dual Price Change Recording**
    - **Validates: Requirements 1.5**

  - [ ]* 3.7 Write unit tests for price change server actions
    - Test error cases (invalid product, negative price, same price)
    - Test edge cases (empty employee name, deleted employee)
    - Test reason field handling (with and without reason)
    - _Requirements: 2.1, 2.2, 2.3_

- [ ] 4. Implement filtering functionality
  - [x] 4.1 Add filter support to `getPriceChanges()`
    - Implement product ID filter
    - Implement employee ID filter
    - Implement date range filter (dateFrom, dateTo)
    - Implement price type filter (sale_price, cost_price)
    - Ensure filters can be combined
    - _Requirements: 3.4, 3.5, 3.6, 3.7_

  - [ ]* 4.2 Write property test for product filtering
    - **Property 11: Product Filtering**
    - **Validates: Requirements 3.4**

  - [ ]* 4.3 Write property test for employee filtering
    - **Property 12: Employee Filtering**
    - **Validates: Requirements 3.5**

  - [ ]* 4.4 Write property test for date range filtering
    - **Property 13: Date Range Filtering**
    - **Validates: Requirements 3.6**

  - [ ]* 4.5 Write property test for price type filtering
    - **Property 14: Price Type Filtering**
    - **Validates: Requirements 3.7**

- [ ] 5. Checkpoint - Ensure database and server actions work correctly
  - Run the migration script to create the table and trigger
  - Test that price changes are automatically logged when updating products
  - Verify all filters work correctly
  - Ensure all tests pass, ask the user if questions arise

- [ ] 6. Implement CSV export functionality
  - [x] 6.1 Add `exportPriceChangesToCSV(filters?)` function
    - Generate CSV with all required columns
    - Respect filters when exporting
    - Use proper CSV formatting (escape commas, quotes)
    - Include headers row
    - _Requirements: 8.1, 8.2, 8.3_

  - [ ]* 6.2 Write property test for CSV export column completeness
    - **Property 21: CSV Export Column Completeness**
    - **Validates: Requirements 8.2**

  - [ ]* 6.3 Write property test for CSV export filter respect
    - **Property 22: CSV Export Filter Respect**
    - **Validates: Requirements 8.3**

  - [ ]* 6.4 Write unit tests for CSV export
    - Test CSV format is valid
    - Test special characters are escaped
    - Test empty results
    - _Requirements: 8.1_

- [ ] 7. Create global price history UI component
  - [x] 7.1 Create `components/dashboard/price-history-table.tsx`
    - Display all price changes in a table
    - Show product name, price type, old/new values, employee, date, reason
    - Implement filter controls (product, employee, date range, price type)
    - Add export to CSV button
    - Format prices with currency symbol and two decimals
    - Implement pagination for large datasets
    - _Requirements: 3.1, 3.2, 3.4, 3.5, 3.6, 3.7, 7.1, 7.2, 7.3, 8.1_

  - [ ]* 7.2 Write unit tests for price history table component
    - Test rendering with data
    - Test empty state
    - Test filter interactions
    - Test export button
    - _Requirements: 3.1, 3.2_

- [x] 8. Create global price history page
  - Create `app/dashboard/price-history/page.tsx`
  - Use `PriceHistoryTable` component
  - Add page title and description
  - Ensure proper authentication and authorization
  - _Requirements: 3.1, 3.2, 3.3_

- [ ] 9. Create product-specific price history component
  - [x] 9.1 Create `components/dashboard/product-price-history.tsx`
    - Display price history for a specific product
    - Show both sale price and cost price changes
    - Order by date descending
    - Format prices consistently
    - Show employee information and reason
    - _Requirements: 5.1, 5.2, 5.3, 6.1, 6.2, 7.1, 7.2, 7.3_

  - [ ]* 9.2 Write property test for product history completeness
    - **Property 17: Product History Completeness**
    - **Validates: Requirements 5.1**

  - [ ]* 9.3 Write property test for product history includes both types
    - **Property 18: Product History Includes Both Types**
    - **Validates: Requirements 5.3**

  - [ ]* 9.4 Write unit tests for product price history component
    - Test rendering with mixed price types
    - Test empty state
    - Test chronological ordering
    - _Requirements: 5.1, 5.2, 5.3_

- [x] 10. Integrate price history into product detail page
  - Modify `app/dashboard/products/[id]/page.tsx`
  - Add price history section using `ProductPriceHistory` component
  - Place below product details
  - _Requirements: 5.1_

- [ ] 11. Add optional reason field to product update form
  - Modify product update form to include optional "Reason for price change" field
  - Only show when price or cost is being changed
  - Pass reason to `updateProduct()` function
  - _Requirements: 2.1, 2.2, 2.3_

- [ ] 12. Implement immutability and deletion protection
  - [ ] 12.1 Verify RLS policies prevent updates
    - Test that UPDATE operations are rejected
    - _Requirements: 4.1_

  - [ ]* 12.2 Write property test for change immutability
    - **Property 15: Change Immutability**
    - **Validates: Requirements 4.1**

  - [ ] 12.3 Verify RLS policies allow admin deletion only
    - Test that non-admin DELETE operations are rejected
    - Test that admin DELETE operations succeed
    - _Requirements: 4.2_

  - [ ]* 12.4 Write property test for change deletion protection
    - **Property 16: Change Deletion Protection**
    - **Validates: Requirements 4.2**

- [ ] 13. Implement employee information preservation
  - [ ] 13.1 Verify trigger captures employee name and role
    - Test that changed_by_name uses full_name or falls back to email
    - Test that changed_by_role is captured correctly
    - _Requirements: 6.1, 6.2_

  - [ ]* 13.2 Write property test for employee information completeness
    - **Property 19: Employee Information Completeness**
    - **Validates: Requirements 6.1, 6.2**

  - [ ]* 13.3 Write property test for employee information preservation
    - **Property 20: Employee Information Preservation**
    - **Validates: Requirements 6.3**

  - [ ]* 13.4 Write unit tests for employee information handling
    - Test with deleted employee
    - Test with employee without full_name
    - Test role preservation
    - _Requirements: 6.1, 6.2, 6.3_

- [ ] 14. Add navigation link to price history page
  - Add "Price History" link to dashboard navigation menu
  - Place near "Stock History" or "Products" section
  - Ensure proper permissions check

- [ ] 15. Final checkpoint - End-to-end testing
  - Create a test product
  - Update its sale price and verify change is logged
  - Update its cost price and verify change is logged
  - Update both prices simultaneously and verify two changes are logged
  - View global price history and verify all changes appear
  - View product-specific history and verify changes appear
  - Test all filters work correctly
  - Test CSV export works correctly
  - Verify employee information is preserved
  - Verify changes cannot be modified or deleted (except by admin)
  - Ensure all tests pass, ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The implementation follows patterns from the stock history system for consistency
- Database trigger automatically logs changes, no manual logging needed in application code
- All prices are stored with 2 decimal precision
- Currency formatting is handled in the UI layer using company settings
