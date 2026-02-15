# Design Document: Reporte de Liquidación de Cuentas

## Overview

El Reporte de Liquidación de Cuentas es una funcionalidad que proporciona una vista consolidada del estado financiero de cuentas por cobrar y cuentas por pagar en una fecha determinada. El sistema calcula automáticamente los saldos pendientes, días de vencimiento y el balance neto entre lo que se debe cobrar y lo que se debe pagar.

La funcionalidad se implementará como una nueva página en `/dashboard/accounts-settlement` y reutilizará las funciones existentes de `getSales()` y `getPurchaseOrders()` para obtener los datos, aplicando filtros y cálculos adicionales en el cliente.

## Architecture

### Component Structure

```
app/dashboard/accounts-settlement/
  └── page.tsx                          # Página principal del reporte

components/dashboard/
  ├── accounts-settlement-report.tsx    # Componente principal del reporte
  ├── accounts-settlement-summary.tsx   # Tarjetas de resumen financiero
  ├── accounts-receivable-table.tsx     # Tabla de cuentas por cobrar
  └── accounts-payable-table.tsx        # Tabla de cuentas por pagar

lib/actions/
  └── accounts-settlement.ts            # Funciones para cálculos y exportación
```

### Data Flow

1. Usuario selecciona fecha de corte
2. Sistema llama a `getSales()` y `getPurchaseOrders()` con filtros de fecha
3. Sistema filtra ventas con `payment_status` 'pending' o 'partial'
4. Sistema filtra órdenes con `payment_status` 'pending' o 'partial'
5. Sistema calcula saldos pendientes para cada registro
6. Sistema calcula días vencidos basándose en la fecha de corte
7. Sistema ordena por días vencidos (descendente)
8. Sistema calcula totales y balance neto
9. Sistema renderiza las tarjetas de resumen y tablas

## Components and Interfaces

### 1. AccountsSettlementReport (Main Component)

Componente principal que orquesta todo el reporte.

**Props:**
```typescript
interface AccountsSettlementReportProps {
  companyId: string;
  companyName: string;
  currency?: string;
}
```

**State:**
```typescript
{
  cutoffDate: Date;                    // Fecha de corte seleccionada
  accountsReceivable: AccountReceivable[];  // Cuentas por cobrar
  accountsPayable: AccountPayable[];        // Cuentas por pagar
  isLoading: boolean;                  // Estado de carga
  summary: FinancialSummary;           // Resumen financiero
}
```

**Responsibilities:**
- Gestionar la fecha de corte
- Obtener datos de ventas y órdenes de compra
- Calcular saldos pendientes y días vencidos
- Calcular resumen financiero
- Coordinar la exportación a Excel y PDF

### 2. AccountsSettlementSummary

Componente que muestra las tres tarjetas de resumen.

**Props:**
```typescript
interface AccountsSettlementSummaryProps {
  totalReceivable: number;    // Total cuentas por cobrar
  totalPayable: number;       // Total cuentas por pagar
  netBalance: number;         // Balance neto
  currency: string;           // Moneda (ARS)
}
```

**Rendering:**
- Tres tarjetas (Card) con iconos distintivos
- Formato de moneda para todos los montos
- Color verde para balance positivo, rojo para negativo

### 3. AccountsReceivableTable

Tabla de cuentas por cobrar.

**Props:**
```typescript
interface AccountsReceivableTableProps {
  data: AccountReceivable[];
  currency: string;
  isLoading: boolean;
}
```

**Columns:**
- Cliente (customer name o "Cliente General")
- Fecha Venta (sale_date)
- Total (total)
- Pagado (suma de payments)
- Saldo Pendiente (total - pagado)
- Días Vencido (cutoffDate - sale_date)

**Features:**
- Ordenamiento por días vencido (descendente por defecto)
- Formato de moneda ARS
- Indicador visual para días vencidos altos

### 4. AccountsPayableTable

Tabla de cuentas por pagar.

**Props:**
```typescript
interface AccountsPayableTableProps {
  data: AccountPayable[];
  currency: string;
  isLoading: boolean;
}
```

**Columns:**
- Proveedor (supplier name)
- Fecha Orden (order_date)
- Total (total)
- Pagado (suma de payments)
- Saldo Pendiente (total - pagado)
- Días Vencido (cutoffDate - order_date)

**Features:**
- Ordenamiento por días vencido (descendente por defecto)
- Formato de moneda ARS
- Indicador visual para días vencidos altos

