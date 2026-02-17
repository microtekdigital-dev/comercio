# Instrucciones para Diagnosticar Pagos a Proveedores en Cierre de Caja

## Problema
Los pagos a proveedores no aparecen en el detalle del cierre de caja, aunque el monto inicial de apertura sí aparece correctamente.

## Paso 1: Ejecutar Script de Diagnóstico

Ejecuta el siguiente script SQL en Supabase para verificar los datos:

```sql
-- 1. Ver pagos a proveedores recientes
SELECT 
  sp.id,
  sp.payment_date,
  sp.amount,
  sp.payment_method,
  LOWER(sp.payment_method) as payment_method_lower,
  CASE 
    WHEN LOWER(sp.payment_method) LIKE '%efectivo%' THEN 'ES EFECTIVO'
    WHEN LOWER(sp.payment_method) LIKE '%cash%' THEN 'ES EFECTIVO'
    ELSE 'NO ES EFECTIVO'
  END as tipo_detectado,
  s.name as supplier_name,
  sp.created_at,
  sp.company_id
FROM supplier_payments sp
LEFT JOIN suppliers s ON s.id = sp.supplier_id
WHERE sp.payment_date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY sp.created_at DESC;

-- 2. Ver cierres de caja recientes
SELECT 
  id,
  closure_date,
  shift,
  supplier_payments_cash,
  created_at,
  company_id
FROM cash_register_closures
WHERE closure_date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY created_at DESC;

-- 3. Verificar si hay pagos que coincidan con la fecha del cierre
SELECT 
  c.id as closure_id,
  c.closure_date,
  c.supplier_payments_cash as monto_en_cierre,
  c.created_at as cierre_created_at,
  COUNT(sp.id) as cantidad_pagos,
  SUM(CASE 
    WHEN LOWER(sp.payment_method) LIKE '%efectivo%' OR LOWER(sp.payment_method) LIKE '%cash%' 
    THEN sp.amount 
    ELSE 0 
  END) as total_efectivo_calculado
FROM cash_register_closures c
LEFT JOIN supplier_payments sp ON 
  sp.company_id = c.company_id 
  AND sp.payment_date::date = c.closure_date::date
  AND sp.created_at < c.created_at
WHERE c.closure_date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY c.id, c.closure_date, c.supplier_payments_cash, c.created_at
ORDER BY c.created_at DESC;
```

## Paso 2: Verificar Resultados

### Caso A: No hay pagos a proveedores
Si el query 1 no devuelve resultados, significa que no hay pagos registrados.
**Solución**: Registrar pagos a proveedores primero.

### Caso B: Los pagos no tienen el método correcto
Si el query 1 muestra pagos pero la columna `tipo_detectado` dice "NO ES EFECTIVO":
**Problema**: El `payment_method` no contiene "efectivo" o "cash"
**Solución**: Los pagos deben tener `payment_method` que contenga una de estas palabras:
- "efectivo"
- "cash"
- "Efectivo"
- "Cash"

### Caso C: Los pagos fueron creados después del cierre
Si el query 3 muestra `cantidad_pagos = 0` pero el query 1 muestra pagos:
**Problema**: Los pagos se registraron después de crear el cierre
**Solución**: Los pagos deben crearse ANTES de hacer el cierre de caja

### Caso D: El campo supplier_payments_cash está en 0
Si el query 2 muestra `supplier_payments_cash = 0`:
**Problema**: El cierre no calculó correctamente los pagos
**Solución**: Verificar que los pagos existan ANTES de crear el cierre

## Paso 3: Verificar el Informe Detallado

Una vez que tengas un cierre con `supplier_payments_cash > 0`, verifica el informe:

1. Ve a Control de Caja
2. Busca el cierre que tiene `supplier_payments_cash > 0`
3. Haz clic en "Ver Informe Detallado"
4. Verifica que aparezca la sección "PAGOS A PROVEEDORES (EFECTIVO)"

## Paso 4: Si el problema persiste

Si después de verificar todo lo anterior, los pagos siguen sin aparecer en el informe detallado:

```sql
-- Verificar que la función getSupplierPaymentsForClosure esté obteniendo datos
SELECT 
  sp.*,
  s.name as supplier_name
FROM supplier_payments sp
LEFT JOIN suppliers s ON s.id = sp.supplier_id
WHERE sp.company_id = 'TU_COMPANY_ID'  -- Reemplazar con tu company_id
  AND sp.payment_date >= '2025-02-17'  -- Fecha del cierre
  AND sp.payment_date <= '2025-02-17'  -- Fecha del cierre
  AND (LOWER(sp.payment_method) LIKE '%efectivo%' OR LOWER(sp.payment_method) LIKE '%cash%')
ORDER BY sp.created_at DESC;
```

## Notas Importantes

1. Los pagos a proveedores deben registrarse ANTES de hacer el cierre de caja
2. El `payment_method` debe contener "efectivo" o "cash" (no importa mayúsculas/minúsculas)
3. La fecha del pago debe coincidir con la fecha del cierre
4. El cierre calcula automáticamente el total de pagos en efectivo al momento de crearse
5. El informe detallado muestra los pagos individuales que se usaron para calcular ese total
