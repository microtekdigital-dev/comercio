-- ============================================
-- CAMBIAR PLAN - SCRIPT EJECUTABLE DIRECTO
-- ============================================
-- INSTRUCCIONES:
-- 1. Reemplaza 'TU_EMAIL_AQUI' con el email del usuario
-- 2. Reemplaza 'NOMBRE_DEL_PLAN' con: Trial, Básico, Profesional o Empresarial
-- 3. Ejecuta TODO este script de una vez

UPDATE public.subscriptions
SET 
  plan_id = (SELECT id FROM public.plans WHERE name = 'Profesional' LIMIT 1),
  status = 'active',
  current_period_start = NOW(),
  current_period_end = NOW() + INTERVAL '1 month',
  updated_at = NOW()
WHERE company_id = (
  SELECT cu.company_id 
  FROM auth.users u
  JOIN public.company_users cu ON cu.user_id = u.id
  WHERE u.email = 'TU_EMAIL_AQUI'
  LIMIT 1
)
AND status = 'active';
