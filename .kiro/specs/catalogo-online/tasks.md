# Plan de Implementación: Catálogo Online / Link de Ventas

## Visión General

Implementación incremental del catálogo online público con carrito y pedidos, integrado al ERP existente. Cada tarea construye sobre la anterior y termina con todo conectado.

## Tareas

- [x] 1. Migración de base de datos y tipos TypeScript
  - Crear script SQL `scripts/250_create_catalogo_online.sql` con:
    - Tabla `catalog_settings` (company_id, is_active, primary_color, logo_url)
    - Tabla `online_orders` (order_number, status, visitor_name, visitor_phone, visitor_address, visitor_notes, items JSONB, subtotal, total, currency, confirmed_at, rejected_at)
    - Campo `published boolean DEFAULT false` en tabla `products`
    - Índices necesarios
    - Políticas RLS para lectura pública de productos publicados y catalog_settings activos
    - Política RLS para inserción pública en online_orders
    - Política RLS para acceso autenticado del dueño a sus datos
  - Crear `lib/types/catalogo.ts` con interfaces: `CatalogSettings`, `OnlineOrder`, `OnlineOrderItem`, `CartItem`, `CatalogoPublicoData`, `CatalogoProduct`, `CatalogoVariant`, `PlanTier`
  - _Requisitos: 1.1, 1.4, 2.1, 4.2, 4.3_

- [x] 2. Server Actions del dashboard (configuración del catálogo)
  - [x] 2.1 Crear `lib/actions/catalogo.ts` con las funciones del dashboard:
    - `getCatalogoConfig()`: obtiene catalog_settings de la empresa autenticada
    - `toggleCatalogo(isActive: boolean)`: activa/desactiva el catálogo
    - `getProductosParaCatalogo()`: lista productos activos con campo published
    - `toggleProductoPublicado(productId: string, published: boolean)`: actualiza campo published
    - `getPedidosOnline(filtros?)`: lista pedidos online con filtro por estado
    - `confirmarPedidoOnline(orderId: string)`: cambia status a 'confirmado'
    - `rechazarPedidoOnline(orderId: string)`: cambia status a 'rechazado'
    - `guardarPersonalizacion(color: string, logoUrl?: string)`: guarda personalización (solo Plan Empresarial)
    - Función helper `getPlanTier(planName: string): PlanTier`
    - _Requisitos: 1.1, 1.2, 1.4, 1.5, 1.6, 5.1, 5.3, 5.4, 6.4, 7.1, 7.3_

  - [ ]* 2.2 Escribir tests de propiedad para Server Actions del dashboard
    - **Propiedad 9: Transiciones de estado de pedidos** — para todo pedido en estado 'pendiente', confirmar debe resultar en 'confirmado' y rechazar en 'rechazado'
    - **Propiedad 10: Filtro de pedidos por estado** — para todo filtro de estado aplicado, todos los pedidos retornados deben tener ese estado
    - **Propiedad 11: Toggle de publicación** — para todo producto, publicar y luego leer debe retornar published=true; despublicar y leer debe retornar published=false
    - **Propiedad 12: Round-trip de personalización** — guardar color/logo y luego leer debe retornar los mismos valores
    - **Valida: Requisitos 1.5, 1.6, 5.3, 5.4, 5.5, 7.3**

- [x] 3. Server Action pública y API Route para pedidos
  - [x] 3.1 Crear `lib/actions/catalogo-publico.ts` con:
    - `getCatalogoPublico(slug: string)`: obtiene datos públicos del catálogo usando service role (empresa, settings, productos publicados con variantes, plan_tier, orders_this_month)
    - Retorna `null` si el catálogo no existe, está inactivo o la suscripción está vencida
    - _Requisitos: 2.1, 2.2, 2.3, 6.1, 6.2, 6.3_

  - [x] 3.2 Crear `app/api/catalogo/pedido/route.ts` (POST):
    - Recibe: `{ slug, visitor_name, visitor_phone, visitor_address?, visitor_notes?, items }`
    - Valida campos obligatorios (nombre, teléfono, ítems no vacíos)
    - Verifica catálogo activo y plan de la empresa
    - Verifica límite mensual para Plan Profesional (máx 50 pedidos no rechazados en el mes)
    - Verifica stock de cada ítem antes de crear el pedido
    - Genera `order_number` secuencial (ej: "PO-0001")
    - Inserta en `online_orders` con snapshot de ítems y total calculado
    - Crea notificación en el sistema existente de notificaciones del ERP
    - Retorna `{ success: true, order_number }` o error con código HTTP apropiado
    - _Requisitos: 4.1, 4.2, 4.3, 4.4, 4.6, 4.7, 5.6, 6.2, 6.3_

  - [ ]* 3.3 Escribir tests de propiedad para la lógica de creación de pedidos
    - **Propiedad 4: Snapshot del pedido es consistente** — para todo pedido creado con ítems válidos, la suma de subtotales en items JSONB debe ser igual al campo total
    - **Propiedad 5: Límite mensual Plan Profesional** — para toda empresa Pro con count >= 50 pedidos en el mes, el intento de crear un pedido debe ser rechazado
    - **Propiedad 8: Validación rechaza campos vacíos** — para todo input con nombre o teléfono vacío o solo whitespace, no se debe crear el pedido
    - **Propiedad 15: Notificación al crear pedido** — para todo pedido creado exitosamente, debe existir una notificación asociada
    - **Valida: Requisitos 4.2, 4.3, 4.4, 4.7, 5.6, 6.2**

