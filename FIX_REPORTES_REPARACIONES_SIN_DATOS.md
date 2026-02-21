# Fix: Reportes de Reparaciones Sin Datos

## Problema
La página de reportes de reparaciones carga pero no muestra datos (ingresos totales, estadísticas, etc.)

## Diagnóstico

### Paso 1: Verificar la Consola del Navegador
1. Abre la página de reportes: `/dashboard/repairs/reports`
2. Abre la consola del navegador (F12 → Console)
3. Busca los logs que empiezan con `[REPORTS]`
4. Anota cualquier error que aparezca

### Paso 2: Verificar Datos en la Base de Datos
Ejecuta este script en Supabase SQL Editor (reemplaza `TU_COMPANY_ID` con tu company_id real):

```sql
-- Obtener tu company_id
SELECT 
  p.id as user_id,
  p.company_id,
  cs.company_name
FROM profiles p
LEFT JOIN company_settings cs ON cs.company_id = p.company_id
WHERE p.id = auth.uid();

-- Verificar reparaciones (usa el company_id del query anterior)
SELECT 
  COUNT(*) as total,
  COUNT(CASE WHEN status = 'delivered' THEN 1 END) as entregadas,
  COUNT(CASE WHEN status NOT IN ('delivered', 'cancelled') THEN 1 END) as pendientes
FROM repair_orders
WHERE company_id = 'TU_COMPANY_ID';

-- Verificar items y pagos
SELECT 
  'Items' as tipo,
  COUNT(*) as cantidad,
  SUM(subtotal) as total
FROM repair_items ri
JOIN repair_orders ro ON ri.repair_order_id = ro.id
WHERE ro.company_id = 'TU_COMPANY_ID'
UNION ALL
SELECT 
  'Pagos' as tipo,
  COUNT(*) as cantidad,
  SUM(amount) as total
FROM repair_payments rp
JOIN repair_orders ro ON rp.repair_order_id = ro.id
WHERE ro.company_id = 'TU_COMPANY_ID';
```

## Posibles Causas y Soluciones

### Causa 1: No hay reparaciones en la base de datos
**Solución**: Crea al menos una reparación de prueba con estado "delivered" y algunos pagos.

### Causa 2: Problemas de permisos RLS
**Síntoma**: Los logs muestran errores de permisos o "permission denied"
**Solución**: Verificar políticas RLS en las tablas:
- `repair_orders`
- `repair_items`
- `repair_payments`
- `technicians`

### Causa 3: Company ID no se está cargando
**Síntoma**: Los logs muestran `[REPORTS] Company ID found: undefined` o similar
**Solución**: Verificar que el usuario tiene un `company_id` en la tabla `profiles`

### Causa 4: Funciones de reporte fallan silenciosamente
**Síntoma**: Los logs muestran `status: 'rejected'` para alguna función
**Solución**: Revisar el error específico en la consola y verificar la función correspondiente en `lib/actions/repair-reports.ts`

## Verificación de Funciones Individuales

Puedes probar cada función individualmente en la consola del navegador:

```javascript
// En la consola del navegador
import { getPendingRepairs } from '@/lib/actions/repair-reports'

// Reemplaza con tu company_id
const companyId = 'tu-company-id-aqui'

// Probar función
getPendingRepairs(companyId).then(console.log).catch(console.error)
```

## Logs Esperados

Si todo funciona correctamente, deberías ver en la consola:

```
[REPORTS] Loading company ID...
[REPORTS] User: [user-id]
[REPORTS] Profile data: { company_id: '[company-id]' } Error: null
[REPORTS] Company ID found: [company-id]
[REPORTS] Company settings: { company_name: 'Mi Empresa' } Error: null
[REPORTS] Starting to load reports for company: [company-id]
[REPORTS] Date range: undefined
[REPORTS] Calling all report functions...
[REPORTS] Results: { pending: 'fulfilled', technicians: 'fulfilled', status: 'fulfilled', profit: 'fulfilled', avgTime: 'fulfilled' }
[REPORTS] Data loaded: { pendingCount: X, technicianCount: Y, statusCount: Z, profitCount: W, avgTime: N }
[REPORTS] Loading complete
```

## Siguiente Paso

Una vez que identifiques el error específico en la consola, compártelo para poder dar una solución más precisa.
