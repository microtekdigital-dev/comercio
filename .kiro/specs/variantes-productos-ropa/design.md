# Design Document: Variantes de Productos para Ropa

## Overview

Este diseño extiende el sistema ERP existente para soportar variantes de productos (tallas) específicamente para tiendas de ropa. La implementación mantiene retrocompatibilidad completa con productos simples existentes y minimiza cambios a la estructura de base de datos actual.

El sistema permitirá a los usuarios activar variantes en productos específicos, seleccionar entre tipos predefinidos (Camisas, Pantalones) o crear tallas personalizadas, y gestionar stock independiente para cada variante.

## Architecture

### Database Schema

La implementación agrega una nueva tabla `product_variants` relacionada con la tabla `products` existente:

```sql
CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_name VARCHAR(50) NOT NULL,
  sku VARCHAR(100),
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  min_stock_level INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_variant_per_product UNIQUE(product_id, variant_name),
  CONSTRAINT positive_stock CHECK (stock_quantity >= 0),
  CONSTRAINT positive_min_stock CHECK (min_stock_level >= 0)
);

CREATE INDEX idx_product_variants_product ON product_variants(product_id);
CREATE INDEX idx_product_variants_company ON product_variants(company_id);
```

Nueva tabla para plantillas de variantes personalizadas:

```sql
CREATE TABLE variant_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  template_name VARCHAR(100) NOT NULL,
  sizes TEXT[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_template_per_company UNIQUE(company_id, template_name),
  CONSTRAINT non_empty_sizes CHECK (array_length(sizes, 1) > 0)
);

CREATE INDEX idx_variant_templates_company ON variant_templates(company_id);
```

Modificaciones mínimas a la tabla `products`:

```sql
ALTER TABLE products 
  ADD COLUMN has_variants BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN variant_type VARCHAR(20) CHECK (variant_type IN ('shirts', 'pants', 'custom')),
  ADD COLUMN variant_template_id UUID REFERENCES variant_templates(id) ON DELETE SET NULL;

CREATE INDEX idx_products_variant_template ON products(variant_template_id);
```

Modificación a la tabla `stock_movements` para soportar variantes:

```sql
ALTER TABLE stock_movements
  ADD COLUMN variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL;

CREATE INDEX idx_stock_movements_variant ON stock_movements(variant_id);
```

Modificación a las tablas de items de ventas y órdenes:

```sql
ALTER TABLE sale_items
  ADD COLUMN variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  ADD COLUMN variant_name VARCHAR(50);

ALTER TABLE purchase_order_items
  ADD COLUMN variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  ADD COLUMN variant_name VARCHAR(50);

ALTER TABLE quote_items
  ADD COLUMN variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  ADD COLUMN variant_name VARCHAR(50);
```

### Row Level Security (RLS)

```sql
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view variants from their company"
  ON product_variants FOR SELECT
  USING (company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can insert variants for their company"
  ON product_variants FOR INSERT
  WITH CHECK (company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can update variants from their company"
  ON product_variants FOR UPDATE
  USING (company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can delete variants from their company"
  ON product_variants FOR DELETE
  USING (company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  ));

ALTER TABLE variant_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view templates from their company"
  ON variant_templates FOR SELECT
  USING (company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can insert templates for their company"
  ON variant_templates FOR INSERT
  WITH CHECK (company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can update templates from their company"
  ON variant_templates FOR UPDATE
  USING (company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can delete templates from their company"
  ON variant_templates FOR DELETE
  USING (company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  ));
```

## Components and Interfaces

### TypeScript Types

```typescript
// Tipos de variantes predefinidas
export type VariantType = 'none' | 'shirts' | 'pants' | 'custom';

// Interfaz de plantilla de variantes
export interface VariantTemplate {
  id: string;
  company_id: string;
  template_name: string;
  sizes: string[];
  created_at: string;
  updated_at: string;
}

// Interfaz de variante
export interface ProductVariant {
  id: string;
  company_id: string;
  product_id: string;
  variant_name: string;
  sku: string | null;
  stock_quantity: number;
  min_stock_level: number;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Extender Product para incluir variantes
export interface Product {
  // ... campos existentes ...
  has_variants: boolean;
  variant_type: VariantType | null;
  variant_template_id: string | null;
  variants?: ProductVariant[];
}

// Extender ProductFormData
export interface ProductFormData {
  // ... campos existentes ...
  has_variants: boolean;
  variant_type?: VariantType;
  variant_template_id?: string | null;
  variants?: ProductVariantFormData[];
}

export interface ProductVariantFormData {
  id?: string; // Para edición
  variant_name: string;
  sku?: string;
  stock_quantity: number;
  min_stock_level: number;
  sort_order: number;
}

// Extender SaleItem para incluir variante
export interface SaleItem {
  // ... campos existentes ...
  variant_id: string | null;
  variant_name: string | null;
}

// Extender StockMovement para incluir variante
export interface StockMovement {
  // ... campos existentes ...
  variant_id: string | null;
  variant?: ProductVariant;
}
```

