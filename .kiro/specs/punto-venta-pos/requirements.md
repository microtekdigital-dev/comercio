# Requirements Document: Sistema de Punto de Venta (POS)

## Introduction

Este documento define los requisitos para un sistema de Punto de Venta (POS) optimizado para ventas rápidas en mostrador, integrado con el ERP SaaS multi-tenant existente. El sistema debe proporcionar una interfaz ágil y eficiente para cajeros, con soporte para múltiples métodos de pago, gestión de clientes, integración con caja registradora, y funcionalidades avanzadas según el plan de suscripción.

## Glossary

- **POS_System**: Sistema de Punto de Venta para ventas rápidas en mostrador
- **Cart**: Carrito de compra temporal que contiene productos seleccionados antes de finalizar la venta
- **Cash_Register**: Caja registradora física asociada a un turno de trabajo
- **Opening**: Apertura de caja con monto inicial registrado
- **Closure**: Cierre de caja con arqueo y conciliación de efectivo
- **Variant**: Variante de producto (talla, color, etc.) con stock independiente
- **Payment_Method**: Método de pago (efectivo, tarjeta, transferencia, etc.)
- **Thermal_Printer**: Impresora térmica de tickets de 80mm
- **Generic_Customer**: Cliente genérico usado para ventas sin identificar
- **Keyboard_Shortcut**: Atajo de teclado para acciones rápidas
- **Offline_Mode**: Modo de operación sin conexión a internet
- **Sync_Queue**: Cola de ventas pendientes de sincronizar con el servidor
- **RLS_Policy**: Row Level Security policy para aislamiento multi-tenant
- **Plan_Restriction**: Restricción de funcionalidad según plan de suscripción

## Requirements

### Requirement 1: Interfaz de Venta Rápida

**User Story:** Como cajero, quiero una interfaz optimizada para ventas rápidas, para que pueda atender clientes eficientemente en el mostrador.

#### Acceptance Criteria

1. WHEN el cajero busca un producto por código, nombre o escaneo, THE POS_System SHALL mostrar los resultados en menos de 500ms
2. WHEN el cajero selecciona un producto del grid visual, THE POS_System SHALL agregarlo al Cart inmediatamente
3. WHEN un producto tiene Variants, THE POS_System SHALL mostrar un selector de variantes antes de agregarlo al Cart
4. WHEN el cajero modifica la cantidad de un producto en el Cart, THE POS_System SHALL actualizar el total automáticamente
5. WHEN el cajero aplica un descuento, THE POS_System SHALL aceptar tanto porcentaje como monto fijo
6. WHEN el cajero selecciona múltiples Payment_Methods, THE POS_System SHALL permitir dividir el pago entre ellos
7. WHEN el cajero ingresa el monto recibido en efectivo, THE POS_System SHALL calcular y mostrar el cambio automáticamente
8. THE POS_System SHALL validar que el stock disponible sea suficiente antes de agregar productos al Cart

### Requirement 2: Gestión de Clientes en POS

**User Story:** Como cajero, quiero gestionar clientes rápidamente desde el POS, para que pueda asociar ventas a clientes sin interrumpir el flujo de trabajo.

#### Acceptance Criteria

1. WHEN el cajero busca un cliente, THE POS_System SHALL mostrar resultados mientras escribe (búsqueda incremental)
2. WHEN el cajero necesita crear un cliente nuevo, THE POS_System SHALL mostrar un formulario simplificado sin salir del POS
3. WHEN no se selecciona un cliente específico, THE POS_System SHALL asignar la venta al Generic_Customer automáticamente
4. WHEN el cajero selecciona un cliente, THE POS_System SHALL mostrar su historial de compras recientes
5. THE POS_System SHALL permitir cambiar el cliente asociado antes de finalizar la venta

### Requirement 3: Integración con Caja Registradora

**User Story:** Como cajero, quiero que el POS se integre con el sistema de caja, para que todos los movimientos queden registrados correctamente.

#### Acceptance Criteria

1. WHEN el cajero intenta acceder al POS, THE POS_System SHALL verificar que existe un Opening activo
2. IF no existe un Opening activo, THEN THE POS_System SHALL mostrar un mensaje y redirigir a la apertura de caja
3. WHEN se completa una venta, THE POS_System SHALL registrar automáticamente los movimientos en el Cash_Register actual
4. WHEN se registra un pago en efectivo, THE POS_System SHALL actualizar el saldo de efectivo del Cash_Register
5. THE POS_System SHALL asociar cada venta con el Opening activo del cajero

### Requirement 4: Generación e Impresión de Tickets

**User Story:** Como cajero, quiero generar e imprimir tickets de venta, para que pueda entregar comprobantes a los clientes.

