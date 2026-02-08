-- ============================================================================
-- DIAGNÓSTICO: Cuentas vanitoadette y vanithegameplay bloqueadas
-- ============================================================================
-- Ejecutar en Supabase SQL Editor

-- 1. Ver información de ambos usuarios
SELECT 
  p.id as user_id,
  p.email,
  p.role,
  p.company_id,
  c.name as company_name,
  p.created_at as user_created_at
FROM profiles p
LEFT JOIN companies c ON p.company_id = c.id
WHERE p.email IN ('vanitoadette@gmail.com', 'vanithegameplay@gmail.com')
ORDER BY p.email;

-- 2. Ver TODAS las suscripciones de ambas empresas
SELECT 
  p.email as user_email,
  c.name as company_name,
  s.id as subscription_id,
  s.status,
  s.created_at as subscription_created,
  s.current_period_start,
  s.current_period_end,
  pl.name as plan_name,
  pl.price,
  CASE 
    WHEN s.current_period_end < NOW() THEN '❌ VENCIDA'
    WHEN s.status = 'cancelled' THEN '❌ CANCELADA'
    WHEN s.status = 'active' THEN '✅ ACTIVA'
    ELSE '⚠️ ' || s.status
  END as estado_visual,
  EXTRACT(DAY FROM (s.current_period_end - NOW())) as dias_restantes
FROM profiles p
LEFT JOIN companies c ON p.company_id = c.id
LEFT JOIN subscriptions s ON s.company_id = c.id
LEFT JOIN plans pl ON s.plan_id = pl.id
WHERE p.email IN ('vanitoadette@gmail.com', 'vanithegameplay@gmail.com')
ORDER BY p.email, s.created_at DESC;

-- 3. Contar suscripciones activas por empresa
SELECT 
  p.email as user_email,
  c.name as company_name,
  COUNT(s.id) as total_suscripciones,
  COUNT(CASE WHEN s.status IN ('active', 'pending') AND s.current_period_end > NOW() THEN 1 END) as activas_vigentes,
  COUNT(CASE WHEN s.status = 'cancelled' THEN 1 END) as canceladas,
  COUNT(CASE WHEN s.current_period_end < NOW() THEN 1 END) as vencidas,
  CASE 
    WHEN COUNT(CASE WHEN s.status IN ('active', 'pending') AND s.current_period_end > NOW() THEN 1 END) = 0 
      THEN '❌ SIN SUSCRIPCIÓN ACTIVA'
    WHEN COUNT(CASE WHEN s.status IN ('active', 'pending') AND s.current_period_end > NOW() THEN 1 END) = 1 
      THEN '✅ UNA SUSCRIPCIÓN ACTIVA'
    ELSE '⚠️ MÚLTIPLES SUSCRIPCIONES ACTIVAS'
  END as diagnostico
FROM profiles p
LEFT JOIN companies c ON p.company_id = c.id
LEFT JOIN subscriptions s ON s.company_id = c.id
WHERE p.email IN ('vanitoadette@gmail.com', 'vanithegameplay@gmail.com')
GROUP BY p.email, c.name
ORDER BY p.email;

-- 4. Ver membresía en company_users
SELECT 
  p.email as user_email,
  cu.company_id,
  cu.role as company_role,
  cu.created_at as membership_created,
  c.name as company_name
FROM profiles p
LEFT JOIN company_users cu ON cu.user_id = p.id
LEFT JOIN companies c ON cu.company_id = c.id
WHERE p.email IN ('vanitoadette@gmail.com', 'vanithegameplay@gmail.com')
ORDER BY p.email;

-- 5. Ver si tienen company_id en profiles pero no en company_users
SELECT 
  p.email,
  p.company_id as profile_company_id,
  c.name as company_name,
  CASE 
    WHEN cu.company_id IS NULL THEN '❌ FALTA MEMBRESÍA EN company_users'
    ELSE '✅ Membresía OK'
  END as membership_status
