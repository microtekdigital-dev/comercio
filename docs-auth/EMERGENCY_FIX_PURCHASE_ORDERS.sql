-- EMERGENCY FIX: Ejecutar INMEDIATAMENTE para resolver duplicados
-- Este script elimina el trigger problemático y limpia duplicados

-- 1. ELIMINAR EL TRIGGER PROBLEMÁTICO
DROP TRIGGER IF EXISTS auto_purchase_order_number ON purchase_orders;
DROP FUNCTION IF EXISTS generate_purchase_order_number() CASCADE;

-- 2. LIMPIAR DUPLICADOS EXISTENTES
DO $$
DECLARE
  duplicate_record RECORD;
  counter INTEGER;
BEGIN
  FOR duplicate_record IN
    SELECT order_number, company_id, array_agg(id ORDER BY created_at) as ids
    FROM purchase_orders
    WHERE order_number IS NOT NULL
    GROUP BY order_number, company_id
    HAVING COUNT(*) > 1
  LOOP
    counter := 1;
    -- Mantener el primero, renombrar el resto
    FOR i IN 2..array_length(duplicate_record.ids, 1) LOOP
      UPDATE purchase_orders
      SET order_number = duplicate_record.order_number || '-DUP' || counter
      WHERE id = duplicate_record.ids[i];
      counter := counter + 1;
    END LOOP;
  END LOOP;
END $$;

-- 3. HACER order_number NULLABLE (permite generación desde app)
ALTER TABLE purchase_orders ALTER COLUMN order_number DROP NOT NULL;

-- 4. VERIFICAR QUE TODO ESTÁ OK
SELECT 
  'Trigger eliminado' as status,
  COUNT(*) as trigger_count
FROM pg_trigger 
WHERE tgname = 'auto_purchase_order_number'
UNION ALL
SELECT 
  'Duplicados restantes' as status,
  COUNT(*) as duplicate_count
FROM (
  SELECT order_number, company_id
  FROM purchase_orders
  WHERE order_number IS NOT NULL
  GROUP BY order_number, company_id
  HAVING COUNT(*) > 1
) duplicates;
