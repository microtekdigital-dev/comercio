-- ============================================================================
-- SOLUCIÓN DE EMERGENCIA: DESHABILITAR CREACIÓN AUTOMÁTICA DE SUSCRIPCIONES
-- ============================================================================
-- Este script deshabilita COMPLETAMENTE la creación automática de suscripciones
-- Las suscripciones solo se crearán cuando el usuario PAGUE

-- PASO 1: Actualizar handle_new_user para que NO cree suscripciones
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_company_id UUID;
  invite_record RECORD;
BEGIN
  -- Check if user is accepting an invitation
  IF NEW.raw_user_meta_data->>'invite_token' IS NOT NULL THEN
    -- Get invitation details
    SELECT * INTO invite_record
    FROM public.invitations
    WHERE token = NEW.raw_user_meta_data->>'invite_token'
      AND status = 'pending'
      AND expires_at > NOW()
    LIMIT 1;

    IF invite_record IS NOT NULL THEN
      -- Create profile for invited user
      INSERT INTO public.profiles (id, company_id, email, full_name, role)
      VALUES (
        NEW.id,
        invite_record.company_id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        invite_record.role
      );

      -- Mark invitation as accepted
      UPDATE public.invitations
      SET status = 'accepted', accepted_at = NOW()
      WHERE id = invite_record.id;

      RAISE NOTICE 'Usuario invitado creado SIN suscripción: %', NEW.email;
      RETURN NEW;
    END IF;
  END IF;

  -- If not an invitation, create new company and admin profile
  -- Create company
  INSERT INTO public.companies (name, slug)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'company_name', 'My Company'),
    COALESCE(NEW.raw_user_meta_data->>'company_slug', 'company-' || NEW.id)
  )
  RETURNING id INTO new_company_id;

  -- Create profile as admin
  INSERT INTO public.profiles (id, company_id, email, full_name, role, has_used_trial)
  VALUES (
    NEW.id,
    new_company_id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    'admin',
    false  -- NO han usado trial todavía
  );

  -- ============================================================================
  -- CRÍTICO: NO CREAR SUSCRIPCIÓN AUTOMÁTICAMENTE
  -- Las suscripciones solo se crean cuando el usuario PAGA
  -- ============================================================================
  RAISE NOTICE 'Usuario admin creado SIN suscripción: %', NEW.email;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RAISE EXCEPTION 'Database error saving new user: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PASO 2: Crear trigger que BLOQUEE inserts automáticos a subscriptions
-- ============================================================================
CREATE OR REPLACE FUNCTION public.block_automatic_subscription_creation()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo permitir inserts si vienen de un pago aprobado
  -- Verificar si existe un payment con este company_id y status approved
  IF NOT EXISTS (
    SELECT 1 FROM public.payments
    WHERE company_id = NEW.company_id
    AND status = 'approved'
    AND created_at > NOW() - INTERVAL '5 minutes'
  ) THEN
    -- No hay pago reciente aprobado - BLOQUEAR
    RAISE EXCEPTION 'No se puede crear suscripción sin pago aprobado. Company: %', NEW.company_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Eliminar trigger anterior si existe
DROP TRIGGER IF EXISTS block_auto_subscription_creation ON public.subscriptions;

-- Crear nuevo trigger BEFORE INSERT
CREATE TRIGGER block_auto_subscription_creation
  BEFORE INSERT ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.block_automatic_subscription_creation();

-- PASO 3: Verificar que los cambios se aplicaron
-- ============================================================================
SELECT 
  'handle_new_user actualizado - NO crea suscripciones' as status,
  pg_get_functiondef(p.oid) as function_code
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname = 'handle_new_user';

SELECT 
  'Trigger de bloqueo creado' as status,
  tgname as trigger_name,
  pg_get_triggerdef(oid) as trigger_def
FROM pg_trigger
WHERE tgname = 'block_auto_subscription_creation';

-- PASO 4: Instrucciones para probar
-- ============================================================================
SELECT '
============================================================================
TRIGGER DE BLOQUEO ACTIVADO
============================================================================

AHORA PRUEBA:
1. Elimina las suscripciones activas de Plusmar
2. Refresca /dashboard/billing
3. Deberías ver un ERROR en los logs de Supabase que dice:
   "No se puede crear suscripción sin pago aprobado"

Si ves ese error, significa que encontramos el culpable!

Query para eliminar suscripciones:
DELETE FROM subscriptions 
WHERE company_id = ''deaf584c-8964-4ec4-a4f3-a0310aa6e308'' 
AND status IN (''active'', ''pending'');

Query para ver logs de auditoría:
SELECT * FROM subscription_audit_log 
WHERE company_id = ''deaf584c-8964-4ec4-a4f3-a0310aa6e308'' 
ORDER BY created_at DESC LIMIT 10;
============================================================================
' as instrucciones;
