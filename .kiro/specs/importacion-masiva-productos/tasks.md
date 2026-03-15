# Implementation Plan: Importación Masiva de Productos por CSV

## Overview

Implementación incremental del módulo de importación masiva de productos por CSV. Se construye desde la lógica de parseo/validación (pura, testeable) hacia arriba hasta la UI, reutilizando las server actions y tipos existentes del sistema.

## Tasks

- [x] 1. Crear tipos e interfaces TypeScript para el módulo de importación
  - Agregar interfaces `CsvRow`, `ParsedImportRow`, `ImportRowStatus`, `CsvParseResult`, `ImportResult` en `lib/utils/csv-parser.ts`
  - Definir constante `CSV_COLUMNS` con los nombres de columna esperados
  - Definir constantes `CSV_MAX_ROWS = 500` y `CSV_MAX_SIZE_BYTES = 5MB`
  - _Requirements: 2.1, 2.5, 2.6, 3.1_

- [x] 2. Implementar utilidades de parseo y validación CSV en `lib/utils/csv-parser.ts`
  - [x] 2.1 Implementar `parseCsvText(text: string): CsvRow[]`
    - Parsear texto CSV usando la primera fila como encabezados
    - Retornar array de `CsvRow` con `rowNumber` (1-based) y `rawData`
    - _Requirements: 2.2, 2.3_

  - [ ]* 2.2 Write property test: parseo preserva conteo de filas
    - **Property 1: Parseo preserva conteo de filas**
    - **Validates: Requirements 2.2, 2.3**
    - Generar CSVs con N filas aleatorias, verificar que `parseCsvText` retorna exactamente N `CsvRow`
    - Tag: `Feature: importacion-masiva-productos, Property 1`

  - [x] 2.3 Implementar `validateRow(row, categories, existingSkus): ParsedImportRow`
    - Validar `nombre` no vacío, `precio` > 0, `stock` >= 0 entero, `precio_costo` >= 0
    - Validar `categoria` existe en lista (case-insensitive), `activo` en valores aceptados
    - Retornar `ParsedImportRow` con `status` y array `errors`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

  - [ ]* 2.4 Write property test: validación de campos requeridos y numéricos
    - **Property 3: Validación de campos requeridos y numéricos**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
    - Generar filas con nombre vacío, precio negativo, stock negativo — verificar `status === 'error'`
    - Tag: `Feature: importacion-masiva-productos, Property 3`

  - [ ]* 2.5 Write property test: resolución de categorías case-insensitive
    - **Property 4: Resolución de categorías es case-insensitive**
    - **Validates: Requirements 3.5, 5.6**
    - Generar categorías y nombres con variaciones de mayúsculas — verificar resolución correcta
    - Tag: `Feature: importacion-masiva-productos, Property 4`

  - [ ]* 2.6 Write property test: valores de activo parseados correctamente
    - **Property 10: Valores de activo son parseados correctamente**
    - **Validates: Requirements 3.6**
    - Generar valores válidos e inválidos para `activo` — verificar parseo correcto o error
    - Tag: `Feature: importacion-masiva-productos, Property 10`

  - [x] 2.7 Implementar `parseAndValidateCsv(text, categories, existingSkus): CsvParseResult`
    - Llamar `parseCsvText` y luego `validateRow` para cada fila
    - Calcular `totalRows`, `validRows`, `errorRows` en el resultado
    - Determinar `status: 'valid_create' | 'valid_update'` según `existingSkus`
    - _Requirements: 3.7, 4.4, 4.5, 5.2, 5.3_

  - [ ]* 2.8 Write property test: validación no se detiene ante errores individuales
    - **Property 2: Validación no se detiene ante errores individuales**
    - **Validates: Requirements 3.7, 4.4**
    - Generar CSVs con mezcla de filas válidas e inválidas — verificar `validRows + errorRows === totalRows`
    - Tag: `Feature: importacion-masiva-productos, Property 2`

  - [ ]* 2.9 Write property test: upsert por SKU — crear vs actualizar
    - **Property 5: Upsert por SKU — crear vs actualizar**
    - **Validates: Requirements 4.5, 5.2, 5.3, 5.4**
    - Generar filas con SKUs nuevos y existentes — verificar `valid_create` vs `valid_update`
    - Tag: `Feature: importacion-masiva-productos, Property 5`

- [x] 3. Implementar generación de plantilla CSV y validación de archivo
  - [x] 3.1 Implementar `generateTemplateCsv(): string`
    - Generar CSV con fila de encabezados y 2 filas de ejemplo con datos válidos
    - Incluir todas las columnas: `nombre, descripcion, precio, precio_costo, stock, sku, categoria, unidad, activo`
    - _Requirements: 1.2, 1.3, 1.4_

  - [ ]* 3.2 Write unit tests para generación de plantilla
    - Verificar que la plantilla contiene todas las columnas requeridas en el encabezado
    - Verificar que la plantilla tiene al menos 2 filas de datos
    - Parsear la plantilla generada y verificar que las filas de ejemplo son válidas
    - _Requirements: 1.2, 1.3, 1.4_

  - [x] 3.3 Implementar `validateCsvFile(file: File): { valid: boolean; error?: string }`
    - Verificar extensión `.csv`, tamaño <= 5MB
    - _Requirements: 2.1, 2.5_

  - [ ]* 3.4 Write property test: límites de archivo correctamente aplicados
    - **Property 9: Límites de archivo son correctamente aplicados**
    - **Validates: Requirements 2.5, 2.6**
    - Generar archivos con tamaños y conteos de filas variados — verificar rechazo correcto
    - Tag: `Feature: importacion-masiva-productos, Property 9`

