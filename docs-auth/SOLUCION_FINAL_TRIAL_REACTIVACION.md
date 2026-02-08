# SOLUCIÓN FINAL: Detener Reactivación Automática de Trial

## 🔴 PROBLEMA IDENTIFICADO

Las suscripciones Trial se están **recreando automáticamente** cada vez que refrescas la página `/dashboard/billing`.

### Evidencia
- Suscripción ID `0eef8c78-d441-4eff-9c0b-74541481d58e` fue creada como NUEVA (created_at = updated_at)
- Se crea cada vez que refrescas la página
- El código TypeScript tiene auto-trial DESACTIVADO
- No hay llamadas a `ensureTrialSubscription` en el código

### Conclusión
El **trigger de base de datos `handle_new_user`** todavía está creando suscripciones automáticamente.

---

## ✅ SOLUCIÓN: 3 PASOS

### PASO 1: Desactivar Creación de Suscripciones en el Trigger

Ejecuta este script SQL en Supabase SQL Editor:

```sql
-- DESHABILITAR COMPLETAMENTE LA CREACIÓN DE SUSCRIPCIONES
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_company_id UUID;
  v_invite_token TEXT;
  v_invitation RECORD;
BEGIN
  -- Obtener el token de invitación
  v_invite_token := NEW.raw_user_meta_data->>'invite_token';

  -- CASO 1: Usuario invitado
  IF v_invite_token IS NOT NULL THEN
    SELECT * INTO v_invitation
    FROM public.invitations
    WHERE token = v_invite_token
    AND status = 'pending'
    AND email = NEW.email
    AND expires_at > NOW();

    IF v_invitation.id IS NOT NULL THEN
      -- Crear perfil
      INSERT INTO public.profiles (id, company_id, email, full_name, role)
      VALUES (
        NEW.id,
        v_invitation.company_id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        v_invitation.role
      );

      -- Marcar invitación como aceptada
      UPDATE public.invitations
      SET status = 'accepted'
      WHERE id = v_invitation.id;

      RETURN NEW;
    END IF;
  END IF;

  -- CASO 2: Usuario nuevo - crear empresa pero NO suscripción
  INSERT INTO public.companies (name, slug)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'company_name', 'Mi Empresa'),
    lower(replace(NEW.email, '@', '-')) || '-' || substr(md5(random()::text), 1, 8)
  )
  RETURNING id INTO v_company_id;

  -- Crear perfil
  INSERT INTO public.profiles (id, company_id, email, full_name, role)
  VALUES (
    NEW.id,
    v_company_id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'admin'
  );

  -- ============================================================================
  -- CRÍTICO: NO CREAR SUSCRIPCIÓN
  -- Las suscripciones deben crearse manualmente desde el dashboard
  -- ============================================================================
  RAISE NOTICE 'Usuario creado SIN suscripción: %', NEW.email;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error en handle_new_user para %: %', NEW.email, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Resultado esperado:** Mensaje de éxito en Supabase

---

### PASO 2: Eliminar Todas las Suscripciones Activas de Plusmar

Ejecuta este script SQL:

```sql
-- Eliminar todas las suscripciones activas de Plusmar
DELETE FROM subscriptions
WHERE company_id = 'deaf584c-8964-4ec4-a4f3-a0310aa6e308'
AND status IN ('active', 'pending');

-- Verificar que no queden suscripciones activas
SELECT 
  id,
  status,
  created_at,
  plan_id
FROM subscriptions
WHERE company_id = 'deaf584c-8964-4ec4-a4f3-a0310aa6e308'
ORDER BY created_at DESC;
```

**Resultado esperado:** 
- Mensaje: "DELETE X" (donde X es el número de suscripciones eliminadas)
- La consulta SELECT debe mostrar solo suscripciones con status = 'cancelled'

---

### PASO 3: Verificar que NO se Crean Nuevas Suscripciones

1. **Refresca la página** `/dashboard/billing` en tu navegador
2. **Ejecuta este script** para verificar:

```sql
-- Verificar si se crearon nuevas suscripciones
SELECT 
  '=== SUSCRIPCIONES ACTIVAS ===' as seccion,
  id,
  status,
  created_at,
  updated_at,
  EXTRACT(EPOCH FROM (NOW() - created_at)) / 60 as minutos_desde_creacion,
  EXTRACT(EPOCH FROM (NOW() - updated_at)) / 60 as minutos_desde_actualizacion
