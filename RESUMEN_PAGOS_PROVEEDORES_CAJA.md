# Resumen: Integración de Pagos a Proveedores en Cierre de Caja

## Estado: ✅ COMPLETADO

## Objetivo
Incluir los pagos a proveedores en efectivo en el cálculo del cierre de caja, para que el sistema considere tanto ingresos (ventas) como egresos (pagos a proveedores) al calcular el saldo real de efectivo.

## Cambios Realizados

### 1. Base de Datos
**Archivo**: `scripts/213_add_supplier_payments_to_closures.sql`
- Agregada columna `supplier_payments_cash` a la tabla `cash_register_closures`
- Tipo: `DECIMAL(12, 2) DEFAULT 0`
- Actualización de registros existentes para evitar NULL

### 2. Backend
**Archivo**: `lib/actions/cash-register.ts`

#### Función `createCashRegisterClosure`
- Consulta pagos a proveedores del día desde `supplier_payments`
- Filtra solo pagos en efectivo (payment_method contiene "efectivo" o "cash")
- Calcula total de pagos a proveedores en efectivo
- Actualiza fórmula: `Efectivo Esperado = Ventas Efectivo + Monto Inicial - Pagos Proveedores`
- Guarda `supplier_payments_cash` en el registro de cierre

#### Nueva Función `getSupplierPaymentsCash`
```typescript
export async function getSupplierPaymentsCash(
  dateFrom: string, 
  dateTo: string
): Promise<number>
```
- Obtiene total de pagos a proveedores en efectivo para un rango de fechas
- Filtra por company_id del usuario
- Retorna monto total

### 3. Frontend
**Archivo**: `app/dashboard/cash-register/new/page.tsx`

#### Cambios en el State
- Agregado campo `supplierPaymentsCash: number` al preview state

#### Función `calculatePreview`
- Llama a `getSupplierPaymentsCash` junto con `getSales`
- Calcula y muestra pagos a proveedores en el preview

#### Visualización
- Nueva tarjeta roja con ícono `TrendingDown` para "Pagos a Proveedores"
- Monto mostrado con signo negativo en rojo
- Desglose actualizado en el cálculo de efectivo esperado:
  ```
  Ventas en Efectivo:        +$5,000
  + Monto Inicial Apertura:  +$10,000
  - Pagos a Proveedores:     -$2,000
  ─────────────────────────────────
  Efectivo Esperado:         $13,000
  ```

#### Cálculo de Diferencia
```typescript
const cashDifference = cashCounted - (
  cashSales + 
  initialAmount - 
  supplierPaymentsCash
)
```

### 4. Tipos TypeScript
**Archivo**: `lib/types/erp.ts`
- Agregado campo `supplier_payments_cash: number` a la interfaz `CashRegisterClosure`

## Fórmula Final

```
Efectivo Esperado = Monto Inicial + Ventas en Efectivo - Pagos a Proveedores en Efectivo

Diferencia = Efectivo Contado - Efectivo Esperado
```

## Ejemplo Práctico

### Datos del Día
- Apertura de caja: $10,000
- Ventas en efectivo: $5,000
- Ventas con tarjeta: $3,000
- Pagos a proveedores en efectivo: $2,000
- Pagos a proveedores con transferencia: $1,500

### Cálculo
```
Efectivo Esperado = $10,000 + $5,000 - $2,000 = $13,000

Si el efectivo contado es $13,000:
Diferencia = $13,000 - $13,000 = $0 ✓ (Cuadra perfecto)

Si el efectivo contado es $12,800:
Diferencia = $12,800 - $13,000 = -$200 (Faltante)

Si el efectivo contado es $13,200:
Diferencia = $13,200 - $13,000 = +$200 (Sobrante)
```

## Archivos Modificados

1. ✅ `scripts/213_add_supplier_payments_to_closures.sql` (NUEVO)
2. ✅ `lib/actions/cash-register.ts`
3. ✅ `app/dashboard/cash-register/new/page.tsx`
4. ✅ `lib/types/erp.ts`
5. ✅ `PAGOS_PROVEEDORES_CAJA.md` (Documentación detallada)

## Instrucciones de Despliegue

### 1. Ejecutar Migración
```sql
-- En Supabase SQL Editor
\i scripts/213_add_supplier_payments_to_closures.sql
```

### 2. Verificar Columna
```sql
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'cash_register_closures' 
  AND column_name = 'supplier_payments_cash';
```

### 3. Probar Funcionalidad
1. Crear apertura de caja con monto inicial
2. Registrar ventas en efectivo
3. Registrar pagos a proveedores en efectivo
4. Hacer cierre de caja
5. Verificar que se muestren los pagos a proveedores
6. Verificar que el cálculo sea correcto

## Notas Importantes

- ✅ Solo afecta pagos en efectivo (no tarjeta ni transferencia)
- ✅ Compatible con cierres existentes (default 0)
- ✅ Se guarda en BD para auditoría
- ✅ Si no hay pagos a proveedores, funciona igual que antes
- ✅ Retrocompatible con datos existentes

## Próximos Pasos (Opcional)

1. Agregar filtro por turno en pagos a proveedores (si se implementan turnos en pagos)
2. Agregar reporte de pagos a proveedores por período
3. Agregar gráfico de flujo de efectivo (ingresos vs egresos)

## Documentación Adicional

Ver `PAGOS_PROVEEDORES_CAJA.md` para documentación técnica completa.
