-- Verificar que el usuario se creó correctamente
SELECT 
  u.id,
  u.email,
  u.created_at,
  u.email_confirmed_at,
  p.full_name,
  p.role,
  c.name as company_name,
  s.status as subscription_status,
  pl.name as plan_name
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
LEFT JOIN public.companies c ON c.id = p.company_id
LEFT JOIN public.subscriptions s ON s.company_id = c.id AND s.status = 'active'
LEFT JOIN public.plans pl ON pl.id = s.plan_id
ORDER BY u.created_at DESC
LIMIT 5;
