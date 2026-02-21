# Error: Tabla technicians no existe

## Problema

El módulo de reparaciones requiere que se ejecute el script SQL para crear las tablas en la base de datos.

## Solución

Debes ejecutar el script SQL en tu base de datos de Supabase:

### Opción 1: Desde Supabase Dashboard (Recomendado)

1. Ve a tu proyecto en Supabase: https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a la sección "SQL Editor" en el menú lateral
4. Crea una nueva query
5. Copia y pega el contenido completo del archivo: `scripts/216_create_repairs_module.sql`
6. Haz clic en "Run" para ejecutar el script

### Opción 2: Desde línea de comandos

Si tienes configurado el CLI de Supabase:

```bash
supabase db push
```

O ejecuta el script directamente:

```bash
psql -h [TU_HOST] -U postgres -d postgres -f scripts/216_create_repairs_module.sql
```

## Verificación

Después de ejecutar el script, verifica que las tablas se crearon correctamente ejecutando esta query en el SQL Editor:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('technicians', 'repair_orders', 'repair_items', 'repair_payments', 'repair_notes');
```

Deberías ver las 5 tablas listadas.

## Tablas que se crearán

- `technicians` - Técnicos que realizan reparaciones
- `repair_orders` - Órdenes de reparación
- `repair_items` - Repuestos utilizados en reparaciones
- `repair_payments` - Pagos de reparaciones
- `repair_notes` - Notas internas de reparaciones

También se creará:
- Tipo enum `repair_status` con los estados de reparación
- Función `get_next_repair_order_number()` para números secuenciales
- Políticas RLS para todas las tablas

## Después de ejecutar el script

Una vez ejecutado el script, recarga la aplicación y el módulo de reparaciones debería funcionar correctamente.
