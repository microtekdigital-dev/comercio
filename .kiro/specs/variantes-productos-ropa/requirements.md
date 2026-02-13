# Requirements Document

## Introduction

Este documento especifica los requisitos para agregar soporte de variantes de productos al sistema ERP existente, enfocado específicamente en tiendas de ropa. El sistema actualmente maneja productos simples y necesita extenderse para soportar variantes (tallas) manteniendo retrocompatibilidad con productos existentes.

## Glossary

- **Product**: Un artículo en el inventario del sistema ERP
- **Variant**: Una versión específica de un producto definida por su talla (ej: Camisa talla M)
- **Variant_Type**: Categoría predefinida de variantes (Camisas, Pantalones, Personalizado)
- **Variant_Template**: Plantilla guardada de variantes personalizadas que puede reutilizarse en múltiples productos
- **Stock**: Cantidad disponible de un producto o variante específica
- **Stock_Movement**: Registro de cambio en el inventario que incluye la variante específica
- **Simple_Product**: Producto sin variantes que funciona como el sistema actual
- **Variant_Product**: Producto que tiene variantes activadas

## Requirements

### Requirement 1: Activación de Variantes

**User Story:** Como administrador de tienda, quiero poder activar variantes en productos específicos, para que pueda gestionar productos con tallas sin afectar productos simples existentes.

#### Acceptance Criteria

1. WHEN un usuario crea o edita un producto, THE System SHALL display un control para activar/desactivar variantes
2. WHEN las variantes están desactivadas, THE System SHALL ocultar todas las opciones de configuración de variantes
3. WHEN las variantes están activadas, THE System SHALL mostrar las opciones de tipo de variante y gestión de stock por variante
4. THE System SHALL permitir que productos sin variantes continúen funcionando exactamente como antes (retrocompatibilidad)
5. WHEN un producto tiene variantes activadas, THE System SHALL requerir al menos una variante configurada antes de guardar

### Requirement 2: Tipos de Variantes Predefinidas

**User Story:** Como administrador de tienda de ropa, quiero seleccionar entre tipos de variantes predefinidas comunes, para que pueda configurar rápidamente productos sin tener que definir cada talla manualmente.

#### Acceptance Criteria

1. THE System SHALL proporcionar un tipo de variante "Camisas/Remeras" con tallas: XS, S, M, L, XL, XXL, XXXL
2. THE System SHALL proporcionar un tipo de variante "Pantalones" con tallas: 28, 30, 32, 34, 36, 38, 40, 42, 44, 46
3. THE System SHALL proporcionar un tipo de variante "Personalizado" que permita definir tallas personalizadas
4. WHEN se selecciona un tipo predefinido (Camisas o Pantalones), THE System SHALL crear automáticamente todas las variantes de ese tipo
5. WHEN se selecciona tipo "Personalizado", THE System SHALL permitir al usuario agregar, editar y eliminar tallas personalizadas
6. WHERE tipo es "Personalizado", THE System SHALL validar que cada talla tenga un nombre único dentro del producto

### Requirement 2.1: Plantillas de Variantes Personalizadas

**User Story:** Como administrador de tienda, quiero guardar mis configuraciones personalizadas de variantes con un nombre, para que pueda reutilizarlas en otros productos sin tener que configurar las mismas tallas repetidamente.

#### Acceptance Criteria

1. WHEN un usuario configura variantes personalizadas, THE System SHALL mostrar un botón "Guardar como Plantilla"
2. WHEN el usuario hace clic en "Guardar como Plantilla", THE System SHALL solicitar un nombre para la plantilla
3. THE System SHALL guardar la plantilla con el nombre proporcionado y las tallas configuradas
4. THE System SHALL validar que el nombre de la plantilla sea único para la compañía
5. WHEN un usuario selecciona tipo "Personalizado", THE System SHALL mostrar un selector con las plantillas guardadas además de la opción "Nueva configuración"
6. WHEN se selecciona una plantilla guardada, THE System SHALL cargar automáticamente todas las tallas de esa plantilla
7. THE System SHALL permitir editar las tallas cargadas desde una plantilla sin modificar la plantilla original
8. THE System SHALL permitir al usuario gestionar (ver, editar, eliminar) sus plantillas guardadas
9. THE System SHALL prevenir eliminar una plantilla si está siendo utilizada por productos existentes
10. WHEN se elimina una plantilla, THE System SHALL mantener las variantes en los productos que la usaban

### Requirement 3: Gestión de Stock por Variante

**User Story:** Como administrador de inventario, quiero gestionar el stock de cada variante independientemente, para que pueda saber exactamente cuántas unidades tengo de cada talla.

#### Acceptance Criteria

