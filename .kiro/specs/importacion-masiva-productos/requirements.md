# Documento de Requisitos

## Introducción

Este documento describe los requisitos para la funcionalidad de importación masiva de productos mediante archivos CSV en el ERP SaaS para negocios minoristas. La funcionalidad permitirá a los usuarios cargar múltiples productos de forma simultánea, validar cada fila antes de confirmar la importación, reportar errores por fila sin cancelar toda la operación, y actualizar productos existentes si el SKU ya existe (upsert).

## Glosario

- **Sistema**: La aplicación Next.js con TypeScript y Supabase
- **Usuario**: Persona autenticada con permisos para gestionar productos
- **CSV**: Archivo de texto con valores separados por comas (Comma-Separated Values)
- **Importador**: Módulo del sistema responsable de procesar archivos CSV de productos
- **Fila_CSV**: Una línea del archivo CSV que representa un producto a importar
- **Vista_Previa**: Tabla que muestra los datos parseados del CSV antes de confirmar la importación
- **Resultado_Importación**: Objeto que contiene el resumen de filas procesadas, creadas, actualizadas y con errores
- **SKU**: Código único de identificación de producto (Stock Keeping Unit)
- **Upsert**: Operación que crea un producto si no existe o lo actualiza si el SKU ya está registrado
- **Plantilla_CSV**: Archivo CSV de ejemplo con las columnas correctas y datos de muestra para guiar al usuario

## Requisitos

### Requisito 1: Descarga de Plantilla CSV

**Historia de Usuario:** Como usuario, quiero descargar una plantilla CSV de ejemplo, para saber exactamente qué columnas y formato debo usar al preparar mi archivo de importación.

#### Criterios de Aceptación

1. EL Sistema DEBERÁ proveer un botón "Descargar Plantilla" en la interfaz de importación
2. CUANDO el usuario hace clic en "Descargar Plantilla", EL Sistema DEBERÁ generar y descargar un archivo CSV con las columnas: `nombre`, `descripcion`, `precio`, `precio_costo`, `stock`, `sku`, `categoria`, `unidad`, `activo`
3. CUANDO se genera la Plantilla_CSV, EL Sistema DEBERÁ incluir al menos 2 filas de datos de ejemplo con valores válidos
4. CUANDO se genera la Plantilla_CSV, EL Sistema DEBERÁ incluir una fila de encabezados en español con los nombres exactos de columna esperados
5. EL Sistema DEBERÁ generar la Plantilla_CSV en el cliente sin requerir llamadas al servidor

### Requisito 2: Carga y Parseo del Archivo CSV

**Historia de Usuario:** Como usuario, quiero subir un archivo CSV con mis productos, para que el sistema lo procese y me muestre una vista previa antes de confirmar.

#### Criterios de Aceptación

1. CUANDO el usuario selecciona un archivo, EL Sistema DEBERÁ aceptar únicamente archivos con extensión `.csv`
2. CUANDO el usuario selecciona un archivo CSV válido, EL Importador DEBERÁ parsear el archivo y extraer todas las filas de datos
3. CUANDO el archivo CSV tiene encabezados, EL Importador DEBERÁ usar la primera fila como nombres de columna
4. CUANDO el archivo CSV está vacío o solo contiene encabezados, EL Sistema DEBERÁ mostrar un mensaje de error indicando que el archivo no contiene datos
5. CUANDO el archivo supera 5 MB, EL Sistema DEBERÁ rechazarlo y mostrar un mensaje de error con el límite permitido
6. CUANDO el archivo CSV contiene más de 500 filas de datos, EL Sistema DEBERÁ rechazarlo y mostrar un mensaje indicando el límite máximo
7. IF el archivo no puede ser parseado como CSV válido, THEN EL Sistema DEBERÁ mostrar un mensaje de error descriptivo sin procesar ninguna fila

### Requisito 3: Validación Fila por Fila

**Historia de Usuario:** Como usuario, quiero que el sistema valide cada fila del CSV antes de importar, para identificar errores específicos sin que fallen todas las importaciones por un error en una sola fila.

#### Criterios de Aceptación

1. CUANDO se valida una Fila_CSV, EL Importador DEBERÁ verificar que el campo `nombre` no esté vacío
2. CUANDO se valida una Fila_CSV, EL Importador DEBERÁ verificar que el campo `precio` sea un número mayor a 0
3. CUANDO se valida una Fila_CSV, EL Importador DEBERÁ verificar que el campo `stock` sea un número entero mayor o igual a 0
4. CUANDO se valida una Fila_CSV con campo `precio_costo` presente, EL Importador DEBERÁ verificar que sea un número mayor o igual a 0
5. CUANDO se valida una Fila_CSV con campo `categoria` presente, EL Importador DEBERÁ verificar que la categoría exista en la base de datos de la empresa
6. CUANDO se valida una Fila_CSV con campo `activo` presente, EL Importador DEBERÁ aceptar únicamente los valores `true`, `false`, `1`, `0`, `si`, `no` (sin distinción de mayúsculas)
7. CUANDO una Fila_CSV tiene errores de validación, EL Sistema DEBERÁ registrar el número de fila y una descripción clara del error sin detener la validación de las demás filas
8. CUANDO una Fila_CSV pasa todas las validaciones, EL Sistema DEBERÁ marcarla como válida y lista para importar

### Requisito 4: Vista Previa de Datos

**Historia de Usuario:** Como usuario, quiero ver una vista previa de los datos parseados antes de confirmar la importación, para verificar que los datos son correctos y revisar los errores encontrados.

