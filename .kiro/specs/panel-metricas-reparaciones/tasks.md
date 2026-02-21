# Plan de Implementación: Panel de Métricas de Reparaciones

## Resumen

Este plan implementa el panel de métricas de reparaciones en el dashboard principal, mostrando el importe total de reparaciones completadas y un listado de las últimas 5 reparaciones. Además, integra los ingresos por reparaciones en las estadísticas financieras generales del sistema.

## Tareas

- [x] 1. Agregar tipos de datos para métricas de reparaciones
  - Agregar interfaces `RepairMetrics` y `RecentRepair` a `lib/types/erp.ts`
  - Incluir campos: totalRevenue, completedCount, recentRepairs, currency
  - Incluir campos de RecentRepair: id, order_number, customer_name, device_type, device_brand, device_model, delivered_date, total_amount
  - _Requisitos: 1.1, 2.3_

- [ ] 2. Implementar acción getRepairMetrics
  - [x] 2.1 Crear archivo `lib/actions/repair-metrics.ts` con función `getRepairMetrics`
    - Verificar acceso con `canAccessRepairs()`
    - Obtener reparaciones completadas/entregadas ordenadas por fecha descendente
    - Limitar a 5 reparaciones más recientes
    - Calcular importe total de todas las reparaciones completadas
    - Obtener información de items y pagos para cada reparación
    - Retornar objeto `RepairMetrics` o `null` si no tiene acceso
    - _Requisitos: 1.1, 1.2, 2.2, 2.4, 2.5, 4.3_

  - [ ]* 2.2 Escribir property test para filtrado de estados
    - **Propiedad 2: Filtrado correcto de estados de reparación**
    - **Valida: Requisitos 1.2, 2.2**

  - [ ]* 2.3 Escribir property test para ordenamiento
    - **Propiedad 4: Ordenamiento por fecha descendente**
    - **Valida: Requisitos 2.4**

  - [ ]* 2.4 Escribir property test para límite de listado
    - **Propiedad 5: Límite de reparaciones en el listado**
    - **Valida: Requisitos 2.5**

  - [ ]* 2.5 Escribir property test para filtrado por empresa
    - **Propiedad 6: Filtrado por empresa**
    - **Valida: Requisitos 4.3**

  - [ ]* 2.6 Escribir unit tests para casos borde
    - Empresa sin reparaciones completadas (debe retornar importe 0)
    - Reparaciones sin pagos registrados
    - Error al obtener datos (debe retornar null)
    - _Requisitos: 1.3, 4.5_

- [ ] 3. Checkpoint - Verificar acción de métricas
  - Asegurar que todos los tests pasan
  - Verificar que la acción retorna datos correctos
  - Preguntar al usuario si hay dudas

- [ ] 4. Modificar estadísticas financieras para incluir reparaciones
  - [x] 4.1 Agregar función `calculateRepairsRevenue` en `lib/actions/financial-stats.ts`
    - Verificar acceso con `canAccessRepairs()`
    - Obtener reparaciones completadas/entregadas del mes actual
    - Sumar pagos de esas reparaciones
    - Retornar 0 si no tiene acceso o si hay error
    - _Requisitos: 5.1, 5.5_

  - [x] 4.2 Modificar función `getFinancialStats` para incluir ingresos por reparaciones
    - Agregar `calculateRepairsRevenue()` al Promise.all
    - Sumar repairsRevenue a dailySales
    - Sumar repairsRevenue a monthlyProfit
    - _Requisitos: 5.1, 5.2, 5.3_

  - [ ]* 4.3 Escribir property test para integración financiera
    - **Propiedad 8: Integración de ingresos por reparaciones**
    - **Valida: Requisitos 5.1, 5.2, 5.3**

  - [ ]* 4.4 Escribir property test para exclusión cuando módulo inactivo
    - **Propiedad 10: Exclusión de reparaciones cuando módulo inactivo**
    - **Valida: Requisitos 5.5**

  - [ ]* 4.5 Escribir unit tests para estadísticas financieras
    - Verificar que reparaciones se suman correctamente a ventas diarias
    - Verificar que reparaciones se suman a ganancia mensual
    - Verificar que sin módulo activo no se incluyen reparaciones
    - _Requisitos: 5.1, 5.2, 5.3, 5.5_

