# Documento de Requisitos: Descuentos en Ventas

## Introducción

Este módulo permite aplicar descuentos a las ventas del ERP SaaS para negocios minoristas y de reparaciones. Los descuentos pueden aplicarse a ítems individuales (por porcentaje o monto fijo) y al total de la venta (por porcentaje o monto fijo). La funcionalidad está disponible tanto en el flujo de ventas estándar como en el Punto de Venta (POS). Los descuentos impactan correctamente en los reportes de caja y en los cierres, reduciendo el ingreso real registrado.

## Glosario

- **Discount_Manager**: Componente del sistema responsable de calcular y validar los descuentos aplicados a ventas e ítems.
- **Sale**: Venta registrada en el sistema con sus ítems, pagos y totales calculados.
- **Sale_Item**: Ítem individual dentro de una venta, con precio unitario, cantidad, impuesto y descuento propio.
- **Item_Discount**: Descuento aplicado a un ítem individual de la venta, expresado como porcentaje (0–100) o monto fijo.
- **Global_Discount**: Descuento aplicado sobre el total de la venta (después de calcular los descuentos por ítem), expresado como porcentaje (0–100) o monto fijo.
- **POS**: Punto de Venta (Point of Sale), módulo de venta rápida del sistema.
- **POS_Cart**: Carrito de compras del POS con ítems, descuento global y totales calculados.
- **Cash_Register**: Módulo de caja registradora del sistema.
- **Discount_Type**: Tipo de descuento: `percentage` (porcentaje) o `fixed` (monto fijo).

---

## Requisitos

### Requisito 1: Descuento por Ítem en Ventas

**Historia de Usuario:** Como empleado, quiero aplicar un descuento individual a cada ítem de una venta, para poder ofrecer precios especiales por producto sin afectar el resto de la venta.

#### Criterios de Aceptación

1. WHEN se crea o edita un ítem de venta, THE Discount_Manager SHALL permitir ingresar un descuento de tipo `percentage` con valor entre 0 y 100 inclusive.
2. WHEN se crea o edita un ítem de venta, THE Discount_Manager SHALL permitir ingresar un descuento de tipo `fixed` con valor entre 0 y el precio unitario del ítem inclusive.
3. WHEN se aplica un descuento por ítem, THE Discount_Manager SHALL calcular el subtotal del ítem como: `(precio_unitario × cantidad) − descuento_aplicado`.
4. WHEN el tipo de descuento es `percentage`, THE Discount_Manager SHALL calcular el monto de descuento del ítem como: `precio_unitario × cantidad × (porcentaje / 100)`.
5. WHEN el tipo de descuento es `fixed`, THE Discount_Manager SHALL aplicar el monto fijo directamente sobre el subtotal del ítem antes de impuestos.
6. THE Discount_Manager SHALL calcular el impuesto del ítem sobre el subtotal ya descontado, no sobre el precio original.
7. IF el descuento de tipo `percentage` es menor a 0 o mayor a 100, THEN THE Discount_Manager SHALL rechazar el valor con un mensaje descriptivo.
8. IF el descuento de tipo `fixed` supera el precio unitario multiplicado por la cantidad del ítem, THEN THE Discount_Manager SHALL rechazar el valor con un mensaje descriptivo.

---

### Requisito 2: Descuento Global sobre el Total de la Venta

**Historia de Usuario:** Como empleado, quiero aplicar un descuento global sobre el total de la venta, para ofrecer promociones o acuerdos especiales al cliente sin modificar cada ítem individualmente.

#### Criterios de Aceptación

1. WHEN se registra una venta, THE Discount_Manager SHALL permitir ingresar un descuento global de tipo `percentage` con valor entre 0 y 100 inclusive.
2. WHEN se registra una venta, THE Discount_Manager SHALL permitir ingresar un descuento global de tipo `fixed` con valor entre 0 y el subtotal de la venta (suma de subtotales de ítems ya descontados) inclusive.
3. WHEN se aplica un descuento global de tipo `percentage`, THE Discount_Manager SHALL calcular el monto de descuento global como: `subtotal_ítems × (porcentaje / 100)`.
4. WHEN se aplica un descuento global de tipo `fixed`, THE Discount_Manager SHALL aplicar el monto fijo directamente sobre el subtotal de ítems.
5. THE Discount_Manager SHALL calcular el total final de la venta como: `subtotal_ítems − descuento_global + impuestos_totales`.
6. IF la combinación de descuentos por ítem y descuento global resulta en un total de venta menor o igual a cero, THEN THE Discount_Manager SHALL rechazar la operación con un mensaje descriptivo.
7. IF el descuento global de tipo `percentage` es menor a 0 o mayor a 100, THEN THE Discount_Manager SHALL rechazar el valor con un mensaje descriptivo.
8. IF el descuento global de tipo `fixed` supera el subtotal de la venta, THEN THE Discount_Manager SHALL rechazar el valor con un mensaje descriptivo.

---

