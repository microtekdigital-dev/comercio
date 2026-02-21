# Requirements Document

## Introduction

Este documento especifica los requerimientos para agregar soporte multimoneda al sistema ERP SaaS. La funcionalidad permitirá que cada empresa configure su moneda preferida y muestre correctamente los símbolos y formatos monetarios en todas las áreas del sistema. Esta es una mejora de configuración que no incluye conversión entre monedas, ya que cada empresa opera en su propia moneda local.

## Glossary

- **System**: El sistema ERP SaaS multiempresa
- **Company**: Una empresa cliente que usa el sistema (tenant)
- **Company_Settings**: Tabla de configuración de cada empresa
- **Currency_Code**: Código ISO de moneda (ej: "USD", "EUR", "ARS")
- **Currency_Symbol**: Símbolo visual de la moneda (ej: "$", "€", "₡")
- **Currency_Position**: Posición del símbolo respecto al monto ("before" o "after")
- **Money_Formatter**: Utilidad que formatea montos según la configuración de moneda
- **Price_Display**: Cualquier visualización de precios o montos en la interfaz
- **Financial_Module**: Módulos que manejan transacciones (ventas, compras, caja, reparaciones)

## Requirements

### Requirement 1: Configuración de Moneda por Empresa

**User Story:** Como administrador de empresa, quiero configurar la moneda de mi empresa en la sección de Configuración, para que todos los precios y montos se muestren en mi moneda local.

#### Acceptance Criteria

1. WHEN un administrador accede a la configuración de empresa, THE System SHALL mostrar campos para configurar moneda (código, símbolo, posición)
2. WHEN un administrador selecciona una moneda de la lista, THE System SHALL autocompletar el símbolo y posición correspondientes
3. WHEN un administrador guarda la configuración de moneda, THE System SHALL almacenar los valores en Company_Settings
4. THE System SHALL validar que el código de moneda sea uno de los soportados
5. THE System SHALL validar que la posición del símbolo sea "before" o "after"

### Requirement 2: Soporte de Monedas Comunes

**User Story:** Como administrador de empresa, quiero elegir entre las monedas más comunes de Latinoamérica y el mundo, para configurar rápidamente mi moneda local.

#### Acceptance Criteria

1. THE System SHALL soportar las siguientes monedas: USD (Dólar), EUR (Euro), ARS (Peso Argentino), CLP (Peso Chileno), MXN (Peso Mexicano), COP (Peso Colombiano), BRL (Real Brasileño), PEN (Sol Peruano), UYU (Peso Uruguayo)
2. WHEN se muestra el selector de moneda, THE System SHALL presentar cada moneda con su código, nombre y símbolo
3. THE System SHALL almacenar para cada moneda: código ISO, símbolo, nombre completo, y posición predeterminada del símbolo

### Requirement 3: Formato de Visualización de Montos

**User Story:** Como usuario del sistema, quiero ver todos los precios y montos con el símbolo de moneda de mi empresa, para identificar claramente los valores monetarios.

#### Acceptance Criteria

1. WHEN el sistema muestra un monto, THE Money_Formatter SHALL aplicar el símbolo de moneda configurado
2. WHEN la posición configurada es "before", THE Money_Formatter SHALL mostrar el símbolo antes del número (ej: "$100.00")
3. WHEN la posición configurada es "after", THE Money_Formatter SHALL mostrar el símbolo después del número (ej: "100.00€")
4. THE Money_Formatter SHALL formatear números con separador de miles y dos decimales
5. THE Money_Formatter SHALL manejar valores nulos o indefinidos mostrando el símbolo con "0.00"

### Requirement 4: Visualización en Módulo de Productos

**User Story:** Como usuario, quiero ver los precios de productos con el símbolo de moneda, para conocer el valor en mi moneda local.

#### Acceptance Criteria

1. WHEN se muestra la lista de productos, THE System SHALL mostrar precios de venta y costo con formato de moneda
2. WHEN se muestra el detalle de un producto, THE System SHALL mostrar todos los precios con formato de moneda
3. WHEN se edita un producto, THE System SHALL mostrar el símbolo de moneda en los campos de precio
4. WHERE un producto tiene variantes, THE System SHALL mostrar el precio de cada variante con formato de moneda

### Requirement 5: Visualización en Módulo de Ventas

**User Story:** Como usuario, quiero ver los montos de ventas y presupuestos con el símbolo de moneda, para identificar claramente los valores de las transacciones.

#### Acceptance Criteria

1. WHEN se muestra la lista de ventas, THE System SHALL mostrar el total de cada venta con formato de moneda
2. WHEN se muestra el detalle de una venta, THE System SHALL mostrar subtotales, descuentos y total con formato de moneda
3. WHEN se crea una nueva venta, THE System SHALL mostrar el símbolo de moneda en los campos de precio
4. WHEN se imprime una factura, THE System SHALL incluir el símbolo de moneda en todos los montos
5. WHEN se muestra un presupuesto, THE System SHALL aplicar formato de moneda a todos los montos

### Requirement 6: Visualización en Módulo de Compras

