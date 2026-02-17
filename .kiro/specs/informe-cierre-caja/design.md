# Design Document: Detailed Cash Register Closure Report

## Overview

This feature adds a comprehensive, printable/exportable report for cash register closures. The report will display all relevant information about a closure including company branding, sales details, cash movements, supplier payments, and cash reconciliation. Users will be able to print the report directly or export it to PDF for archiving and sharing.

The implementation will follow the existing pattern established by the InvoicePrint component, creating a new CashClosureReport component with similar print-friendly styling and export capabilities.

## Architecture

### Component Structure

```
app/dashboard/cash-register/
  └── [id]/
      └── page.tsx                    # Closure detail page with report
components/dashboard/
  └── cash-closure-report.tsx         # Main report component (forwardRef for printing)
  └── cash-closure-report-actions.tsx # Print and export buttons
lib/actions/
  └── cash-register.ts                # Extended with new data fetching functions
  └── cash-movements.ts               # Fetch movements for opening
```

### Data Flow

1. User navigates to closure detail page (`/dashboard/cash-register/[id]`)
2. Page fetches closure data, related opening, sales, cash movements, supplier payments, and company settings
3. CashClosureReport component receives all data as props
4. User can print (browser dialog) or export to PDF (using react-to-print library)
5. Report uses print-specific CSS for proper formatting

## Components and Interfaces

### CashClosureReport Component

```typescript
interface CashClosureReportProps {
  closure: CashRegisterClosure;
  opening?: CashRegisterOpening | null;
  sales: Sale[];
  cashMovements: CashMovement[];
  supplierPayments: SupplierPayment[];
  companyInfo: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    taxId?: string;
    logoUrl?: string;
  };
}

export const CashClosureReport = forwardRef<HTMLDivElement, CashClosureReportProps>(
  ({ closure, opening, sales, cashMovements, supplierPayments, companyInfo }, ref) => {
    // Component implementation
  }
);
```

The component will be structured with the following sections:

1. **Header**: Company logo, name, address, tax ID
2. **Closure Information**: Date, time, shift, closed by
3. **Opening Information** (if linked): Initial cash, opened by, opening time
4. **Sales Summary**: Total count, total amount, breakdown by payment method
5. **Detailed Sales List**: Table with sale number, customer, amount, payment method
6. **Cash Movements**: Income and withdrawals during the shift
7. **Supplier Payments**: Cash payments to suppliers
8. **Cash Reconciliation**: Calculation showing expected vs counted cash
9. **Notes**: Any notes from the closure
10. **Signature Line**: For manual approval

### CashClosureReportActions Component

```typescript
interface CashClosureReportActionsProps {
  closureNumber: string;
  closureDate: string;
  reportRef: React.RefObject<HTMLDivElement>;
}

export function CashClosureReportActions({
  closureNumber,
  closureDate,
  reportRef
}: CashClosureReportActionsProps) {
  // Handles print and PDF export
}
```

This component will provide:
- Print button (opens browser print dialog)
- Export to PDF button (generates and downloads PDF)

### New Server Actions

```typescript
// In lib/actions/cash-register.ts

// Get sales for a closure period
export async function getSalesForClosure(
  companyId: string,
  closureDate: string,
  lastClosureTime?: string | null
): Promise<Sale[]>

// Get cash movements for an opening
export async function getCashMovementsForOpening(
  openingId: string
): Promise<CashMovement[]>

// Get supplier payments for closure date (cash only)
export async function getSupplierPaymentsForClosure(
  companyId: string,
  closureDate: string,
  lastClosureTime?: string | null
): Promise<SupplierPayment[]>

// Get complete closure report data
export async function getClosureReportData(
  closureId: string
): Promise<{
  closure: CashRegisterClosure;
  opening: CashRegisterOpening | null;
  sales: Sale[];
  cashMovements: CashMovement[];
  supplierPayments: SupplierPayment[];
  companyInfo: CompanyInfo;
}>
```