### Requisito 3: Descuentos en el POS

**Historia de Usuario:** Como cajero, quiero aplicar descuentos por ítem y descuentos globales directamente desde el POS, para agilizar el proceso de venta con promociones sin salir del punto de venta.

#### Criterios de Aceptación

1. WHEN un ítem es agregado al POS_Cart, THE Discount_Manager SHALL permitir ingresar un descuento por ítem de tipo `percentage` o `fixed` para ese ítem.
2. WHEN se procesa una venta desde el POS, THE Discount_Manager SHALL permitir ingresar un descuento global de tipo `percentage` o `fixed` sobre el total del carrito.
3. WHEN se aplica un descuento en el POS_Cart, THE Discount_Manager SHALL recalcular en tiempo real el subtotal del ítem afectado y el total del carrito.
4. WHEN se valida el POS_Cart antes del cobro, THE Discount_Manager SHALL verificar que el descuento global no supera el subtotal del carrito.
5. WHEN se completa una venta desde el POS con descuentos, THE Discount_Manager SHALL persistir los descuentos por ítem en `sale_items.discount_percent` y el descuento global en `sales.discount_amount`.
6. IF el descuento global en el POS resulta en un total de carrito menor o igual a cero, THEN THE Discount_Manager SHALL rechazar la operación con un mensaje descriptivo.

---

### Requisito 4: Cálculo Correcto de Totales

**Historia de Usuario:** Como contador, quiero que el sistema calcule correctamente los totales de la venta considerando todos los descuentos aplicados, para tener información financiera precisa.

#### Criterios de Aceptación

1. THE Discount_Manager SHALL calcular el `subtotal` de la venta como la suma de los subtotales de todos los ítems después de aplicar sus descuentos individuales.
2. THE Discount_Manager SHALL calcular el `discount_amount` de la venta como el monto total del descuento global aplicado.
3. THE Discount_Manager SHALL calcular el `tax_amount` de la venta como la suma de los impuestos de todos los ítems, calculados sobre sus subtotales ya descontados.
4. THE Discount_Manager SHALL calcular el `total` de la venta como: `subtotal − discount_amount + tax_amount`.
5. WHEN se persiste una venta, THE Discount_Manager SHALL almacenar en `sale_items` el campo `discount_percent` para descuentos por ítem expresados como porcentaje.
6. WHEN se persiste una venta, THE Discount_Manager SHALL almacenar en `sales` el campo `discount_amount` con el monto absoluto del descuento global aplicado.
7. THE Discount_Manager SHALL garantizar que el `total` de la venta sea siempre mayor a cero.

---

### Requisito 5: Impacto en Reportes y Caja

**Historia de Usuario:** Como gerente, quiero que los descuentos aplicados se reflejen correctamente en los reportes de caja y ventas, para tener información financiera precisa sobre los ingresos reales.

#### Criterios de Aceptación

1. WHEN se consulta el reporte de cierre de caja, THE Cash_Register SHALL reflejar el total de ventas neto (después de descuentos) como ingreso del período.
2. WHEN se consulta el listado de ventas, THE Discount_Manager SHALL mostrar el monto de descuento aplicado en cada venta que tenga `discount_amount > 0`.
3. WHEN se consulta el detalle de una venta, THE Discount_Manager SHALL mostrar el desglose: subtotal por ítem, descuento por ítem, subtotal de la venta, descuento global, impuestos y total final.
4. WHEN se generan estadísticas del dashboard, THE Discount_Manager SHALL usar el `total` neto de cada venta (ya descontado) para calcular los ingresos del período.
5. WHEN se genera un cierre de caja, THE Cash_Register SHALL incluir el campo `total_discounts` con la suma de todos los `discount_amount` de las ventas del período para facilitar la auditoría.

---

### Requisito 6: Validaciones de Integridad

**Historia de Usuario:** Como desarrollador, quiero que el sistema valide la integridad de todos los descuentos aplicados, para evitar inconsistencias financieras en las ventas.

#### Criterios de Aceptación

1. IF un porcentaje de descuento (por ítem o global) es un valor no numérico, THEN THE Discount_Manager SHALL rechazar el valor con un mensaje descriptivo.
2. IF un monto fijo de descuento (por ítem o global) es un valor negativo, THEN THE Discount_Manager SHALL rechazar el valor con un mensaje descriptivo.
3. THE Discount_Manager SHALL validar todos los descuentos antes de persistir la venta, de modo que si cualquier descuento es inválido, ningún cambio sea persistido.
4. WHEN se aplica un descuento de tipo `percentage` con valor 0, THE Discount_Manager SHALL tratar la operación como sin descuento y no modificar el precio.
5. WHEN se aplica un descuento de tipo `fixed` con valor 0, THE Discount_Manager SHALL tratar la operación como sin descuento y no modificar el precio.
6. THE Discount_Manager SHALL verificar que el usuario autenticado pertenece a la misma empresa de la venta antes de aplicar cualquier descuento.
