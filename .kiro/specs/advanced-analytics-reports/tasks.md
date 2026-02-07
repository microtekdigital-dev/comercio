# Implementation Plan: Advanced Analytics Reports

## Overview

This implementation plan breaks down the advanced analytics and reporting feature into discrete, incremental tasks. The approach follows a bottom-up strategy: first implementing the access control layer, then the data computation functions, then the UI components, and finally integrating everything together. Each task builds on previous work and includes validation through tests.

## Tasks

- [x] 1. Implement plan access control functions
  - [x] 1.1 Add canAccessAdvancedReports function to plan-limits.ts
    - Create function that checks if plan is Pro or Empresarial
    - Return object with allowed boolean and descriptive message
    - Follow existing pattern from canAccessPurchaseOrders
    - _Requirements: 4.1, 4.2, 4.7_
  
  - [x] 1.2 Add canAccessCompleteReports function to plan-limits.ts
    - Create function that checks if plan is Empresarial
    - Return object with allowed boolean and descriptive message
    - Follow existing pattern from canAccessPurchaseOrders
    - _Requirements: 4.3, 4.4, 4.7_
  
  - [ ]* 1.3 Write property test for canAccessAdvancedReports
    - **Property 6: canAccessAdvancedReports Function Correctness**
    - Generate random companies with different plan tiers
    - Verify Pro/Empresarial returns allowed=true
    - Verify Trial/Básico returns allowed=false with message
    - **Validates: Requirements 4.1, 4.2, 4.7**
  
  - [ ]* 1.4 Write property test for canAccessCompleteReports
    - **Property 7: canAccessCompleteReports Function Correctness**
    - Generate random companies with different plan tiers
    - Verify Empresarial returns allowed=true
    - Verify other plans return allowed=false with message
    - **Validates: Requirements 4.3, 4.4, 4.7**

- [x] 2. Implement advanced analytics data functions
  - [x] 2.1 Add getProfitMarginsByProduct function to analytics.ts
    - Query sale_items with product cost data
    - Calculate profit margin: ((revenue - cost) / revenue) * 100
    - Group by product_id and aggregate
    - Return sorted by profit margin descending
    - _Requirements: 6.1_
  
  - [x] 2.2 Add getProfitMarginsByCategory function to analytics.ts
    - Query sale_items joined with products and categories
    - Calculate aggregate profit margins per category
    - Return sorted by profit margin descending
    - _Requirements: 6.2_
  
  - [ ]* 2.3 Write property test for profit margin calculations
    - **Property 10: Profit Margin Calculation Correctness**
    - Generate random sales data with known revenue and costs
    - Verify calculated margin equals ((revenue - cost) / revenue) * 100
    - Test both product and category level calculations
    - **Validates: Requirements 6.1, 6.2**
  
  - [x] 2.4 Add getSalesTrends function to analytics.ts
    - Query sales data for current and previous period (month or year)
    - Calculate growth percentages
    - Return time series data with comparisons
    - _Requirements: 6.3, 6.4_
  
  - [ ]* 2.5 Write property test for sales trends calculations
    - **Property 11: Sales Trends Calculation Correctness**
    - Generate random sales data for two periods
    - Verify growth percentage equals ((current - previous) / previous) * 100
    - Test both month-over-month and year-over-year
    - **Validates: Requirements 6.3, 6.4**
  
  - [x] 2.6 Add getCustomerSegmentation function to analytics.ts
    - Query customer purchase history
    - Implement RFM analysis (Recency, Frequency, Monetary)
    - Segment customers and calculate metrics per segment
    - Return segments with counts and aggregated data
    - _Requirements: 6.5, 6.6_
  
  - [ ]* 2.7 Write property test for customer segmentation
    - **Property 12: Customer Segmentation Correctness**
    - Generate random customer purchase data
    - Verify customers are correctly grouped by RFM criteria
    - Verify segment metrics are correctly aggregated
    - **Validates: Requirements 6.5, 6.6**
  
  - [x] 2.8 Add getInventoryTurnover function to analytics.ts
    - Query products with sales and stock data
    - Calculate turnover rate: units_sold / average_inventory
    - Return products sorted by turnover rate
    - _Requirements: 6.7_
  
  - [ ]* 2.9 Write property test for inventory turnover calculations
    - **Property 13: Inventory Turnover Calculation Correctness**
    - Generate random inventory and sales data
    - Verify turnover rate equals units_sold / average_inventory
    - Test with various stock levels and sales volumes
    - **Validates: Requirements 6.7**

