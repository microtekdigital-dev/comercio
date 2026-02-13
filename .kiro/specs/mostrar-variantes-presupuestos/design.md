# Diseño: Mostrar Variantes en Vista de Presupuestos

## 1. Resumen

Implementar la visualización y selección de variantes de productos en la página de detalles de presupuestos, tanto en modo visualización como en modo edición.

## 2. Arquitectura

### 2.1 Componentes Afectados

```
app/dashboard/quotes/[id]/page.tsx
├── Modo Visualización
│   └── Mostrar variante con ProductVariantBadge
└── Modo Edición
    └── Selector de variantes con VariantSelectorInSale

lib/actions/quotes.ts
├── getQuote() - Ya carga quote_items con variant_id/variant_name
├── createQuote() - Actualizar para guardar variant_id/variant_name
└── updateQuote() - Actualizar para guardar variant_id/variant_name

lib/actions/product-variants.ts
└── getProductVariants() - Obtener variantes de un producto
```

### 2.2 Flujo de Datos

```
1. Visualización:
   quote_items (variant_id, variant_name) 
   → page.tsx 
   → ProductVariantBadge

2. Edición:
   Seleccionar producto 
   → Cargar variantes del producto
   → VariantSelectorInSale
   → Actualizar item con variant_id/variant_name
   → Guardar en quote_items
```

## 3. Diseño de Interfaz

### 3.1 Modo Visualización

```tsx
// En la lista de items del presupuesto
<div className="md:col-span-4">
  <p className="font-medium">{item.product_name}</p>
  {item.variant_name && (
    <ProductVariantBadge variantName={item.variant_name} />
  )}
  {item.product_sku && (
    <p className="text-xs text-muted-foreground">
      SKU: {item.product_sku}
    </p>
  )}
</div>
```

### 3.2 Modo Edición

```tsx
// Al seleccionar un producto, mostrar selector de variantes
<div className="col-span-4">
  <Label>Producto</Label>
  <Select value={item.product_id} onValueChange={(v) => selectProduct(index, v)}>
    {/* ... */}
  </Select>
  
  {/* Mostrar selector de variantes si el producto tiene variantes */}
  {item.product_id && productHasVariants(item.product_id) && (
    <div className="mt-2">
      <VariantSelectorInSale
        productId={item.product_id}
        selectedVariantId={item.variant_id}
        onVariantChange={(variantId, variantName, price) => {
          updateItemVariant(index, variantId, variantName, price)
        }}
      />
    </div>
  )}
</div>
```

## 4. Cambios en el Código

### 4.1 Actualizar `app/dashboard/quotes/[id]/page.tsx`

#### Importaciones necesarias:
```tsx
import { ProductVariantBadge } from "@/components/dashboard/product-variant-badge"
import { VariantSelectorInSale } from "@/components/dashboard/variant-selector-in-sale"
import { getProductVariants } from "@/lib/actions/product-variants"
```

#### Estado adicional:
```tsx
const [productVariants, setProductVariants] = useState<Record<string, any[]>>({})
```

#### Función para cargar variantes:
```tsx
const loadProductVariants = async (productId: string) => {
  if (productVariants[productId]) return
  
  try {
    const variants = await getProductVariants(productId)
    setProductVariants(prev => ({ ...prev, [productId]: variants }))
  } catch (error) {
    console.error("Error loading variants:", error)
  }
}
```

#### Actualizar `selectProduct`:
```tsx
const selectProduct = async (index: number, productId: string) => {
  const product = products.find((p) => p.id === productId)
  if (product) {
    // Cargar variantes si el producto las tiene
    if (product.has_variants) {
      await loadProductVariants(productId)
    }
    
    const newItems = [...items]
    newItems[index] = {
      ...newItems[index],
      product_id: product.id,
      product_name: product.name,
      product_sku: product.sku || "",
      unit_price: product.price,
      tax_rate: product.tax_rate,
      variant_id: undefined,
      variant_name: undefined,
    }
    setItems(newItems)
  }
}
```

#### Nueva función para actualizar variante:
```tsx
const updateItemVariant = (
  index: number, 
  variantId: string | undefined, 
  variantName: string | undefined,
  price?: number
) => {
  const newItems = [...items]
  newItems[index] = {
    ...newItems[index],
    variant_id: variantId,
    variant_name: variantName,
    unit_price: price !== undefined ? price : newItems[index].unit_price,
  }
  setItems(newItems)
}
```

#### Función auxiliar:
```tsx
const productHasVariants = (productId: string | undefined) => {
  if (!productId) return false
  const product = products.find(p => p.id === productId)
  return product?.has_variants || false
}
```

### 4.2 Actualizar tipos en `lib/types/erp.ts`

Verificar que `QuoteItemFormData` incluya:
```typescript
export interface QuoteItemFormData {
  product_id?: string
  product_name: string
  product_sku?: string
  quantity: number
  unit_price: number
  tax_rate: number
  discount_percent: number
  variant_id?: string      // Agregar si no existe
  variant_name?: string    // Agregar si no existe
}
```

