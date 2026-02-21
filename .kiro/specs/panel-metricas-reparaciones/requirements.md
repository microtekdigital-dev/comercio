# Documento de Requisitos

## Introducción

Este documento especifica los requisitos para agregar métricas de reparaciones al dashboard principal del sistema ERP. Las métricas mostrarán el importe total de reparaciones completadas y un listado de las reparaciones realizadas, disponibles únicamente para usuarios con plan Pro que tengan el módulo de reparaciones activo.

## Glosario

- **Sistema**: El sistema ERP completo
- **Dashboard**: Página principal del sistema ubicada en `/dashboard`
- **Módulo_Reparaciones**: Funcionalidad de gestión de reparaciones de dispositivos
- **Plan_Pro**: Plan de suscripción profesional que incluye el módulo de reparaciones
- **Orden_Reparación**: Registro de una reparación de dispositivo con estado y pagos asociados
- **Estado_Completado**: Estados de orden de reparación que indican finalización: 'completed' o 'delivered'
- **Importe_Total**: Suma de todos los pagos realizados para órdenes de reparación completadas
- **Panel_Métricas**: Componente visual que muestra estadísticas de reparaciones

## Requisitos

### Requisito 1: Visualización de Importe Total de Reparaciones

**User Story:** Como usuario con plan Pro, quiero ver el importe total de las reparaciones completadas en el dashboard, para tener una visión rápida de los ingresos por reparaciones.

#### Criterios de Aceptación

1. WHEN el usuario tiene plan Pro con módulo de reparaciones activo, THE Sistema SHALL mostrar un panel con el importe total de reparaciones completadas
2. WHEN se calcula el importe total, THE Sistema SHALL sumar únicamente los pagos de órdenes con estado 'completed' o 'delivered'
3. WHEN no existen reparaciones completadas, THE Sistema SHALL mostrar un importe de cero
4. WHEN el usuario no tiene plan Pro o el módulo de reparaciones inactivo, THE Sistema SHALL ocultar el panel de métricas de reparaciones
5. THE Sistema SHALL formatear el importe total en la moneda configurada de la empresa

### Requisito 2: Listado de Reparaciones Realizadas

**User Story:** Como usuario con plan Pro, quiero ver un listado de las reparaciones realizadas en el dashboard, para tener acceso rápido a las órdenes completadas recientemente.

#### Criterios de Aceptación

1. WHEN el usuario tiene plan Pro con módulo de reparaciones activo, THE Sistema SHALL mostrar un listado de reparaciones completadas
2. WHEN se muestra el listado, THE Sistema SHALL incluir únicamente órdenes con estado 'completed' o 'delivered'
3. WHEN se muestra cada reparación, THE Sistema SHALL mostrar número de orden, cliente, dispositivo, fecha de entrega y monto total
4. THE Sistema SHALL ordenar el listado por fecha de entrega descendente (más recientes primero)
5. WHEN el listado tiene más de 5 reparaciones, THE Sistema SHALL mostrar únicamente las 5 más recientes
6. WHEN se hace clic en una reparación del listado, THE Sistema SHALL navegar a la página de detalle de esa orden

### Requisito 3: Control de Acceso por Plan y Módulo

**User Story:** Como administrador del sistema, quiero que las métricas de reparaciones solo sean visibles para usuarios con el plan y módulo correcto, para mantener la segmentación de funcionalidades por plan.

#### Criterios de Aceptación

1. WHEN el usuario tiene plan diferente a Pro, THE Sistema SHALL ocultar completamente el panel de métricas de reparaciones
2. WHEN el usuario tiene plan Pro pero el módulo de reparaciones está inactivo, THE Sistema SHALL ocultar el panel de métricas de reparaciones
3. WHEN el usuario tiene plan Pro y el módulo de reparaciones activo, THE Sistema SHALL mostrar el panel de métricas de reparaciones
4. THE Sistema SHALL verificar el plan y módulo en cada carga del dashboard

### Requisito 4: Integración con Estadísticas Financieras Generales

**User Story:** Como usuario con plan Pro, quiero que los cobros de reparaciones se sumen a las ganancias generales del ERP, para tener una visión completa de todos los ingresos del negocio.

#### Criterios de Aceptación

1. WHEN se calculan las estadísticas financieras generales del dashboard, THE Sistema SHALL incluir los pagos de reparaciones completadas
2. WHEN se muestra el total de ingresos en el dashboard principal, THE Sistema SHALL sumar ventas más pagos de reparaciones
3. WHEN se calculan ganancias del período, THE Sistema SHALL incluir los ingresos por reparaciones en el cálculo
4. THE Sistema SHALL mantener separadas las métricas específicas de reparaciones y las métricas generales
5. WHEN el módulo de reparaciones está inactivo, THE Sistema SHALL calcular estadísticas financieras solo con ventas

### Requisito 5: Integración con Sistema Existente

**User Story:** Como desarrollador, quiero que las métricas de reparaciones se integren con las acciones y componentes existentes, para mantener la consistencia del código y reutilizar funcionalidad probada.

#### Criterios de Aceptación

1. THE Sistema SHALL utilizar las acciones existentes en `lib/actions/repair-orders.ts` y `lib/actions/repair-reports.ts`
2. THE Sistema SHALL reutilizar los tipos de datos existentes para órdenes de reparación
3. WHEN se obtienen datos de reparaciones, THE Sistema SHALL aplicar los mismos filtros de empresa que el resto del sistema
4. THE Sistema SHALL mantener el mismo patrón de diseño visual que otros paneles del dashboard
5. WHEN ocurre un error al cargar métricas, THE Sistema SHALL manejarlo sin afectar el resto del dashboard
