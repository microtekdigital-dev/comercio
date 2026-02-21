# Documento de Diseño

## Resumen

Este documento describe el diseño técnico para agregar métricas de reparaciones al dashboard principal del sistema ERP. Las métricas incluirán el importe total de reparaciones completadas y un listado de las últimas reparaciones realizadas, visible únicamente para usuarios con plan Pro Reparaciones activo. Además, los ingresos por reparaciones se integrarán en las estadísticas financieras generales del dashboard.

## Arquitectura

### Componentes Principales

1. **RepairMetricsPanel** (Nuevo componente)
   - Componente React Server Component
   - Muestra métricas de reparaciones en el dashboard
   - Incluye importe total y listado de reparaciones

2. **getRepairMetrics** (Nueva acción)
   - Server action en `lib/actions/repair-metrics.ts`
   - Obtiene datos agregados de reparaciones completadas
   - Calcula importe total y obtiene últimas 5 reparaciones

3. **getFinancialStats** (Modificación)
   - Actualizar para incluir ingresos por reparaciones
   - Verificar si el módulo de reparaciones está activo
   - Sumar pagos de reparaciones a las estadísticas generales

4. **Dashboard Page** (Modificación)
   - Agregar `RepairMetricsPanel` condicionalmente
   - Verificar plan y módulo antes de renderizar

### Flujo de Datos

```
Dashboard Page
  ├─> Verificar plan Pro Reparaciones
  ├─> Si tiene acceso:
  │   └─> RepairMetricsPanel
  │       └─> getRepairMetrics()
  │           ├─> Obtener reparaciones completadas/entregadas
  │           ├─> Calcular importe total de pagos
  │           └─> Obtener últimas 5 reparaciones
  │
  └─> FinancialStatsPanel
      └─> getFinancialStats()
          ├─> Calcular ventas diarias
          ├─> Calcular saldo de caja
          ├─> Calcular cuentas por cobrar/pagar
          ├─> Calcular ganancia mensual
          └─> Si tiene módulo reparaciones:
              └─> Sumar ingresos por reparaciones
```

## Componentes e Interfaces

### 1. Tipos de Datos (lib/types/erp.ts)

```typescript
// Agregar a lib/types/erp.ts

export interface RepairMetrics {
  totalRevenue: number;
  completedCount: number;
  recentRepairs: RecentRepair[];
  currency: string;
}

export interface RecentRepair {
  id: string;
  order_number: number;
  customer_name: string;
  device_type: string;
  device_brand: string;
  device_model: string;
  delivered_date: string;
  total_amount: number;
}
```

### 2. Nueva Acción: getRepairMetrics

**Archivo**: `lib/actions/repair-metrics.ts`

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { canAccessRepairs } from '@/lib/utils/plan-limits'
import type { RepairMetrics, RecentRepair } from '@/lib/types/erp'

/**
 * Obtiene métricas de reparaciones para el dashboard
 * Solo para usuarios con plan Pro Reparaciones
 */
