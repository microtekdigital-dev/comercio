# 🔔 Sistema de Notificaciones - Campanita

## Descripción General

La campanita de notificaciones en el dashboard muestra alertas importantes sobre eventos del sistema ERP. Se actualiza automáticamente cada 30 segundos.

## Tipos de Notificaciones

### 1. 📦 Stock Bajo (low_stock)
**Cuándo se genera:**
- Cuando un producto alcanza o está por debajo de su nivel mínimo de stock
- Solo para productos con seguimiento de inventario activo
- Se genera máximo una vez cada 24 horas por producto

**Información mostrada:**
- Nombre del producto
- Cantidad actual en stock
- Enlace directo al producto

**Prioridad:** Alta (High)

**Ejemplo:**
```
Título: Stock Bajo
Mensaje: El producto "Remera Nike" tiene stock bajo (3 unidades)
```

---

### 2. 💰 Pago Pendiente (pending_payment)
**Cuándo se genera:**
- Cuando una venta tiene pagos pendientes después de 3 días
- Solo para ventas en estado "pending" o "confirmed"
- Se genera máximo una vez cada 7 días por venta

**Información mostrada:**
- Número de venta
- Días transcurridos desde la venta
- Monto pendiente
- Enlace directo a la venta

**Prioridad:**
- Normal: 3-15 días
- Alta (High): 15-30 días
- Urgente (Urgent): Más de 30 días

**Ejemplo:**
```
Título: Pago Pendiente
Mensaje: La venta #00123 tiene pagos pendientes (15 días)
```

---

### 3. 🛒 Nueva Venta (new_sale)
**Cuándo se genera:**
- Cuando se registra una nueva venta en el sistema
- Notificación inmediata

**Información mostrada:**
- Número de venta
- Cliente
- Monto total
- Enlace directo a la venta

**Prioridad:** Normal

---

### 4. ✅ Pago Recibido (payment_received)
**Cuándo se genera:**
- Cuando se registra un pago en una venta
- Notificación inmediata

**Información mostrada:**
- Número de venta
- Monto del pago
- Método de pago
- Enlace directo a la venta

**Prioridad:** Normal

---

### 5. ⚙️ Sistema (system)
**Cuándo se genera:**
- Actualizaciones del sistema
- Mantenimientos programados
- Cambios importantes en funcionalidades
- Mensajes administrativos

**Información mostrada:**
- Título del mensaje
- Descripción del evento
- Enlace opcional a más información

**Prioridad:** Variable (Low, Normal, High, Urgent)

---

### 6. 📅 Vencimiento de Suscripción (subscription_expiry)
**Cuándo se genera:**
- 5 días antes del vencimiento de la suscripción
- Recordatorio para renovar el plan

**Información mostrada:**
- Días restantes hasta el vencimiento
- Plan actual
- Enlace a la página de planes

**Prioridad:** Alta (High)

**Ejemplo:**
```
Título: Tu suscripción está por vencer
Mensaje: Tu plan Profesional vence en 5 días. Renueva para seguir disfrutando de todas las funcionalidades.
```

---

### 7. ⚠️ Suscripción Vencida (subscription_expired)
**Cuándo se genera:**
- Cuando la suscripción ha vencido
- Notificación inmediata al vencimiento

**Información mostrada:**
- Plan que venció
- Funcionalidades que se desactivaron
- Enlace a la página de planes

**Prioridad:** Urgente (Urgent)

**Ejemplo:**
```
Título: Tu suscripción ha vencido
Mensaje: Tu plan Profesional ha vencido. Renueva ahora para recuperar el acceso completo.
```

---

## Características del Sistema

### Visualización
- **Badge rojo:** Muestra el número de notificaciones no leídas (máximo 9+)
- **Fondo azul claro:** Notificaciones no leídas se destacan
- **Iconos:** Cada tipo tiene su emoji identificador
- **Colores de prioridad:**
  - 🔴 Urgente: Rojo
  - 🟠 Alta: Naranja
  - 🔵 Normal: Azul
  - ⚪ Baja: Gris

### Funcionalidades
1. **Ver detalles:** Click en "Ver detalles →" para ir al recurso relacionado
2. **Marcar como leída:** Click en ✓ para marcar individual
3. **Marcar todas:** Botón "Marcar todas" para leer todas de una vez
4. **Eliminar:** Click en 🗑️ para eliminar notificación
5. **Tiempo relativo:** Muestra "Hace 5m", "Hace 2h", "Hace 3d"

