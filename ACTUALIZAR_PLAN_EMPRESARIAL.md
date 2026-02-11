# Actualización de Precios Plan Empresarial y Badge "Más Elegido"

## Cambios Realizados

### 1. Actualización de Precios - Plan Empresarial

Se actualizaron los precios del plan Empresarial:

**Antes:**
- Mensual: $25,000
- Anual: $250,000

**Después:**
- Mensual: $30,000
- Anual: $30,000

### 2. Badge "Más Elegido" en Plan Profesional

Se agregó un badge distintivo de color morado con el texto "Más Elegido" al plan Profesional para destacarlo como la opción recomendada.

## Archivos Modificados

### 1. Script SQL de Actualización
- **Archivo:** `scripts/160_update_empresarial_pricing.sql`
- **Descripción:** Script SQL para actualizar los precios en la base de datos

### 2. Componente de Lista de Planes
- **Archivo:** `components/dashboard/plans-list.tsx`
- **Cambios:**
  - Agregada lógica para detectar el plan Profesional
  - Agregado badge "Más Elegido" con color morado
  - Prioridad de badges: Plan Actual > Más Elegido > Ahorra 2 meses > Gratis

## Instrucciones de Aplicación

### Paso 1: Actualizar Precios del Plan Empresarial

Ejecuta el script `scripts/160_update_empresarial_pricing.sql` en Supabase SQL Editor

### Paso 2: Agregar Funcionalidades a los Planes

Ejecuta el script `scripts/161_add_features_to_plans.sql` en Supabase SQL Editor

Este script agrega las siguientes funcionalidades a los planes de pago:
- Historial de stock
- Historial de precios
- Cierre de caja

### Paso 2: Verificar Cambios en la Aplicación

1. Los cambios en el componente ya están aplicados en el código
2. Reinicia el servidor de desarrollo si está corriendo
3. Navega a `/dashboard/billing` para ver los planes actualizados

## Resultado Visual

### Badges por Plan:

- **Trial:** Badge azul "Gratis"
- **Básico:** Sin badge especial
- **Profesional:** Badge morado "Más Elegido" ⭐
- **Empresarial:** Sin badge especial (o "Ahorra 2 meses" si es anual)
- **Planes Anuales:** Badge verde "Ahorra 2 meses" (excepto si es Profesional)

### Prioridad de Badges:

1. Plan Actual (si es el plan activo del usuario)
2. Más Elegido (solo para Profesional)
3. Ahorra 2 meses (para planes anuales)
4. Gratis (para Trial)

## Verificación

Después de aplicar los cambios, verifica:

✅ El plan Empresarial mensual muestra $30,000
✅ El plan Empresarial anual muestra $30,000
✅ El plan Profesional tiene el badge "Más Elegido" en color morado
✅ Los demás planes mantienen sus badges correspondientes
✅ La funcionalidad de selección de planes sigue funcionando correctamente

## Notas Importantes

- El badge "Más Elegido" solo se muestra si el plan NO es el plan actual del usuario
- Si el usuario ya tiene el plan Profesional, verá el badge "Plan Actual" en su lugar
- Los precios se muestran formateados en pesos argentinos (ARS)
- El badge tiene un ícono de estrella (Sparkles) para mayor visibilidad

## Próximos Pasos

1. Ejecutar el script SQL en Supabase
2. Verificar que los precios se actualizaron correctamente
3. Probar la visualización en la página de planes
4. Subir los cambios a GitHub
5. Desplegar a producción

---

**Fecha de actualización:** 11 de febrero de 2026
**Versión:** 1.0
