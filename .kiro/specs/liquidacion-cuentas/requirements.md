# Requirements Document

## Introduction

Este documento define los requerimientos para el Reporte de Liquidación de Cuentas, una funcionalidad que permite visualizar el estado consolidado de cuentas por cobrar (ventas pendientes de pago) y cuentas por pagar (órdenes de compra pendientes de pago) en una fecha determinada. El reporte proporciona un resumen financiero con el balance neto y detalles de cada cuenta pendiente.

## Glossary

- **Sistema**: El módulo de Reporte de Liquidación de Cuentas
- **Usuario**: Persona autenticada con acceso al dashboard
- **Cuenta_Por_Cobrar**: Venta con payment_status 'pending' o 'partial'
- **Cuenta_Por_Pagar**: Orden de compra con payment_status 'pending' o 'partial'
- **Saldo_Pendiente**: Diferencia entre el total y la suma de pagos realizados
- **Días_Vencido**: Diferencia en días entre la fecha seleccionada y la fecha de venta/orden
- **Balance_Neto**: Diferencia entre total de cuentas por cobrar y total de cuentas por pagar
- **Fecha_Corte**: Fecha seleccionada por el usuario para filtrar el estado de cuentas

## Requirements

### Requirement 1: Filtro de Fecha

**User Story:** Como usuario, quiero seleccionar una fecha de corte, para ver el estado de las cuentas hasta ese momento específico.

#### Acceptance Criteria

1. WHEN el usuario accede a la página, THE Sistema SHALL mostrar un selector de fecha con la fecha actual como valor predeterminado
2. WHEN el usuario selecciona una fecha, THE Sistema SHALL actualizar todos los datos del reporte basándose en esa fecha de corte
3. THE Sistema SHALL permitir seleccionar cualquier fecha pasada, presente o futura
4. WHEN la fecha cambia, THE Sistema SHALL recalcular automáticamente todos los totales y días vencidos

### Requirement 2: Resumen Financiero

**User Story:** Como usuario, quiero ver un resumen consolidado del estado financiero, para entender rápidamente mi situación de cuentas.

#### Acceptance Criteria

1. THE Sistema SHALL mostrar tres tarjetas de resumen en la parte superior de la página
2. THE Sistema SHALL calcular y mostrar el total de cuentas por cobrar sumando todos los saldos pendientes de ventas
3. THE Sistema SHALL calcular y mostrar el total de cuentas por pagar sumando todos los saldos pendientes de órdenes de compra
4. THE Sistema SHALL calcular y mostrar el balance neto como la diferencia entre cuentas por cobrar y cuentas por pagar
5. WHEN el balance neto es positivo, THE Sistema SHALL indicarlo visualmente con color verde
6. WHEN el balance neto es negativo, THE Sistema SHALL indicarlo visualmente con color rojo
7. THE Sistema SHALL formatear todos los montos en formato de moneda ARS

### Requirement 3: Detalle de Cuentas por Cobrar

**User Story:** Como usuario, quiero ver el detalle de todas las ventas pendientes de pago, para saber qué clientes me deben dinero.

#### Acceptance Criteria

1. THE Sistema SHALL mostrar una tabla con todas las ventas que tengan payment_status 'pending' o 'partial'
2. WHEN la fecha de corte está definida, THE Sistema SHALL filtrar solo las ventas con sale_date menor o igual a la fecha de corte
3. THE Sistema SHALL mostrar las siguientes columnas: Cliente, Fecha Venta, Total, Pagado, Saldo Pendiente, Días Vencido
4. THE Sistema SHALL calcular el Saldo Pendiente como: total - suma de pagos en sale_payments
5. THE Sistema SHALL calcular Días Vencido como: fecha_corte - sale_date
6. THE Sistema SHALL ordenar las filas por días vencido en orden descendente (más antiguo primero)
7. WHEN una venta no tiene cliente asignado, THE Sistema SHALL mostrar "Cliente General" en la columna Cliente
8. THE Sistema SHALL formatear todos los montos en formato de moneda ARS

### Requirement 4: Detalle de Cuentas por Pagar

**User Story:** Como usuario, quiero ver el detalle de todas las órdenes de compra pendientes de pago, para saber qué debo a mis proveedores.

