-- Script para diagnosticar problemas de carga en reportes de reparaciones
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar reparaciones pendientes
SELECT 
  'Reparaciones Pendientes' as tipo,
  COUNT(*) as cantidad
FROM repair_orders
WHERE company_id = 'TU_COMPANY_ID_AQUI'
  AND status NOT IN ('delivered', 'cancelled');

-- 2. Verificar reparaciones por técnico
SELECT 
  'Reparaciones por Técnico' as tipo,
  COUNT(*) as cantidad,
  COUNT(DISTINCT technician_id) as tecnicos
FROM repair_orders
WHERE company_id = 'TU_COMPANY_ID_AQUI'
  AND technician_id IS NOT NULL;

-- 3. Verificar distribución por estado
SELECT 
  'Distribución por Estado' as tipo,
  status,
  COUNT(*) as cantidad
FROM repair_orders
WHERE company_id = 'TU_COMPANY_ID_AQUI'
GROUP BY status;

-- 4. Verificar rentabilidad (reparaciones entregadas)
SELECT 
  'Rentabilidad' as tipo,
  COUNT(*) as reparaciones_entregadas
FROM repair_orders
WHERE company_id = 'TU_COMPANY_ID_AQUI'
  AND status = 'delivered';

-- 5. Verificar tiempo promedio
SELECT 
  'Tiempo Promedio' as tipo,
  COUNT(*) as reparaciones_con_fecha_entrega,
  AVG(
    EXTRACT(EPOCH FROM (delivered_date::timestamp - received_date::timestamp)) / 86400
  )::int as dias_promedio
FROM repair_orders
WHERE company_id = 'TU_COMPANY_ID_AQUI'
  AND status = 'delivered'
  AND delivered_date IS NOT NULL;

-- 6. Verificar reparaciones para exportar
SELECT 
  'Reparaciones para Exportar' as tipo,
  COUNT(*) as cantidad
FROM repair_orders
WHERE company_id = 'TU_COMPANY_ID_AQUI'
  AND status IN ('repaired', 'delivered');