### 4.3 Actualizar `lib/actions/quotes.ts`

#### En `createQuote`:
```typescript
const quoteItems = items.map((item) => {
  const itemSubtotal = item.quantity * item.unit_price
  const discount = itemSubtotal * (item.discount_percent / 100)
  const subtotal = itemSubtotal - discount
  const tax = subtotal * (item.tax_rate / 100)
  
  return {
    quote_id: quote.id,
    ...item,
    variant_id: item.variant_id || null,      // Agregar
    variant_name: item.variant_name || null,  // Agregar
    subtotal,
    tax_amount: tax,
    total: subtotal + tax,
  }
})
```

#### En `updateQuote`:
```typescript
const quoteItems = items.map((item) => {
  const itemSubtotal = item.quantity * item.unit_price
  const discount = itemSubtotal * (item.discount_percent / 100)
  const subtotal = itemSubtotal - discount
  const tax = subtotal * (item.tax_rate / 100)
  
  return {
    quote_id: id,
    ...item,
    variant_id: item.variant_id || null,      // Agregar
    variant_name: item.variant_name || null,  // Agregar
    subtotal,
    tax_amount: tax,
    total: subtotal + tax,
  }
})
```

## 5. Validaciones

### 5.1 Validación de Variante Requerida
- Si un producto tiene variantes (`has_variants = true`), se debe seleccionar una variante antes de guardar
- Mostrar mensaje de error si falta seleccionar variante

### 5.2 Validación de Stock
- Al convertir a venta, ya existe validación de stock por variante en `convertQuoteToSale`
- No se requieren cambios adicionales

## 6. Casos Edge

### 6.1 Presupuestos Antiguos sin Variantes
- Los presupuestos existentes pueden tener `variant_id` y `variant_name` como `null`
- La UI debe manejar esto correctamente mostrando solo el nombre del producto

### 6.2 Producto sin Variantes
- Si un producto no tiene variantes, no mostrar el selector
- Funcionar como actualmente

### 6.3 Variante Eliminada
- Si una variante fue eliminada después de crear el presupuesto, mostrar el `variant_name` guardado
- No intentar cargar la variante desde la base de datos

## 7. Propiedades de Correctness

### Propiedad 1: Persistencia de Variantes
**Descripción:** Cuando se guarda un presupuesto con variantes, la información de variante debe persistir correctamente.

**Validación:**
```typescript
// Al crear/actualizar un presupuesto con variante
const savedQuote = await getQuote(quoteId)
const itemWithVariant = savedQuote.items.find(i => i.variant_id)

assert(itemWithVariant.variant_id === expectedVariantId)
assert(itemWithVariant.variant_name === expectedVariantName)
```

### Propiedad 2: Visualización Condicional
**Descripción:** El badge de variante solo debe mostrarse cuando existe información de variante.

**Validación:**
```typescript
// Renderizar item sin variante
const { container } = render(<QuoteItem item={itemWithoutVariant} />)
expect(container.querySelector('[data-testid="variant-badge"]')).toBeNull()

// Renderizar item con variante
const { container: container2 } = render(<QuoteItem item={itemWithVariant} />)
expect(container2.querySelector('[data-testid="variant-badge"]')).toBeTruthy()
```

### Propiedad 3: Actualización de Precio por Variante
**Descripción:** Al seleccionar una variante con precio específico, el precio del item debe actualizarse.

**Validación:**
```typescript
// Seleccionar variante con precio diferente
const variantPrice = 150
updateItemVariant(0, variantId, variantName, variantPrice)

expect(items[0].unit_price).toBe(variantPrice)
```

## 8. Testing

### 8.1 Tests Unitarios
- Función `selectProduct` carga variantes correctamente
- Función `updateItemVariant` actualiza el estado correctamente
- Función `productHasVariants` retorna el valor correcto

### 8.2 Tests de Integración
- Crear presupuesto con variantes y verificar persistencia
- Editar presupuesto y cambiar variante
- Visualizar presupuesto con variantes

### 8.3 Tests de UI
- Badge de variante se muestra correctamente
- Selector de variantes aparece al seleccionar producto con variantes
- Selector no aparece para productos sin variantes

## 9. Consideraciones de Rendimiento

- Cargar variantes solo cuando se selecciona un producto (lazy loading)
- Cachear variantes cargadas en el estado local
- No recargar variantes si ya están en el estado

## 10. Migración

No se requiere migración de datos ya que:
- Los campos `variant_id` y `variant_name` ya existen en `quote_items`
- Los presupuestos existentes tienen estos campos como `null`
- La UI maneja correctamente valores `null`

## 11. Documentación

Actualizar `PRESUPUESTOS_SETUP.md` con:
- Cómo crear presupuestos con variantes
- Cómo se visualizan las variantes
- Comportamiento al convertir a venta