#### Acceptance Criteria

1. WHEN se completa una venta, THE POS_System SHALL generar un ticket con formato de 80mm para Thermal_Printer
2. THE POS_System SHALL incluir en el ticket: número de venta, fecha/hora, productos, cantidades, precios, descuentos, subtotal, total, métodos de pago, y cambio
3. WHEN el cliente solicita el ticket por email, THE POS_System SHALL enviarlo en formato PDF
4. WHEN se necesita reimprimir un ticket, THE POS_System SHALL permitir buscar la venta y regenerar el ticket
5. THE POS_System SHALL mostrar una vista previa del ticket antes de imprimir

### Requirement 5: Atajos de Teclado

**User Story:** Como cajero experimentado, quiero usar atajos de teclado, para que pueda trabajar más rápido sin usar el mouse.

#### Acceptance Criteria

1. WHEN el cajero presiona F1, THE POS_System SHALL enfocar el campo de búsqueda de productos
2. WHEN el cajero presiona F2, THE POS_System SHALL enfocar el campo de búsqueda de clientes
3. WHEN el cajero presiona F3, THE POS_System SHALL abrir el modal de aplicar descuento
4. WHEN el cajero presiona F4, THE POS_System SHALL abrir el selector de Payment_Method
5. WHEN el cajero presiona F9, THE POS_System SHALL solicitar confirmación para cancelar la venta actual
6. WHEN el cajero presiona F12, THE POS_System SHALL proceder a finalizar la venta si el Cart no está vacío
7. WHEN el cajero presiona Enter en un modal, THE POS_System SHALL confirmar la acción
8. WHEN el cajero presiona Esc, THE POS_System SHALL cerrar el modal actual o cancelar la acción

### Requirement 6: Modo Offline (Opcional)

**User Story:** Como cajero, quiero poder vender aunque se caiga internet, para que no pierda ventas por problemas de conexión.

#### Acceptance Criteria

1. WHERE el plan es Empresarial, THE POS_System SHALL mantener una caché local de productos frecuentes
2. WHERE el plan es Empresarial, WHEN se pierde la conexión, THE POS_System SHALL permitir continuar vendiendo con productos en caché
3. WHERE el plan es Empresarial, WHEN se completa una venta offline, THE POS_System SHALL agregarla a la Sync_Queue
4. WHERE el plan es Empresarial, WHEN se recupera la conexión, THE POS_System SHALL sincronizar automáticamente las ventas de la Sync_Queue
5. WHERE el plan es Empresarial, THE POS_System SHALL mostrar un indicador visual del estado de conexión
6. WHERE el plan es Empresarial, THE POS_System SHALL resolver conflictos de stock al sincronizar ventas offline

### Requirement 7: Reportes POS

**User Story:** Como gerente, quiero ver reportes específicos del POS, para que pueda analizar el desempeño de ventas en mostrador.

#### Acceptance Criteria

1. WHERE el plan es Profesional o Empresarial, THE POS_System SHALL generar un reporte de ventas del día por cajero
2. WHERE el plan es Profesional o Empresarial, THE POS_System SHALL generar un reporte de productos más vendidos en el POS
3. WHERE el plan es Profesional o Empresarial, THE POS_System SHALL generar un reporte de métodos de pago utilizados
4. WHERE el plan es Profesional o Empresarial, THE POS_System SHALL generar un reporte de ventas por hora del día
5. WHERE el plan es Profesional o Empresarial, THE POS_System SHALL permitir filtrar reportes por rango de fechas
6. WHERE el plan es Profesional o Empresarial, THE POS_System SHALL permitir exportar reportes a PDF y Excel

### Requirement 8: Restricciones por Plan

**User Story:** Como administrador del sistema, quiero que las funcionalidades se restrinjan según el plan, para que cada cliente tenga acceso solo a lo que pagó.

#### Acceptance Criteria

1. WHERE el plan es Básico, THE POS_System SHALL permitir acceso al POS básico sin reportes avanzados
2. WHERE el plan es Básico, THE POS_System SHALL limitar a una sola Cash_Register activa
3. WHERE el plan es Profesional, THE POS_System SHALL permitir acceso completo al POS con reportes
4. WHERE el plan es Profesional, THE POS_System SHALL limitar a tres Cash_Register activas simultáneas
5. WHERE el plan es Empresarial, THE POS_System SHALL habilitar Offline_Mode
6. WHERE el plan es Empresarial, THE POS_System SHALL permitir Cash_Register ilimitadas
7. THE POS_System SHALL mostrar mensajes claros cuando una funcionalidad no está disponible en el plan actual

### Requirement 9: Optimización para Tablets, Móviles y Pantallas Táctiles