#### Criterios de Aceptación

1. CUANDO el archivo CSV es parseado exitosamente, EL Sistema DEBERÁ mostrar la Vista_Previa con todas las filas
2. CUANDO se muestra la Vista_Previa, EL Sistema DEBERÁ diferenciar visualmente las filas válidas de las filas con errores
3. CUANDO se muestra la Vista_Previa, EL Sistema DEBERÁ mostrar para cada fila con error el número de fila y la descripción del error
4. CUANDO se muestra la Vista_Previa, EL Sistema DEBERÁ mostrar un resumen con el total de filas, filas válidas y filas con errores
5. CUANDO se muestra la Vista_Previa, EL Sistema DEBERÁ indicar para cada fila válida si el producto será creado (SKU nuevo) o actualizado (SKU existente)
6. CUANDO todas las filas tienen errores, EL Sistema DEBERÁ deshabilitar el botón de confirmar importación
7. CUANDO hay al menos una fila válida, EL Sistema DEBERÁ habilitar el botón de confirmar importación aunque existan filas con errores

### Requisito 5: Ejecución de la Importación (Upsert)

**Historia de Usuario:** Como usuario, quiero confirmar la importación para que el sistema cree o actualice los productos válidos, para cargar mi catálogo de forma masiva.

#### Criterios de Aceptación

1. CUANDO el usuario confirma la importación, EL Importador DEBERÁ procesar únicamente las filas marcadas como válidas
2. CUANDO se procesa una Fila_CSV válida con un SKU que no existe en la empresa, EL Importador DEBERÁ crear un nuevo producto
3. CUANDO se procesa una Fila_CSV válida con un SKU que ya existe en la empresa, EL Importador DEBERÁ actualizar el producto existente con los nuevos datos
4. CUANDO se procesa una Fila_CSV válida sin SKU, EL Importador DEBERÁ crear siempre un nuevo producto
5. CUANDO se importa un producto, EL Importador DEBERÁ respetar los límites del plan de suscripción de la empresa
6. CUANDO se importa un producto con campo `categoria` válido, EL Importador DEBERÁ asignar el `category_id` correspondiente al producto
7. CUANDO se importa un producto con campo `activo` ausente, EL Importador DEBERÁ establecer `is_active = true` por defecto
8. CUANDO se importa un producto con campo `stock` ausente, EL Importador DEBERÁ establecer `stock_quantity = 0` por defecto

### Requisito 6: Reporte de Resultados

**Historia de Usuario:** Como usuario, quiero recibir un reporte detallado al finalizar la importación, para saber cuántos productos fueron creados, actualizados y cuáles fallaron.

#### Criterios de Aceptación

1. CUANDO la importación finaliza, EL Sistema DEBERÁ mostrar el Resultado_Importación con el total de filas procesadas, productos creados, productos actualizados y filas con error
2. CUANDO la importación finaliza con errores en algunas filas, EL Sistema DEBERÁ mostrar la lista de filas fallidas con su número de fila y descripción del error
3. CUANDO la importación finaliza exitosamente sin errores, EL Sistema DEBERÁ mostrar un mensaje de éxito con el resumen
4. CUANDO la importación finaliza, EL Sistema DEBERÁ actualizar la lista de productos en la interfaz sin requerir recarga manual de la página
5. IF ocurre un error de base de datos durante la importación de una fila, THEN EL Importador DEBERÁ registrar el error de esa fila y continuar procesando las demás filas

### Requisito 7: Integración con el Sistema de Productos Existente

**Historia de Usuario:** Como desarrollador, quiero que la importación use las server actions y tipos existentes del sistema, para mantener consistencia y reutilizar la lógica de negocio ya implementada.

#### Criterios de Aceptación

1. EL Importador DEBERÁ usar la server action `createProduct` existente en `lib/actions/products.ts` para crear productos nuevos
2. EL Importador DEBERÁ usar la server action `updateProduct` existente en `lib/actions/products.ts` para actualizar productos existentes
3. EL Importador DEBERÁ usar `getCategories` de `lib/actions/categories.ts` para resolver nombres de categoría a IDs
4. EL Importador DEBERÁ respetar las políticas RLS (Row Level Security) de Supabase al operar sobre productos
5. CUANDO se crea o actualiza un producto mediante importación, EL Sistema DEBERÁ registrar movimientos de stock si corresponde, siguiendo la lógica existente en `updateProduct`
6. EL Importador DEBERÁ usar el tipo `ProductFormData` de `lib/types/erp.ts` para construir los datos de cada producto a importar

### Requisito 8: Interfaz de Usuario

**Historia de Usuario:** Como usuario, quiero una interfaz clara e intuitiva para el proceso de importación, para poder completar la tarea sin necesidad de instrucciones adicionales.

#### Criterios de Aceptación

1. EL Sistema DEBERÁ proveer una página o modal de importación accesible desde la sección de productos en `app/dashboard/products/`
2. CUANDO el usuario está en la interfaz de importación, EL Sistema DEBERÁ mostrar instrucciones claras sobre el formato esperado del CSV
3. MIENTRAS se procesa el archivo o se ejecuta la importación, EL Sistema DEBERÁ mostrar un indicador de progreso o carga
4. CUANDO la importación finaliza, EL Sistema DEBERÁ ofrecer la opción de importar otro archivo o volver al listado de productos
5. EL Sistema DEBERÁ seguir los patrones de diseño y componentes UI existentes en la aplicación (shadcn/ui)
