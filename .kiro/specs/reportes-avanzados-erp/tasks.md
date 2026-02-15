# Tasks: Reportes Avanzados ERP

## 1. Configuración Inicial

- [ ] 1.1 Crear estructura de carpetas para reportes avanzados
- [ ] 1.2 Agregar funciones de verificación de acceso a plan-limits.ts
- [ ] 1.3 Crear interfaces TypeScript en lib/types/reports.ts

## 2. Reporte de Liquidación de Inventario Avanzado

- [ ] 2.1 Crear lib/actions/inventory-liquidation-advanced.ts
  - [ ] 2.1.1 Implementar getAdvancedInventoryLiquidation()
  - [ ] 2.1.2 Implementar getInventoryTurnoverAnalysis()
  - [ ] 2.1.3 Implementar compareInventoryPeriods()
- [ ] 2.2 Crear componente AdvancedInventoryFilters
  - [ ] 2.2.1 Filtros por múltiples categorías
  - [ ] 2.2.2 Filtros por proveedores
  - [ ] 2.2.3 Presets de fechas (hoy, semana, mes, trimestre, año)
  - [ ] 2.2.4 Opciones de agrupación
- [ ] 2.3 Mejorar componente InventoryLiquidationReport
  - [ ] 2.3.1 Agregar métricas de rotación de inventario
  - [ ] 2.3.2 Agregar sección de productos top/slow movers
  - [ ] 2.3.3 Agregar subtotales por agrupación
  - [ ] 2.3.4 Agregar comparativa entre períodos
- [ ] 2.4 Crear gráficos de inventario
  - [ ] 2.4.1 Gráfico de rotación de inventario
  - [ ] 2.4.2 Gráfico de márgenes de ganancia
  - [ ] 2.4.3 Gráfico de movimientos por categoría
- [ ] 2.5 Mejorar exportación a Excel
  - [ ] 2.5.1 Agregar hoja de resumen
  - [ ] 2.5.2 Agregar hoja de detalle por producto
  - [ ] 2.5.3 Agregar hoja de gráficos
  - [ ] 2.5.4 Aplicar formato profesional

## 3. Reporte de Liquidación de Cuentas Avanzado

- [ ] 3.1 Crear lib/actions/accounts-settlement-advanced.ts
  - [ ] 3.1.1 Implementar getAdvancedAccountsSettlement()
  - [ ] 3.1.2 Implementar getAgingAnalysis()
  - [ ] 3.1.3 Implementar getCashFlowProjection()
- [ ] 3.2 Crear componente AdvancedAccountsFilters
  - [ ] 3.2.1 Filtros por tipo de entidad
  - [ ] 3.2.2 Filtros por estado (al día, vencido, próximo a vencer)
  - [ ] 3.2.3 Filtros por rango de montos
  - [ ] 3.2.4 Búsqueda por nombre
- [ ] 3.3 Mejorar componente AccountsSettlementReport
  - [ ] 3.3.1 Agregar análisis de antigüedad de saldos
  - [ ] 3.3.2 Agregar proyección de flujo de caja
  - [ ] 3.3.3 Agregar alertas de cuentas vencidas
  - [ ] 3.3.4 Agregar desglose individual por entidad
- [ ] 3.4 Crear gráficos de cuentas
  - [ ] 3.4.1 Gráfico de antigüedad de saldos
  - [ ] 3.4.2 Gráfico de distribución de deudas
  - [ ] 3.4.3 Gráfico de proyección de flujo de caja
  - [ ] 3.4.4 Gráfico de tendencia de pagos/cobros
- [ ] 3.5 Mejorar exportación a Excel
  - [ ] 3.5.1 Agregar hoja de resumen consolidado
  - [ ] 3.5.2 Agregar hoja de cuentas por cobrar
  - [ ] 3.5.3 Agregar hoja de cuentas por pagar
  - [ ] 3.5.4 Agregar hoja de análisis de antigüedad

