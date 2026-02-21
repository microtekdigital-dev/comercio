# Requirements Document

## Introduction

Este documento define los requisitos para el módulo de gestión de reparaciones de dispositivos electrónicos (notebooks, tablets, televisores) dentro del ERP SaaS. El módulo permitirá a los comercios registrar, dar seguimiento y gestionar el ciclo completo de reparaciones, desde el ingreso del dispositivo hasta su entrega al cliente, integrándose con los módulos existentes de clientes, productos, caja y cuentas corrientes.

## Glossary

- **Sistema**: El módulo de gestión de reparaciones de dispositivos electrónicos
- **Orden_de_Reparacion**: Registro completo de una reparación que incluye dispositivo, cliente, técnico, diagnóstico, presupuesto y estado
- **Dispositivo**: Equipo electrónico ingresado para reparación (notebook, tablet, televisor, etc.)
- **Tecnico**: Usuario del sistema asignado como responsable de realizar la reparación
- **Estado**: Fase actual del proceso de reparación (Recibido, En diagnóstico, Esperando repuestos, En reparación, Reparado, Entregado, Cancelado)
- **Diagnostico**: Evaluación técnica del problema del dispositivo realizada por el técnico
- **Presupuesto**: Estimación de costos que incluye repuestos y mano de obra
- **Repuesto**: Producto del inventario utilizado en la reparación
- **Mano_de_Obra**: Costo del servicio técnico de reparación
- **Cliente**: Persona o empresa propietaria del dispositivo a reparar
- **Plan_Pro_Reparaciones**: Nivel de suscripción que incluye acceso al módulo de reparaciones
- **Notificacion**: Mensaje enviado al cliente vía SMS o Email sobre el estado de su reparación
- **Historial_de_Reparaciones**: Registro completo de todas las reparaciones asociadas a un cliente

## Requirements

### Requirement 1: Registro de Ingreso de Dispositivos

**User Story:** Como recepcionista del comercio, quiero registrar el ingreso de dispositivos para reparación, para que quede documentada toda la información del equipo y el problema reportado.

#### Acceptance Criteria

1. WHEN un dispositivo es ingresado, THE Sistema SHALL crear una nueva Orden_de_Reparacion con estado "Recibido"
2. WHEN se registra un dispositivo, THE Sistema SHALL capturar tipo de dispositivo, marca, modelo, número de serie y accesorios incluidos
3. WHEN se registra un dispositivo, THE Sistema SHALL vincular la Orden_de_Reparacion a un Cliente existente
4. WHEN se registra un dispositivo, THE Sistema SHALL capturar el problema reportado por el cliente
5. WHEN se registra un dispositivo, THE Sistema SHALL generar un número único de orden secuencial por empresa
6. WHEN se registra un dispositivo, THE Sistema SHALL registrar la fecha y hora de ingreso automáticamente
7. WHERE el dispositivo incluye accesorios, THE Sistema SHALL permitir registrar una lista de accesorios incluidos
8. WHERE se desea documentar visualmente, THE Sistema SHALL permitir adjuntar fotos del dispositivo de forma opcional

### Requirement 2: Gestión de Técnicos

**User Story:** Como administrador del taller, quiero gestionar un catálogo de técnicos, para poder asignarlos a las reparaciones y llevar control de su desempeño.

#### Acceptance Criteria

1. THE Sistema SHALL permitir crear registros de Tecnico con nombre completo y especialidad
2. THE Sistema SHALL permitir editar la información de un Tecnico existente
3. THE Sistema SHALL permitir marcar un Tecnico como activo o inactivo
4. WHEN se lista técnicos para asignación, THE Sistema SHALL mostrar solo los técnicos activos
5. WHEN se visualiza un Tecnico, THE Sistema SHALL mostrar la cantidad de reparaciones asignadas actualmente
6. THE Sistema SHALL mantener los técnicos asociados a la empresa que los creó
7. THE Sistema SHALL validar que el nombre del Tecnico no esté vacío

### Requirement 3: Asignación de Técnico Responsable

**User Story:** Como supervisor del taller, quiero asignar técnicos responsables a las reparaciones, para que quede claro quién debe trabajar en cada dispositivo.

#### Acceptance Criteria

