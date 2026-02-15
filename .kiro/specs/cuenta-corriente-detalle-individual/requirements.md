# Requirements Document

## Introduction

Este documento especifica los requerimientos para agregar funcionalidad de cuenta corriente con detalle individual de movimientos para Clientes y Proveedores en el sistema ERP. La funcionalidad permitirá visualizar el saldo actual, registrar pagos rápidos y consultar el detalle de movimientos (ventas/compras y pagos) para cada cliente o proveedor de forma individual.

## Glossary

- **Sistema**: El sistema ERP/SaaS completo
- **Cliente**: Entidad registrada en la tabla `customers` que realiza compras a la empresa
- **Proveedor**: Entidad registrada en la tabla `suppliers` que vende productos a la empresa
- **Cuenta_Corriente**: Registro detallado de movimientos financieros (débitos y créditos) de un Cliente o Proveedor
- **Saldo**: Diferencia entre el total de débitos y créditos en una Cuenta_Corriente
- **Movimiento**: Transacción financiera que afecta el saldo (venta, compra, pago)
- **Pago_Rápido**: Registro de pago sin necesidad de navegar al módulo de liquidación de cuentas
- **Tabla_Clientes**: Vista de lista de todos los clientes en `/dashboard/customers`
- **Tabla_Proveedores**: Vista de lista de todos los proveedores en `/dashboard/suppliers`
- **Modal_Cuenta_Corriente**: Ventana modal que muestra el detalle de movimientos individuales
- **Modal_Pago_Rápido**: Ventana modal para registrar un pago de forma rápida

## Requirements

### Requirement 1: Visualización de Saldo en Tabla de Clientes

**User Story:** Como usuario del sistema, quiero ver el saldo actual de cada cliente en la tabla de clientes, para identificar rápidamente quiénes tienen deudas pendientes.

#### Acceptance Criteria

1. WHEN la Tabla_Clientes se carga, THE Sistema SHALL calcular y mostrar el saldo actual de cada Cliente en una columna "Saldo"
2. WHEN el saldo de un Cliente es positivo (a favor de la empresa), THE Sistema SHALL mostrar el valor con formato de moneda
3. WHEN el saldo de un Cliente es cero, THE Sistema SHALL mostrar "0.00" con formato de moneda
4. WHEN el saldo de un Cliente es negativo (pago adelantado), THE Sistema SHALL mostrar el valor con formato de moneda y signo negativo
5. THE Sistema SHALL calcular el saldo como: (total de ventas pendientes) - (total de pagos realizados)

### Requirement 2: Visualización de Saldo en Tabla de Proveedores

**User Story:** Como usuario del sistema, quiero ver el saldo actual de cada proveedor en la tabla de proveedores, para identificar rápidamente a quiénes debo pagar.

#### Acceptance Criteria

1. WHEN la Tabla_Proveedores se carga, THE Sistema SHALL calcular y mostrar el saldo actual de cada Proveedor en una columna "Saldo"
2. WHEN el saldo de un Proveedor es positivo (deuda pendiente), THE Sistema SHALL mostrar el valor con formato de moneda
3. WHEN el saldo de un Proveedor es cero, THE Sistema SHALL mostrar "0.00" con formato de moneda
4. WHEN el saldo de un Proveedor es negativo (pago adelantado), THE Sistema SHALL mostrar el valor con formato de moneda y signo negativo
5. THE Sistema SHALL calcular el saldo como: (total de compras pendientes) - (total de pagos realizados)

### Requirement 3: Botón de Cuenta Corriente para Clientes

**User Story:** Como usuario del sistema, quiero acceder al detalle de movimientos de un cliente desde la tabla de clientes, para revisar el historial completo de transacciones.

#### Acceptance Criteria

1. WHEN la Tabla_Clientes se muestra, THE Sistema SHALL incluir un botón "Cuenta corriente" para cada Cliente
2. WHEN el usuario hace clic en el botón "Cuenta corriente", THE Sistema SHALL abrir el Modal_Cuenta_Corriente con los movimientos del Cliente seleccionado
3. WHEN el Modal_Cuenta_Corriente se abre, THE Sistema SHALL mostrar el nombre del Cliente en el título del modal
4. WHEN el Modal_Cuenta_Corriente se abre, THE Sistema SHALL mostrar el saldo actual del Cliente de forma destacada
5. WHEN el Modal_Cuenta_Corriente se abre, THE Sistema SHALL listar todos los movimientos ordenados por fecha descendente

### Requirement 4: Botón de Cuenta Corriente para Proveedores

**User Story:** Como usuario del sistema, quiero acceder al detalle de movimientos de un proveedor desde la tabla de proveedores, para revisar el historial completo de transacciones.

#### Acceptance Criteria

1. WHEN la Tabla_Proveedores se muestra, THE Sistema SHALL incluir un botón "Cuenta corriente" para cada Proveedor
2. WHEN el usuario hace clic en el botón "Cuenta corriente", THE Sistema SHALL abrir el Modal_Cuenta_Corriente con los movimientos del Proveedor seleccionado
3. WHEN el Modal_Cuenta_Corriente se abre, THE Sistema SHALL mostrar el nombre del Proveedor en el título del modal
4. WHEN el Modal_Cuenta_Corriente se abre, THE Sistema SHALL mostrar el saldo actual del Proveedor de forma destacada
5. WHEN el Modal_Cuenta_Corriente se abre, THE Sistema SHALL listar todos los movimientos ordenados por fecha descendente

### Requirement 5: Detalle de Movimientos en Modal de Cuenta Corriente

**User Story:** Como usuario del sistema, quiero ver el detalle completo de cada movimiento en la cuenta corriente, para entender cómo se compone el saldo actual.