## Data Models

### AccountReceivable

```typescript
interface AccountReceivable {
  id: string;
  saleNumber: string;
  customerName: string;
  saleDate: Date;
  total: number;
  paid: number;
  balance: number;          // Calculated: total - paid
  daysOverdue: number;      // Calculated: cutoffDate - saleDate
}
```

### AccountPayable

```typescript
interface AccountPayable {
  id: string;
  orderNumber: string;
  supplierName: string;
  orderDate: Date;
  total: number;
  paid: number;
  balance: number;          // Calculated: total - paid
  daysOverdue: number;      // Calculated: cutoffDate - orderDate
}
```

### FinancialSummary

```typescript
interface FinancialSummary {
  totalReceivable: number;  // Sum of all receivable balances
  totalPayable: number;     // Sum of all payable balances
  netBalance: number;       // totalReceivable - totalPayable
}
```

### ExportData

```typescript
interface ExportData {
  cutoffDate: Date;
  summary: FinancialSummary;
  accountsReceivable: AccountReceivable[];
  accountsPayable: AccountPayable[];
  companyName: string;
  currency: string;
  generatedAt: Date;
}
```

## Correctness Properties

*Una propiedad es una característica o comportamiento que debe mantenerse verdadero en todas las ejecuciones válidas del sistema - esencialmente, una declaración formal sobre lo que el sistema debe hacer. Las propiedades sirven como puente entre las especificaciones legibles por humanos y las garantías de correctitud verificables por máquina.*

### Property 1: Filtrado por fecha de corte

*Para cualquier* fecha de corte seleccionada y conjunto de ventas/órdenes, todos los registros mostrados deben tener fecha de venta/orden menor o igual a la fecha de corte.

**Validates: Requirements 1.2, 3.2, 4.2**

### Property 2: Cálculo de saldo pendiente para ventas

*Para cualquier* venta con pagos asociados, el saldo pendiente debe ser igual al total de la venta menos la suma de todos los pagos en sale_payments.

**Validates: Requirements 3.4**

### Property 3: Cálculo de saldo pendiente para órdenes

*Para cualquier* orden de compra con pagos asociados, el saldo pendiente debe ser igual al total de la orden menos la suma de todos los pagos en supplier_payments.

**Validates: Requirements 4.4**

### Property 4: Cálculo de balance neto

*Para cualquier* conjunto de cuentas por cobrar y cuentas por pagar, el balance neto debe ser igual a la suma de todos los saldos pendientes de cuentas por cobrar menos la suma de todos los saldos pendientes de cuentas por pagar.

**Validates: Requirements 2.4**

### Property 5: Cálculo de días vencidos

*Para cualquier* fecha de corte y fecha de venta/orden, los días vencidos deben ser igual a la diferencia en días entre la fecha de corte y la fecha de venta/orden.

**Validates: Requirements 3.5, 4.5**

### Property 6: Ordenamiento por días vencidos

*Para cualquier* lista de cuentas (por cobrar o por pagar), después de ordenar por días vencidos en orden descendente, cada elemento debe tener días vencidos mayor o igual que el siguiente elemento.

**Validates: Requirements 3.6, 4.6**

### Property 7: Filtrado por estado de pago

*Para cualquier* conjunto de ventas y órdenes, solo deben mostrarse aquellas con payment_status 'pending' o 'partial'.

**Validates: Requirements 3.1, 4.1**

### Property 8: Suma de totales de cuentas por cobrar

*Para cualquier* conjunto de cuentas por cobrar, el total de cuentas por cobrar debe ser igual a la suma de todos los saldos pendientes individuales.

**Validates: Requirements 2.2**

### Property 9: Suma de totales de cuentas por pagar

*Para cualquier* conjunto de cuentas por pagar, el total de cuentas por pagar debe ser igual a la suma de todos los saldos pendientes individuales.

**Validates: Requirements 2.3**

### Property 10: Formato de moneda

*Para cualquier* monto mostrado en el reporte, debe estar formateado con el símbolo de moneda ARS ($), separadores de miles y dos decimales.

**Validates: Requirements 2.7, 3.8, 4.7**

### Property 11: Nombre de archivo de exportación

*Para cualquier* fecha de corte, el nombre del archivo Excel exportado debe contener la fecha de corte en formato ISO (YYYY-MM-DD).

**Validates: Requirements 5.4**

### Property 12: Formato de números en Excel

