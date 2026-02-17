# Implementation Plan: Detailed Cash Register Closure Report

## Overview

This implementation plan breaks down the cash register closure report feature into discrete coding tasks. The feature will add a comprehensive, printable/exportable report for cash register closures, following the pattern established by the existing InvoicePrint component.

## Tasks

- [x] 1. Install dependencies and set up report infrastructure
  - Install react-to-print library for PDF generation
  - Create base report component file structure
  - Set up print-specific CSS utilities
  - _Requirements: 6.1, 6.2, 7.1_

- [x] 2. Create server actions for fetching report data
  - [x] 2.1 Implement getSalesForClosure action
    - Fetch sales for closure date range
    - Filter by company_id and closure period
    - Include customer and payment information
    - Order sales chronologically
    - _Requirements: 2.1, 2.2, 2.4_
  
  - [x] 2.2 Implement getCashMovementsForOpening action
    - Fetch cash movements linked to opening_id
    - Include movement type, amount, description, timestamp
    - Order movements chronologically
    - _Requirements: 3.1, 3.2_
  
  - [x] 2.3 Implement getSupplierPaymentsForClosure action
    - Fetch supplier payments for closure date
    - Filter to cash payments only
    - Include supplier name and payment details
    - _Requirements: 4.1, 4.2, 4.4_
  
  - [x] 2.4 Implement getClosureReportData action
    - Fetch closure by ID
    - Fetch linked opening if exists
    - Fetch company settings for branding
    - Call all data fetching actions in parallel
    - Return complete report data structure
    - _Requirements: 1.1, 1.2, 1.4_

- [x] 3. Create CashClosureReport component
  - [x] 3.1 Create component structure with forwardRef
    - Define component props interface
    - Set up forwardRef for print functionality
    - Create main container with print-friendly styling
    - _Requirements: 1.1, 6.2_
  
  - [x] 3.2 Implement header section
    - Display company logo (if available)
    - Display company name, address, phone, email, tax ID
    - Apply responsive layout (two-column on desktop)
    - _Requirements: 1.2_
  
  - [x] 3.3 Implement closure information section
    - Display closure date and time
    - Display shift information
    - Display closed by name
    - _Requirements: 1.3_
  
  - [x] 3.4 Implement opening information section (conditional)
    - Check if opening exists
    - Display initial cash amount
    - Display opened by name and opening time
    - Show "Sin apertura vinculada" message if no opening
    - _Requirements: 1.4_
  
  - [x] 3.5 Implement sales summary section
    - Display total sales count
    - Display total sales amount
    - Display payment method breakdown (cash, card, transfer, other)
    - Apply responsive grid layout
    - _Requirements: 1.5, 1.6_
  
  - [x] 3.6 Implement detailed sales list table
    - Create table with columns: sale number, customer, amount, payment method
    - Map through sales array and render rows
    - Handle empty sales list with message
    - Apply table styling with borders and spacing
    - Use "Cliente General" for null customer names
    - _Requirements: 2.1, 2.2, 2.3_
  
  - [x] 3.7 Implement cash movements section
    - Check if opening exists and has movements
    - Create table for cash movements
    - Display movement type, amount, description, timestamp
    - Separate income and withdrawals visually (colors/icons)
    - Handle empty movements with message
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  
  - [x] 3.8 Implement supplier payments section
    - Create table for supplier payments
    - Display supplier name, amount, payment method, reference number
    - Use "N/A" for null reference numbers
    - Handle empty payments with message
    - _Requirements: 4.1, 4.2, 4.3_
  
  - [x] 3.9 Implement cash reconciliation section
    - Calculate initial cash from opening
    - Display cash sales from closure
    - Display supplier payments as deduction
    - Calculate and display cash movements income
    - Calculate and display cash movements withdrawals
    - Calculate expected cash using formula
    - Display cash counted (if available)
    - Calculate and display difference (if counted exists)
    - Highlight shortage (negative) in red
    - Highlight surplus (positive) in green
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 5.10_
  
  - [x] 3.10 Implement notes section (conditional)
    - Check if notes exist and are non-empty
    - Display notes in dedicated section
    - Don't render section if notes are null/empty
    - _Requirements: 8.1, 8.2_
  
  - [x] 3.11 Implement signature line section
    - Display signature line at bottom
    - Display closed by name next to signature line
    - Add spacing for manual signature
    - _Requirements: 8.3, 8.4_