- [x] 4. Checkpoint — Verificar que todos los tests pasan hasta aquí
  - Asegurarse de que todos los tests pasan. Consultar al usuario si surgen dudas.

- [x] 5. Componentes del catálogo público (UI)
  - [x] 5.1 Crear `app/catalogo/[slug]/page.tsx` (Server Component):
    - Llama a `getCatalogoPublico(slug)`
    - Si retorna null, llama a `notFound()`
    - Renderiza `CatalogoPublico` pasando los datos
    - Sin layout del dashboard (layout propio o sin layout)
    - _Requisitos: 2.1, 2.5, 2.6, 2.7_

  - [x] 5.2 Crear `app/catalogo/[slug]/not-found.tsx`:
    - Página 404 amigable con mensaje claro
    - _Requisitos: 2.6_

  - [x] 5.3 Crear `components/catalogo/catalogo-publico.tsx` (Client Component):
    - Recibe `CatalogoPublicoData` como props
    - Maneja estado del carrito (array de `CartItem`) en useState
    - Renderiza encabezado con nombre/logo de empresa (y color primario si Plan Empresarial)
    - Renderiza grid de productos con `ProductoCard`
    - Renderiza `CarritoDrawer` (visible/oculto según plan_tier)
    - Si plan_tier = 'basico', oculta carrito y botón de pedido
    - _Requisitos: 2.5, 3.7, 6.1_

  - [x] 5.4 Crear `components/catalogo/producto-card.tsx`:
    - Muestra imagen (o placeholder), nombre, precio, descripción
    - Si has_variants=true, renderiza `VarianteSelectorCatalogo`
    - Si stock=0 (o variante seleccionada sin stock), muestra "Sin stock" y deshabilita botón
    - Botón "Agregar al carrito" llama al callback del padre
    - _Requisitos: 2.2, 2.3, 2.4_

  - [x] 5.5 Crear `components/catalogo/variante-selector.tsx`:
    - Selector de variantes con nombre y stock disponible
    - Deshabilita variantes con stock=0
    - _Requisitos: 2.3, 2.4_

  - [ ]* 5.6 Escribir tests de propiedad para lógica del carrito
    - **Propiedad 1: Solo productos publicados** — para toda lista mixta de productos, el filtro de publicados retorna solo los con published=true AND is_active=true
    - **Propiedad 2: Carrito respeta stock** — para todo ítem en el carrito, quantity <= max_stock
    - **Propiedad 3: Total del carrito es consistente** — para todo carrito, total = suma(quantity × unit_price) de cada ítem
    - **Propiedad 7: Agregar mismo ítem incrementa cantidad** — para todo carrito con un ítem ya presente, agregar el mismo ítem resulta en un único ítem con quantity incrementada
    - **Valida: Requisitos 2.1, 3.2, 3.4, 3.6**

