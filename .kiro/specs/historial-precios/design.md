# Design Document: Price History System

## Overview

El sistema de historial de precios proporciona una auditoría completa e inmutable de todos los cambios realizados en los precios de venta y costo de los productos. Registra automáticamente cada modificación de precio, capturando información sobre el empleado responsable, la fecha y hora exacta, los valores anteriores y nuevos, y opcionalmente la razón del cambio.

El diseño sigue los patrones establecidos en el sistema de historial de stock (`historial-stock`), adaptándolos para el seguimiento de cambios de precios. Se integra con el módulo de productos existente (`lib/actions/products.ts`) para capturar automáticamente los cambios cuando se actualizan los precios.

## Architecture

### High-Level Architecture

```
┌─────────────────┐
│   UI Layer      │
│  (React/Next)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Actions Layer  │
│ (Server Actions)│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Database Layer │
│   (Supabase)    │
│                 │
│  ┌───────────┐  │
│  │ Products  │  │
│  └─────┬─────┘  │
│        │        │
│        ▼        │
│  ┌───────────┐  │
│  │  Trigger  │  │
│  └─────┬─────┘  │
│        │        │
│        ▼        │
│  ┌───────────┐  │
│  │  Price    │  │
│  │ Changes   │  │
│  └───────────┘  │
└─────────────────┘
```

### Data Flow

1. **Price Update**:
   - User → UI → updateProduct() → Update products.price/cost → Trigger logs price change → Insert price_changes

2. **View Global History**:
   - User → UI → getPriceChanges() → Query price_changes with filters → Return formatted results

3. **View Product History**:
   - User → UI → getProductPriceHistory() → Query price_changes for specific product → Return chronological history

## Components and Interfaces

### Database Schema

#### price_changes Table

```sql
CREATE TABLE price_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  
  -- Price type classification
  price_type VARCHAR(20) NOT NULL CHECK (price_type IN ('sale_price', 'cost_price')),
  
  -- Price tracking
  old_value DECIMAL(10, 2) NOT NULL,
  new_value DECIMAL(10, 2) NOT NULL,
  
  -- Employee tracking
  changed_by UUID NOT NULL REFERENCES profiles(id),
  changed_by_name VARCHAR(255) NOT NULL,
  changed_by_role VARCHAR(50) NOT NULL,
  
  -- Additional info
  reason TEXT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT valid_price_change CHECK (old_value != new_value),
  CONSTRAINT positive_prices CHECK (old_value >= 0 AND new_value >= 0)
);

-- Indexes for performance
CREATE INDEX idx_price_changes_company ON price_changes(company_id);
CREATE INDEX idx_price_changes_product ON price_changes(product_id);
CREATE INDEX idx_price_changes_employee ON price_changes(changed_by);
CREATE INDEX idx_price_changes_date ON price_changes(created_at DESC);
CREATE INDEX idx_price_changes_type ON price_changes(price_type);

-- RLS Policies
ALTER TABLE price_changes ENABLE ROW LEVEL SECURITY;

-- Users can view price changes for their company
CREATE POLICY "Users can view price changes for their company"
  ON price_changes FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Prevent updates (immutability)
CREATE POLICY "Prevent price change updates"
  ON price_changes FOR UPDATE
  USING (false);

-- Only admins can delete (exceptional cases)
CREATE POLICY "Only admins can delete price changes"
  ON price_changes FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND company_id = price_changes.company_id
      AND role IN ('owner', 'admin')
    )
  );
```

**Key Design Decisions**:
- `price_type` distinguishes between sale price and cost price changes
- `changed_by_name` and `changed_by_role` are denormalized to preserve employee information even if user is deleted
- `old_value` and `new_value` provide complete audit trail
- Immutable records (no UPDATE policy in RLS)
- `valid_price_change` constraint ensures old and new values are different
- `positive_prices` constraint ensures prices are non-negative

### Database Trigger

