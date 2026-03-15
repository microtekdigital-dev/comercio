# Plan de Implementación: Devoluciones y Cambios de Ventas

## Visión General

Implementación incremental del módulo de devoluciones, comenzando por la base de datos y los tipos, luego la lógica de negocio, y finalmente la UI. Cada tarea construye sobre la anterior y termina con la integración completa.

## Tareas

- [x] 1. Migración de base de datos y tipos TypeScript
  - Crear el script SQL `scripts/230_create_sale_returns.sql` con las tablas `sale_returns`, `sale_return_items`, `credit_notes` y `customer_credits`
  - Agregar columna `return_id` a `stock_movements`
  - Agregar valor `partial_refund` al CHECK constraint de `sales.payment_status`
  - Crear índices en `sale_returns(company_id, sale_id)`, `credit_notes(company_id, return_id)` y `customer_credits(company_id, customer_id)`
  - Agregar RLS policies para las nuevas tablas (misma lógica que el resto del ERP: `company_id = auth.uid()`)
  - Agregar los tipos `SaleReturn`, `SaleReturnItem`, `CreditNote`, `CreateReturnInput`, `CreateReturnItemInput`, `ReturnFilters` a `lib/types/erp.ts`
  - _Requisitos: 1.7, 3.1, 3.5, 8.3_

- [x] 2. Server Action: createReturn
  - [x] 2.1 Implementar `createReturn` en `lib/actions/returns.ts`
    - Validar autenticación y pertenencia a la empresa (Requisito 8.4)
    - Validar que la venta existe y tiene estado `completed` (Requisito 1.6)
    - Validar que cada ítem tiene cantidad > 0 y no supera la disponible (Requisitos 1.3, 1.4, 8.1)
    - Validar motivo y `reason_notes` cuando motivo es `other` (Requisitos 5.1, 5.2)
    - Validar que método `customer_credit` requiere cliente en la venta (Requisito 4.5)
    - Calcular `total_amount` sumando `total` de cada ítem devuelto con sus descuentos e impuestos originales (Requisito 3.2)
    - Ejecutar en transacción: insertar `sale_returns`, insertar `sale_return_items`, insertar `credit_notes`, actualizar `sales.payment_status`, reponer stock con `return_in` en `stock_movements`, registrar en `customer_credits` o movimiento de caja según `refund_method`
    - Generar `return_number` con prefijo `DEV-` y `note_number` con prefijo `NC-` (Requisitos 1.7, 3.5)
    - _Requisitos: 1.1, 1.3, 1.4, 1.5, 1.6, 1.7, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 6.2, 6.3, 8.1, 8.3, 8.4, 8.5_

  - [ ]* 2.2 Escribir property test: Conservación de stock
    - **Propiedad 1: Conservación del stock tras devolución**
    - **Valida: Requisitos 2.1, 2.2, 2.5**
    - Generar producto con stock aleatorio, devolver cantidad aleatoria válida, verificar `stock_after = stock_before + quantity`

  - [ ]* 2.3 Escribir property test: Monto de nota de crédito
    - **Propiedad 2: El monto de la nota de crédito iguala la suma de los ítems devueltos**
    - **Valida: Requisitos 3.1, 3.2, 3.3**
    - Generar ítems con precios, descuentos e impuestos aleatorios, verificar `credit_note.amount === sum(items.total)`

  - [ ]* 2.4 Escribir property test: Cantidades no superan vendidas
    - **Propiedad 3: Las cantidades devueltas nunca superan las vendidas**
    - **Valida: Requisitos 1.3, 8.1**
    - Generar ventas con ítems de cantidades aleatorias, intentar devolver más de lo disponible, verificar rechazo

  - [ ]* 2.5 Escribir property test: Rechazo de ventas no completadas
    - **Propiedad 4: Rechazo de devoluciones sobre ventas no completadas**
    - **Valida: Requisito 1.6**
    - Generar ventas con estados `draft` y `cancelled`, verificar que `createReturn` retorna error

  - [ ]* 2.6 Escribir property test: Atomicidad de transacción
    - **Propiedad 5: Atomicidad de la transacción de devolución**
    - **Valida: Requisito 8.3**
    - Simular fallo en cada paso de la transacción, verificar que no hay cambios parciales persistidos

  - [ ]* 2.7 Escribir property test: Crédito al cliente
    - **Propiedad 6: El crédito al cliente refleja el monto de la nota de crédito**
    - **Valida: Requisito 4.2**
    - Generar devoluciones con método `customer_credit` y montos aleatorios, verificar incremento exacto en `customer_credits`

  - [ ]* 2.8 Escribir property test: Rechazo de monto cero
    - **Propiedad 7: Rechazo de devolución con monto cero o negativo**
    - **Valida: Requisito 8.5**
    - Generar ítems con cantidad 0, verificar rechazo con error descriptivo

  - [ ]* 2.9 Escribir property test: Movimiento de stock vinculado
    - **Propiedad 8: Movimiento de stock vinculado a la devolución**
    - **Valida: Requisitos 2.4, 2.5**
    - Para toda devolución exitosa con producto trackeable, verificar exactamente un `stock_movement` de tipo `return_in` con `return_id` correcto

- [x] 3. Checkpoint — Verificar lógica de negocio
  - Asegurarse de que todos los tests pasan. Consultar al usuario si hay dudas.

