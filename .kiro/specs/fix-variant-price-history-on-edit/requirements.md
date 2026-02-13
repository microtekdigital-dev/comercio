# Documento de Requisitos

## Introducción

Este spec aborda un bug crítico en el sistema de actualización de productos con variantes. Actualmente, cuando se edita un producto con variantes desde la página de edición, los cambios de precio en las variantes no se registran en la tabla `price_changes`, rompiendo el sistema de historial de precios implementado en el spec "historial-precios".

El problema radica en que la función `updateProduct` en `lib/actions/products.ts` está actualizando las variantes directamente con queries de Supabase en un loop (líneas 280-310), en lugar de utilizar la función `updateProductVariant` de `lib/actions/product-variants.ts`, que contiene la lógica correcta para registrar cambios de precio.

## Glosario

- **Product**: Producto en el sistema ERP que puede tener o no variantes
- **Product_Variant**: Variante de un producto (ej: talla, color) con su propio precio y stock
- **Price_Changes**: Tabla que registra el historial de cambios de precio para productos y variantes
- **updateProduct**: Función en `lib/actions/products.ts` que actualiza productos
- **updateProductVariant**: Función en `lib/actions/product-variants.ts` que actualiza variantes y registra cambios de precio
- **Edit_Product_Page**: Página de edición de productos en `app/dashboard/products/[id]/page.tsx`

## Requisitos

### Requisito 1: Refactorizar actualización de variantes existentes

**User Story:** Como desarrollador del sistema, quiero que la función `updateProduct` use `updateProductVariant` para actualizar variantes existentes, para que los cambios de precio se registren correctamente en el historial.

#### Criterios de Aceptación

1. WHEN `updateProduct` actualiza una variante existente, THEN THE System SHALL call `updateProductVariant` instead of direct Supabase queries
2. WHEN a variant price is changed through `updateProduct`, THEN THE System SHALL create a record in the `price_changes` table
3. WHEN `updateProduct` processes multiple variants, THEN THE System SHALL call `updateProductVariant` for each variant that needs updating
4. WHEN a variant update fails, THEN THE System SHALL handle the error appropriately and not break the entire product update

### Requisito 2: Mantener compatibilidad con creación de nuevas variantes

**User Story:** Como desarrollador del sistema, quiero que la función `updateProduct` siga creando nuevas variantes correctamente, para que no se rompa la funcionalidad existente.

#### Criterios de Aceptación

1. WHEN `updateProduct` receives a variant without an ID, THEN THE System SHALL create a new variant using direct insert
2. WHEN creating new variants, THEN THE System SHALL NOT call `updateProductVariant`
3. WHEN new variants are created with initial prices, THEN THE System SHALL create initial price change records
4. WHEN mixing new and existing variants in an update, THEN THE System SHALL handle both cases correctly

### Requisito 3: Preservar integridad transaccional

**User Story:** Como usuario del sistema, quiero que las actualizaciones de productos con variantes sean atómicas, para que no queden datos inconsistentes si algo falla.

#### Criterios de Aceptación

1. WHEN any variant update fails, THEN THE System SHALL rollback all changes to the product and its variants
2. WHEN updating product and variants, THEN THE System SHALL maintain referential integrity between tables
3. WHEN price changes are recorded, THEN THE System SHALL ensure they reference valid variant IDs
4. WHEN the update completes successfully, THEN THE System SHALL commit all changes atomically

### Requisito 4: Validar corrección del bug

**User Story:** Como usuario del sistema, quiero que los cambios de precio en variantes se registren en el historial, para poder auditar los cambios de precios correctamente.

#### Criterios de Aceptación

1. WHEN a user edits a product variant price from the edit product page, THEN THE System SHALL create a record in `price_changes`
2. WHEN viewing price history for a variant, THEN THE System SHALL show all price changes including those made through product edit
3. WHEN comparing old and new prices, THEN THE System SHALL record the correct previous and new values
4. WHEN multiple variants are updated in one operation, THEN THE System SHALL record price changes for all modified variants
