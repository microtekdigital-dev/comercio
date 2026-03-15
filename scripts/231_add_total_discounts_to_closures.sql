-- Agrega campo total_discounts al cierre de caja para auditoría de descuentos
ALTER TABLE cash_register_closures
  ADD COLUMN IF NOT EXISTS total_discounts NUMERIC(12,2) NOT NULL DEFAULT 0;

COMMENT ON COLUMN cash_register_closures.total_discounts IS 
  'Suma de todos los discount_amount de las ventas del período del cierre, para auditoría';
