# Requirements Document

## Introduction

This document specifies the requirements for a detailed cash register closure report feature. The system already has a cash register closure feature that records daily/shift closures with sales totals by payment method, tracks cash counted vs expected, links to openings, includes supplier payments in cash, and shows sales count and amounts. This feature will add a comprehensive, printable/exportable report that provides detailed information about each closure for accounting and auditing purposes.

## Glossary

- **Cash_Register_Closure**: A record of a cash register closure containing sales totals, payment method breakdowns, and cash reconciliation
- **Cash_Register_Opening**: A record of a cash register opening containing initial cash amount and shift information
- **Report_Generator**: The system component that generates the detailed closure report
- **Print_Manager**: The system component that handles printing and exporting functionality
- **Company_Settings**: Configuration data including company information, logo, and branding
- **Sale**: A completed sales transaction with items, customer, and payment information
- **Cash_Movement**: A cash income or withdrawal transaction during a shift
- **Supplier_Payment**: A payment made to a supplier, potentially in cash

## Requirements

### Requirement 1: Display Comprehensive Closure Report

**User Story:** As a business owner or manager, I want to view a detailed closure report when I complete a cash register closure, so that I can review all financial activities of the shift before printing or exporting.

#### Acceptance Criteria

1. WHEN a user views a closure detail page, THE Report_Generator SHALL display a comprehensive report with all closure information
2. WHEN the report is displayed, THE Report_Generator SHALL include company branding (logo, name, address, tax ID)
3. WHEN the report is displayed, THE Report_Generator SHALL include closure header information (date, time, shift, closed by)
4. WHEN the report is displayed AND an opening is linked, THE Report_Generator SHALL include opening information (initial cash, opened by, opening time)
5. WHEN the report is displayed, THE Report_Generator SHALL include sales summary with total count and amount
6. WHEN the report is displayed, THE Report_Generator SHALL include payment method breakdown (cash, card, transfer, other)

### Requirement 2: Display Detailed Sales List

**User Story:** As an accountant, I want to see a detailed list of all sales included in the closure, so that I can verify individual transactions and reconcile accounts.

#### Acceptance Criteria

1. WHEN the report includes sales, THE Report_Generator SHALL display a table with all sales for the closure period
2. FOR EACH sale in the list, THE Report_Generator SHALL display sale number, customer name, total amount, and payment method
3. WHEN there are no sales in the closure period, THE Report_Generator SHALL display a message indicating no sales were recorded
4. WHEN displaying the sales list, THE Report_Generator SHALL order sales chronologically by sale date

### Requirement 3: Display Cash Movements

**User Story:** As a shift manager, I want to see all cash movements (income and withdrawals) during my shift, so that I can account for all cash flow beyond sales.

#### Acceptance Criteria

1. WHEN the closure has an associated opening, THE Report_Generator SHALL fetch and display all cash movements for that opening
2. FOR EACH cash movement, THE Report_Generator SHALL display movement type (income/withdrawal), amount, description, and timestamp
3. WHEN there are no cash movements, THE Report_Generator SHALL display a message indicating no movements were recorded
4. WHEN displaying cash movements, THE Report_Generator SHALL separate income from withdrawals visually

### Requirement 4: Display Supplier Payments

**User Story:** As a business owner, I want to see all supplier payments made in cash during the shift, so that I can track cash outflows to suppliers.

#### Acceptance Criteria

1. WHEN the report is generated, THE Report_Generator SHALL fetch all supplier payments in cash for the closure date
2. FOR EACH supplier payment, THE Report_Generator SHALL display supplier name, amount, payment method, and reference number
3. WHEN there are no supplier payments in cash, THE Report_Generator SHALL display a message indicating no payments were made
4. WHEN displaying supplier payments, THE Report_Generator SHALL only include payments with cash payment method

### Requirement 5: Display Cash Reconciliation

**User Story:** As a cashier, I want to see a complete cash reconciliation calculation, so that I can understand any discrepancies between expected and counted cash.

