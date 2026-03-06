# Ejecutar Migración de Soporte Multimoneda

## Problema
No aparece la opción para cambiar la moneda en Configuración Avanzada.

## Causa
La migración de base de datos que agrega los campos de moneda no se ha ejecutado.

## Solución

### Paso 1: Verificar si la migración ya se ejecutó

1. Ve a Supabase Dashboard → SQL Editor
2. Ejecuta el script `DEBUG_CURRENCY_FIELDS.sql`
3. Revisa los resultados:
   - Si la primera consulta devuelve 3 filas (currency_code, currency_symbol, currency_position), la migración ya se ejecutó
   - Si devuelve 0 filas, necesitas ejecutar la migración

### Paso 2: Ejecutar la migración (si es necesario)

1. Ve a Supabase Dashboard → SQL Editor
2. Abre el archivo `scripts/220_add_currency_support.sql`
3. Copia todo el contenido
4. Pégalo en el SQL Editor de Supabase
5. Haz clic en "Run" para ejecutar

### Paso 3: Verificar que funcionó

1. Ejecuta nuevamente `DEBUG_CURRENCY_FIELDS.sql`
2. Verifica que:
   - Las 3 columnas existen
   - Todas las empresas tienen valores (USD, $, before por defecto)
   - El constraint check_currency_position existe

### Paso 4: Refrescar la aplicación

1. Cierra sesión en la aplicación
2. Vuelve a iniciar sesión
3. Ve a Configuración → Pestaña "Facturación"
4. Deberías ver la sección "Configuración de Moneda" al inicio de la pestaña

## Monedas Soportadas

El sistema soporta las siguientes monedas:

- 🇺🇸 USD - Dólar Estadounidense ($)
- 🇪🇺 EUR - Euro (€)
- 🇦🇷 ARS - Peso Argentino ($)
- 🇨🇱 CLP - Peso Chileno ($)
- 🇲🇽 MXN - Peso Mexicano ($)
- 🇨🇴 COP - Peso Colombiano ($)
- 🇧🇷 BRL - Real Brasileño (R$)
- 🇵🇪 PEN - Sol Peruano (S/)
- 🇺🇾 UYU - Peso Uruguayo ($U)

## Vista Previa

Al seleccionar una moneda, verás una vista previa del formato:
- Ejemplo: `$1.234,56` (símbolo antes)
- Ejemplo: `1.234,56€` (símbolo después)

## Notas

- La configuración de moneda solo afecta la visualización, no convierte valores
- Cada empresa opera en su propia moneda local
- Los valores en la base de datos se mantienen como números
- El formato se aplica automáticamente en toda la aplicación
