# Requirements Document

## Introduction

Este documento especifica los requisitos para mejorar el panel principal del dashboard con estadísticas financieras en tiempo real y la configuración de caja inicial para empresas nuevas. El sistema debe proporcionar una vista consolidada de las métricas financieras clave (ventas diarias, saldo de caja, cuentas por cobrar/pagar, y ganancias mensuales) y permitir establecer un importe inicial de caja al configurar una empresa nueva, integrándose con el sistema existente de apertura y cierre de caja.

## Glossary

- **Dashboard**: Panel principal de la aplicación donde se muestran las estadísticas financieras
- **Financial_Stats_Panel**: Componente visual que muestra las métricas financieras clave
- **Cash_Register**: Sistema de registro de caja que gestiona aperturas y cierres
- **Cash_Opening**: Registro de apertura de caja con importe inicial
- **Initial_Cash_Amount**: Importe de dinero con el que se inicia la caja de una empresa
- **Company_Settings**: Tabla de configuración que almacena ajustes de la empresa
- **Daily_Sales**: Total de ventas realizadas en el día actual
- **Current_Cash_Balance**: Saldo disponible en caja en el momento actual
- **Accounts_Receivable**: Cuentas por cobrar pendientes de clientes
- **Accounts_Payable**: Cuentas por pagar pendientes a proveedores
- **Monthly_Profit**: Ganancia estimada del mes actual
- **New_Company**: Empresa recién creada que requiere configuración inicial

## Requirements

### Requirement 1: Panel de Estadísticas Financieras

**User Story:** Como usuario del sistema, quiero ver un panel con estadísticas financieras clave en el dashboard principal, para tener una visión rápida del estado financiero de mi empresa.

#### Acceptance Criteria

1. WHEN el usuario accede al dashboard principal, THE Financial_Stats_Panel SHALL mostrar las ventas del día actual
2. WHEN el usuario accede al dashboard principal, THE Financial_Stats_Panel SHALL mostrar el saldo de caja actual
3. WHEN el usuario accede al dashboard principal, THE Financial_Stats_Panel SHALL mostrar el total de cuentas por cobrar pendientes
4. WHEN el usuario accede al dashboard principal, THE Financial_Stats_Panel SHALL mostrar el total de cuentas por pagar pendientes
5. WHEN el usuario accede al dashboard principal, THE Financial_Stats_Panel SHALL mostrar la ganancia estimada del mes actual
6. THE Financial_Stats_Panel SHALL actualizar los valores cuando se realicen cambios en ventas, pagos o movimientos de caja
7. WHEN no existen datos financieros, THE Financial_Stats_Panel SHALL mostrar valores en cero sin errores

### Requirement 2: Cálculo de Ventas Diarias

**User Story:** Como usuario, quiero ver el total de ventas del día actual, para conocer el rendimiento de ventas de hoy.

#### Acceptance Criteria

1. WHEN se calculan las ventas diarias, THE System SHALL sumar todas las ventas completadas del día actual
2. WHEN se calculan las ventas diarias, THE System SHALL excluir ventas canceladas o pendientes
3. WHEN se calculan las ventas diarias, THE System SHALL considerar la zona horaria de la empresa
4. THE System SHALL formatear el monto de ventas diarias con el símbolo de moneda configurado

### Requirement 3: Cálculo de Saldo de Caja Actual

**User Story:** Como usuario, quiero ver el saldo actual de caja, para conocer cuánto dinero tengo disponible.

#### Acceptance Criteria

1. WHEN se calcula el saldo de caja, THE System SHALL sumar el importe inicial de la última apertura de caja
2. WHEN se calcula el saldo de caja, THE System SHALL sumar todos los ingresos registrados desde la apertura
3. WHEN se calcula el saldo de caja, THE System SHALL restar todos los egresos registrados desde la apertura
4. WHEN no existe una caja abierta, THE System SHALL mostrar el saldo como cero
5. THE System SHALL actualizar el saldo de caja en tiempo real cuando se registren movimientos

### Requirement 4: Cálculo de Cuentas por Cobrar

**User Story:** Como usuario, quiero ver el total que me deben los clientes, para gestionar mis cuentas por cobrar.

#### Acceptance Criteria

