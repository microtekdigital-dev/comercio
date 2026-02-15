# Implementation Plan: Panel de Estadísticas Financieras y Caja Inicial

## Overview

Este plan implementa un panel de estadísticas financieras en el dashboard principal que muestra métricas clave en tiempo real (ventas diarias, saldo de caja, cuentas por cobrar/pagar, ganancia mensual) y un sistema de configuración de caja inicial para empresas nuevas que se integra con el sistema existente de apertura y cierre de caja.

## Tasks

- [x] 1. Extender el esquema de base de datos para caja inicial
  - Agregar campos `initial_cash_amount` y `initial_cash_configured_at` a la tabla `company_settings`
  - Crear migración SQL para agregar las columnas
  - _Requirements: 7.3, 7.4_

- [x] 2. Implementar server actions para estadísticas financieras
  - [x] 2.1 Crear archivo `lib/actions/financial-stats.ts` con funciones de cálculo
    - Implementar `getFinancialStats()` como función principal
    - Implementar `calculateDailySales()` para ventas del día
    - Implementar `calculateCurrentCashBalance()` para saldo de caja
    - Implementar `calculateAccountsReceivable()` para cuentas por cobrar
    - Implementar `calculateAccountsPayable()` para cuentas por pagar
    - Implementar `calculateMonthlyProfit()` para ganancia mensual
    - Incluir manejo de errores robusto (retornar 0 en caso de error individual)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 3.1, 3.2, 3.3, 4.1, 4.3, 5.1, 5.3, 6.1, 6.2, 6.3, 9.1, 9.4_

  - [ ]* 2.2 Escribir property test para cálculo de ventas diarias
    - **Property 1: Cálculo correcto de ventas diarias**
    - **Validates: Requirements 1.1, 2.1, 2.2**

  - [ ]* 2.3 Escribir property test para invariante de saldo de caja
    - **Property 2: Invariante de saldo de caja**
    - **Validates: Requirements 1.2, 3.1, 3.2, 3.3**

  - [ ]* 2.4 Escribir property test para cuentas por cobrar
    - **Property 3: Cálculo correcto de cuentas por cobrar**
    - **Validates: Requirements 1.3, 4.1, 4.3**

  - [ ]* 2.5 Escribir property test para cuentas por pagar
    - **Property 4: Cálculo correcto de cuentas por pagar**
    - **Validates: Requirements 1.4, 5.1, 5.3**

  - [ ]* 2.6 Escribir property test para ganancia mensual
    - **Property 5: Cálculo correcto de ganancia mensual**
    - **Validates: Requirements 1.5, 6.1, 6.2, 6.3**

  - [ ]* 2.7 Escribir property test para formato de moneda
    - **Property 6: Formato consistente de moneda**
    - **Validates: Requirements 2.4, 4.4, 5.4, 6.4, 10.2, 10.3**

  - [ ]* 2.8 Escribir property test para validación numérica
    - **Property 11: Validación de datos numéricos**
    - **Validates: Requirements 9.1**

  - [ ]* 2.9 Escribir property test para resiliencia ante errores
    - **Property 12: Resiliencia ante errores**
    - **Validates: Requirements 9.4**

- [x] 3. Extender server actions de company-settings para caja inicial
  - [x] 3.1 Agregar funciones en `lib/actions/company-settings.ts`
    - Implementar `setInitialCashAmount(amount: number)` con validación
    - Implementar `getInitialCashAmount()` para recuperar valor
    - Implementar `needsInitialCashSetup()` para verificar si se necesita configurar
    - Incluir validaciones: amount > 0, configuración única por empresa
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [ ]* 3.2 Escribir property test para validación de importe positivo
    - **Property 7: Validación de importe inicial positivo**
    - **Validates: Requirements 7.2**

  - [ ]* 3.3 Escribir property test para persistencia de importe inicial
    - **Property 8: Persistencia de importe inicial**
    - **Validates: Requirements 7.3**

  - [ ]* 3.4 Escribir property test para restricción de configuración única
    - **Property 9: Restricción de configuración única**
    - **Validates: Requirements 7.4**

  - [ ]* 3.5 Escribir unit tests para casos edge
    - Test: Empresa sin importe configurado retorna null
    - Test: Intento de configurar con valor negativo falla
    - Test: Intento de configurar con valor cero falla
    - _Requirements: 7.2_

- [ ] 4. Checkpoint - Verificar funciones de backend
  - Asegurar que todos los tests pasen
  - Verificar que las funciones manejen errores correctamente
  - Preguntar al usuario si hay dudas o ajustes necesarios

