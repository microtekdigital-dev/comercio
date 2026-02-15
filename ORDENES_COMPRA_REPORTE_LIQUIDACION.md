# Órdenes de Compra y Reporte de Liquidación de Inventario

## Cómo Funcionan las Órdenes de Compra

### Estados de una Orden de Compra
1. **Pendiente** (`pending`) - Orden creada pero no confirmada
2. **Confirmada** (`confirmed`) - Orden confirmada con el proveedor
3. **Recibida** (`received`) - Mercadería recibida y stock actualizado
4. **Cancelada** (`cancelled`) - Orden cancelada

### Proceso para Recibir Mercadería

Para que una orden de compra aparezca en el **Reporte de Liquidación de Inventario**, debe seguir estos pasos:

1. **Crear la orden** en estado "Pendiente"
2. **Confirmar la orden** (opcional, cambiar estado a "Confirmada")
3. **Recibir la mercadería**:
   - Abrir la orden de compra
   - Hacer clic en el botón "Recibir Mercadería"
   - Ingresar las cantidades recibidas para cada producto
   - Confirmar la recepción

### ¿Qué Sucede al Recibir Mercadería?

Cuando se marca una orden como recibida:
1. Se actualiza el stock de los productos/variantes
2. Se registra el movimiento de stock en el historial
3. Se actualiza el estado de la orden a "Recibida"
4. Se establece la fecha de recepción (`received_date`)
5. **La orden ahora aparece en el Reporte de Liquidación de Inventario**

## Reporte de Liquidación de Inventario

### ¿Qué Órdenes se Incluyen?

El reporte **SOLO** incluye órdenes de compra que cumplan AMBAS condiciones:
- Estado = "Recibida" (`status = 'received'`)
- Fecha de recepción dentro del período seleccionado

### ¿Por Qué Este Comportamiento?

Este diseño es intencional y correcto porque:
- Solo cuenta mercadería que realmente ingresó al inventario
- No cuenta órdenes pendientes o en tránsito
- Permite un control preciso del inventario real
- Evita discrepancias entre lo ordenado y lo recibido

## Solución al Problema Reportado

Si las órdenes de compra no aparecen en el reporte, verificar:

1. **¿La orden está marcada como "Recibida"?**
   - Revisar el estado en la lista de órdenes
   - Si está en "Pendiente" o "Confirmada", debe recibirse primero

2. **¿La fecha de recepción está dentro del período del reporte?**
   - Verificar las fechas del filtro en el reporte
   - Verificar la fecha de recepción de la orden

3. **¿Se recibió la mercadería correctamente?**
   - Abrir la orden y verificar las cantidades recibidas
   - Si no se recibió, usar el botón "Recibir Mercadería"

## Pasos para Recibir una Orden Existente

1. Ir a **Órdenes de Compra**
2. Hacer clic en la orden que deseas recibir
3. Hacer clic en **"Recibir Mercadería"**
4. Ingresar las cantidades recibidas (por defecto muestra las cantidades pendientes)
5. Hacer clic en **"Confirmar Recepción"**
6. El sistema automáticamente:
   - Actualiza el stock
   - Cambia el estado a "Recibida"
   - Establece la fecha de recepción
7. La orden ahora aparecerá en el Reporte de Liquidación de Inventario

## Archivos Relacionados

- `lib/actions/purchase-orders.ts` - Lógica de órdenes de compra
- `lib/actions/inventory-report.ts` - Cálculo del reporte (función `calculatePurchases`)
- `app/dashboard/purchase-orders/[id]/page.tsx` - UI para recibir mercadería
- `scripts/040_create_suppliers.sql` - Esquema de la base de datos

## Fecha
2026-02-14
