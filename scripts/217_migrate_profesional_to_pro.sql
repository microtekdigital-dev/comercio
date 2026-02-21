-- =====================================================
-- Script: Migrate Profesional subscriptions to Pro
-- Description: Updates existing subscriptions from "Profesional" plan to "Pro" plan
-- Version: 1.0
-- Date: 2026-02-20
-- =====================================================

-- This script fixes the issue where users with "Profesional" plan
-- don't see their active plan after renaming it to "Pro"

-- Step 1: Find the old "Profesional" plan IDs and new "Pro" plan IDs
DO $$
DECLARE
  v_old_profesional_monthly_id UUID;
  v_old_profesional_annual_id UUID;
  v_new_pro_monthly_id UUID;
  v_new_pro_annual_id UUID;
  v_subscriptions_updated INTEGER := 0;
BEGIN
  -- Get old Profesional plan IDs (if they still exist)
  SELECT id INTO v_old_profesional_monthly_id
  FROM plans
  WHERE name = 'Profesional' AND interval = 'month'
  LIMIT 1;
  
  SELECT id INTO v_old_profesional_annual_id
  FROM plans
  WHERE name = 'Profesional' AND interval = 'year'
  LIMIT 1;
  
  -- Get new Pro plan IDs
  SELECT id INTO v_new_pro_monthly_id
  FROM plans
  WHERE name = 'Pro' AND interval = 'month'
  LIMIT 1;
  
  SELECT id INTO v_new_pro_annual_id
  FROM plans
  WHERE name = 'Pro' AND interval = 'year'
  LIMIT 1;
  
  -- Update subscriptions from Profesional Monthly to Pro Monthly
  IF v_old_profesional_monthly_id IS NOT NULL AND v_new_pro_monthly_id IS NOT NULL THEN
    UPDATE subscriptions
    SET plan_id = v_new_pro_monthly_id
    WHERE plan_id = v_old_profesional_monthly_id;
    
    GET DIAGNOSTICS v_subscriptions_updated = ROW_COUNT;
    RAISE NOTICE 'Updated % subscriptions from Profesional Monthly to Pro Monthly', v_subscriptions_updated;
  END IF;
  
  -- Update subscriptions from Profesional Annual to Pro Annual
  IF v_old_profesional_annual_id IS NOT NULL AND v_new_pro_annual_id IS NOT NULL THEN
    UPDATE subscriptions
    SET plan_id = v_new_pro_annual_id
    WHERE plan_id = v_old_profesional_annual_id;
    
    GET DIAGNOSTICS v_subscriptions_updated = ROW_COUNT;
    RAISE NOTICE 'Updated % subscriptions from Profesional Annual to Pro Annual', v_subscriptions_updated;
  END IF;
  
  -- Update payments from Profesional to Pro
  IF v_old_profesional_monthly_id IS NOT NULL AND v_new_pro_monthly_id IS NOT NULL THEN
    UPDATE payments
    SET plan_id = v_new_pro_monthly_id
    WHERE plan_id = v_old_profesional_monthly_id;
    
    GET DIAGNOSTICS v_subscriptions_updated = ROW_COUNT;
    RAISE NOTICE 'Updated % payments from Profesional Monthly to Pro Monthly', v_subscriptions_updated;
  END IF;
  
  IF v_old_profesional_annual_id IS NOT NULL AND v_new_pro_annual_id IS NOT NULL THEN
    UPDATE payments
    SET plan_id = v_new_pro_annual_id
    WHERE plan_id = v_old_profesional_annual_id;
    
    GET DIAGNOSTICS v_subscriptions_updated = ROW_COUNT;
    RAISE NOTICE 'Updated % payments from Profesional Annual to Pro Annual', v_subscriptions_updated;
  END IF;
  
  RAISE NOTICE 'Migration completed successfully';
END $$;

-- Step 2: Verify the migration
SELECT 
  s.id as subscription_id,
  s.company_id,
  s.status,
  p.name as plan_name,
  p.interval,
  p.price
FROM subscriptions s
JOIN plans p ON s.plan_id = p.id
WHERE s.status IN ('active', 'pending')
ORDER BY s.created_at DESC
LIMIT 10;

-- Step 3: Show summary
SELECT 
  p.name,
  p.interval,
  COUNT(s.id) as active_subscriptions
FROM plans p
LEFT JOIN subscriptions s ON p.id = s.plan_id AND s.status IN ('active', 'pending')
WHERE p.is_active = true
GROUP BY p.name, p.interval, p.sort_order
ORDER BY p.sort_order;
