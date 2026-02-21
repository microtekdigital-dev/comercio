# Implementation Plan: Soporte Multimoneda

## Overview

Este plan implementa el soporte multimoneda en el ERP SaaS siguiendo un enfoque incremental: primero la infraestructura de datos y utilidades, luego la configuración UI, y finalmente la actualización de todos los módulos para usar el nuevo sistema de formateo.

## Tasks

- [x] 1. Migración de base de datos y tipos TypeScript
  - Crear script de migración SQL para agregar campos de moneda a company_settings
  - Actualizar interface CompanySettings en lib/types/erp.ts
  - Agregar tipos CurrencyCode y CurrencyConfig
  - _Requirements: 13.1, 13.2, 13.3, 12.2, 12.3_

- [ ] 2. Implementar utilidad de formateo de moneda
  - [ ] 2.1 Crear archivo lib/utils/currency.ts con constantes y funciones
    - Definir SUPPORTED_CURRENCIES con las 9 monedas
    - Implementar formatCurrency() con soporte para posición before/after
    - Implementar formatCompanyCurrency() que usa settings de empresa
    - Implementar getCurrencyConfig() helper
    - _Requirements: 2.1, 2.3, 3.1, 3.2, 3.3, 3.4, 3.5_
  
  - [ ]* 2.2 Escribir tests unitarios para currency.ts
    - Test formateo con símbolo before
    - Test formateo con símbolo after
    - Test manejo de null/undefined
    - Test separadores de miles y decimales
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  
  - [ ]* 2.3 Escribir property test para formateo de moneda
    - **Property 4: Currency symbol application**
    - **Validates: Requirements 3.1**
  
  - [ ]* 2.4 Escribir property test para posición "before"
    - **Property 5: Symbol position before**
    - **Validates: Requirements 3.2**
  
  - [ ]* 2.5 Escribir property test para posición "after"
    - **Property 6: Symbol position after**
    - **Validates: Requirements 3.3**
  
  - [ ]* 2.6 Escribir property test para formato numérico
    - **Property 7: Number formatting with separators**
    - **Validates: Requirements 3.4**
  
  - [ ]* 2.7 Escribir property test para completitud de datos de monedas
    - **Property 9: Currency data completeness**
    - **Validates: Requirements 2.2, 2.3**

- [ ] 3. Actualizar server actions para configuración de moneda
  - [ ] 3.1 Actualizar lib/actions/company-settings.ts
    - Agregar validación de currency_code contra SUPPORTED_CURRENCIES
    - Agregar validación de currency_position (before/after)
    - Actualizar función updateCompanySettings para aceptar campos de moneda
    - _Requirements: 1.3, 1.4, 1.5_
  
  - [ ]* 3.2 Escribir tests unitarios para validaciones
    - Test validación de código válido
    - Test rechazo de código inválido
    - Test validación de posición válida
    - _Requirements: 1.4, 1.5_
  
  - [ ]* 3.3 Escribir property test para validación de código
    - **Property 3: Currency code validation**
    - **Validates: Requirements 1.4**
  
  - [ ]* 3.4 Escribir property test para persistencia de configuración
    - **Property 2: Currency configuration persistence**
    - **Validates: Requirements 1.3, 13.4**
  
  - [ ]* 3.5 Escribir property test para cambio de moneda
    - **Property 10: Currency change flexibility**
    - **Validates: Requirements 12.4**

- [ ] 4. Checkpoint - Verificar infraestructura base
  - Asegurar que todos los tests pasan, preguntar al usuario si surgen dudas.

- [ ] 5. Crear componente selector de moneda
  - [ ] 5.1 Crear components/dashboard/currency-selector.tsx
    - Implementar selector con lista de SUPPORTED_CURRENCIES
    - Mostrar código, nombre y símbolo de cada moneda
    - Callback onChange con code, symbol y position
    - _Requirements: 1.1, 1.2, 2.2_
  
  - [ ]* 5.2 Escribir tests unitarios para CurrencySelector
    - Test renderizado de todas las monedas
    - Test selección y callback
    - _Requirements: 1.2, 2.2_
  
  - [ ]* 5.3 Escribir property test para autocompletado
    - **Property 1: Currency selection autocomplete**
    - **Validates: Requirements 1.2**

- [ ] 6. Actualizar UI de configuración de empresa
  - Actualizar components/dashboard/company-settings-advanced.tsx
  - Agregar sección "Configuración de Moneda" en pestaña Facturación
  - Integrar CurrencySelector
  - Mostrar preview del formato (ej: "$1,234.56")
  - Actualizar formData para incluir currency_code, currency_symbol, currency_position
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 7. Actualizar módulo de Productos
  - [ ] 7.1 Actualizar componentes de lista y detalle de productos
    - Importar formatCompanyCurrency en componentes de productos
    - Aplicar formato a price y cost en tablas y cards
    - Aplicar formato en formularios de edición
    - _Requirements: 4.1, 4.2, 4.3_
  
  - [ ] 7.2 Actualizar componentes de variantes
    - Aplicar formato a precios de variantes en variant-stock-table.tsx
    - Aplicar formato en variant-selector-in-sale.tsx
    - _Requirements: 4.4_
  
  - [ ]* 7.3 Escribir property test para formato de variantes
    - **Property 8: Variant price formatting**
    - **Validates: Requirements 4.4**

