# Siguiente Paso: Diagnóstico Completo

## ✅ Confirmado
El trigger `handle_new_user` **SÍ está actualizado correctamente**.

Tiene todas las validaciones necesarias:
- ✅ Variable `v_is_new_company`
- ✅ Solo crea suscripciones para empresas nuevas
- ✅ NO crea suscripciones para usuarios invitados

## ❓ Pregunta Clave
Si el trigger está correcto, ¿por qué se reactiva el trial?

## 🔍 Ejecuta Este Script
Por favor ejecuta `DIAGNOSTIC_COMPLETE.sql` en Supabase SQL Editor.

Este script te mostrará:
1. **Cuándo se creó la última suscripción** (timestamp exacto)
2. **Si se creó un usuario nuevo recientemente** (esto dispararía el trigger)
3. **Cuántos perfiles tiene Plusmar** (para ver si alguien se registró de nuevo)
4. **Si el email está en trial_used_emails** (para prevenir trials múltiples)

## 🎯 Posibles Causas

### 1. Usuario Nuevo Creado
Si alguien hizo **logout y se registró de nuevo** con el mismo email:
- El trigger se dispara
- Crea un nuevo perfil
- Como es "empresa nueva" (desde la perspectiva del trigger), crea trial

**Solución:** Agregar el email a `trial_used_emails` para prevenir esto.

### 2. Webhook de MercadoPago
Si hubo un **pago aprobado** recientemente:
- El webhook crea/actualiza la suscripción
- Esto es normal si compraste un plan

**Solución:** Verificar la tabla `payments` para ver si hay pagos recientes.

### 3. Sesión Duplicada
Si el usuario tiene **múltiples sesiones abiertas**:
- Puede estar viendo datos cacheados
- La suscripción puede no estar realmente activa

**Solución:** Hacer logout completo y volver a entrar.

## 📊 Información Necesaria
Por favor comparte los resultados de `DIAGNOSTIC_COMPLETE.sql`, específicamente:

1. **¿Cuántas suscripciones tiene Plusmar?**
2. **¿Cuándo se creó la última suscripción?** (minutos_desde_creacion)
3. **¿Se creó un usuario nuevo recientemente?**
4. **¿El email está en trial_used_emails?**

Con esta información podré identificar exactamente qué está causando la reactivación.