### Predefined Variant Types

```typescript
export const VARIANT_TYPES = {
  none: {
    label: 'Sin variantes',
    sizes: []
  },
  shirts: {
    label: 'Camisas/Remeras',
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL']
  },
  pants: {
    label: 'Pantalones',
    sizes: ['28', '30', '32', '34', '36', '38', '40', '42', '44', '46']
  },
  custom: {
    label: 'Personalizado',
    sizes: []
  }
} as const;
```

### Server Actions

```typescript
// lib/actions/product-variants.ts

// Obtener variantes de un producto
export async function getProductVariants(productId: string): Promise<ProductVariant[]>

// Crear variantes para un producto (usado al seleccionar tipo predefinido)
export async function createVariantsForProduct(
  productId: string, 
  variantType: VariantType,
  customVariants?: ProductVariantFormData[]
): Promise<{ data?: ProductVariant[], error?: string }>

// Actualizar una variante específica
export async function updateProductVariant(
  variantId: string,
  data: Partial<ProductVariantFormData>
): Promise<{ data?: ProductVariant, error?: string }>

// Eliminar una variante (solo si stock es 0)
export async function deleteProductVariant(
  variantId: string
): Promise<{ success?: boolean, error?: string }>

// Obtener stock total de un producto (suma de variantes o stock simple)
export async function getProductTotalStock(productId: string): Promise<number>

// Validar stock disponible de una variante
export async function validateVariantStock(
  variantId: string,
  quantity: number
): Promise<{ available: boolean, currentStock: number }>

// Convertir producto simple a producto con variantes
export async function convertToVariantProduct(
  productId: string,
  variantType: VariantType,
  stockDistribution: 'default' | 'distribute',
  customVariants?: ProductVariantFormData[]
): Promise<{ data?: Product, error?: string }>

// Desactivar variantes de un producto (requiere stock 0 en todas)
export async function disableProductVariants(
  productId: string
): Promise<{ success?: boolean, error?: string }>

// lib/actions/variant-templates.ts

// Obtener todas las plantillas de la compañía
export async function getVariantTemplates(): Promise<VariantTemplate[]>

// Crear una nueva plantilla
export async function createVariantTemplate(
  templateName: string,
  sizes: string[]
): Promise<{ data?: VariantTemplate, error?: string }>

// Actualizar una plantilla existente
export async function updateVariantTemplate(
  templateId: string,
  templateName: string,
  sizes: string[]
): Promise<{ data?: VariantTemplate, error?: string }>

// Eliminar una plantilla (validar que no esté en uso)
export async function deleteVariantTemplate(
  templateId: string
): Promise<{ success?: boolean, error?: string }>

// Verificar si una plantilla está siendo usada por productos
export async function isTemplateInUse(
  templateId: string
): Promise<{ inUse: boolean, productCount: number }>
```

### UI Components

