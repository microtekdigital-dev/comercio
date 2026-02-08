-- Solución: Simplificar handle_new_user para permitir registro de usuarios
-- La verificación de trial usado se manejará DESPUÉS del registro, no durante

-- Reemplazar la función handle_new_user con una versión simplificada
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_company_id UUID;
  v_trial_plan_id UUID;
BEGIN
  -- Crear empresa para el nuevo usuario
  INSERT INTO public.companies (name, slug)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'company_name', 'Mi Empresa'),
    lower(replace(NEW.email, '@', '-')) || '-' || substr(md5(random()::text), 1, 8)
  )
  RETURNING id INTO v_company_id;

  -- Crear perfil del usuario
  INSERT INTO public.profiles (
    id,
    company_id,
    email,
    full_name,
    role
  ) VALUES (
    NEW.id,
    v_company_id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'admin'
  );

  -- Obtener el ID del plan Trial
  SELECT id INTO v_trial_plan_id
  FROM public.plans
  WHERE name = 'Trial'
  LIMIT 1;

  -- Crear suscripción Trial SOLO si el email NO ha sido usado antes
  IF v_trial_plan_id IS NOT NULL THEN
    -- Verificar si el email ya usó trial
    IF NOT EXISTS (
      SELECT 1 FROM public.trial_used_emails
      WHERE email = NEW.email
    ) THEN
      -- Email nuevo, crear trial
      INSERT INTO public.subscriptions (
        company_id,
        plan_id,
        status,
        current_period_start,
        current_period_end
      ) VALUES (
        v_company_id,
        v_trial_plan_id,
        'active',
        NOW(),
        NOW() + INTERVAL '14 days'
      );
    ELSE
      -- Email ya usó trial, NO crear suscripción
      -- El usuario deberá seleccionar un plan de pago
      RAISE NOTICE 'Email % ya utilizó el trial. No se creó suscripción.', NEW.email;
    END IF;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log el error pero NO bloquear la creación del usuario
    RAISE WARNING 'Error en handle_new_user para %: %', NEW.email, SQLERRM;
    -- Retornar NEW para que el usuario se cree de todas formas
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mensaje de confirmación
DO $$
BEGIN
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Función handle_new_user ACTUALIZADA';
  RAISE NOTICE '==============================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Cambios realizados:';
  RAISE NOTICE '1. Ya NO lanza excepción si el email usó trial';
  RAISE NOTICE '2. Simplemente NO crea la suscripción trial';
  RAISE NOTICE '3. El usuario se crea correctamente de todas formas';
  RAISE NOTICE '4. Si hay error, se registra como WARNING pero no bloquea';
  RAISE NOTICE '';
  RAISE NOTICE 'Comportamiento:';
  RAISE NOTICE '- Email nuevo → Crea usuario + empresa + trial ✓';
  RAISE NOTICE '- Email que ya usó trial → Crea usuario + empresa (sin trial) ✓';
  RAISE NOTICE '- Usuario deberá seleccionar plan de pago';
END $$;
