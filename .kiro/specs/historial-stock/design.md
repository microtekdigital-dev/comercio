# Design Document: Stock History System

## Overview

El sistema de historial de stock proporciona una auditoría completa e inmutable de todos los movimientos de inventario. Registra automáticamente cada cambio en el stock, capturando información sobre el empleado responsable, la fecha y hora exacta, y si el movimiento fue manual o automático (generado por una orden de compra).

El diseño se basa en la implementación existente en `scripts/140_create_stock_history.sql` y `lib/actions/stock-movements.ts`, mejorándola para cumplir completamente con los requisitos de auditoría y trazabilidad.

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
│  │  Stock    │  │
│  │ Movements │  │
│  └───────────┘  │
└─────────────────┘
```

### Data Flow

1. **Manual Stock Adjustment**:
   - User → UI → createStockAdjustment() → Insert stock_movements → Update products.stock_quantity → Trigger logs additional metadata

2. **Automatic Stock Movement (Purchase Order)**:
   - Purchase Order Received → logPurchaseStockMovement() → Insert stock_movements → Update products.stock_quantity

3. **Automatic Stock Movement (Sale)**:
   - Sale Completed → logSaleStockMovement() → Insert stock_movements → Update products.stock_quantity

## Components and Interfaces

### Database Schema

#### stock_movements Table

```sql
CREATE TABLE stock_movements (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL,
  product_id UUID NOT NULL,
  
  -- Movement classification
  movement_type VARCHAR(50) NOT NULL CHECK (movement_type IN (
    'purchase',      -- Automatic: from purchase order
    'sale',          -- Automatic: from sale
    'adjustment_in', -- Manual: stock increase
    'adjustment_out',-- Manual: stock decrease
    'return_in',     -- Manual: customer return
    'return_out'     -- Manual: supplier return
  )),
  
  -- Quantity tracking
  quantity DECIMAL(10, 2) NOT NULL,
  stock_before DECIMAL(10, 2) NOT NULL,
  stock_after DECIMAL(10, 2) NOT NULL,
  
  -- References
  sale_id UUID NULL,
  purchase_order_id UUID NULL,
  
  -- Employee tracking
  created_by UUID NOT NULL,
  created_by_name VARCHAR(255) NOT NULL,
  
  -- Additional info
  notes TEXT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT valid_quantity CHECK (quantity != 0),
  CONSTRAINT valid_stock_calculation CHECK (stock_after = stock_before + quantity)
);
```

**Key Design Decisions**:
- `movement_type` distinguishes manual vs automatic movements
- `created_by_name` is denormalized to preserve employee name even if user is deleted
- `stock_before` and `stock_after` provide complete audit trail
- Immutable records (no UPDATE policy in RLS)
- `valid_stock_calculation` constraint ensures data integrity

### TypeScript Interfaces

```typescript
export interface StockMovement {
  id: string;
  company_id: string;
  product_id: string;
  movement_type: 'purchase' | 'sale' | 'adjustment_in' | 'adjustment_out' | 'return_in' | 'return_out';
  quantity: number;
  stock_before: number;
  stock_after: number;
  sale_id: string | null;
  purchase_order_id: string | null;
  created_by: string;
  created_by_name: string;
  notes: string | null;
  created_at: string;
  product?: Product;
}

export interface StockMovementFilters {
  productId?: string;
  movementType?: string;
  dateFrom?: string;
  dateTo?: string;
  employeeId?: string;
  purchaseOrderId?: string;
}

export interface StockMovementStats {
  totalIn: number;
  totalOut: number;
  purchases: number;
  sales: number;
  adjustmentsIn: number;
  adjustmentsOut: number;
}
```

### Server Actions API

```typescript
// Query operations
getStockMovements(filters?: StockMovementFilters): Promise<StockMovement[]>
getProductStockHistory(productId: string): Promise<StockMovement[]>
getStockMovementStats(productId?: string): Promise<StockMovementStats | null>

// Write operations
createStockAdjustment(formData: StockMovementFormData): Promise<{data?: StockMovement, error?: string}>

