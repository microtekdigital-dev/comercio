# Integración de Pagos a Proveedores en Cierre de Caja

## Resumen

Se implementó la funcionalidad para incluir los pagos a proveedores en efectivo en el cálculo del cierre de caja. Ahora el sistema considera tanto las ventas como los gastos en efectivo para calcular el saldo real de caja.

## Fórmula de Cálculo

### Antes
```
Efectivo Esperado = Monto Inicial + Ventas en Efectivo
```

### Ahora
```
Efectivo Esperado = Monto Inicial + Ventas en Efectivo - Pagos a Proveedores en Efectivo
```

## Cambios Implementados

### 1. Backend (`lib/actions/cash-register.ts`)

#### Función `createCashRegisterClosure`
- Se agregó consulta para obtener pagos a proveedores del día
- Se filtran solo los pagos en efectivo (payment_method contiene "efectivo" o "cash")
- Se calcula el total de pagos a proveedores en efectivo
- Se resta este monto del efectivo esperado
- Se guarda el monto en la columna `supplier_payments_cash`

#### Nueva Función `getSupplierPaymentsCash`
```typescript
export async function getSupplierPaymentsCash(
  dateFrom: string, 
  dateTo: string
): Promise<number>
```
- Obtiene el total de pagos a proveedores en efectivo para un rango de fechas
- Filtra por company_id del usuario autenticado
- Retorna el monto total en efectivo

### 2. Frontend (`app/dashboard/cash-register/new/page.tsx`)

#### Preview State
Se agregó el campo `supplierPaymentsCash` al estado del preview:
```typescript
const [preview, setPreview] = useState<{
  // ... otros campos
  supplierPaymentsCash: number
  // ...
}>()
```

#### Función `calculatePreview`
- Se llama a `getSupplierPaymentsCash` junto con `getSales`
- Se muestra el monto de pagos a proveedores en el resumen

#### Visualización
- Se agregó una tarjeta roja mostrando "Pagos a Proveedores" con ícono TrendingDown
- Se muestra el monto con signo negativo en rojo
- En el desglose de efectivo esperado se muestra:
  - Ventas en Efectivo: +$X
  - Monto Inicial Apertura: +$X
  - Pagos a Proveedores: -$X (en rojo)
  - Efectivo Esperado: $Total

#### Cálculo de Diferencia
```typescript
const cashDifference = cashCounted && preview 
  ? Number(cashCounted) - (
      preview.cashSales + 
      (preview.opening?.initial_cash_amount || 0) - 
      preview.supplierPaymentsCash
    )
  : null
```

### 3. Base de Datos

#### Migración (`scripts/213_add_supplier_payments_to_closures.sql`)
```sql
ALTER TABLE cash_register_closures 
ADD COLUMN IF NOT EXISTS supplier_payments_cash DECIMAL(12, 2) DEFAULT 0;
```

Se agregó la columna `supplier_payments_cash` para almacenar el total de pagos a proveedores en efectivo del día.

## Ejemplo de Uso

### Escenario
- Apertura de caja: $10,000
- Ventas en efectivo del día: $5,000
- Pagos a proveedores en efectivo: $2,000
- Efectivo contado al cierre: $13,000

### Cálculo
```
Efectivo Esperado = $10,000 + $5,000 - $2,000 = $13,000
Efectivo Contado = $13,000
Diferencia = $13,000 - $13,000 = $0 ✓
```

## Métodos de Pago Reconocidos

El sistema identifica pagos en efectivo cuando el campo `payment_method` contiene:
- "efectivo"
- "cash"

(No distingue mayúsculas/minúsculas)

## Archivos Modificados

1. `lib/actions/cash-register.ts`
   - Agregada consulta de supplier_payments
   - Agregado cálculo de supplierPaymentsCash
   - Modificada fórmula de efectivo esperado
   - Agregada función getSupplierPaymentsCash

2. `app/dashboard/cash-register/new/page.tsx`
   - Agregado import de getSupplierPaymentsCash y TrendingDown
   - Agregado campo supplierPaymentsCash al preview state
   - Modificada función calculatePreview
   - Agregada visualización de pagos a proveedores
   - Actualizado cálculo de diferencia

3. `scripts/213_add_supplier_payments_to_closures.sql`
   - Nueva migración para agregar columna

## Pruebas Recomendadas

1. Crear una apertura de caja con monto inicial
2. Registrar ventas en efectivo
3. Registrar pagos a proveedores en efectivo
4. Hacer cierre de caja y verificar que:
   - Se muestren los pagos a proveedores en el preview
   - El efectivo esperado reste los pagos a proveedores
   - La diferencia se calcule correctamente

## Notas

- Los pagos a proveedores solo afectan el cálculo si son en efectivo
- Los pagos con otros métodos (tarjeta, transferencia) no afectan el saldo de caja
- Si no hay pagos a proveedores en el día, el cálculo funciona igual que antes
- La columna supplier_payments_cash se guarda en la base de datos para auditoría
