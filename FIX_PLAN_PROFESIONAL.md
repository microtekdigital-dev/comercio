# 🔧 Fix: Activar Funcionalidades del Plan Profesional

## Problema Identificado

El plan "Profesional" estaba activo pero las funcionalidades premium no aparecían:
- ❌ Proveedores
- ❌ Órdenes de compra
- ❌ Exportar a Excel
- ❌ Reportes avanzados

**Causa:** El código buscaba el plan "Pro" pero en la base de datos se llama "Profesional".

---

## ✅ Solución Aplicada

Se actualizó el archivo `lib/utils/plan-limits.ts` para reconocer ambos nombres:
- "Pro" (nombre antiguo)
- "Profesional" (nombre actual)

### Funciones Corregidas:

1. `canAccessPurchaseOrders()` - Órdenes de compra
2. `canAccessSuppliers()` - Proveedores
3. `canExportToExcel()` - Exportar a Excel
4. `canAccessAdvancedReports()` - Reportes avanzados

---

## 📋 Pasos para Activar las Funcionalidades

### Opción 1: Reiniciar el Servidor de Desarrollo (Recomendado)

1. **Detener el servidor** (Ctrl+C en la terminal donde corre)
2. **Iniciar nuevamente:**
   ```bash
   npm run dev
   ```
3. **Refrescar el navegador** (F5 o Ctrl+R)
4. **Verificar** que aparezcan las nuevas opciones en el menú

### Opción 2: Desplegar a Producción (Vercel)

Si estás en producción:

1. **Push a GitHub:**
   ```bash
   git push origin main
   ```

2. **Vercel desplegará automáticamente** (toma 2-3 minutos)

3. **Verificar el despliegue** en el dashboard de Vercel

4. **Refrescar la aplicación** en producción

---

## 🔍 Verificar que Funciona

Después de reiniciar, deberías ver en el menú lateral:

### Nuevas Opciones Visibles:

✅ **Proveedores** (en el menú principal)
- Crear proveedores
- Listar proveedores
- Editar proveedores

✅ **Órdenes de Compra** (en el menú principal)
- Crear órdenes de compra
- Listar órdenes de compra
- Ver detalles de órdenes

✅ **Botones de Exportar** (en las listas)
- Exportar productos a Excel
- Exportar ventas a Excel
- Exportar clientes a Excel

✅ **Reportes Avanzados** (en Analytics)
- Gráficos avanzados
- Métricas detalladas
- Análisis de tendencias

---

## 🧪 Script de Diagnóstico (Opcional)

Si querés verificar tu plan en la base de datos:

1. Ir a **Supabase Dashboard** → **SQL Editor**
2. Ejecutar: `docs-auth/DEBUG_PLAN_FEATURES.sql`
3. Verificar que tu empresa "Mates" tenga plan "Profesional" activo

---

## 📊 Tu Suscripción Actual

Según la consulta:

```
Empresa: Mates
Plan: Profesional (mensual)
Estado: Activo
```

**Funcionalidades incluidas:**
- ✅ Hasta 2.000 productos
- ✅ Hasta 5 usuarios
- ✅ Ventas ilimitadas
- ✅ Órdenes de compra
- ✅ Gestión de proveedores
- ✅ Reportes avanzados
- ✅ Exportar a Excel
- ✅ Soporte prioritario

---

## 🔄 Script de Unificación (Opcional)

Si querés limpiar los planes "Pro" antiguos de la base de datos:

1. Ejecutar: `scripts/112_unify_plan_names.sql`
2. Esto migrará todas las suscripciones de "Pro" a "Profesional"
3. Desactivará los planes "Pro" antiguos

**IMPORTANTE:** Solo ejecutar si hay suscripciones con plan "Pro" que necesiten migración.

---

## ❓ Troubleshooting

### Las funcionalidades aún no aparecen:

1. **Verificar que reiniciaste el servidor**
   - Detener completamente (Ctrl+C)
   - Iniciar de nuevo (npm run dev)

2. **Limpiar caché del navegador**
   - Ctrl+Shift+R (hard refresh)
   - O abrir en ventana incógnita

3. **Verificar la consola del navegador**
   - F12 → Console
   - Buscar errores relacionados con permisos

4. **Verificar que estás logueado con la empresa correcta**
   - Ir a Configuración
   - Verificar que dice "Mates"
   - Verificar que el plan dice "Profesional"

### Si sigue sin funcionar:

Ejecutar este query en Supabase para verificar:

```sql
SELECT 
  c.name as company,
  p.name as plan_name,
  p.features,
  s.status
FROM subscriptions s
JOIN companies c ON s.company_id = c.id
JOIN plans p ON s.plan_id = p.id
WHERE c.name = 'Mates'
AND s.status = 'active';
```

---

## 📝 Notas Técnicas

### Cambios en el Código:

**Antes:**
```typescript
const allowedPlans = ["Pro", "Empresarial"];
```

**Después:**
```typescript
const allowedPlans = ["Pro", "Profesional", "Empresarial"];
```

Esto asegura compatibilidad con ambos nombres de plan.

---

## ✅ Checklist de Verificación

- [ ] Código actualizado (commit realizado)
- [ ] Servidor reiniciado
- [ ] Navegador refrescado
- [ ] Menú "Proveedores" visible
- [ ] Menú "Órdenes de Compra" visible
- [ ] Botones "Exportar" visibles en listas
- [ ] Reportes avanzados accesibles en Analytics

---

*Fix aplicado: Febrero 2026*
*Commit: "Fix: Reconocer plan 'Profesional' para habilitar funcionalidades premium"*
