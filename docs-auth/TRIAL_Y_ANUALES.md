# ✅ Trial y Planes Anuales Implementados

## 🎯 Objetivo Completado
Se implementó el sistema de trial gratuito y planes anuales con descuentos del 16.67% (equivalente a 2 meses gratis).

---

## 📋 Cambios Realizados

### 1. **scripts/seed-plans.sql**
Actualizado con 7 planes en total:

#### Plan Trial (Gratis)
- **Precio**: $0
- **Duración**: 14 días (configurado como 'month' en interval)
- **Límites**: 3 usuarios, 500 productos
- **Características**: Todas las del plan Básico
- **Nota**: Solo se puede usar una vez por empresa

#### Planes Mensuales (3 planes)
- **Básico**: $2,999/mes - 3 usuarios, 500 productos
- **Pro**: $7,999/mes - 11 usuarios, 5,000 productos
- **Empresarial**: $19,999/mes - Ilimitado

#### Planes Anuales (3 planes)
- **Básico Anual**: $29,990/año (ahorra $5,998)
- **Pro Anual**: $79,990/año (ahorra $15,998)
- **Empresarial Anual**: $199,990/año (ahorra $39,998)

**Cambios técnicos**:
- ✅ Cambiado índice único de `name` a `name + interval`
- ✅ Permite tener mismo plan en versión mensual y anual
- ✅ Usa `ON CONFLICT (name, interval)` para actualizar planes existentes

---

### 2. **components/dashboard/plans-list.tsx**
Componente completamente rediseñado:

#### Nuevas Características
- ✅ **Tabs Mensual/Anual**: Toggle para cambiar entre planes mensuales y anuales
- ✅ **Badge de ahorro**: Muestra "-17%" en el tab anual
- ✅ **Sección Trial separada**: El trial se muestra primero, destacado
- ✅ **Badges especiales**:
  - Trial: Badge azul con "Gratis"
  - Anual: Badge verde con "Ahorra 2 meses"
  - Plan actual: Badge default con "Plan Actual"
- ✅ **Texto de ahorro**: Muestra "Equivalente a 10 meses" en planes anuales
- ✅ **Botón personalizado**: "Comenzar Trial Gratis" para el trial
- ✅ **Bloqueo de trial**: Si ya usó el trial, muestra "Trial no disponible"

#### Estructura Visual
```
┌─────────────────────────────────────┐
│     Comienza Gratis (Trial)         │
│  [Card del plan Trial destacado]    │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│         Elige tu Plan               │
│  Ahorra hasta 2 meses con anual     │
│                                     │
│  [Mensual] [Anual -17%]  ← Tabs    │
│                                     │
│  [Básico] [Pro] [Empresarial]      │
└─────────────────────────────────────┘
```

---

### 3. **PLANES_COMERCIALES.md**
Documentación actualizada con:

#### Nuevas Secciones
- ✅ Plan Trial detallado
- ✅ Tabla de comparación mensual vs anual
- ✅ Cálculo del ahorro explicado
- ✅ Precios actualizados con columnas mensuales y anuales
- ✅ Guía de selección actualizada con recomendación de anual
- ✅ Estrategia de precios con trial y descuentos

#### Información Clave
- Trial: 14 días gratis, sin tarjeta requerida
- Anual: 16.67% descuento (2 meses gratis)
- Ahorros: $5,998 (Básico), $15,998 (Pro), $39,998 (Empresarial)

---

## 💡 Cómo Funciona

### Trial Gratuito
1. Usuario nuevo se registra
2. Sistema automáticamente activa trial de 14 días
3. Tiene acceso a todas las funciones del plan Básico
4. Al finalizar, debe elegir un plan de pago
5. No puede volver a usar el trial (se valida por empresa)

### Planes Anuales
1. Usuario ve toggle "Mensual / Anual"
2. Al seleccionar "Anual", ve los planes anuales
3. Badge verde muestra "Ahorra 2 meses"
4. Precio muestra el total anual
5. Texto indica "Equivalente a 10 meses"
6. Al pagar, se activa por 12 meses

---

## 🧪 Cómo Probar

### 1. Ejecutar Script SQL
```sql
-- En Supabase SQL Editor
-- Copiar y pegar todo el contenido de scripts/seed-plans.sql
-- Ejecutar
```

### 2. Verificar Planes
```sql
SELECT name, interval, price, max_users, max_products 
FROM plans 
ORDER BY sort_order;
```

Deberías ver:
```
Trial        | month | 0       | 3      | 500
Básico       | month | 2999    | 3      | 500
Básico       | year  | 29990   | 3      | 500
Pro          | month | 7999    | 11     | 5000
Pro          | year  | 79990   | 11     | 5000
Empresarial  | month | 19999   | 999999 | 999999
Empresarial  | year  | 199990  | 999999 | 999999
```

### 3. Probar en la App

#### Trial
1. Registrar nuevo usuario
2. Debería activarse automáticamente el trial
3. Dashboard muestra "Plan Trial" activo
4. Tiene 14 días para probar