- [x] 5. Crear componente FinancialStatsPanel
  - [x] 5.1 Crear `components/dashboard/financial-stats-panel.tsx`
    - Implementar componente async que llama a `getFinancialStats()`
    - Renderizar 5 cards con las métricas financieras
    - Usar iconos de lucide-react apropiados para cada métrica
    - Implementar formateo de moneda con `Intl.NumberFormat`
    - Manejar estado de carga y error
    - Manejar caso cuando no hay datos (mostrar 0)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.7, 2.4, 4.4, 5.4, 6.4, 10.1, 10.2, 10.3_

  - [ ]* 5.2 Escribir property test para presencia de etiquetas
    - **Property 13: Presencia de etiquetas descriptivas**
    - **Validates: Requirements 10.1**

  - [ ]* 5.3 Escribir unit tests para el componente
    - Test: Renderiza correctamente con datos válidos
    - Test: Muestra valores en 0 cuando no hay datos
    - Test: Muestra estado de error cuando falla la carga
    - Test: Formatea montos correctamente con separadores de miles
    - _Requirements: 1.7, 2.4, 10.2_

- [x] 6. Crear componente InitialCashSetupModal
  - [x] 6.1 Crear `components/dashboard/initial-cash-setup-modal.tsx`
    - Implementar modal con formulario para ingresar importe inicial
    - Usar react-hook-form para manejo del formulario
    - Validar que el importe sea > 0
    - Llamar a `setInitialCashAmount()` al guardar
    - Mostrar mensajes de error apropiados
    - Cerrar modal después de guardar exitosamente
    - _Requirements: 7.1, 7.2, 7.3_

  - [ ]* 6.2 Escribir unit tests para el modal
    - Test: Valida que el importe sea positivo
    - Test: Muestra error cuando el importe es 0 o negativo
    - Test: Llama a onSave con el valor correcto
    - Test: Cierra el modal después de guardar
    - _Requirements: 7.2_

- [x] 7. Integrar FinancialStatsPanel en el dashboard principal
  - [x] 7.1 Modificar `app/dashboard/page.tsx`
    - Importar y renderizar `<FinancialStatsPanel />` en la parte superior
    - Posicionar antes del componente `<ERPStats />` existente
    - Mantener el layout responsive existente
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [ ]* 7.2 Escribir test de integración
    - Test: Dashboard renderiza FinancialStatsPanel correctamente
    - Test: Panel se muestra antes de ERPStats
    - _Requirements: 1.1_

- [x] 8. Implementar lógica de configuración inicial en dashboard
  - [x] 8.1 Agregar verificación de caja inicial en `app/dashboard/page.tsx`
    - Llamar a `needsInitialCashSetup()` al cargar el dashboard
    - Si retorna true, mostrar `<InitialCashSetupModal />` automáticamente
    - Guardar estado en localStorage para no mostrar múltiples veces en la misma sesión
    - _Requirements: 7.1, 7.5_

  - [ ]* 8.2 Escribir unit test para lógica de configuración
    - Test: Modal se muestra cuando needsInitialCashSetup retorna true
    - Test: Modal no se muestra cuando ya está configurado
    - _Requirements: 7.1, 7.5_

- [x] 9. Integrar importe inicial con sistema de apertura de caja
  - [x] 9.1 Modificar `app/dashboard/cash-register/opening/new/page.tsx`
    - Llamar a `getInitialCashAmount()` al cargar el formulario
    - Si existe valor, pre-llenar el campo `initial_cash_amount` con ese valor
    - Permitir que el usuario modifique el valor sugerido
    - Agregar texto de ayuda indicando que es el valor configurado
    - _Requirements: 8.1, 8.2, 8.3_

  - [ ]* 9.2 Escribir property test para trazabilidad
    - **Property 10: Trazabilidad de importe inicial**
    - **Validates: Requirements 8.4**

  - [ ]* 9.3 Escribir unit test para integración
    - Test: Campo se pre-llena con importe inicial cuando existe
    - Test: Campo queda vacío cuando no existe importe inicial
    - Test: Usuario puede modificar el valor sugerido
    - _Requirements: 8.1, 8.2, 8.3_

- [x] 10. Agregar tipos TypeScript necesarios
  - [x] 10.1 Actualizar `lib/types/erp.ts`
    - Agregar interface `FinancialStats`
    - Agregar campos opcionales a `CompanySettings` para caja inicial
    - _Requirements: Todos_

- [ ] 11. Checkpoint final - Verificar integración completa
  - Ejecutar todos los tests (unit y property)
  - Verificar que el panel se muestre correctamente en el dashboard
  - Verificar que el modal de configuración inicial funcione
  - Verificar que la integración con apertura de caja funcione
  - Preguntar al usuario si hay ajustes finales necesarios

## Notes

- Las tareas marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido
- Cada tarea referencia los requisitos específicos que implementa para trazabilidad
- Los checkpoints aseguran validación incremental del progreso
- Los property tests validan propiedades universales de corrección
- Los unit tests validan ejemplos específicos y casos edge
- La configuración mínima de property tests es 100 iteraciones por test
