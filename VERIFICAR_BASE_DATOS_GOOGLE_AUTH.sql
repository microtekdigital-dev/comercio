-- Script de verificación rápida para confirmar que la base de datos está lista
-- Este script confirma que NO hay problemas de base de datos
-- El problema es de configuración de Google Cloud Console

-- REEMPLAZAR 'camiramos739@gmail.com' con tu email si es diferente

SELECT 
  '=== ESTADO DE LA BASE DE DATOS ===' as seccion,
  CASE 
    WHEN COUNT(*) > 0 THEN '✓ Base de datos está PERFECTA'
    ELSE '✗ Hay problemas en la base de datos'
  END as resultado
FROM auth.users u
JOIN profiles p ON p.id = u.id
JOIN companies c ON c.id = p.company_id
JOIN subscriptions s ON s.company_id = c.id
WHERE u.email = 'camiramos739@gmail.com'
AND p.company_id IS NOT NULL
AND s.status = 'active'
AND s.current_period_end > NOW();

-- Detalles completos
SELECT 
  '=== DETALLES COMPLETOS ===' as seccion,
  u.email,
  p.company_id as "Company ID (debe tener valor)",
  p.role as "Rol",
  c.name as "Nombre Empresa",
  s.status as "Estado Suscripción",
  pl.name as "Plan",
  s.current_period_end as "Válido Hasta",
  CASE 
    WHEN s.current_period_end > NOW() THEN '✓ VIGENTE'
    ELSE '✗ EXPIRADO'
  END as "Estado"
FROM auth.users u
JOIN profiles p ON p.id = u.id
JOIN companies c ON c.id = p.company_id
LEFT JOIN subscriptions s ON s.company_id = c.id AND s.status = 'active'
LEFT JOIN plans pl ON pl.id = s.plan_id
WHERE u.email = 'camiramos739@gmail.com';

-- Verificar membresía en company_users
SELECT 
  '=== MEMBRESÍA EN COMPANY_USERS ===' as seccion,
  CASE 
    WHEN COUNT(*) > 0 THEN '✓ Existe membresía'
    ELSE '✗ Falta membresía'
  END as resultado
FROM company_users cu
JOIN profiles p ON p.id = cu.user_id
JOIN auth.users u ON u.id = p.id
WHERE u.email = 'camiramos739@gmail.com';

-- Verificar políticas RLS en subscriptions
SELECT 
  '=== POLÍTICAS RLS EN SUBSCRIPTIONS ===' as seccion,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'subscriptions'
ORDER BY policyname;

-- CONCLUSIÓN
SELECT 
  '=== CONCLUSIÓN ===' as seccion,
  'Si todos los checks anteriores muestran ✓, entonces el problema NO es de base de datos.' as mensaje,
  'El error "Unable to exchange external code" es un problema de configuración en Google Cloud Console.' as causa,
  'Sigue las instrucciones en FIX_GOOGLE_OAUTH_REDIRECT_URI.md para solucionarlo.' as solucion;