*Para cualquier* monto en el archivo Excel exportado, debe ser un número (no string) para permitir cálculos en Excel.

**Validates: Requirements 5.6**

### Property 13: Formato de montos en PDF

*Para cualquier* monto en el archivo PDF exportado, debe estar formateado con símbolo de moneda ($) y dos decimales.

**Validates: Requirements 5.7**

### Property 14: Nombre de empresa en PDF

*Para cualquier* archivo PDF exportado, debe incluir el nombre de la empresa en el encabezado.

**Validates: Requirements 5.9**

### Property 15: Aislamiento por empresa

*Para cualquier* usuario autenticado, todos los datos mostrados deben pertenecer exclusivamente a la empresa (company_id) del usuario.

**Validates: Requirements 7.2, 7.3**

### Property 16: Permitir cualquier fecha

*Para cualquier* fecha seleccionada (pasada, presente o futura), el sistema debe aceptarla y procesar el reporte sin errores.

**Validates: Requirements 1.3**

## Error Handling

### Validation Errors

1. **Usuario no autenticado**
   - Detectar: Verificar `user` en `supabase.auth.getUser()`
   - Acción: Redirigir a `/login`

2. **Empresa no encontrada**
   - Detectar: `company_id` es null en profile
   - Acción: Mostrar error "No se encontró la empresa asociada"

3. **Error al obtener datos**
   - Detectar: Error en `getSales()` o `getPurchaseOrders()`
   - Acción: Mostrar toast de error, mantener datos anteriores

4. **Error al exportar**
   - Detectar: Excepción en generación de Excel
   - Acción: Mostrar toast de error "Error al exportar el reporte"

### Edge Cases

1. **Sin cuentas pendientes**
   - Mostrar mensaje: "No hay cuentas pendientes en la fecha seleccionada"
   - Mostrar resumen con valores en cero

2. **Venta sin cliente**
   - Mostrar "Cliente General" en la columna Cliente

3. **Fecha futura**
   - Permitir selección
   - Procesar normalmente (puede haber ventas/órdenes futuras)

4. **Sin pagos**
   - Saldo pendiente = total
   - Pagado = 0

## Testing Strategy

### Unit Tests

Se escribirán unit tests para:

1. **Funciones de cálculo**
   - `calculateBalance(total, payments)` → debe retornar total - suma(payments)
   - `calculateDaysOverdue(cutoffDate, transactionDate)` → debe retornar diferencia en días
   - `calculateFinancialSummary(receivables, payables)` → debe retornar totales correctos

2. **Funciones de filtrado**
   - `filterByPaymentStatus(transactions, statuses)` → debe retornar solo transacciones con status correcto
   - `filterByDate(transactions, cutoffDate)` → debe retornar solo transacciones hasta la fecha

3. **Funciones de ordenamiento**
   - `sortByDaysOverdue(accounts)` → debe ordenar descendente por días vencidos

4. **Funciones de formato**
   - `formatCurrency(amount, currency)` → debe retornar string con formato correcto
   - `formatExcelNumber(amount)` → debe retornar número para Excel

5. **Casos edge**
   - Venta sin cliente → debe retornar "Cliente General"
   - Sin cuentas pendientes → debe retornar arrays vacíos
   - Sin pagos → debe calcular balance = total

### Property-Based Tests

Se escribirán property tests para validar las propiedades de correctitud definidas anteriormente. Cada test debe ejecutarse con mínimo 100 iteraciones.

**Configuración:**
- Librería: `fast-check` (para TypeScript/JavaScript)
- Iteraciones mínimas: 100 por test
- Tag format: `Feature: liquidacion-cuentas, Property {N}: {property_text}`

**Tests a implementar:**

1. **Property 1: Filtrado por fecha de corte**
   - Generar: fechas aleatorias, ventas/órdenes con fechas aleatorias
   - Verificar: todos los registros filtrados tienen fecha <= cutoffDate

2. **Property 2 & 3: Cálculo de saldo pendiente**
   - Generar: transacciones con totales y pagos aleatorios
   - Verificar: balance = total - suma(payments)

3. **Property 4: Cálculo de balance neto**
   - Generar: conjuntos aleatorios de cuentas por cobrar y pagar
   - Verificar: netBalance = suma(receivables) - suma(payables)

4. **Property 5: Cálculo de días vencidos**
   - Generar: pares de fechas aleatorias
   - Verificar: daysOverdue = diferencia en días