```sql
-- Function to log price changes
CREATE OR REPLACE FUNCTION log_price_change()
RETURNS TRIGGER AS $$
DECLARE
  v_user_name VARCHAR(255);
  v_user_role VARCHAR(50);
BEGIN
  -- Only log if price or cost actually changed
  IF (OLD.price IS DISTINCT FROM NEW.price) OR (OLD.cost IS DISTINCT FROM NEW.cost) THEN
    
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
    
    -- Log sale price change
    IF OLD.price IS DISTINCT FROM NEW.price THEN
      INSERT INTO price_changes (
        company_id,
        product_id,
        price_type,
        old_value,
        new_value,
        changed_by,
        changed_by_name,
        changed_by_role
      ) VALUES (
        NEW.company_id,
        NEW.id,
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
        price_type,
        old_value,
        new_value,
        changed_by,
        changed_by_name,
        changed_by_role
      ) VALUES (
        NEW.company_id,
        NEW.id,
        'cost_price',
        OLD.cost,
        NEW.cost,
        auth.uid(),
        v_user_name,
        v_user_role
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on products table
CREATE TRIGGER trigger_log_price_change
  AFTER UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION log_price_change();
```

### TypeScript Interfaces

```typescript
export interface PriceChange {
  id: string;
  company_id: string;
  product_id: string;
  price_type: 'sale_price' | 'cost_price';
  old_value: number;
  new_value: number;
  changed_by: string;
  changed_by_name: string;
  changed_by_role: string;
  reason: string | null;
  created_at: string;
  product?: Product;
}

export interface PriceChangeFilters {
  productId?: string;
  priceType?: 'sale_price' | 'cost_price';
  dateFrom?: string;
  dateTo?: string;
  employeeId?: string;
}

export interface PriceChangeFormData {
  product_id: string;
  price_type: 'sale_price' | 'cost_price';
  new_value: number;
  reason?: string;
}
```

### Server Actions API

```typescript
// Query operations
getPriceChanges(filters?: PriceChangeFilters): Promise<PriceChange[]>
getProductPriceHistory(productId: string): Promise<PriceChange[]>

// Write operations
updateProductPrice(productId: string, formData: PriceChangeFormData): Promise<{data?: Product, error?: string}>

// Export operations
exportPriceChangesToCSV(filters?: PriceChangeFilters): Promise<string>
```

## Data Models

### Price Type Classification

**Sale Price Changes** (`sale_price`):
- Changes to the selling price of a product
- Affects revenue calculations
- Visible to customers

**Cost Price Changes** (`cost_price`):
- Changes to the cost/purchase price of a product
- Affects profit margin calculations
- Internal information

### Price Change Record Structure

Every price change contains:
1. **Identity**: Unique ID, company context
2. **Product Reference**: Which product was affected
3. **Price Information**: Type, old value, new value
4. **Employee Attribution**: Who made the change, their name and role
5. **Temporal Information**: Exact timestamp
6. **Additional Context**: Optional reason for the change

### Data Integrity Rules

1. **Immutability**: Once created, price changes cannot be modified or deleted (except by admins in exceptional cases)
2. **Completeness**: All required fields must be present
3. **Validity**: Old and new values must be different and non-negative
4. **Attribution**: Every change must have a valid employee reference
5. **Chronological Order**: Changes are always returned ordered by `created_at DESC`
6. **Dual Recording**: When both prices change simultaneously, two separate records are created

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Acceptance Criteria Testing Prework

1.1 WHEN un empleado modifica el precio de venta de un producto, THEN THE Sistema SHALL crear un registro de cambio con el precio anterior y el precio nuevo
  Thoughts: This is a rule that should apply to all price changes, not specific examples. We can generate random products and price changes, update the price, and verify a price_change record was created with matching values.
  Testable: yes - property

1.2 WHEN un empleado modifica el precio de costo de un producto, THEN THE Sistema SHALL crear un registro de cambio con el costo anterior y el costo nuevo
  Thoughts: Similar to 1.1, this applies to all cost changes. We can test this with random products and cost updates.
  Testable: yes - property

1.3 WHEN se crea un registro de cambio, THEN THE Sistema SHALL almacenar la fecha y hora exacta del cambio
  Thoughts: This is about ensuring all price change records have a timestamp. We can verify that created_at is non-null and recent.
  Testable: yes - property

1.4 WHEN se crea un registro de cambio, THEN THE Sistema SHALL almacenar el identificador del empleado que realizó el cambio
  Thoughts: This ensures employee attribution. We can verify changed_by is non-null and references a valid user.
  Testable: yes - property