**User Story:** Como usuario, quiero ver los montos de órdenes de compra con el símbolo de moneda, para gestionar correctamente las compras a proveedores.

#### Acceptance Criteria

1. WHEN se muestra la lista de órdenes de compra, THE System SHALL mostrar el total con formato de moneda
2. WHEN se crea una orden de compra, THE System SHALL mostrar precios unitarios y totales con formato de moneda
3. WHEN se muestra el detalle de una orden, THE System SHALL aplicar formato de moneda a todos los montos

### Requirement 7: Visualización en Módulo de Reparaciones

**User Story:** Como usuario, quiero ver los costos de reparaciones con el símbolo de moneda, para gestionar correctamente los servicios técnicos.

#### Acceptance Criteria

1. WHEN se muestra la lista de reparaciones, THE System SHALL mostrar el costo total con formato de moneda
2. WHEN se crea una reparación, THE System SHALL mostrar precios de repuestos y mano de obra con formato de moneda
3. WHEN se registra un pago de reparación, THE System SHALL mostrar el monto con formato de moneda
4. WHEN se imprime una orden de reparación, THE System SHALL incluir el símbolo de moneda

### Requirement 8: Visualización en Módulo de Caja

**User Story:** Como usuario, quiero ver los montos de caja con el símbolo de moneda, para gestionar correctamente el efectivo y los movimientos.

#### Acceptance Criteria

1. WHEN se muestra una apertura de caja, THE System SHALL mostrar el monto inicial con formato de moneda
2. WHEN se muestra un cierre de caja, THE System SHALL mostrar todos los montos (ventas, gastos, diferencias) con formato de moneda
3. WHEN se registra un movimiento de caja, THE System SHALL mostrar el monto con formato de moneda
4. WHEN se imprime un informe de cierre, THE System SHALL incluir el símbolo de moneda en todos los montos

### Requirement 9: Visualización en Reportes Financieros

**User Story:** Como usuario, quiero ver los montos en reportes financieros con el símbolo de moneda, para analizar correctamente las finanzas de mi empresa.

#### Acceptance Criteria

1. WHEN se muestra el reporte de liquidación de inventario, THE System SHALL aplicar formato de moneda a todos los montos
2. WHEN se muestra el reporte de liquidación de cuentas, THE System SHALL mostrar saldos y pagos con formato de moneda
3. WHEN se muestra el estado de caja, THE System SHALL aplicar formato de moneda a ingresos y egresos
4. WHEN se exportan reportes, THE System SHALL incluir el símbolo de moneda en los valores

### Requirement 10: Visualización en Dashboard y Estadísticas

**User Story:** Como usuario, quiero ver las métricas del dashboard con el símbolo de moneda, para monitorear el desempeño financiero de mi empresa.

#### Acceptance Criteria

1. WHEN se muestra el dashboard principal, THE System SHALL mostrar estadísticas de ventas con formato de moneda
2. WHEN se muestran métricas financieras, THE System SHALL aplicar formato de moneda a ingresos, gastos y ganancias
3. WHEN se muestran gráficos con valores monetarios, THE System SHALL incluir el símbolo de moneda en las etiquetas

### Requirement 11: Visualización en Cuentas Corrientes

**User Story:** Como usuario, quiero ver los saldos de cuentas corrientes con el símbolo de moneda, para gestionar correctamente las cuentas por cobrar y pagar.

#### Acceptance Criteria

1. WHEN se muestra la lista de cuentas corrientes de clientes, THE System SHALL mostrar saldos con formato de moneda
2. WHEN se muestra la lista de cuentas corrientes de proveedores, THE System SHALL mostrar saldos con formato de moneda
3. WHEN se muestra el detalle de una cuenta corriente, THE System SHALL aplicar formato de moneda a todos los movimientos
4. WHEN se registra un pago en cuenta corriente, THE System SHALL mostrar el monto con formato de moneda

### Requirement 12: Migración y Retrocompatibilidad

**User Story:** Como administrador del sistema, quiero que las empresas existentes tengan una moneda por defecto, para que el sistema funcione correctamente sin requerir configuración inmediata.

#### Acceptance Criteria

1. WHEN una empresa existente no tiene moneda configurada, THE System SHALL usar USD como moneda predeterminada
2. WHEN se ejecuta la migración de base de datos, THE System SHALL agregar los campos de moneda a Company_Settings
3. WHEN se ejecuta la migración, THE System SHALL establecer USD como moneda para todas las empresas existentes
4. THE System SHALL permitir que las empresas cambien su moneda en cualquier momento después de la migración

### Requirement 13: Persistencia de Configuración

**User Story:** Como sistema, necesito almacenar la configuración de moneda de forma persistente, para mantener la consistencia en todas las sesiones.

#### Acceptance Criteria

1. THE System SHALL almacenar currency_code como VARCHAR en Company_Settings
2. THE System SHALL almacenar currency_symbol como VARCHAR en Company_Settings
3. THE System SHALL almacenar currency_position como VARCHAR en Company_Settings
4. WHEN se carga la configuración de una empresa, THE System SHALL recuperar los valores de moneda de Company_Settings
5. THE System SHALL validar que los campos de moneda no sean nulos después de la migración