```typescript
// components/dashboard/product-variant-selector.tsx
// Selector de tipo de variante en formulario de producto
interface ProductVariantSelectorProps {
  value: VariantType;
  onChange: (type: VariantType) => void;
  disabled?: boolean;
}

// components/dashboard/variant-stock-table.tsx
// Tabla para gestionar stock de variantes
interface VariantStockTableProps {
  variants: ProductVariantFormData[];
  onChange: (variants: ProductVariantFormData[]) => void;
  variantType: VariantType;
  readOnly?: boolean;
  onSaveTemplate?: (templateName: string, sizes: string[]) => void;
  templates?: VariantTemplate[];
  onLoadTemplate?: (templateId: string) => void;
}

// components/dashboard/variant-selector-in-sale.tsx
// Selector de variante al agregar producto a venta
interface VariantSelectorInSaleProps {
  productId: string;
  variants: ProductVariant[];
  onSelect: (variant: ProductVariant) => void;
  selectedVariantId?: string;
}

// components/dashboard/product-variant-badge.tsx
// Badge visual para indicar que un producto tiene variantes
interface ProductVariantBadgeProps {
  hasVariants: boolean;
  variantCount?: number;
}

// components/dashboard/variant-template-manager.tsx
// Gestor de plantillas de variantes
interface VariantTemplateManagerProps {
  templates: VariantTemplate[];
  onEdit: (template: VariantTemplate) => void;
  onDelete: (templateId: string) => void;
  onRefresh: () => void;
}

// components/dashboard/save-variant-template-dialog.tsx
// Diálogo para guardar una nueva plantilla
interface SaveVariantTemplateDialogProps {
  open: boolean;
  onClose: () => void;
  sizes: string[];
  onSave: (templateName: string) => void;
}
```

## Data Models

### Product with Variants

Un producto puede existir en dos estados:

1. **Producto Simple** (`has_variants = false`):
   - Stock almacenado en `products.stock_quantity`
   - No tiene registros en `product_variants`
   - Comportamiento idéntico al sistema actual

2. **Producto con Variantes** (`has_variants = true`):
   - `products.stock_quantity` se ignora (puede mantenerse en 0)
   - Stock real almacenado en `product_variants.stock_quantity`
   - Stock total calculado como `SUM(variants.stock_quantity)`
   - Debe tener al menos una variante activa

### Variant Types

- **none**: Producto simple sin variantes
- **shirts**: Crea automáticamente 7 variantes (XS, S, M, L, XL, XXL, XXXL)
- **pants**: Crea automáticamente 10 variantes (28, 30, 32, 34, 36, 38, 40, 42, 44, 46)
- **custom**: Usuario define manualmente las variantes

### Stock Movement with Variants

Cuando un producto tiene variantes:
- `stock_movements.variant_id` debe estar poblado
- `stock_movements.product_id` mantiene la referencia al producto padre
- Consultas de historial pueden filtrar por `variant_id`

Para productos sin variantes:
- `stock_movements.variant_id` es NULL
- Comportamiento idéntico al actual

## Correctness Properties

*Una propiedad es una característica o comportamiento que debe cumplirse en todas las ejecuciones válidas del sistema - esencialmente, una declaración formal sobre lo que el sistema debe hacer. Las propiedades sirven como puente entre especificaciones legibles por humanos y garantías de corrección verificables por máquina.*

### Property 1: Stock total es suma de variantes
*Para cualquier* producto con variantes activas, el stock total calculado debe ser igual a la suma del stock de todas sus variantes activas.
**Validates: Requirements 3.2, 6.2, 7.6**

### Property 2: Retrocompatibilidad de productos simples
*Para cualquier* producto sin variantes (has_variants = false), todas las operaciones CRUD, consultas de stock, y movimientos de inventario deben funcionar exactamente como funcionaban antes de implementar variantes.
**Validates: Requirements 1.4, 7.3, 7.5, 8.4**

### Property 3: Producto con variantes requiere al menos una variante
*Para cualquier* producto donde has_variants = true, el sistema debe rechazar guardar el producto si no tiene al menos una variante configurada.
**Validates: Requirements 1.5**

### Property 4: Tipos predefinidos crean todas las variantes
*Para cualquier* producto al que se le asigna variant_type 'shirts' o 'pants', el sistema debe crear automáticamente todas las variantes correspondientes según VARIANT_TYPES.
**Validates: Requirements 2.4**

### Property 5: Unicidad de nombres de variantes por producto
*Para cualquier* producto, el sistema debe rechazar crear o actualizar una variante si ya existe otra variante con el mismo nombre (case-insensitive) en ese producto.
**Validates: Requirements 2.6, 9.5**

### Property 6: Movimientos de stock con variantes requieren variant_id
*Para cualquier* movimiento de stock de un producto con variantes, el sistema debe requerir y almacenar el variant_id, rechazando movimientos sin este dato.
**Validates: Requirements 3.3, 8.1**

### Property 7: Alertas de stock bajo por variante
*Para cualquier* variante donde stock_quantity <= min_stock_level, el sistema debe generar una alerta específica para esa variante (no solo para el producto).
**Validates: Requirements 3.5**