export async function getRepairMetrics(companyId: string): Promise<RepairMetrics | null> {
  // Verificar acceso al módulo de reparaciones
  const access = await canAccessRepairs(companyId)
  if (!access.allowed) {
    return null
  }

  const supabase = await createClient()

  try {
    // Obtener reparaciones completadas o entregadas
    const { data: repairs, error } = await supabase
      .from('repair_orders')
      .select(`
        id,
        order_number,
        delivered_date,
        labor_cost,
        customer:customers(name)
      `)
      .eq('company_id', companyId)
      .in('status', ['completed', 'delivered'])
      .order('delivered_date', { ascending: false })
      .limit(5)

    if (error) {
      console.error('Error fetching repair metrics:', error)
      return null
    }

    if (!repairs || repairs.length === 0) {
      return {
        totalRevenue: 0,
        completedCount: 0,
        recentRepairs: [],
        currency: 'ARS'
      }
    }

    // Obtener IDs de reparaciones para calcular totales
    const repairIds = repairs.map(r => r.id)

    // Obtener items (repuestos) de las reparaciones
    const { data: items } = await supabase
      .from('repair_items')
      .select('repair_order_id, subtotal')
      .in('repair_order_id', repairIds)

    // Obtener pagos de las reparaciones
    const { data: payments } = await supabase
      .from('repair_payments')
      .select('repair_order_id, amount')
      .in('repair_order_id', repairIds)

    // Calcular totales por reparación
    const itemsByRepair = (items || []).reduce((acc, item) => {
      if (!acc[item.repair_order_id]) acc[item.repair_order_id] = 0
      acc[item.repair_order_id] += item.subtotal
      return acc
    }, {} as Record<string, number>)

    const paymentsByRepair = (payments || []).reduce((acc, payment) => {
      if (!acc[payment.repair_order_id]) acc[payment.repair_order_id] = 0
      acc[payment.repair_order_id] += payment.amount
      return acc
    }, {} as Record<string, number>)

    // Obtener información completa de dispositivos
    const { data: fullRepairs } = await supabase
      .from('repair_orders')
      .select('id, device_type, brand, model')
      .in('id', repairIds)

    const deviceInfo = (fullRepairs || []).reduce((acc, repair) => {
      acc[repair.id] = {
        device_type: repair.device_type,
        brand: repair.brand,
        model: repair.model
      }
      return acc
    }, {} as Record<string, any>)

    // Construir listado de reparaciones recientes
    const recentRepairs: RecentRepair[] = repairs.map(repair => {
      const partsTotal = itemsByRepair[repair.id] || 0
      const laborCost = repair.labor_cost || 0
      const totalAmount = paymentsByRepair[repair.id] || (partsTotal + laborCost)
      const device = deviceInfo[repair.id] || {}

      return {
        id: repair.id,
        order_number: repair.order_number,
        customer_name: (repair.customer as any)?.name || 'Sin nombre',
        device_type: device.device_type || '',
        device_brand: device.brand || '',
        device_model: device.model || '',
        delivered_date: repair.delivered_date || '',
        total_amount: totalAmount
      }
    })

    // Calcular importe total de todas las reparaciones completadas
    const { data: allCompletedRepairs } = await supabase
      .from('repair_orders')
      .select('id')
      .eq('company_id', companyId)
      .in('status', ['completed', 'delivered'])

    const allRepairIds = (allCompletedRepairs || []).map(r => r.id)
    
    let totalRevenue = 0
    if (allRepairIds.length > 0) {
      const { data: allPayments } = await supabase
        .from('repair_payments')
        .select('amount')
        .in('repair_order_id', allRepairIds)

      totalRevenue = (allPayments || []).reduce((sum, p) => sum + p.amount, 0)
    }

    return {
      totalRevenue,
      completedCount: allRepairIds.length,
      recentRepairs,
      currency: 'ARS'
    }
  } catch (error) {
    console.error('Error calculating repair metrics:', error)
    return null
  }
}
```

### 3. Modificación: getFinancialStats

**Archivo**: `lib/actions/financial-stats.ts`

Agregar función auxiliar para calcular ingresos por reparaciones:

```typescript
/**
 * Calcula los ingresos totales por reparaciones completadas del mes actual
 */