1. WHEN se crea una Orden_de_Reparacion, THE Sistema SHALL permitir asignar un Tecnico responsable
2. WHEN se visualiza una Orden_de_Reparacion, THE Sistema SHALL mostrar el nombre del Tecnico asignado
3. WHEN se requiere cambiar responsable, THE Sistema SHALL permitir reasignar la Orden_de_Reparacion a otro Tecnico
4. THE Sistema SHALL obtener la lista de técnicos activos de la empresa para asignación
5. THE Sistema SHALL permitir crear una Orden_de_Reparacion sin técnico asignado y asignarlo posteriormente

### Requirement 4: Gestión de Estados de Reparación

**User Story:** Como técnico, quiero actualizar el estado de las reparaciones, para que todos sepan en qué fase se encuentra cada dispositivo.

#### Acceptance Criteria

1. WHEN se actualiza una Orden_de_Reparacion, THE Sistema SHALL permitir cambiar el Estado a: Recibido, En diagnóstico, Esperando repuestos, En reparación, Reparado, Entregado, o Cancelado
2. WHEN se cambia el Estado, THE Sistema SHALL registrar la fecha y hora del cambio automáticamente
3. WHEN el Estado cambia a "Reparado", THE Sistema SHALL registrar la fecha de reparación completada
4. WHEN el Estado cambia a "Entregado", THE Sistema SHALL registrar la fecha de entrega real
5. WHILE una Orden_de_Reparacion tiene Estado "Entregado" o "Cancelado", THE Sistema SHALL considerar la orden como cerrada
6. THE Sistema SHALL mantener un historial de cambios de estado con fechas

### Requirement 5: Registro de Diagnóstico y Presupuesto

**User Story:** Como técnico, quiero registrar el diagnóstico y generar un presupuesto, para que el cliente pueda aprobar la reparación conociendo los costos.

#### Acceptance Criteria

1. WHEN se completa el diagnóstico, THE Sistema SHALL permitir registrar el Diagnostico técnico detallado
2. WHEN se registra el Diagnostico, THE Sistema SHALL registrar la fecha de diagnóstico automáticamente
3. WHEN se crea un Presupuesto, THE Sistema SHALL permitir agregar múltiples Repuestos con cantidad y precio unitario
4. WHEN se crea un Presupuesto, THE Sistema SHALL permitir agregar el costo de Mano_de_Obra
5. WHEN se agregan Repuestos al Presupuesto, THE Sistema SHALL calcular el subtotal de repuestos automáticamente
6. WHEN se completa el Presupuesto, THE Sistema SHALL calcular el total sumando repuestos y mano de obra
7. THE Sistema SHALL permitir seleccionar Repuestos del inventario de productos existente
8. THE Sistema SHALL mostrar el stock disponible al seleccionar Repuestos

### Requirement 6: Aprobación del Cliente

**User Story:** Como recepcionista, quiero registrar la aprobación o rechazo del presupuesto por parte del cliente, para proceder con la reparación o cancelarla.

#### Acceptance Criteria

1. WHEN un Presupuesto es presentado al cliente, THE Sistema SHALL permitir registrar la aprobación o rechazo
2. WHEN el cliente aprueba el Presupuesto, THE Sistema SHALL permitir cambiar el Estado a "En reparación"
3. WHEN el cliente rechaza el Presupuesto, THE Sistema SHALL permitir cambiar el Estado a "Cancelado"
4. WHEN se registra la aprobación, THE Sistema SHALL registrar la fecha de aprobación automáticamente
5. THE Sistema SHALL permitir agregar observaciones sobre la decisión del cliente

### Requirement 7: Registro de Repuestos Utilizados

**User Story:** Como técnico, quiero registrar los repuestos que utilizo en la reparación, para que se descuenten del inventario y se facturen al cliente.

#### Acceptance Criteria

1. WHEN se utilizan Repuestos en una reparación, THE Sistema SHALL permitir registrar cada Repuesto con su cantidad
2. WHEN se registra un Repuesto utilizado, THE Sistema SHALL descontar la cantidad del stock del producto en el inventario
3. WHEN se registra un Repuesto utilizado, THE Sistema SHALL vincular el movimiento de stock a la Orden_de_Reparacion
4. WHEN se visualiza una Orden_de_Reparacion, THE Sistema SHALL mostrar la lista de Repuestos utilizados con cantidades y precios
5. IF un Repuesto no tiene stock suficiente, THEN THE Sistema SHALL mostrar una advertencia pero permitir el registro
6. THE Sistema SHALL calcular el costo total de repuestos utilizados automáticamente