- [ ] 3. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement supplier and purchase order analytics
  - [x] 4.1 Add getSupplierPerformance function to analytics.ts
    - Check supplier access using canAccessSuppliers
    - Query purchase orders and supplier data
    - Calculate on-time delivery rate and average lead time
    - Return suppliers sorted by performance score
    - _Requirements: 6.8_
  
  - [ ]* 4.2 Write property test for supplier performance calculations
    - **Property 14: Supplier Performance Calculation Correctness**
    - Generate random purchase order data with delivery dates
    - Verify on-time rate equals (on_time_orders / total_orders) * 100
    - Verify average lead time is correctly calculated
    - **Validates: Requirements 6.8**
  
  - [x] 4.3 Add getPurchaseOrderAnalytics function to analytics.ts
    - Check purchase order access using canAccessPurchaseOrders
    - Query purchase orders with status and payment data
    - Calculate total spend, average order value, fulfillment rate
    - Return aggregated metrics and trends
    - _Requirements: 2.12_
  
  - [ ]* 4.4 Write unit tests for access-gated analytics functions
    - Test that supplier performance checks supplier access
    - Test that purchase order analytics checks PO access
    - Test that functions return empty/error when access denied
    - _Requirements: 2.11, 2.12_

- [x] 5. Implement complete reports data functions
  - [x] 5.1 Add getSalesForecast function to analytics.ts
    - Query at least 90 days of historical sales data
    - Implement simple moving average or linear regression
    - Generate forecast for specified number of days
    - Return forecast data with confidence intervals
    - _Requirements: 7.1, 7.8_
  
  - [ ]* 5.2 Write unit test for forecast data requirement
    - Test that function queries at least 90 days of data
    - Test that function returns error if insufficient data
    - _Requirements: 7.8_
  
  - [x] 5.3 Add getPredictiveAnalytics function to analytics.ts
    - Analyze historical patterns
    - Identify trending products, at-risk customers, seasonal patterns
    - Return insights and recommendations
    - _Requirements: 7.2_
  
  - [x] 5.4 Add getMultiCompanyReport function to analytics.ts
    - Validate user has access to all specified companies
    - Query aggregated data across companies
    - Return consolidated metrics and comparisons
    - _Requirements: 7.3_
  
  - [ ]* 5.5 Write property test for multi-company data isolation
    - **Property 15: Company Data Isolation (multi-company variant)**
    - Generate random company IDs and user access lists
    - Verify function only includes authorized companies
    - Verify no data leakage between companies
    - **Validates: Requirements 7.9**
  
  - [x] 5.6 Add executeCustomReport function to analytics.ts
    - Validate report configuration
    - Build dynamic query based on user-defined parameters
    - Execute query with proper filtering and aggregation
    - Return formatted results
    - _Requirements: 7.4_
  
  - [x] 5.7 Add exportReport function to analytics.ts
    - Check export access using canExportToExcel
    - Format data according to export type (PDF, Excel, CSV)
    - Generate file with proper headers and metadata
    - Return file buffer or download URL
    - _Requirements: 7.5, 7.6, 7.7_
  
  - [ ]* 5.8 Write property test for export metadata completeness
    - **Property 17: Export Metadata Completeness**
    - Generate random report data and export in all formats
    - Verify each export includes report name, company name, generation date
    - Verify date range and filters are included when applicable
    - **Validates: Requirements 7.10**

- [ ] 6. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement UI components
  - [x] 7.1 Create UpgradePrompt component
    - Create components/dashboard/analytics/upgrade-prompt.tsx
    - Accept props: currentPlan, requiredPlan, featureName, message
    - Render overlay with lock icon, badges, message, and upgrade button
    - Implement mobile-responsive layout
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  
  - [ ]* 7.2 Write property test for upgrade prompt content
    - **Property 8: Upgrade Prompt Content Completeness**
    - Generate random plan combinations and feature names
    - Verify rendered prompt contains required plan, current plan, and CTA button
    - Test with various prop combinations
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4**
  
  - [x] 7.3 Create AdvancedReports component
    - Create components/dashboard/analytics/advanced-reports.tsx
    - Implement tabs for profit margins, sales trends, customer segmentation, inventory turnover
    - Conditionally include supplier performance and PO analytics tabs
    - Use existing chart components (LineChart, BarChart, PieChart)
    - Implement loading states with skeletons
    - Handle errors with toast notifications
    - _Requirements: 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 2.11, 2.12_
  
  - [ ]* 7.4 Write property test for advanced reports content
    - **Property 3: Advanced Reports Content Completeness**
    - Generate random user with Pro/Empresarial plan
    - Verify all required report types are rendered
    - Verify conditional reports (supplier, PO) appear when access granted
    - **Validates: Requirements 2.4-2.12**
  
  - [x] 7.5 Create CompleteReports component
    - Create components/dashboard/analytics/complete-reports.tsx
    - Implement sections for predictive analytics, sales forecast, custom report builder
    - Implement multi-company consolidated view
    - Implement advanced filters (date range, categories, products)
    - Implement export buttons (PDF, Excel, CSV) with progress indicators
    - Use existing chart components
    - _Requirements: 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 3.11, 3.12, 3.13_
  
  - [ ]* 7.6 Write property test for complete reports content
    - **Property 5: Complete Reports Content Completeness**
    - Generate random user with Empresarial plan
    - Verify all required features are rendered
    - Verify export buttons for all formats are present
    - **Validates: Requirements 3.4-3.13**