#### Acceptance Criteria

1. WHEN el Modal_Cuenta_Corriente muestra un movimiento de tipo venta, THE Sistema SHALL mostrar: fecha, número de venta, descripción "Venta", monto total, monto pagado y saldo pendiente
2. WHEN el Modal_Cuenta_Corriente muestra un movimiento de tipo compra, THE Sistema SHALL mostrar: fecha, número de orden, descripción "Compra", monto total, monto pagado y saldo pendiente
3. WHEN el Modal_Cuenta_Corriente muestra un movimiento de tipo pago, THE Sistema SHALL mostrar: fecha, método de pago, descripción "Pago", monto y referencia (si existe)
4. WHEN no existen movimientos para un Cliente o Proveedor, THE Sistema SHALL mostrar el mensaje "No hay movimientos registrados"
5. THE Sistema SHALL calcular y mostrar el saldo acumulado después de cada movimiento

### Requirement 6: Botón de Registro de Pago Rápido para Clientes

**User Story:** Como usuario del sistema, quiero registrar pagos de clientes de forma rápida desde la tabla de clientes, sin necesidad de navegar al módulo de liquidación de cuentas.

#### Acceptance Criteria

1. WHEN la Tabla_Clientes se muestra, THE Sistema SHALL incluir un botón "Registrar pago" para cada Cliente
2. WHEN el usuario hace clic en el botón "Registrar pago", THE Sistema SHALL abrir el Modal_Pago_Rápido con el Cliente preseleccionado
3. WHEN el Modal_Pago_Rápido se abre, THE Sistema SHALL mostrar el saldo pendiente del Cliente
4. WHEN el Modal_Pago_Rápido se abre, THE Sistema SHALL listar las ventas pendientes del Cliente con sus montos
5. WHEN el usuario completa el registro de pago, THE Sistema SHALL actualizar el saldo del Cliente en la Tabla_Clientes

### Requirement 7: Botón de Registro de Pago Rápido para Proveedores

**User Story:** Como usuario del sistema, quiero registrar pagos a proveedores de forma rápida desde la tabla de proveedores, sin necesidad de navegar al módulo de liquidación de cuentas.

#### Acceptance Criteria

1. WHEN la Tabla_Proveedores se muestra, THE Sistema SHALL incluir un botón "Registrar pago" para cada Proveedor
2. WHEN el usuario hace clic en el botón "Registrar pago", THE Sistema SHALL abrir el Modal_Pago_Rápido con el Proveedor preseleccionado
3. WHEN el Modal_Pago_Rápido se abre, THE Sistema SHALL mostrar el saldo pendiente del Proveedor
4. WHEN el Modal_Pago_Rápido se abre, THE Sistema SHALL listar las compras pendientes del Proveedor con sus montos
5. WHEN el usuario completa el registro de pago, THE Sistema SHALL actualizar el saldo del Proveedor en la Tabla_Proveedores

### Requirement 8: Integración con Sistema de Cuentas Existente

**User Story:** Como desarrollador del sistema, quiero reutilizar la lógica existente del módulo de liquidación de cuentas, para mantener consistencia en los cálculos y evitar duplicación de código.

#### Acceptance Criteria

1. WHEN el Sistema calcula saldos, THE Sistema SHALL utilizar las funciones existentes en `lib/actions/accounts-settlement.ts`
2. WHEN el Sistema registra un pago rápido, THE Sistema SHALL utilizar el componente existente `quick-payment-modal.tsx`
3. WHEN el Sistema obtiene movimientos de ventas, THE Sistema SHALL consultar la tabla `sales` con sus pagos asociados
4. WHEN el Sistema obtiene movimientos de compras, THE Sistema SHALL consultar la tabla `purchase_orders` con sus pagos asociados
5. THE Sistema SHALL mantener la integridad referencial con las tablas existentes sin crear nuevas estructuras de datos

### Requirement 9: Formato y Presentación de Datos Monetarios

**User Story:** Como usuario del sistema, quiero que todos los valores monetarios se muestren con formato consistente, para facilitar la lectura y comprensión de los montos.

#### Acceptance Criteria

1. WHEN el Sistema muestra un valor monetario, THE Sistema SHALL aplicar formato con separador de miles y dos decimales
2. WHEN el Sistema muestra un saldo positivo en clientes, THE Sistema SHALL usar color verde o neutral
3. WHEN el Sistema muestra un saldo positivo en proveedores, THE Sistema SHALL usar color rojo o de advertencia (indica deuda)
4. WHEN el Sistema muestra un saldo negativo, THE Sistema SHALL incluir el signo "-" antes del monto
5. THE Sistema SHALL usar la configuración de moneda de la empresa para el símbolo monetario

### Requirement 10: Rendimiento y Optimización de Consultas

**User Story:** Como usuario del sistema, quiero que las tablas de clientes y proveedores carguen rápidamente incluso con muchos registros, para mantener una experiencia de usuario fluida.

#### Acceptance Criteria

1. WHEN la Tabla_Clientes tiene más de 100 registros, THE Sistema SHALL calcular saldos de forma eficiente usando consultas optimizadas
2. WHEN la Tabla_Proveedores tiene más de 100 registros, THE Sistema SHALL calcular saldos de forma eficiente usando consultas optimizadas
3. WHEN el Modal_Cuenta_Corriente se abre, THE Sistema SHALL cargar los movimientos en menos de 2 segundos
4. THE Sistema SHALL utilizar índices de base de datos apropiados para las consultas de saldo
5. THE Sistema SHALL implementar paginación si el número de movimientos excede 50 registros