- [x] 4. Create CashClosureReportActions component
  - [x] 4.1 Implement print functionality
    - Create print button with printer icon
    - Use window.print() to open browser print dialog
    - Add onClick handler
    - _Requirements: 6.1_
  
  - [x] 4.2 Implement PDF export functionality
    - Create export button with download icon
    - Set up useReactToPrint hook
    - Generate filename using pattern: cierre-caja-{number}-{date}.pdf
    - Handle export success with toast message
    - Handle export error with toast message
    - _Requirements: 7.1, 7.3, 7.4_
  
  - [x] 4.3 Style action buttons
    - Apply consistent button styling
    - Add icons to buttons
    - Make buttons responsive (stack on mobile)
    - Add no-print class to hide in print view
    - _Requirements: 6.2_

- [x] 5. Create closure detail page
  - [x] 5.1 Create page component at app/dashboard/cash-register/[id]/page.tsx
    - Set up dynamic route parameter
    - Fetch closure report data using getClosureReportData
    - Handle closure not found error
    - Pass data to report component
    - _Requirements: 1.1, 10.2_
  
  - [x] 5.2 Add page layout and navigation
    - Add page header with title
    - Add back to list button
    - Create ref for report component
    - Render CashClosureReportActions with ref
    - Render CashClosureReport with ref
    - _Requirements: 10.3_
  
  - [x] 5.3 Add error handling
    - Redirect to list if closure not found
    - Show error toast if data fetch fails
    - Handle missing company settings gracefully
    - Show warning if opening not found but expected
    - _Requirements: Error Handling section_

- [x] 6. Update cash register closures list page
  - [x] 6.1 Add "View Report" action to each closure row
    - Add button/link in actions column
    - Link to /dashboard/cash-register/[id]
    - Use eye icon or "Ver Informe" text
    - _Requirements: 10.1_
  
  - [x] 6.2 Update table columns if needed
    - Ensure closure_number is displayed
    - Ensure closure_date is displayed
    - Ensure actions column has sufficient width
    - _Requirements: 10.1_

- [x] 7. Add print-specific CSS styles
  - [x] 7.1 Create print media queries
    - Hide navigation and UI elements with .no-print class
    - Set A4 page size and margins
    - Prevent page breaks inside important sections
    - Force page breaks before major sections if needed
    - _Requirements: 6.2, 6.3, 6.4_
  
  - [x] 7.2 Add responsive styles for report
    - Two-column layout on desktop (md breakpoint)
    - Single-column layout on mobile
    - Always use desktop layout for print
    - Ensure no horizontal scrolling on any screen size
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [x] 8. Add utility functions
  - [x] 8.1 Create currency formatting function
    - Use Intl.NumberFormat with es-AR locale
    - Format as ARS currency
    - Use 2 decimal places
    - _Requirements: Error Handling section_
  
  - [x] 8.2 Create date formatting functions
    - Create formatDate for long date format
    - Create formatDateTime for date and time
    - Use es-AR locale
    - _Requirements: 1.3, 1.4_
  
  - [x] 8.3 Create PDF filename generation function
    - Accept closure number and date
    - Format date as YYYY-MM-DD
    - Return string: cierre-caja-{number}-{date}.pdf
    - _Requirements: 7.3_

- [ ] 9. Checkpoint - Test basic report rendering
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Add comprehensive error handling
  - [ ] 10.1 Handle data fetching errors
    - Add try-catch blocks in server actions
    - Return error objects with descriptive messages
    - Log errors to console for debugging
    - _Requirements: Error Handling section_
  
  - [ ] 10.2 Handle missing data gracefully
    - Use fallback values for null fields
    - Show appropriate empty state messages
    - Don't crash on missing optional data
    - _Requirements: Error Handling section_
  
  - [ ] 10.3 Add user-facing error messages
    - Show toast on PDF generation failure
    - Show toast on data fetch failure
    - Redirect with error message if closure not found
    - _Requirements: 7.4, Error Handling section_

- [ ]* 11. Write unit tests for report component
  - Test report renders with complete data
  - Test report renders with minimal data
  - Test report handles null customer names
  - Test report handles null reference numbers
  - Test report shows/hides notes section correctly
  - Test report shows/hides opening section correctly
  - _Requirements: All requirements_

- [ ]* 12. Write unit tests for calculation functions
  - Test cash reconciliation calculation
  - Test difference calculation with positive values
  - Test difference calculation with negative values
  - Test filename generation with various inputs
  - _Requirements: 5.6, 5.8, 7.3_