### Property 8: Selector muestra solo variantes con stock
*Para cualquier* producto con variantes en el flujo de ventas, el selector debe mostrar únicamente las variantes donde stock_quantity > 0.
**Validates: Requirements 5.2**

### Property 9: Validación de stock suficiente en ventas
*Para cualquier* intento de agregar una variante a una venta, el sistema debe rechazar la operación si la cantidad solicitada excede el stock_quantity disponible de esa variante.
**Validates: Requirements 5.4**

### Property 10: Descuento de stock por variante en ventas
*Para cualquier* venta completada que incluye variantes, el stock_after de cada variante debe ser igual a stock_before menos la cantidad vendida de esa variante específica.
**Validates: Requirements 5.5**

### Property 11: Conversión preserva stock total
*Para cualquier* producto simple convertido a producto con variantes, la suma del stock de todas las variantes creadas debe ser igual al stock original del producto simple.
**Validates: Requirements 4.6**

### Property 12: Filtrado de historial por variante
*Para cualquier* consulta de historial de movimientos filtrada por variant_id, todos los resultados deben tener ese variant_id y pertenecer al mismo producto.
**Validates: Requirements 8.2**

### Property 13: Historial incluye información de variante
*Para cualquier* movimiento de stock de un producto con variantes, el registro debe incluir tanto product_id como variant_id, y la información de la variante debe ser accesible en consultas.
**Validates: Requirements 8.3**

### Property 14: Prevenir eliminar producto con stock en variantes
*Para cualquier* producto con variantes, el sistema debe rechazar la eliminación si existe al menos una variante con stock_quantity > 0.
**Validates: Requirements 9.1**

### Property 15: Prevenir eliminar variante con stock
*Para cualquier* variante individual, el sistema debe rechazar la eliminación si stock_quantity > 0.
**Validates: Requirements 9.2**

### Property 16: Desactivar variantes requiere stock cero
*Para cualquier* producto con variantes, el sistema debe rechazar desactivar las variantes (convertir a has_variants = false) si existe al menos una variante con stock_quantity > 0.
**Validates: Requirements 9.3**

### Property 17: Stock de variantes no negativo
*Para cualquier* operación que modifique stock_quantity de una variante, el sistema debe rechazar valores negativos.
**Validates: Requirements 9.4**

## Error Handling

### Validation Errors

```typescript
export const VARIANT_ERRORS = {
  NO_VARIANTS: 'Un producto con variantes debe tener al menos una variante configurada',
  DUPLICATE_VARIANT: 'Ya existe una variante con ese nombre en este producto',
  VARIANT_REQUIRED: 'Debe seleccionar una variante para este producto',
  INSUFFICIENT_STOCK: 'Stock insuficiente para la variante seleccionada',
  CANNOT_DELETE_WITH_STOCK: 'No se puede eliminar una variante con stock positivo',
  CANNOT_DISABLE_WITH_STOCK: 'No se pueden desactivar las variantes mientras haya stock',
  NEGATIVE_STOCK: 'El stock no puede ser negativo',
  VARIANT_NOT_FOUND: 'Variante no encontrada',
  PRODUCT_NOT_FOUND: 'Producto no encontrado',
  INVALID_VARIANT_TYPE: 'Tipo de variante inválido',
  TEMPLATE_NAME_REQUIRED: 'El nombre de la plantilla es requerido',
  TEMPLATE_NAME_EXISTS: 'Ya existe una plantilla con ese nombre',
  TEMPLATE_IN_USE: 'No se puede eliminar una plantilla que está siendo utilizada por productos',
  TEMPLATE_NOT_FOUND: 'Plantilla no encontrada',
  TEMPLATE_SIZES_REQUIRED: 'La plantilla debe tener al menos una talla'
} as const;
```

### Error Scenarios

1. **Crear producto con variantes sin variantes**: Retornar error de validación
2. **Agregar variante duplicada**: Retornar error de unicidad
3. **Vender variante sin stock**: Retornar error de stock insuficiente
4. **Eliminar variante con stock**: Retornar error de validación
5. **Movimiento de stock sin variant_id**: Retornar error de validación
6. **Stock negativo**: Rechazado por constraint de base de datos
7. **Guardar plantilla sin nombre**: Retornar error de validación
8. **Guardar plantilla con nombre duplicado**: Retornar error de unicidad
9. **Eliminar plantilla en uso**: Retornar error de validación con cantidad de productos afectados
10. **Guardar plantilla sin tallas**: Retornar error de validación