1.5 WHEN un empleado modifica ambos precios (venta y costo) simultáneamente, THEN THE Sistema SHALL crear dos registros de cambio separados
  Thoughts: This is testing that simultaneous changes create separate records. We can update both prices and verify two records are created.
  Testable: yes - property

2.1 WHEN un empleado realiza un cambio de precio, THEN THE Sistema SHALL permitir ingresar una razón opcional del cambio
  Thoughts: This is about the API accepting an optional reason field. We can test that the function accepts both with and without reason.
  Testable: yes - property

2.2 WHEN se proporciona una razón, THEN THE Sistema SHALL almacenarla junto con el registro de cambio
  Thoughts: When a reason is provided, it should be stored. We can verify the reason field matches what was provided.
  Testable: yes - property

2.3 WHEN no se proporciona una razón, THEN THE Sistema SHALL crear el registro de cambio sin este campo
  Thoughts: When no reason is provided, the record should still be created with reason as null.
  Testable: yes - property

3.1 WHEN un usuario accede a la vista global, THEN THE Sistema SHALL mostrar todos los cambios de precios ordenados por fecha descendente
  Thoughts: This is about query ordering. We can create multiple price changes and verify they're returned in descending date order.
  Testable: yes - property

3.2 WHEN se muestra un cambio de precio, THEN THE Sistema SHALL mostrar el nombre del producto, tipo de precio, precio anterior, precio nuevo, empleado, fecha y razón
  Thoughts: This is about data completeness in the response. We can verify all required fields are present in returned records.
  Testable: yes - property

3.3 WHEN la lista de cambios es extensa, THEN THE Sistema SHALL implementar paginación para mejorar el rendimiento
  Thoughts: This is about pagination implementation. This is more of an implementation detail than a testable property.
  Testable: no

3.4 THE Sistema SHALL permitir filtrar los cambios por producto específico
  Thoughts: This is about filtering functionality. We can test that applying a product filter returns only changes for that product.
  Testable: yes - property

3.5 THE Sistema SHALL permitir filtrar los cambios por empleado específico
  Thoughts: Similar to 3.4, we can test employee filtering returns only changes by that employee.
  Testable: yes - property

3.6 THE Sistema SHALL permitir filtrar los cambios por rango de fechas
  Thoughts: We can test that date range filtering returns only changes within that range.
  Testable: yes - property

3.7 THE Sistema SHALL permitir filtrar los cambios por tipo de precio
  Thoughts: We can test that price type filtering returns only changes of that type.
  Testable: yes - property

4.1 THE Sistema SHALL prevenir la modificación de registros de cambios de precio existentes
  Thoughts: This is about immutability. We can attempt to update a record and verify it's rejected.
  Testable: yes - property

4.2 THE Sistema SHALL prevenir la eliminación de registros de cambios de precio
  Thoughts: Similar to 4.1, we can attempt to delete a record and verify it's rejected (unless admin).
  Testable: yes - property

4.3 WHEN se intenta modificar o eliminar un registro, THEN THE Sistema SHALL rechazar la operación
  Thoughts: This is covered by 4.1 and 4.2, so it's redundant.
  Testable: redundant

5.1 WHEN un usuario visualiza un producto, THEN THE Sistema SHALL mostrar el historial de cambios de precio de ese producto
  Thoughts: This is about the product history query returning all changes for a product.
  Testable: yes - property

5.2 WHEN se muestra el historial de un producto, THEN THE Sistema SHALL ordenar los cambios por fecha descendente
  Thoughts: Similar to 3.1, testing chronological ordering.
  Testable: yes - property

5.3 WHEN se muestra el historial de un producto, THEN THE Sistema SHALL incluir tanto cambios de precio de venta como de costo
  Thoughts: This ensures both price types are included. We can verify the result includes both types when both have changed.
  Testable: yes - property

6.1 WHEN se muestra un cambio de precio, THEN THE Sistema SHALL mostrar el nombre completo del empleado que realizó el cambio
  Thoughts: This is about employee name being present in the response.
  Testable: yes - property

6.2 WHEN se muestra un cambio de precio, THEN THE Sistema SHALL mostrar el rol del empleado que realizó el cambio
  Thoughts: This is about employee role being present in the response.
  Testable: yes - property

