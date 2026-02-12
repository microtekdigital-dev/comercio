# Guía de Scripts para Cambio de Planes

Esta guía explica cómo usar los scripts SQL para cambiar el plan de suscripción de un usuario.

## Scripts Disponibles

### Planes Mensuales

1. **CAMBIAR_A_BASICO.sql** - Cambiar a Plan Básico (mensual)
2. **CAMBIAR_A_PROFESIONAL.sql** - Cambiar a Plan Profesional (mensual)
3. **CAMBIAR_A_EMPRESARIAL.sql** - Cambiar a Plan Empresarial (mensual)

### Planes Anuales

1. **CAMBIAR_A_BASICO_ANUAL.sql** - Cambiar a Plan Básico (anual)
2. **CAMBIAR_A_PROFESIONAL_ANUAL.sql** - Cambiar a Plan Profesional (anual)
3. **CAMBIAR_A_EMPRESARIAL_ANUAL.sql** - Cambiar a Plan Empresarial (anual)

### Scripts de Consulta

1. **VER_PLAN_USUARIO.sql** - Ver el plan actual de un usuario
2. **VER_PLANES_DISPONIBLES.sql** - Listar todos los planes disponibles

## Cómo Usar los Scripts

### Paso 1: Verificar el Plan Actual

Antes de cambiar el plan, verifica el plan actual del usuario:

```sql
-- Abre VER_PLAN_USUARIO.sql
-- Reemplaza 'email@ejemplo.com' con el email del usuario
-- Ejecuta el script
```

### Paso 2: Ver Planes Disponibles

Si necesitas ver todos los planes disponibles:

```sql
-- Abre VER_PLANES_DISPONIBLES.sql
-- Ejecuta el script (no requiere modificaciones)
```

### Paso 3: Cambiar el Plan

1. Abre el script correspondiente al plan deseado
2. Reemplaza `'email@ejemplo.com'` con el email real del usuario
3. Ejecuta el script en Supabase SQL Editor

**Ejemplo:**
```sql
-- Si quieres cambiar a Plan Profesional Anual
-- Abre CAMBIAR_A_PROFESIONAL_ANUAL.sql
-- Cambia esta línea:
WHERE u.email = 'email@ejemplo.com'
-- Por:
WHERE u.email = 'usuario@real.com'
```

## Características de los Planes

### Plan Básico
- **Mensual**: $2,999 ARS/mes
- **Anual**: Precio anual (consultar VER_PLANES_DISPONIBLES.sql)
- Hasta 5 usuarios
- 1 GB de almacenamiento
- Soporte por email

### Plan Profesional
- **Mensual**: $7,999 ARS/mes
- **Anual**: Precio anual (consultar VER_PLANES_DISPONIBLES.sql)
- Hasta 25 usuarios
- 10 GB de almacenamiento
- Soporte prioritario
- Reportes avanzados

### Plan Empresarial
- **Mensual**: $19,999 ARS/mes
- **Anual**: Precio anual (consultar VER_PLANES_DISPONIBLES.sql)
- Usuarios ilimitados
- 100 GB de almacenamiento
- Soporte 24/7
- API access
- SSO

## Notas Importantes

1. **Suscripción Activa**: Los scripts solo modifican suscripciones con `status = 'active'`
2. **Período de Facturación**: 
   - Planes mensuales: Se renueva cada mes
   - Planes anuales: Se renueva cada año
3. **Fecha de Inicio**: Se establece en el momento de la ejecución (`NOW()`)
4. **Fecha de Fin**: 
   - Mensual: 1 mes desde la fecha de inicio
   - Anual: 1 año desde la fecha de inicio

## Solución de Problemas

### El script no actualiza nada

Posibles causas:
1. El email del usuario es incorrecto
2. El usuario no tiene una suscripción activa
3. El plan especificado no existe en la base de datos

**Solución**: Ejecuta `VER_PLAN_USUARIO.sql` para verificar el estado actual

### Error: "plan_id not found"

El plan especificado no existe en la base de datos.

**Solución**: Ejecuta `VER_PLANES_DISPONIBLES.sql` para ver los planes disponibles

## Ubicación de los Scripts

Todos los scripts están en la carpeta: `docs-auth/`

```
docs-auth/
├── CAMBIAR_A_BASICO.sql
├── CAMBIAR_A_BASICO_ANUAL.sql
├── CAMBIAR_A_PROFESIONAL.sql
├── CAMBIAR_A_PROFESIONAL_ANUAL.sql
├── CAMBIAR_A_EMPRESARIAL.sql
├── CAMBIAR_A_EMPRESARIAL_ANUAL.sql
├── VER_PLAN_USUARIO.sql
├── VER_PLANES_DISPONIBLES.sql
└── GUIA_CAMBIO_PLANES.md (este archivo)
```
