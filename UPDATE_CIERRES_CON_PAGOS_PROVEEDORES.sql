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
