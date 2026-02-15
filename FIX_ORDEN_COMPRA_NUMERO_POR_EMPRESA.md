# Fix: Números de Orden de Compra por Empresa

## Problema
Las órdenes de compra tenían un constraint de unicidad global en `order_number`, lo que impedía que diferentes empresas usaran el mismo número de orden. Esto causaba el error:
```
"Ya existe una orden de compra con este número"
```

## Solución
Cambiar el constraint de unicidad para que sea por empresa (`company_id`, `order_number`), igual que funcionan los productos.

## Implementación

### 1. Script de Migración
Ejecutar el script: `scripts/209_fix_purchase_order_unique_constraint.sql`

Este script:
- ✅ Elimina el constraint global `purchase_orders_order_number_key`
- ✅ Elimina cualquier constraint anterior de company-scoped
- ✅ Crea el constraint correcto: `(company_id, order_number)` UNIQUE
- ✅ Agrega un índice para mejorar el rendimiento
- ✅ Verifica que el constraint se creó correctamente

### 2. Cómo Ejecutar

#### Opción A: Desde Supabase Dashboard
1. Ir a SQL Editor en Supabase
2. Copiar y pegar el contenido de `scripts/209_fix_purchase_order_unique_constraint.sql`
3. Ejecutar

#### Opción B: Desde psql
```bash
psql -h [host] -U [user] -d [database] -f scripts/209_fix_purchase_order_unique_constraint.sql
```

### 3. Verificación
Después de ejecutar el script, deberías ver estos mensajes:
```
NOTICE: Dropped old global unique constraint on order_number
NOTICE: Added unique constraint on (company_id, order_number)
NOTICE: ✓ Constraint successfully created: purchase_orders_company_order_number_unique
```

### 4. Resultado
Ahora cada empresa puede usar sus propios números de orden independientemente:
- Empresa A puede tener orden #1, #2, #3
- Empresa B puede tener orden #1, #2, #3
- No hay conflictos entre empresas

## Comportamiento Actual del Código
El código en `lib/actions/purchase-orders.ts` ya maneja correctamente la generación de números:
- Busca el último número de orden **de la empresa**
- Genera el siguiente número secuencial
- Tiene lógica de retry en caso de race conditions

Con este fix de base de datos, el sistema funcionará correctamente para múltiples empresas.

## Notas Importantes
- ⚠️ Este cambio es **retrocompatible**: las órdenes existentes no se ven afectadas
- ✅ No requiere cambios en el código de la aplicación
- ✅ Mejora el rendimiento con el índice agregado
- ✅ Sigue el mismo patrón que productos y otras entidades multi-tenant

## Fecha de Implementación
Febrero 2026
