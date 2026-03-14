# Design Document: Sistema de Punto de Venta (POS)

## Overview

El sistema de Punto de Venta (POS) es una interfaz optimizada para ventas rápidas en mostrador que se integra con el ERP SaaS multi-tenant existente. El diseño prioriza la velocidad, usabilidad táctil, y experiencia fluida para cajeros, mientras mantiene la integridad de datos y seguridad multi-tenant.

### Key Design Goals

1. **Velocidad**: Respuestas en menos de 500ms para búsquedas, actualizaciones instantáneas del carrito
2. **Usabilidad Táctil**: Optimizado para tablets, celulares y pantallas táctiles con gestos intuitivos
3. **Integración Perfecta**: Sincronización automática con caja registradora, inventario y contabilidad
4. **Seguridad Multi-Tenant**: Aislamiento estricto de datos entre empresas mediante RLS
5. **Escalabilidad**: Soporte para modo offline en plan Empresarial con sincronización automática
6. **Responsive**: Adaptación completa desde 320px (móvil) hasta desktop

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     POS Frontend (Next.js)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Product Grid │  │ Shopping Cart│  │ Payment Modal│      │
│  │  Component   │  │  Component   │  │  Component   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Customer     │  │ Keyboard     │  │ Offline      │      │
│  │ Selector     │  │ Shortcuts    │  │ Manager      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Server Actions Layer                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ POS Actions  │  │ Cart Actions │  │ Payment      │      │
│  │              │  │              │  │ Actions      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Supabase Backend                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Products     │  │ Sales        │  │ Cash         │      │
│  │ (with RLS)   │  │ (with RLS)   │  │ Register     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Customers    │  │ Stock        │  │ Offline      │      │
│  │ (with RLS)   │  │ Movements    │  │ Queue        │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### Component Architecture

El POS se estructura en componentes React modulares y reutilizables:

1. **POSLayout**: Contenedor principal responsive que adapta el layout según el tamaño de pantalla
2. **ProductGrid**: Grid de productos con imágenes, búsqueda y filtros
3. **ShoppingCart**: Carrito con edición de cantidades, descuentos y resumen
4. **PaymentModal**: Modal para seleccionar métodos de pago y calcular cambio
5. **CustomerSelector**: Búsqueda y selección rápida de clientes
6. **KeyboardShortcutHandler**: Manejador global de atajos de teclado
7. **OfflineManager**: Gestor de caché y sincronización offline (plan Empresarial)

## Components and Interfaces

### Core Data Structures

```typescript
// POS Cart Item
interface POSCartItem {
  id: string; // Temporary ID for cart management
  product_id: string;
  product_name: string;
  product_sku: string | null;
  variant_id: string | null;
  variant_name: string | null;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  discount_percent: number;
  subtotal: number;
  tax_amount: number;
  total: number;
  image_url: string | null;
}

// POS Cart State
interface POSCart {
  items: POSCartItem[];
  customer_id: string | null;
  customer_name: string | null;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total: number;
}

// POS Payment
interface POSPayment {
  payment_method: string;
  amount: number;
}

// POS Sale Request
interface POSSaleRequest {
  customer_id: string | null;
  items: POSCartItem[];
  payments: POSPayment[];
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  notes: string | null;
}

// Offline Queue Item (plan Empresarial)
interface OfflineQueueItem {
  id: string;
  sale_data: POSSaleRequest;
  timestamp: number;
  retry_count: number;
  status: 'pending' | 'syncing' | 'failed';
}
```

### Server Actions

