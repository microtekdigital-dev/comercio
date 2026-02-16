# Fix: Evitar Duplicación de Ventas y Pagos en Múltiples Cierres

## Problema

Cuando múltiples personas hacían cierres de caja en el mismo día, las ventas y pagos a proveedores se contaban múltiples veces. Por ejemplo:
- Persona A hace cierre a las 14:00 → Cuenta ventas de 8:00 a 14:00
- Persona B hace cierre a las 18:00 → Volvía a contar las mismas ventas de 8:00 a 14:00 + las nuevas de 14:00 a 18:00

Esto causaba que el resumen de caja mostrara valores incorrectos y duplicados.

## Solución Implementada

Se implementó un sistema de filtrado por timestamp del último cierre:

### 1. Backend (`lib/actions/cash-register.ts`)

**Función `createCashRegisterClosure`:**
- Busca el último cierre del día (ordenado por `created_at`)
- Si existe un cierre previo, usa su `created_at` como punto de corte
- Filtra ventas y pagos para obtener solo los creados DESPUÉS del último cierre
- Usa `.gt("created_at", lastClosureTime)` en las consultas

```typescript
// Get existing closures for this date to find the last closure timestamp
const { data: existingClosures } = await supabase
  .from("cash_register_closures")
  .select("created_at")
  .eq("company_id", profile.company_id)
  .gte("closure_date", startOfDay.toISOString())
  .lte("closure_date", endOfDay.toISOString())
  .order("created_at", { ascending: false })
  .limit(1)

const lastClosureTime = existingClosures && existingClosures.length > 0 
  ? existingClosures[0].created_at 
  : null

// Only get sales created after the last closure
if (lastClosureTime) {
  salesQuery = salesQuery.gt("created_at", lastClosureTime)
  paymentsQuery = paymentsQuery.gt("created_at", lastClosureTime)
}
```

**Nueva función `getSupplierPayments`:**
- Retorna array completo de pagos con todos sus campos
- Permite filtrado en el frontend por `created_at`
- Complementa a `getSupplierPaymentsCash` que solo retorna el total

### 2. Frontend (`app/dashboard/cash-register/new/page.tsx`)

**Función `calculatePreview`:**
- Obtiene todos los cierres del día
- Identifica el último cierre por `created_at`
- Filtra ventas y pagos en el cliente usando el timestamp del último cierre
- Calcula totales solo con las transacciones nuevas

```typescript
// Get existing closures for this date
const allClosures = await getCashRegisterClosures({
  dateFrom: startOfDay.toISOString(),
  dateTo: endOfDay.toISOString(),
})

// Sort by created_at to get the most recent closure
const sortedClosures = allClosures.sort((a, b) => 
  new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
)
const lastClosure = sortedClosures.length > 0 ? sortedClosures[0] : null

// Filter sales and payments to only include those created after the last closure
const sales = lastClosure 
  ? allSales.filter(sale => new Date(sale.created_at) > new Date(lastClosure.created_at))
  : allSales

const supplierPayments = lastClosure
  ? allSupplierPayments.filter(payment => new Date(payment.created_at) > new Date(lastClosure.created_at))
  : allSupplierPayments
```

## Flujo de Trabajo

### Escenario: Múltiples cierres en el mismo día

**Cierre 1 (10:00 AM):**
- Ventas desde inicio del día hasta 10:00 AM
- No hay cierre previo → Cuenta todas las ventas del día
- Se guarda con `created_at = 2024-02-16 10:00:00`

**Cierre 2 (14:00 PM):**
- Busca último cierre del día → Encuentra cierre de 10:00 AM
- Filtra ventas: `created_at > 2024-02-16 10:00:00`
- Solo cuenta ventas de 10:00 AM a 14:00 PM
- Se guarda con `created_at = 2024-02-16 14:00:00`

**Cierre 3 (18:00 PM):**
- Busca último cierre del día → Encuentra cierre de 14:00 PM
- Filtra ventas: `created_at > 2024-02-16 14:00:00`
- Solo cuenta ventas de 14:00 PM a 18:00 PM
- Se guarda con `created_at = 2024-02-16 18:00:00`

## Ventajas

1. **Precisión:** Cada venta/pago se cuenta exactamente una vez
2. **Flexibilidad:** Permite múltiples cierres por día sin duplicación
3. **Consistencia:** Backend y frontend usan la misma lógica
4. **Auditoría:** Cada cierre refleja solo las transacciones de su período

## Archivos Modificados

- `lib/actions/cash-register.ts`
  - Modificada función `createCashRegisterClosure`
  - Agregada función `getSupplierPayments`
  - Agregado import de tipo `SupplierPayment`

- `app/dashboard/cash-register/new/page.tsx`
  - Modificada función `calculatePreview`
  - Cambiado import de `getSupplierPaymentsCash` a `getSupplierPayments`
  - Agregado filtrado de ventas y pagos por último cierre

## Fecha de Implementación

16 de febrero de 2024