FROM profiles p
LEFT JOIN companies c ON p.company_id = c.id
LEFT JOIN company_users cu ON cu.user_id = p.id AND cu.company_id = p.company_id
WHERE p.email IN ('vanitoadette@gmail.com', 'vanithegameplay@gmail.com')
ORDER BY p.email;

-- 6. Ver la suscripción MÁS RECIENTE de cada empresa (la que debería estar activa)
SELECT 
  p.email as user_email,
  c.name as company_name,
  s.id as subscription_id,
  s.status,
  s.current_period_end,
  pl.name as plan_name,
  pl.price,
  CASE 
    WHEN s.status = 'active' AND s.current_period_end > NOW() THEN '✅ DEBERÍA FUNCIONAR'
    WHEN s.status = 'cancelled' THEN '❌ CANCELADA - Necesita nuevo plan'
    WHEN s.current_period_end < NOW() THEN '❌ VENCIDA - Necesita renovación'
    ELSE '⚠️ Estado: ' || s.status
  END as diagnostico_final
FROM profiles p
LEFT JOIN companies c ON p.company_id = c.id
LEFT JOIN LATERAL (
  SELECT * FROM subscriptions 
  WHERE company_id = c.id 
  ORDER BY created_at DESC 
  LIMIT 1
) s ON true
LEFT JOIN plans pl ON s.plan_id = pl.id
WHERE p.email IN ('vanitoadette@gmail.com', 'vanithegameplay@gmail.com')
ORDER BY p.email;

-- ============================================================================
-- INTERPRETACIÓN DE RESULTADOS:
-- ============================================================================
-- 
-- Query 1: Información básica de usuarios
--   - Verifica que ambos usuarios existan
--   - Verifica que tengan company_id asignado
--   - Verifica su rol (owner, admin, employee)
--
-- Query 2: Todas las suscripciones
--   - Muestra historial completo de suscripciones
--   - Identifica cuáles están activas, canceladas o vencidas
--   - Muestra días restantes
--
-- Query 3: Resumen de suscripciones
--   - Cuenta total de suscripciones por empresa
--   - Identifica si hay múltiples suscripciones activas (problema)
--   - Identifica si no hay suscripciones activas (problema)
--
-- Query 4: Membresía en company_users
--   - Verifica que el usuario esté en company_users
--   - Necesario para que RLS permita acceso a datos
--
-- Query 5: Verificación de membresía
--   - Detecta si falta la entrada en company_users
--   - Esto causaría que el usuario no pueda ver datos de la empresa
--
-- Query 6: Diagnóstico final
--   - Muestra la suscripción más reciente de cada empresa
--   - Da diagnóstico claro de qué está mal
--
-- ============================================================================
-- POSIBLES PROBLEMAS Y SOLUCIONES:
-- ============================================================================
--
-- PROBLEMA 1: Sin suscripción activa
--   Síntoma: Query 3 muestra "SIN SUSCRIPCIÓN ACTIVA"
--   Causa: No se creó trial al registrarse o se canceló
--   Solución: Ejecutar script para crear trial manualmente
--
-- PROBLEMA 2: Suscripción vencida
--   Síntoma: Query 6 muestra "VENCIDA"
--   Causa: current_period_end < NOW()
--   Solución: Usuario debe seleccionar un plan de pago
--
-- PROBLEMA 3: Suscripción cancelada
--   Síntoma: Query 6 muestra "CANCELADA"
--   Causa: Usuario canceló el trial
--   Solución: Usuario debe seleccionar un plan de pago
--
-- PROBLEMA 4: Falta membresía en company_users
--   Síntoma: Query 5 muestra "FALTA MEMBRESÍA"
--   Causa: No se ejecutó ensureCompanyUserMembership
--   Solución: Ejecutar script para agregar membresía
--
-- PROBLEMA 5: Múltiples suscripciones activas
--   Síntoma: Query 3 muestra "MÚLTIPLES SUSCRIPCIONES ACTIVAS"
--   Causa: Bug en creación de suscripciones
--   Solución: Cancelar suscripciones duplicadas, dejar solo una
--
-- ============================================================================
