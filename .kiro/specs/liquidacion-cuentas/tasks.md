# Implementation Plan: Reporte de Liquidación de Cuentas

## Overview

Este plan implementa el Reporte de Liquidación de Cuentas, una funcionalidad que muestra el estado consolidado de cuentas por cobrar y cuentas por pagar en una fecha determinada. La implementación reutiliza funciones existentes de sales y purchase-orders, y sigue los patrones establecidos en el proyecto.

## Tasks

- [x] 1. Crear tipos e interfaces para el reporte
  - Crear archivo `lib/types/accounts-settlement.ts` con las interfaces:
    - `AccountReceivable`: datos de cuenta por cobrar
    - `AccountPayable`: datos de cuenta por pagar
    - `FinancialSummary`: resumen financiero
    - `ExportData`: datos para exportación
  - _Requirements: 1.1, 2.1, 3.1, 4.1_

- [ ] 2. Implementar funciones de cálculo y procesamiento
  - [x] 2.1 Crear archivo `lib/actions/accounts-settlement.ts` con funciones de cálculo
    - `calculateBalance(total, payments)`: calcular saldo pendiente
    - `calculateDaysOverdue(cutoffDate, transactionDate)`: calcular días vencidos
    - `filterByPaymentStatus(transactions, statuses)`: filtrar por estado de pago
    - `filterByDate(transactions, cutoffDate)`: filtrar por fecha de corte
    - `sortByDaysOverdue(accounts)`: ordenar por días vencidos
    - `calculateFinancialSummary(receivables, payables)`: calcular resumen
    - _Requirements: 1.2, 2.2, 2.3, 2.4, 3.4, 3.5, 3.6, 4.4, 4.5, 4.6_

  - [ ]* 2.2 Escribir property test para cálculo de saldo pendiente
    - **Property 2: Cálculo de saldo pendiente para ventas**
    - **Validates: Requirements 3.4**

  - [ ]* 2.3 Escribir property test para cálculo de días vencidos
    - **Property 5: Cálculo de días vencidos**
    - **Validates: Requirements 3.5, 4.5**

  - [ ]* 2.4 Escribir property test para ordenamiento
    - **Property 6: Ordenamiento por días vencidos**
    - **Validates: Requirements 3.6, 4.6**

  - [ ]* 2.5 Escribir property test para filtrado por estado de pago
    - **Property 7: Filtrado por estado de pago**
    - **Validates: Requirements 3.1, 4.1**

  - [ ]* 2.6 Escribir property test para filtrado por fecha
    - **Property 1: Filtrado por fecha de corte**
    - **Validates: Requirements 1.2, 3.2, 4.2**

  - [ ]* 2.7 Escribir property test para cálculo de balance neto
    - **Property 4: Cálculo de balance neto**
    - **Validates: Requirements 2.4**

  - [ ]* 2.8 Escribir property test para suma de totales
    - **Property 8 & 9: Suma de totales de cuentas por cobrar y pagar**
    - **Validates: Requirements 2.2, 2.3**

- [ ] 3. Implementar funciones de exportación a Excel y PDF
  - [ ] 3.1 Agregar función `exportAccountsSettlementToExcel()` en `lib/actions/accounts-settlement.ts`
    - Generar archivo Excel con tres hojas: Resumen, Cuentas por Cobrar, Cuentas por Pagar
    - Incluir fecha de corte en el nombre del archivo
    - Formatear montos como números en Excel
    - _Requirements: 5.1, 5.2, 5.4, 5.6, 5.8_

  - [ ] 3.2 Agregar función `exportAccountsSettlementToPDF()` en `lib/actions/accounts-settlement.ts`
    - Generar archivo PDF con todas las secciones del reporte
    - Incluir nombre de empresa en el encabezado
    - Incluir fecha de corte en el nombre del archivo
    - Formatear montos con símbolo de moneda ($)
    - Usar jsPDF y autoTable siguiendo el patrón de `lib/utils/export.ts`
    - _Requirements: 5.1, 5.3, 5.4, 5.7, 5.8, 5.9_

  - [ ]* 3.3 Escribir property test para nombre de archivo
    - **Property 11: Nombre de archivo de exportación**
    - **Validates: Requirements 5.5**

  - [ ]* 3.4 Escribir property test para formato de números en Excel
    - **Property 12: Formato de números en Excel**
    - **Validates: Requirements 5.6**

  - [ ]* 3.5 Escribir property test para formato de montos en PDF
    - **Property 13: Formato de montos en PDF**
    - **Validates: Requirements 5.7**

  - [ ]* 3.6 Escribir property test para nombre de empresa en PDF
    - **Property 14: Nombre de empresa en PDF**
    - **Validates: Requirements 5.9**

  - [ ]* 3.7 Escribir unit test para exportación completa a Excel
    - Verificar que el archivo incluye todas las secciones
    - Verificar estructura de hojas
    - _Requirements: 5.2, 5.4_

  - [ ]* 3.8 Escribir unit test para exportación completa a PDF
    - Verificar que el archivo incluye todas las secciones
    - Verificar encabezado con nombre de empresa
    - _Requirements: 5.3, 5.4, 5.9_

