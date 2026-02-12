-- Cambiar usuario al Plan Básico
-- Reemplaza 'email@ejemplo.com' con el email del usuario

UPDATE public.subscriptions
SET 
  plan_id = (SELECT id FROM public.plans WHERE name = 'Básico' LIMIT 1),
  status = 'active',
  current_period_start = NOW(),
  current_period_end = NOW() + INTERVAL '1 month',
  updated_at = NOW()
WHERE company_id = (
  SELECT cu.company_id 
  FROM auth.users u
  JOIN public.company_users cu ON cu.user_id = u.id
  WHERE u.email = 'email@ejemplo.com'
  LIMIT 1
)
AND status = 'active';
