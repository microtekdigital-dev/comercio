# Documento de Requisitos: Devoluciones y Cambios de Ventas

## Introducción

Este módulo permite registrar devoluciones totales o parciales de ventas existentes en el ERP SaaS para negocios minoristas y de reparaciones. Al procesar una devolución, el sistema repone automáticamente el stock de los productos devueltos, genera una nota de crédito asociada a la venta original, y registra el impacto financiero en los reportes de caja y ventas. El monto devuelto puede aplicarse como crédito al cliente o devolverse en efectivo o transferencia.

## Glosario

- **Return**: Registro de devolución total o parcial de una venta existente.
- **Return_Item**: Ítem individual dentro de una devolución, con cantidad y monto devuelto.
- **Credit_Note**: Nota de crédito generada automáticamente al procesar una devolución, asociada a la venta original.
- **Customer_Credit**: Saldo a favor del cliente generado por una nota de crédito, aplicable a futuras ventas.
- **Return_Manager**: Componente del sistema responsable de orquestar el proceso de devolución.
- **Stock_Manager**: Componente del sistema responsable de actualizar el inventario.
- **Cash_Register**: Módulo de caja registradora existente en el sistema.
- **Sale**: Venta existente en el sistema con sus ítems y pagos asociados.
- **Refund_Method**: Método por el cual se devuelve el dinero al cliente (efectivo, transferencia o crédito).

---

## Requisitos

### Requisito 1: Registrar una Devolución

**User Story:** Como empleado, quiero registrar una devolución total o parcial de una venta existente, para poder procesar correctamente los reclamos de clientes.

#### Criterios de Aceptación

1. WHEN un empleado selecciona una venta con estado `completed`, THE Return_Manager SHALL permitir iniciar el proceso de devolución.
2. WHEN se inicia una devolución, THE Return_Manager SHALL mostrar todos los ítems de la venta original con sus cantidades disponibles para devolver.
3. WHEN un empleado selecciona ítems a devolver, THE Return_Manager SHALL validar que la cantidad a devolver no supere la cantidad originalmente vendida menos las devoluciones previas del mismo ítem.
4. WHEN se registra una devolución, THE Return_Manager SHALL requerir que al menos un ítem tenga cantidad mayor a cero.
5. WHEN se registra una devolución, THE Return_Manager SHALL requerir la selección de un motivo de devolución.
6. IF una venta tiene estado `cancelled` o `draft`, THEN THE Return_Manager SHALL rechazar el inicio de la devolución con un mensaje descriptivo.
7. WHEN se registra una devolución exitosamente, THE Return_Manager SHALL asignar un número de devolución único con prefijo `DEV-`.

---

### Requisito 2: Reposición Automática de Stock

**User Story:** Como encargado de inventario, quiero que al procesar una devolución el stock se reponga automáticamente, para mantener el inventario actualizado sin intervención manual.

#### Criterios de Aceptación

1. WHEN una devolución es registrada exitosamente, THE Stock_Manager SHALL incrementar el stock del producto devuelto en la cantidad indicada.
2. WHEN el producto devuelto tiene variantes, THE Stock_Manager SHALL incrementar el stock de la variante específica devuelta.
3. WHEN el producto devuelto no tiene seguimiento de inventario (`track_inventory = false`), THE Stock_Manager SHALL omitir la actualización de stock sin generar error.
4. WHEN se repone stock por devolución, THE Stock_Manager SHALL registrar un movimiento de stock con tipo `return_in` en la tabla `stock_movements`, vinculado al ID de la devolución.
5. THE Stock_Manager SHALL registrar en el movimiento de stock el stock anterior y el stock posterior a la devolución.

---

### Requisito 3: Generación de Nota de Crédito

**User Story:** Como contador, quiero que se genere automáticamente una nota de crédito al procesar una devolución, para tener trazabilidad contable del proceso.

#### Criterios de Aceptación

1. WHEN una devolución es registrada exitosamente, THE Return_Manager SHALL generar una nota de crédito asociada a la venta original.
2. THE Return_Manager SHALL calcular el monto de la nota de crédito como la suma de los totales de los ítems devueltos, respetando los descuentos y tasas de impuesto originales de cada ítem.
3. THE Return_Manager SHALL vincular la nota de crédito al ID de la venta original y al ID de la devolución.
4. WHEN se consulta una nota de crédito, THE Return_Manager SHALL exponer el número de nota de crédito, monto, fecha, venta de origen y estado (`applied` o `pending`).
5. THE Return_Manager SHALL asignar un número de nota de crédito único con prefijo `NC-`.

---

### Requisito 4: Métodos de Devolución del Monto

**User Story:** Como cajero, quiero poder elegir cómo devolver el dinero al cliente (efectivo, transferencia o crédito), para adaptarme a las necesidades del negocio y del cliente.