## Data Models

### Extended Types

No new database tables are needed. The feature uses existing types:

- `CashRegisterClosure` - Main closure data
- `CashRegisterOpening` - Opening data (if linked)
- `Sale` - Sales transactions
- `CashMovement` - Cash income/withdrawals
- `SupplierPayment` - Payments to suppliers
- `CompanySettings` - Company branding information

### Calculated Fields

The report will calculate several derived values:

```typescript
interface CashReconciliation {
  initialCash: number;           // From opening
  cashSales: number;             // From closure
  supplierPaymentsCash: number;  // From closure
  cashMovementsIncome: number;   // Sum of income movements
  cashMovementsWithdrawals: number; // Sum of withdrawal movements
  expectedCash: number;          // Calculated
  cashCounted: number | null;    // From closure
  difference: number | null;     // Calculated if counted exists
}

// Calculation:
// expectedCash = initialCash + cashSales - supplierPaymentsCash + cashMovementsIncome - cashMovementsWithdrawals
// difference = cashCounted - expectedCash (if cashCounted is not null)
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Report displays all required closure information

*For any* closure with complete data, rendering the report should include closure date, shift, closed by name, sales count, and sales amount in the output.

**Validates: Requirements 1.3, 1.5**

### Property 2: Report displays company branding when available

*For any* company settings with branding information, rendering the report should include all non-null branding fields (name, logo, address, tax ID, phone, email) in the output.

**Validates: Requirements 1.2**

### Property 3: Report displays opening information when linked

*For any* closure with a linked opening, rendering the report should include the opening's initial cash amount, opened by name, and opening date in the output.

**Validates: Requirements 1.4**

### Property 4: Report displays all sales in chronological order

*For any* list of sales, rendering the sales table should include all sales ordered by sale_date ascending, with each sale showing sale number, customer name (or "Cliente General"), total amount, and payment method.

**Validates: Requirements 2.1, 2.2, 2.4**

### Property 5: Report displays all cash movements with correct categorization

*For any* list of cash movements, rendering the movements section should include all movements with each showing type (income/withdrawal), amount, description, and timestamp.

**Validates: Requirements 3.1, 3.2**

### Property 6: Report filters supplier payments to cash only

*For any* list of supplier payments, rendering the supplier payments section should only include payments where payment_method contains "efectivo" or "cash" (case-insensitive).

**Validates: Requirements 4.1, 4.4**

### Property 7: Report displays all supplier payment details

*For any* supplier payment in cash, rendering the payment should include supplier name, amount, payment method, and reference number (or "N/A" if null).

**Validates: Requirements 4.2**

### Property 8: Cash reconciliation calculation is correct

*For any* closure with opening and cash movements data, the calculated expected cash should equal: opening.initial_cash_amount + closure.cash_sales - closure.supplier_payments_cash + sum(income_movements) - sum(withdrawal_movements).

**Validates: Requirements 5.6**

### Property 9: Cash difference calculation is correct when counted

*For any* closure where cash_counted is not null, the calculated difference should equal: cash_counted - expected_cash.

**Validates: Requirements 5.8**

### Property 10: Report displays notes when present

*For any* closure with non-null notes, rendering the report should include a notes section containing the notes text.

**Validates: Requirements 8.1**

### Property 11: Report hides notes section when absent

*For any* closure with null or empty notes, rendering the report should not include a notes section.

**Validates: Requirements 8.2**

### Property 12: Report displays signature line with closer name

*For any* closure, rendering the report should include a signature line section containing the closed_by_name field.

**Validates: Requirements 8.3, 8.4**

### Property 13: PDF filename follows correct format

*For any* closure, generating a PDF filename should produce a string matching the pattern "cierre-caja-{closure_number}-{date}.pdf" where date is in YYYY-MM-DD format.

**Validates: Requirements 7.3**

### Property 14: Closure list provides report access

*For any* closure in the closures list, the rendered row should include a "View Report" action that links to `/dashboard/cash-register/{closure.id}`.

**Validates: Requirements 10.1**

## Error Handling

### Data Fetching Errors

- If closure is not found, redirect to closures list with error message
- If company settings are not found, use default company name "Mi Empresa"
- If opening is not found but closure has opening_id, show warning message
- If sales/movements/payments fetch fails, show empty state with error message

### Print/Export Errors

- If browser print dialog is cancelled, no action needed (user choice)
- If PDF generation fails, show toast error message: "Error al generar PDF. Intente nuevamente."
- If PDF download fails, show toast error message: "Error al descargar PDF. Verifique su navegador."

### Data Validation

- Ensure all monetary amounts are formatted correctly (2 decimal places)
- Handle null/undefined values gracefully with fallbacks:
  - Customer name: "Cliente General"
  - Reference number: "N/A"
  - Notes: Don't show section
  - Opening: Show message "Sin apertura vinculada"

## Testing Strategy

### Unit Tests

Unit tests will focus on specific examples and edge cases:

1. **Component Rendering**:
   - Test report renders with complete data
   - Test report renders with minimal data (no opening, no sales, no movements)
   - Test report renders with null customer names
   - Test report renders with null reference numbers

2. **Calculation Functions**:
   - Test cash reconciliation with various combinations of values
   - Test difference calculation with positive and negative differences
   - Test filename generation with various closure numbers and dates

3. **Data Filtering**:
   - Test supplier payments filter includes only cash payments
   - Test supplier payments filter excludes card/transfer payments
   - Test sales ordering by date

4. **Error Handling**:
   - Test behavior when closure not found
   - Test behavior when PDF generation fails
   - Test behavior with missing company settings

### Property-Based Tests

Property-based tests will verify universal properties across randomized inputs. Each test should run a minimum of 100 iterations.

1. **Property 1 Test**: Generate random closures with complete data, render report, verify all required fields present
   - **Tag**: Feature: informe-cierre-caja, Property 1: Report displays all required closure information

2. **Property 2 Test**: Generate random company settings, render report, verify all non-null branding fields present
   - **Tag**: Feature: informe-cierre-caja, Property 2: Report displays company branding when available

3. **Property 3 Test**: Generate random closures with openings, render report, verify opening information present
   - **Tag**: Feature: informe-cierre-caja, Property 3: Report displays opening information when linked

4. **Property 4 Test**: Generate random sales lists, render report, verify all sales present and ordered correctly
   - **Tag**: Feature: informe-cierre-caja, Property 4: Report displays all sales in chronological order

5. **Property 5 Test**: Generate random cash movements, render report, verify all movements present with correct data
   - **Tag**: Feature: informe-cierre-caja, Property 5: Report displays all cash movements with correct categorization

6. **Property 6 Test**: Generate random supplier payments with various methods, render report, verify only cash payments included
   - **Tag**: Feature: informe-cierre-caja, Property 6: Report filters supplier payments to cash only

7. **Property 7 Test**: Generate random supplier payments, render report, verify all payment details present
   - **Tag**: Feature: informe-cierre-caja, Property 7: Report displays all supplier payment details

8. **Property 8 Test**: Generate random closure/opening/movements data, calculate expected cash, verify calculation matches formula
   - **Tag**: Feature: informe-cierre-caja, Property 8: Cash reconciliation calculation is correct

9. **Property 9 Test**: Generate random closures with cash_counted, calculate difference, verify calculation is correct
   - **Tag**: Feature: informe-cierre-caja, Property 9: Cash difference calculation is correct when counted

10. **Property 10 Test**: Generate random closures with notes, render report, verify notes section present
    - **Tag**: Feature: informe-cierre-caja, Property 10: Report displays notes when present

11. **Property 11 Test**: Generate random closures without notes, render report, verify notes section absent
    - **Tag**: Feature: informe-cierre-caja, Property 11: Report hides notes section when absent

12. **Property 12 Test**: Generate random closures, render report, verify signature line with closer name present
    - **Tag**: Feature: informe-cierre-caja, Property 12: Report displays signature line with closer name

13. **Property 13 Test**: Generate random closures, generate PDF filename, verify format matches pattern
    - **Tag**: Feature: informe-cierre-caja, Property 13: PDF filename follows correct format

14. **Property 14 Test**: Generate random closures list, render list, verify each has report link
    - **Tag**: Feature: informe-cierre-caja, Property 14: Closure list provides report access

### Integration Tests

- Test complete flow: navigate to closure detail → view report → print
- Test complete flow: navigate to closure detail → view report → export PDF
- Test navigation from closures list to report and back

### Property-Based Testing Library

For TypeScript/React, we will use **fast-check** as the property-based testing library. Fast-check integrates well with Jest and provides excellent support for generating complex data structures.

```bash
npm install --save-dev fast-check @types/fast-check
```

## Implementation Notes

### Print Styling

The report will use CSS media queries for print-specific styling:

```css
@media print {
  /* Hide navigation, buttons, and other UI elements */
  .no-print {
    display: none !important;
  }
  
  /* Set page size and margins */
  @page {
    size: A4;
    margin: 2cm;
  }
  
  /* Prevent page breaks inside important sections */
  .avoid-break {
    page-break-inside: avoid;
  }
  
  /* Force page breaks before major sections if needed */
  .page-break-before {
    page-break-before: always;
  }
}
```

### PDF Export

We'll use the `react-to-print` library for PDF generation:

```typescript
import { useReactToPrint } from 'react-to-print';

