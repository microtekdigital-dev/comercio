# ✅ Sistema de Avisos de Vencimiento de Planes - INSTALADO

## Resumen
Sistema automático que notifica a los usuarios cuando su plan está próximo a vencer, comenzando desde **5 días antes** del vencimiento.

## ¿Qué hace?

### Notificaciones Automáticas
- ⏰ **5 días antes**: "Tu plan vence en 5 días"
- ⏰ **4 días antes**: "Tu plan vence en 4 días"
- ⏰ **3 días antes**: "Tu plan vence en 3 días"
- ⚠️ **2 días antes**: "Tu plan vence en 2 días" (prioridad alta)
- ⚠️ **1 día antes**: "Tu plan vence mañana" (urgente)
- ❌ **Día del vencimiento**: "Tu plan ha expirado" (urgente)

### Características
✅ Notificaciones in-app (campana en el dashboard)
✅ Link directo a página de facturación
✅ Prioridad según urgencia (normal → alta → urgente)
✅ No duplica notificaciones (una cada 24h)
✅ Marca automáticamente planes vencidos como "expired"

## Instalación

### Paso 1: Ejecutar Script SQL
En Supabase SQL Editor, ejecuta:
```
scripts/114_subscription_expiry_notifications.sql
```

### Paso 2: Configurar Cron Job

#### Opción A: Vercel Cron (Recomendado)
Crea o actualiza `vercel.json` en la raíz del proyecto:
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

#### Opción B: Servicio Externo
Usa cron-job.org o similar para llamar cada 6 horas a:
```
https://tu-dominio.com/api/cron/notifications
```

Con header:
```
Authorization: Bearer TU_CRON_SECRET
```

### Paso 3: Variable de Entorno
Agrega en `.env.local`:
```
CRON_SECRET=genera_un_secreto_aleatorio_aqui
```

## Prueba Manual

Para probar que funciona, ejecuta en Supabase SQL Editor:
```sql
-- Verificar suscripciones próximas a vencer
SELECT check_subscription_expiry_notifications();

-- Ver notificaciones creadas
SELECT title, message, priority, created_at
FROM notifications
WHERE type = 'subscription_expiry'
ORDER BY created_at DESC
LIMIT 5;
```

## Archivos Modificados

### Nuevos
- `scripts/114_subscription_expiry_notifications.sql` - Script de instalación
- `docs-auth/NOTIFICACIONES_VENCIMIENTO_PLANES.md` - Documentación completa
- `SISTEMA_AVISOS_VENCIMIENTO.md` - Este archivo

### Actualizados
- `lib/actions/notifications.ts` - Agregados tipos y funciones
- `app/api/cron/notifications/route.ts` - Ya ejecuta las nuevas funciones

## Cómo se Ve para el Usuario

1. **Campana de notificaciones** en el header muestra un badge con el número
2. **Al hacer clic** ve la lista de notificaciones
3. **Notificación de vencimiento** muestra:
   - Título: "⏰ Tu plan vence en X días"
   - Mensaje: "Tu plan Profesional vence el 15/02/2026. Renueva tu suscripción..."
   - Botón para ir a facturación
4. **Color según urgencia**:
   - Azul: 3-5 días
   - Naranja: 2 días
   - Rojo: 1 día o vencido

## Próximos Pasos

1. ✅ Ejecuta el script SQL
2. ✅ Configura el cron job
3. ✅ Prueba manualmente
4. ✅ Espera 6 horas para la primera ejecución automática
5. ✅ Verifica que las notificaciones aparezcan en el dashboard

## Notas

- El sistema NO envía emails (solo notificaciones in-app)
- Las notificaciones se crean automáticamente cada 6 horas
- Los usuarios pueden marcar como leídas las notificaciones
- El sistema funciona para todos los planes (Trial, Básico, Profesional, Empresarial)
