# Implementation Plan: Movimientos de Caja (Ingresos y Retiros)

## Overview

Este plan implementa la funcionalidad de registro de ingresos y retiros de dinero en la sección de caja. La implementación se divide en 5 fases principales: creación de la base de datos, tipos TypeScript, server actions, componentes UI, y actualización del cálculo de caja actual.

## Tasks

- [x] 1. Crear esquema de base de datos para movimientos de caja
  - Crear script SQL con tabla `cash_movements`
  - Incluir índices para optimizar consultas
  - Configurar políticas RLS para seguridad
  - Agregar triggers para `updated_at`
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 6.1, 6.2, 6.5, 6.6_

- [x] 2. Definir tipos TypeScript para movimientos de caja
  - Agregar interfaces `CashMovement`, `CashMovementFormData`, `CashMovementFilters` en `lib/types/erp.ts`
  - Definir tipos para respuestas de API
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 3. Implementar server actions para movimientos de caja
  - [x] 3.1 Crear archivo `lib/actions/cash-movements.ts`
    - Implementar `getCashMovements()` con filtros opcionales
    - Implementar `getCashMovement(id)` para consulta individual
    - Implementar `createCashMovement()` con validaciones
    - Implementar `deleteCashMovement(id)`
    - Implementar `getCashMovementsByOpening(openingId)`
    - Implementar `getCashMovementsSummary(openingId)` para totales
    - _Requirements: 1.3, 1.4, 1.5, 2.3, 2.4, 2.5, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 6.2, 6.3, 6.4, 6.5_

  - [ ]* 3.2 Escribir property test para validación de monto positivo
    - **Property 1: Validación de Monto Positivo**
    - **Validates: Requirements 1.4, 2.4**

  - [ ]* 3.3 Escribir property test para persistencia completa de datos
    - **Property 2: Persistencia Completa de Datos**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**

  - [ ]* 3.4 Escribir property test para asociación con apertura activa
    - **Property 3: Asociación con Apertura Activa**
    - **Validates: Requirements 6.3, 6.4**

  - [ ]* 3.5 Escribir property test para cálculo de ingresos
    - **Property 4: Cálculo Correcto de Ingresos**
    - **Validates: Requirements 3.4, 5.4**

  - [ ]* 3.6 Escribir property test para cálculo de retiros
    - **Property 5: Cálculo Correcto de Retiros**
    - **Validates: Requirements 3.5, 5.5**

- [x] 4. Checkpoint - Verificar server actions
  - Asegurar que todos los tests pasen
  - Verificar que las validaciones funcionan correctamente
  - Preguntar al usuario si hay dudas o ajustes necesarios

- [x] 5. Actualizar cálculo de Caja Actual
  - [x] 5.1 Modificar `calculateCurrentCashBalance()` en `lib/actions/financial-stats.ts`
    - Consultar movimientos de caja de la apertura activa
    - Sumar ingresos al saldo
    - Restar retiros del saldo
    - Actualizar fórmula: Monto Inicial + Ventas Efectivo - Pagos Proveedores + Ingresos - Retiros
    - _Requirements: 1.6, 2.6, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

  - [ ]* 5.2 Escribir property test para actualización con ingresos
    - **Property 6: Actualización de Caja Actual con Ingresos**
    - **Validates: Requirements 1.6, 3.6**

  - [ ]* 5.3 Escribir property test para actualización con retiros
    - **Property 7: Actualización de Caja Actual con Retiros**
    - **Validates: Requirements 2.6, 3.6**

  - [ ]* 5.4 Escribir property test para fórmula completa
    - **Property 8: Fórmula Completa de Caja Actual**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

- [x] 6. Crear componente modal para registrar movimientos
  - [x] 6.1 Crear `components/dashboard/cash-movement-modal.tsx`
    - Crear modal reutilizable con prop `type: 'income' | 'withdrawal'`
    - Agregar campos: monto (number), descripción (textarea)
    - Implementar validación de formulario (monto > 0, descripción requerida)
    - Integrar con `createCashMovement()` server action
    - Mostrar mensajes de éxito/error
    - Cerrar modal y limpiar formulario después de éxito
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 2.2, 2.3, 2.4, 2.5_

  - [ ]* 6.2 Escribir unit tests para el modal
    - Test: Modal se abre correctamente
    - Test: Validación de monto rechaza valores ≤ 0
    - Test: Validación de descripción rechaza valores vacíos
    - Test: Formulario se resetea después de envío exitoso