6.3 IF el empleado que realizó el cambio ya no existe en el sistema, THEN THE Sistema SHALL mantener visible su información histórica
  Thoughts: This is about data preservation. We can verify that changed_by_name and changed_by_role remain even if the user is deleted.
  Testable: yes - property

7.1 THE Sistema SHALL mostrar todos los precios con el símbolo de moneda configurado en la empresa
  Thoughts: This is about UI formatting, which is not easily testable as a property.
  Testable: no

7.2 THE Sistema SHALL mostrar todos los precios con dos decimales
  Thoughts: This is about number formatting in the UI, not a backend property.
  Testable: no

7.3 THE Sistema SHALL mostrar los precios con separadores de miles apropiados
  Thoughts: This is about UI formatting, not a backend property.
  Testable: no

8.1 THE Sistema SHALL permitir exportar la vista global de cambios a formato CSV
  Thoughts: This is about export functionality existing. We can test that the export function returns valid CSV.
  Testable: yes - example

8.2 WHEN se exporta a CSV, THEN THE Sistema SHALL incluir todas las columnas visibles en la vista
  Thoughts: This is about CSV completeness. We can verify all expected columns are present in the export.
  Testable: yes - property

8.3 WHEN se aplican filtros, THEN THE Sistema SHALL exportar solo los registros filtrados
  Thoughts: This is about export respecting filters. We can verify filtered exports contain only matching records.
  Testable: yes - property

### Property Reflection

After reviewing all testable properties, I've identified the following redundancies:

- Property 4.3 is redundant with 4.1 and 4.2 (both cover rejection of modifications/deletions)
- Property 5.2 is redundant with 3.1 (both test chronological ordering)
- Property 6.1 and 6.2 can be combined into a single property about employee information completeness

Consolidated properties:
- Combine 6.1 and 6.2 into: "Employee information completeness" - verifies both name and role are present
- Remove 4.3 as it's covered by 4.1 and 4.2
- Remove 5.2 as it's covered by 3.1

### Property 1: Sale Price Change Recording

*For any* product with a sale price, when the price is updated to a different value, a PriceChange record should be created with price_type='sale_price', old_value matching the previous price, and new_value matching the new price.

**Validates: Requirements 1.1**

### Property 2: Cost Price Change Recording

*For any* product with a cost price, when the cost is updated to a different value, a PriceChange record should be created with price_type='cost_price', old_value matching the previous cost, and new_value matching the new cost.

**Validates: Requirements 1.2**

### Property 3: Timestamp Recording

*For any* PriceChange record created, the created_at field should be non-null and should be within a reasonable time window (e.g., within 1 minute) of the current time.

**Validates: Requirements 1.3**

### Property 4: Employee Attribution

*For any* PriceChange record created, the changed_by field should reference a valid employee (user) who exists in the profiles table at the time of creation.

**Validates: Requirements 1.4**

### Property 5: Dual Price Change Recording

*For any* product update where both price and cost are changed simultaneously, exactly two PriceChange records should be created: one with price_type='sale_price' and one with price_type='cost_price'.

**Validates: Requirements 1.5**

### Property 6: Optional Reason Acceptance

*For any* price change operation, the system should accept both requests with a reason field and requests without a reason field, creating valid PriceChange records in both cases.

**Validates: Requirements 2.1**

### Property 7: Reason Storage

*For any* price change where a reason is provided, the resulting PriceChange record should have a non-null reason field containing the provided text.

**Validates: Requirements 2.2**

### Property 8: Null Reason Handling

*For any* price change where no reason is provided, the resulting PriceChange record should have a null reason field, and the record should still be created successfully.

**Validates: Requirements 2.3**

### Property 9: Chronological Ordering

*For any* query to getPriceChanges(), the returned price changes should be ordered by created_at in descending order (newest first).

**Validates: Requirements 3.1, 5.2**

### Property 10: Display Data Completeness

*For any* PriceChange returned by query functions, the response should include: product name, price_type, old_value, new_value, changed_by_name, changed_by_role, created_at, and reason (if present).

**Validates: Requirements 3.2**

### Property 11: Product Filtering

*For any* product ID, calling getPriceChanges() with productId filter should return only PriceChange records where product_id matches that specific product.

**Validates: Requirements 3.4**

### Property 12: Employee Filtering

