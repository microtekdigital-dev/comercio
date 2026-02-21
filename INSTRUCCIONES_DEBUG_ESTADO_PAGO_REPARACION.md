# Resumen: Ingresos de Reparaciones en Dashboard

## Problema Reportado
El usuario reportó que los "Ingresos Totales" en el dashboard no se modificaban cuando se realizaban reparaciones.

## Causa del Problema
La función `getDashboardStats()` en `lib/actions/analytics.ts` calculaba `totalRevenue` únicamente con las ventas de productos, sin incluir los ingresos de reparaciones.

## Solución Implementada

### 1. Modificación en `lib/actions/analytics.ts`

Se actualizó la función `getDashboardStats()` para incluir ingresos de reparaciones:

```typescript
// Calculate sales revenue
const thisMonthRevenue = thisMonthSales?.reduce((sum, sale) => sum + sale.total, 0) || 0;
const lastMonthRevenue = lastMonthSales?.reduce((sum, sale) => sum + sale.total, 0) || 0;

// Calculate repairs revenue (if repairs module is available)
let thisMonthRepairsRevenue = 0;
let lastMonthRepairsRevenue = 0;

try {
  const { canAccessRepairs } = await import('@/lib/utils/plan-limits');
  const access = await canAccessRepairs(profile.company_id);
  
  if (access.allowed) {
    // This month repairs
    const { data: thisMonthRepairs } = await supabase
      .from('repair_orders')
      .select('id')
      .eq('company_id', profile.company_id)
      .in('status', ['repaired', 'delivered'])
      .gte('delivered_date', firstDayThisMonth.toISOString());

    if (thisMonthRepairs && thisMonthRepairs.length > 0) {
      const repairIds = thisMonthRepairs.map(r => r.id);
      const { data: payments } = await supabase
        .from('repair_payments')
        .select('amount')
        .in('repair_order_id', repairIds);
      
      thisMonthRepairsRevenue = (payments || []).reduce((sum, p) => sum + p.amount, 0);
    }

    // Last month repairs (similar logic)
    // ...
  }
} catch (error) {
  console.log('[getDashboardStats] Repairs module not available or error:', error);
}

// Calculate total revenue including repairs
const totalThisMonthRevenue = thisMonthRevenue + thisMonthRepairsRevenue;
const totalLastMonthRevenue = lastMonthRevenue + lastMonthRepairsRevenue;

const revenueGrowth = totalLastMonthRevenue > 0 
  ? ((totalThisMonthRevenue - totalLastMonthRevenue) / totalLastMonthRevenue) * 100 
  : 0;
```

### 2. Lógica Implementada

- **Verifica acceso al módulo**: Solo calcula ingresos de reparaciones si el plan tiene acceso
- **Obtiene reparaciones completadas**: Filtra por estados 'repaired' y 'delivered'
- **Suma pagos de reparaciones**: Obtiene todos los pagos asociados a esas reparaciones
- **Calcula crecimiento**: Compara mes actual vs mes anterior incluyendo reparaciones

## Dónde se Muestra

Los "Ingresos Totales" se muestran en:
- **Dashboard principal** (`components/dashboard/erp-stats.tsx`): Card "Ingresos Totales"
- Usa la función `getDashboardStats()` que ahora incluye reparaciones

## Otras Métricas que YA Incluyen Reparaciones

En `lib/actions/financial-stats.ts`:
- **Ventas Diarias** (`dailySales`): Incluye reparaciones del día
- **Ganancia Mensual** (`monthlyProfit`): Incluye reparaciones del mes

## Resultado

Ahora el dashboard muestra correctamente:
- ✅ Ingresos Totales = Ventas de Productos + Ingresos de Reparaciones
- ✅ Crecimiento calculado correctamente comparando ambos meses
- ✅ Solo se incluyen reparaciones si el plan tiene acceso al módulo

## Archivos Modificados

- `lib/actions/analytics.ts` - Función `getDashboardStats()` actualizada

## Próximos Pasos

1. Limpiar caché del navegador (Ctrl+F5)
2. Verificar que los "Ingresos Totales" ahora incluyan reparaciones
3. Confirmar que el crecimiento se calcula correctamente