- [x] 6. Componentes del formulario y confirmación de pedido
  - [x] 6.1 Crear `components/catalogo/carrito-drawer.tsx`:
    - Panel lateral (drawer) con lista de ítems del carrito
    - Muestra nombre, variante, cantidad (con controles +/-), precio unitario, subtotal
    - Muestra total general
    - Botón para eliminar ítem (setea quantity=0)
    - Botón "Confirmar pedido" que abre `FormularioPedido`
    - _Requisitos: 3.3, 3.4, 3.5_

  - [x] 6.2 Crear `components/catalogo/formulario-pedido.tsx`:
    - Campos: nombre completo (obligatorio), teléfono (obligatorio), dirección (opcional), notas (opcional)
    - Validación client-side antes de enviar
    - Al enviar, llama a `POST /api/catalogo/pedido`
    - Muestra estado de carga durante el envío
    - En éxito, renderiza `ConfirmacionPedido` y vacía el carrito
    - En error, muestra mensaje descriptivo
    - _Requisitos: 4.1, 4.4, 4.5, 4.6_

  - [x] 6.3 Crear `components/catalogo/confirmacion-pedido.tsx`:
    - Muestra número de pedido y mensaje de agradecimiento
    - Botón para volver al catálogo
    - _Requisitos: 4.5_

  - [ ]* 6.4 Escribir tests de propiedad para validación del formulario y carrito
    - **Propiedad 8: Validación rechaza campos vacíos** — para todo string de nombre o teléfono compuesto solo de whitespace, la validación debe rechazarlo
    - **Propiedad 14: Pedido creado vacía el carrito** — tras un envío exitoso, el carrito debe quedar con 0 ítems
    - **Valida: Requisitos 4.4, 4.6**

- [x] 7. Checkpoint — Verificar que todos los tests pasan hasta aquí
  - Asegurarse de que todos los tests pasan. Consultar al usuario si surgen dudas.

- [x] 8. Panel de gestión del catálogo en el dashboard
  - [x] 8.1 Crear `app/dashboard/catalogo/page.tsx` (Server Component):
    - Obtiene configuración del catálogo y pedidos online
    - Renderiza `ConfigCatalogo` y `PedidosOnlineTable`
    - _Requisitos: 1.1, 5.1_

  - [x] 8.2 Crear `components/dashboard/catalogo/config-catalogo.tsx`:
    - Toggle para activar/desactivar el catálogo (llama a `toggleCatalogo`)
    - Cuando activo, muestra URL pública con botón de copiar
    - Si Plan Empresarial: selector de color primario y upload de logo (PNG/JPG, máx 2MB)
    - Si Plan Básico o Profesional: muestra opciones de personalización bloqueadas con badge del plan requerido
    - _Requisitos: 1.1, 1.2, 6.4, 7.1, 7.2, 7.4_

  - [x] 8.3 Crear `components/dashboard/catalogo/productos-publicados-table.tsx`:
    - Tabla de productos activos con toggle de publicación por fila
    - Llama a `toggleProductoPublicado` al cambiar el toggle
    - _Requisitos: 1.4, 1.5, 1.6_

  - [x] 8.4 Crear `components/dashboard/catalogo/pedidos-online-table.tsx`:
    - Lista de pedidos online ordenados por fecha descendente
    - Columnas: número, visitante, total, estado (badge), fecha
    - Filtro por estado (pendiente/confirmado/rechazado)
    - Al hacer clic en un pedido, abre `DetallePedidoOnline`
    - _Requisitos: 5.1, 5.5_

  - [x] 8.5 Crear `components/dashboard/catalogo/detalle-pedido-online.tsx`:
    - Modal con detalle completo del pedido: datos del visitante, ítems, total, notas
    - Botones "Confirmar" y "Rechazar" (solo visibles si estado = 'pendiente')
    - Llama a `confirmarPedidoOnline` o `rechazarPedidoOnline`
    - _Requisitos: 5.2, 5.3, 5.4_

  - [ ]* 8.6 Escribir tests de propiedad para el panel del dashboard
    - **Propiedad 16: Pedidos ordenados por fecha descendente** — para toda lista de pedidos, el primero debe tener created_at >= que el último
    - **Propiedad 6: Catálogo inactivo no expone datos** — para toda empresa con is_active=false, getCatalogoPublico debe retornar null
    - **Valida: Requisitos 1.3, 2.6, 5.1**

- [x] 9. Agregar enlace al catálogo en la navegación del dashboard
  - Agregar ítem "Catálogo Online" en el sidebar del dashboard (`app/dashboard/layout.tsx` o componente de navegación)
  - _Requisitos: 1.1_

- [x] 10. Checkpoint final — Verificar que todos los tests pasan
  - Asegurarse de que todos los tests pasan. Consultar al usuario si surgen dudas.

## Notas

- Las tareas marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido
- Cada tarea referencia requisitos específicos para trazabilidad
- Los tests de propiedad usan **fast-check** (ya instalado en el proyecto)
- Cada test de propiedad debe ejecutarse con mínimo 100 iteraciones
- Tag de referencia para cada test: `Feature: catalogo-online, Property N: <texto>`
- La API Route usa el service role de Supabase para operaciones que requieren bypass de RLS