*For any* employee ID, calling getPriceChanges() with employeeId filter should return only PriceChange records where changed_by matches that employee.

**Validates: Requirements 3.5**

### Property 13: Date Range Filtering

*For any* date range (dateFrom, dateTo), calling getPriceChanges() with those filters should return only PriceChange records where created_at falls within that range (inclusive).

**Validates: Requirements 3.6**

### Property 14: Price Type Filtering

*For any* price type ('sale_price' or 'cost_price'), calling getPriceChanges() with priceType filter should return only PriceChange records matching that specific price_type.

**Validates: Requirements 3.7**

### Property 15: Change Immutability

*For any* existing PriceChange record, attempts to update any of its fields should be rejected by the database (RLS policy prevents UPDATE operations).

**Validates: Requirements 4.1**

### Property 16: Change Deletion Protection

*For any* existing PriceChange record, attempts to delete it should be rejected unless the user has 'owner' or 'admin' role.

**Validates: Requirements 4.2**

### Property 17: Product History Completeness

*For any* product ID, calling getProductPriceHistory() should return all PriceChange records where product_id matches, regardless of price type or date.

**Validates: Requirements 5.1**

### Property 18: Product History Includes Both Types

*For any* product that has had both sale price and cost price changes, calling getProductPriceHistory() should return records with both price_type='sale_price' and price_type='cost_price'.

**Validates: Requirements 5.3**

### Property 19: Employee Information Completeness

*For any* PriceChange record, both changed_by_name and changed_by_role fields should be non-null and populated with the employee's information at the time of the change.

**Validates: Requirements 6.1, 6.2**

### Property 20: Employee Information Preservation

*For any* PriceChange record, the changed_by_name and changed_by_role values should remain unchanged even if the employee record is later deleted or modified.

**Validates: Requirements 6.3**

### Property 21: CSV Export Column Completeness

*For any* call to exportPriceChangesToCSV(), the resulting CSV should include columns for: product name, price type, old value, new value, employee name, employee role, date, and reason.

**Validates: Requirements 8.2**

### Property 22: CSV Export Filter Respect

*For any* filters applied to exportPriceChangesToCSV(), the resulting CSV should contain only records that match those filters, with the same results as getPriceChanges() with the same filters.

**Validates: Requirements 8.3**

## Error Handling

### Validation Errors

1. **Invalid Product**: Return error if product_id doesn't exist or doesn't belong to company
2. **Invalid Price Type**: Return error if price_type is not 'sale_price' or 'cost_price'
3. **Invalid Price Value**: Return error if new_value is negative
4. **Same Price**: Return error if new_value equals current price (no change)
5. **Missing Required Fields**: Return error indicating which field is missing

### Database Errors

1. **Constraint Violations**: Catch and translate to user-friendly messages
2. **RLS Policy Violations**: Return "Unauthorized" error
3. **Foreign Key Violations**: Return "Referenced record not found" error
4. **Trigger Failures**: Log error and return generic message to user

### Error Response Format

```typescript
{
  error: string; // User-friendly error message
  code?: string; // Optional error code for programmatic handling
}
```

## Testing Strategy

### Unit Tests

Unit tests will focus on specific examples and edge cases:

1. **Price Change Creation**: Test creating changes with various valid inputs
2. **Employee Information Preservation**: Test that employee name and role are captured correctly
3. **Price Type Classification**: Test both sale_price and cost_price changes
4. **Filtering**: Test each filter parameter works correctly
5. **Error Cases**: Test validation errors for invalid inputs
6. **Edge Cases**:
   - Empty employee name (should use email)
   - Simultaneous price and cost change (should create two records)
   - Deleted employee (change should preserve name and role)
   - Zero price change (should be rejected)
   - Negative price (should be rejected)

### Property-Based Tests

Property-based tests will verify universal properties across randomized inputs (minimum 100 iterations per test):

Each property test must:
- Run at least 100 iterations with randomized inputs
- Reference its design document property in a comment
- Use tag format: `Feature: historial-precios, Property {number}: {property_text}`

**Test Coverage**:
- Properties 1-22 as defined in Correctness Properties section
- Each property maps to specific requirements
- Tests use randomized data generators for:
  - Product IDs
  - Employee IDs
  - Price values (positive decimals)
  - Price types
  - Timestamps
  - Filter combinations