### Requirement 8: Generación de Orden de Reparación Imprimible

**User Story:** Como recepcionista, quiero generar una orden de reparación imprimible, para entregarle una copia al cliente al momento del ingreso.

#### Acceptance Criteria

1. WHEN se crea una Orden_de_Reparacion, THE Sistema SHALL generar un documento imprimible con todos los datos
2. WHEN se genera el documento, THE Sistema SHALL incluir: número de orden, fecha de ingreso, datos del cliente, datos del dispositivo, problema reportado, accesorios incluidos, técnico asignado y fecha estimada de entrega
3. WHEN se genera el documento, THE Sistema SHALL incluir los datos de la empresa (nombre, dirección, teléfono)
4. THE Sistema SHALL permitir imprimir o descargar el documento en formato PDF
5. THE Sistema SHALL generar un documento con formato profesional y legible

### Requirement 9: Sistema de Notificaciones al Cliente

**User Story:** Como dueño del comercio, quiero que se notifique automáticamente a los clientes cuando su reparación está lista, para mejorar la comunicación y agilizar las entregas.

#### Acceptance Criteria

1. WHEN el Estado de una Orden_de_Reparacion cambia a "Reparado", THE Sistema SHALL enviar una Notificacion al Cliente
2. WHERE el Cliente tiene email registrado, THE Sistema SHALL enviar la notificación por email
3. WHERE el Cliente tiene teléfono registrado, THE Sistema SHALL enviar la notificación por SMS
4. WHEN se envía una Notificacion, THE Sistema SHALL incluir el número de orden y un mensaje indicando que el dispositivo está listo para retirar
5. WHEN se envía una Notificacion, THE Sistema SHALL registrar la fecha y hora de envío
6. IF el envío de Notificacion falla, THEN THE Sistema SHALL registrar el error y permitir reenvío manual

### Requirement 10: Historial de Reparaciones por Cliente

**User Story:** Como recepcionista, quiero ver el historial completo de reparaciones de un cliente, para conocer los servicios previos y ofrecer mejor atención.

#### Acceptance Criteria

1. WHEN se visualiza un Cliente, THE Sistema SHALL mostrar todas sus Ordenes_de_Reparacion ordenadas por fecha descendente
2. WHEN se visualiza el Historial_de_Reparaciones, THE Sistema SHALL mostrar: número de orden, fecha de ingreso, tipo de dispositivo, estado actual y total cobrado
3. WHEN se selecciona una orden del historial, THE Sistema SHALL permitir ver el detalle completo de esa reparación
4. THE Sistema SHALL calcular y mostrar el total de reparaciones realizadas para el cliente
5. THE Sistema SHALL calcular y mostrar el monto total facturado al cliente en reparaciones

### Requirement 11: Búsqueda y Filtrado de Reparaciones

**User Story:** Como usuario del sistema, quiero buscar y filtrar reparaciones, para encontrar rápidamente órdenes específicas.

#### Acceptance Criteria

1. THE Sistema SHALL permitir buscar Ordenes_de_Reparacion por número de orden
2. THE Sistema SHALL permitir buscar Ordenes_de_Reparacion por nombre del Cliente
3. THE Sistema SHALL permitir buscar Ordenes_de_Reparacion por tipo de Dispositivo
4. THE Sistema SHALL permitir filtrar Ordenes_de_Reparacion por Estado
5. THE Sistema SHALL permitir filtrar Ordenes_de_Reparacion por Tecnico asignado
6. THE Sistema SHALL permitir filtrar Ordenes_de_Reparacion por rango de fechas de ingreso
7. WHEN se aplican filtros, THE Sistema SHALL mostrar los resultados en tiempo real
8. THE Sistema SHALL mostrar el total de órdenes que coinciden con los filtros aplicados

### Requirement 12: Integración con Módulo de Clientes

**User Story:** Como usuario del sistema, quiero que las reparaciones se vinculen con los clientes existentes, para mantener toda la información centralizada.

#### Acceptance Criteria

1. WHEN se crea una Orden_de_Reparacion, THE Sistema SHALL permitir seleccionar un Cliente de la base de datos existente
2. WHEN se crea una Orden_de_Reparacion, THE Sistema SHALL permitir crear un nuevo Cliente si no existe
3. WHEN se visualiza un Cliente, THE Sistema SHALL mostrar un resumen de sus reparaciones activas
4. THE Sistema SHALL utilizar los datos de contacto del Cliente para las notificaciones
5. THE Sistema SHALL mantener la integridad referencial entre Ordenes_de_Reparacion y Clientes

