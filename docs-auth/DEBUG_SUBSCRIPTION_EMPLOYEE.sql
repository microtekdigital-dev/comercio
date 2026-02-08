-- Script para verificar el estado de la suscripción de un empleado
-- Reemplaza 'EMAIL_DEL_EMPLEADO' con el email del empleado

SELECT 
  u.email as user_email,
  p.role as user_role,
  p.company_id,
  c.name as company_name,
  s.id as subscription_id,
  s.status as subscription_status,
  s.current_period_end,
  pl.name as plan_name
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
LEFT JOIN public.companies c ON c.id = p.company_id
LEFT JOIN public.subscriptions s ON s.company_id = c.id
LEFT JOIN public.plans pl ON pl.id = s.plan_id
WHERE u.email = 'EMAIL_DEL_EMPLEADO'
ORDER BY s.created_at DESC;
