# Sistema de Cuentas por Cobrar y Cuentas por Pagar

## ✅ Funcionalidades Implementadas

El sistema ERP ya cuenta con un sistema completo de gestión de pagos parciales tanto para clientes (cuentas por cobrar) como para proveedores (cuentas por pagar).

### 🗓️ Filtros por Fecha

Ambos módulos (Ventas y Órdenes de Compra) incluyen **filtros de fecha** que permiten:

- ✅ **Fecha Desde**: Filtrar transacciones desde una fecha específica
- ✅ **Fecha Hasta**: Filtrar transacciones hasta una fecha específica
- ✅ **Rango de fechas**: Combinar ambos filtros para ver un período específico
- ✅ **Filtrar cuentas por cobrar y por pagar por fechas**

**Ubicación de los Filtros**:

1. **Ventas** (`/dashboard/sales`):
   - Botón "Filtros" en la esquina superior derecha
   - Campos "Fecha Desde" y "Fecha Hasta"
   - Filtra por `sale_date` (fecha de la venta)
   - Permite ver qué clientes deben dinero en un período específico

2. **Órdenes de Compra** (`/dashboard/purchase-orders`):
   - Botón "Mostrar Filtros" en el encabezado de la tarjeta
   - Campos "Fecha Desde" y "Fecha Hasta"
   - Filtra por `order_date` (fecha de la orden)
   - Permite ver qué se debe a proveedores en un período específico

**Implementación Técnica**:

- **Frontend**: 
  - `app/dashboard/sales/page.tsx` - UI de filtros para ventas
  - `app/dashboard/purchase-orders/page.tsx` - UI de filtros para órdenes de compra
  
- **Backend**:
  - `lib/actions/sales.ts` - Función `getSales()` con parámetros `dateFrom` y `dateTo`
  - `lib/actions/purchase-orders.ts` - Función `getPurchaseOrders()` con parámetros `dateFrom` y `dateTo`

Los filtros usan operadores de Supabase:
- `gte` (greater than or equal) para fecha desde
- `lte` (less than or equal) para fecha hasta

### 📊 Cuentas por Cobrar (Clientes)

**Ubicación**: Módulo de Ventas (`/dashboard/sales`)

**Características**:
- ✅ Registro de pagos parciales
- ✅ Cálculo automático de saldo pendiente
- ✅ Estados de pago: Pendiente, Pago Parcial, Pagado
- ✅ Historial completo de pagos
- ✅ Múltiples métodos de pago
- ✅ Calculadora de vuelto para efectivo
- ✅ Notificaciones de pagos pendientes

**Componente Principal**: `components/dashboard/payment-manager.tsx`

**Cómo Funciona**:
1. Al crear una venta, el estado de pago es "Pendiente"
2. Desde el detalle de la venta, se pueden registrar pagos parciales
3. El sistema calcula automáticamente:
   - Total de la venta
   - Total pagado (suma de todos los pagos)
   - Saldo pendiente (total - pagado)
4. El estado se actualiza automáticamente:
   - `pending`: No hay pagos registrados
   - `partial`: Hay pagos pero el saldo > 0
   - `paid`: Saldo = 0

**Métodos de Pago Soportados**:
- Efectivo (con calculadora de vuelto)
- Transferencia bancaria
- Tarjeta de débito
- Tarjeta de crédito
- Cheque
- MercadoPago
- Otro

### 💰 Cuentas por Pagar (Proveedores)

**Ubicación**: Módulo de Órdenes de Compra (`/dashboard/purchase-orders`)

**Características**:
- ✅ Registro de pagos parciales a proveedores
- ✅ Cálculo automático de saldo pendiente
- ✅ Estados de pago: Pendiente, Pago Parcial, Pagado
- ✅ Historial completo de pagos
- ✅ Vista consolidada por proveedor

**Cómo Funciona**:
1. Al recibir una orden de compra, el estado de pago es "Pendiente"
2. Desde el detalle de la orden, se pueden registrar pagos parciales
3. El sistema calcula automáticamente:
   - Total de la orden
   - Total pagado
   - Saldo pendiente
4. En la vista del proveedor se muestra:
   - Total comprado
   - Total pagado
   - Saldo pendiente consolidado

## 📋 Estructura de Datos

### Tabla `sales` (Ventas)
```sql
- total: DECIMAL(12, 2)
- payment_status: VARCHAR(20) -- 'pending', 'partial', 'paid', 'refunded'
- payment_method: VARCHAR(50)
```

### Tabla `sale_payments` (Pagos de Ventas)
```sql
- id: UUID
- sale_id: UUID (FK)
- amount: DECIMAL(12, 2)
- payment_method: VARCHAR(50)
- payment_date: DATE
- reference_number: VARCHAR(100)
- notes: TEXT
- created_by: UUID
- created_at: TIMESTAMPTZ
```

### Tabla `purchase_orders` (Órdenes de Compra)
```sql
- total: DECIMAL(15, 2)
- payment_status: VARCHAR(20) -- 'pending', 'partial', 'paid'
```

### Tabla `purchase_order_payments` (Pagos a Proveedores)
```sql
- id: UUID
- purchase_order_id: UUID (FK)
- amount: DECIMAL(15, 2)
- payment_method: VARCHAR(50)
- payment_date: DATE
- reference_number: VARCHAR(100)
- notes: TEXT
- created_by: UUID
- created_at: TIMESTAMPTZ
```

## 🎯 Casos de Uso

### Caso 1: Venta con Pago Parcial
1. Cliente compra por $10,000
2. Paga $5,000 en efectivo → Estado: "Pago Parcial"
3. Saldo pendiente: $5,000
4. Después paga $3,000 por transferencia → Estado: "Pago Parcial"
5. Saldo pendiente: $2,000
6. Finalmente paga $2,000 → Estado: "Pagado"
7. Saldo pendiente: $0

