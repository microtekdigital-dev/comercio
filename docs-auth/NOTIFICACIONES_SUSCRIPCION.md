# Notificaciones de Suscripción por Email

## Configuración

Para recibir notificaciones por email cuando alguien se suscriba al programa, necesitas configurar las siguientes variables de entorno:

### Variables Requeridas

```env
# Email del administrador que recibirá las notificaciones
ADMIN_NOTIFICATION_EMAIL=tu-email@ejemplo.com

# API Key de Resend (ya configurada)
RESEND_API_KEY=re_tu_api_key

# Email desde el cual se enviarán las notificaciones (ya configurada)
RESEND_FROM_EMAIL=onboarding@tudominio.com
```

## Tipos de Notificaciones

### 1. Nueva Suscripción de Pago
Se envía automáticamente cuando un usuario completa un pago a través de MercadoPago.

**Información incluida:**
- Nombre de la empresa
- Nombre del usuario
- Email del usuario
- Plan seleccionado
- Fecha y hora de la suscripción
- Estado: Suscripción de Pago

### 2. Nuevo Trial (Prueba Gratuita)
Se envía cuando un nuevo usuario se registra y activa el trial de 14 días.

**Información incluida:**
- Nombre de la empresa
- Nombre del usuario
- Email del usuario
- Plan: Trial (14 días)
- Fecha y hora del registro
- Estado: Prueba Gratuita
- Recordatorio: El trial expira en 14 días

## Cómo Configurar

### Paso 1: Agregar Variable de Entorno

En tu archivo `.env.local` (local) o en Vercel (producción), agrega:

```env
ADMIN_NOTIFICATION_EMAIL=tu-email@ejemplo.com
```

### Paso 2: Verificar Configuración de Resend

Asegúrate de que ya tienes configuradas estas variables:

```env
RESEND_API_KEY=re_tu_api_key_real
RESEND_FROM_EMAIL=onboarding@tudominio.com
```

### Paso 3: Deploy

Si estás en Vercel:
1. Ve a tu proyecto en Vercel
2. Settings → Environment Variables
3. Agrega `ADMIN_NOTIFICATION_EMAIL` con tu email
4. Redeploy el proyecto

## Funcionamiento

### Suscripciones de Pago
- Se activan automáticamente cuando MercadoPago confirma el pago
- El webhook `/api/mercadopago/webhook` procesa el pago
- Si es una nueva suscripción (no una renovación), se envía el email

### Trials
- Se activan cuando un usuario se registra
- El trigger de base de datos `handle_new_user` crea la suscripción trial
- Puedes agregar la notificación en este punto (ver sección siguiente)

## Agregar Notificación para Trials

Para recibir notificaciones también cuando alguien inicia un trial, necesitas:

### Opción 1: Modificar el Trigger de Base de Datos (Recomendado)

Crear una función Edge en Supabase que llame a tu API cuando se cree un trial:

```sql
-- Crear función que notifica nuevos trials
CREATE OR REPLACE FUNCTION notify_new_trial()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo notificar si es un trial (plan con price = 0)
  IF EXISTS (
    SELECT 1 FROM plans 
    WHERE id = NEW.plan_id 
    AND price = 0
  ) THEN
    -- Llamar a tu API endpoint para enviar notificación
    PERFORM net.http_post(
      url := 'https://tu-dominio.com/api/notifications/new-trial',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := json_build_object(
        'subscription_id', NEW.id,
        'company_id', NEW.company_id
      )::text
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear trigger
CREATE TRIGGER on_trial_created
  AFTER INSERT ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_trial();
```

### Opción 2: Endpoint API para Notificaciones de Trial

Crear un endpoint `/api/notifications/new-trial/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendNewSubscriptionNotification } from "@/lib/email/resend";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function POST(request: NextRequest) {
  try {
    const { subscription_id, company_id } = await request.json();

    // Get subscription details
    const { data: subscription } = await supabaseAdmin
      .from("subscriptions")
      .select("*, plan:plans(*)")
      .eq("id", subscription_id)
      .single();

    if (!subscription) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    // Get company and user details
    const { data: company } = await supabaseAdmin
      .from("companies")
      .select("name")
      .eq("id", company_id)
      .single();

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("full_name, id")
      .eq("company_id", company_id)
      .eq("role", "admin")
      .single();

    if (profile) {
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(profile.id);
      
      if (authUser?.user?.email && company) {
        await sendNewSubscriptionNotification(
          authUser.user.email,
          profile.full_name || "Usuario",
          company.name || "Empresa",
          subscription.plan?.name || "Trial",
          true // Is a trial
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending trial notification:", error);
    return NextResponse.json(
      { error: "Failed to send notification" },
      { status: 500 }
    );
  }
}
```

## Pruebas

### Probar Notificación de Pago
1. Completa un pago de prueba en MercadoPago
2. Verifica que recibas el email en `ADMIN_NOTIFICATION_EMAIL`

### Probar Notificación de Trial
1. Registra un nuevo usuario
2. Verifica que recibas el email de trial

## Troubleshooting

### No recibo emails

1. **Verifica las variables de entorno:**
   ```bash
   echo $ADMIN_NOTIFICATION_EMAIL
   echo $RESEND_API_KEY
   ```

2. **Revisa los logs:**
   - En Vercel: Ve a tu proyecto → Logs
   - Busca mensajes de `[Resend]`

3. **Verifica Resend:**
   - Ve a https://resend.com/emails
   - Revisa el estado de los emails enviados

### Emails van a spam

1. Configura SPF, DKIM y DMARC en tu dominio
2. Usa un dominio verificado en Resend
3. Evita palabras spam en el asunto

## Personalización

Puedes personalizar los emails editando la función `sendNewSubscriptionNotification` en `lib/email/resend.ts`:

- Cambiar el diseño del email
- Agregar más información
- Modificar el asunto
- Cambiar los colores

## Seguridad

- Las notificaciones solo se envían al email configurado en `ADMIN_NOTIFICATION_EMAIL`
- No se expone información sensible de pago
- Los webhooks de MercadoPago están protegidos
- Las funciones de base de datos usan `SECURITY DEFINER`
