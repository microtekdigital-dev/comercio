# ¿Dónde Ver los Logs del Servidor?

## ⚠️ IMPORTANTE: Los logs NO están en F12

Los logs que agregamos en `lib/actions/inventory-report.ts` aparecen en el **TERMINAL DEL SERVIDOR**, NO en la consola del navegador (F12).

## ¿Por qué?

Porque `lib/actions/inventory-report.ts` usa `"use server"` - esto significa que el código se ejecuta en el servidor Node.js, no en el navegador.

## ¿Dónde ver los logs?

### Opción 1: Terminal donde ejecutaste `npm run dev`

1. Busca la ventana de terminal/consola donde ejecutaste:
   ```bash
   npm run dev
   ```

2. Cuando generes el reporte de liquidación, verás algo como:
   ```
   === calculatePurchases START ===
   Company ID: 1420bea3-a484-4a32-a429-bfd5a38063a3
   Date range: 2026-02-01 to 2026-02-28
   Category filter: none
   Product filter: none
   Purchase orders found: 2
   Purchase orders: [
     {
       "id": "088dc5bf-6d80-4ecd-85eb-56b56444f575",
       "order_number": "PO-000001",
       "received_date": "2026-02-15",
       "status": "received"
     },
     ...
   ]
   Items returned: 5
   === calculatePurchases END ===
   ```

### Opción 2: Si usas VS Code

1. Abre la terminal integrada en VS Code (View > Terminal o Ctrl+`)
2. Ahí deberías ver los logs del servidor

### Opción 3: Si usas otro IDE

Busca la ventana/panel donde se muestra la salida del comando `npm run dev`

## ¿Qué información buscar en los logs?

Cuando generes el reporte, busca estas líneas clave:

1. **Company ID**: ¿Coincide con tu empresa?
   ```
   Company ID: 1420bea3-a484-4a32-a429-bfd5a38063a3
   ```

2. **Date range**: ¿Incluye las fechas de tus órdenes?
   ```
   Date range: 2026-02-01 to 2026-02-28
   ```

3. **Purchase orders found**: ¿Cuántas órdenes encontró?
   ```
   Purchase orders found: 2
   ```
   - Si es 0, el problema es que no hay órdenes en ese rango de fechas para esa empresa
   - Si es > 0, entonces las órdenes existen

4. **Items returned**: ¿Cuántos items encontró?
   ```
   Items returned: 5
   ```
   - Si es 0 pero hay órdenes, el problema está en los items

## Próximos Pasos

1. **Ejecuta el reporte** en la aplicación
2. **Mira el terminal** donde corre `npm run dev`
3. **Copia los logs** que aparecen entre `=== calculatePurchases START ===` y `=== calculatePurchases END ===`
4. **Comparte esos logs** para que podamos ver exactamente qué está pasando

## Diagnóstico Alternativo (Sin logs)

Si no puedes ver los logs del servidor, ejecuta el script SQL:

1. Abre Supabase Dashboard
2. Ve a SQL Editor
3. Ejecuta `DIAGNOSTICO_SIMPLE_COMPRAS.sql`
4. Especialmente el **PASO 1** para ver tu company_id
5. Y el **PASO 5** para comparar tu company_id con las órdenes

## El Problema Más Común

**Company ID Mismatch**: Estás logueado con una empresa (por ejemplo, Microtek) pero las órdenes pertenecen a otra empresa (por ejemplo, Bazar Lili).

### Cómo verificar:

```sql
-- 1. Ver con qué empresa estás logueado
SELECT 
  u.email,
  c.id as company_id,
  c.name as company_name
FROM auth.users u
JOIN company_users cu ON cu.user_id = u.id
JOIN companies c ON c.id = cu.company_id
WHERE u.email = 'tu_email@ejemplo.com';

-- 2. Ver a qué empresa pertenecen las órdenes
SELECT 
  po.order_number,
  c.id as company_id,
  c.name as company_name,
  po.received_date
FROM purchase_orders po
JOIN companies c ON c.id = po.company_id
WHERE po.status = 'received'
  AND po.received_date IS NOT NULL
ORDER BY po.received_date DESC;
```

Si los company_id no coinciden, ese es el problema.

## Fecha
2026-02-14