- [x] 7. Crear componente de lista de movimientos
  - [x] 7.1 Crear `components/dashboard/cash-movements-list.tsx`
    - Mostrar tabla con columnas: tipo, monto, descripción, usuario, fecha
    - Agregar filtros: tipo de movimiento, rango de fechas
    - Implementar paginación si hay muchos movimientos
    - Agregar acción de eliminar con confirmación
    - Mostrar totales: total ingresos, total retiros, movimiento neto
    - _Requirements: 5.1, 5.2, 5.3_

  - [ ]* 7.2 Escribir unit tests para la lista
    - Test: Lista muestra todos los campos requeridos
    - Test: Filtros funcionan correctamente
    - Test: Totales se calculan correctamente

- [x] 8. Actualizar página de caja con botones de movimientos
  - [x] 8.1 Modificar `app/dashboard/cash-register/page.tsx`
    - Agregar botón "Registrar Ingreso" con ícono apropiado
    - Agregar botón "Registrar Retiro" con ícono apropiado
    - Integrar `CashMovementModal` para ambos tipos
    - Mostrar resumen de movimientos del turno actual
    - Actualizar "Caja Actual" después de cada movimiento
    - Deshabilitar botones si no hay apertura activa
    - _Requirements: 1.1, 1.2, 2.1, 2.2, 3.6, 6.3_

  - [ ]* 8.2 Escribir unit tests para la página
    - Test: Botones se muestran correctamente
    - Test: Botones están deshabilitados sin apertura activa
    - Test: Modal se abre con el tipo correcto

- [x] 9. Checkpoint - Verificar UI completa
  - Asegurar que todos los componentes se renderizan correctamente
  - Verificar que la interacción usuario funciona end-to-end
  - Preguntar al usuario si hay ajustes de UI necesarios

- [x] 10. Actualizar cierre de caja para incluir movimientos
  - [x] 10.1 Modificar `lib/actions/cash-register.ts`
    - Actualizar `createCashRegisterClosure()` para consultar movimientos
    - Agregar campos `cash_movements_income` y `cash_movements_withdrawals` a la tabla
    - Incluir movimientos en el cálculo de efectivo esperado
    - _Requirements: 5.1, 5.2, 5.4, 5.5, 5.6_

  - [x] 10.2 Actualizar componente de visualización de cierre
    - Modificar `app/dashboard/cash-register/page.tsx` o crear componente específico
    - Agregar sección "Ingresos" con lista de movimientos tipo income
    - Agregar sección "Retiros" con lista de movimientos tipo withdrawal
    - Mostrar totales de ingresos y retiros
    - Actualizar cálculo de efectivo esperado en el reporte
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [ ]* 10.3 Escribir property test para inclusión en cierre
    - **Property 10: Inclusión en Cierre de Caja**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.6**

- [x] 11. Agregar migración de base de datos al proyecto
  - Crear archivo `scripts/XXX_create_cash_movements.sql` con número secuencial apropiado
  - Documentar en comentarios el propósito de la migración
  - Incluir instrucciones de rollback si es necesario
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [x] 12. Checkpoint final - Pruebas de integración
  - Ejecutar flujo completo: abrir caja → registrar ingreso → registrar retiro → verificar saldo → cerrar caja
  - Verificar que "Caja Actual" en dashboard se actualiza correctamente
  - Verificar que movimientos aparecen en el reporte de cierre
  - Asegurar que todos los tests pasen
  - Preguntar al usuario si todo funciona según lo esperado

## Notes

- Las tareas marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido
- Cada tarea referencia los requisitos específicos que implementa
- Los checkpoints permiten validación incremental con el usuario
- Los property tests validan propiedades universales con mínimo 100 iteraciones
- Los unit tests validan casos específicos y condiciones de borde
- La implementación sigue el patrón arquitectónico existente del sistema
