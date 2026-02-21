-- Script para diagnosticar el conteo de reparaciones activas por técnico
-- Ejecutar en Supabase SQL Editor

-- 1. Ver todos los técnicos y sus reparaciones
SELECT 
  t.id as technician_id,
  t.name as technician_name,
  t.is_active,
  COUNT(CASE 
    WHEN ro.status NOT IN ('delivered', 'cancelled') 
    THEN 1 
  END) as active_repairs_count,
  COUNT(ro.id) as total_repairs,
  STRING_AGG(DISTINCT ro.status, ', ') as statuses
FROM technicians t
LEFT JOIN repair_orders ro ON ro.technician_id = t.id
GROUP BY t.id, t.name, t.is_active
ORDER BY t.name;

-- 2. Ver reparaciones por estado para cada técnico
SELECT 
  t.name as technician_name,
  ro.order_number,
  ro.status,
  ro.device_type,
  ro.received_date
FROM technicians t
LEFT JOIN repair_orders ro ON ro.technician_id = t.id
ORDER BY t.name, ro.received_date DESC;

-- 3. Verificar qué estados se consideran "activos"
-- Estados activos: received, diagnosing, waiting_parts, repairing, repaired
-- Estados NO activos: delivered, cancelled
SELECT 
  status,
  COUNT(*) as count
FROM repair_orders
GROUP BY status
ORDER BY count DESC;
