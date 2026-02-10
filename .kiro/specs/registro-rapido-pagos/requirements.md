# Documento de Requisitos

## Introducción

Este documento especifica los requisitos para mejorar el flujo de trabajo de registro de pagos en la aplicación ERP SaaS. Actualmente, después de crear una venta, el usuario debe navegar manualmente a la lista de ventas para registrar el pago. La mejora propuesta permite registrar pagos inmediatamente después de crear una venta mediante un modal automático, manteniendo también el método existente como alternativa.

## Glosario

- **Sistema**: La aplicación ERP SaaS construida con Next.js 14+, TypeScript, Supabase y shadcn/ui
- **Usuario**: Persona que utiliza el sistema para gestionar ventas y pagos
- **Venta**: Registro de una transacción comercial con un cliente
- **Pago**: Registro de dinero recibido asociado a una venta
- **Modal_de_Pago**: Ventana emergente que permite registrar pagos inmediatamente después de crear una venta
- **Estado_de_Venta**: Clasificación del estado de pago de una venta (pendiente, parcial, pagado)
- **Método_de_Pago**: Forma en que se recibe el pago (efectivo, tarjeta, transferencia, etc.)
- **Lista_de_Ventas**: Vista existente que muestra todas las ventas y permite gestionar pagos

## Requisitos

### Requisito 1: Mostrar Modal Automático

**User Story:** Como usuario, quiero que aparezca automáticamente un modal de registro de pago después de crear una venta, para poder registrar el pago inmediatamente sin navegar a otra página.

#### Criterios de Aceptación

1. CUANDO una venta se crea exitosamente, EL Sistema DEBERÁ mostrar el Modal_de_Pago automáticamente
2. CUANDO el Modal_de_Pago se muestra, EL Sistema DEBERÁ pre-llenar todos los campos con la información de la venta (monto, cliente, fecha)
3. CUANDO el Modal_de_Pago está abierto, EL Sistema DEBERÁ bloquear la interacción con el contenido de fondo
4. CUANDO el usuario cierra el Modal_de_Pago sin registrar pago, EL Sistema DEBERÁ mantener la venta en estado pendiente

### Requisito 2: Pre-llenar Información de Venta

**User Story:** Como usuario, quiero que el modal de pago muestre automáticamente la información de la venta que acabo de crear, para no tener que ingresarla manualmente.

#### Criterios de Aceptación

1. CUANDO el Modal_de_Pago se muestra, EL Sistema DEBERÁ mostrar el monto total de la venta
2. CUANDO el Modal_de_Pago se muestra, EL Sistema DEBERÁ mostrar el nombre del cliente
3. CUANDO el Modal_de_Pago se muestra, EL Sistema DEBERÁ mostrar el número o identificador de la venta
4. CUANDO el Modal_de_Pago se muestra, EL Sistema DEBERÁ pre-seleccionar el monto total como monto de pago por defecto
5. CUANDO el Modal_de_Pago se muestra, EL Sistema DEBERÁ permitir al usuario modificar el monto de pago para pagos parciales

### Requisito 3: Registrar Pago Inmediato

**User Story:** Como usuario, quiero poder registrar un pago completo o parcial directamente desde el modal, para completar la transacción rápidamente.

#### Criterios de Aceptación

1. CUANDO el usuario ingresa un monto de pago válido y selecciona un Método_de_Pago, EL Sistema DEBERÁ permitir confirmar el registro
2. CUANDO el usuario confirma el registro de pago, EL Sistema DEBERÁ guardar el pago en la base de datos
3. CUANDO un pago se registra exitosamente, EL Sistema DEBERÁ actualizar el Estado_de_Venta según el monto pagado
4. CUANDO un pago se registra exitosamente, EL Sistema DEBERÁ cerrar el Modal_de_Pago automáticamente
5. CUANDO un pago se registra exitosamente, EL Sistema DEBERÁ mostrar un mensaje de confirmación al usuario

### Requisito 4: Soportar Múltiples Métodos de Pago

**User Story:** Como usuario, quiero poder seleccionar diferentes métodos de pago (efectivo, tarjeta, transferencia), para registrar cómo recibí el dinero.

#### Criterios de Aceptación

1. CUANDO el Modal_de_Pago se muestra, EL Sistema DEBERÁ mostrar una lista de métodos de pago disponibles
2. EL Sistema DEBERÁ incluir al menos los siguientes métodos: efectivo, tarjeta, transferencia
3. CUANDO el usuario selecciona un Método_de_Pago, EL Sistema DEBERÁ validar que se haya seleccionado antes de permitir el registro
4. CUANDO el usuario registra un pago, EL Sistema DEBERÁ almacenar el Método_de_Pago seleccionado junto con el registro

### Requisito 5: Opción de Registrar Después

**User Story:** Como usuario, quiero poder cerrar el modal y registrar el pago más tarde, para tener flexibilidad en mi flujo de trabajo.

#### Criterios de Aceptación

1. CUANDO el Modal_de_Pago se muestra, EL Sistema DEBERÁ mostrar un botón "Registrar después"
2. CUANDO el usuario hace clic en "Registrar después", EL Sistema DEBERÁ cerrar el Modal_de_Pago sin registrar ningún pago
3. CUANDO el usuario cierra el modal sin registrar pago, EL Sistema DEBERÁ mantener la venta en estado pendiente
4. CUANDO el usuario cierra el modal sin registrar pago, EL Sistema DEBERÁ permitir registrar el pago posteriormente desde la Lista_de_Ventas

### Requisito 6: Mantener Funcionalidad Existente

**User Story:** Como usuario, quiero que el método existente de registro de pagos desde la lista de ventas siga disponible, para tener múltiples formas de registrar pagos.

#### Criterios de Aceptación