## Testing Strategy

### Dual Testing Approach

La estrategia de testing combina dos enfoques complementarios:

1. **Unit Tests**: Validan ejemplos específicos, casos edge y condiciones de error
2. **Property-Based Tests**: Validan propiedades universales a través de múltiples inputs generados

Ambos tipos de tests son necesarios para cobertura completa. Los unit tests capturan bugs concretos y casos específicos, mientras que los property tests verifican corrección general.

### Property-Based Testing

Utilizaremos **fast-check** para TypeScript, configurado para ejecutar mínimo 100 iteraciones por propiedad.

Cada property test debe:
- Referenciar su propiedad del documento de diseño
- Usar el formato de tag: `Feature: variantes-productos-ropa, Property {N}: {descripción}`
- Generar inputs aleatorios representativos
- Verificar la propiedad para todos los inputs generados

### Unit Testing

Los unit tests deben enfocarse en:
- Ejemplos específicos de cada tipo de variante (shirts, pants, custom)
- Casos edge: producto sin variantes, conversión de simple a variantes
- Condiciones de error: stock negativo, variantes duplicadas, eliminación con stock
- Integración entre componentes: ventas con variantes, movimientos de stock

### Test Coverage Areas

1. **Creación de variantes**:
   - Property test: tipos predefinidos crean todas las variantes
   - Unit tests: cada tipo específico, variantes personalizadas

2. **Gestión de stock**:
   - Property test: stock total es suma de variantes
   - Property test: descuento correcto en ventas
   - Unit tests: casos específicos de bajo stock

3. **Validaciones**:
   - Property tests: unicidad, stock no negativo, variante requerida
   - Unit tests: mensajes de error específicos

4. **Retrocompatibilidad**:
   - Property test: productos simples funcionan igual
   - Unit tests: operaciones específicas en productos existentes

5. **Conversión**:
   - Property test: preservación de stock total
   - Unit tests: diferentes estrategias de distribución

### Testing Library Configuration

```typescript
// tests/setup.ts
import fc from 'fast-check';

// Configuración global para fast-check
fc.configureGlobal({
  numRuns: 100, // Mínimo 100 iteraciones
  verbose: true
});

// Generadores personalizados
export const arbitraries = {
  variantType: fc.constantFrom('shirts', 'pants', 'custom'),
  variantName: fc.string({ minLength: 1, maxLength: 50 }),
  stock: fc.nat({ max: 10000 }),
  productWithVariants: fc.record({
    id: fc.uuid(),
    has_variants: fc.constant(true),
    variant_type: fc.constantFrom('shirts', 'pants', 'custom'),
    variants: fc.array(fc.record({
      variant_name: fc.string({ minLength: 1, maxLength: 50 }),
      stock_quantity: fc.nat({ max: 1000 })
    }), { minLength: 1, maxLength: 10 })
  })
};
```

## Implementation Notes

### Migration Strategy

1. **Fase 1**: Agregar columnas a tablas existentes (has_variants, variant_type)
2. **Fase 2**: Crear tabla product_variants con RLS
3. **Fase 3**: Modificar tablas de items (sale_items, purchase_order_items, quote_items)
4. **Fase 4**: Actualizar server actions para soportar variantes
5. **Fase 5**: Crear componentes UI para gestión de variantes
6. **Fase 6**: Integrar variantes en flujos de ventas y órdenes

### Backward Compatibility

- Productos existentes automáticamente tienen `has_variants = false`
- Consultas de stock verifican `has_variants` y retornan campo apropiado
- Movimientos de stock sin `variant_id` continúan funcionando para productos simples
- UI muestra campos tradicionales para productos sin variantes

### Performance Considerations

- Índices en `product_variants(product_id)` para joins eficientes
- Índices en `stock_movements(variant_id)` para consultas de historial
- Cálculo de stock total puede cachearse si es necesario
- Consultas de variantes disponibles usan `WHERE stock_quantity > 0`

### UI/UX Considerations

- Toggle claro para activar/desactivar variantes
- Tipos predefinidos con preview de tallas
- Tabla editable para gestión de stock por variante
- Selector de variantes con stock visible en ventas
- Badge visual en lista de productos para identificar productos con variantes
- Confirmación al convertir producto simple a variantes
- Advertencia al intentar desactivar variantes con stock