- [ ] 5. Crear componente RepairMetricsPanel
  - [x] 5.1 Crear archivo `components/dashboard/repair-metrics-panel.tsx`
    - Implementar como React Server Component
    - Llamar a `getRepairMetrics()` con companyId
    - Retornar null si no hay métricas (sin acceso)
    - Mostrar card con importe total de reparaciones
    - Mostrar card con listado de últimas 5 reparaciones
    - Formatear montos con Intl.NumberFormat
    - Formatear fechas con date-fns (formatDistanceToNow)
    - Agregar link "Ver todas" a /dashboard/repairs
    - Agregar links individuales a cada reparación
    - Usar iconos de lucide-react (Wrench, TrendingUp, Clock)
    - _Requisitos: 1.1, 1.5, 2.1, 2.3, 2.6_

  - [ ]* 5.2 Escribir property test para información completa
    - **Propiedad 3: Información completa en cada reparación**
    - **Valida: Requisitos 2.3**

  - [ ]* 5.3 Escribir unit tests para componente
    - Verificar que no renderiza si no tiene acceso
    - Verificar que muestra mensaje cuando no hay reparaciones
    - Verificar que formatea montos correctamente
    - Verificar que formatea fechas correctamente
    - _Requisitos: 1.4, 3.1, 3.2_

- [ ] 6. Integrar panel en el dashboard principal
  - [x] 6.1 Modificar `app/dashboard/page.tsx`
    - Importar `RepairMetricsPanel` y `canAccessRepairs`
    - Verificar acceso con `canAccessRepairs(user.companies.id)`
    - Agregar `RepairMetricsPanel` condicionalmente después de `FinancialStatsPanel`
    - Envolver en `Suspense` con skeleton de loading
    - Crear función `RepairMetricsLoading` para skeleton
    - _Requisitos: 1.1, 1.4, 3.3, 3.4_

  - [ ]* 6.2 Escribir property test para visibilidad del panel
    - **Propiedad 1: Visibilidad del panel basada en plan y módulo**
    - **Valida: Requisitos 1.1, 1.4, 3.1, 3.2, 3.3**

  - [ ]* 6.3 Escribir property test para manejo de errores
    - **Propiedad 7: Manejo de errores sin afectar dashboard**
    - **Valida: Requisitos 4.5**

  - [ ]* 6.4 Escribir unit tests de integración
    - Verificar que dashboard carga correctamente con panel de reparaciones
    - Verificar que dashboard carga correctamente sin panel (sin acceso)
    - Verificar que error en métricas no rompe dashboard
    - _Requisitos: 4.5_

- [ ] 7. Checkpoint final - Verificar integración completa
  - Asegurar que todos los tests pasan (unit y property)
  - Verificar visualmente en diferentes planes (con/sin acceso)
  - Verificar que estadísticas financieras incluyen reparaciones
  - Verificar responsive en mobile
  - Preguntar al usuario si hay dudas

- [ ] 8. Documentación y limpieza
  - Agregar comentarios JSDoc a funciones públicas
  - Verificar que no hay console.logs innecesarios
  - Actualizar README si es necesario
  - _Requisitos: 4.1, 4.2_

## Notas

- Las tareas marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido
- Cada property test debe configurarse con mínimo 100 iteraciones
- Los tests deben incluir tags que referencien las propiedades del diseño
- La implementación es backward compatible y no requiere migraciones de BD
- Si ocurre un error al cargar métricas, el dashboard debe continuar funcionando normalmente