### Requirement 13: Integración con Módulo de Productos (Inventario)

**User Story:** Como técnico, quiero que los repuestos utilizados se descuenten automáticamente del inventario, para mantener el stock actualizado.

#### Acceptance Criteria

1. WHEN se registra un Repuesto utilizado, THE Sistema SHALL descontar la cantidad del stock del producto correspondiente
2. WHEN se registra un Repuesto utilizado, THE Sistema SHALL crear un movimiento de stock con tipo "Reparación"
3. WHEN se cancela una Orden_de_Reparacion con repuestos registrados, THE Sistema SHALL permitir revertir los movimientos de stock
4. THE Sistema SHALL mostrar solo productos marcados como repuestos o permitir usar cualquier producto del inventario
5. THE Sistema SHALL validar que el producto existe en el inventario antes de registrarlo como repuesto utilizado

### Requirement 14: Integración con Módulo de Caja

**User Story:** Como cajero, quiero registrar los pagos de reparaciones en el sistema de caja, para que queden reflejados en el cierre diario.

#### Acceptance Criteria

1. WHEN se cobra una reparación, THE Sistema SHALL permitir registrar el pago con método de pago (Efectivo, Tarjeta, Transferencia)
2. WHEN se registra un pago de reparación, THE Sistema SHALL incluir el monto en el cierre de caja del día
3. WHEN se registra un pago de reparación, THE Sistema SHALL vincular el pago a la Orden_de_Reparacion correspondiente
4. WHEN se visualiza una Orden_de_Reparacion, THE Sistema SHALL mostrar el estado de pago (Pendiente, Pagado parcial, Pagado completo)
5. THE Sistema SHALL permitir registrar pagos parciales en múltiples transacciones
6. THE Sistema SHALL calcular el saldo pendiente automáticamente

### Requirement 15: Integración con Cuentas Corrientes

**User Story:** Como recepcionista, quiero permitir que los clientes paguen reparaciones a cuenta, para ofrecer flexibilidad de pago a clientes de confianza.

#### Acceptance Criteria

1. WHERE un Cliente tiene cuenta corriente habilitada, THE Sistema SHALL permitir registrar la reparación como venta a cuenta
2. WHEN se registra una reparación a cuenta, THE Sistema SHALL crear un movimiento en la cuenta corriente del Cliente
3. WHEN se registra una reparación a cuenta, THE Sistema SHALL incrementar el saldo deudor del Cliente
4. WHEN el Cliente paga la reparación, THE Sistema SHALL registrar el pago en la cuenta corriente
5. WHEN se visualiza la cuenta corriente del Cliente, THE Sistema SHALL mostrar las reparaciones pendientes de pago
6. THE Sistema SHALL aplicar las mismas reglas de límite de crédito que para las ventas regulares

### Requirement 16: Restricción por Plan de Suscripción

**User Story:** Como administrador del sistema, quiero que el módulo de reparaciones esté disponible solo para el Plan Pro Reparaciones, para diferenciar las funcionalidades según el nivel de suscripción.

#### Acceptance Criteria

1. WHERE una empresa tiene Plan_Pro_Reparaciones activo, THE Sistema SHALL mostrar el módulo de reparaciones en el menú de navegación
2. WHERE una empresa NO tiene Plan_Pro_Reparaciones, THE Sistema SHALL ocultar el módulo de reparaciones del menú de navegación
3. WHERE una empresa NO tiene Plan_Pro_Reparaciones, IF un usuario intenta acceder directamente a una URL del módulo de reparaciones, THEN THE Sistema SHALL mostrar un mensaje indicando que la funcionalidad requiere Plan Pro Reparaciones
4. WHEN una empresa cancela su Plan_Pro_Reparaciones, THE Sistema SHALL ocultar el módulo pero mantener los datos de reparaciones existentes
5. WHEN una empresa activa el Plan_Pro_Reparaciones, THE Sistema SHALL mostrar el módulo y permitir acceso a los datos históricos
6. THE Sistema SHALL verificar el plan de suscripción en cada solicitud a endpoints del módulo de reparaciones

### Requirement 17: Observaciones Internas

**User Story:** Como técnico, quiero agregar observaciones internas a las reparaciones, para documentar información que no debe ser visible para el cliente.