- [x] 4. Server Actions: consultas y listados
  - [x] 4.1 Implementar `getReturns(filters?)` en `lib/actions/returns.ts`
    - Filtros por `saleId`, `dateFrom`, `dateTo`, `reason`, `refundMethod`
    - Ordenado por fecha descendente
    - _Requisitos: 7.1, 7.5_

  - [x] 4.2 Implementar `getReturn(id)` en `lib/actions/returns.ts`
    - Retornar devolución con ítems, nota de crédito y datos de la venta original
    - _Requisitos: 7.4_

  - [x] 4.3 Implementar `getReturnsBySale(saleId)` en `lib/actions/returns.ts`
    - Retornar todas las devoluciones de una venta con sus ítems
    - _Requisitos: 7.2, 7.3_

  - [x] 4.4 Implementar `getCustomerCredit(customerId)` en `lib/actions/returns.ts`
    - Retornar el saldo total de crédito disponible del cliente
    - _Requisitos: 4.2_

  - [ ]* 4.5 Escribir property test: Filtros retornan resultados correctos
    - **Propiedad 10: Filtros retornan solo resultados que cumplen el criterio**
    - **Valida: Requisitos 7.2, 7.5**
    - Para cualquier filtro aplicado, todos los resultados deben cumplir el criterio del filtro

  - [ ]* 4.6 Escribir property test: Estado de venta actualizado
    - **Propiedad 9: Estado de venta actualizado correctamente**
    - **Valida: Requisitos 6.2, 6.3**
    - Devolución total → `payment_status = 'refunded'`; devolución parcial → `payment_status = 'partial_refund'`

- [x] 5. Integración con Cash Register
  - [x] 5.1 Actualizar `lib/actions/cash-register.ts` para incluir devoluciones en efectivo/transferencia como egresos en el cierre de caja
    - Agregar consulta a `sale_returns` filtrada por `refund_method IN ('cash', 'transfer')` en el período del cierre
    - Exponer campo `total_returns_cash` y `total_returns_transfer` en el objeto de cierre
    - _Requisitos: 6.1, 6.5_

  - [x] 5.2 Actualizar el tipo `CashRegisterClosure` en `lib/types/erp.ts` para incluir los nuevos campos de devoluciones
    - _Requisitos: 6.1, 6.5_

  - [ ]* 5.3 Escribir property test: Impacto en cierre de caja
    - **Propiedad (6.1, 6.5): Devoluciones en efectivo/transferencia aparecen como egresos en el cierre**
    - **Valida: Requisitos 6.1, 6.5**
    - Para cualquier conjunto de devoluciones en efectivo, el cierre de caja debe reflejar esos montos como egresos separados

- [x] 6. UI: Listado de devoluciones
  - Crear `app/dashboard/returns/page.tsx` con listado de devoluciones, filtros por fecha/motivo/método y paginación
  - Mostrar número de devolución, venta de origen, cliente, monto, método y fecha
  - _Requisitos: 7.1, 7.5_

- [x] 7. UI: Formulario de nueva devolución
  - [x] 7.1 Crear `components/dashboard/return-items-table.tsx`
    - Tabla con los ítems de la venta original
    - Input de cantidad por ítem (máximo = cantidad disponible para devolver)
    - _Requisitos: 1.2, 1.3_

  - [x] 7.2 Crear `components/dashboard/return-form.tsx`
    - Selector de motivo con campo de texto condicional para motivo `other`
    - Selector de método de devolución
    - Resumen de monto total a devolver
    - _Requisitos: 4.1, 5.1, 5.2_

  - [x] 7.3 Crear `app/dashboard/returns/new/page.tsx`
    - Recibe `saleId` como query param
    - Carga la venta y sus ítems disponibles para devolver
    - Integra `return-items-table` y `return-form`
    - Llama a `createReturn` al enviar
    - _Requisitos: 1.1, 1.2, 1.5, 4.1_

- [x] 8. UI: Detalle de devolución y actualización de detalle de venta
  - [x] 8.1 Crear `app/dashboard/returns/[id]/page.tsx`
    - Mostrar ítems devueltos, monto, método, motivo, nota de crédito y venta de origen
    - _Requisitos: 7.4_

  - [x] 8.2 Actualizar `app/dashboard/sales/[id]/page.tsx`
    - Agregar sección "Devoluciones" que muestra las devoluciones asociadas a la venta
    - Agregar botón "Registrar Devolución" visible solo cuando la venta está `completed` y no fue devuelta en su totalidad
    - _Requisitos: 1.1, 7.3_

- [x] 9. Navegación y acceso
  - Agregar enlace "Devoluciones" en el sidebar de navegación del dashboard
  - _Requisitos: 7.1_

- [x] 10. Checkpoint final — Todos los tests pasan
  - Asegurarse de que todos los tests unitarios y de propiedad pasan. Consultar al usuario si hay dudas.

## Notas

- Las tareas marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido.
- Cada tarea referencia los requisitos específicos para trazabilidad.
- Los property tests usan **fast-check** con mínimo 100 iteraciones.
- Los tests de propiedad se ubican en `__tests__/lib/actions/returns.property.test.ts`.
- Los tests unitarios se ubican en `__tests__/lib/actions/returns.unit.test.ts`.
- La transacción atómica en `createReturn` se implementa con la función RPC de Supabase o con manejo manual de rollback usando try/catch con operaciones compensatorias.