```typescript
// lib/actions/pos.ts

/**
 * Search products for POS (optimized query)
 * Returns products with variants, stock, and images
 */
export async function searchPOSProducts(
  query: string,
  limit: number = 20
): Promise<Product[]>

/**
 * Get products by category for POS grid
 */
export async function getPOSProductsByCategory(
  categoryId: string | null
): Promise<Product[]>

/**
 * Validate cart before checkout
 * Checks stock availability, prices, and business rules
 */
export async function validatePOSCart(
  cart: POSCart
): Promise<{ valid: boolean; errors: string[] }>

/**
 * Create sale from POS
 * Handles multiple payments, stock updates, and cash register integration
 */
export async function createPOSSale(
  saleRequest: POSSaleRequest
): Promise<{ success: boolean; sale_id?: string; error?: string }>

/**
 * Get active cash register opening for current user
 */
export async function getActiveCashRegisterOpening(): Promise<CashRegisterOpening | null>

/**
 * Get generic customer for anonymous sales
 */
export async function getGenericCustomer(): Promise<Customer>

/**
 * Generate POS ticket (thermal printer format 80mm)
 */
export async function generatePOSTicket(
  saleId: string
): Promise<{ success: boolean; ticket_html: string; error?: string }>

/**
 * Send POS ticket by email
 */
export async function sendPOSTicketEmail(
  saleId: string,
  email: string
): Promise<{ success: boolean; error?: string }>

// Offline Mode Actions (plan Empresarial)

/**
 * Get frequently used products for offline cache
 */
export async function getFrequentProducts(
  limit: number = 100
): Promise<Product[]>

/**
 * Sync offline sales queue
 */
export async function syncOfflineSales(
  queueItems: OfflineQueueItem[]
): Promise<{ synced: number; failed: number; errors: string[] }>
```

### Component Interfaces

```typescript
// components/dashboard/pos/product-grid.tsx
interface ProductGridProps {
  onProductSelect: (product: Product, variant?: ProductVariant) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

// components/dashboard/pos/shopping-cart.tsx
interface ShoppingCartProps {
  cart: POSCart;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onApplyDiscount: (type: 'percentage' | 'fixed', value: number) => void;
  onCheckout: () => void;
  onClear: () => void;
}

// components/dashboard/pos/payment-modal.tsx
interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  total: number;
  onConfirmPayment: (payments: POSPayment[]) => Promise<void>;
}

// components/dashboard/pos/customer-selector.tsx
interface CustomerSelectorProps {
  selectedCustomer: Customer | null;
  onSelectCustomer: (customer: Customer | null) => void;
  onCreateCustomer: () => void;
}
```

## Data Models

### Database Schema Extensions

El POS utiliza las tablas existentes del ERP con algunas extensiones:

```sql
-- Tabla para cola de sincronización offline (plan Empresarial)
CREATE TABLE IF NOT EXISTS offline_sales_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sale_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  synced_at TIMESTAMP WITH TIME ZONE,
  retry_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'syncing', 'synced', 'failed')),
  error_message TEXT,
  CONSTRAINT fk_company FOREIGN KEY (company_id) REFERENCES companies(id),
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Índices para rendimiento
CREATE INDEX idx_offline_queue_company ON offline_sales_queue(company_id);
CREATE INDEX idx_offline_queue_status ON offline_sales_queue(status);
CREATE INDEX idx_offline_queue_user ON offline_sales_queue(user_id);

-- RLS policies
ALTER TABLE offline_sales_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their company's offline queue"
  ON offline_sales_queue FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert into their company's offline queue"
  ON offline_sales_queue FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update their company's offline queue"
  ON offline_sales_queue FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );
```

### State Management

El POS utiliza React hooks para gestión de estado local:

```typescript
// hooks/use-pos-cart.ts
export function usePOSCart() {
  const [cart, setCart] = useState<POSCart>(initialCart);
  
  const addItem = (product: Product, variant?: ProductVariant) => {
    // Add or update item in cart
  };
  
  const updateQuantity = (itemId: string, quantity: number) => {
    // Update item quantity
  };
  
  const removeItem = (itemId: string) => {
    // Remove item from cart
  };
  
  const applyDiscount = (type: 'percentage' | 'fixed', value: number) => {
    // Apply discount to cart
  };
  
  const clearCart = () => {
    // Clear all items
  };
  
  return {
    cart,
    addItem,
    updateQuantity,
    removeItem,
    applyDiscount,
    clearCart,
  };
}

// hooks/use-keyboard-shortcuts.ts
export function useKeyboardShortcuts(handlers: KeyboardShortcutHandlers) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F1') {
        e.preventDefault();
        handlers.onSearchProduct();
      }
      // ... other shortcuts
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlers]);
}

// hooks/use-offline-sync.ts (plan Empresarial)
export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queue, setQueue] = useState<OfflineQueueItem[]>([]);
  
  useEffect(() => {
    // Monitor online/offline status
    // Auto-sync when connection is restored
  }, [isOnline]);
  
  const addToQueue = (sale: POSSaleRequest) => {
    // Add sale to offline queue
  };
  
  const syncQueue = async () => {
    // Sync pending sales
  };
  
  return {
    isOnline,
    queue,
    addToQueue,
    syncQueue,
  };
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Cart Invariants
*For any* shopping cart and any product (with or without variants), when adding the product or modifying quantities, the cart totals (subtotal, tax, discount, total) should be mathematically consistent with the sum of individual item totals.
**Validates: Requirements 1.2, 1.4**

### Property 2: Discount Application
*For any* shopping cart, when applying a discount (percentage or fixed amount), both discount types should be accepted and the final total should correctly reflect the discount applied.
**Validates: Requirements 1.5**

### Property 3: Multiple Payment Methods
*For any* sale with multiple payment methods, the system should accept the payment split and the sum of all payment amounts should equal the sale total.
**Validates: Requirements 1.6, 12.2**

### Property 4: Change Calculation
*For any* cash payment where the amount received is greater than or equal to the amount due, the calculated change should equal the difference between received and due amounts.
**Validates: Requirements 1.7**

### Property 5: Stock Validation
*For any* product (with or without variants), when attempting to add it to the cart, the system should validate that sufficient stock is available, considering variant-specific stock if applicable.
**Validates: Requirements 1.8, 11.3**

### Property 6: Generic Customer Assignment
*For any* sale created without a specific customer selected, the system should automatically assign the sale to the generic customer.
**Validates: Requirements 2.3**

### Property 7: Customer Reassignment
*For any* sale in progress (before completion), the system should allow changing the associated customer to any valid customer or null (generic).
**Validates: Requirements 2.5**

### Property 8: Cash Register Opening Validation
*For any* sale created through the POS, the sale should be associated with a valid active cash register opening, and no sale should be created without an active opening.
**Validates: Requirements 3.1, 3.5**

### Property 9: Cash Register Movement Integrity
*For any* completed sale, the system should automatically register cash movements in the associated cash register, and for cash payments, the cash register balance should increase by the cash payment amount.
**Validates: Requirements 3.3, 3.4**

### Property 10: Ticket Generation Completeness
*For any* completed sale, the generated ticket should include all required fields: sale number, date/time, products, quantities, prices, discounts, subtotal, total, payment methods, and change (if applicable).
**Validates: Requirements 4.1, 4.2**

### Property 11: Ticket PDF Generation
*For any* completed sale, the system should be able to generate a PDF version of the ticket suitable for email delivery.
**Validates: Requirements 4.3**

### Property 12: Ticket Regeneration
*For any* existing completed sale, the system should be able to regenerate the ticket with identical content to the original.
**Validates: Requirements 4.4**

### Property 13: Offline Product Cache (Empresarial Plan)
*For any* company with Empresarial plan, the offline cache should contain the most frequently sold products, and the cache should be refreshed periodically.
**Validates: Requirements 6.1**

### Property 14: Offline Sale Creation (Empresarial Plan)
*For any* product in the offline cache, when the system is offline, a sale should be creatable using cached product data.
**Validates: Requirements 6.2**

### Property 15: Offline Queue Management (Empresarial Plan)
*For any* sale created while offline, the sale should be added to the sync queue with status 'pending'.
**Validates: Requirements 6.3**

### Property 16: Offline Sync Correctness (Empresarial Plan)
*For any* pending sales in the sync queue, when connection is restored, all sales should be synced to the server and marked as 'synced', or marked as 'failed' with error details if sync fails.
**Validates: Requirements 6.4**

### Property 17: Stock Conflict Resolution (Empresarial Plan)
*For any* offline sale that encounters a stock conflict during sync (insufficient stock), the system should mark the sale as failed and provide clear error information.
**Validates: Requirements 6.6**

### Property 18: Report Calculation Accuracy
*For any* date range and filter criteria, POS reports (sales by cashier, products sold, payment methods, sales by hour) should accurately reflect the sum and aggregation of underlying sales data.
**Validates: Requirements 7.1, 7.2, 7.3, 7.4**

### Property 19: Plan Restriction Enforcement
*For any* company, the system should enforce plan-specific restrictions: Básico allows 1 active cash register, Profesional allows 3, Empresarial allows unlimited; offline mode is only available for Empresarial; advanced reports are only available for Profesional and Empresarial.
**Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5, 8.6**

### Property 20: Multi-Tenant Data Isolation
*For any* POS operation (product search, sale creation, customer selection), the system should only return and operate on data belonging to the user's company, enforced by RLS policies.
**Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5**

### Property 21: Variant Selection Requirement
*For any* product with variants, the system should require variant selection before adding to cart, and should not allow adding the product without a specific variant selected.
**Validates: Requirements 11.1, 11.2**

### Property 22: Variant Stock Display
*For any* product variant, the system should display the variant-specific stock quantity, and should disable selection of variants with zero stock.
**Validates: Requirements 11.3, 11.4**

### Property 23: Multiple Variants in Cart
*For any* product with variants, the system should allow adding multiple different variants of the same product to the cart as separate line items.
**Validates: Requirements 11.5**

### Property 24: Sale Total Validation
*For any* sale, the total must be greater than zero before the sale can be completed.
**Validates: Requirements 12.1**

### Property 25: Discount Limit Validation
*For any* discount applied to a cart, the discount amount should not exceed the subtotal of the cart.
**Validates: Requirements 12.3**

### Property 26: Quantity Validation
*For any* cart item, the quantity must be a positive number (greater than zero).
**Validates: Requirements 12.4**

### Property 27: Stock Availability During Sale
*For any* sale in progress, if a product's stock becomes insufficient (due to concurrent sales), the system should notify the user and update the cart accordingly.
**Validates: Requirements 12.5**

### Property 28: Cash Payment Validation
*For any* cash payment, the amount received must be greater than or equal to the amount due in cash.
**Validates: Requirements 12.6**

### Property 29: Currency Consistency
*For any* sale, all prices, totals, and calculations should use the company's configured currency, and all monetary displays should use the correct currency symbol, position, and decimal formatting.
**Validates: Requirements 13.1, 13.2, 13.3, 13.4**

## Error Handling

### Error Categories

El POS maneja errores en cuatro categorías principales:

1. **Validation Errors**: Errores de validación de entrada del usuario
2. **Business Logic Errors**: Violaciones de reglas de negocio
3. **Network Errors**: Fallos de conexión o timeout
4. **System Errors**: Errores inesperados del sistema

### Error Handling Strategy

```typescript
// lib/utils/pos-error-handler.ts

