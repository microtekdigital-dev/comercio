# Plan de Implementación: Descuentos en Ventas

## Visión General

Implementación incremental del módulo de descuentos en ventas. Se comienza por la lógica pura de cálculo y validación (sin dependencias de base de datos), luego se integra con las server actions existentes, y finalmente se actualiza la UI. No se requieren migraciones de esquema para los campos principales — solo se agrega `total_discounts` al cierre de caja.

## Tareas

- [x] 1. Tipos TypeScript y migración SQL
  - Agregar tipo `DiscountType = 'percentage' | 'fixed'` en `lib/types/erp.ts`
  - Agregar campos `global_discount_type?: DiscountType` y `global_discount_value?: number` a `SaleFormData`
  - Agregar campos `discount_type?: DiscountType` y `discount_fixed?: number` a `SaleItemFormData`
  - Agregar interfaces `ItemTotals` y `SaleTotals` en `lib/types/erp.ts`
  - Crear script `scripts/231_add_total_discounts_to_closures.sql` con `ALTER TABLE cash_register_closures ADD COLUMN IF NOT EXISTS total_discounts NUMERIC(12,2) NOT NULL DEFAULT 0`
  - _Requisitos: 1.1, 1.2, 2.1, 2.2, 4.5, 4.6, 5.5_

- [x] 2. Utilidades de cálculo y validación de descuentos
  - [x] 2.1 Crear `lib/utils/discount-calculator.ts` con las funciones puras de cálculo
    - Implementar `validateItemDiscount(unitPrice, quantity, discountPercent)`: rechaza porcentaje fuera de [0,100] o monto fijo negativo/mayor al subtotal
    - Implementar `calculateItemDiscount(unitPrice, quantity, discountPercent)`: retorna monto de descuento del ítem
    - Implementar `calculateItemTotals(item: SaleItemFormData): ItemTotals`: calcula subtotal, descuento, subtotal neto, impuesto y total del ítem
    - Implementar `validateGlobalDiscount(subtotal, discountType, discountValue)`: rechaza porcentaje fuera de [0,100] o monto fijo negativo/mayor al subtotal
    - Implementar `calculateGlobalDiscount(subtotal, discountType, discountValue)`: retorna monto de descuento global
    - Implementar `calculateSaleTotals(items, globalDiscountType, globalDiscountValue): SaleTotals`: orquesta todos los cálculos y valida que `total > 0`
    - _Requisitos: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 4.1, 4.2, 4.3, 4.4, 4.7, 6.1, 6.2, 6.4, 6.5_

  - [ ]* 2.2 Escribir property test: Validación de rango de descuentos
    - **Propiedad 1: Validación de rango de descuentos**
    - **Valida: Requisitos 1.1, 1.2, 1.7, 1.8, 2.1, 2.2, 2.7, 2.8, 6.1, 6.2**
    - Generar porcentajes aleatorios (incluyendo negativos y > 100) y montos fijos (incluyendo negativos y mayores al subtotal), verificar que los válidos son aceptados y los inválidos rechazados

  - [ ]* 2.3 Escribir property test: Cálculo correcto del subtotal por ítem
    - **Propiedad 2: Cálculo correcto del subtotal por ítem con descuento**
    - **Valida: Requisitos 1.3, 1.4, 1.5, 1.6**
    - Generar ítems con precio, cantidad y porcentaje de descuento aleatorios válidos, verificar que `subtotal_neto = precio × cantidad × (1 − d/100)` y que `tax = subtotal_neto × tax_rate`

  - [ ]* 2.4 Escribir property test: Cálculo correcto del total de la venta
    - **Propiedad 3: Cálculo correcto del total de la venta**
    - **Valida: Requisitos 2.3, 2.4, 2.5, 4.1, 4.2, 4.3, 4.4**
    - Generar ventas con múltiples ítems y descuento global aleatorio válido, verificar que `total = subtotal − discount_amount + tax_amount`

  - [ ]* 2.5 Escribir property test: Invariante de total positivo
    - **Propiedad 4: Invariante de total positivo**
    - **Valida: Requisitos 2.6, 3.6, 4.7**
    - Generar ventas con descuentos válidos (dentro de rango), verificar que `total > 0` siempre

  - [ ]* 2.6 Escribir property test: Idempotencia de descuento cero
    - **Propiedad 7: Descuento cero es idempotente**
    - **Valida: Requisitos 6.4, 6.5**
    - Generar ítems y ventas con descuento = 0, verificar que los totales son idénticos a los calculados sin descuento

- [x] 3. Checkpoint — Verificar lógica de cálculo
  - Asegurarse de que todos los tests de `discount-calculator` pasan. Consultar al usuario si hay dudas.

- [x] 4. Integración con Server Action de ventas (`lib/actions/sales.ts`)
  - [x] 4.1 Actualizar `createSale` en `lib/actions/sales.ts`
    - Recibir `global_discount_type` y `global_discount_value` desde `SaleFormData`
    - Reemplazar el cálculo manual de totales por llamada a `calculateSaleTotals` de `lib/utils/discount-calculator.ts`
    - Validar todos los descuentos antes de insertar en la base de datos
    - Persistir `discount_amount` calculado en `sales` y `discount_percent` en cada `sale_item`
    - _Requisitos: 1.3, 1.4, 1.5, 1.6, 2.3, 2.4, 2.5, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 6.3, 6.6_

  - [ ]* 4.2 Escribir property test: Persistencia de descuentos (round-trip)
    - **Propiedad 5: Persistencia de descuentos (round-trip)**
    - **Valida: Requisitos 3.5, 4.5, 4.6**
    - Generar ventas con descuentos aleatorios válidos, crear la venta, consultar la venta persistida, verificar que `discount_percent` por ítem y `discount_amount` global coinciden con los valores enviados

  - [ ]* 4.3 Escribir property test: Atomicidad ante descuentos inválidos
    - **Propiedad 6: Atomicidad ante descuentos inválidos**
    - **Valida: Requisito 6.3**
    - Generar ventas con al menos un descuento inválido, verificar que `createSale` retorna error y no persiste ningún cambio

