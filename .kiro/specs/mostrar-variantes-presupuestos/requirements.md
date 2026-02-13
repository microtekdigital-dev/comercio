# Requisitos: Mostrar Variantes en Vista de Presupuestos

## 1. Descripción General

Actualmente, cuando se visualiza un presupuesto ya creado que contiene productos con variantes (talle/color), la información de la variante no se muestra al usuario. Esto genera confusión ya que no se puede identificar qué variante específica fue cotizada.

## 2. Historias de Usuario

### 2.1 Como usuario, quiero ver el talle/variante de cada producto en la vista de detalles del presupuesto
**Criterios de Aceptación:**
- Cuando visualizo un presupuesto que contiene productos con variantes, debo ver el nombre de la variante junto al nombre del producto
- La información de la variante debe mostrarse de forma clara y distinguible
- Si un producto no tiene variante, solo se muestra el nombre del producto sin información adicional

### 2.2 Como usuario, quiero ver las variantes tanto en modo visualización como en modo edición
**Criterios de Aceptación:**
- En modo visualización (solo lectura), las variantes se muestran junto al nombre del producto
- En modo edición, debo poder seleccionar variantes al elegir productos
- La información de variante debe persistir al guardar cambios

## 3. Requisitos Funcionales

### 3.1 Visualización de Variantes en Modo Lectura
- Mostrar el nombre de la variante debajo o junto al nombre del producto
- Usar un badge o texto distintivo para la variante (ej: "Talle: M", "Color: Rojo")
- Mantener el formato responsive existente

### 3.2 Selección de Variantes en Modo Edición
- Al seleccionar un producto que tiene variantes, mostrar un selector de variantes
- El selector debe mostrar todas las variantes disponibles del producto
- Actualizar el precio según la variante seleccionada (si las variantes tienen precios diferentes)
- Validar que se seleccione una variante si el producto la requiere

### 3.3 Datos en la Base de Datos
- Los campos `variant_id` y `variant_name` ya existen en `quote_items`
- Asegurar que estos campos se guarden correctamente al crear/editar presupuestos
- Cargar esta información al obtener los detalles del presupuesto

## 4. Requisitos No Funcionales

### 4.1 Compatibilidad
- Mantener compatibilidad con presupuestos existentes que no tienen variantes
- No romper la funcionalidad actual de productos sin variantes

### 4.2 Usabilidad
- La interfaz debe ser intuitiva y consistente con el resto del sistema
- Reutilizar componentes existentes cuando sea posible (ej: `ProductVariantBadge`, `VariantSelectorInSale`)

### 4.3 Rendimiento
- No impactar negativamente el tiempo de carga de la página de presupuestos
- Cargar las variantes de forma eficiente

## 5. Restricciones

- Debe funcionar con la estructura actual de la base de datos
- Debe ser consistente con la implementación de variantes en ventas y órdenes de compra
- No modificar el esquema de base de datos existente

## 6. Dependencias

- Sistema de variantes de productos ya implementado
- Componentes: `ProductVariantBadge`, `VariantSelectorInSale`
- Tablas: `quote_items`, `product_variants`

## 7. Casos de Uso

### 7.1 Ver presupuesto con variantes
1. Usuario navega a un presupuesto existente
2. El presupuesto contiene productos con variantes
3. Sistema muestra cada producto con su variante correspondiente
4. Usuario puede identificar claramente qué variante fue cotizada

### 7.2 Editar presupuesto y cambiar variante
1. Usuario entra en modo edición de un presupuesto
2. Usuario selecciona un producto que tiene variantes
3. Sistema muestra selector de variantes disponibles
4. Usuario selecciona una variante diferente
5. Sistema actualiza el precio si corresponde
6. Usuario guarda los cambios
7. Sistema persiste la nueva variante seleccionada

### 7.3 Crear presupuesto con variantes
1. Usuario crea un nuevo presupuesto
2. Usuario agrega un producto que tiene variantes
3. Sistema muestra selector de variantes
4. Usuario selecciona la variante deseada
5. Sistema guarda el presupuesto con la información de variante