#### Acceptance Criteria

1. WHEN the report is displayed, THE Report_Generator SHALL calculate and display initial cash from opening
2. WHEN the report is displayed, THE Report_Generator SHALL display cash sales amount
3. WHEN the report is displayed, THE Report_Generator SHALL display supplier payments in cash as a deduction
4. WHEN the report is displayed, THE Report_Generator SHALL display cash movements income as an addition
5. WHEN the report is displayed, THE Report_Generator SHALL display cash movements withdrawals as a deduction
6. WHEN the report is displayed, THE Report_Generator SHALL calculate expected cash as: initial + cash_sales - supplier_payments + income - withdrawals
7. WHEN cash was counted, THE Report_Generator SHALL display the counted amount
8. WHEN cash was counted, THE Report_Generator SHALL calculate and display the difference (counted - expected)
9. WHEN the difference is negative, THE Report_Generator SHALL highlight it as a shortage
10. WHEN the difference is positive, THE Report_Generator SHALL highlight it as a surplus

### Requirement 6: Print Report

**User Story:** As a business owner, I want to print the closure report, so that I can keep physical records for accounting purposes.

#### Acceptance Criteria

1. WHEN a user clicks the print button, THE Print_Manager SHALL open the browser print dialog
2. WHEN printing, THE Print_Manager SHALL apply print-specific styles (A4 size, appropriate margins, hide UI elements)
3. WHEN printing, THE Print_Manager SHALL ensure all report sections fit properly on printed pages
4. WHEN printing, THE Print_Manager SHALL include page breaks at logical sections if content spans multiple pages

### Requirement 7: Export Report to PDF

**User Story:** As an accountant, I want to export the closure report to PDF, so that I can archive digital copies and share them via email.

#### Acceptance Criteria

1. WHEN a user clicks the export to PDF button, THE Print_Manager SHALL generate a PDF file of the report
2. WHEN generating PDF, THE Print_Manager SHALL use the same layout and styling as the print version
3. WHEN PDF generation is complete, THE Print_Manager SHALL trigger a download with filename format "cierre-caja-{closure_number}-{date}.pdf"
4. WHEN PDF generation fails, THE Print_Manager SHALL display an error message to the user

### Requirement 8: Display Notes and Signature Line

**User Story:** As a manager, I want to see any notes from the closure and have a signature line, so that I can add manual signatures for approval.

#### Acceptance Criteria

1. WHEN the closure has notes, THE Report_Generator SHALL display them in a dedicated section
2. WHEN the closure has no notes, THE Report_Generator SHALL not display the notes section
3. WHEN the report is displayed, THE Report_Generator SHALL include a signature line at the bottom
4. WHEN the report is displayed, THE Report_Generator SHALL include the name of the person who closed the register next to the signature line

### Requirement 9: Responsive Report Layout

**User Story:** As a user, I want the report to be readable on different screen sizes, so that I can review it on mobile devices before printing.

#### Acceptance Criteria

1. WHEN the report is viewed on a desktop screen, THE Report_Generator SHALL display all sections in a two-column layout where appropriate
2. WHEN the report is viewed on a mobile screen, THE Report_Generator SHALL display all sections in a single-column layout
3. WHEN the report is viewed on any screen size, THE Report_Generator SHALL ensure all text is readable without horizontal scrolling
4. WHEN printing or exporting, THE Report_Generator SHALL use the desktop layout regardless of viewing device

### Requirement 10: Access Report from Closure List

**User Story:** As a user, I want to access the detailed report from the closure list, so that I can review past closures easily.

#### Acceptance Criteria

1. WHEN viewing the cash register closures list, THE System SHALL provide a "View Report" action for each closure
2. WHEN a user clicks "View Report", THE System SHALL navigate to the closure detail page with the report displayed
3. WHEN viewing a closure report, THE System SHALL provide a "Back to List" navigation option