#### Planes Mensuales
1. Ir a Dashboard → Billing
2. Ver toggle "Mensual / Anual"
3. Por defecto muestra planes mensuales
4. Ver 3 cards: Básico, Pro, Empresarial

#### Planes Anuales
1. Click en tab "Anual"
2. Ver badge "-17%" en el tab
3. Ver 3 cards con precios anuales
4. Ver badge verde "Ahorra 2 meses" en cada card
5. Ver texto "Equivalente a 10 meses"

---

## 📊 Estructura de Precios

### Cálculo del Descuento Anual

**Fórmula**: Precio Anual = Precio Mensual × 10

**Ejemplos**:
- Básico: $2,999 × 10 = $29,990 (vs $35,988 mensual)
- Pro: $7,999 × 10 = $79,990 (vs $95,988 mensual)
- Empresarial: $19,999 × 10 = $199,990 (vs $239,988 mensual)

**Descuento**: 16.67% (2 meses gratis de 12)

---

## 🎨 Mejoras Visuales

### Badges
- **Trial**: Azul con icono Sparkles + "Gratis"
- **Anual**: Verde con icono Sparkles + "Ahorra 2 meses"
- **Plan Actual**: Default con "Plan Actual"

### Tabs
- **Mensual**: Tab simple
- **Anual**: Tab con badge "-17%" integrado

### Cards
- **Trial**: Destacado en sección separada
- **Mensuales**: Grid de 3 columnas
- **Anuales**: Grid de 3 columnas con texto de ahorro

---

## 🔄 Lógica de Negocio

### Validación de Trial
```typescript
// En lib/actions/plans.ts
const isTrialPlan = plan.name?.toLowerCase().includes("trial") || Number(plan.price) === 0;
const isTrialBlocked = isTrialPlan && hasUsedTrial;
```

### Separación de Planes
```typescript
// En components/dashboard/plans-list.tsx
const trialPlans = plans.filter(p => 
  p.name?.toLowerCase().includes("trial") || Number(p.price) === 0
);
const monthlyPlans = plans.filter(p => 
  p.interval === "month" && !isTrialPlan && Number(p.price) > 0
);
const yearlyPlans = plans.filter(p => 
  p.interval === "year"
);
```

---

## ⚠️ IMPORTANTE: Siguiente Paso

**Debes ejecutar el script SQL en Supabase**:

1. Ir a Supabase Dashboard
2. Abrir SQL Editor
3. Copiar contenido de `scripts/seed-plans.sql`
4. Ejecutar
5. Verificar que se crearon/actualizaron los 7 planes

**Nota**: El script usa `ON CONFLICT` para actualizar planes existentes sin eliminarlos, evitando el error de foreign key.

---

## 🐛 Troubleshooting

### Error: "duplicate key value violates unique constraint"
**Causa**: Ya existe un plan con ese nombre e interval
**Solución**: El script usa `ON CONFLICT` para actualizar, debería funcionar automáticamente

### No se muestran los tabs Mensual/Anual
**Verificar**:
1. ¿Ejecutaste el script SQL?
2. ¿Hay planes con interval='year'?
3. Revisar consola del navegador

### El trial no se activa automáticamente
**Verificar**:
1. ¿Existe un plan con price=0 o name='Trial'?
2. ¿El plan está activo (is_active=true)?
3. Revisar logs del servidor

### Los precios anuales no muestran el ahorro
**Verificar**:
1. ¿El plan tiene interval='year'?
2. ¿El componente está usando la versión actualizada?
3. Limpiar caché del navegador

---

## 📝 Notas Técnicas

### Índice Único
Cambiado de `plans_name_unique` a `plans_name_interval_unique`:
```sql
CREATE UNIQUE INDEX IF NOT EXISTS plans_name_interval_unique 
ON public.plans(name, interval);
```

Esto permite tener:
- Básico (month)
- Básico (year)

Sin conflictos.

### Duración del Trial
El trial usa `interval='month'` pero la duración real se controla en:
- `lib/actions/subscriptions.ts`: `TRIAL_DAYS = 14`
- `lib/actions/plans.ts`: Calcula `periodEnd` basado en `interval_count`

### Detección de Trial
Un plan es trial si:
1. `name` contiene "trial" (case insensitive), O
2. `price` es igual a 0

---

## 🚀 Próximos Pasos (Opcional)

### 1. Notificaciones de Trial
- [ ] Email cuando quedan 3 días de trial
- [ ] Banner en dashboard cuando quedan 3 días
- [ ] Notificación cuando expira el trial

### 2. Upgrade Automático
- [ ] Sugerir plan anual al finalizar trial
- [ ] Mostrar ahorro potencial
- [ ] Descuento adicional por upgrade temprano

### 3. Métricas
- [ ] Tracking de conversión trial → pago
- [ ] Tracking de selección mensual vs anual
- [ ] Dashboard de métricas de suscripciones

### 4. Promociones
- [ ] Código de descuento para referidos
- [ ] Descuento por upgrade desde trial
- [ ] Promociones estacionales

---

**Fecha**: Febrero 2026
**Versión**: 1.0
**Archivos modificados**: 3
**Archivos creados**: 1