// Internal logging (called by other modules)
logSaleStockMovement(saleId, productId, quantity, stockBefore, stockAfter): Promise<void>
logPurchaseStockMovement(purchaseOrderId, productId, quantity, stockBefore, stockAfter): Promise<void>
```

## Data Models

### Movement Type Classification

**Manual Movements** (initiated by employee):
- `adjustment_in`: Manual stock increase
- `adjustment_out`: Manual stock decrease
- `return_in`: Customer return (stock increase)
- `return_out`: Supplier return (stock decrease)

**Automatic Movements** (system-generated):
- `purchase`: Stock increase from purchase order
- `sale`: Stock decrease from sale

### Movement Record Structure

Every stock movement contains:
1. **Identity**: Unique ID, company context
2. **Product Reference**: Which product was affected
3. **Quantity Information**: Before, after, and delta
4. **Classification**: Movement type (manual/automatic)
5. **Employee Attribution**: Who initiated it
6. **Source Reference**: Link to sale or purchase order (if applicable)
7. **Temporal Information**: Exact timestamp
8. **Additional Context**: Optional notes

### Data Integrity Rules

1. **Immutability**: Once created, movements cannot be modified or deleted (except by admins in exceptional cases)
2. **Completeness**: All required fields must be present
3. **Consistency**: `stock_after = stock_before + quantity` must always hold
4. **Attribution**: Every movement must have a valid employee reference
5. **Chronological Order**: Movements are always returned ordered by `created_at DESC`

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Movement Creation on Stock Change

*For any* stock quantity change in a product with `track_inventory = true`, a corresponding Stock_Movement record should be created with matching product_id and quantity delta.

**Validates: Requirements 1.1**

### Property 2: Complete Movement Data

*For any* Stock_Movement record, it should contain non-null values for: product_id, movement_type, quantity, stock_before, stock_after, created_by, created_by_name, and created_at.

**Validates: Requirements 1.2, 1.3**

### Property 3: Movement Persistence

*For any* Stock_Movement created, querying the stock_movements table should return that movement with all its original data intact.

**Validates: Requirements 1.4**

### Property 4: Chronological Ordering

*For any* query to getStockMovements(), the returned movements should be ordered by created_at in descending order (newest first).

**Validates: Requirements 1.5**

### Property 5: Employee Attribution

*For any* Stock_Movement, the created_by field should reference a valid employee (user) who exists in the profiles table at the time of creation.

**Validates: Requirements 2.1, 2.4**

### Property 6: Employee Name Preservation

*For any* Stock_Movement, the created_by_name field should be populated with the employee's name, and this value should remain unchanged even if the employee record is later deleted.

**Validates: Requirements 2.2, 2.3**

### Property 7: Movement Type Classification

*For any* Stock_Movement, the movement_type should be one of the valid enum values: 'purchase', 'sale', 'adjustment_in', 'adjustment_out', 'return_in', or 'return_out'.

**Validates: Requirements 3.1**

### Property 8: Manual Movement Classification

*For any* stock adjustment created via createStockAdjustment(), the resulting movement should have movement_type of either 'adjustment_in' or 'adjustment_out', and should not have a purchase_order_id.

**Validates: Requirements 3.2, 4.3**

### Property 9: Automatic Movement Classification

*For any* stock movement created via logPurchaseStockMovement(), the resulting movement should have movement_type of 'purchase' and should have a non-null purchase_order_id.

**Validates: Requirements 3.3, 4.1**

### Property 10: Movement Type Filtering

*For any* movement type filter value, calling getStockMovements() with that filter should return only movements matching that specific movement_type.

**Validates: Requirements 3.5**

### Property 11: Purchase Order Reference

*For any* Stock_Movement with a non-null purchase_order_id, that purchase order should exist in the purchase_orders table (or have existed at creation time).

**Validates: Requirements 4.2**

### Property 12: Purchase Order Filtering

*For any* purchase order ID, calling getStockMovements() with purchaseOrderId filter should return only movements linked to that specific purchase order.

**Validates: Requirements 4.4**

### Property 13: Product History Completeness

*For any* product ID, calling getProductStockHistory() should return all Stock_Movement records where product_id matches, regardless of movement type or date.

**Validates: Requirements 5.1**

### Property 14: Display Data Completeness

*For any* Stock_Movement returned by query functions, the response should include: created_at (date/time), created_by_name (employee), movement_type, quantity, and stock_after (resulting level).

**Validates: Requirements 5.2, 3.4**

### Property 15: Date Range Filtering

*For any* date range (dateFrom, dateTo), calling getStockMovements() with those filters should return only movements where created_at falls within that range (inclusive).

**Validates: Requirements 5.3**

### Property 16: Employee Filtering

*For any* employee ID, calling getStockMovements() with employeeId filter should return only movements where created_by matches that employee.

**Validates: Requirements 5.4**

### Property 17: Movement Immutability

*For any* existing Stock_Movement record, attempts to update any of its fields should be rejected by the database (RLS policy prevents UPDATE operations).

**Validates: Requirements 6.1**

### Property 18: Movement Deletion Protection

*For any* existing Stock_Movement record, attempts to delete it should be rejected unless the user has 'owner' or 'admin' role.

**Validates: Requirements 6.2**

### Property 19: Stock Correction Pattern

*For any* stock correction scenario, the system should create a new compensating Stock_Movement (e.g., adjustment_in to reverse an adjustment_out) rather than modifying the original movement.

**Validates: Requirements 6.3**

### Property 20: Required Fields Validation

*For any* attempt to create a Stock_Movement with missing required fields (product_id, movement_type, quantity, stock_before, stock_after, created_by, created_by_name), the operation should be rejected with a validation error.

**Validates: Requirements 6.4**

### Property 21: Stock Calculation Consistency

*For any* Stock_Movement record, the relationship `stock_after = stock_before + quantity` should always hold true.

**Validates: Requirements 6.5**

## Error Handling

### Validation Errors

1. **Missing Required Fields**: Return clear error message indicating which field is missing
2. **Invalid Movement Type**: Reject with error listing valid movement types
3. **Invalid Employee**: Reject if created_by doesn't reference existing user
4. **Invalid Product**: Reject if product_id doesn't exist or doesn't belong to company
5. **Negative Stock Result**: Reject manual adjustments that would result in negative stock

### Database Errors

1. **Constraint Violations**: Catch and translate to user-friendly messages
2. **RLS Policy Violations**: Return "Unauthorized" error
3. **Foreign Key Violations**: Return "Referenced record not found" error

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

1. **Movement Creation**: Test creating movements with various valid inputs
2. **Employee Name Preservation**: Test that employee name is captured correctly
3. **Movement Type Classification**: Test each movement type is set correctly
4. **Filtering**: Test each filter parameter works correctly
5. **Error Cases**: Test validation errors for invalid inputs
6. **Edge Cases**:
   - Empty employee name (should use email)
   - Product without track_inventory (should not create movement)
   - Deleted employee (movement should preserve name)

### Property-Based Tests

Property-based tests will verify universal properties across randomized inputs (minimum 100 iterations per test):

Each property test must:
- Run at least 100 iterations with randomized inputs
- Reference its design document property in a comment
- Use tag format: `Feature: historial-stock, Property {number}: {property_text}`

**Test Coverage**:
- Properties 1-21 as defined in Correctness Properties section
- Each property maps to specific requirements
- Tests use randomized data generators for:
  - Product IDs
  - Employee IDs
  - Quantities (positive and negative)
  - Movement types
  - Timestamps
  - Filter combinations

**Property Test Library**: Use `fast-check` for TypeScript property-based testing

### Integration Tests

1. **End-to-End Flows**:
   - Create product → Adjust stock → Verify movement created
   - Create purchase order → Receive → Verify automatic movement
   - Create sale → Complete → Verify automatic movement

2. **Multi-User Scenarios**:
   - Multiple employees creating movements
   - Verify correct attribution

3. **Query Performance**:
   - Test with large datasets (1000+ movements)
   - Verify pagination works correctly
   - Verify indexes are used efficiently

### Test Data Generators

```typescript
// Generator for random stock movements
function generateStockMovement(): StockMovement {
  return {
    product_id: randomUUID(),
    movement_type: randomChoice(['adjustment_in', 'adjustment_out', 'purchase', 'sale']),
    quantity: randomDecimal(-100, 100, excluding: 0),
    stock_before: randomDecimal(0, 1000),
    // stock_after calculated from stock_before + quantity
    created_by: randomUUID(),
    created_by_name: randomName(),
    notes: optional(randomText()),
    created_at: randomTimestamp(),
  };
}
```

## Implementation Notes

### Existing Implementation

The current implementation in `scripts/140_create_stock_history.sql` and `lib/actions/stock-movements.ts` provides:
- ✅ Basic table structure
- ✅ Movement type classification
- ✅ Employee attribution
- ✅ RLS policies
- ✅ Basic query functions
- ✅ Manual adjustment creation
- ✅ Automatic logging for sales and purchases

### Required Enhancements

1. **Enhanced Filtering**: Add support for employeeId filter in getStockMovements()
2. **Validation Improvements**: Add explicit validation for all required fields
3. **Error Messages**: Improve error messages to be more user-friendly
4. **Type Safety**: Ensure TypeScript types match database schema exactly
5. **Documentation**: Add JSDoc comments to all public functions

### Database Trigger Enhancement

The existing trigger `log_stock_movement()` handles manual adjustments. It should be verified to:
- Only fire for products with `track_inventory = true`
- Correctly capture employee information
- Handle edge cases (null employee name → use email)

### Performance Considerations

1. **Indexes**: Existing indexes cover common query patterns
2. **Pagination**: Implement cursor-based pagination for large result sets
3. **Caching**: Consider caching recent movements for frequently accessed products
4. **Archival**: For very large datasets, consider archival strategy for old movements

### Security Considerations

1. **RLS Policies**: Ensure users can only see movements for their company
2. **Immutability**: Prevent updates to movements (already implemented)
3. **Admin Access**: Only owners/admins can delete movements (exceptional cases)
4. **Input Validation**: Validate all inputs to prevent injection attacks