- [ ]* 13. Write unit tests for data filtering
  - Test supplier payments filter includes cash only
  - Test supplier payments filter excludes non-cash
  - Test sales ordering by date
  - _Requirements: 2.4, 4.4_

- [ ]* 14. Write property-based test for Property 1
  - **Property 1: Report displays all required closure information**
  - **Validates: Requirements 1.3, 1.5**
  - Generate random closures with complete data
  - Render report component
  - Verify all required fields present in output
  - Run 100 iterations

- [ ]* 15. Write property-based test for Property 2
  - **Property 2: Report displays company branding when available**
  - **Validates: Requirements 1.2**
  - Generate random company settings
  - Render report component
  - Verify all non-null branding fields present
  - Run 100 iterations

- [ ]* 16. Write property-based test for Property 3
  - **Property 3: Report displays opening information when linked**
  - **Validates: Requirements 1.4**
  - Generate random closures with openings
  - Render report component
  - Verify opening information present
  - Run 100 iterations

- [ ]* 17. Write property-based test for Property 4
  - **Property 4: Report displays all sales in chronological order**
  - **Validates: Requirements 2.1, 2.2, 2.4**
  - Generate random sales lists with various dates
  - Render report component
  - Verify all sales present and ordered correctly
  - Run 100 iterations

- [ ]* 18. Write property-based test for Property 5
  - **Property 5: Report displays all cash movements with correct categorization**
  - **Validates: Requirements 3.1, 3.2**
  - Generate random cash movements
  - Render report component
  - Verify all movements present with correct data
  - Run 100 iterations

- [ ]* 19. Write property-based test for Property 6
  - **Property 6: Report filters supplier payments to cash only**
  - **Validates: Requirements 4.1, 4.4**
  - Generate random supplier payments with various methods
  - Render report component
  - Verify only cash payments included
  - Run 100 iterations

- [ ]* 20. Write property-based test for Property 7
  - **Property 7: Report displays all supplier payment details**
  - **Validates: Requirements 4.2**
  - Generate random supplier payments
  - Render report component
  - Verify all payment details present
  - Run 100 iterations

- [ ]* 21. Write property-based test for Property 8
  - **Property 8: Cash reconciliation calculation is correct**
  - **Validates: Requirements 5.6**
  - Generate random closure/opening/movements data
  - Calculate expected cash
  - Verify calculation matches formula
  - Run 100 iterations

- [ ]* 22. Write property-based test for Property 9
  - **Property 9: Cash difference calculation is correct when counted**
  - **Validates: Requirements 5.8**
  - Generate random closures with cash_counted
  - Calculate difference
  - Verify calculation is correct
  - Run 100 iterations

- [ ]* 23. Write property-based test for Property 10
  - **Property 10: Report displays notes when present**
  - **Validates: Requirements 8.1**
  - Generate random closures with notes
  - Render report component
  - Verify notes section present
  - Run 100 iterations

- [ ]* 24. Write property-based test for Property 11
  - **Property 11: Report hides notes section when absent**
  - **Validates: Requirements 8.2**
  - Generate random closures without notes
  - Render report component
  - Verify notes section absent
  - Run 100 iterations

- [ ]* 25. Write property-based test for Property 12
  - **Property 12: Report displays signature line with closer name**
  - **Validates: Requirements 8.3, 8.4**
  - Generate random closures
  - Render report component
  - Verify signature line with closer name present
  - Run 100 iterations

- [ ]* 26. Write property-based test for Property 13
  - **Property 13: PDF filename follows correct format**
  - **Validates: Requirements 7.3**
  - Generate random closures
  - Generate PDF filename
  - Verify format matches pattern
  - Run 100 iterations

- [ ]* 27. Write property-based test for Property 14
  - **Property 14: Closure list provides report access**
  - **Validates: Requirements 10.1**
  - Generate random closures list
  - Render list component
  - Verify each has report link
  - Run 100 iterations

- [ ] 28. Final checkpoint - Integration testing
  - Test complete flow: navigate to closure detail → view report → print
  - Test complete flow: navigate to closure detail → view report → export PDF
  - Test navigation from closures list to report and back
  - Verify all report sections display correctly
  - Verify print styling works correctly
  - Verify PDF export works correctly
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The react-to-print library handles PDF generation automatically
- Print styling uses CSS media queries for browser compatibility
- All monetary values use consistent currency formatting
- All dates use Spanish locale formatting
- The component follows the same pattern as InvoicePrint for consistency
