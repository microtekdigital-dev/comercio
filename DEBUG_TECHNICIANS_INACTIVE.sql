-- Script para diagnosticar y activar técnicos inactivos
-- Ejecutar en Supabase SQL Editor

-- 1. Ver todos los técnicos inactivos
SELECT 
  id,
  name,
  specialty,
  is_active,
  company_id,
  created_at
FROM technicians
WHERE is_active = false
ORDER BY created_at DESC;

-- 2. Activar TODOS los técnicos inactivos de una empresa específica
-- REEMPLAZA 'TU_COMPANY_ID' con el ID de tu empresa
UPDATE technicians
SET 
  is_active = true,
  updated_at = NOW()
WHERE company_id = 'TU_COMPANY_ID'
  AND is_active = false;

-- 3. Verificar que se activaron correctamente
SELECT 
  id,
  name,
  specialty,
  is_active,
  company_id
FROM technicians
WHERE company_id = 'TU_COMPANY_ID'
ORDER BY name;