export class POSError extends Error {
  constructor(
    message: string,
    public category: 'validation' | 'business' | 'network' | 'system',
    public code: string,
    public recoverable: boolean = true
  ) {
    super(message);
    this.name = 'POSError';
  }
}

export const POS_ERROR_CODES = {
  // Validation Errors
  INVALID_QUANTITY: 'POS_001',
  INVALID_DISCOUNT: 'POS_002',
  INVALID_PAYMENT: 'POS_003',
  
  // Business Logic Errors
  INSUFFICIENT_STOCK: 'POS_101',
  NO_ACTIVE_OPENING: 'POS_102',
  INVALID_CUSTOMER: 'POS_103',
  TOTAL_ZERO: 'POS_104',
  PAYMENT_MISMATCH: 'POS_105',
  
  // Network Errors
  CONNECTION_LOST: 'POS_201',
  SYNC_FAILED: 'POS_202',
  TIMEOUT: 'POS_203',
  
  // System Errors
  UNEXPECTED_ERROR: 'POS_301',
  DATABASE_ERROR: 'POS_302',
} as const;

export function handlePOSError(error: unknown): POSError {
  if (error instanceof POSError) {
    return error;
  }
  
  // Convert known errors to POSError
  if (error instanceof Error) {
    if (error.message.includes('stock')) {
      return new POSError(
        error.message,
        'business',
        POS_ERROR_CODES.INSUFFICIENT_STOCK
      );
    }
    
    if (error.message.includes('network') || error.message.includes('fetch')) {
      return new POSError(
        'Error de conexión. Verifica tu internet.',
        'network',
        POS_ERROR_CODES.CONNECTION_LOST
      );
    }
  }
  
  // Unknown error
  return new POSError(
    'Error inesperado. Por favor intenta nuevamente.',
    'system',
    POS_ERROR_CODES.UNEXPECTED_ERROR,
    false
  );
}
```

### Error Recovery Strategies

1. **Validation Errors**: Mostrar mensaje al usuario, mantener estado actual, permitir corrección
2. **Stock Insuficiente**: Actualizar carrito automáticamente, notificar al usuario, sugerir cantidad disponible
3. **Sin Apertura de Caja**: Redirigir a apertura de caja, preservar carrito en localStorage
4. **Error de Conexión (Empresarial)**: Cambiar a modo offline, agregar venta a cola de sincronización
5. **Error de Conexión (Básico/Profesional)**: Mostrar error, permitir reintentar, no perder datos del carrito
6. **Error de Sincronización**: Marcar venta como fallida, mostrar detalles del error, permitir reintento manual

### User-Friendly Error Messages

```typescript
export const ERROR_MESSAGES = {
  [POS_ERROR_CODES.INSUFFICIENT_STOCK]: (product: string, available: number) =>
    `Stock insuficiente para ${product}. Disponible: ${available}`,
  
  [POS_ERROR_CODES.NO_ACTIVE_OPENING]: 
    'No hay una caja abierta. Debes abrir la caja antes de vender.',
  
  [POS_ERROR_CODES.PAYMENT_MISMATCH]: (expected: number, received: number) =>
    `El total de pagos (${received}) no coincide con el total de la venta (${expected})`,
  
  [POS_ERROR_CODES.CONNECTION_LOST]:
    'Se perdió la conexión. Verifica tu internet e intenta nuevamente.',
  
  [POS_ERROR_CODES.SYNC_FAILED]:
    'No se pudo sincronizar la venta. Se reintentará automáticamente.',
};
```

## Testing Strategy

### Dual Testing Approach

El sistema POS requiere tanto unit tests como property-based tests para garantizar corrección completa:

- **Unit Tests**: Validan ejemplos específicos, casos edge, y condiciones de error
- **Property Tests**: Verifican propiedades universales a través de múltiples inputs generados

### Property-Based Testing Configuration

**Framework**: fast-check (para TypeScript/JavaScript)

**Configuración**:
- Mínimo 100 iteraciones por property test
- Cada test debe referenciar su propiedad del diseño
- Tag format: `Feature: punto-venta-pos, Property {number}: {property_text}`

### Test Organization

```
__tests__/
├── lib/
│   └── actions/
│       ├── pos.unit.test.ts              # Unit tests para acciones POS
│       ├── pos.property.test.ts          # Property tests para corrección
│       ├── pos-cart.unit.test.ts         # Unit tests para carrito
│       ├── pos-cart.property.test.ts     # Property tests para carrito
│       ├── pos-offline.unit.test.ts      # Unit tests para modo offline
│       └── pos-offline.property.test.ts  # Property tests para offline
├── components/
│   └── dashboard/
│       └── pos/
│           ├── product-grid.unit.test.tsx
│           ├── shopping-cart.unit.test.tsx
│           ├── payment-modal.unit.test.tsx
│           └── customer-selector.unit.test.tsx
└── hooks/
    ├── use-pos-cart.unit.test.ts
    ├── use-keyboard-shortcuts.unit.test.ts
    └── use-offline-sync.unit.test.ts