async function calculateRepairsRevenue(companyId: string): Promise<number> {
  const supabase = await createClient()
  
  try {
    // Verificar si tiene acceso al módulo de reparaciones
    const { canAccessRepairs } = await import('@/lib/utils/plan-limits')
    const access = await canAccessRepairs(companyId)
    if (!access.allowed) {
      return 0
    }

    // Obtener inicio y fin del mes actual
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString()

    // Obtener reparaciones completadas del mes
    const { data: repairs, error } = await supabase
      .from('repair_orders')
      .select('id')
      .eq('company_id', companyId)
      .in('status', ['completed', 'delivered'])
      .gte('delivered_date', startOfMonth)
      .lte('delivered_date', endOfMonth)

    if (error || !repairs || repairs.length === 0) {
      return 0
    }

    const repairIds = repairs.map(r => r.id)

    // Obtener pagos de esas reparaciones
    const { data: payments } = await supabase
      .from('repair_payments')
      .select('amount')
      .in('repair_order_id', repairIds)

    return (payments || []).reduce((sum, payment) => sum + payment.amount, 0)
  } catch (error) {
    console.error('Error calculating repairs revenue:', error)
    return 0
  }
}
```

Modificar `getFinancialStats` para incluir reparaciones:

```typescript
export async function getFinancialStats(): Promise<FinancialStats | null> {
  // ... código existente ...

  // Calcular todas las métricas en paralelo (agregar repairsRevenue)
  const [dailySales, currentCashBalance, accountsReceivable, accountsPayable, monthlyProfit, repairsRevenue] = await Promise.all([
    calculateDailySales(profile.company_id),
    calculateCurrentCashBalance(profile.company_id),
    calculateAccountsReceivable(profile.company_id),
    calculateAccountsPayable(profile.company_id),
    calculateMonthlyProfit(profile.company_id),
    calculateRepairsRevenue(profile.company_id), // NUEVO
  ])

  return {
    dailySales: dailySales + repairsRevenue, // Sumar reparaciones a ventas diarias
    currentCashBalance,
    accountsReceivable,
    accountsPayable,
    monthlyProfit: monthlyProfit + repairsRevenue, // Sumar reparaciones a ganancia mensual
    currency,
    lastUpdated: new Date(),
  }
}
```

### 4. Nuevo Componente: RepairMetricsPanel

**Archivo**: `components/dashboard/repair-metrics-panel.tsx`

```typescript
import { getRepairMetrics } from "@/lib/actions/repair-metrics"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Wrench, TrendingUp, Clock } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

export async function RepairMetricsPanel({ companyId }: { companyId: string }) {
  const metrics = await getRepairMetrics(companyId)

  if (!metrics) {
    return null // No mostrar nada si no tiene acceso
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: metrics.currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: es
      })
    } catch {
      return dateString
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg md:text-xl font-semibold">Reparaciones</h2>
        <Link 
          href="/dashboard/repairs" 
          className="text-sm text-primary hover:underline"
        >
          Ver todas
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Importe Total */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ingresos por Reparaciones
            </CardTitle>
            <div className="p-2 rounded-lg bg-green-50">
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(metrics.totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.completedCount} reparaciones completadas
            </p>
          </CardContent>
        </Card>

        {/* Reparaciones Recientes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Últimas Reparaciones
            </CardTitle>
            <div className="p-2 rounded-lg bg-blue-50">
              <Wrench className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            {metrics.recentRepairs.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No hay reparaciones completadas
              </p>
            ) : (
              <div className="space-y-3">
                {metrics.recentRepairs.map((repair) => (
                  <Link
                    key={repair.id}
                    href={`/dashboard/repairs/${repair.id}`}
                    className="block hover:bg-accent rounded-lg p-2 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          #{repair.order_number} - {repair.customer_name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {repair.device_brand} {repair.device_model}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">
                            {formatDate(repair.delivered_date)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-green-600">
                          {formatCurrency(repair.total_amount)}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
```

### 5. Modificación: Dashboard Page

**Archivo**: `app/dashboard/page.tsx`

```typescript
import { RepairMetricsPanel } from "@/components/dashboard/repair-metrics-panel"
import { canAccessRepairs } from "@/lib/utils/plan-limits"

export default async function DashboardPage() {
  const user = await getCurrentUser()
  // ... código existente ...

  // Verificar acceso a reparaciones
  const repairsAccess = user?.companies?.id 
    ? await canAccessRepairs(user.companies.id)
    : { allowed: false }

  return (
    <div className="p-4 md:p-8 space-y-4 md:space-y-8">
      {/* ... código existente ... */}

      {/* Financial Statistics Panel */}
      <Suspense fallback={<FinancialStatsLoading />}>
        <FinancialStatsPanel />
      </Suspense>

      {/* Repair Metrics Panel - Solo si tiene acceso */}
      {repairsAccess.allowed && user?.companies?.id && (
        <Suspense fallback={<RepairMetricsLoading />}>
          <RepairMetricsPanel companyId={user.companies.id} />
        </Suspense>
      )}

      {/* ERP Statistics */}
      <Suspense fallback={<StatsLoading />}>
        <ERPStats />
      </Suspense>

      {/* ... resto del código ... */}
    </div>
  )
}

function RepairMetricsLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-5 w-32" />
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="space-y-0 pb-2">
            <Skeleton className="h-4 w-40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-3 w-40 mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="space-y-0 pb-2">
            <Skeleton className="h-4 w-40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
```

## Modelos de Datos

### Tablas Existentes Utilizadas

1. **repair_orders**
   - `id`: UUID (PK)
   - `company_id`: UUID (FK)
   - `order_number`: INTEGER
   - `customer_id`: UUID (FK)
   - `device_type`: TEXT
   - `brand`: TEXT
   - `model`: TEXT
   - `status`: TEXT
   - `delivered_date`: TIMESTAMP
   - `labor_cost`: NUMERIC

2. **repair_items**
   - `id`: UUID (PK)
   - `repair_order_id`: UUID (FK)
   - `product_id`: UUID (FK)
   - `quantity`: INTEGER
   - `unit_price`: NUMERIC
   - `subtotal`: NUMERIC

3. **repair_payments**
   - `id`: UUID (PK)
   - `repair_order_id`: UUID (FK)
   - `company_id`: UUID (FK)
   - `amount`: NUMERIC
   - `payment_method`: TEXT
   - `payment_date`: TIMESTAMP

4. **customers**
   - `id`: UUID (PK)
   - `company_id`: UUID (FK)
   - `name`: TEXT

No se requieren cambios en el esquema de base de datos.

## Propiedades de Corrección

*Una propiedad es una característica o comportamiento que debe mantenerse verdadero en todas las ejecuciones válidas del sistema - esencialmente, una declaración formal sobre lo que el sistema debe hacer. Las propiedades sirven como puente entre las especificaciones legibles por humanos y las garantías de corrección verificables por máquina.*


### Propiedades de Corrección

**Propiedad 1: Visibilidad del panel basada en plan y módulo**
*Para cualquier* usuario y estado de suscripción, el panel de métricas de reparaciones debe mostrarse si y solo si el usuario tiene plan Pro Reparaciones con el módulo activo
**Valida: Requisitos 1.1, 1.4, 3.1, 3.2, 3.3**

**Propiedad 2: Filtrado correcto de estados de reparación**
*Para cualquier* conjunto de órdenes de reparación con diferentes estados, el cálculo de importe total y el listado deben incluir únicamente órdenes con estado 'completed' o 'delivered'
**Valida: Requisitos 1.2, 2.2**

**Propiedad 3: Información completa en cada reparación**
*Para cualquier* reparación incluida en el listado, debe contener número de orden, nombre de cliente, tipo de dispositivo, marca, modelo, fecha de entrega y monto total
**Valida: Requisitos 2.3**

**Propiedad 4: Ordenamiento por fecha descendente**
*Para cualquier* conjunto de reparaciones completadas, el listado debe estar ordenado por fecha de entrega en orden descendente (más recientes primero)
**Valida: Requisitos 2.4**

**Propiedad 5: Límite de reparaciones en el listado**
*Para cualquier* conjunto de reparaciones completadas, el listado debe contener como máximo 5 elementos, independientemente de cuántas reparaciones existan
**Valida: Requisitos 2.5**

**Propiedad 6: Filtrado por empresa**
*Para cualquier* empresa, las métricas de reparaciones deben incluir únicamente datos de órdenes pertenecientes a esa empresa específica
**Valida: Requisitos 4.3**

**Propiedad 7: Manejo de errores sin afectar dashboard**
*Para cualquier* error que ocurra al cargar métricas de reparaciones, el resto del dashboard debe continuar funcionando normalmente sin fallos
**Valida: Requisitos 4.5**

**Propiedad 8: Integración de ingresos por reparaciones**
*Para cualquier* empresa con módulo de reparaciones activo, las estadísticas financieras generales (ventas diarias y ganancia mensual) deben incluir la suma de pagos de reparaciones completadas del período correspondiente
**Valida: Requisitos 5.1, 5.2, 5.3**

**Propiedad 9: Separación de métricas**
*Para cualquier* empresa con módulo de reparaciones activo, deben existir tanto métricas específicas de reparaciones (panel separado) como métricas generales (estadísticas financieras), y ambas deben mostrar datos correctos de forma independiente
**Valida: Requisitos 5.4**

**Propiedad 10: Exclusión de reparaciones cuando módulo inactivo**
*Para cualquier* empresa sin módulo de reparaciones activo, las estadísticas financieras generales deben calcularse únicamente con datos de ventas, excluyendo completamente los pagos de reparaciones
**Valida: Requisitos 5.5**

## Manejo de Errores

### Estrategias de Manejo de Errores

1. **Error al verificar acceso al módulo**
   - Retornar `null` desde `getRepairMetrics`
   - El componente no se renderiza
   - No afecta el resto del dashboard

2. **Error al obtener datos de reparaciones**
   - Capturar error en try-catch
   - Registrar en console.error
   - Retornar objeto con valores en cero
   - Mostrar mensaje "No se pudieron cargar las métricas"

3. **Error al calcular ingresos por reparaciones en estadísticas financieras**
   - Capturar error en try-catch
   - Registrar en console.error
   - Retornar 0 para no afectar otros cálculos
   - Las estadísticas financieras continúan mostrándose sin datos de reparaciones

4. **Error de permisos (RLS)**
   - Supabase retorna error automáticamente
   - Capturar y manejar como "sin datos"
   - No exponer detalles de seguridad al usuario

### Validaciones

1. **Validación de plan y módulo**
   - Verificar con `canAccessRepairs()` antes de cualquier operación
   - Retornar `null` si no tiene acceso
   - No ejecutar queries innecesarias

2. **Validación de datos**
   - Verificar que `companyId` existe antes de queries
   - Manejar arrays vacíos correctamente
   - Usar valores por defecto seguros (0, [], etc.)

3. **Validación de fechas**
   - Usar try-catch al formatear fechas
   - Retornar fecha original si falla el formateo
   - No fallar por problemas de formato

## Estrategia de Testing

### Testing Dual: Unit Tests y Property-Based Tests

El sistema utilizará dos enfoques complementarios de testing:

1. **Unit Tests**: Para casos específicos, ejemplos concretos y casos borde
2. **Property-Based Tests**: Para verificar propiedades universales con datos generados aleatoriamente

### Unit Tests

Los unit tests se enfocarán en:

**Casos específicos**:
- Usuario con plan Pro Reparaciones ve el panel
- Usuario sin plan Pro no ve el panel
- Empresa sin reparaciones muestra importe cero
- Error al cargar métricas no rompe el dashboard

**Casos borde**:
- Exactamente 5 reparaciones en el listado
- Más de 5 reparaciones (debe mostrar solo 5)
- Reparaciones sin pagos registrados
- Fechas de entrega nulas o inválidas

**Integración**:
- Verificar que `getRepairMetrics` llama a Supabase correctamente
- Verificar que `getFinancialStats` incluye reparaciones cuando corresponde
- Verificar que el componente renderiza correctamente con datos reales

### Property-Based Tests

Los property tests verificarán las propiedades universales con mínimo 100 iteraciones cada uno:

**Configuración**:
- Librería: `@fast-check/jest` (para TypeScript/JavaScript)
- Iteraciones mínimas: 100 por test
- Tags: Cada test debe referenciar su propiedad del diseño

**Tests a implementar**:

1. **Test de Propiedad 1**: Visibilidad del panel
   - Generar: Estados aleatorios de usuario (plan, módulo activo/inactivo)
   - Verificar: Panel visible ↔ (plan Pro Reparaciones AND módulo activo)
   - Tag: `Feature: panel-metricas-reparaciones, Property 1: Visibilidad del panel basada en plan y módulo`

2. **Test de Propiedad 2**: Filtrado de estados
   - Generar: Conjuntos aleatorios de órdenes con diferentes estados
   - Verificar: Resultado solo contiene estados 'completed' o 'delivered'
   - Tag: `Feature: panel-metricas-reparaciones, Property 2: Filtrado correcto de estados de reparación`

3. **Test de Propiedad 3**: Información completa
   - Generar: Reparaciones aleatorias con diferentes datos
   - Verificar: Cada elemento del listado contiene todos los campos requeridos
   - Tag: `Feature: panel-metricas-reparaciones, Property 3: Información completa en cada reparación`

4. **Test de Propiedad 4**: Ordenamiento
   - Generar: Conjuntos aleatorios de reparaciones con fechas diferentes
   - Verificar: Resultado ordenado por fecha descendente
   - Tag: `Feature: panel-metricas-reparaciones, Property 4: Ordenamiento por fecha descendente`

5. **Test de Propiedad 5**: Límite de listado
   - Generar: Conjuntos con 0 a 20 reparaciones aleatorias
   - Verificar: Resultado contiene máximo 5 elementos
   - Tag: `Feature: panel-metricas-reparaciones, Property 5: Límite de reparaciones en el listado`

6. **Test de Propiedad 6**: Filtrado por empresa
   - Generar: Datos de múltiples empresas aleatorias
   - Verificar: Resultado solo contiene datos de la empresa solicitada
   - Tag: `Feature: panel-metricas-reparaciones, Property 6: Filtrado por empresa`

7. **Test de Propiedad 8**: Integración financiera
   - Generar: Conjuntos aleatorios de ventas y reparaciones
   - Verificar: Estadísticas financieras = ventas + reparaciones
   - Tag: `Feature: panel-metricas-reparaciones, Property 8: Integración de ingresos por reparaciones`

8. **Test de Propiedad 10**: Exclusión cuando inactivo
   - Generar: Datos con módulo activo/inactivo
   - Verificar: Si inactivo, estadísticas = solo ventas (sin reparaciones)
   - Tag: `Feature: panel-metricas-reparaciones, Property 10: Exclusión de reparaciones cuando módulo inactivo`

### Balance de Testing

- **Unit tests**: ~15-20 tests para casos específicos y bordes
- **Property tests**: 8 tests con 100+ iteraciones cada uno = 800+ casos generados
- Los property tests cubren la mayoría de los casos, los unit tests se enfocan en ejemplos concretos y casos borde específicos

### Herramientas

- **Framework de testing**: Jest
- **Property-based testing**: @fast-check/jest
- **Mocking**: jest.mock() para Supabase y funciones de plan
- **Cobertura**: Objetivo 80%+ en funciones críticas

## Consideraciones de Rendimiento

### Optimizaciones

1. **Queries eficientes**
   - Usar `.limit(5)` en la query de reparaciones recientes
   - Seleccionar solo campos necesarios con `select()`
   - Usar índices existentes en `status` y `delivered_date`

2. **Caching**
   - React Server Components cachea automáticamente
   - Usar `Suspense` para loading states
   - No requiere caching adicional en servidor

3. **Queries paralelas**
   - Usar `Promise.all()` para ejecutar queries en paralelo
   - Calcular métricas de forma independiente
   - No bloquear el dashboard si falla una métrica

### Escalabilidad

1. **Volumen de datos**
   - Query de importe total puede ser costosa con muchas reparaciones
   - Considerar agregar índice compuesto en `(company_id, status, delivered_date)`
   - Limitar listado a 5 elementos reduce carga

2. **Concurrencia**
   - Queries de solo lectura no generan locks
   - RLS de Supabase maneja seguridad automáticamente
   - No hay escrituras en esta funcionalidad

## Seguridad

### Row Level Security (RLS)

Todas las tablas ya tienen RLS configurado:

1. **repair_orders**: Filtrado automático por `company_id`
2. **repair_items**: Filtrado a través de `repair_order_id`
3. **repair_payments**: Filtrado automático por `company_id`
4. **customers**: Filtrado automático por `company_id`

### Validación de Acceso

1. **Verificación de plan**
   - Usar `canAccessRepairs()` antes de cualquier operación
   - No exponer datos si no tiene acceso
   - Retornar `null` en lugar de error

2. **Validación de empresa**
   - Todas las queries filtran por `company_id`
   - RLS garantiza que solo ve datos de su empresa
   - No es posible acceder a datos de otras empresas

### Datos Sensibles

1. **Información de clientes**
   - Solo mostrar nombre del cliente
   - No exponer datos de contacto en el listado
   - Detalles completos solo en página individual

2. **Información financiera**
   - Montos visibles solo para usuarios autenticados
   - Filtrado por empresa garantizado por RLS
   - No hay endpoints públicos

## Dependencias

### Librerías Externas

1. **date-fns**: Para formateo de fechas relativas
   - `formatDistanceToNow`: Mostrar "hace 2 días"
   - `es`: Locale en español

2. **lucide-react**: Iconos
   - `Wrench`: Icono de reparaciones
   - `TrendingUp`: Icono de ingresos
   - `Clock`: Icono de tiempo

3. **@fast-check/jest**: Property-based testing
   - Generación de datos aleatorios
   - Verificación de propiedades universales

### Módulos Internos

1. **lib/actions/repair-orders.ts**: Acciones existentes de reparaciones
2. **lib/actions/repair-reports.ts**: Reportes existentes de reparaciones
3. **lib/actions/financial-stats.ts**: Estadísticas financieras (modificar)
4. **lib/utils/plan-limits.ts**: Verificación de planes (usar `canAccessRepairs`)
5. **lib/types/erp.ts**: Tipos de datos (agregar nuevos tipos)

## Migración y Despliegue

### Pasos de Despliegue

1. **Fase 1: Backend**
   - Agregar tipos a `lib/types/erp.ts`
   - Crear `lib/actions/repair-metrics.ts`
   - Modificar `lib/actions/financial-stats.ts`
   - Ejecutar tests

2. **Fase 2: Frontend**
   - Crear `components/dashboard/repair-metrics-panel.tsx`
   - Modificar `app/dashboard/page.tsx`
   - Verificar estilos y responsive

3. **Fase 3: Testing**
   - Ejecutar unit tests
   - Ejecutar property-based tests
   - Testing manual en diferentes planes

4. **Fase 4: Producción**
   - Deploy a staging
   - Verificar con datos reales
   - Deploy a producción
   - Monitorear errores

### Rollback

Si es necesario revertir:

1. Remover `RepairMetricsPanel` del dashboard
2. Revertir cambios en `getFinancialStats`
3. No requiere cambios en base de datos
4. No afecta funcionalidad existente

### Compatibilidad

- **Backward compatible**: No rompe funcionalidad existente
- **Sin cambios de schema**: No requiere migraciones de BD
- **Opcional**: Solo visible para usuarios con plan correcto
- **Degradación elegante**: Si falla, no afecta el resto del dashboard
