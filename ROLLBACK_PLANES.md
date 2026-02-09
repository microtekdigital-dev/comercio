# 🔄 Rollback de Planes a Precios Originales

## Resumen

Este script restaura los planes a sus precios originales:

### Precios Originales

**Mensuales:**
- Trial: GRATIS (14 días)
- Básico: $5.000/mes
- Pro: $12.000/mes
- Empresarial: $18.000/mes

**Anuales:**
- Básico: $51.000/año (ahorra $9.000 - 15% descuento)
- Pro: $102.000/año (ahorra $42.000 - 29% descuento)
- Empresarial: $184.000/año (ahorra $32.000 - 15% descuento)

---

## 📋 Instrucciones para Ejecutar el Rollback

### Paso 1: Ejecutar Script en Supabase

1. Ir a **Supabase Dashboard**
2. Abrir **SQL Editor**
3. Copiar y pegar el contenido de: `scripts/111_rollback_plans_to_original.sql`
4. Ejecutar el script
5. Verificar que se muestren **7 planes activos**

### Paso 2: Verificar Planes Restaurados

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
| Trial | month | 0 | 50 | 3 |
| Básico | month | 5000 | 500 | 3 |
| Básico | year | 51000 | 500 | 3 |
| Pro | month | 12000 | 5000 | 11 |
| Pro | year | 102000 | 5000 | 11 |
| Empresarial | month | 18000 | 999999 | 999999 |
| Empresarial | year | 184000 | 999999 | 999999 |

---

## ⚠️ Importante

### Suscripciones Existentes

- **Los usuarios existentes NO se ven afectados** - mantienen sus planes y precios actuales
- Las suscripciones activas continúan sin cambios
- Solo los nuevos usuarios verán los precios restaurados

### Diferencias con Precios Nuevos

**Plan Básico:**
- Nuevo: $8.000/mes → Original: $5.000/mes (-37.5%)
- Nuevo: $76.800/año → Original: $51.000/año (-33.6%)

**Plan Profesional/Pro:**
- Nuevo: $15.000/mes → Original: $12.000/mes (-20%)
- Nuevo: $144.000/año → Original: $102.000/año (-29.2%)

**Plan Empresarial:**
- Nuevo: $30.000/mes → Original: $18.000/mes (-40%)
- Nuevo: $288.000/año → Original: $184.000/año (-36.1%)

---

## 🔍 Verificación Adicional

### Ver Todos los Planes (Activos e Inactivos)

```sql
SELECT 
  id,
  name,
  interval,
  price,
  is_active,
  created_at
FROM public.plans
ORDER BY name, interval;
```

### Ver Suscripciones Activas

```sql
SELECT 
  s.id,
  u.email,
  c.name as company,
  p.name as plan,
  p.interval,
  p.price,
  s.status,
  s.current_period_end
FROM subscriptions s
JOIN profiles u ON s.user_id = u.id
JOIN companies c ON u.company_id = c.id
JOIN plans p ON s.plan_id = p.id
WHERE s.status = 'active'
ORDER BY s.created_at DESC;
```

---

## 📝 Notas

- Este rollback restaura los planes a como estaban en `scripts/seed-plans.sql`
- Los nombres de planes cambian: "Profesional" → "Pro"
- Los límites de usuarios y productos vuelven a los valores originales
- Las features vuelven a las descripciones originales

---

## ✅ Checklist Post-Rollback

- [ ] Verificar que hay 7 planes activos
- [ ] Verificar precios correctos en la base de datos
- [ ] Testear que nuevos usuarios vean los precios originales
- [ ] Verificar que usuarios existentes no se vean afectados
- [ ] Actualizar landing page si es necesario
- [ ] Actualizar página de precios si es necesario

---

*Script de rollback: `scripts/111_rollback_plans_to_original.sql`*
*Fecha: Febrero 2026*