**Property Test Library**: Use `fast-check` for TypeScript property-based testing

### Integration Tests

1. **End-to-End Flows**:
   - Create product → Update price → Verify change recorded
   - Update both prices → Verify two changes recorded
   - View global history → Verify all changes visible
   - View product history → Verify product-specific changes

2. **Multi-User Scenarios**:
   - Multiple employees changing prices
   - Verify correct attribution for each change

3. **Query Performance**:
   - Test with large datasets (1000+ price changes)
   - Verify pagination works correctly
   - Verify indexes are used efficiently

4. **Export Functionality**:
   - Test CSV export with various filters
   - Verify CSV format is valid
   - Verify all data is included

### Test Data Generators

```typescript
// Generator for random price changes
function generatePriceChange(): PriceChange {
  return {
    product_id: randomUUID(),
    price_type: randomChoice(['sale_price', 'cost_price']),
    old_value: randomDecimal(0, 10000, precision: 2),
    new_value: randomDecimal(0, 10000, precision: 2, excluding: old_value),
    changed_by: randomUUID(),
    changed_by_name: randomName(),
    changed_by_role: randomChoice(['owner', 'admin', 'employee']),
    reason: optional(randomText()),
    created_at: randomTimestamp(),
  };
}
```

## Implementation Notes

### Integration with Existing Code

The price history system will integrate with:

1. **Products Module** (`lib/actions/products.ts`):
   - Modify `updateProduct()` to optionally accept a `price_change_reason` parameter
   - The database trigger will automatically log changes
   - No changes needed to product creation (no history for initial prices)

2. **Database Schema**:
   - Add new `price_changes` table
   - Add trigger on `products` table to log changes
   - Add RLS policies for security

3. **Type Definitions** (`lib/types/erp.ts`):
   - Add `PriceChange`, `PriceChangeFilters`, and `PriceChangeFormData` interfaces

### New Files to Create

1. **Server Actions**: `lib/actions/price-changes.ts`
   - Implement all query and export functions
   - Follow patterns from `lib/actions/stock-movements.ts`

2. **Database Migration**: `scripts/150_create_price_history.sql`
   - Create table, indexes, RLS policies, and trigger
   - Follow patterns from `scripts/140_create_stock_history.sql`

3. **UI Components**:
   - `components/dashboard/price-history-table.tsx` - Global view
   - `components/dashboard/product-price-history.tsx` - Product-specific view
   - Follow patterns from `components/dashboard/stock-history-table.tsx`

4. **Pages**:
   - `app/dashboard/price-history/page.tsx` - Global price history page
   - Add price history section to product detail page

### Performance Considerations

1. **Indexes**: Create indexes on frequently queried columns (company_id, product_id, changed_by, created_at, price_type)
2. **Pagination**: Implement cursor-based pagination for large result sets
3. **Caching**: Consider caching recent changes for frequently accessed products
4. **Archival**: For very large datasets, consider archival strategy for old changes

### Security Considerations

1. **RLS Policies**: Ensure users can only see price changes for their company
2. **Immutability**: Prevent updates to price changes (already implemented in RLS)
3. **Admin Access**: Only owners/admins can delete changes (exceptional cases)
4. **Input Validation**: Validate all inputs to prevent injection attacks
5. **Sensitive Data**: Price information is business-sensitive, ensure proper access control

### Currency Handling

The system will use the currency configured in the company settings:
- All prices are stored as DECIMAL(10, 2) for precision
- Currency symbol is retrieved from company settings for display
- No currency conversion is performed (all prices in company's base currency)

### Reason Field Guidelines

The optional reason field should be used to document:
- Market conditions ("Competitor pricing adjustment")
- Cost changes ("Supplier price increase")
- Promotions ("Holiday sale discount")
- Corrections ("Fixed pricing error")
- Strategic decisions ("New pricing strategy")

### Future Enhancements

Potential future improvements (not in current scope):
1. **Price Analytics**: Charts showing price trends over time
2. **Bulk Price Updates**: Update multiple products at once with single reason
3. **Price Alerts**: Notify when prices change beyond certain thresholds
4. **Price Comparison**: Compare prices across products or time periods
5. **Approval Workflow**: Require approval for large price changes