## 4. Reporte de Estado de Caja Avanzado

- [ ] 4.1 Crear lib/actions/cash-status-advanced.ts
  - [ ] 4.1.1 Implementar getAdvancedCashStatus()
  - [ ] 4.1.2 Implementar getCashTrends()
  - [ ] 4.1.3 Implementar compareCashPeriods()
- [ ] 4.2 Crear componente AdvancedCashFilters
  - [ ] 4.2.1 Filtros por rango de fechas
  - [ ] 4.2.2 Filtros por turno
  - [ ] 4.2.3 Filtros por usuario
  - [ ] 4.2.4 Opciones de agrupación (diario, semanal, mensual)
- [ ] 4.3 Crear componente CashStatusReport
  - [ ] 4.3.1 Resumen diario con comparativa
  - [ ] 4.3.2 Historial de aperturas y cierres
  - [ ] 4.3.3 Análisis de diferencias de caja
  - [ ] 4.3.4 Distribución por método de pago
- [ ] 4.4 Crear gráficos de caja
  - [ ] 4.4.1 Gráfico de evolución de caja
  - [ ] 4.4.2 Gráfico de comparativa entre turnos
  - [ ] 4.4.3 Gráfico de distribución por método de pago
  - [ ] 4.4.4 Gráfico de diferencias acumuladas
- [ ] 4.5 Crear exportación a Excel
  - [ ] 4.5.1 Agregar hoja de resumen
  - [ ] 4.5.2 Agregar hoja de detalle diario
  - [ ] 4.5.3 Agregar hoja de análisis por turno
  - [ ] 4.5.4 Agregar hoja de gráficos

## 5. Reporte de Cuentas Corrientes Avanzado

- [ ] 5.1 Crear lib/actions/current-accounts-advanced.ts
  - [ ] 5.1.1 Implementar getCurrentAccountReport()
  - [ ] 5.1.2 Implementar getAllCurrentAccounts()
  - [ ] 5.1.3 Implementar sendAccountStatement()
- [ ] 5.2 Crear componente CurrentAccountsFilters
  - [ ] 5.2.1 Filtros por tipo de entidad
  - [ ] 5.2.2 Filtros por rango de saldos
  - [ ] 5.2.3 Filtros por estado
  - [ ] 5.2.4 Búsqueda por nombre o documento
- [ ] 5.3 Crear componente CurrentAccountReport
  - [ ] 5.3.1 Vista unificada de clientes y proveedores
  - [ ] 5.3.2 Detalle de movimientos por entidad
  - [ ] 5.3.3 Historial completo de transacciones
  - [ ] 5.3.4 Métricas de pago (días promedio, score)
- [ ] 5.4 Crear gráficos de cuentas corrientes
  - [ ] 5.4.1 Gráfico de evolución de saldo
  - [ ] 5.4.2 Gráfico de distribución de movimientos
  - [ ] 5.4.3 Gráfico de comparativa de entidades
- [ ] 5.5 Crear exportación a Excel
  - [ ] 5.5.1 Agregar hoja de resumen
  - [ ] 5.5.2 Agregar hoja de movimientos
  - [ ] 5.5.3 Agregar hoja de métricas
- [ ] 5.6 Implementar envío de estado de cuenta por email
  - [ ] 5.6.1 Crear template de email
  - [ ] 5.6.2 Generar PDF del estado de cuenta
  - [ ] 5.6.3 Implementar función de envío

## 6. Componentes Compartidos

- [ ] 6.1 Crear componente DateRangePresets
  - [ ] 6.1.1 Preset: Hoy
  - [ ] 6.1.2 Preset: Esta semana
  - [ ] 6.1.3 Preset: Este mes
  - [ ] 6.1.4 Preset: Este trimestre
  - [ ] 6.1.5 Preset: Este año
  - [ ] 6.1.6 Preset: Personalizado
