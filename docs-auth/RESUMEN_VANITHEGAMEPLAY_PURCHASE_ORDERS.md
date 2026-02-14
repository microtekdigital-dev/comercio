# 🔧 Problema Específico: vanithegameplay@gmail.com no puede crear órdenes de compra

## 🎯 SITUACIÓN

- ✅ **microtekdigital@gmail.com** puede crear órdenes de compra SIN PROBLEMAS
- ❌ **vanithegameplay@gmail.com** NO puede crear órdenes de compra

Esto indica que el problema NO es general del sistema, sino específico de la cuenta vanithegameplay.

## 🔍 POSIBLES CAUSAS

### 1. Usuario sin company_id
El usuario puede no tener un `company_id` asignado en la tabla `profiles`.

### 2. Rol incorrecto
El usuario puede tener rol `employee` en lugar de `owner`, `admin` o `member`.

### 3. Sin suscripción activa
La empresa del usuario puede no tener una suscripción activa.

### 4. Plan incorrecto
El plan puede no permitir acceso a purchase orders (solo Profesional y Empresarial lo permiten).

### 5. Sin suppliers
El usuario puede no tener suppliers creados (necesario para crear órdenes).

### 6. Falta en company_users
El usuario puede no estar registrado en la tabla `company_users`.

## 📋 DIAGNÓSTICO

### Paso 1: Ejecutar diagnóstico
```sql
-- En Supabase SQL Editor
-- Archivo: docs-auth/DEBUG_VANITHEGAMEPLAY_SPECIFIC.sql
```

Este script te mostrará:
- ✅ o ❌ Company ID
- ✅ o ❌ Rol del usuario
- ✅ o ❌ Suscripción activa
- ✅ o ❌ Plan permite purchase orders
- ✅ o ❌ Tiene suppliers
- 🔍 Comparación con microtekdigital

### Paso 2: Aplicar fix automático
```sql
-- En Supabase SQL Editor
-- Archivo: docs-auth/FIX_VANITHEGAMEPLAY_PURCHASE_ORDERS_SPECIFIC.sql
```

Este script:
1. Asigna company_id si falta
2. Corrige el rol si es employee
3. Asegura que existe en company_users
4. Verifica suscripción y plan
5. Verifica suppliers
6. Muestra resumen y siguiente paso

## 🎉 SOLUCIÓN RÁPIDA

Si el diagnóstico muestra un problema específico:

### Problema: Sin company_id
```sql
-- Buscar company del usuario
SELECT id, name FROM companies WHERE name LIKE '%vanithegameplay%';

-- Asignar company_id
UPDATE profiles 
SET company_id = 'COMPANY_ID_AQUI'
WHERE email = 'vanithegameplay@gmail.com';
```

### Problema: Rol employee
```sql
UPDATE profiles 
SET role = 'owner'
WHERE email = 'vanithegameplay@gmail.com';
```

### Problema: Sin suscripción
El usuario debe:
1. Ir a `/dashboard/billing`
2. Seleccionar un plan (Profesional o Empresarial)
3. Completar el pago

### Problema: Sin suppliers
El usuario debe:
1. Ir a `/dashboard/suppliers`
2. Crear al menos un supplier
3. Luego podrá crear órdenes de compra

## 📊 COMPARACIÓN

| Aspecto | microtekdigital | vanithegameplay |
|---------|-----------------|-----------------|
| Company ID | ✅ Tiene | ❓ Verificar |
| Rol | ✅ owner/admin | ❓ Verificar |
| Suscripción | ✅ Activa | ❓ Verificar |
| Plan | ✅ Permite PO | ❓ Verificar |
| Suppliers | ✅ Tiene | ❓ Verificar |

## 🔄 PROCESO DE VERIFICACIÓN

1. **Ejecuta el diagnóstico** (`DEBUG_VANITHEGAMEPLAY_SPECIFIC.sql`)
2. **Lee los resultados** - identifica qué está en ❌
3. **Ejecuta el fix** (`FIX_VANITHEGAMEPLAY_PURCHASE_ORDERS_SPECIFIC.sql`)
4. **Sigue las instrucciones** del "SIGUIENTE PASO"
5. **Intenta crear una orden** de compra
6. **Si sigue fallando**, comparte:
   - Los resultados del diagnóstico
   - Los logs del navegador (F12 > Console)
   - El mensaje de error exacto

## ⚠️ IMPORTANTE

NO ejecutes el script `FIX_ALL_ERP_RLS_POLICIES.sql` todavía. Primero necesitamos identificar el problema específico de vanithegameplay.

El problema de RLS solo aplica si AMBOS usuarios tienen el mismo problema. Como microtekdigital funciona bien, el problema es específico de la configuración de vanithegameplay.

---

**Fecha:** 2026-02-14  
**Estado:** 🔍 DIAGNÓSTICO REQUERIDO  
**Prioridad:** 🔴 ALTA  
**Archivos:**
- `docs-auth/DEBUG_VANITHEGAMEPLAY_SPECIFIC.sql` - Diagnóstico completo
- `docs-auth/FIX_VANITHEGAMEPLAY_PURCHASE_ORDERS_SPECIFIC.sql` - Fix automático
