# Documento de Requisitos: Catálogo Online / Link de Ventas

## Introducción

El Catálogo Online es una funcionalidad que permite a cada empresa del ERP exponer una página pública accesible desde `app.dominio.com/catalogo/[slug-empresa]`. Los clientes finales de la empresa pueden navegar los productos publicados, armar un carrito y enviar un pedido. El dueño de la empresa gestiona los pedidos entrantes desde el dashboard del ERP. La funcionalidad está disponible en distintos niveles según el plan de suscripción.

## Glosario

- **Catálogo_Online**: Página pública de productos de una empresa, accesible sin autenticación.
- **Pedido_Online**: Solicitud de compra generada desde el Catálogo_Online, pendiente de confirmación por el dueño.
- **Carrito**: Colección temporal de ítems seleccionados por el visitante antes de confirmar un Pedido_Online.
- **Visitante**: Persona que accede al Catálogo_Online sin estar autenticada en el ERP.
- **Dueño**: Usuario autenticado en el ERP con rol de administrador de la empresa.
- **Producto_Publicado**: Producto con el campo `published = true` y `is_active = true` en la base de datos.
- **Plan_Básico**: Plan de suscripción con catálogo solo de visualización, sin pedidos.
- **Plan_Profesional**: Plan de suscripción con pedidos habilitados, límite de 50 pedidos por mes.
- **Plan_Empresarial**: Plan de suscripción sin límites de pedidos y con personalización de marca.
- **Slug**: Identificador único de la empresa en formato URL-friendly, almacenado en `companies.slug`.
- **Panel_Catálogo**: Sección del dashboard del ERP donde el Dueño configura y gestiona el Catálogo_Online.

---

## Requisitos

### Requisito 1: Configuración del catálogo desde el dashboard

**User Story:** Como dueño de una empresa, quiero activar o desactivar mi catálogo público y configurar qué productos aparecen, para controlar mi presencia online.

#### Criterios de Aceptación

1. THE Panel_Catálogo SHALL mostrar el estado actual del catálogo (activo/inactivo) y permitir alternarlo mediante un interruptor.
2. WHEN el Dueño activa el catálogo, THE Panel_Catálogo SHALL mostrar la URL pública completa del catálogo con un botón para copiarla al portapapeles.
3. WHEN el Dueño desactiva el catálogo, THE Catálogo_Online SHALL retornar un estado HTTP 404 para cualquier visitante que acceda a la URL.
4. THE Panel_Catálogo SHALL listar todos los productos activos de la empresa con un control para marcar o desmarcar cada uno como Producto_Publicado.
5. WHEN el Dueño marca un producto como publicado, THE Sistema SHALL actualizar el campo `published` del producto a `true` de forma inmediata.
6. WHEN el Dueño desmarca un producto como publicado, THE Sistema SHALL actualizar el campo `published` del producto a `false` y el producto dejará de aparecer en el Catálogo_Online.

---

### Requisito 2: Visualización del catálogo público

**User Story:** Como visitante, quiero ver el catálogo de productos de una empresa, para conocer su oferta y precios antes de hacer un pedido.

#### Criterios de Aceptación

1. WHEN un visitante accede a `app.dominio.com/catalogo/[slug]` de una empresa con catálogo activo, THE Catálogo_Online SHALL mostrar únicamente los Productos_Publicados de esa empresa.
2. THE Catálogo_Online SHALL mostrar por cada producto: nombre, imagen (o placeholder si no tiene), precio, descripción y disponibilidad de stock.
3. WHERE el producto tiene variantes activas, THE Catálogo_Online SHALL mostrar un selector de variantes con el stock disponible por variante.
4. WHEN el stock de un producto o variante es cero, THE Catálogo_Online SHALL mostrar el producto como "Sin stock" y no permitir agregarlo al Carrito.
5. THE Catálogo_Online SHALL mostrar el nombre y logo de la empresa en el encabezado de la página.
6. WHEN el catálogo de la empresa está inactivo o el slug no existe, THE Catálogo_Online SHALL mostrar una página de error 404 con un mensaje claro.
7. THE Catálogo_Online SHALL ser accesible sin autenticación y funcionar correctamente en dispositivos móviles.

---

### Requisito 3: Carrito de compras

**User Story:** Como visitante, quiero agregar productos a un carrito y revisarlos antes de confirmar mi pedido, para asegurarme de que mi selección es correcta.

#### Criterios de Aceptación

1. WHEN un visitante hace clic en "Agregar al carrito" en un Producto_Publicado con stock disponible, THE Carrito SHALL incluir ese ítem con cantidad 1 por defecto.
2. WHEN un visitante agrega el mismo producto o variante más de una vez, THE Carrito SHALL incrementar la cantidad del ítem existente en lugar de duplicarlo.
3. THE Carrito SHALL mostrar en todo momento: nombre del producto, variante seleccionada (si aplica), cantidad, precio unitario y subtotal por ítem.
4. THE Carrito SHALL mostrar el total general de todos los ítems.
5. WHEN un visitante modifica la cantidad de un ítem a cero o lo elimina, THE Carrito SHALL remover ese ítem de la lista.
6. IF la cantidad solicitada en el Carrito supera el stock disponible del producto o variante, THEN THE Carrito SHALL limitar la cantidad al stock disponible y mostrar un aviso al visitante.
7. WHERE el Plan_Básico está activo para la empresa, THE Catálogo_Online SHALL ocultar el Carrito y el botón de pedido, mostrando solo la vista de catálogo.