const handleExportPDF = useReactToPrint({
  content: () => reportRef.current,
  documentTitle: `cierre-caja-${closure.closure_number}-${formatDate(closure.closure_date)}`,
  onAfterPrint: () => {
    toast.success("PDF generado exitosamente");
  },
  onPrintError: () => {
    toast.error("Error al generar PDF. Intente nuevamente.");
  },
});
```

### Currency Formatting

All monetary values will use consistent formatting:

```typescript
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(amount);
};
```

### Date Formatting

Dates will be formatted in Spanish locale:

```typescript
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("es-AR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString("es-AR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};
```

### Responsive Design

The report will use Tailwind CSS responsive classes:

- Desktop (md and up): Two-column layout for summary sections
- Mobile (below md): Single-column layout
- Print: Always use desktop layout

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-2">
  {/* Summary sections */}
</div>
```

## Dependencies

### New Dependencies

- `react-to-print`: ^2.15.1 - For PDF generation and printing

### Existing Dependencies

- React 18+
- Next.js 14+
- Tailwind CSS
- Supabase client
- shadcn/ui components (Button, Card, Table, etc.)

## Migration

No database migrations are required. This feature only adds new UI components and server actions that work with existing data structures.

## Security Considerations

- Ensure users can only view reports for closures in their company (RLS policies already in place)
- Validate closure ID parameter to prevent unauthorized access
- Sanitize any user-generated content (notes) before rendering in report
- Ensure company logo URLs are validated and from trusted sources

## Performance Considerations

- Fetch all required data in parallel using Promise.all()
- Cache company settings to avoid repeated fetches
- Limit sales list to reasonable number (e.g., 1000 sales per closure)
- Use React.memo for report component to prevent unnecessary re-renders
- Lazy load PDF generation library to reduce initial bundle size

## Accessibility

- Ensure proper heading hierarchy (h1, h2, h3)
- Use semantic HTML (table, thead, tbody for data tables)
- Provide alt text for company logo
- Ensure sufficient color contrast for all text
- Make print and export buttons keyboard accessible
- Provide ARIA labels for icon-only buttons

## Future Enhancements

- Export to Excel format for detailed sales list
- Email report directly from the interface
- Customizable report templates
- Multi-currency support
- Comparison reports (multiple closures side-by-side)
- Graphical charts for payment method breakdown