1. WHEN un producto tiene variantes, THE System SHALL almacenar el stock de forma independiente para cada variante
2. THE System SHALL calcular el stock total del producto como la suma de todas sus variantes
3. WHEN se registra un movimiento de stock para un producto con variantes, THE System SHALL requerir especificar la variante afectada
4. THE System SHALL registrar en cada movimiento de stock la variante específica involucrada
5. WHEN el stock de una variante alcanza el nivel de alerta, THE System SHALL generar una alerta específica para esa variante
6. THE System SHALL mostrar el stock disponible de cada variante en la interfaz de gestión del producto

### Requirement 4: Interfaz de Creación y Edición de Productos

**User Story:** Como usuario del sistema, quiero una interfaz clara para configurar variantes al crear o editar productos, para que pueda gestionar fácilmente productos con tallas.

#### Acceptance Criteria

1. WHEN un usuario crea o edita un producto, THE System SHALL mostrar un selector con opciones: "Sin variantes", "Camisas/Remeras", "Pantalones", "Personalizado"
2. WHEN se selecciona "Sin variantes", THE System SHALL mostrar el campo de stock tradicional
3. WHEN se selecciona un tipo de variante, THE System SHALL mostrar una tabla para gestionar el stock de cada variante
4. THE System SHALL permitir ingresar el stock inicial de cada variante en la tabla de gestión
5. WHEN se edita un producto existente sin variantes, THE System SHALL permitir convertirlo a producto con variantes
6. WHEN se convierte un producto simple a variantes, THE System SHALL migrar el stock existente a una variante por defecto o distribuirlo según indique el usuario

### Requirement 5: Interfaz de Ventas

**User Story:** Como vendedor, quiero seleccionar la variante específica al agregar un producto a una venta, para que el sistema descuente del stock correcto.

#### Acceptance Criteria

1. WHEN un usuario agrega un producto con variantes a una venta, THE System SHALL mostrar un selector de variantes disponibles
2. THE System SHALL mostrar solo las variantes con stock disponible en el selector
3. WHEN se selecciona una variante, THE System SHALL mostrar el stock disponible de esa variante específica
4. THE System SHALL prevenir agregar una variante sin stock suficiente a la venta
5. WHEN se completa una venta, THE System SHALL descontar el stock de las variantes específicas vendidas

### Requirement 6: Interfaz de Lista de Productos

**User Story:** Como usuario del sistema, quiero ver en la lista de productos cuáles tienen variantes y su stock total, para que pueda identificar rápidamente el estado del inventario.

#### Acceptance Criteria

1. WHEN se muestra la lista de productos, THE System SHALL indicar visualmente cuáles productos tienen variantes
2. THE System SHALL mostrar el stock total (suma de variantes) para productos con variantes
3. THE System SHALL mostrar el stock simple para productos sin variantes
4. WHEN un usuario hace clic en un producto con variantes, THE System SHALL mostrar el detalle con el desglose de stock por variante

### Requirement 7: Compatibilidad con Base de Datos Existente

**User Story:** Como desarrollador del sistema, quiero implementar variantes con cambios mínimos a la estructura de base de datos, para que la migración sea segura y no afecte funcionalidad existente.

#### Acceptance Criteria

1. THE System SHALL implementar variantes usando una tabla adicional relacionada a productos
2. THE System SHALL mantener la tabla de productos existente con cambios mínimos
3. THE System SHALL mantener compatibilidad con todos los productos existentes sin variantes
4. THE System SHALL permitir que consultas y reportes existentes continúen funcionando sin modificación
5. WHEN se consulta el stock de un producto sin variantes, THE System SHALL retornar el valor del campo stock tradicional
6. WHEN se consulta el stock de un producto con variantes, THE System SHALL retornar la suma calculada de las variantes

### Requirement 8: Movimientos de Stock con Variantes

**User Story:** Como administrador de inventario, quiero que todos los movimientos de stock registren la variante específica, para que pueda auditar el historial de cada talla.

#### Acceptance Criteria

1. WHEN se registra un movimiento de stock para un producto con variantes, THE System SHALL almacenar el identificador de la variante
2. THE System SHALL permitir consultar el historial de movimientos filtrado por variante específica
3. WHEN se muestra el historial de movimientos, THE System SHALL incluir la información de la variante en cada registro
4. THE System SHALL mantener la funcionalidad de movimientos de stock para productos sin variantes sin cambios

### Requirement 9: Validaciones de Integridad

**User Story:** Como administrador del sistema, quiero que el sistema valide la integridad de los datos de variantes, para que no haya inconsistencias en el inventario.

#### Acceptance Criteria

1. THE System SHALL prevenir eliminar un producto que tiene variantes con stock positivo
2. THE System SHALL prevenir eliminar una variante individual si tiene stock positivo
3. WHEN se desactivan las variantes de un producto, THE System SHALL requerir que todas las variantes tengan stock cero
4. THE System SHALL validar que el stock de cada variante sea un número no negativo
5. THE System SHALL prevenir crear variantes duplicadas (mismo nombre) en un producto
