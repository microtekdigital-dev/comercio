# Fix: Historial de Stock para Variantes Nuevas

## Problema Identificado

Cuando se agregaba una nueva variante a un producto existente con stock inicial, ese stock no se registraba en el historial de movimientos de stock (`stock_movements`).

## Causa

Había dos lugares donde se creaban variantes sin registrar movimientos de stock:

1. **`createVariantsForProduct`** (`lib/actions/product-variants.ts`): Cuando se creaban variantes con stock inicial > 0, no se registraba el movimiento.

2. **`updateProduct`** (`lib/actions/products.ts`): Cuando se agregaba una nueva variante a un producto existente, se hacía un INSERT directo sin registrar el movimiento de stock.

## Solución Implementada

### 1. Modificación en `createVariantsForProduct`

Se agregó lógica para registrar movimientos de stock después de crear las variantes:

```typescript
// Register stock movements for variants with initial stock > 0
if (data && data.length > 0) {
  const { data: profileData } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", user.id)
    .single();

  const userName = profileData?.full_name || profileData?.email || "Usuario";

  const stockMovements = data
    .filter(variant => variant.stock_quantity > 0)
    .map(variant => ({
      company_id: profile.company_id,
      product_id: productId,
      variant_id: variant.id,
      movement_type: 'adjustment_in' as const,
      quantity: variant.stock_quantity,
      stock_before: 0,
      stock_after: variant.stock_quantity,
      created_by: user.id,
      created_by_name: userName,
      notes: "Stock inicial de variante",
    }));

  if (stockMovements.length > 0) {
    await supabase
      .from("stock_movements")
      .insert(stockMovements);
  }
}
```

### 2. Modificación en `updateProduct`

Se modificó el INSERT de nuevas variantes para registrar el movimiento de stock:

```typescript
const { data: newVariant, error: insertError } = await supabase
  .from("product_variants")
  .insert(variantData)
  .select()
  .single();

if (insertError) {
  return { error: `Error insertando variante ${variant.variant_name}: ${insertError.message}` };
}

// Register stock movement if initial stock > 0
if (newVariant && variant.stock_quantity && variant.stock_quantity > 0) {
  const userName = profile.full_name || profile.email;
  
  await supabase
    .from("stock_movements")
    .insert({
      company_id: profile.company_id,
      product_id: id,
      variant_id: newVariant.id,
      movement_type: 'adjustment_in',
      quantity: variant.stock_quantity,
      stock_before: 0,
      stock_after: variant.stock_quantity,
      created_by: user.id,
      created_by_name: userName,
      notes: "Stock inicial de variante agregada",
    });
}
```

### 3. Agregado campo `price` a variantes

También se agregó el campo `price` (que faltaba) en la creación de variantes para mantener consistencia con el esquema de la base de datos.

## Resultado

Ahora, cuando se agrega una nueva variante con stock inicial a un producto existente:

1. ✅ La variante se crea correctamente
2. ✅ Se registra un movimiento de stock tipo `adjustment_in`
3. ✅ El historial muestra:
   - Tipo: Ajuste de entrada
   - Cantidad: Stock inicial
   - Stock antes: 0
   - Stock después: Stock inicial
   - Notas: "Stock inicial de variante agregada"

## Archivos Modificados

- `lib/actions/product-variants.ts` - Agregado registro de movimientos en `createVariantsForProduct`
- `lib/actions/products.ts` - Agregado registro de movimientos al insertar nuevas variantes en `updateProduct`

## Casos de Uso Cubiertos

1. ✅ Crear producto nuevo con variantes y stock inicial
2. ✅ Agregar nueva variante a producto existente con stock inicial
3. ✅ Editar stock de variante existente (ya funcionaba)
4. ✅ Crear variantes desde plantilla con stock inicial