#### Acceptance Criteria

1. THE Sistema SHALL mostrar una tabla con todas las órdenes de compra que tengan payment_status 'pending' o 'partial'
2. WHEN la fecha de corte está definida, THE Sistema SHALL filtrar solo las órdenes con order_date menor o igual a la fecha de corte
3. THE Sistema SHALL mostrar las siguientes columnas: Proveedor, Fecha Orden, Total, Pagado, Saldo Pendiente, Días Vencido
4. THE Sistema SHALL calcular el Saldo Pendiente como: total - suma de pagos en supplier_payments
5. THE Sistema SHALL calcular Días Vencido como: fecha_corte - order_date
6. THE Sistema SHALL ordenar las filas por días vencido en orden descendente (más antiguo primero)
7. THE Sistema SHALL formatear todos los montos en formato de moneda ARS

### Requirement 5: Exportación a Excel y PDF

**User Story:** Como usuario, quiero exportar el reporte completo a Excel o PDF, para compartirlo o analizarlo fuera del sistema.

#### Acceptance Criteria

1. THE Sistema SHALL mostrar dos botones de exportación visibles en la página: "Exportar a Excel" y "Exportar a PDF"
2. WHEN el usuario hace clic en "Exportar a Excel", THE Sistema SHALL generar un archivo Excel con todas las secciones del reporte
3. WHEN el usuario hace clic en "Exportar a PDF", THE Sistema SHALL generar un archivo PDF con todas las secciones del reporte
4. THE Sistema SHALL incluir en ambos archivos: resumen financiero, detalle de cuentas por cobrar, y detalle de cuentas por pagar
5. THE Sistema SHALL incluir la fecha de corte en el nombre de ambos archivos
6. THE Sistema SHALL formatear correctamente los montos como números en el archivo Excel
7. THE Sistema SHALL formatear correctamente los montos con símbolo de moneda en el archivo PDF
8. THE Sistema SHALL iniciar la descarga del archivo automáticamente después de generarlo
9. THE Sistema SHALL incluir el nombre de la empresa en el encabezado del PDF

### Requirement 6: Reutilización de Funciones Existentes

**User Story:** Como desarrollador, quiero reutilizar las funciones existentes de sales y purchase-orders, para mantener consistencia y evitar duplicación de código.

#### Acceptance Criteria

1. THE Sistema SHALL utilizar la función getSales() de lib/actions/sales.ts para obtener las ventas
2. THE Sistema SHALL utilizar la función getPurchaseOrders() de lib/actions/purchase-orders.ts para obtener las órdenes de compra
3. THE Sistema SHALL aplicar filtros de fecha usando los parámetros dateFrom y dateTo de las funciones existentes
4. THE Sistema SHALL calcular los saldos pendientes usando los datos de payments incluidos en las respuestas de las funciones

### Requirement 7: Permisos y Seguridad

**User Story:** Como administrador del sistema, quiero que solo usuarios autenticados de la empresa puedan acceder al reporte, para proteger información financiera sensible.

#### Acceptance Criteria

1. THE Sistema SHALL verificar que el usuario esté autenticado antes de mostrar el reporte
2. THE Sistema SHALL filtrar todos los datos por company_id del usuario autenticado
3. THE Sistema SHALL mostrar solo datos de la empresa a la que pertenece el usuario
4. WHEN un usuario no autenticado intenta acceder, THE Sistema SHALL redirigir a la página de login

### Requirement 8: Interfaz de Usuario

**User Story:** Como usuario, quiero una interfaz clara y organizada, para entender fácilmente el estado de mis cuentas.

#### Acceptance Criteria

1. THE Sistema SHALL mostrar el filtro de fecha en la parte superior de la página
2. THE Sistema SHALL mostrar las tres tarjetas de resumen inmediatamente debajo del filtro
3. THE Sistema SHALL mostrar la tabla de cuentas por cobrar antes que la tabla de cuentas por pagar
4. THE Sistema SHALL usar componentes UI existentes (Card, Table, Button, DatePicker) para mantener consistencia visual
5. THE Sistema SHALL mostrar indicadores de carga mientras se obtienen los datos
6. WHEN no hay cuentas pendientes, THE Sistema SHALL mostrar un mensaje indicando que no hay datos para mostrar