#### Criterios de Aceptación

1. WHEN se procesa una devolución, THE Return_Manager SHALL requerir la selección de un método de devolución: `cash` (efectivo), `transfer` (transferencia) o `customer_credit` (crédito al cliente).
2. WHERE el método de devolución es `customer_credit`, THE Return_Manager SHALL crear o incrementar el saldo de crédito del cliente en la tabla correspondiente.
3. WHERE el método de devolución es `cash` o `transfer`, THE Return_Manager SHALL registrar un movimiento negativo en la caja del día, vinculado a la devolución.
4. WHERE el método de devolución es `customer_credit`, THE Return_Manager SHALL marcar la nota de crédito con estado `applied`.
5. WHEN el cliente no está asociado a la venta original y el método seleccionado es `customer_credit`, THEN THE Return_Manager SHALL rechazar la operación con un mensaje indicando que se requiere un cliente para aplicar crédito.

---

### Requisito 5: Motivo de Devolución

**User Story:** Como gerente, quiero registrar el motivo de cada devolución, para poder analizar patrones y tomar decisiones de mejora.

#### Criterios de Aceptación

1. THE Return_Manager SHALL requerir la selección de un motivo de devolución de una lista predefinida: `defective_product` (producto defectuoso), `wrong_product` (producto equivocado), `customer_changed_mind` (cambio de opinión del cliente), `damaged_in_transit` (dañado en tránsito), `other` (otro).
2. WHERE el motivo seleccionado es `other`, THE Return_Manager SHALL requerir un campo de texto libre con descripción adicional de al menos 10 caracteres.
3. THE Return_Manager SHALL persistir el motivo y la descripción adicional junto al registro de la devolución.

---

### Requisito 6: Impacto en Reportes de Caja y Ventas

**User Story:** Como gerente, quiero que las devoluciones se reflejen en los reportes de caja y ventas, para tener información financiera precisa.

#### Criterios de Aceptación

1. WHEN se consulta el reporte de cierre de caja de un día, THE Cash_Register SHALL incluir el total de devoluciones en efectivo y transferencia como egresos del período.
2. WHEN se consulta el listado de ventas, THE Return_Manager SHALL mostrar el estado de pago `refunded` en las ventas que tuvieron una devolución total.
3. WHEN una venta tiene devolución parcial, THE Return_Manager SHALL actualizar el estado de pago de la venta a `partial_refund`.
4. WHEN se consultan las estadísticas del dashboard, THE Return_Manager SHALL descontar el monto de las devoluciones del total de ingresos del período.
5. WHEN se genera un cierre de caja, THE Cash_Register SHALL separar el monto de devoluciones en efectivo del resto de los egresos para facilitar la auditoría.

---

### Requisito 7: Consulta y Listado de Devoluciones

**User Story:** Como empleado, quiero poder consultar el historial de devoluciones, para hacer seguimiento y auditoría de las operaciones.

#### Criterios de Aceptación

1. THE Return_Manager SHALL proveer un listado de todas las devoluciones de la empresa, ordenado por fecha descendente.
2. WHEN se filtra el listado por venta de origen, THE Return_Manager SHALL retornar únicamente las devoluciones asociadas a esa venta.
3. WHEN se consulta el detalle de una venta, THE Return_Manager SHALL mostrar todas las devoluciones asociadas a esa venta con sus ítems, montos y motivos.
4. WHEN se consulta el detalle de una devolución, THE Return_Manager SHALL mostrar los ítems devueltos, el monto total, el método de devolución, el motivo y la nota de crédito asociada.
5. THE Return_Manager SHALL permitir filtrar el listado de devoluciones por rango de fechas, motivo y método de devolución.

---

### Requisito 8: Validaciones de Integridad

**User Story:** Como desarrollador, quiero que el sistema valide la integridad de los datos en cada devolución, para evitar inconsistencias en el inventario y en las finanzas.

#### Criterios de Aceptación

1. IF el monto total de devoluciones previas de una venta ya iguala el total de la venta original, THEN THE Return_Manager SHALL rechazar nuevas devoluciones sobre esa venta con un mensaje descriptivo.
2. IF un ítem de la devolución referencia un producto que ya no existe en el sistema, THEN THE Return_Manager SHALL rechazar la devolución con un mensaje descriptivo.
3. THE Return_Manager SHALL ejecutar la creación de la devolución, la actualización de stock y la generación de la nota de crédito dentro de una transacción atómica, de modo que si cualquier paso falla, ningún cambio sea persistido.
4. WHEN se intenta registrar una devolución, THE Return_Manager SHALL verificar que el usuario autenticado pertenece a la misma empresa que la venta original.
5. IF el monto a devolver es menor o igual a cero, THEN THE Return_Manager SHALL rechazar la operación con un mensaje descriptivo.
