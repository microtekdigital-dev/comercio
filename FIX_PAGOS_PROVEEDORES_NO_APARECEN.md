# Fix: Pagos a Proveedores No Aparecen en Cierre de Caja

## Problema
Los pagos a proveedores no se reflejan en los cierres de caja, solo aparecen las ventas.

## Causa Probable
Los cierres de caja existentes fueron creados ANTES de que se implementara el cálculo de pagos a proveedores, o no hay pagos a proveedores registrados en efectivo para esas fechas.

## Diagnóstico

### Paso 1: Ejecutar script de diagnóstico
Ejecuta el archivo `DEBUG_PAGOS_PROVEEDORES_CIERRE.sql` en Supabase SQL Editor para verificar:

1. Si hay pagos a proveedores registrados
2. Si hay pagos en EFECTIVO (solo estos se reflejan en caja)
3. Si los cierres tienen el campo `supplier_payments_cash` poblado
4. Si hay discrepancias entre pagos del día y lo registrado en cierres

### Paso 2: Verificar método de pago
Los pagos a proveedores SOLO se reflejan en el cierre de caja si el método de pago es "Efectivo" o "Cash".

Verifica en la tabla `supplier_payments` que el campo `payment_method` contenga:
- "Efectivo"
- "efectivo"  
- "Cash"
- "cash"

### Paso 3: Crear nuevo cierre
Para que los pagos a proveedores se reflejen:

1. Asegúrate de tener pagos a proveedores registrados EN EFECTIVO
2. Crea un NUEVO cierre de caja para la fecha donde hay pagos
3. El sistema calculará automáticamente los pagos en efectivo del día

## Solución Temporal: Actualizar Cierres Existentes

Si quieres actualizar los cierres existentes con los pagos a proveedores, ejecuta este script:

```sql
-- Actualizar cierres existentes con pagos a proveedores
UPDATE cash_register_closures crc
SET supplier_payments_cash = (
  SELECT COALESCE(SUM(sp.amount), 0)
  FROM supplier_payments sp
  WHERE sp.payment_date::date = crc.closure_date::date
    AND (
      LOWER(sp.payment_method) LIKE '%efectivo%' 
      OR LOWER(sp.payment_method) LIKE '%cash%'
    )
)
WHERE crc.supplier_payments_cash = 0 OR crc.supplier_payments_cash IS NULL;
```

## Verificación

Después de ejecutar el script de actualización:

1. Refresca la página de cierres de caja
2. Verifica que aparezca la sección "Pagos a Proveedores" en los cierres que tienen pagos en efectivo
3. Verifica que los montos sean correctos

## Notas Importantes

- Solo los pagos en EFECTIVO se reflejan en el cierre de caja
- Los pagos por transferencia, tarjeta u otros métodos NO afectan la caja física
- El cálculo se hace automáticamente al crear un nuevo cierre
- Los cierres existentes NO se actualizan automáticamente cuando se registran nuevos pagos
