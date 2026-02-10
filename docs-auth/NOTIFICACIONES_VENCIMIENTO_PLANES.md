# Sistema de Notificaciones de Vencimiento de Planes

## Descripción
Sistema automático que notifica a los usuarios cuando su plan de suscripción está próximo a vencer, comenzando desde 5 días antes del vencimiento.

## Características

### Notificaciones de Vencimiento Próximo
- ⏰ **5 días antes**: Notificación normal
- ⏰ **3-4 días antes**: Notificación normal
- ⚠️ **2 días antes**: Notificación de alta prioridad
- ⚠️ **1 día antes**: Notificación urgente

### Notificaciones de Expiración
- ❌ Cuando el plan vence, se marca como "expired"
- ❌ Se crea una notificación urgente
- ❌ El usuario debe renovar para continuar

## Instalación

### 1. Ejecutar Script SQL
Ejecuta el script en Supabase SQL Editor:
```
scripts/114_subscription_expiry_notifications.sql
```

Este script crea:
- `check_subscription_expiry_notifications()` - Verifica planes próximos a vencer
- `check_expired_subscriptions()` - Marca planes vencidos

### 2. Código Actualizado
El código ya está actualizado en:
- `lib/actions/notifications.ts` - Incluye los nuevos tipos de notificación
- `app/api/cron/notifications/route.ts` - Ya ejecuta las nuevas funciones

## Funcionamiento

### Verificación Automática
El sistema verifica automáticamente cada vez que se ejecuta el cron job `/api/cron/notifications`:

1. **Busca suscripciones activas** que vencen en los próximos 5 días
2. **Calcula días restantes** hasta el vencimiento
3. **Crea notificaciones** con prioridad según urgencia
4. **Evita duplicados** - No notifica si ya hay una notificación reciente (24h)

### Prioridades
```typescript
días_restantes <= 1  → 'urgent'  (⚠️ Rojo)
días_restantes <= 2  → 'high'    (⚠️ Naranja)
días_restantes >= 3  → 'normal'  (⏰ Azul)
```

### Tipos de Notificación

#### `subscription_expiry`
- Título: "⏰ Tu plan vence en X días" o "⚠️ Tu plan vence mañana"
- Mensaje: Incluye nombre del plan y fecha de vencimiento
- Link: `/dashboard/billing`
- Metadata: subscription_id, plan_name, days_remaining, expiry_date, price, interval

#### `subscription_expired`
- Título: "❌ Tu plan ha expirado"
- Mensaje: Indica que el plan expiró y debe renovar
- Link: `/dashboard/billing`
- Metadata: subscription_id, plan_name, expired_at

## Configuración del Cron Job

### Opción 1: Vercel Cron (Recomendado)
Agrega en `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/notifications",
      "schedule": "0 */6 * * *"
    }
  ]
}
```
Esto ejecuta cada 6 horas.

### Opción 2: Servicio Externo
Usa servicios como:
- **cron-job.org**
- **EasyCron**
- **GitHub Actions**

Configura para llamar a:
```
https://tu-dominio.com/api/cron/notifications
```

Agrega el header de autorización:
```
Authorization: Bearer TU_CRON_SECRET
```

### Variable de Entorno
Agrega en `.env.local`:
```
CRON_SECRET=tu_secreto_aleatorio_aqui
```

## Pruebas Manuales

### Ejecutar Verificación de Vencimientos
```sql
SELECT check_subscription_expiry_notifications();
```

### Ejecutar Verificación de Expirados
```sql
SELECT check_expired_subscriptions();
```

### Ver Notificaciones Creadas
```sql
SELECT 
  title,
  message,
  priority,
  created_at,
  metadata
FROM notifications
WHERE type IN ('subscription_expiry', 'subscription_expired')
ORDER BY created_at DESC
LIMIT 10;
```

### Simular Vencimiento Próximo
Para probar, puedes modificar temporalmente una suscripción:
```sql
-- Hacer que una suscripción venza en 3 días
UPDATE subscriptions
SET current_period_end = NOW() + INTERVAL '3 days'
WHERE id = 'ID_DE_SUSCRIPCION';

-- Ejecutar verificación
SELECT check_subscription_expiry_notifications();

-- Ver notificación creada
SELECT * FROM notifications 
WHERE type = 'subscription_expiry' 
ORDER BY created_at DESC LIMIT 1;
```

## Integración con el Frontend

Las notificaciones aparecen automáticamente en:
- **Campana de notificaciones** en el header del dashboard
- **Página de notificaciones** (si existe)
- **Badge con contador** de notificaciones no leídas

Los usuarios pueden:
- Ver el mensaje completo
- Hacer clic para ir a `/dashboard/billing`
- Marcar como leída
- Ver días restantes en los metadatos

## Comportamiento

### Planes que NO se notifican
- Planes con `cancel_at_period_end = true` (ya marcados para cancelar)
- Planes con status != 'active'
- Planes sin `current_period_end` definido

### Planes que SÍ se notifican
- Planes activos
- Con fecha de vencimiento en los próximos 5 días
- No marcados para cancelar
- Sin notificación reciente (últimas 24h)

## Mantenimiento

### Logs
El sistema genera logs en Postgres:
```
NOTICE: Notificación creada para Bazar Lili - Plan: Profesional - Días restantes: 3
NOTICE: Verificación de vencimientos completada
```

### Monitoreo
Verifica que el cron job se ejecute correctamente:
```sql
-- Ver últimas notificaciones de vencimiento
SELECT 
  COUNT(*) as total,
  DATE(created_at) as fecha
FROM notifications
WHERE type IN ('subscription_expiry', 'subscription_expired')
GROUP BY DATE(created_at)
ORDER BY fecha DESC
LIMIT 7;
```

## Notas Importantes

1. ✅ El sistema NO envía emails automáticamente (solo notificaciones in-app)
2. ✅ Las notificaciones se crean una vez cada 24 horas por suscripción
3. ✅ Los planes Trial también reciben notificaciones de vencimiento
4. ✅ El sistema marca automáticamente como "expired" los planes vencidos
5. ✅ Las notificaciones tienen link directo a la página de facturación

## Próximos Pasos (Opcional)

Si quieres agregar notificaciones por email:
1. Integrar con Resend en `runNotificationChecks()`
2. Enviar email cuando `days_remaining <= 2`
3. Usar template de email personalizado
