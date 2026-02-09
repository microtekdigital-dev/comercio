-- Unificar nombres de planes: "Pro" → "Profesional"
-- Este script asegura que solo exista el plan "Profesional" y no "Pro"

-- 1. Ver el estado actual
SELECT 
  id,
  name,
  interval,
  price,
  is_active,
  max_users,
  max_products
FROM plans
WHERE name IN ('Pro', 'Profesional')
ORDER BY name, interval;

-- 2. Actualizar suscripciones que usan el plan "Pro" para que usen "Profesional"
-- Primero, obtener los IDs de los planes Pro y Profesional
DO $$
DECLARE
  pro_monthly_id UUID;
  pro_yearly_id UUID;
  profesional_monthly_id UUID;
  profesional_yearly_id UUID;
BEGIN
  -- Obtener IDs de planes Pro
  SELECT id INTO pro_monthly_id FROM plans WHERE name = 'Pro' AND interval = 'month' LIMIT 1;
  SELECT id INTO pro_yearly_id FROM plans WHERE name = 'Pro' AND interval = 'year' LIMIT 1;
  
  -- Obtener IDs de planes Profesional
  SELECT id INTO profesional_monthly_id FROM plans WHERE name = 'Profesional' AND interval = 'month' LIMIT 1;
  SELECT id INTO profesional_yearly_id FROM plans WHERE name = 'Profesional' AND interval = 'year' LIMIT 1;
  
  -- Actualizar suscripciones de Pro mensual a Profesional mensual
  IF pro_monthly_id IS NOT NULL AND profesional_monthly_id IS NOT NULL THEN
    UPDATE subscriptions 
    SET plan_id = profesional_monthly_id 
    WHERE plan_id = pro_monthly_id;
    
    RAISE NOTICE 'Suscripciones actualizadas de Pro mensual a Profesional mensual';
  END IF;
  
  -- Actualizar suscripciones de Pro anual a Profesional anual
  IF pro_yearly_id IS NOT NULL AND profesional_yearly_id IS NOT NULL THEN
    UPDATE subscriptions 
    SET plan_id = profesional_yearly_id 
    WHERE plan_id = pro_yearly_id;
    
    RAISE NOTICE 'Suscripciones actualizadas de Pro anual a Profesional anual';
  END IF;
END $$;

-- 3. Desactivar los planes "Pro" (ya no se usarán)
UPDATE plans 
SET is_active = false 
WHERE name = 'Pro';

-- 4. Asegurar que los planes "Profesional" estén activos
UPDATE plans 
SET is_active = true 
WHERE name = 'Profesional';

-- 5. Verificar el resultado
SELECT 
  'Planes activos después de unificación:' as info;

SELECT 
  name,
  interval,
  price,
  is_active,
  max_users,
  max_products
FROM plans
WHERE is_active = true
ORDER BY sort_order;

-- 6. Verificar suscripciones activas
SELECT 
  'Suscripciones activas:' as info;

SELECT 
  s.id,
  c.name as company,
  p.name as plan_name,
  p.interval,
  s.status
FROM subscriptions s
JOIN companies c ON s.company_id = c.id
JOIN plans p ON s.plan_id = p.id
WHERE s.status = 'active'
ORDER BY c.name;
