-- Script simplificado para implementar sistema de cancelación de Trial
-- Este script solo crea lo necesario sin modificar estructuras existentes

-- 1. Crear tabla para rastrear emails que ya usaron Trial
CREATE TABLE IF NOT EXISTS public.trial_used_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  trial_started_at TIMESTAMPTZ NOT NULL,
  trial_cancelled_at TIMESTAMPTZ,
  reason TEXT, -- 'cancelled_by_user', 'expired', 'upgraded'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_trial_used_emails_email ON public.trial_used_emails(email);
CREATE INDEX IF NOT EXISTS idx_trial_used_emails_user_id ON public.trial_used_emails(user_id);

-- Habilitar RLS
ALTER TABLE public.trial_used_emails ENABLE ROW LEVEL SECURITY;

-- Eliminar política si existe y recrearla
DROP POLICY IF EXISTS "Only admins can view trial_used_emails" ON public.trial_used_emails;
CREATE POLICY "Only admins can view trial_used_emails"
  ON public.trial_used_emails
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- 2. Función para registrar cuando un usuario usa Trial
CREATE OR REPLACE FUNCTION public.register_trial_usage()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo registrar si es una suscripción Trial nueva
  IF NEW.status = 'active' THEN
    -- Verificar si es un plan Trial
    DECLARE
      v_plan_name TEXT;
      v_user_email TEXT;
    BEGIN
      -- Obtener el nombre del plan
      SELECT name INTO v_plan_name
      FROM public.plans
      WHERE id = NEW.plan_id;

      -- Si es Trial, registrar el email
      IF v_plan_name = 'Trial' THEN
        -- Obtener el email del usuario
        SELECT email INTO v_user_email
        FROM public.profiles
        WHERE company_id = NEW.company_id
        LIMIT 1;

        -- Insertar o actualizar el registro
        INSERT INTO public.trial_used_emails (
          email,
          company_id,
          user_id,
          trial_started_at
        )
        SELECT
          v_user_email,
          NEW.company_id,
          p.id,
          NOW()
        FROM public.profiles p
        WHERE p.company_id = NEW.company_id
        LIMIT 1
        ON CONFLICT (email) DO NOTHING;
      END IF;
    END;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para registrar uso de Trial
DROP TRIGGER IF EXISTS trigger_register_trial_usage ON public.subscriptions;
CREATE TRIGGER trigger_register_trial_usage
  AFTER INSERT ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.register_trial_usage();

-- 3. Función para marcar Trial como cancelado
CREATE OR REPLACE FUNCTION public.mark_trial_cancelled()
RETURNS TRIGGER AS $$
BEGIN
  -- Si la suscripción cambió de active a cancelled
  IF OLD.status = 'active' AND NEW.status = 'cancelled' THEN
    DECLARE
      v_plan_name TEXT;
      v_user_email TEXT;
    BEGIN
      -- Obtener el nombre del plan
      SELECT name INTO v_plan_name
      FROM public.plans
      WHERE id = NEW.plan_id;

      -- Si es Trial, marcar como cancelado
      IF v_plan_name = 'Trial' THEN
        -- Obtener el email del usuario
        SELECT email INTO v_user_email
        FROM public.profiles
        WHERE company_id = NEW.company_id
        LIMIT 1;

        -- Actualizar el registro
        UPDATE public.trial_used_emails
        SET 
          trial_cancelled_at = NOW(),
          reason = 'cancelled_by_user',
          updated_at = NOW()
        WHERE email = v_user_email;
      END IF;
    END;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para marcar Trial cancelado
DROP TRIGGER IF EXISTS trigger_mark_trial_cancelled ON public.subscriptions;
CREATE TRIGGER trigger_mark_trial_cancelled
  AFTER UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.mark_trial_cancelled();

-- 4. Función para verificar si un email ya usó Trial
CREATE OR REPLACE FUNCTION public.check_trial_already_used(p_email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM public.trial_used_emails
    WHERE email = p_email
  ) INTO v_exists;

  RETURN v_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Modificar la función handle_new_user para verificar Trial
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_company_id UUID;
  v_trial_plan_id UUID;
  v_trial_already_used BOOLEAN;
BEGIN
  -- Verificar si el email ya usó Trial
  SELECT public.check_trial_already_used(NEW.email) INTO v_trial_already_used;

  IF v_trial_already_used THEN
    -- No crear suscripción Trial, el usuario debe pagar
    RAISE EXCEPTION 'Este email ya utilizó el período de prueba gratuito. Por favor, selecciona un plan de pago.';
  END IF;

  -- Crear empresa para el nuevo usuario
  INSERT INTO public.companies (name)
  VALUES (COALESCE(NEW.raw_user_meta_data->>'company_name', 'Mi Empresa'))
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

  -- Crear suscripción Trial
  IF v_trial_plan_id IS NOT NULL THEN
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
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error creating user: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Comentarios para documentación
COMMENT ON TABLE public.trial_used_emails IS 'Rastrea emails que ya usaron el período Trial para prevenir reuso';
COMMENT ON FUNCTION public.check_trial_already_used IS 'Verifica si un email ya utilizó el período de prueba gratuito';
COMMENT ON FUNCTION public.register_trial_usage IS 'Registra cuando un usuario comienza a usar Trial';
COMMENT ON FUNCTION public.mark_trial_cancelled IS 'Marca un Trial como cancelado cuando el usuario cancela su suscripción';

-- Verificación final
DO $$
BEGIN
  RAISE NOTICE 'Sistema de cancelación de Trial instalado correctamente';
  RAISE NOTICE 'Tabla trial_used_emails creada: %', (SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'trial_used_emails'));
  RAISE NOTICE 'Función check_trial_already_used creada: %', (SELECT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'check_trial_already_used'));
END $$;
