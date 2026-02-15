# Requirements Document

## Introduction

Este documento define los requisitos para un panel de métricas financieras que se mostrará en el dashboard principal de la aplicación ERP. El panel proporcionará una vista rápida y consolidada de las métricas financieras clave del negocio, incluyendo ventas diarias, saldo de caja, cuentas por cobrar y pagar, y ganancia estimada del mes.

## Glossary

- **Dashboard_Principal**: La página de inicio del sistema ERP donde el usuario accede después de iniciar sesión
- **Panel_Métricas**: Componente visual que muestra las cinco métricas financieras principales
- **Caja_Inicial**: Monto de dinero en efectivo con el que comienza a operar una empresa nueva
- **Ventas_Día**: Suma total de todas las ventas completadas en el día actual
- **Saldo_Caja**: Cantidad de dinero disponible en caja en el momento actual
- **Cuentas_Por_Cobrar**: Suma total de deudas pendientes de clientes
- **Cuentas_Por_Pagar**: Suma total de deudas pendientes con proveedores
- **Ganancia_Estimada_Mes**: Diferencia entre ingresos y costos del mes actual
- **Empresa_Nueva**: Empresa que acaba de ser creada y no tiene configurado el saldo de caja inicial
- **Modal_Configuración**: Diálogo que solicita al usuario configurar el importe de caja inicial

## Requirements

### Requirement 1: Visualización del Panel de Métricas

**User Story:** Como usuario del sistema, quiero ver un panel con las métricas financieras clave en el dashboard principal, para tener una visión rápida del estado financiero de mi negocio.

#### Acceptance Criteria

1. WHEN un usuario accede al Dashboard_Principal, THEN THE Sistema SHALL mostrar el Panel_Métricas con las cinco métricas financieras
2. THE Panel_Métricas SHALL mostrar la métrica "Hoy vendiste" con el valor de Ventas_Día
3. THE Panel_Métricas SHALL mostrar la métrica "Caja actual" con el valor de Saldo_Caja
4. THE Panel_Métricas SHALL mostrar la métrica "Clientes te deben" con el valor de Cuentas_Por_Cobrar
5. THE Panel_Métricas SHALL mostrar la métrica "Debés a proveedores" con el valor de Cuentas_Por_Pagar
6. THE Panel_Métricas SHALL mostrar la métrica "Ganancia estimada mes" con el valor de Ganancia_Estimada_Mes
7. THE Panel_Métricas SHALL formatear todos los valores monetarios con el símbolo de moneda y separadores de miles

### Requirement 2: Cálculo de Métricas Financieras

**User Story:** Como usuario del sistema, quiero que las métricas se calculen correctamente en tiempo real, para tener información precisa y actualizada.

#### Acceptance Criteria

1. WHEN se calcula Ventas_Día, THE Sistema SHALL sumar todas las ventas con estado "completada" del día actual
2. WHEN se calcula Saldo_Caja, THE Sistema SHALL considerar el saldo inicial más todos los movimientos de caja registrados
3. WHEN se calcula Cuentas_Por_Cobrar, THE Sistema SHALL sumar todas las ventas con saldo pendiente de clientes
4. WHEN se calcula Cuentas_Por_Pagar, THE Sistema SHALL sumar todas las órdenes de compra con saldo pendiente a proveedores
5. WHEN se calcula Ganancia_Estimada_Mes, THE Sistema SHALL restar los costos totales de los ingresos totales del mes actual
6. WHEN el usuario accede al Dashboard_Principal, THE Sistema SHALL recalcular todas las métricas con los datos más recientes

### Requirement 3: Configuración de Caja Inicial

**User Story:** Como propietario de una empresa nueva, quiero configurar el importe de caja inicial cuando accedo por primera vez al sistema, para que las métricas de caja reflejen mi situación real.

#### Acceptance Criteria

1. WHEN un usuario de una Empresa_Nueva accede al Dashboard_Principal, THEN THE Sistema SHALL verificar si existe un saldo de caja inicial configurado
2. IF no existe saldo de caja inicial configurado, THEN THE Sistema SHALL mostrar el Modal_Configuración
3. THE Modal_Configuración SHALL solicitar al usuario ingresar el importe de caja inicial
4. WHEN el usuario ingresa un importe válido en el Modal_Configuración, THEN THE Sistema SHALL guardar el valor como saldo de caja inicial
5. WHEN el usuario guarda el importe de caja inicial, THEN THE Sistema SHALL cerrar el Modal_Configuración y mostrar el Panel_Métricas
6. THE Sistema SHALL validar que el importe de caja inicial sea un número positivo o cero

### Requirement 4: Diseño Visual del Panel

**User Story:** Como usuario del sistema, quiero que el panel de métricas sea visualmente atractivo y fácil de leer, para poder interpretar rápidamente la información financiera.

#### Acceptance Criteria

1. THE Panel_Métricas SHALL utilizar tarjetas visuales diferenciadas para cada métrica
2. THE Panel_Métricas SHALL mostrar cada métrica con un título descriptivo y el valor destacado
3. THE Panel_Métricas SHALL utilizar un diseño responsive que se adapte a diferentes tamaños de pantalla
4. THE Panel_Métricas SHALL utilizar colores que faciliten la lectura y distinción entre métricas
5. THE Panel_Métricas SHALL mostrar las métricas en un orden lógico y consistente

### Requirement 5: Manejo de Errores y Estados Vacíos

**User Story:** Como usuario del sistema, quiero que el panel maneje correctamente los casos donde no hay datos disponibles, para entender claramente el estado de mi negocio.

#### Acceptance Criteria

1. WHEN no existen ventas en el día actual, THEN THE Sistema SHALL mostrar "Hoy vendiste: $0"
2. WHEN no existe saldo de caja configurado, THEN THE Sistema SHALL mostrar el Modal_Configuración
3. WHEN no existen cuentas por cobrar, THEN THE Sistema SHALL mostrar "Clientes te deben: $0"
4. WHEN no existen cuentas por pagar, THEN THE Sistema SHALL mostrar "Debés a proveedores: $0"
5. WHEN no existen datos para calcular ganancia del mes, THEN THE Sistema SHALL mostrar "Ganancia estimada mes: $0"
6. IF ocurre un error al calcular una métrica, THEN THE Sistema SHALL mostrar un mensaje de error descriptivo y continuar mostrando las demás métricas