1. WHEN se calculan las cuentas por cobrar, THE System SHALL sumar todos los saldos pendientes de clientes
2. WHEN se calculan las cuentas por cobrar, THE System SHALL utilizar la función getCustomerBalance existente
3. WHEN un cliente no tiene saldo pendiente, THE System SHALL excluirlo del cálculo
4. THE System SHALL mostrar el total de cuentas por cobrar con formato de moneda

### Requirement 5: Cálculo de Cuentas por Pagar

**User Story:** Como usuario, quiero ver el total que debo a proveedores, para gestionar mis cuentas por pagar.

#### Acceptance Criteria

1. WHEN se calculan las cuentas por pagar, THE System SHALL sumar todos los saldos pendientes a proveedores
2. WHEN se calculan las cuentas por pagar, THE System SHALL utilizar la función getSupplierBalance existente
3. WHEN un proveedor no tiene saldo pendiente, THE System SHALL excluirlo del cálculo
4. THE System SHALL mostrar el total de cuentas por pagar con formato de moneda

### Requirement 6: Cálculo de Ganancia Mensual

**User Story:** Como usuario, quiero ver la ganancia estimada del mes actual, para evaluar la rentabilidad de mi negocio.

#### Acceptance Criteria

1. WHEN se calcula la ganancia mensual, THE System SHALL sumar todas las ventas completadas del mes actual
2. WHEN se calcula la ganancia mensual, THE System SHALL restar el costo de los productos vendidos
3. WHEN se calcula la ganancia mensual, THE System SHALL considerar solo ventas del mes calendario actual
4. THE System SHALL formatear la ganancia mensual con el símbolo de moneda configurado
5. WHEN no hay ventas en el mes, THE System SHALL mostrar ganancia como cero

### Requirement 7: Configuración de Caja Inicial para Empresas Nuevas

**User Story:** Como administrador de una empresa nueva, quiero configurar el importe inicial de caja al crear mi empresa, para establecer el capital inicial con el que comenzaré a operar.

#### Acceptance Criteria

1. WHEN una empresa es creada por primera vez, THE System SHALL solicitar el importe de caja inicial
2. WHEN se solicita el importe inicial, THE System SHALL validar que sea un número positivo
3. WHEN se establece el importe inicial, THE System SHALL almacenarlo en Company_Settings
4. THE System SHALL permitir establecer el importe inicial solo una vez por empresa
5. WHEN el importe inicial ya fue establecido, THE System SHALL no volver a solicitarlo

### Requirement 8: Integración con Sistema de Apertura de Caja

**User Story:** Como usuario, quiero que el importe inicial de caja se integre con el sistema de apertura de caja, para que la primera apertura utilice este valor automáticamente.

#### Acceptance Criteria

1. WHEN se realiza la primera apertura de caja, THE System SHALL utilizar el importe inicial configurado como sugerencia
2. WHEN se crea una apertura de caja, THE System SHALL permitir modificar el importe sugerido
3. WHEN no existe importe inicial configurado, THE System SHALL permitir ingresar el importe manualmente
4. THE System SHALL mantener la trazabilidad entre el importe inicial y las aperturas de caja

### Requirement 9: Validación de Datos Financieros

**User Story:** Como usuario, quiero que el sistema valide los datos financieros mostrados, para asegurar la precisión de las estadísticas.

#### Acceptance Criteria

1. WHEN se calculan estadísticas financieras, THE System SHALL validar que los montos sean números válidos
2. WHEN se detectan datos inconsistentes, THE System SHALL registrar un error en los logs
3. WHEN se detectan datos inconsistentes, THE System SHALL mostrar un mensaje de advertencia al usuario
4. THE System SHALL manejar errores de cálculo sin interrumpir la visualización del dashboard

### Requirement 10: Formato y Presentación Visual

**User Story:** Como usuario, quiero que las estadísticas financieras se muestren de forma clara y profesional, para facilitar su lectura y comprensión.

#### Acceptance Criteria

1. THE Financial_Stats_Panel SHALL mostrar cada métrica con su etiqueta descriptiva
2. THE Financial_Stats_Panel SHALL formatear todos los montos con separadores de miles
3. THE Financial_Stats_Panel SHALL utilizar el símbolo de moneda configurado en Company_Settings
4. THE Financial_Stats_Panel SHALL utilizar colores diferenciados para valores positivos y negativos
5. THE Financial_Stats_Panel SHALL ser responsive y adaptarse a dispositivos móviles
