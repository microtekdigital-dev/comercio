# Soporte de Variantes en Órdenes de Compra

## Resumen
Se implementó soporte completo para variantes (talles) en las órdenes de compra, permitiendo seleccionar talles específicos al crear órdenes y actualizar el stock de la variante correcta al recibir la mercadería.

## Cambios Realizados

### 1. Formulario de Nueva Orden de Compra (`app/dashboard/purchase-orders/new/page.tsx`)

#### Cambios en el Estado
- Agregado estado `productVariants` para almacenar las variantes de cada producto
- Actualizado el estado inicial de items para incluir `variant_id` y `variant_name`

#### Nueva Funcionalidad
- **Carga automática de variantes**: Cuando se selecciona un producto con variantes, se cargan automáticamente sus talles disponibles
- **Selector de variantes**: Nueva columna en la tabla de productos con un selector desplegable para elegir el talle
- **Indicador visual**: Los productos con variantes muestran "(con variantes)" en el selector
- **Validación**: Solo se muestran variantes activas del producto seleccionado

#### Interfaz de Usuario
```
Producto | Variante | Cantidad | Costo Unit. | Desc. % | IVA % | Total
---------|----------|----------|-------------|---------|-------|------
Remera   | [Selector: XS, S, M, L, XL] | 10 | $5000 | 0 | 21 | $60500
```

### 2. Acciones de Órdenes de Compra (`lib/actions/purchase-orders.ts`)

#### `createPurchaseOrder`
- Actualizado para incluir `variant_id` y `variant_name` al crear items de la orden
- Los campos se guardan en la base de datos para referencia futura

#### `receiveItems`
- **Lógica mejorada** para manejar productos con y sin variantes:
  - Si el item tiene `variant_id`: actualiza el stock de la variante específica
  - Si no tiene `variant_id`: actualiza el stock del producto base (comportamiento anterior)
- **Registro de movimientos**: Los movimientos de stock incluyen el `variant_id` cuando corresponde
- **Actualización de stock**: 
  - Para variantes: actualiza `product_variants.stock_quantity`
  - Para productos sin variantes: actualiza `products.stock_quantity`

### 3. Página de Detalle de Orden (`app/dashboard/purchase-orders/[id]/page.tsx`)

#### Visualización de Variantes
- **En el diálogo de recepción**: Muestra el talle debajo del nombre del producto
- **En la tabla de productos**: Muestra el talle como información adicional
- Formato: "Talle: [nombre_variante]"

#### Ejemplo de Visualización
```
Producto: Remera Básica
Talle: M
SKU: REM-001
Ordenado: 10 | Recibido: 10 ✓
```

## Flujo de Trabajo

### Crear Orden de Compra con Variantes
1. Seleccionar proveedor
2. Agregar producto
3. Si el producto tiene variantes, aparece el selector de talles
4. Seleccionar el talle deseado
5. Ingresar cantidad y otros datos
6. Crear orden

### Recibir Mercadería con Variantes
1. Abrir orden de compra
2. Click en "Recibir Mercadería"
3. Ver productos con sus talles específicos
4. Ingresar cantidades recibidas
5. Confirmar recepción
6. El sistema actualiza automáticamente:
   - Stock de la variante específica
   - Cantidad recibida en la orden
   - Registro en historial de movimientos de stock

## Compatibilidad

### Productos sin Variantes
- Funcionan exactamente igual que antes
- No se muestra el selector de variantes
- El stock se actualiza en el producto base

### Productos con Variantes
- Requieren selección de talle
- El stock se actualiza en la variante específica
- Se mantiene el registro del talle en la orden

## Base de Datos

### Campos Utilizados
- `purchase_order_items.variant_id`: ID de la variante seleccionada (nullable)
- `purchase_order_items.variant_name`: Nombre del talle para referencia (nullable)
- `stock_movements.variant_id`: Referencia a la variante en movimientos de stock (nullable)

### Integridad
- Los campos son opcionales (nullable) para mantener compatibilidad con productos sin variantes
- Las foreign keys mantienen la integridad referencial
- Los triggers de stock history ya soportan variantes (implementado previamente)

## Beneficios

1. **Gestión precisa**: Control exacto del stock por talle
2. **Trazabilidad**: Historial completo de compras por variante
3. **Flexibilidad**: Soporta tanto productos simples como con variantes
4. **Automatización**: El stock se actualiza automáticamente al recibir mercadería
5. **Claridad**: Visualización clara del talle en todas las pantallas

## Notas Técnicas

- Las variantes se cargan dinámicamente al seleccionar un producto
- Solo se muestran variantes activas (`is_active = true`)
- El sistema valida que exista stock suficiente al recibir
- Los movimientos de stock incluyen el `variant_id` para reportes precisos
