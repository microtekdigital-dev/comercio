-- Script para verificar el estado de un empleado invitado

-- Reemplaza con el email del empleado
SELECT 
  u.email,
  u.email_confirmed_at,
  p.id as profile_id,
  p.company_id,
  p.role,
  c.name as company_name,
  s.status as subscription_status,
  pl.name as plan_name,
  i.status as invitation_status
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
LEFT JOIN public.companies c ON c.id = p.company_id
LEFT JOIN public.subscriptions s ON s.company_id = c.id AND s.status = 'active'
LEFT JOIN public.plans pl ON pl.id = s.plan_id
LEFT JOIN public.invitations i ON i.email = u.email
WHERE u.email = 'EMAIL_DEL_EMPLEADO_AQUI' -- REEMPLAZA ESTO
ORDER BY s.created_at DESC
LIMIT 1;