- [ ] 4. Crear componente de tarjetas de resumen
  - [x] 4.1 Crear `components/dashboard/accounts-settlement-summary.tsx`
    - Tres tarjetas (Card) con iconos: 💰 Cuentas por Cobrar, 💸 Cuentas por Pagar, ⚖️ Balance Neto
    - Formatear montos con `Intl.NumberFormat` en ARS
    - Color verde para balance positivo, rojo para negativo
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

  - [ ]* 4.2 Escribir property test para formato de moneda
    - **Property 10: Formato de moneda**
    - **Validates: Requirements 2.7, 3.8, 4.7**

  - [ ]* 4.3 Escribir unit test para renderizado de tarjetas
    - Verificar que se muestran las tres tarjetas
    - Verificar colores según balance
    - _Requirements: 2.1, 2.5, 2.6_

- [ ] 5. Crear componente de tabla de cuentas por cobrar
  - [x] 5.1 Crear `components/dashboard/accounts-receivable-table.tsx`
    - Tabla con columnas: Cliente, Fecha Venta, Total, Pagado, Saldo Pendiente, Días Vencido
    - Mostrar "Cliente General" cuando no hay cliente
    - Formatear montos en ARS
    - Indicador visual para días vencidos altos (>30 días)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

  - [ ]* 5.2 Escribir unit test para caso sin cliente
    - Verificar que muestra "Cliente General"
    - _Requirements: 3.7_

  - [ ]* 5.3 Escribir unit test para renderizado de tabla
    - Verificar columnas correctas
    - Verificar formato de datos
    - _Requirements: 3.3_

- [ ] 6. Crear componente de tabla de cuentas por pagar
  - [x] 6.1 Crear `components/dashboard/accounts-payable-table.tsx`
    - Tabla con columnas: Proveedor, Fecha Orden, Total, Pagado, Saldo Pendiente, Días Vencido
    - Formatear montos en ARS
    - Indicador visual para días vencidos altos (>30 días)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

  - [ ]* 6.2 Escribir unit test para renderizado de tabla
    - Verificar columnas correctas
    - Verificar formato de datos
    - _Requirements: 4.3_

- [ ] 7. Crear componente principal del reporte
  - [x] 7.1 Crear `components/dashboard/accounts-settlement-report.tsx`
    - Gestionar estado: cutoffDate, accountsReceivable, accountsPayable, isLoading, summary
    - Selector de fecha con fecha actual como valor predeterminado
    - Llamar a `getSales()` y `getPurchaseOrders()` con filtros de fecha
    - Procesar datos usando funciones de `lib/actions/accounts-settlement.ts`
    - Renderizar AccountsSettlementSummary, AccountsReceivableTable, AccountsPayableTable
    - Dos botones: "Exportar a Excel" y "Exportar a PDF"
    - Botón "Exportar a Excel" llama a `exportAccountsSettlementToExcel()`
    - Botón "Exportar a PDF" llama a `exportAccountsSettlementToPDF()`
    - Mostrar mensaje cuando no hay cuentas pendientes
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 5.1, 5.2, 5.3, 6.1, 6.2, 6.3, 6.4, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

  - [ ]* 7.2 Escribir property test para recálculo automático
    - **Property 16: Permitir cualquier fecha**
    - **Validates: Requirements 1.3**

  - [ ]* 7.3 Escribir unit test para estado inicial
    - Verificar que la fecha predeterminada es hoy
    - _Requirements: 1.1_

  - [ ]* 7.4 Escribir unit test para caso sin datos
    - Verificar mensaje cuando no hay cuentas pendientes
    - _Requirements: 8.6_

- [ ] 8. Checkpoint - Verificar componentes y funciones
  - Asegurar que todos los tests pasan
  - Verificar que los componentes se renderizan correctamente
  - Preguntar al usuario si hay dudas o ajustes necesarios

- [ ] 9. Crear página del reporte
  - [x] 9.1 Crear `app/dashboard/accounts-settlement/page.tsx`
    - Verificar autenticación del usuario
    - Obtener company_id del usuario autenticado
    - Renderizar AccountsSettlementReport con props necesarias
    - Manejar redirección si no está autenticado
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [ ]* 9.2 Escribir property test para aislamiento por empresa
    - **Property 15: Aislamiento por empresa**
    - **Validates: Requirements 7.2, 7.3**

  - [ ]* 9.3 Escribir unit test para autenticación
    - Verificar redirección si no está autenticado
    - _Requirements: 7.1, 7.4_

- [x] 10. Agregar enlace en el menú de navegación
  - Agregar enlace a `/dashboard/accounts-settlement` en el menú lateral del dashboard
  - Usar icono apropiado (ej: Balance, FileText, DollarSign)
  - Texto: "Liquidación de Cuentas"
  - _Requirements: 8.1, 8.2, 8.3_

- [ ] 11. Checkpoint final - Pruebas de integración
  - Ejecutar todos los tests (unit y property)
  - Probar flujo completo: seleccionar fecha → ver datos → exportar a Excel → exportar a PDF
  - Verificar que funciona con datos reales
  - Verificar que ambos archivos (Excel y PDF) se generan correctamente
  - Verificar que el PDF incluye el nombre de la empresa
  - Verificar accesibilidad (navegación por teclado, labels, contraste)
  - Preguntar al usuario si hay ajustes finales

## Notes

- Las tareas marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido
- Cada tarea referencia los requerimientos específicos que implementa
- Los property tests deben ejecutarse con mínimo 100 iteraciones usando `fast-check`
- Los checkpoints aseguran validación incremental del progreso
- La implementación reutiliza funciones existentes (`getSales`, `getPurchaseOrders`, `exportToExcel`)
- Se mantiene consistencia con componentes UI existentes (Card, Table, Button, DatePicker)
