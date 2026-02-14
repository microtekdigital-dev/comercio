# Requirements Document

## Introduction

Sistema de reporte contable de inventario mensual que permite visualizar y exportar el movimiento de productos durante un período específico. El reporte muestra la existencia inicial, compras, ventas y existencia final de cada producto, facilitando la conciliación contable y auditoría de inventario.

## Glossary

- **Sistema**: El sistema ERP de gestión de inventario
- **Reporte**: El documento de liquidación de inventario generado
- **Período**: Rango de fechas definido por fecha inicio y fecha fin
- **Existencia_Inicial**: Stock de un producto al inicio del período
- **Existencia_Final**: Stock de un producto al final del período
- **Movimiento**: Cambio en el inventario (entrada o salida)
- **Variante**: Versión específica de un producto (ej: talla, color)
- **Usuario**: Persona autenticada que accede al sistema
- **Producto_Con_Movimientos**: Producto que tuvo al menos una compra o venta en el período

## Requirements

### Requirement 1: Filtrado de Período

**User Story:** As a usuario contable, I want to seleccionar un rango de fechas para el reporte, so that I can analizar el inventario de un período específico.

#### Acceptance Criteria

1. WHEN el usuario accede al reporte, THE Sistema SHALL mostrar campos de fecha inicio y fecha fin
2. WHEN el usuario selecciona fechas, THE Sistema SHALL validar que la fecha inicio sea menor o igual a la fecha fin
3. IF la fecha inicio es mayor que la fecha fin, THEN THE Sistema SHALL mostrar un mensaje de error y prevenir la generación del reporte
4. WHEN las fechas son válidas, THE Sistema SHALL habilitar el botón de generar reporte

### Requirement 2: Cálculo de Existencia Inicial

**User Story:** As a usuario contable, I want to ver la existencia inicial de cada producto, so that I can conocer el stock al inicio del período.

#### Acceptance Criteria

1. WHEN se genera el reporte, THE Sistema SHALL calcular la existencia inicial sumando todos los movimientos anteriores a la fecha inicio
2. WHEN un producto no tiene movimientos previos, THE Sistema SHALL mostrar existencia inicial de cero
3. WHERE un producto tiene variantes, THE Sistema SHALL calcular la existencia inicial por cada variante
4. THE Sistema SHALL mostrar la existencia inicial en unidades y en valor monetario (costo)

### Requirement 3: Registro de Compras del Período

**User Story:** As a usuario contable, I want to ver todas las compras del período, so that I can conocer las entradas de inventario.

#### Acceptance Criteria

1. WHEN se genera el reporte, THE Sistema SHALL sumar todas las compras del período desde purchase_orders
2. WHEN una orden de compra tiene estado 'received', THE Sistema SHALL incluirla en el cálculo
3. WHERE un producto tiene variantes, THE Sistema SHALL sumar las compras por cada variante
4. THE Sistema SHALL mostrar las compras en unidades y en valor monetario (costo de compra)

### Requirement 4: Registro de Ventas del Período

**User Story:** As a usuario contable, I want to ver todas las ventas del período, so that I can conocer las salidas de inventario.

#### Acceptance Criteria

1. WHEN se genera el reporte, THE Sistema SHALL sumar todas las ventas del período desde sales y sale_items
2. WHEN una venta tiene estado 'completed' o 'paid', THE Sistema SHALL incluirla en el cálculo
3. WHERE un producto tiene variantes, THE Sistema SHALL sumar las ventas por cada variante
4. THE Sistema SHALL mostrar las ventas en unidades y en valor monetario (costo promedio)

### Requirement 5: Cálculo de Existencia Final

**User Story:** As a usuario contable, I want to ver la existencia final calculada, so that I can verificar el stock al cierre del período.

#### Acceptance Criteria

1. WHEN se genera el reporte, THE Sistema SHALL calcular la existencia final con la fórmula: Existencia_Inicial + Compras - Ventas
2. THE Sistema SHALL validar que la existencia final coincida con el stock actual si el período incluye la fecha actual
3. WHERE un producto tiene variantes, THE Sistema SHALL calcular la existencia final por cada variante
4. THE Sistema SHALL mostrar la existencia final en unidades y en valor monetario

### Requirement 6: Visualización de Productos

**User Story:** As a usuario contable, I want to ver todos los productos con movimientos, so that I can revisar el inventario completo del período.

#### Acceptance Criteria

1. WHEN se genera el reporte, THE Sistema SHALL mostrar todos los Producto_Con_Movimientos en el período
2. WHEN un producto no tiene movimientos en el período pero tiene existencia inicial, THE Sistema SHALL incluirlo en el reporte
3. WHERE un producto tiene variantes, THE Sistema SHALL mostrar una fila por cada variante
4. THE Sistema SHALL ordenar los productos alfabéticamente por nombre

### Requirement 7: Filtros Adicionales

**User Story:** As a usuario contable, I want to filtrar el reporte por categoría o producto, so that I can analizar segmentos específicos del inventario.

#### Acceptance Criteria

1. WHERE el usuario selecciona una categoría, THE Sistema SHALL mostrar solo productos de esa categoría
2. WHERE el usuario selecciona un producto específico, THE Sistema SHALL mostrar solo ese producto y sus variantes
3. WHEN se aplican filtros, THE Sistema SHALL mantener los cálculos correctos de existencias
4. THE Sistema SHALL permitir limpiar los filtros para ver el reporte completo

### Requirement 8: Exportación de Datos

**User Story:** As a usuario contable, I want to exportar el reporte a Excel, CSV o PDF, so that I can procesarlo en sistemas contables externos o imprimirlo.

#### Acceptance Criteria

1. WHEN el usuario hace clic en exportar, THE Sistema SHALL mostrar opciones: Excel, CSV, PDF
2. THE Sistema SHALL incluir en el archivo: nombre producto, variante, existencia inicial, compras, ventas, existencia final (unidades y valores)
3. THE Sistema SHALL incluir en el archivo el período seleccionado y la fecha de generación
4. WHERE el usuario selecciona PDF, THE Sistema SHALL generar un documento formateado profesionalmente con logo de la empresa
5. THE Sistema SHALL descargar el archivo automáticamente al navegador del usuario

### Requirement 9: Validación de Datos

**User Story:** As a usuario contable, I want to que los cálculos sean precisos y auditables, so that I can confiar en los datos para contabilidad.

#### Acceptance Criteria

1. WHEN se calcula la existencia inicial, THE Sistema SHALL usar la tabla stock_movements como fuente única de verdad
2. WHEN se suman compras, THE Sistema SHALL usar solo purchase_orders con estado 'received'
3. WHEN se suman ventas, THE Sistema SHALL usar solo sales con estado 'completed' o 'paid'
4. THE Sistema SHALL validar que no haya movimientos duplicados en los cálculos

### Requirement 10: Interfaz de Usuario

**User Story:** As a usuario, I want to acceder al reporte desde el menú del dashboard, so that I can generarlo fácilmente.

#### Acceptance Criteria

1. WHEN el usuario navega al dashboard, THE Sistema SHALL mostrar "Liquidación de Inventario" en la sección de reportes del sidebar
2. WHEN el usuario hace clic en el enlace, THE Sistema SHALL navegar a /dashboard/inventory-report
3. THE Sistema SHALL mostrar una interfaz clara con filtros en la parte superior y tabla de resultados debajo
4. WHEN el reporte está cargando, THE Sistema SHALL mostrar un indicador de carga