- [ ] 8. Actualizar módulo de Ventas y Presupuestos
  - [ ] 8.1 Actualizar componentes de ventas
    - Aplicar formato en app/dashboard/sales/page.tsx (lista)
    - Aplicar formato en app/dashboard/sales/[id]/page.tsx (detalle)
    - Aplicar formato en app/dashboard/sales/new/page.tsx (formulario)
    - _Requirements: 5.1, 5.2, 5.3_
  
  - [ ] 8.2 Actualizar componente de impresión de facturas
    - Aplicar formato en components/dashboard/invoice-print.tsx
    - _Requirements: 5.4_
  
  - [ ] 8.3 Actualizar componentes de presupuestos
    - Aplicar formato en app/dashboard/quotes/page.tsx
    - Aplicar formato en app/dashboard/quotes/[id]/page.tsx
    - Aplicar formato en app/dashboard/quotes/new/quote-form.tsx
    - _Requirements: 5.5_

- [ ] 9. Actualizar módulo de Compras
  - Aplicar formato en app/dashboard/purchase-orders/page.tsx (lista)
  - Aplicar formato en app/dashboard/purchase-orders/new/page.tsx (formulario y detalle)
  - Aplicar formato en componentes de items de órdenes de compra
  - _Requirements: 6.1, 6.2, 6.3_

- [ ] 10. Checkpoint - Verificar módulos transaccionales
  - Asegurar que todos los tests pasan, preguntar al usuario si surgen dudas.

- [ ] 11. Actualizar módulo de Reparaciones
  - [ ] 11.1 Actualizar componentes de lista y detalle
    - Aplicar formato en app/dashboard/repairs/page.tsx
    - Aplicar formato en app/dashboard/repairs/[id]/page.tsx
    - _Requirements: 7.1, 7.2_
  
  - [ ] 11.2 Actualizar componentes de pagos y items
    - Aplicar formato en components/dashboard/repair-payment-modal.tsx
    - Aplicar formato en components/dashboard/repair-items-table.tsx
    - _Requirements: 7.2, 7.3_
  
  - [ ] 11.3 Actualizar impresión de órdenes
    - Aplicar formato en components/dashboard/repair-order-print.tsx
    - _Requirements: 7.4_

- [ ] 12. Actualizar módulo de Caja
  - [ ] 12.1 Actualizar aperturas de caja
    - Aplicar formato en app/dashboard/cash-register/opening/new/page.tsx
    - _Requirements: 8.1_
  
  - [ ] 12.2 Actualizar cierres de caja
    - Aplicar formato en app/dashboard/cash-register/new/page.tsx
    - Aplicar formato en app/dashboard/cash-register/page.tsx (lista)
    - _Requirements: 8.2_
  
  - [ ] 12.3 Actualizar movimientos de caja
    - Aplicar formato en componentes de movimientos
    - _Requirements: 8.3_
  
  - [ ] 12.4 Actualizar informe de cierre
    - Aplicar formato en components/dashboard/cash-closure-report.tsx
    - _Requirements: 8.4_

- [ ] 13. Actualizar Reportes Financieros
  - [ ] 13.1 Actualizar reporte de liquidación de inventario
    - Aplicar formato en components/dashboard/inventory-liquidation-report.tsx
    - _Requirements: 9.1_
  
  - [ ] 13.2 Actualizar reporte de liquidación de cuentas
    - Aplicar formato en components/dashboard/accounts-settlement-report.tsx
    - _Requirements: 9.2_
  
  - [ ] 13.3 Actualizar estado de caja
    - Aplicar formato en componentes de estado de caja
    - _Requirements: 9.3_
  
  - [ ] 13.4 Actualizar exportaciones
    - Aplicar formato en lib/utils/export.ts
    - _Requirements: 9.4_

- [ ] 14. Actualizar Dashboard y Estadísticas
  - [ ] 14.1 Actualizar componente de estadísticas
    - Aplicar formato en components/dashboard/erp-stats.tsx
    - _Requirements: 10.1, 10.2_
  
  - [ ] 14.2 Actualizar métricas financieras
    - Aplicar formato en lib/actions/financial-stats.ts (si retorna strings formateados)
    - Aplicar formato en componentes que muestran métricas
    - _Requirements: 10.2_
  
  - [ ] 14.3 Actualizar gráficos
    - Aplicar formato en etiquetas de gráficos en app/dashboard/analytics/page.tsx
    - _Requirements: 10.3_

- [ ] 15. Actualizar Cuentas Corrientes
  - [ ] 15.1 Actualizar cuentas de clientes
    - Aplicar formato en componentes de cuentas corrientes de clientes
    - _Requirements: 11.1, 11.3_
  
  - [ ] 15.2 Actualizar cuentas de proveedores
    - Aplicar formato en components/dashboard/supplier-account-modal.tsx
    - Aplicar formato en otros componentes de proveedores
    - _Requirements: 11.2, 11.3_
  
  - [ ] 15.3 Actualizar registro de pagos
    - Aplicar formato en components/dashboard/quick-payment-modal.tsx
    - Aplicar formato en components/dashboard/payment-manager.tsx
    - _Requirements: 11.4_

- [ ] 16. Checkpoint final - Testing integral
  - Asegurar que todos los tests pasan, preguntar al usuario si surgen dudas.

- [ ]* 17. Testing de integración end-to-end
  - Configurar moneda en settings
  - Crear producto y verificar formato
  - Crear venta y verificar formato
  - Cambiar moneda y verificar actualización
  - Verificar todos los módulos con nueva moneda

## Notes

- Las tareas marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido
- Cada tarea referencia los requirements específicos que implementa
- Los checkpoints aseguran validación incremental
- Los property tests validan propiedades universales de corrección
- Los unit tests validan ejemplos específicos y casos edge
- La implementación sigue un orden lógico: infraestructura → configuración → módulos
- Se recomienda ejecutar el script de migración en un ambiente de desarrollo primero
- Considerar hacer backup de la base de datos antes de ejecutar la migración en producción
