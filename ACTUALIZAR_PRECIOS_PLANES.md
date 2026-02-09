# 💰 Actualización de Precios de Planes

## Nuevos Precios Implementados

### Precios Mensuales
- **Trial**: GRATIS (14 días)
- **Básico**: $8.000/mes
- **Profesional**: $15.000/mes
- **Empresarial**: $30.000/mes

### Precios Anuales (20% descuento)
- **Básico**: $76.800/año (ahorra $19.200)
- **Profesional**: $144.000/año (ahorra $36.000)
- **Empresarial**: $288.000/año (ahorra $72.000)

---

## 📋 Instrucciones para Aplicar

### Paso 1: Ejecutar Script en Supabase

1. Ir a Supabase Dashboard
2. Abrir SQL Editor
3. Copiar y pegar el contenido de: `scripts/110_update_plans_pricing.sql`
4. Ejecutar el script
5. Verificar que se muestren 7 planes activos

### Paso 2: Verificar Planes

Ejecutar esta consulta para verificar:

```sql
SELECT 
  name,
  interval,
  price,
  max_products,
  max_users,
  is_active
FROM public.plans
WHERE is_active = true
ORDER BY sort_order;
```

Deberías ver:

| name | interval | price | max_products | max_users |
|------|----------|-------|--------------|-----------|
| Trial | month | 0 | 100 | 1 |
| Básico | month | 8000 | 500 | 1 |
| Básico | year | 76800 | 500 | 1 |
| Profesional | month | 15000 | 2000 | 5 |
| Profesional | year | 144000 | 2000 | 5 |
| Empresarial | month | 30000 | 999999 | 15 |
| Empresarial | year | 288000 | 999999 | 15 |

---

## 📊 Comparativa de Precios

### Antes vs Después

**Plan Básico:**
- Antes: $5.000/mes
- Ahora: $8.000/mes
- Cambio: +60%

**Plan Profesional:**
- Antes: $12.000/mes
- Ahora: $15.000/mes
- Cambio: +25%

**Plan Empresarial:**
- Antes: $18.000/mes
- Ahora: $30.000/mes
- Cambio: +67%

### Justificación del Aumento

1. **Valor agregado**: Sistema completo con más features
2. **Mercado**: Precios competitivos para Argentina
3. **Sostenibilidad**: Márgenes saludables para el negocio
4. **Descuento anual**: Incentivo fuerte (20%)

---

## ✅ Cambios Incluidos

### Límites Actualizados

**Trial:**
- Productos: 50 → 100
- Clientes: 3 → 50
- Usuarios: 3 → 1

**Básico:**
- Productos: 500 (sin cambio)
- Clientes: Nuevo límite 200
- Usuarios: 3 → 1

**Profesional:**
- Productos: 5.000 → 2.000
- Clientes: Nuevo límite 1.000
- Usuarios: 11 → 5

**Empresarial:**
- Productos: Ilimitado
- Clientes: Ilimitado
- Usuarios: 999999 → 15

### Features Actualizados

Todos los planes ahora incluyen:
- Descripción clara del ahorro anual
- "Precio fijo por 12 meses" en planes anuales
- Features más específicos y claros

---

## 🚨 Importante

### Suscripciones Existentes

- Las suscripciones activas NO se ven afectadas
- Los usuarios mantienen su precio actual
- Solo los nuevos usuarios verán los nuevos precios

### Migración de Usuarios

Si querés migrar usuarios existentes:

```sql
-- Ver usuarios con planes antiguos
SELECT 
  u.email,
  c.name as company,
  s.status,
  p.name as plan,
  p.price
FROM subscriptions s
JOIN profiles u ON s.user_id = u.id
JOIN companies c ON u.company_id = c.id
JOIN plans p ON s.plan_id = p.id
WHERE s.status = 'active'
AND p.is_active = false;
```

---

## 📈 Proyección de Ingresos

### Escenario: 50 Clientes en 6 Meses

**Mix esperado:**
- 25 clientes Básico (50%)
- 20 clientes Profesional (40%)
- 5 clientes Empresarial (10%)

**Si 40% paga anual:**

```
MENSUALES (30 clientes):
15 × $8.000 = $120.000
12 × $15.000 = $180.000
3 × $30.000 = $90.000
Subtotal: $390.000/mes

ANUALES (20 clientes):
10 × $76.800 = $768.000 (cash inmediato)
8 × $144.000 = $1.152.000 (cash inmediato)
2 × $288.000 = $576.000 (cash inmediato)
Subtotal: $2.496.000 (año 1)

Total Año 1: $7.176.000
```

---

## 🎯 Próximos Pasos

### 1. Aplicar Cambios
- [ ] Ejecutar script en Supabase
- [ ] Verificar planes activos
- [ ] Testear en ambiente de prueba

### 2. Actualizar Marketing
- [ ] Actualizar landing page
- [ ] Actualizar página de precios
- [ ] Actualizar materiales de venta

### 3. Comunicación
- [ ] Email a usuarios trial (si hay)
- [ ] Anuncio en redes sociales
- [ ] Actualizar FAQ

### 4. Monitoreo
- [ ] Tracking de conversiones
- [ ] Análisis de abandono
- [ ] Feedback de usuarios

---

## 📞 Soporte

Si hay problemas con la actualización:

1. Revisar logs de Supabase
2. Verificar que no haya suscripciones activas afectadas
3. Rollback si es necesario (contactar soporte)

---

## 🔄 Rollback (Si es Necesario)

Para volver a precios anteriores:

```sql
-- Ejecutar el script anterior
-- scripts/seed-plans.sql
```

**IMPORTANTE**: Solo hacer rollback si NO hay nuevas suscripciones con los nuevos precios.

---

*Última actualización: Febrero 2026*
*Versión: 2.0*