FROM subscriptions
WHERE company_id = 'deaf584c-8964-4ec4-a4f3-a0310aa6e308'
AND status IN ('active', 'pending')
ORDER BY created_at DESC;
```

**Resultado esperado:** 
- **NO debe haber ninguna fila** con status 'active' o 'pending'
- Si aparece alguna suscripción nueva, significa que hay otro proceso creándolas

---

## 🎯 RESULTADO FINAL

Después de ejecutar estos 3 pasos:

✅ El trigger `handle_new_user` ya NO crea suscripciones  
✅ No hay suscripciones activas para Plusmar  
✅ Al refrescar `/dashboard/billing` NO se crean nuevas suscripciones  
✅ El dashboard muestra "No tienes una suscripción activa"  
✅ El usuario puede seleccionar un plan de pago manualmente  

---

## 🔍 SI EL PROBLEMA PERSISTE (ACTUALIZADO)

**⚠️ IMPORTANTE:** Si después de ejecutar el PASO 1 todavía se crean suscripciones, necesitamos activar el sistema de auditoría para rastrear el origen.

### PASO 4: Activar Sistema de Auditoría

Ejecuta este script para crear un trigger que registre QUIÉN y CÓMO se crean las suscripciones:

```sql
-- Crear tabla de auditoría
CREATE TABLE IF NOT EXISTS subscription_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID,
  company_id UUID,
  plan_id UUID,
  action TEXT,
  old_status TEXT,
  new_status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  session_user TEXT,
  current_user_name TEXT,
  backend_pid INTEGER
);

-- Crear función de auditoría
CREATE OR REPLACE FUNCTION audit_subscription_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO subscription_audit_log (
      subscription_id,
      company_id,
      plan_id,
      action,
      old_status,
      new_status,
      session_user,
      current_user_name,
      backend_pid
    ) VALUES (
      NEW.id,
      NEW.company_id,
      NEW.plan_id,
      'INSERT',
      NULL,
      NEW.status,
      session_user,
      current_user,
      pg_backend_pid()
    );
    
    RAISE NOTICE '🚨 NUEVA SUSCRIPCIÓN CREADA: id=%, company=%, plan=%, status=%', 
      NEW.id, NEW.company_id, NEW.plan_id, NEW.status;
    
    RETURN NEW;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear trigger
DROP TRIGGER IF EXISTS audit_subscription_trigger ON subscriptions;
CREATE TRIGGER audit_subscription_trigger
AFTER INSERT ON subscriptions
FOR EACH ROW
EXECUTE FUNCTION audit_subscription_changes();
```

### PASO 5: Probar y Ver el Log

1. Elimina las suscripciones activas:
```sql
DELETE FROM subscriptions
WHERE company_id = 'deaf584c-8964-4ec4-a4f3-a0310aa6e308'
AND status IN ('active', 'pending');
```

2. Refresca `/dashboard/billing`

3. Consulta el log de auditoría:
```sql
SELECT 
  id,
  subscription_id,
  company_id,
  action,
  new_status,
  created_at,
  session_user,
  current_user_name,
  backend_pid
FROM subscription_audit_log
WHERE company_id = 'deaf584c-8964-4ec4-a4f3-a0310aa6e308'
ORDER BY created_at DESC
LIMIT 5;
```

**Esto te dirá EXACTAMENTE:**
- Qué usuario de base de datos creó la suscripción (`session_user`, `current_user_name`)
- Cuándo se creó (`created_at`)
- El ID del proceso backend (`backend_pid`)

### Posibles causas si el problema persiste:
1. **Trigger en otra tabla** que crea subscriptions
2. **Función de base de datos** que se ejecuta automáticamente
3. **Edge Function de Supabase** (revisa en Dashboard > Edge Functions)
4. **Webhook configurado** en Supabase (revisa en Dashboard > Database > Webhooks)
5. **Extensión de Supabase** ejecutando código automáticamente

---

## 📝 NOTAS IMPORTANTES

1. **Usuarios nuevos NO tendrán trial automático** después de esta solución
2. **Los usuarios deben seleccionar un plan manualmente** desde `/dashboard/billing`
3. **Los pagos aprobados SÍ crearán suscripciones** (esto es correcto)
4. **Esta es una solución temporal** - considera implementar un sistema de trial más robusto

---

## 🔄 PARA REACTIVAR EL TRIAL AUTOMÁTICO (FUTURO)

Si en el futuro quieres reactivar el trial automático, necesitarás:

1. Modificar el trigger `handle_new_user` para crear suscripciones
2. Agregar validación en el trigger para verificar `trial_used_emails`
3. Asegurarte de que el trigger solo crea trial para **nuevas empresas**
4. Implementar un sistema robusto de prevención de duplicados

---

**Fecha:** 2026-02-08  
**Usuario afectado:** microteklh@gmail.com  
**Empresa:** Plusmar (deaf584c-8964-4ec4-a4f3-a0310aa6e308)