---

### Requisito 4: Proceso de pedido

**User Story:** Como visitante, quiero completar mis datos y enviar un pedido, para que la empresa pueda contactarme y confirmar mi compra.

#### Criterios de Aceptación

1. WHEN un visitante hace clic en "Confirmar pedido" con el Carrito no vacío, THE Catálogo_Online SHALL mostrar un formulario con los campos: nombre completo (obligatorio), teléfono (obligatorio), dirección de entrega (opcional) y notas adicionales (opcional).
2. WHEN el visitante envía el formulario con los campos obligatorios completos, THE Sistema SHALL crear un Pedido_Online en la base de datos con estado `pendiente`.
3. THE Pedido_Online SHALL registrar: datos del visitante, lista de ítems con cantidades y precios al momento del pedido, total, fecha y hora, y referencia al slug de la empresa.
4. IF el visitante intenta enviar el formulario con el campo nombre o teléfono vacío, THEN THE Catálogo_Online SHALL mostrar un mensaje de error de validación y no crear el Pedido_Online.
5. WHEN el Pedido_Online es creado exitosamente, THE Catálogo_Online SHALL mostrar una pantalla de confirmación con un número de pedido y un mensaje de agradecimiento.
6. WHEN el Pedido_Online es creado exitosamente, THE Sistema SHALL vaciar el Carrito del visitante.
7. WHERE el Plan_Profesional está activo y la empresa ya alcanzó 50 pedidos en el mes calendario en curso, THEN THE Catálogo_Online SHALL mostrar un mensaje indicando que los pedidos online están temporalmente deshabilitados.

---

### Requisito 5: Gestión de pedidos online en el dashboard

**User Story:** Como dueño, quiero ver y gestionar los pedidos online recibidos desde mi catálogo, para confirmarlos, rechazarlos y procesarlos en el ERP.

#### Criterios de Aceptación

1. THE Panel_Catálogo SHALL mostrar una lista de Pedidos_Online recibidos, ordenados por fecha descendente, con: número de pedido, nombre del visitante, total, estado y fecha.
2. WHEN el Dueño selecciona un Pedido_Online, THE Panel_Catálogo SHALL mostrar el detalle completo: datos del visitante, ítems con cantidades y precios, total y notas.
3. WHEN el Dueño confirma un Pedido_Online, THE Sistema SHALL cambiar el estado del pedido a `confirmado` y registrar la fecha de confirmación.
4. WHEN el Dueño rechaza un Pedido_Online, THE Sistema SHALL cambiar el estado del pedido a `rechazado` y registrar la fecha de rechazo.
5. THE Panel_Catálogo SHALL permitir filtrar los Pedidos_Online por estado (pendiente, confirmado, rechazado).
6. WHEN llega un nuevo Pedido_Online, THE Sistema SHALL crear una notificación en el sistema de notificaciones existente del ERP para alertar al Dueño.

---

### Requisito 6: Restricciones por plan de suscripción

**User Story:** Como administrador del SaaS, quiero que las funcionalidades del catálogo estén limitadas según el plan contratado, para diferenciar la propuesta de valor de cada nivel.

#### Criterios de Aceptación

1. WHERE el Plan_Básico está activo, THE Catálogo_Online SHALL funcionar en modo solo lectura: sin Carrito, sin formulario de pedido y sin botón de compra.
2. WHERE el Plan_Profesional está activo, THE Catálogo_Online SHALL habilitar el Carrito y el proceso de pedido con un límite de 50 Pedidos_Online por mes calendario.
3. WHERE el Plan_Empresarial está activo, THE Catálogo_Online SHALL habilitar el Carrito y el proceso de pedido sin límite de cantidad mensual.
4. WHERE el Plan_Empresarial está activo, THE Panel_Catálogo SHALL permitir al Dueño configurar un color primario y subir un logo personalizado para el Catálogo_Online.
5. WHEN un visitante intenta realizar un Pedido_Online en una empresa con Plan_Básico, THE Catálogo_Online SHALL mostrar un mensaje indicando que los pedidos no están disponibles en el plan actual.
6. IF la suscripción de la empresa está vencida o inactiva, THEN THE Catálogo_Online SHALL comportarse como si el catálogo estuviera desactivado y retornar HTTP 404.

---

### Requisito 7: Personalización de marca (Plan Empresarial)

**User Story:** Como dueño con Plan Empresarial, quiero personalizar los colores y el logo de mi catálogo, para que refleje la identidad visual de mi negocio.

#### Criterios de Aceptación

1. WHERE el Plan_Empresarial está activo, THE Panel_Catálogo SHALL mostrar un selector de color primario que se aplique al encabezado, botones y acentos del Catálogo_Online.
2. WHERE el Plan_Empresarial está activo, THE Panel_Catálogo SHALL permitir subir un logo en formato PNG o JPG de hasta 2 MB para mostrarlo en el encabezado del Catálogo_Online.
3. WHEN el Dueño guarda la configuración de personalización, THE Catálogo_Online SHALL reflejar los cambios en la próxima carga de la página.
4. WHERE el Plan_Básico o Plan_Profesional está activo, THE Panel_Catálogo SHALL mostrar las opciones de personalización como bloqueadas con un indicador del plan requerido.