- [x] 4. Checkpoint — Asegurar que todos los tests del parser pasan
  - Ejecutar `vitest --run __tests__/lib/utils/csv-parser*`
  - Verificar que todas las propiedades y unit tests pasan sin errores

- [x] 5. Implementar server action `importProductsFromCsv` en `lib/actions/csv-import.ts`
  - [x] 5.1 Crear `lib/actions/csv-import.ts` con la función `importProductsFromCsv`
    - Recibir array de `{ productData: ProductFormData; existingProductId?: string }`
    - Para cada fila: si `existingProductId` → llamar `updateProduct`; si no → llamar `createProduct`
    - Capturar errores individuales sin detener el procesamiento de las demás filas
    - Retornar `ImportResult` con `totalProcessed`, `created`, `updated`, `errors`
    - _Requirements: 5.1, 5.2, 5.3, 6.1, 6.5_

  - [ ]* 5.2 Write property test: invariante del resultado de importación
    - **Property 7: Invariante del resultado de importación**
    - **Validates: Requirements 6.1, 6.5**
    - Mockear `createProduct`/`updateProduct` con éxitos y fallos aleatorios
    - Verificar que `created + updated + errors.length === totalProcessed`
    - Tag: `Feature: importacion-masiva-productos, Property 7`

  - [ ]* 5.3 Write property test: aislamiento de errores en importación
    - **Property 8: Aislamiento de errores en importación**
    - **Validates: Requirements 6.5**
    - Generar filas donde algunas fallan — verificar que `totalProcessed` iguala filas enviadas
    - Tag: `Feature: importacion-masiva-productos, Property 8`

  - [ ]* 5.4 Write property test: solo filas válidas se envían al servidor
    - **Property 6: Solo filas válidas se envían al servidor**
    - **Validates: Requirements 5.1**
    - Verificar que el componente solo pasa filas con `status !== 'error'` al server action
    - Tag: `Feature: importacion-masiva-productos, Property 6`

- [x] 6. Implementar componente `csv-preview-table.tsx`
  - Crear tabla con columnas: Fila #, Estado (badge), Nombre, SKU, Precio, Stock, Categoría, Error
  - Badge "Crear" (verde) para `valid_create`, "Actualizar" (azul) para `valid_update`, "Error" (rojo) para `error`
  - Mostrar descripción del error en columna Error para filas con `status === 'error'`
  - Soportar paginación para CSVs grandes (mostrar primeras 100 filas por defecto)
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 7. Implementar componente principal `csv-import-modal.tsx`
  - [x] 7.1 Implementar estado `idle` con instrucciones, botón "Descargar Plantilla" y zona de carga de archivo
    - Botón "Descargar Plantilla" llama `generateTemplateCsv()` y descarga el archivo
    - Input de archivo acepta solo `.csv`, llama `validateCsvFile` al seleccionar
    - _Requirements: 1.1, 1.5, 2.1, 8.1, 8.2_

  - [x] 7.2 Implementar estado `parsing` con indicador de carga
    - Al seleccionar archivo válido: cargar categorías y productos existentes, luego llamar `parseAndValidateCsv`
    - Mostrar spinner mientras se procesa
    - _Requirements: 8.3_

  - [x] 7.3 Implementar estado `preview` con Vista_Previa y controles de confirmación
    - Mostrar resumen: total filas, filas válidas, filas con error
    - Renderizar `CsvPreviewTable` con las filas parseadas
    - Botón "Confirmar Importación" habilitado solo si `validRows > 0`
    - Botón "Cancelar" para volver al estado `idle`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.6, 4.7_

  - [x] 7.4 Implementar estado `importing` y `done`
    - Estado `importing`: llamar `importProductsFromCsv` con filas válidas, mostrar spinner
    - Estado `done`: mostrar `ImportResult` con resumen y lista de errores si los hay
    - Botón "Importar otro archivo" vuelve a `idle`, botón "Ver productos" cierra modal y llama `onImportComplete`
    - _Requirements: 6.1, 6.2, 6.3, 8.4_

- [x] 8. Integrar botón "Importar CSV" en la página de productos
  - Agregar botón "Importar CSV" en `app/dashboard/products/page.tsx` junto al botón "Nuevo Producto"
  - Renderizar `CsvImportModal` con `onImportComplete` que llama `router.refresh()`
  - _Requirements: 8.1_

- [x] 9. Checkpoint final — Asegurar que todos los tests pasan
  - Ejecutar `vitest --run` para correr toda la suite de tests
  - Verificar que todas las propiedades y unit tests pasan sin errores

## Notes

- Las tareas marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido
- Cada property test referencia una propiedad específica del documento de diseño
- El módulo no requiere cambios de base de datos ni migraciones SQL
- La validación de categorías se hace en cliente para dar feedback inmediato en la Vista_Previa
- Los SKUs existentes se cargan una sola vez antes de mostrar la Vista_Previa para evitar N+1 queries
