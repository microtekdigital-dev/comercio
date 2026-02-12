# Requirements Document

## Introduction

Este documento define los requisitos para implementar la funcionalidad de relación Producto-Proveedor en el sistema ERP. La funcionalidad permite asociar productos con proveedores específicos y filtrar automáticamente los productos disponibles al crear órdenes de compra según el proveedor seleccionado.

El sistema ya cuenta con la estructura de base de datos necesaria (campo `supplier_id` en la tabla `products`), por lo que esta funcionalidad se enfoca en implementar la interfaz de usuario y la lógica de negocio para aprovechar esta relación.

## Glossary

- **Product**: Artículo o servicio que la empresa comercializa o utiliza
- **Supplier**: Proveedor que suministra productos a la empresa
- **Purchase_Order**: Orden de compra que solicita productos a un proveedor específico
- **Product_Selector**: Componente de interfaz que permite seleccionar productos
- **Supplier_Filter**: Mecanismo que filtra productos según el proveedor seleccionado
- **System**: El sistema ERP completo
- **User**: Usuario del sistema ERP que gestiona productos y órdenes de compra

## Requirements

### Requirement 1: Asignación de Proveedor a Productos

**User Story:** Como usuario del ERP, quiero asignar un proveedor a cada producto al crearlo o editarlo, para mantener organizada la relación entre productos y sus proveedores.

#### Acceptance Criteria

1. WHEN un usuario crea o edita un producto, THE System SHALL mostrar un selector de proveedores disponibles
2. WHEN un usuario selecciona un proveedor, THE System SHALL asociar el producto con ese proveedor
3. THE System SHALL permitir que un producto no tenga proveedor asignado (campo opcional)
4. WHEN un usuario guarda un producto con proveedor asignado, THE System SHALL persistir la relación en la base de datos

### Requirement 2: Visualización de Proveedor en Listado de Productos

**User Story:** Como usuario del ERP, quiero ver qué proveedor está asociado a cada producto en el listado, para identificar rápidamente la procedencia de los productos.

#### Acceptance Criteria

1. WHEN un usuario visualiza el listado de productos, THE System SHALL mostrar el nombre del proveedor asociado a cada producto
2. WHEN un producto no tiene proveedor asignado, THE System SHALL mostrar un indicador visual apropiado (ej: "Sin proveedor")
3. THE System SHALL mantener la legibilidad del listado al agregar la columna de proveedor

### Requirement 3: Filtrado de Productos por Proveedor en Órdenes de Compra

**User Story:** Como usuario del ERP, quiero que al crear una orden de compra solo aparezcan los productos del proveedor seleccionado, para evitar errores y agilizar el proceso de compra.

#### Acceptance Criteria

1. WHEN un usuario selecciona un proveedor en una orden de compra, THE System SHALL filtrar el Product_Selector para mostrar únicamente productos asociados a ese proveedor
2. WHEN un usuario cambia el proveedor seleccionado, THE System SHALL actualizar dinámicamente el listado de productos disponibles
3. WHEN no hay proveedor seleccionado, THE System SHALL mostrar todos los productos disponibles
4. WHEN un proveedor no tiene productos asociados, THE System SHALL mostrar un mensaje indicando que no hay productos disponibles para ese proveedor

### Requirement 4: Validación de Consistencia en Órdenes de Compra

**User Story:** Como usuario del ERP, quiero que el sistema valide que los productos agregados a una orden de compra pertenezcan al proveedor seleccionado, para prevenir inconsistencias en los datos.

#### Acceptance Criteria

1. WHEN un usuario intenta agregar un producto a una orden de compra, THE System SHALL verificar que el producto pertenece al proveedor de la orden
2. IF un producto no pertenece al proveedor seleccionado, THEN THE System SHALL rechazar la adición y mostrar un mensaje de error descriptivo
3. WHEN un usuario cambia el proveedor de una orden de compra existente con productos, THE System SHALL validar que todos los productos pertenecen al nuevo proveedor
4. IF algún producto no pertenece al nuevo proveedor, THEN THE System SHALL mostrar una advertencia y solicitar confirmación antes de proceder

### Requirement 5: Manejo de Productos sin Proveedor

**User Story:** Como usuario del ERP, quiero poder trabajar con productos que no tienen proveedor asignado, para mantener flexibilidad en casos especiales.

#### Acceptance Criteria

1. THE System SHALL permitir crear y editar productos sin asignar un proveedor
2. WHEN se visualiza el listado de productos, THE System SHALL incluir productos sin proveedor asignado
3. WHEN se crea una orden de compra sin seleccionar proveedor, THE System SHALL mostrar todos los productos incluyendo aquellos sin proveedor
4. WHEN se selecciona un proveedor en una orden de compra, THE System SHALL excluir del Product_Selector los productos sin proveedor asignado

### Requirement 6: Actualización de Relación Producto-Proveedor

**User Story:** Como usuario del ERP, quiero poder cambiar el proveedor asignado a un producto existente, para mantener actualizada la información cuando cambien las relaciones comerciales.

#### Acceptance Criteria

1. WHEN un usuario edita un producto, THE System SHALL permitir cambiar el proveedor asignado
2. WHEN un usuario cambia el proveedor de un producto, THE System SHALL actualizar la relación en la base de datos
3. WHEN un usuario cambia el proveedor de un producto a "Sin proveedor", THE System SHALL remover la asociación existente
4. THE System SHALL aplicar los cambios inmediatamente sin afectar órdenes de compra existentes