1. EL Sistema DEBERÁ mantener la funcionalidad de registro de pagos desde la Lista_de_Ventas sin cambios
2. CUANDO el usuario accede a la Lista_de_Ventas, EL Sistema DEBERÁ permitir registrar pagos para cualquier venta
3. CUANDO el usuario registra un pago desde la Lista_de_Ventas, EL Sistema DEBERÁ actualizar el Estado_de_Venta de la misma manera que desde el Modal_de_Pago
4. CUANDO el usuario registra un pago desde la Lista_de_Ventas, EL Sistema DEBERÁ soportar los mismos métodos de pago que el Modal_de_Pago

### Requisito 7: Actualizar Estado de Venta

**User Story:** Como usuario, quiero que el sistema actualice automáticamente el estado de la venta según los pagos registrados, para saber rápidamente qué ventas están pendientes, parcialmente pagadas o completamente pagadas.

#### Criterios de Aceptación

1. CUANDO no se ha registrado ningún pago para una venta, EL Sistema DEBERÁ marcar el Estado_de_Venta como "pendiente"
2. CUANDO el monto total de pagos registrados es menor que el monto total de la venta, EL Sistema DEBERÁ marcar el Estado_de_Venta como "parcial"
3. CUANDO el monto total de pagos registrados es igual o mayor que el monto total de la venta, EL Sistema DEBERÁ marcar el Estado_de_Venta como "pagado"
4. CUANDO se registra un nuevo pago, EL Sistema DEBERÁ recalcular y actualizar el Estado_de_Venta automáticamente

### Requisito 8: Soportar Pagos Parciales

**User Story:** Como usuario, quiero poder registrar pagos parciales, para manejar situaciones donde el cliente paga en múltiples cuotas.

#### Criterios de Aceptación

1. CUANDO el usuario ingresa un monto menor al total de la venta, EL Sistema DEBERÁ permitir registrar el pago parcial
2. CUANDO se registra un pago parcial, EL Sistema DEBERÁ actualizar el Estado_de_Venta a "parcial"
3. CUANDO se registra un pago parcial, EL Sistema DEBERÁ permitir registrar pagos adicionales posteriormente
4. CUANDO se registran múltiples pagos parciales, EL Sistema DEBERÁ sumar todos los pagos para calcular el monto total pagado
5. CUANDO el monto total pagado alcanza o supera el monto de la venta, EL Sistema DEBERÁ actualizar el Estado_de_Venta a "pagado"

### Requisito 9: Validación de Datos de Pago

**User Story:** Como usuario, quiero que el sistema valide los datos que ingreso en el formulario de pago, para evitar errores en el registro.

#### Criterios de Aceptación

1. CUANDO el usuario intenta registrar un pago sin seleccionar un Método_de_Pago, EL Sistema DEBERÁ mostrar un mensaje de error y prevenir el registro
2. CUANDO el usuario ingresa un monto de pago igual a cero o negativo, EL Sistema DEBERÁ mostrar un mensaje de error y prevenir el registro
3. CUANDO el usuario ingresa un monto de pago mayor al saldo pendiente, EL Sistema DEBERÁ permitir el registro pero mostrar una advertencia
4. CUANDO el usuario ingresa caracteres no numéricos en el campo de monto, EL Sistema DEBERÁ mostrar un mensaje de error
5. CUANDO todos los campos son válidos, EL Sistema DEBERÁ habilitar el botón de confirmación

### Requisito 10: Diseño Responsivo

**User Story:** Como usuario que accede desde dispositivos móviles, quiero que el modal de pago se adapte correctamente a pantallas pequeñas, para poder registrar pagos desde cualquier dispositivo.

#### Criterios de Aceptación

1. CUANDO el Modal_de_Pago se muestra en un dispositivo móvil, EL Sistema DEBERÁ ajustar el tamaño y diseño para pantallas pequeñas
2. CUANDO el Modal_de_Pago se muestra en un dispositivo móvil, EL Sistema DEBERÁ mantener todos los elementos interactivos accesibles
3. CUANDO el usuario interactúa con el formulario en móvil, EL Sistema DEBERÁ mostrar teclados apropiados (numérico para montos)
4. CUANDO el Modal_de_Pago se muestra en tablet o desktop, EL Sistema DEBERÁ utilizar un diseño optimizado para pantallas más grandes

### Requisito 11: Integración con Server Actions

**User Story:** Como desarrollador, quiero que el registro de pagos utilice server actions de Next.js, para mantener la consistencia con la arquitectura de la aplicación.

#### Criterios de Aceptación

1. CUANDO el usuario registra un pago, EL Sistema DEBERÁ utilizar server actions para la mutación de datos
2. CUANDO se ejecuta un server action de pago, EL Sistema DEBERÁ validar los datos en el servidor
3. CUANDO se ejecuta un server action de pago, EL Sistema DEBERÁ actualizar la base de datos de Supabase
4. CUANDO un server action falla, EL Sistema DEBERÁ retornar un mensaje de error descriptivo al cliente

### Requisito 12: Persistencia de Datos

**User Story:** Como usuario, quiero que todos los pagos registrados se guarden correctamente en la base de datos, para mantener un historial completo de transacciones.

#### Criterios de Aceptación

1. CUANDO se registra un pago, EL Sistema DEBERÁ almacenar el monto, método de pago, fecha y hora en Supabase
2. CUANDO se registra un pago, EL Sistema DEBERÁ asociar el pago con la venta correspondiente mediante una relación de base de datos
3. CUANDO se registra un pago, EL Sistema DEBERÁ registrar el usuario que realizó el registro
4. CUANDO se consultan los pagos de una venta, EL Sistema DEBERÁ retornar todos los pagos asociados en orden cronológico
