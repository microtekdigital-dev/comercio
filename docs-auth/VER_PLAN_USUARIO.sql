-- Ver el plan actual de un usuario
-- Reemplaza 'email@ejemplo.com' con el email del usuario

SELECT 
  u.email,
  c.name as empresa,
  p.name as plan_actual,
  s.status as estado,
  s.current_period_end as vence_el,
  s.created_at as suscripcion_desde
FROM auth.users u
JOIN public.company_users cu ON cu.user_id = u.id
JOIN public.companies c ON c.id = cu.company_id
JOIN public.subscriptions s ON s.company_id = c.id AND s.status = 'active'
JOIN public.plans p ON p.id = s.plan_id
WHERE u.email = 'email@ejemplo.com';
