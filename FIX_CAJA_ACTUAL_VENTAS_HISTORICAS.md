# Fix: Caja Actual Suma Ventas Históricas

## Problema

Cuando se crea una nueva apertura de caja con un monto inicial (ej: $80,000), el dashboard muestra un valor mucho mayor (ej: $696,000) en "Caja Actual". 

## Causa

El cálculo de `calculateCurrentCashBalance()` estaba usando `sale_date >= opening_date` para filtrar las ventas, lo que incluía todas las ventas históricas desde esa fecha, no solo las ventas creadas después de la apertura.

**Código anterior:**
```typescript
// Filtraba por sale_date
.gte("sale_date", openingDateStr)
```

Esto causaba que si había ventas anteriores con `sale_date` igual o posterior a la fecha de apertura, se sumaran al cálculo aunque esas ventas ya estuvieran cerradas en cierres anteriores.

## Solución

Cambiar el filtro para usar `created_at > opening.created_at` en lugar de `sale_date >= opening_date`. Esto asegura que solo se sumen las ventas y pagos creados DESPUÉS de que se hizo la apertura de caja.

**Código corregido:**
```typescript
// Filtra por created_at (timestamp de creación)
.gt("created_at", openingCreatedAt)
```

## Cambios Realizados

### Archivo: `lib/actions/financial-stats.ts`

1. **Consulta de apertura activa** - Agregado `created_at`:
```typescript
const { data: allOpenings } = await supabase
  .from("cash_register_openings")
  .select("id, initial_cash_amount, opening_date, created_at")
  .eq("company_id", companyId)
  .order("opening_date", { ascending: false });
```

2. **Filtro de ventas** - Cambiado de `sale_date` a `created_at`:
```typescript
// ANTES:
.gte("sale_date", openingDateStr)

// AHORA:
.gt("created_at", openingCreatedAt)
```

3. **Filtro de pagos a proveedores** - Cambiado de `payment_date` a `created_at`:
```typescript
// ANTES:
.gte("payment_date", openingDateStr)

// AHORA:
.gt("created_at", openingCreatedAt)
```

## Fórmula Correcta

```
Caja Actual = Monto Inicial 
            + Ventas Efectivo (creadas después de la apertura)
            - Pagos Proveedores (creados después de la apertura)
            + Ingresos (de la apertura actual)
            - Retiros (de la apertura actual)
```

## Verificación

Para verificar que el cálculo es correcto, ejecutar el script de diagnóstico:

```bash
# Ejecutar en Supabase SQL Editor
DEBUG_CAJA_ACTUAL_APERTURA.sql
```

Este script mostrará:
1. Todas las aperturas recientes
2. Todos los cierres recientes
3. La apertura activa (sin cierre)
4. Ventas en efectivo desde la apertura
5. Pagos a proveedores desde la apertura
6. Movimientos de caja de la apertura
7. Cálculo completo desglosado

## Resultado Esperado

Después del fix:
- **Apertura nueva con $80,000** → Dashboard muestra **$80,000**
- **Después de venta de $5,000 en efectivo** → Dashboard muestra **$85,000**
- **Después de pago proveedor $2,000 en efectivo** → Dashboard muestra **$83,000**
- **Después de ingreso $10,000** → Dashboard muestra **$93,000**
- **Después de retiro $3,000** → Dashboard muestra **$90,000**

## Notas Importantes

- Los movimientos de caja (ingresos/retiros) ya estaban correctamente filtrados por `opening_id`, por lo que no necesitaron cambios
- Este fix asegura que cada apertura de caja comienza con un saldo limpio
- Las ventas y pagos de cierres anteriores ya no afectan el cálculo de la apertura actual

## Fecha de Corrección

Febrero 2026

---

**Estado:** ✅ Corregido  
**Archivos Modificados:** `lib/actions/financial-stats.ts`  
**Script de Diagnóstico:** `DEBUG_CAJA_ACTUAL_APERTURA.sql`