### Actualización Automática
- Se actualiza cada 30 segundos automáticamente
- No requiere recargar la página
- Contador de no leídas se actualiza en tiempo real

---

## Preferencias de Notificaciones

Los usuarios pueden configurar qué notificaciones recibir desde:
**Dashboard → Configuración → Notificaciones**

### Opciones Disponibles:
- ✅ Stock Bajo
- ✅ Pagos Pendientes
- ✅ Nuevas Ventas
- ✅ Pagos Recibidos
- ✅ Notificaciones del Sistema
- 📧 Notificaciones por Email (próximamente)

---

## Verificaciones Automáticas

El sistema ejecuta verificaciones periódicas para generar notificaciones:

### 1. Stock Bajo
- **Frecuencia:** Cada hora (configurado en cron job)
- **Condición:** `stock_quantity <= min_stock_level`
- **Límite:** Una notificación cada 24 horas por producto

### 2. Pagos Pendientes
- **Frecuencia:** Diaria (configurado en cron job)
- **Condición:** Ventas con saldo pendiente > 3 días
- **Límite:** Una notificación cada 7 días por venta

### 3. Vencimiento de Suscripción
- **Frecuencia:** Diaria
- **Condición:** 5 días antes del vencimiento
- **Límite:** Una notificación por período

---

## Alcance de las Notificaciones

### Por Empresa
- Cada notificación pertenece a una empresa específica
- Los usuarios solo ven notificaciones de su empresa
- Las notificaciones se comparten entre todos los usuarios de la empresa

### Por Usuario
- Algunas notificaciones pueden ser específicas para un usuario
- Las preferencias son individuales por usuario

---

## Estructura de Datos

### Campos de una Notificación:
```typescript
{
  id: string              // UUID único
  company_id: string      // Empresa a la que pertenece
  user_id: string | null  // Usuario específico (opcional)
  type: string            // Tipo de notificación
  title: string           // Título corto
  message: string         // Mensaje descriptivo
  link: string | null     // Enlace al recurso (opcional)
  is_read: boolean        // Estado de lectura
  priority: string        // Prioridad (low, normal, high, urgent)
  created_at: string      // Fecha de creación
  read_at: string | null  // Fecha de lectura
  metadata: object        // Datos adicionales (IDs, cantidades, etc.)
}
```

---

## Casos de Uso Comunes

### 1. Reposición de Stock
1. Sistema detecta stock bajo
2. Genera notificación 📦
3. Usuario hace click en "Ver detalles"
4. Va directo al producto
5. Crea orden de compra para reponer

### 2. Seguimiento de Cobros
1. Sistema detecta pago pendiente > 3 días
2. Genera notificación 💰
3. Usuario revisa la venta
4. Contacta al cliente
5. Registra el pago

### 3. Renovación de Plan
1. Sistema detecta vencimiento próximo
2. Genera notificación 📅
3. Usuario hace click en "Ver detalles"
4. Va a página de planes
5. Renueva la suscripción

---

## Notas Técnicas

### Base de Datos
- Tabla: `notifications`
- Tabla de preferencias: `notification_preferences`
- RLS habilitado para seguridad

### Funciones SQL
- `check_low_stock_notifications()` - Verifica stock bajo
- `check_pending_payment_notifications()` - Verifica pagos pendientes
- `check_subscription_expiry_notifications()` - Verifica vencimientos
- `check_expired_subscriptions()` - Verifica suscripciones vencidas

### API
- `getNotifications()` - Obtiene notificaciones
- `getUnreadCount()` - Cuenta no leídas
- `markAsRead()` - Marca como leída
- `markAllAsRead()` - Marca todas como leídas
- `deleteNotification()` - Elimina notificación
- `createNotification()` - Crea notificación (sistema)

---

## Resumen

La campanita de notificaciones es un sistema completo que:
- ✅ Alerta sobre eventos importantes del negocio
- ✅ Ayuda a tomar decisiones oportunas
- ✅ Mejora la gestión de inventario y cobros
- ✅ Mantiene informado sobre el estado del sistema
- ✅ Es configurable según preferencias del usuario
- ✅ Se actualiza automáticamente en tiempo real

---

**Ubicación:** Header del dashboard (esquina superior derecha)
**Acceso:** Todos los usuarios (admin y empleados)
**Actualización:** Automática cada 30 segundos