- [ ] 6.2 Crear componente ReportSkeleton
- [ ] 6.3 Crear componente ExportButton
  - [ ] 6.3.1 Opción: Exportar a Excel
  - [ ] 6.3.2 Opción: Exportar a PDF
  - [ ] 6.3.3 Opción: Imprimir
- [ ] 6.4 Crear componente ReportHeader
  - [ ] 6.4.1 Logo de empresa
  - [ ] 6.4.2 Nombre de reporte
  - [ ] 6.4.3 Período seleccionado
  - [ ] 6.4.4 Fecha de generación

## 7. Utilidades de Exportación

- [ ] 7.1 Crear lib/utils/excel-export-advanced.ts
  - [ ] 7.1.1 Función: exportInventoryLiquidationToExcel()
  - [ ] 7.1.2 Función: exportAccountsSettlementToExcel()
  - [ ] 7.1.3 Función: exportCashStatusToExcel()
  - [ ] 7.1.4 Función: exportCurrentAccountToExcel()
- [ ] 7.2 Crear lib/utils/pdf-export.ts
  - [ ] 7.2.1 Función: exportReportToPDF()
  - [ ] 7.2.2 Template: Reporte de inventario
  - [ ] 7.2.3 Template: Reporte de cuentas
  - [ ] 7.2.4 Template: Estado de cuenta

## 8. Páginas de Reportes

- [ ] 8.1 Crear app/dashboard/reports/inventory-liquidation/page.tsx
  - [ ] 8.1.1 Verificación de acceso por plan
  - [ ] 8.1.2 Integración con filtros avanzados
  - [ ] 8.1.3 Renderizado de reporte y gráficos
  - [ ] 8.1.4 Opciones de exportación
- [ ] 8.2 Crear app/dashboard/reports/accounts-settlement/page.tsx
  - [ ] 8.2.1 Verificación de acceso por plan
  - [ ] 8.2.2 Integración con filtros avanzados
  - [ ] 8.2.3 Renderizado de reporte y gráficos
  - [ ] 8.2.4 Opciones de exportación
- [ ] 8.3 Crear app/dashboard/reports/cash-status/page.tsx
  - [ ] 8.3.1 Verificación de acceso por plan
  - [ ] 8.3.2 Integración con filtros avanzados
  - [ ] 8.3.3 Renderizado de reporte y gráficos
  - [ ] 8.3.4 Opciones de exportación
- [ ] 8.4 Crear app/dashboard/reports/current-accounts/page.tsx
  - [ ] 8.4.1 Verificación de acceso por plan
  - [ ] 8.4.2 Integración con filtros avanzados
  - [ ] 8.4.3 Renderizado de reporte y gráficos
  - [ ] 8.4.4 Opciones de exportación y envío

## 9. Actualización de Sidebar

- [ ] 9.1 Agregar sección "Reportes Avanzados" en sidebar
- [ ] 9.2 Agregar enlaces a nuevos reportes
- [ ] 9.3 Aplicar restricciones por plan
- [ ] 9.4 Agregar iconos apropiados

## 10. Optimizaciones

- [ ] 10.1 Agregar índices en base de datos para consultas de reportes
- [ ] 10.2 Implementar cache de consultas frecuentes
- [ ] 10.3 Implementar paginación en reportes grandes
- [ ] 10.4 Implementar lazy loading de gráficos
- [ ] 10.5 Implementar debounce en filtros

## 11. Pruebas

- [ ] 11.1 Pruebas unitarias de funciones de cálculo
- [ ] 11.2 Pruebas de integración de reportes
- [ ] 11.3 Pruebas de exportación a Excel
- [ ] 11.4 Pruebas de envío de estados de cuenta
- [ ] 11.5 Pruebas de restricciones por plan

## 12. Documentación

- [ ] 12.1 Crear guía de usuario para reportes avanzados
- [ ] 12.2 Documentar API de funciones de servidor
- [ ] 12.3 Documentar estructura de datos
- [ ] 12.4 Crear ejemplos de uso
