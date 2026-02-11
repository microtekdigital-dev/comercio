-- ============================================================================
-- Script: Agregar funcionalidades a los planes Básico, Profesional y Empresarial
-- Descripción: Agrega Historial de Stock, Historial de Precios y Cierre de Caja
-- Fecha: 2026-02-11
-- ============================================================================

-- Actualizar Plan Básico Mensual
UPDATE plans
SET features = '[
  "Hasta 3 usuarios",
  "Hasta 500 productos",
  "Gestión de ventas",
  "Gestión de clientes",
  "Gestión de categorías",
  "Presupuestos",
  "Historial de stock",
  "Historial de precios",
  "Cierre de caja",
  "Reportes básicos",
  "Soporte por email"
]'::jsonb
WHERE name = 'Básico' AND interval = 'month';

-- Actualizar Plan Básico Anual
UPDATE plans
SET features = '[
  "Hasta 3 usuarios",
  "Hasta 500 productos",
  "Gestión de ventas",
  "Gestión de clientes",
  "Gestión de categorías",
  "Presupuestos",
  "Historial de stock",
  "Historial de precios",
  "Cierre de caja",
  "Reportes básicos",
  "Soporte por email"
]'::jsonb
WHERE name = 'Básico' AND interval = 'year';

-- Actualizar Plan Profesional Mensual
UPDATE plans
SET features = '[
  "Hasta 10 usuarios",
  "Hasta 2000 productos",
  "Todo lo del plan Básico",
  "Gestión de proveedores",
  "Órdenes de compra",
  "Historial de stock",
  "Historial de precios",
  "Cierre de caja",
  "Exportar a Excel",
  "Reportes avanzados",
  "Soporte prioritario"
]'::jsonb
WHERE name = 'Profesional' AND interval = 'month';

-- Actualizar Plan Profesional Anual
UPDATE plans
SET features = '[
  "Hasta 10 usuarios",
  "Hasta 2000 productos",
  "Todo lo del plan Básico",
  "Gestión de proveedores",
  "Órdenes de compra",
  "Historial de stock",
  "Historial de precios",
  "Cierre de caja",
  "Exportar a Excel",
  "Reportes avanzados",
  "Soporte prioritario"
]'::jsonb
WHERE name = 'Profesional' AND interval = 'year';

-- Actualizar Plan Empresarial Mensual
UPDATE plans
SET features = '[
  "Usuarios ilimitados",
  "Productos ilimitados",
  "Todo lo del plan Profesional",
  "Historial de stock",
  "Historial de precios",
  "Cierre de caja",
  "Reportes completos",
  "API de integración",
  "Soporte 24/7",
  "Gestor de cuenta dedicado"
]'::jsonb
WHERE name = 'Empresarial' AND interval = 'month';

-- Actualizar Plan Empresarial Anual
UPDATE plans
SET features = '[
  "Usuarios ilimitados",
  "Productos ilimitados",
  "Todo lo del plan Profesional",
  "Historial de stock",
  "Historial de precios",
  "Cierre de caja",
  "Reportes completos",
  "API de integración",
  "Soporte 24/7",
  "Gestor de cuenta dedicado"
]'::jsonb
WHERE name = 'Empresarial' AND interval = 'year';

-- Verificar los cambios
SELECT 
  id,
  name,
  interval,
  price,
  features
FROM plans
WHERE name IN ('Básico', 'Profesional', 'Empresarial')
ORDER BY 
  CASE name
    WHEN 'Básico' THEN 1
    WHEN 'Profesional' THEN 2
    WHEN 'Empresarial' THEN 3
  END,
  interval;