```

### Property Test Examples

```typescript
// __tests__/lib/actions/pos-cart.property.test.ts

import fc from 'fast-check';
import { calculateCartTotals } from '@/lib/actions/pos';

describe('POS Cart Properties', () => {
  // Feature: punto-venta-pos, Property 1: Cart Invariants
  it('cart totals should be mathematically consistent', () => {
    fc.assert(
      fc.property(
        fc.array(fc.record({
          quantity: fc.integer({ min: 1, max: 100 }),
          unit_price: fc.float({ min: 0.01, max: 10000, noNaN: true }),
          tax_rate: fc.float({ min: 0, max: 0.30, noNaN: true }),
          discount_percent: fc.float({ min: 0, max: 100, noNaN: true }),
        }), { minLength: 1, maxLength: 20 }),
        (items) => {
          const cart = calculateCartTotals(items);
          
          // Calculate expected totals
          const expectedSubtotal = items.reduce((sum, item) => {
            const itemSubtotal = item.quantity * item.unit_price;
            const discount = itemSubtotal * (item.discount_percent / 100);
            return sum + (itemSubtotal - discount);
          }, 0);
          
          const expectedTax = items.reduce((sum, item) => {
            const itemSubtotal = item.quantity * item.unit_price;
            const discount = itemSubtotal * (item.discount_percent / 100);
            const subtotalAfterDiscount = itemSubtotal - discount;
            return sum + (subtotalAfterDiscount * item.tax_rate);
          }, 0);
          
          const expectedTotal = expectedSubtotal + expectedTax;
          
          // Verify invariants
          expect(cart.subtotal).toBeCloseTo(expectedSubtotal, 2);
          expect(cart.tax_amount).toBeCloseTo(expectedTax, 2);
          expect(cart.total).toBeCloseTo(expectedTotal, 2);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: punto-venta-pos, Property 2: Discount Application
  it('discount should be correctly applied for both percentage and fixed amount', () => {
    fc.assert(
      fc.property(
        fc.record({
          subtotal: fc.float({ min: 10, max: 10000, noNaN: true }),
          discount_type: fc.constantFrom('percentage', 'fixed'),
          discount_value: fc.float({ min: 0, max: 100, noNaN: true }),
        }),
        ({ subtotal, discount_type, discount_value }) => {
          const result = applyDiscount(subtotal, discount_type, discount_value);
          
          if (discount_type === 'percentage') {
            const expectedDiscount = subtotal * (discount_value / 100);
            expect(result.discount_amount).toBeCloseTo(expectedDiscount, 2);
            expect(result.total).toBeCloseTo(subtotal - expectedDiscount, 2);
          } else {
            const expectedDiscount = Math.min(discount_value, subtotal);
            expect(result.discount_amount).toBeCloseTo(expectedDiscount, 2);
            expect(result.total).toBeCloseTo(subtotal - expectedDiscount, 2);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: punto-venta-pos, Property 4: Change Calculation
  it('change should equal received minus due', () => {
    fc.assert(
      fc.property(
        fc.record({
          amount_due: fc.float({ min: 0.01, max: 10000, noNaN: true }),
          amount_received: fc.float({ min: 0.01, max: 20000, noNaN: true }),
        }).filter(({ amount_due, amount_received }) => amount_received >= amount_due),
        ({ amount_due, amount_received }) => {
          const change = calculateChange(amount_due, amount_received);
          const expectedChange = amount_received - amount_due;
          
          expect(change).toBeCloseTo(expectedChange, 2);
          expect(change).toBeGreaterThanOrEqual(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Unit Test Examples

```typescript
// __tests__/lib/actions/pos.unit.test.ts

describe('POS Actions - Unit Tests', () => {
  describe('Stock Validation', () => {
    it('should reject adding product with insufficient stock', async () => {
      const product = {
        id: '1',
        name: 'Test Product',
        stock_quantity: 5,
        has_variants: false,
      };
      
      const result = await validateStockAvailability(product, null, 10);
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Stock insuficiente');
    });

    it('should accept adding product with sufficient stock', async () => {
      const product = {
        id: '1',
        name: 'Test Product',
        stock_quantity: 10,
        has_variants: false,
      };
      
      const result = await validateStockAvailability(product, null, 5);
      
      expect(result.valid).toBe(true);
    });

    it('should validate variant stock for products with variants', async () => {
      const product = {
        id: '1',
        name: 'Test Product',
        has_variants: true,
      };
      
      const variant = {
        id: 'v1',
        variant_name: 'Size M',
        stock_quantity: 3,
      };
      
      const result = await validateStockAvailability(product, variant, 5);
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Stock insuficiente');
    });
  });

  describe('Cash Register Opening Validation', () => {
    it('should reject sale creation without active opening', async () => {
      // Mock no active opening
      jest.spyOn(cashRegisterActions, 'getActiveCashRegisterOpening')
        .mockResolvedValue(null);
      
      const saleRequest = createMockSaleRequest();
      const result = await createPOSSale(saleRequest);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('No hay una caja abierta');
    });

    it('should create sale with active opening', async () => {
      // Mock active opening
      const mockOpening = { id: 'opening-1', shift: 'Mañana' };
      jest.spyOn(cashRegisterActions, 'getActiveCashRegisterOpening')
        .mockResolvedValue(mockOpening);
      
      const saleRequest = createMockSaleRequest();
      const result = await createPOSSale(saleRequest);
      
      expect(result.success).toBe(true);
      expect(result.sale_id).toBeDefined();
    });
  });

  describe('Generic Customer Assignment', () => {
    it('should assign generic customer when no customer selected', async () => {
      const genericCustomer = { id: 'generic-1', name: 'Cliente Genérico' };
      jest.spyOn(customerActions, 'getGenericCustomer')
        .mockResolvedValue(genericCustomer);
      
      const saleRequest = {
        ...createMockSaleRequest(),
        customer_id: null,
      };
      
      const result = await createPOSSale(saleRequest);
      const sale = await getSale(result.sale_id);
      
      expect(sale.customer_id).toBe(genericCustomer.id);
    });
  });
});
```

### Integration Tests

```typescript
// __tests__/integration/pos-flow.test.ts

describe('POS Complete Flow Integration', () => {
  it('should complete a full sale flow from cart to payment', async () => {
    // 1. Open cash register
    const opening = await createCashRegisterOpening({
      opening_date: new Date().toISOString(),
      shift: 'Mañana',
      initial_cash_amount: 1000,
    });
    
    // 2. Add products to cart
    const cart = createEmptyCart();
    const product1 = await getProduct('product-1');
    const product2 = await getProduct('product-2');
    
    addItemToCart(cart, product1, null, 2);
    addItemToCart(cart, product2, null, 1);
    
    // 3. Apply discount
    applyDiscountToCart(cart, 'percentage', 10);
    
    // 4. Create sale with multiple payments
    const saleRequest = {
      customer_id: null,
      items: cart.items,
      payments: [
        { payment_method: 'Efectivo', amount: 500 },
        { payment_method: 'Tarjeta', amount: cart.total - 500 },
      ],
      discount_type: cart.discount_type,
      discount_value: cart.discount_value,
      notes: null,
    };
    
    const result = await createPOSSale(saleRequest);
    
    // 5. Verify sale was created
    expect(result.success).toBe(true);
    const sale = await getSale(result.sale_id);
    expect(sale).toBeDefined();
    expect(sale.total).toBeCloseTo(cart.total, 2);
    
    // 6. Verify stock was updated
    const updatedProduct1 = await getProduct('product-1');
    expect(updatedProduct1.stock_quantity).toBe(product1.stock_quantity - 2);
    
    // 7. Verify ticket can be generated
    const ticket = await generatePOSTicket(result.sale_id);
    expect(ticket.success).toBe(true);
    expect(ticket.ticket_html).toContain(sale.sale_number);
  });
});
```

### Test Coverage Goals

- **Unit Tests**: 80% code coverage mínimo
- **Property Tests**: 100% de propiedades de corrección implementadas
- **Integration Tests**: Flujos críticos completos (crear venta, modo offline, sincronización)
- **E2E Tests**: Flujos de usuario principales en diferentes dispositivos (desktop, tablet, móvil)

### Continuous Testing

- Tests ejecutados en cada commit (CI/CD)
- Property tests ejecutados con 100 iteraciones en CI, 1000 iteraciones en nightly builds
- Tests de rendimiento para validar tiempos de respuesta < 500ms
- Tests de accesibilidad para validar tamaño de botones táctiles (44x44px mínimo)
