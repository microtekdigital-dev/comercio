# Documento de Diseño: Fix Variant Price History on Edit

## Resumen

Este diseño aborda un bug crítico donde la función `updateProduct` en `lib/actions/products.ts` no registra cambios de precio en variantes porque actualiza las variantes directamente con queries de Supabase en lugar de usar la función `updateProductVariant` de `lib/actions/product-variants.ts`.

El problema específico está en las líneas 280-310 de `lib/actions/products.ts`, donde se hace:

```typescript
// Update existing variant
await supabase
  .from("product_variants")
  .update(variantData)
  .eq("id", variant.id);
```

En lugar de llamar a `updateProductVariant(variant.id, variantData)`, que contiene la lógica para registrar cambios de precio en la tabla `price_changes`.

## Arquitectura

### Flujo Actual (Problemático)

```
Usuario edita producto con variantes
         ↓
updateProduct() en products.ts
         ↓
Loop sobre variantes
         ↓
UPDATE directo a product_variants (líneas 280-310)
         ↓
❌ NO se registra en price_changes
```

### Flujo Corregido

```
Usuario edita producto con variantes
         ↓
updateProduct() en products.ts
         ↓
Loop sobre variantes
         ↓
¿Variante existente?
    ├─ Sí → updateProductVariant() ✅
    │        ↓
    │   Registra en price_changes si precio cambió
    │
    └─ No → INSERT directo (nueva variante)
             ↓
        Registra precio inicial en price_changes
```

## Componentes e Interfaces

### Función updateProduct (Modificada)

La función `updateProduct` en `lib/actions/products.ts` necesita ser refactorizada para:

1. **Detectar variantes existentes vs nuevas**
2. **Usar `updateProductVariant` para variantes existentes**
3. **Mantener INSERT directo para variantes nuevas**
4. **Registrar precios iniciales para variantes nuevas**

### Función updateProductVariant (Sin cambios)

La función `updateProductVariant` en `lib/actions/product-variants.ts` ya tiene la lógica correcta:

```typescript
export async function updateProductVariant(
  variantId: string,
  data: Partial<ProductVariantFormData>
): Promise<{ data?: ProductVariant, error?: string }>
```

Esta función:
- Valida que la variante existe
- Actualiza los campos de la variante
- **Registra cambios de stock en `stock_movements`**
- **NOTA**: Actualmente NO registra cambios de precio en `price_changes`

### Problema Adicional Identificado

Al revisar `updateProductVariant`, descubrí que **tampoco registra cambios de precio**. Solo registra cambios de stock. Esto significa que necesitamos:

1. **Agregar lógica de registro de precio a `updateProductVariant`**
2. **Refactorizar `updateProduct` para usar `updateProductVariant`**

### Nueva Interfaz: ProductVariantFormData

Necesitamos extender `ProductVariantFormData` para incluir el campo `price`:

```typescript
export interface ProductVariantFormData {
  variant_name: string;
  sku?: string;
  price?: number;  // ← AGREGAR ESTE CAMPO
  stock_quantity?: number;
  min_stock_level?: number;
  sort_order?: number;
}
```

## Modelos de Datos

### Tabla product_variants

La tabla `product_variants` ya tiene el campo `price`, pero no se está usando en el código TypeScript actual:

```sql
CREATE TABLE product_variants (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL,
  product_id UUID NOT NULL,
  variant_name VARCHAR(100) NOT NULL,
  sku VARCHAR(100),
  price DECIMAL(10, 2),  -- ← Este campo existe pero no se usa
  stock_quantity INTEGER DEFAULT 0,
  min_stock_level INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Tabla price_changes

Según el spec `historial-precios`, la tabla `price_changes` necesita soportar variantes:

```sql
CREATE TABLE price_changes (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL,
  product_id UUID NOT NULL,
  variant_id UUID NULL,  -- ← Debe permitir NULL para productos sin variantes
  price_type VARCHAR(20) NOT NULL,
  old_value DECIMAL(10, 2) NOT NULL,
  new_value DECIMAL(10, 2) NOT NULL,
  changed_by UUID NOT NULL,
  changed_by_name VARCHAR(255) NOT NULL,
  changed_by_role VARCHAR(50) NOT NULL,
  reason TEXT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**NOTA**: Necesitamos verificar si la tabla `price_changes` ya tiene el campo `variant_id`. Si no, necesitamos agregarlo.

## Propiedades de Corrección

*Una propiedad es una característica o comportamiento que debe ser verdadero en todas las ejecuciones válidas de un sistema—esencialmente, una declaración formal sobre lo que el sistema debe hacer. Las propiedades sirven como puente entre especificaciones legibles por humanos y garantías de corrección verificables por máquinas.*

### Prework de Análisis de Criterios de Aceptación

1.1 WHEN `updateProduct` actualiza una variante existente, THEN THE System SHALL call `updateProductVariant` instead of direct Supabase queries
  Thoughts: Esto es una regla que debe aplicarse a todas las variantes existentes, no ejemplos específicos. Podemos generar productos aleatorios con variantes, actualizar una variante, y verificar que se llamó a `updateProductVariant` en lugar de hacer un UPDATE directo.
  Testable: yes - property

1.2 WHEN a variant price is changed through `updateProduct`, THEN THE System SHALL create a record in the `price_changes` table
  Thoughts: Esta es una regla que debe aplicarse a todos los cambios de precio en variantes. Podemos generar variantes aleatorias, cambiar el precio, y verificar que se creó un registro en `price_changes`.
  Testable: yes - property

1.3 WHEN `updateProduct` processes multiple variants, THEN THE System SHALL call `updateProductVariant` for each variant that needs updating
  Thoughts: Esto es sobre el comportamiento con múltiples variantes. Podemos generar productos con múltiples variantes, actualizar varias, y verificar que se llamó a `updateProductVariant` para cada una.
  Testable: yes - property

1.4 WHEN a variant update fails, THEN THE System SHALL handle the error appropriately and not break the entire product update
  Thoughts: Esto es sobre manejo de errores. Podemos simular un fallo en una variante y verificar que el error se maneja correctamente.
  Testable: yes - property

2.1 WHEN `updateProduct` receives a variant without an ID, THEN THE System SHALL create a new variant using direct insert
  Thoughts: Esto es sobre distinguir variantes nuevas de existentes. Podemos verificar que variantes sin ID se crean con INSERT.
  Testable: yes - property

2.2 WHEN creating new variants, THEN THE System SHALL NOT call `updateProductVariant`
  Thoughts: Esto es lo opuesto a 2.1, verificando que NO se llama a update para variantes nuevas.
  Testable: yes - property

2.3 WHEN new variants are created with initial prices, THEN THE System SHALL create initial price change records
  Thoughts: Esto es sobre registrar precios iniciales. Podemos crear variantes con precios y verificar que se registran en `price_changes`.
  Testable: yes - property

2.4 WHEN mixing new and existing variants in an update, THEN THE System SHALL handle both cases correctly
  Thoughts: Esto es sobre manejar ambos casos simultáneamente. Podemos actualizar un producto con variantes nuevas y existentes y verificar el comportamiento correcto.
  Testable: yes - property

3.1 WHEN any variant update fails, THEN THE System SHALL rollback all changes to the product and its variants
  Thoughts: Esto es sobre transaccionalidad. Sin embargo, Supabase no soporta transacciones multi-statement en server actions fácilmente. Esto es más una aspiración que una propiedad testable en el contexto actual.
  Testable: no

3.2 WHEN updating product and variants, THEN THE System SHALL maintain referential integrity between tables
  Thoughts: Esto es garantizado por las foreign keys de la base de datos, no es algo que necesitemos testear en el código.
  Testable: no

3.3 WHEN price changes are recorded, THEN THE System SHALL ensure they reference valid variant IDs
  Thoughts: Esto es sobre integridad referencial, que es garantizada por foreign keys.
  Testable: no

3.4 WHEN the update completes successfully, THEN THE System SHALL commit all changes atomically
  Thoughts: Similar a 3.1, esto es sobre transaccionalidad que no es fácilmente testeable en el contexto actual.
  Testable: no

4.1 WHEN a user edits a product variant price from the edit product page, THEN THE System SHALL create a record in `price_changes`
  Thoughts: Esta es la propiedad principal que estamos arreglando. Podemos verificar que editar un precio de variante crea un registro.
  Testable: yes - property

4.2 WHEN viewing price history for a variant, THEN THE System SHALL show all price changes including those made through product edit
  Thoughts: Esto es sobre la consulta de historial. Podemos verificar que los cambios hechos a través de product edit aparecen en el historial.
  Testable: yes - property

4.3 WHEN comparing old and new prices, THEN THE System SHALL record the correct previous and new values
  Thoughts: Esto es sobre la precisión de los valores registrados. Podemos verificar que old_value y new_value son correctos.
  Testable: yes - property

4.4 WHEN multiple variants are updated in one operation, THEN THE System SHALL record price changes for all modified variants
  Thoughts: Esto es sobre manejar múltiples cambios. Podemos actualizar múltiples variantes y verificar que se registran todos los cambios.
  Testable: yes - property

### Reflexión de Propiedades

Después de revisar todas las propiedades testables, identifiqué las siguientes redundancias:

- Propiedad 1.2 y 4.1 son esencialmente la misma (ambas verifican que se crea un registro en price_changes)
- Propiedad 1.3 y 4.4 son similares (ambas sobre múltiples variantes)
- Propiedad 4.2 es más sobre la función de consulta que sobre el fix en sí

Propiedades consolidadas:
- Combinar 1.2 y 4.1 en una sola propiedad sobre registro de cambios de precio
- Combinar 1.3 y 4.4 en una sola propiedad sobre múltiples variantes
- Mantener 4.2 pero clarificar que es sobre la integración completa

### Propiedad 1: Uso de updateProductVariant para variantes existentes

*Para cualquier* variante existente (con ID) en una actualización de producto, el sistema debe llamar a `updateProductVariant` en lugar de hacer un UPDATE directo a la tabla `product_variants`.

**Valida: Requisitos 1.1**

### Propiedad 2: Registro de cambios de precio en variantes

*Para cualquier* variante cuyo precio cambia a través de `updateProduct`, el sistema debe crear un registro en `price_changes` con `variant_id` no nulo, `old_value` igual al precio anterior, y `new_value` igual al precio nuevo.

**Valida: Requisitos 1.2, 4.1**

### Propiedad 3: Procesamiento de múltiples variantes

*Para cualquier* producto con múltiples variantes que se actualizan simultáneamente, el sistema debe llamar a `updateProductVariant` para cada variante existente que tiene cambios, y debe registrar cambios de precio para todas las variantes cuyos precios cambiaron.

**Valida: Requisitos 1.3, 4.4**

### Propiedad 4: Manejo de errores en actualizaciones de variantes

*Para cualquier* actualización de variante que falla, el sistema debe retornar un error apropiado sin causar que toda la actualización del producto falle (a menos que sea crítico).

**Valida: Requisitos 1.4**

### Propiedad 5: Creación de variantes nuevas

*Para cualquier* variante sin ID en una actualización de producto, el sistema debe crear la variante usando INSERT directo, NO llamando a `updateProductVariant`.

**Valida: Requisitos 2.1, 2.2**

### Propiedad 6: Registro de precios iniciales

*Para cualquier* variante nueva creada con un precio inicial, el sistema debe crear un registro en `price_changes` con `old_value` igual a 0 (o NULL) y `new_value` igual al precio inicial.

**Valida: Requisitos 2.3**

### Propiedad 7: Manejo mixto de variantes

*Para cualquier* actualización de producto que incluye tanto variantes nuevas como existentes, el sistema debe manejar correctamente ambos casos: INSERT para nuevas, `updateProductVariant` para existentes.

**Valida: Requisitos 2.4**

### Propiedad 8: Precisión de valores registrados

*Para cualquier* cambio de precio en variante, los valores `old_value` y `new_value` en el registro de `price_changes` deben coincidir exactamente con el precio anterior y el precio nuevo de la variante.

**Valida: Requisitos 4.3**

### Propiedad 9: Integración con historial de precios

*Para cualquier* variante, al consultar el historial de precios de esa variante, deben aparecer todos los cambios de precio realizados tanto directamente como a través de la edición del producto.

**Valida: Requisitos 4.2**

## Manejo de Errores

### Errores de Validación

1. **Variante no encontrada**: Si `updateProductVariant` no encuentra la variante, retornar error específico
2. **Precio inválido**: Si el precio es negativo, retornar error de validación
3. **Sin cambios**: Si no hay cambios en la variante, no llamar a `updateProductVariant`

### Errores de Base de Datos

1. **Fallo en updateProductVariant**: Capturar el error y decidir si continuar con otras variantes o fallar completamente
2. **Fallo en INSERT de variante nueva**: Fallar toda la operación (rollback manual si es necesario)
3. **Fallo en registro de price_changes**: Loggear el error pero no fallar la actualización del producto

### Estrategia de Manejo

```typescript
// Opción 1: Fail-fast (fallar al primer error)
for (const variant of variants) {
  const result = await updateProductVariant(variant.id, variantData);
  if (result.error) {
    return { error: `Error updating variant ${variant.variant_name}: ${result.error}` };
  }
}

// Opción 2: Collect errors (continuar y reportar todos los errores)
const errors: string[] = [];
for (const variant of variants) {
  const result = await updateProductVariant(variant.id, variantData);
  if (result.error) {
    errors.push(`Variant ${variant.variant_name}: ${result.error}`);
  }
}
if (errors.length > 0) {
  return { error: `Errors updating variants:\n${errors.join('\n')}` };
}
```

**Decisión**: Usar Opción 1 (fail-fast) para mantener consistencia y simplicidad.

## Estrategia de Testing

### Tests Unitarios

Los tests unitarios se enfocarán en ejemplos específicos y casos edge:

1. **Actualización de variante existente con cambio de precio**:
   - Crear producto con variante
   - Actualizar precio de variante a través de `updateProduct`
   - Verificar que se creó registro en `price_changes`

2. **Actualización de variante existente sin cambio de precio**:
   - Actualizar solo stock, no precio
   - Verificar que NO se creó registro en `price_changes`

3. **Creación de variante nueva con precio**:
   - Agregar nueva variante con precio inicial
   - Verificar que se creó registro de precio inicial

4. **Actualización de múltiples variantes**:
   - Actualizar 3 variantes con diferentes cambios
   - Verificar que se registraron todos los cambios correctamente

5. **Casos Edge**:
   - Variante con precio NULL → precio con valor
   - Precio 0 → precio positivo
   - Precio positivo → precio 0
   - Mismo precio (no debe crear registro)

### Tests Basados en Propiedades

Los tests basados en propiedades verificarán propiedades universales con entradas aleatorias (mínimo 100 iteraciones por test):

Cada test de propiedad debe:
- Ejecutar al menos 100 iteraciones con entradas aleatorias
- Referenciar su propiedad del documento de diseño en un comentario
- Usar formato de tag: `Feature: fix-variant-price-history-on-edit, Property {number}: {property_text}`

**Cobertura de Tests**:
- Propiedades 1-9 como se definen en la sección de Propiedades de Corrección
- Cada propiedad mapea a requisitos específicos
- Tests usan generadores de datos aleatorios para:
  - IDs de productos y variantes
  - Valores de precio (decimales positivos)
  - Nombres de variantes
  - Cantidades de stock
  - Combinaciones de variantes nuevas y existentes

**Librería de Property Testing**: Usar `fast-check` para property-based testing en TypeScript

### Tests de Integración

1. **Flujo End-to-End**:
   - Crear producto con variantes
   - Editar desde la página de edición
   - Verificar que el historial de precios muestra los cambios

2. **Escenarios Multi-Usuario**:
   - Múltiples empleados editando variantes
   - Verificar atribución correcta en `price_changes`

3. **Performance**:
   - Producto con 20+ variantes
   - Actualizar todas simultáneamente
   - Verificar que se completa en tiempo razonable

## Notas de Implementación

### Cambios Necesarios

#### 1. Modificar updateProductVariant

Agregar lógica para registrar cambios de precio:

```typescript
export async function updateProductVariant(
  variantId: string,
  data: Partial<ProductVariantFormData>
): Promise<{ data?: ProductVariant, error?: string }> {
  // ... código existente ...

  // Get existing variant to check for price changes
  const { data: existingVariant } = await supabase
    .from("product_variants")
    .select("*")
    .eq("id", variantId)
    .eq("company_id", profile.company_id)
    .single();

  // ... validaciones existentes ...

  // Update variant
  const { data: updated, error } = await supabase
    .from("product_variants")
    .update(updateData)
    .eq("id", variantId)
    .select()
    .single();

  // ← AGREGAR: Registrar cambio de precio si cambió
  if (
    data.price !== undefined &&
    data.price !== existingVariant.price
  ) {
    const userName = profile.full_name || profile.email;
    
    await supabase
      .from("price_changes")
      .insert({
        company_id: profile.company_id,
        product_id: existingVariant.product_id,
        variant_id: variantId,
        price_type: 'sale_price',
        old_value: existingVariant.price || 0,
        new_value: data.price,
        changed_by: user.id,
        changed_by_name: userName,
        changed_by_role: profile.role,
      });
  }

  // ... código existente de stock_movements ...
}
```

#### 2. Refactorizar updateProduct

Modificar el loop de variantes para usar `updateProductVariant`:

```typescript
// En updateProduct, líneas 280-310 aproximadamente

// Handle variants update if product has variants
if (formData.has_variants && variants && variants.length > 0) {
  // Get existing variants
  const { data: existingVariants } = await supabase
    .from("product_variants")
    .select("id")
    .eq("product_id", id)
    .eq("company_id", profile.company_id);

  const existingIds = new Set(existingVariants?.map(v => v.id) || []);
  const formVariantIds = new Set(variants.filter(v => v.id).map(v => v.id));

  // Delete variants that are no longer in the form
  const toDelete = Array.from(existingIds).filter(id => !formVariantIds.has(id));
  if (toDelete.length > 0) {
    await supabase
      .from("product_variants")
      .delete()
      .in("id", toDelete);
  }

  // Update or insert variants
  for (const [index, variant] of variants.entries()) {
    if (variant.id && existingIds.has(variant.id)) {
      // ← CAMBIO: Usar updateProductVariant en lugar de UPDATE directo
      const variantUpdateData = {
        variant_name: variant.variant_name,
        sku: variant.sku || null,
        price: variant.price,  // ← AGREGAR campo price
        stock_quantity: variant.stock_quantity || 0,
        min_stock_level: variant.min_stock_level || 0,
        sort_order: variant.sort_order !== undefined ? variant.sort_order : index,
      };

      const result = await updateProductVariant(variant.id, variantUpdateData);
      
      if (result.error) {
        return { error: `Error updating variant ${variant.variant_name}: ${result.error}` };
      }
    } else {
      // Insert new variant (sin cambios)
      const variantData = {
        company_id: profile.company_id,
        product_id: id,
        variant_name: variant.variant_name,
        sku: variant.sku || null,
        price: variant.price,  // ← AGREGAR campo price
        stock_quantity: variant.stock_quantity || 0,
        min_stock_level: variant.min_stock_level || 0,
        sort_order: variant.sort_order !== undefined ? variant.sort_order : index,
        is_active: true,
      };

      const { error: insertError } = await supabase
        .from("product_variants")
        .insert(variantData);

      if (insertError) {
        return { error: `Error creating variant ${variant.variant_name}: ${insertError.message}` };
      }

      // ← AGREGAR: Registrar precio inicial para variante nueva
      if (variant.price && variant.price > 0) {
        const userName = profile.full_name || profile.email;
        
        await supabase
          .from("price_changes")
          .insert({
            company_id: profile.company_id,
            product_id: id,
            variant_id: variant.id,  // Necesitamos el ID de la variante recién creada
            price_type: 'sale_price',
            old_value: 0,
            new_value: variant.price,
            changed_by: user.id,
            changed_by_name: userName,
            changed_by_role: profile.role,
            reason: "Precio inicial de variante",
          });
      }
    }
  }
}
```

#### 3. Verificar/Actualizar Schema de price_changes

Verificar que la tabla `price_changes` tiene el campo `variant_id`:

```sql
-- Si no existe, agregar:
ALTER TABLE price_changes
ADD COLUMN variant_id UUID NULL REFERENCES product_variants(id) ON DELETE CASCADE;

-- Agregar índice
CREATE INDEX idx_price_changes_variant ON price_changes(variant_id);

-- Modificar constraint para permitir variant_id
ALTER TABLE price_changes
DROP CONSTRAINT IF EXISTS price_changes_product_id_fkey;

ALTER TABLE price_changes
ADD CONSTRAINT price_changes_product_or_variant
CHECK (
  (variant_id IS NULL AND product_id IS NOT NULL) OR
  (variant_id IS NOT NULL AND product_id IS NOT NULL)
);
```

#### 4. Actualizar TypeScript Interfaces

```typescript
// En lib/types/erp.ts

export interface ProductVariantFormData {
  id?: string;
  variant_name: string;
  sku?: string;
  price?: number;  // ← AGREGAR
  stock_quantity?: number;
  min_stock_level?: number;
  sort_order?: number;
}

export interface ProductVariant {
  id: string;
  company_id: string;
  product_id: string;
  variant_name: string;
  sku: string | null;
  price: number | null;  // ← AGREGAR
  stock_quantity: number;
  min_stock_level: number;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PriceChange {
  id: string;
  company_id: string;
  product_id: string;
  variant_id: string | null;  // ← AGREGAR
  price_type: 'sale_price' | 'cost_price';
  old_value: number;
  new_value: number;
  changed_by: string;
  changed_by_name: string;
  changed_by_role: string;
  reason: string | null;
  created_at: string;
  product?: Product;
  variant?: ProductVariant;  // ← AGREGAR
}
```

### Archivos a Modificar

1. **lib/actions/products.ts**: Refactorizar `updateProduct` (líneas 280-310)
2. **lib/actions/product-variants.ts**: Agregar lógica de registro de precio a `updateProductVariant`
3. **lib/types/erp.ts**: Agregar campo `price` a interfaces de variantes
4. **scripts/XXX_add_variant_price_tracking.sql**: Script de migración para agregar `variant_id` a `price_changes` si no existe

### Archivos a Crear

1. **__tests__/lib/actions/fix-variant-price-history.unit.test.ts**: Tests unitarios
2. **__tests__/lib/actions/fix-variant-price-history.property.test.ts**: Tests basados en propiedades

### Consideraciones de Performance

1. **Llamadas a updateProductVariant**: Cada variante existente generará una llamada separada. Para productos con muchas variantes (20+), esto podría ser lento.
   - **Mitigación**: Considerar batch updates en el futuro si se convierte en problema
   - **Por ahora**: Aceptable dado que la mayoría de productos tienen <10 variantes

2. **Inserts a price_changes**: Cada cambio de precio genera un INSERT adicional.
   - **Mitigación**: Los INSERTs son rápidos y no bloquean
   - **Índices**: Ya existen índices apropiados en `price_changes`

3. **Transaccionalidad**: Sin transacciones explícitas, si falla una variante a mitad del proceso, las anteriores ya están actualizadas.
   - **Mitigación**: Usar fail-fast para minimizar inconsistencias
   - **Futuro**: Considerar usar Supabase RPC con transacciones si se vuelve crítico

### Consideraciones de Seguridad

1. **Permisos**: `updateProductVariant` ya verifica permisos, no necesitamos verificar nuevamente en `updateProduct`
2. **RLS**: Las políticas RLS en `price_changes` ya protegen los datos
3. **Validación**: `updateProductVariant` ya valida precios negativos y otros casos

### Orden de Implementación

1. **Primero**: Verificar/actualizar schema de `price_changes` (agregar `variant_id`)
2. **Segundo**: Actualizar interfaces TypeScript
3. **Tercero**: Modificar `updateProductVariant` para registrar cambios de precio
4. **Cuarto**: Refactorizar `updateProduct` para usar `updateProductVariant`
5. **Quinto**: Escribir tests unitarios
6. **Sexto**: Escribir tests basados en propiedades
7. **Séptimo**: Testing manual en UI

### Mejoras Futuras

Potenciales mejoras futuras (fuera del alcance actual):

1. **Batch Updates**: Optimizar para actualizar múltiples variantes en una sola llamada
2. **Transacciones**: Usar Supabase RPC para garantizar atomicidad completa
3. **Audit Log**: Registrar también cambios en otros campos de variantes (no solo precio)
4. **Rollback**: Implementar capacidad de revertir cambios de precio
5. **Price Alerts**: Notificar cuando precios de variantes cambian significativamente