5. **Property 6: Ordenamiento**
   - Generar: listas aleatorias de cuentas
   - Verificar: después de ordenar, cada elemento.daysOverdue >= siguiente.daysOverdue

6. **Property 7: Filtrado por estado de pago**
   - Generar: transacciones con payment_status aleatorios
   - Verificar: solo se incluyen 'pending' y 'partial'

7. **Property 8 & 9: Suma de totales**
   - Generar: conjuntos aleatorios de cuentas
   - Verificar: total = suma de balances individuales

8. **Property 10: Formato de moneda**
   - Generar: montos aleatorios
   - Verificar: string contiene '$', separadores de miles, 2 decimales

9. **Property 11: Nombre de archivo**
   - Generar: fechas aleatorias
   - Verificar: nombre contiene fecha en formato YYYY-MM-DD

10. **Property 12: Formato Excel**
    - Generar: montos aleatorios
    - Verificar: valor en Excel es tipo número

11. **Property 13: Formato de montos en PDF**
    - Generar: montos aleatorios
    - Verificar: string contiene $, separadores de miles, 2 decimales

12. **Property 14: Nombre de empresa en PDF**
    - Generar: nombres de empresa aleatorios
    - Verificar: PDF contiene el nombre de la empresa

13. **Property 15: Aislamiento por empresa**
    - Generar: datos de múltiples empresas
    - Verificar: solo se retornan datos de company_id del usuario

14. **Property 16: Permitir cualquier fecha**
    - Generar: fechas en rangos pasado, presente, futuro
    - Verificar: todas son aceptadas sin error

### Integration Tests

Se escribirán integration tests para:

1. **Flujo completo de reporte**
   - Seleccionar fecha → obtener datos → calcular → renderizar
   - Verificar que todos los componentes se actualizan correctamente

2. **Exportación a Excel**
   - Generar reporte → exportar → verificar contenido del archivo
   - Verificar que incluye todas las secciones

3. **Exportación a PDF**
   - Generar reporte → exportar → verificar contenido del archivo
   - Verificar que incluye nombre de empresa y formato correcto

4. **Autenticación y permisos**
   - Usuario no autenticado → debe redirigir
   - Usuario autenticado → debe ver solo sus datos

## Implementation Notes

### Reutilización de Código

1. **Funciones existentes:**
   - `getSales()` de `lib/actions/sales.ts`
   - `getPurchaseOrders()` de `lib/actions/purchase-orders.ts`
   - `exportToExcel()` de `lib/utils/export.ts`
   - Patrón de exportación PDF de `lib/utils/export.ts` (usar jsPDF y autoTable)

2. **Componentes UI existentes:**
   - `Card`, `CardHeader`, `CardTitle`, `CardContent` de `@/components/ui/card`
   - `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableCell` de `@/components/ui/table`
   - `Button` de `@/components/ui/button`
   - `Calendar` / DatePicker de `@/components/ui/calendar`

3. **Utilidades:**
   - Formato de moneda: reutilizar patrón de `Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" })`
   - Cálculo de diferencia de fechas: usar `date-fns` o similar

### Performance Considerations

1. **Cálculos en cliente:**
   - Los cálculos de saldos y días vencidos se realizan en el cliente
   - Para grandes volúmenes (>1000 registros), considerar memoización con `useMemo`

2. **Filtrado eficiente:**
   - Aplicar filtros de fecha en la query de base de datos (dateFrom, dateTo)
   - Filtrar por payment_status en el cliente (ya viene en los datos)

3. **Exportación:**
   - Para grandes volúmenes, mostrar indicador de progreso
   - Considerar generación en chunks si es necesario

### Security Considerations

1. **Autenticación:**
   - Verificar usuario autenticado en el servidor
   - Usar middleware de Next.js para proteger la ruta

2. **Autorización:**
   - Filtrar siempre por `company_id` del usuario
   - No exponer datos de otras empresas

3. **Validación:**
   - Validar formato de fecha en el servidor
   - Sanitizar inputs antes de queries

### Accessibility

1. **Tablas:**
   - Usar headers semánticos (`<th>`)
   - Incluir `aria-label` descriptivos

2. **Tarjetas de resumen:**
   - Incluir texto alternativo para iconos
   - Usar contraste adecuado para colores (verde/rojo)

3. **Selector de fecha:**
   - Asegurar navegación por teclado
   - Incluir labels descriptivos

4. **Exportación:**
   - Botón con texto claro y accesible
   - Feedback visual y auditivo al completar