- [x] 8. Refactor existing analytics page
  - [x] 8.1 Extract basic reports into separate component
    - Create components/dashboard/analytics/basic-reports.tsx
    - Move existing sales, profitability, inventory, cashflow, categories tabs
    - Ensure component works independently
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  
  - [ ]* 8.2 Write property test for basic reports universal access
    - **Property 1: Basic Reports Universal Access**
    - Generate random users with all plan tiers
    - Verify basic reports render for all users without plan validation
    - Verify no upgrade prompts appear for basic reports
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5**

- [x] 9. Integrate components into analytics page
  - [x] 9.1 Update app/dashboard/analytics/page.tsx
    - Add state for plan access (hasAdvancedAccess, hasCompleteAccess, currentPlan)
    - Add useEffect to check plan access on mount
    - Render BasicReports component (always visible)
    - Conditionally render AdvancedReports or UpgradePrompt based on access
    - Conditionally render CompleteReports or UpgradePrompt based on access
    - Implement loading states
    - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3_
  
  - [ ]* 9.2 Write property test for access control rendering
    - **Property 2: Advanced Reports Access Control**
    - Generate random users with different plan tiers
    - Verify Pro/Empresarial users see AdvancedReports
    - Verify Trial/Básico users see UpgradePrompt instead
    - **Validates: Requirements 2.1, 2.2, 2.3**
  
  - [ ]* 9.3 Write property test for complete reports access control
    - **Property 4: Complete Reports Access Control**
    - Generate random users with different plan tiers
    - Verify Empresarial users see CompleteReports
    - Verify other users see UpgradePrompt instead
    - **Validates: Requirements 3.1, 3.2, 3.3**
  
  - [ ]* 9.4 Write property test for unlocked sections rendering
    - **Property 9: Unlocked Sections Render Without Restrictions**
    - Generate random users with various plan tiers
    - Verify accessible sections render without UpgradePrompt overlays
    - Verify no access restrictions on unlocked content
    - **Validates: Requirements 5.5**

- [ ] 10. Implement data isolation and security
  - [ ]* 10.1 Write property test for company data isolation
    - **Property 15: Company Data Isolation**
    - Generate random companies and analytics data
    - Call each analytics function with different company IDs
    - Verify returned data only includes records for the specified company
    - Test all analytics functions (profit margins, trends, segmentation, etc.)
    - **Validates: Requirements 6.9, 7.9**
  
  - [ ]* 10.2 Write property test for plan-based data fetching
    - **Property 18: Plan-Based Data Fetching**
    - Generate random users with different plan tiers
    - Monitor API calls when analytics page loads
    - Verify only data for accessible report sections is fetched
    - Verify no queries for locked features
    - **Validates: Requirements 8.1**

- [x] 11. Implement error handling
  - [x] 11.1 Add error handling to all analytics functions
    - Wrap database queries in try-catch blocks
    - Log errors to server console with full details
    - Return user-friendly error messages
    - Handle missing data gracefully (return empty arrays, not errors)
    - _Requirements: 9.1, 9.2, 9.4, 9.6, 9.7_
  
  - [x] 11.2 Add timeout handling for long queries
    - Implement 10-second timeout for analytics queries
    - Return timeout error with user-friendly message
    - Suggest narrowing date range or filters
    - _Requirements: 8.7_
  
  - [x] 11.3 Add export error handling
    - Handle export failures with specific error messages
    - Display toast notifications for export errors
    - Allow retry on failure
    - Show UpgradePrompt if failure is due to plan restrictions
    - _Requirements: 9.5_
  
  - [ ]* 11.4 Write unit tests for error handling
    - Test error handling with missing data
    - Test timeout handling with slow queries
    - Test export failure scenarios
    - Test access denied scenarios
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_

- [ ] 12. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 13. Integration testing and polish
  - [x] 13.1 Test complete user flows
    - Test as Trial user: verify only basic reports visible
    - Test as Básico user: verify only basic reports visible
    - Test as Pro user: verify basic + advanced reports visible
    - Test as Empresarial user: verify all reports visible
    - Test upgrade prompts display correctly
    - Test all charts render with real data
    - _Requirements: All_
  
  - [x] 13.2 Verify mobile responsiveness
    - Test on mobile viewport (375px width)
    - Verify all report sections are readable
    - Verify charts are responsive
    - Verify upgrade prompts are mobile-friendly
    - Verify tabs work on mobile
    - _Requirements: 5.6, 5.7_
  
  - [x] 13.3 Performance testing
    - Test page load time with large datasets
    - Verify data fetching is optimized by plan tier
    - Verify charts render smoothly
    - Test with 1000+ products, customers, sales
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_
  
  - [ ]* 13.4 Write integration tests
    - Test complete analytics page rendering for each plan tier
    - Test data flow from database to UI
    - Test error scenarios end-to-end
    - Test export functionality end-to-end
    - _Requirements: All_

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The implementation follows a bottom-up approach: access control → data functions → UI components → integration
- All analytics functions must filter by company_id for data isolation
- All UI components must follow existing design patterns and be mobile-responsive
- Error handling must be comprehensive and user-friendly