### Caso 2: Compra a Proveedor con Pagos Parciales
1. Orden de compra por $50,000
2. Se paga $20,000 al recibir → Estado: "Pago Parcial"
3. Saldo pendiente: $30,000
4. Se paga $30,000 a 30 días → Estado: "Pagado"
5. Saldo pendiente: $0

## 📊 Reportes y Consultas

### Ver Saldo de un Cliente
```typescript
// En el detalle de la venta
const totalPaid = sale.payments.reduce((sum, p) => sum + p.amount, 0);
const balance = sale.total - totalPaid;
```

### Ver Saldo de un Proveedor
```typescript
// En lib/actions/suppliers.ts
const totalPurchased = purchaseOrders.reduce((sum, po) => sum + po.total, 0);
const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
const balance = totalPurchased - totalPaid;
```

### Filtrar Ventas por Estado de Pago
```typescript
// En /dashboard/sales
- Filtro por payment_status: 'pending', 'partial', 'paid'
```

## 🔔 Notificaciones

El sistema incluye notificaciones automáticas para:
- Pagos pendientes después de 15 días (prioridad normal)
- Pagos pendientes después de 30 días (prioridad alta)
- Pagos pendientes después de 45 días (prioridad urgente)

**Script**: `scripts/030_create_notifications.sql`

## 🚀 Cómo Usar

### Filtrar por Fechas

**Para ver lo que te deben (Cuentas por Cobrar)**:
1. Ir a **Ventas** (`/dashboard/sales`)
2. Click en el botón **Filtros**
3. Seleccionar **Fecha Desde** y **Fecha Hasta** para el período deseado
4. Opcionalmente, filtrar por **Estado de Pago**: "Pendiente" o "Parcial"
5. Ver todas las ventas con saldo pendiente en ese período

**Para ver lo que debes (Cuentas por Pagar)**:
1. Ir a **Órdenes de Compra** (`/dashboard/purchase-orders`)
2. Click en el botón **Mostrar Filtros**
3. Seleccionar **Estado de Pago**: "Pendiente" o "Parcial" (para ver solo lo que debes)
4. Opcionalmente, seleccionar **Fecha Desde** y **Fecha Hasta** para el período deseado
5. Ver todas las órdenes con saldo pendiente

**Ejemplos de Uso**:
- Ver solo lo que debes: Estado de Pago = "Pendiente" o "Parcial"
- Ver ventas del mes actual: Fecha Desde = 01/02/2026, Fecha Hasta = 28/02/2026
- Ver órdenes del último trimestre: Fecha Desde = 01/11/2025, Fecha Hasta = 31/01/2026
- Ver todo lo pendiente hasta hoy: Estado de Pago = "Pendiente" o "Parcial", Fecha Hasta = hoy

### Registrar un Pago de Cliente

1. Ir a **Ventas** → Seleccionar una venta
2. En la sección "Gestión de Pagos", click en **Registrar Pago**
3. El monto se establece automáticamente al saldo pendiente
4. Seleccionar método de pago
5. Si es efectivo, usar la calculadora de vuelto
6. Agregar número de referencia (opcional)
7. Agregar notas (opcional)
8. Click en **Registrar Pago**

### Registrar un Pago a Proveedor

1. Ir a **Órdenes de Compra** → Seleccionar una orden
2. En la sección de pagos, click en **Registrar Pago**
3. Ingresar el monto a pagar
4. Seleccionar método de pago
5. Agregar referencia y notas
6. Click en **Registrar Pago**

### Ver Estado de Cuentas

**Por Cliente**:
- Ir a **Ventas** → Ver todas las ventas del cliente
- Filtrar por "Pago Parcial" o "Pendiente"
- Ver el saldo pendiente en cada venta

**Por Proveedor**:
- Ir a **Proveedores** → Seleccionar un proveedor
- Ver el resumen con:
  - Total comprado
  - Total pagado
  - Saldo pendiente

## 💡 Mejoras Futuras Sugeridas

1. **Reporte de Antigüedad de Saldos**
   - Saldos vencidos por período (0-30, 31-60, 61-90, +90 días)

2. **Dashboard de Cuentas por Cobrar/Pagar**
   - Vista consolidada de todos los saldos pendientes
   - Gráficos de evolución

3. **Recordatorios Automáticos**
   - Enviar emails a clientes con saldos pendientes
   - Alertas para pagos a proveedores próximos a vencer

4. **Proyección de Flujo de Caja**
   - Basado en pagos pendientes y fechas estimadas

5. **Conciliación Bancaria**
   - Importar movimientos bancarios
   - Conciliar automáticamente con pagos registrados

## 📝 Notas Importantes

- Los pagos son **inmutables** - no se pueden editar después de creados
- Solo se pueden eliminar pagos si el usuario tiene permisos de admin
- El sistema valida que el monto del pago no exceda el saldo pendiente
- Los estados de pago se actualizan automáticamente
- Todos los pagos quedan registrados con usuario y fecha

## 🔗 Archivos Relacionados

- `components/dashboard/payment-manager.tsx` - Componente de gestión de pagos
- `lib/actions/sales.ts` - Lógica de ventas y pagos
- `lib/actions/purchase-orders.ts` - Lógica de órdenes de compra y pagos
- `lib/actions/suppliers.ts` - Estadísticas de proveedores
- `scripts/010_create_erp_tables.sql` - Estructura de tablas
- `scripts/030_create_notifications.sql` - Notificaciones de pagos pendientes