#### Acceptance Criteria

1. THE Sistema SHALL permitir agregar observaciones internas a una Orden_de_Reparacion en cualquier momento
2. WHEN se agregan observaciones internas, THE Sistema SHALL registrar la fecha, hora y usuario que las creó
3. WHEN se visualiza una Orden_de_Reparacion, THE Sistema SHALL mostrar todas las observaciones internas en orden cronológico
4. THE Sistema SHALL permitir editar observaciones internas solo al usuario que las creó
5. THE Sistema SHALL diferenciar visualmente las observaciones internas de la información visible para el cliente

### Requirement 18: Reportes de Reparaciones

**User Story:** Como gerente, quiero generar reportes sobre las reparaciones, para analizar el desempeño del taller y tomar decisiones.

#### Acceptance Criteria

1. THE Sistema SHALL generar un reporte de reparaciones pendientes mostrando todas las órdenes no entregadas
2. THE Sistema SHALL generar un reporte de reparaciones por técnico mostrando cantidad y estado de órdenes asignadas a cada Tecnico
3. THE Sistema SHALL generar un reporte de reparaciones por estado mostrando la distribución de órdenes en cada Estado
4. THE Sistema SHALL generar un reporte de rentabilidad por reparación mostrando costos de repuestos, mano de obra y margen
5. THE Sistema SHALL calcular el tiempo promedio de reparación desde ingreso hasta entrega
6. THE Sistema SHALL permitir filtrar todos los reportes por rango de fechas
7. THE Sistema SHALL permitir exportar los reportes a formato Excel o PDF

### Requirement 19: Fecha de Entrega Estimada

**User Story:** Como recepcionista, quiero registrar una fecha estimada de entrega, para informar al cliente cuándo estará listo su dispositivo.

#### Acceptance Criteria

1. WHEN se crea una Orden_de_Reparacion, THE Sistema SHALL permitir registrar una fecha de entrega estimada
2. WHEN se actualiza una Orden_de_Reparacion, THE Sistema SHALL permitir modificar la fecha de entrega estimada
3. WHEN se visualiza una Orden_de_Reparacion, THE Sistema SHALL mostrar la fecha de entrega estimada de forma destacada
4. WHEN se genera el documento imprimible, THE Sistema SHALL incluir la fecha de entrega estimada
5. THE Sistema SHALL permitir filtrar órdenes por fecha de entrega estimada vencida
6. THE Sistema SHALL calcular y mostrar si una orden está retrasada comparando la fecha estimada con la fecha actual

### Requirement 20: Validación de Datos Obligatorios

**User Story:** Como usuario del sistema, quiero que se validen los datos obligatorios al crear reparaciones, para asegurar la calidad de la información registrada.

#### Acceptance Criteria

1. WHEN se crea una Orden_de_Reparacion, THE Sistema SHALL requerir: Cliente, tipo de dispositivo, marca, modelo y problema reportado
2. IF faltan datos obligatorios, THEN THE Sistema SHALL mostrar mensajes de error específicos indicando qué campos son requeridos
3. WHEN se registra un Presupuesto, THE Sistema SHALL requerir al menos un Repuesto o un monto de Mano_de_Obra
4. WHEN se registra un pago, THE Sistema SHALL requerir: monto y método de pago
5. THE Sistema SHALL validar que los montos ingresados sean valores numéricos positivos
6. THE Sistema SHALL validar que las fechas estimadas de entrega sean posteriores a la fecha de ingreso

### Requirement 21: Seguridad y Permisos

**User Story:** Como administrador de la empresa, quiero que solo usuarios autorizados puedan acceder al módulo de reparaciones, para proteger la información sensible.

#### Acceptance Criteria

1. THE Sistema SHALL verificar que el usuario pertenece a una empresa con Plan_Pro_Reparaciones activo antes de permitir acceso
2. THE Sistema SHALL aplicar Row Level Security para que cada empresa solo vea sus propias Ordenes_de_Reparacion
3. THE Sistema SHALL permitir que todos los usuarios de la empresa con Plan_Pro_Reparaciones puedan crear y editar reparaciones
4. THE Sistema SHALL registrar el usuario que creó cada Orden_de_Reparacion
5. THE Sistema SHALL registrar el usuario que realizó cada modificación a una Orden_de_Reparacion
6. THE Sistema SHALL prevenir que usuarios de una empresa accedan a reparaciones de otras empresas
