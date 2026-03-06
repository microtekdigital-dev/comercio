-- =====================================================
-- DIAGNÓSTICO: Error al crear nuevo usuario
-- "Database error saving new user"
-- =====================================================

SELECT '=== 1. VERIFICAR FUNCIÓN handle_new_user ===' as info;

-- Ver la función actual
SELECT 
  routine_name,
  routine_definition
FROM information_schema.routines
WHERE routine_name = 'handle_new_user';

SELECT '=== 2. VERIFICAR TRIGGER ===' as info;

-- Ver el trigger
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

SELECT '=== 3. VERIFICAR PLAN TRIAL ===' as info;

-- Verificar que existe el plan Trial
SELECT 
  id,
  name,
  interval,
  is_active,
  price
FROM plans
WHERE name = 'Trial' 
  AND interval = 'month';

SELECT '=== 4. VERIFICAR TABLA trial_used_emails ===' as info;

-- Verificar si existe la tabla trial_used_emails
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'trial_used_emails'
) as tabla_existe;

-- Si existe, ver su estructura
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'trial_used_emails'
ORDER BY ordinal_position;

SELECT '=== 5. VERIFICAR PERMISOS ===' as info;

-- Verificar permisos en tablas críticas
SELECT 
  grantee,
  table_name,
  privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'public'
  AND table_name IN ('companies', 'profiles', 'subscriptions', 'plans', 'trial_used_emails')
ORDER BY table_name, grantee;

SELECT '=== 6. VERIFICAR ÚLTIMOS ERRORES EN LOGS ===' as info;

-- Intentar ver errores recientes (si hay acceso a logs)
SELECT 
  'Revisar logs de Supabase para ver el error específico' as recomendacion;

SELECT '=== 7. PROBAR CREACIÓN MANUAL ===' as info;

-- Simular lo que hace el trigger (SIN EJECUTAR)
SELECT 
  'Para probar manualmente, ejecuta estos pasos en orden:' as instrucciones;

/*
-- PASO 1: Crear empresa
INSERT INTO public.companies (name, slug)
VALUES ('Test Company', 'test-company-' || gen_random_uuid()::text)
RETURNING id;

-- PASO 2: Obtener ID del plan Trial
SELECT id FROM plans 
WHERE name = 'Trial' AND interval = 'month' AND is_active = true
LIMIT 1;

-- PASO 3: Crear suscripción (usar company_id del paso 1 y plan_id del paso 2)
INSERT INTO public.subscriptions (company_id, plan_id, status, current_period_start, current_period_end)
VALUES (
  'COMPANY_ID_AQUI',
  'PLAN_ID_AQUI',
  'active',
  NOW(),
  NOW() + INTERVAL '14 days'
);

-- PASO 4: Crear perfil (usar un user_id de prueba)
INSERT INTO public.profiles (id, company_id, email, full_name, role, has_used_trial)
VALUES (
  gen_random_uuid(),
  'COMPANY_ID_AQUI',
  'test@example.com',
  'Test User',
  'admin',
  true
);
*/

SELECT '=== 8. VERIFICAR CONSTRAINTS ===' as info;

-- Ver constraints que podrían estar causando el error
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  tc.constraint_type
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name IN ('companies', 'profiles', 'subscriptions', 'trial_used_emails')
ORDER BY tc.table_name, tc.constraint_type;

SELECT '=== RESUMEN ===' as info;

/*
POSIBLES CAUSAS DEL ERROR:

1. ❌ No existe el plan "Trial" activo
2. ❌ Problema con la tabla trial_used_emails bloqueando usuarios
3. ❌ Falta de permisos en alguna tabla
4. ❌ Constraint violado (unique, foreign key, etc.)
5. ❌ Error en la función handle_new_user

PRÓXIMOS PASOS:
1. Revisar los resultados de este diagnóstico
2. Verificar logs de Supabase para ver el error exacto
3. Ejecutar prueba manual de creación (paso 7)
4. Aplicar fix específico según el problema encontrado
*/

SELECT '=== FIN DEL DIAGNÓSTICO ===' as info;