- [x] 5. Integración con Server Action del POS (`lib/actions/pos.ts`)
  - [x] 5.1 Actualizar `createPOSSale` en `lib/actions/pos.ts`
    - Extender `POSCartItem` para soportar `discount_type` y `discount_fixed` por ítem
    - Reemplazar el cálculo de `discountAmount` por llamada a `calculateSaleTotals`
    - Validar descuentos por ítem y descuento global antes de crear la venta
    - Persistir `discount_percent` en cada `sale_item` creado desde el POS
    - _Requisitos: 3.1, 3.2, 3.4, 3.5, 3.6_

  - [x] 5.2 Actualizar `validatePOSCart` en `lib/actions/pos.ts`
    - Agregar validación de que el descuento global no supera el subtotal del carrito
    - Agregar validación de que cada descuento por ítem es válido
    - _Requisitos: 3.4, 3.6_

- [x] 6. Integración con cierre de caja (`lib/actions/cash-register.ts`)
  - Actualizar la función de cierre de caja para calcular y persistir `total_discounts`
  - Agregar consulta que suma `discount_amount` de todas las ventas del período del cierre
  - Actualizar el tipo `CashRegisterClosure` en `lib/types/erp.ts` para incluir `total_discounts: number`
  - _Requisitos: 5.1, 5.5_

  - [ ]* 6.1 Escribir property test: Total de descuentos en cierre de caja
    - **Propiedad 8: Total de descuentos en cierre de caja**
    - **Valida: Requisito 5.5**
    - Generar conjuntos de ventas con descuentos aleatorios, calcular el cierre de caja, verificar que `total_discounts = Σ discount_amount`

- [x] 7. Checkpoint — Verificar integración con ventas y POS
  - Asegurarse de que todos los tests pasan. Consultar al usuario si hay dudas.

- [x] 8. UI: Formulario de nueva venta con descuentos
  - [x] 8.1 Actualizar el formulario de ítems en `app/dashboard/sales/new/page.tsx`
    - Agregar selector de tipo de descuento (`%` o `$`) y campo de valor por ítem
    - Mostrar subtotal neto del ítem en tiempo real al cambiar el descuento
    - _Requisitos: 1.1, 1.2_

  - [x] 8.2 Agregar sección de descuento global en el formulario de venta
    - Selector de tipo de descuento global (`%` o `$`) y campo de valor
    - Mostrar desglose: subtotal, descuento global, impuestos, total
    - _Requisitos: 2.1, 2.2, 4.1, 4.2, 4.3, 4.4_

- [ ] 9. UI: Detalle de venta con desglose de descuentos
  - Actualizar `app/dashboard/sales/[id]/page.tsx` para mostrar el desglose completo
  - Mostrar: subtotal por ítem, descuento por ítem, subtotal de la venta, descuento global, impuestos y total final
  - Mostrar badge o indicador visual cuando una venta tiene descuentos aplicados
  - _Requisitos: 5.2, 5.3_

- [ ] 10. UI: Descuentos en el POS
  - [ ] 10.1 Actualizar `components/dashboard/pos/shopping-cart.tsx`
    - Agregar input de descuento por ítem (tipo + valor) en cada fila del carrito
    - Recalcular subtotal del ítem en tiempo real al cambiar el descuento
    - _Requisitos: 3.1, 3.3_

  - [ ] 10.2 Agregar descuento global en el POS
    - Agregar selector de tipo y campo de valor para el descuento global en el carrito
    - Mostrar desglose actualizado en tiempo real: subtotal, descuento, impuestos, total
    - _Requisitos: 3.2, 3.3_

  - [ ] 10.3 Actualizar `components/dashboard/pos/payment-modal.tsx`
    - Mostrar desglose de descuentos en el resumen de pago antes de confirmar
    - _Requisitos: 3.5_

- [ ] 11. UI: Ticket e impresión con descuentos
  - Actualizar `components/dashboard/invoice-print.tsx` para incluir descuentos por ítem y descuento global en el ticket impreso
  - Actualizar `generatePOSTicket` en `lib/actions/pos.ts` para mostrar la línea de descuento global si `discount_amount > 0`
  - _Requisitos: 5.3_

- [ ] 12. Checkpoint final — Todos los tests pasan
  - Asegurarse de que todos los tests unitarios y de propiedad pasan. Consultar al usuario si hay dudas.

## Notas

- Las tareas marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido.
- Cada tarea referencia los requisitos específicos para trazabilidad.
- Los property tests usan **fast-check** con mínimo 100 iteraciones.
- Los tests de propiedad se ubican en `__tests__/lib/actions/descuentos-ventas.property.test.ts`.
- Los tests unitarios se ubican en `__tests__/lib/utils/discount-calculator.unit.test.ts`.
- No se requiere migración de esquema para los campos principales (`discount_percent` y `discount_amount` ya existen).
- La lógica de cálculo en `lib/utils/discount-calculator.ts` es pura (sin efectos secundarios) para facilitar el testing.
- El campo `discount_percent` en `sale_items` almacena el porcentaje; para descuentos de tipo `fixed`, se convierte a porcentaje equivalente antes de persistir.