**User Story:** Como cajero que usa tablet o celular, quiero una interfaz optimizada para touch, para que pueda trabajar cómodamente sin teclado físico.

#### Acceptance Criteria

1. THE POS_System SHALL tener botones con tamaño mínimo de 44x44px para facilitar el toque
2. THE POS_System SHALL mostrar un teclado numérico virtual para ingresar cantidades y montos
3. THE POS_System SHALL responder a gestos táctiles como swipe para eliminar productos del Cart
4. THE POS_System SHALL adaptar el layout para orientación portrait y landscape
5. THE POS_System SHALL mantener un rendimiento fluido (60fps) en tablets y celulares de gama media
6. WHEN se accede desde un celular, THE POS_System SHALL usar un layout de una columna optimizado para pantallas pequeñas
7. WHEN se accede desde un celular, THE POS_System SHALL priorizar el carrito y permitir colapsar el grid de productos
8. THE POS_System SHALL ser completamente funcional en pantallas desde 320px de ancho
9. THE POS_System SHALL usar componentes responsive que se adapten automáticamente al tamaño de pantalla
10. THE POS_System SHALL mantener todos los Keyboard_Shortcuts accesibles mediante botones en pantalla en dispositivos móviles

### Requirement 10: Seguridad Multi-Tenant

**User Story:** Como administrador del sistema, quiero garantizar el aislamiento de datos entre empresas, para que cada tenant solo vea su información.

#### Acceptance Criteria

1. THE POS_System SHALL aplicar RLS_Policy en todas las consultas de productos, clientes y ventas
2. THE POS_System SHALL validar que el Cash_Register pertenece a la empresa del usuario actual
3. THE POS_System SHALL validar que los productos agregados al Cart pertenecen a la empresa del usuario
4. THE POS_System SHALL validar que el cliente seleccionado pertenece a la empresa del usuario
5. THE POS_System SHALL registrar el company_id en todas las ventas creadas desde el POS

### Requirement 11: Manejo de Variantes de Productos

**User Story:** Como cajero, quiero seleccionar variantes de productos fácilmente, para que pueda vender productos con tallas, colores u otras opciones.

#### Acceptance Criteria

1. WHEN un producto tiene Variants, THE POS_System SHALL mostrar un selector visual de variantes
2. THE POS_System SHALL mostrar el stock disponible de cada Variant en el selector
3. THE POS_System SHALL deshabilitar Variants sin stock en el selector
4. WHEN se agrega una Variant al Cart, THE POS_System SHALL mostrar claramente qué variante fue seleccionada
5. THE POS_System SHALL permitir agregar múltiples Variants del mismo producto al Cart

### Requirement 12: Validaciones de Negocio

**User Story:** Como gerente, quiero que el sistema valide las operaciones, para que no se cometan errores en las ventas.

#### Acceptance Criteria

1. THE POS_System SHALL validar que el total de la venta sea mayor a cero antes de finalizar
2. THE POS_System SHALL validar que la suma de los Payment_Methods sea igual al total de la venta
3. THE POS_System SHALL validar que el descuento no sea mayor al subtotal de la venta
4. THE POS_System SHALL validar que las cantidades sean números positivos
5. IF el stock de un producto se agota durante la venta, THEN THE POS_System SHALL notificar al cajero y actualizar el Cart
6. THE POS_System SHALL validar que el monto recibido en efectivo sea mayor o igual al monto a pagar en efectivo

### Requirement 13: Soporte Multimoneda

**User Story:** Como cajero en un país con múltiples monedas, quiero que el POS soporte la moneda configurada, para que pueda vender en la moneda correcta.

#### Acceptance Criteria

1. THE POS_System SHALL mostrar todos los precios en la moneda configurada en company_settings
2. THE POS_System SHALL formatear los montos según el formato de la moneda (símbolo, decimales, separadores)
3. THE POS_System SHALL registrar las ventas con el currency_code de la empresa
4. THE POS_System SHALL calcular el cambio en la misma moneda de la venta

### Requirement 14: Rendimiento y Experiencia de Usuario

**User Story:** Como cajero, quiero que el POS sea rápido y fluido, para que pueda atender clientes sin demoras.

#### Acceptance Criteria

1. THE POS_System SHALL cargar la interfaz principal en menos de 2 segundos
2. THE POS_System SHALL responder a interacciones del usuario en menos de 100ms
3. THE POS_System SHALL mostrar indicadores de carga durante operaciones que tomen más de 500ms
4. THE POS_System SHALL mantener el estado del Cart en caso de recarga accidental de la página
5. THE POS_System SHALL mostrar mensajes de error claros y accionables cuando algo falle
