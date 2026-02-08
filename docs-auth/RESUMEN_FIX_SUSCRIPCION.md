# Resumen: Fix Suscripciones Automáticas

## 🔴 Problema
Las suscripciones se recrean automáticamente cuando no deberían.

## ✅ Solución
Ejecutar 2 scripts SQL en orden:

### 1️⃣ FIX_TRIGGER_NO_RECREATE_SUBSCRIPTION.sql
**Qué hace:** Actualiza el trigger para que SOLO cree suscripciones en empresas nuevas.

**Resultado:**
- ✅ Usuario invitado → NO crea suscripción
- ✅ Usuario nuevo → Crea empresa + trial (si aplica)
- ✅ Empresa existente → NO toca la suscripción

### 2️⃣ DELETE_AUTO_SUBSCRIPTION.sql
**Qué hace:** Elimina la suscripción que se creó automáticamente para Plusmar.

**Resultado:**
- ✅ Plusmar queda sin suscripción (como debe ser)
- ✅ Admin y empleado ven el sistema bloqueado

## 📋 Pasos Rápidos

1. Abre Supabase → SQL Editor
2. Ejecuta `FIX_TRIGGER_NO_RECREATE_SUBSCRIPTION.sql`
3. Ejecuta `DELETE_AUTO_SUBSCRIPTION.sql`
4. Verifica con `DEBUG_MULTIPLE_SUBSCRIPTIONS.sql`

## ⚠️ Importante
- El error de sintaxis `$` fue corregido a `$$`
- Ejecuta los scripts EN ORDEN
- El código TypeScript ya está correcto (no requiere cambios)

## 📁 Archivos
- `FIX_TRIGGER_NO_RECREATE_SUBSCRIPTION.sql` ← Ejecutar primero
- `DELETE_AUTO_SUBSCRIPTION.sql` ← Ejecutar segundo
- `INSTRUCCIONES_FIX_SUSCRIPCION_AUTO.md` ← Instrucciones detalladas
- `DEBUG_MULTIPLE_SUBSCRIPTIONS.sql` ← Para verificar

## 🎯 Estado Actual
- ✅ Script SQL corregido (sintaxis `$$`)
- ✅ Código TypeScript correcto
- ⏳ Pendiente: Ejecutar scripts en Supabase
