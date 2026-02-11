# Historial de Stock - Guía de Uso

## Descripción

El sistema de historial de stock registra automáticamente todos los movimientos de inventario, incluyendo información sobre quién realizó el movimiento, cuándo ocurrió, y si fue manual o automático.

## Ubicaciones del Historial

### 1. Historial Global (Todos los Productos)

**Ruta:** `/dashboard/stock-history`

**Acceso:** 
- Desde el menú lateral → "Historial de Stock"
- Disponible para todos los usuarios (admin y empleados)

**Características:**
- Ver todos los movimientos de stock de la empresa
- Filtros avanzados:
  - Por tipo de movimiento (Compra, Venta, Ajuste +, Ajuste -, Devolución)
  - Por empleado
  - Por rango de fechas (desde/hasta)
  - Por producto
  - Por orden de compra
- Tabla completa con toda la información de cada movimiento

### 2. Historial por Producto

**Ruta:** `/dashboard/products/[id]` → Pestaña "Historial de Stock"

**Acceso:**
- Ir a Productos
- Hacer clic en cualquier producto
- Seleccionar la pestaña "Historial de Stock"

**Nota:** Solo aparece en productos con "Controlar Stock" activado

## Tipos de Movimientos

### Movimientos Automáticos
Generados automáticamente por el sistema:

- **Compra (purchase)**: Ingreso por orden de compra a proveedor
- **Venta (sale)**: Egreso por venta a cliente

### Movimientos Manuales
Realizados directamente por empleados:

- **Ajuste + (adjustment_in)**: Aumento manual de stock
- **Ajuste - (adjustment_out)**: Disminución manual de stock
- **Devolución + (return_in)**: Devolución de cliente (ingreso)
- **Devolución - (return_out)**: Devolución a proveedor (egreso)

## Información Registrada

Cada movimiento incluye:

1. **Fecha y Hora**: Timestamp exacto del movimiento
2. **Tipo**: Clasificación del movimiento (manual/automático)
3. **Producto**: Nombre y SKU del producto afectado
4. **Cantidad**: Cambio en el stock (+ para ingresos, - para egresos)
5. **Stock Anterior**: Cantidad antes del movimiento
6. **Stock Nuevo**: Cantidad después del movimiento
7. **Empleado**: Nombre del usuario que realizó el movimiento
8. **Origen**: Referencia a venta u orden de compra (si aplica)
9. **Notas**: Información adicional sobre el movimiento

## Características Principales

### Inmutabilidad
- Los movimientos NO se pueden modificar una vez creados
- Esto garantiza la integridad del historial de auditoría
- Para corregir errores, se crea un movimiento compensatorio

### Preservación de Datos
- El nombre del empleado se guarda en el momento del movimiento
- Aunque se elimine el usuario, el historial mantiene su nombre
- Esto asegura trazabilidad completa

### Filtrado Avanzado
- Combina múltiples filtros simultáneamente
- Resultados en tiempo real
- Contador de movimientos filtrados

### Indicadores Visuales
- Flechas verdes (↑) para ingresos
- Flechas rojas (↓) para egresos
- Badges de colores por tipo de movimiento
- Etiquetas "Manual" / "Automático"

## Casos de Uso

### 1. Auditoría de Inventario
Filtrar por empleado y rango de fechas para revisar quién hizo qué cambios.

### 2. Seguimiento de Compras
Filtrar por tipo "Compra" para ver todos los ingresos por órdenes de compra.

### 3. Análisis de Ventas
Filtrar por tipo "Venta" para ver el impacto en el inventario.

### 4. Corrección de Errores
Usar la función `createStockCorrection()` para revertir movimientos incorrectos.

### 5. Reportes de Stock
Exportar datos filtrados para análisis externos.

## Funciones Disponibles

### Para Desarrolladores

```typescript
// Obtener todos los movimientos con filtros
const movements = await getStockMovements({
  productId: 'uuid',
  movementType: 'purchase',
  dateFrom: '2024-01-01',
  dateTo: '2024-12-31',
  employeeId: 'uuid',
  purchaseOrderId: 'uuid'
})

// Obtener historial de un producto específico
const history = await getProductStockHistory('product-uuid')

// Crear ajuste manual
const result = await createStockAdjustment({
  product_id: 'uuid',
  movement_type: 'adjustment_in',
  quantity: 50,
  notes: 'Inventario físico'
})

// Crear corrección (revertir movimiento)
const correction = await createStockCorrection(
  'movement-uuid',
  'Error en el conteo inicial'
)

// Obtener estadísticas
const stats = await getStockMovementStats('product-uuid')
```

## Requisitos

### Base de Datos
- Ejecutar el script: `scripts/140_create_stock_history.sql`
- Crea la tabla `stock_movements`
- Configura triggers automáticos
- Establece políticas RLS

### Producto
- El producto debe tener `track_inventory = true`
- Solo productos con seguimiento de inventario generan movimientos

## Seguridad

### Políticas RLS
- Los usuarios solo ven movimientos de su empresa
- Los movimientos son inmutables (no se pueden actualizar)
- Solo admins/owners pueden eliminar movimientos (casos excepcionales)

### Validaciones
- Campos requeridos validados
- No se permite stock negativo en ajustes manuales
- Verificación de permisos de usuario
- Validación de tipos de movimiento

## Próximos Pasos

1. Ejecutar el script SQL si aún no lo has hecho
2. Activar "Controlar Stock" en los productos que desees rastrear
3. Realizar algunos movimientos de prueba
4. Explorar los filtros en la página de historial
5. Revisar el historial individual de cada producto

## Soporte

Para más información sobre la implementación, consulta:
- `.kiro/specs/historial-stock/requirements.md` - Requisitos completos
- `.kiro/specs/historial-stock/design.md` - Diseño técnico
- `.kiro/specs/historial-stock/tasks.md` - Plan de implementación
