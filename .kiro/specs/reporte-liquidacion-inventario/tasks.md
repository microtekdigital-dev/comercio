# Implementation Plan: Reporte de Liquidación de Inventario

## Overview

Este plan implementa un sistema de reporte contable de inventario que calcula existencias iniciales, compras, ventas y existencias finales para un período específico. La implementación se divide en capas: server actions para cálculos SQL, componentes React para UI, y funcionalidad de exportación.

## Tasks

- [x] 1. Crear tipos TypeScript y estructura base
  - Definir interface `InventoryReportRow` con todos los campos del reporte
  - Definir tipos para filtros y parámetros de consulta
  - Crear archivo `lib/types/inventory-report.ts`
  - _Requirements: 2.4, 3.4, 4.4, 5.4_

- [x] 2. Implementar server actions para cálculos de inventario
  - [x] 2.1 Crear función `calculateInitialStock` para existencia inicial
    - Consulta SQL que suma stock_movements antes de start_date
    - Agrupar por product_id y variant_id
    - Calcular unidades y valores monetarios
    - _Requirements: 2.1, 2.2, 2.3_
  
  - [ ]* 2.2 Escribir property test para cálculo de existencia inicial
    - **Property 2: Initial Stock Calculation**
    - **Validates: Requirements 2.1**
  
  - [x] 2.3 Crear función `calculatePurchases` para compras del período
    - Consulta SQL en purchase_orders y purchase_order_items
    - Filtrar por status = 'received' y fechas del período
    - Agrupar por product_id y variant_id
    - _Requirements: 3.1, 3.2, 3.3_
  
  - [ ]* 2.4 Escribir property test para filtrado de compras
    - **Property 5: Purchase Filtering**
    - **Validates: Requirements 3.2, 9.2**
  
  - [x] 2.5 Crear función `calculateSales` para ventas del período
    - Consulta SQL en sales y sale_items
    - Filtrar por status IN ('completed', 'paid') y fechas del período
    - Agrupar por product_id y variant_id
    - _Requirements: 4.1, 4.2, 4.3_
  
  - [ ]* 2.6 Escribir property test para filtrado de ventas
    - **Property 6: Sales Filtering**
    - **Validates: Requirements 4.2, 9.3**

- [x] 3. Implementar función principal de generación de reporte
  - [x] 3.1 Crear `generateInventoryReport` en `lib/actions/inventory-report.ts`
    - Orquestar llamadas a calculateInitialStock, calculatePurchases, calculateSales
    - Combinar resultados en InventoryReportRow[]
    - Calcular existencia final usando fórmula: inicial + compras - ventas
    - Aplicar filtros de categoría y producto si están presentes
    - _Requirements: 5.1, 5.3, 6.1, 7.1, 7.2_
  
  - [ ]* 3.2 Escribir property test para fórmula de existencia final
    - **Property 7: Final Stock Formula (Invariant)**
    - **Validates: Requirements 5.1**
  
  - [ ]* 3.3 Escribir property test para cálculos por variante
    - **Property 3: Variant-Level Calculations**
    - **Validates: Requirements 2.3, 3.3, 4.3, 5.3**
  
  - [ ]* 3.4 Escribir property test para completitud de datos
    - **Property 4: Data Completeness**
    - **Validates: Requirements 2.4, 3.4, 4.4, 5.4**
  
  - [ ]* 3.5 Escribir unit tests para casos edge
    - Producto sin movimientos previos (existencia inicial = 0)
    - Producto con existencia inicial pero sin movimientos en período
    - Período sin datos
    - _Requirements: 2.2, 6.2_

- [ ] 4. Checkpoint - Verificar cálculos básicos
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implementar validaciones y filtros
  - [x] 5.1 Crear función `validateDateRange` para validación de fechas
    - Validar que start_date <= end_date
    - Validar que ambas fechas estén presentes
    - Retornar mensajes de error apropiados
    - _Requirements: 1.2, 1.3_
  
  - [ ]* 5.2 Escribir property test para validación de fechas
    - **Property 1: Date Validation**
    - **Validates: Requirements 1.2, 1.3**
  
  - [x] 5.3 Implementar lógica de filtros en generateInventoryReport
    - Filtro por categoría: WHERE products.category_id = $categoryId
    - Filtro por producto: WHERE products.id = $productId
    - Mantener cálculos correctos con filtros aplicados
    - _Requirements: 7.1, 7.2, 7.3_
  
  - [ ]* 5.4 Escribir property tests para filtros
    - **Property 12: Category Filter Correctness**
    - **Property 13: Product Filter Correctness**
    - **Property 14: Filter Calculation Invariance**
    - **Validates: Requirements 7.1, 7.2, 7.3**

- [x] 6. Implementar funcionalidad de exportación
  - [x] 6.1 Crear función `exportToExcel` en `lib/actions/inventory-report.ts`
    - Generar archivo Excel usando biblioteca (ej: xlsx)
    - Incluir todas las columnas del reporte
    - Agregar fila de encabezado con metadatos (período, fecha generación)
    - Retornar Blob para descarga
    - _Requirements: 8.1, 8.2, 8.3_
  
  - [x] 6.2 Crear función `exportToCSV` en `lib/actions/inventory-report.ts`
    - Generar archivo CSV con delimitador de coma
    - Incluir todas las columnas del reporte
    - Agregar fila de encabezado con metadatos
    - Retornar Blob para descarga
    - _Requirements: 8.1, 8.2, 8.3_
  
  - [x] 6.3 Crear función `exportToPDF` en `lib/actions/inventory-report.ts`
    - Generar PDF usando biblioteca (ej: jsPDF o pdfmake)
    - Formato profesional con tabla estructurada
    - Incluir logo de la empresa si está disponible
    - Agregar encabezado con metadatos (período, fecha generación)
    - Formatear valores monetarios correctamente
    - Retornar Blob para descarga
    - _Requirements: 8.1, 8.2, 8.3, 8.4_
  
  - [x] 6.4 Crear función wrapper `exportInventoryReport`
    - Recibir parámetro format: 'excel' | 'csv' | 'pdf'
    - Llamar a la función correspondiente según el formato
    - Manejar errores específicos de cada formato
    - _Requirements: 8.1, 8.5_
  
  - [ ]* 6.5 Escribir property tests para exportación
    - **Property 15: Export Data Completeness**
    - **Property 16: Export Metadata Presence**
    - **Property 17: PDF Format Quality**
    - **Validates: Requirements 8.2, 8.3, 8.4**
  
  - [ ]* 6.6 Escribir unit tests para formatos de archivo
    - Verificar estructura de Excel
    - Verificar estructura de CSV
    - Verificar estructura de PDF
    - Verificar encabezados correctos en todos los formatos
    - _Requirements: 8.2, 8.3, 8.4_

- [x] 7. Crear componente de filtros
  - [x] 7.1 Crear `components/dashboard/inventory-report-filters.tsx`
    - Campos de fecha (DatePicker para start_date y end_date)
    - Select para filtro de categoría (cargar desde getCategories)
    - Select para filtro de producto (cargar desde getProducts)
    - Botón "Generar Reporte"
    - Dropdown "Exportar" con opciones: Excel, CSV, PDF
    - Botón "Limpiar Filtros"
    - _Requirements: 1.1, 7.1, 7.2, 7.4, 8.1_
  
  - [x] 7.2 Implementar validación de fechas en el componente
    - Deshabilitar botón "Generar Reporte" si fechas inválidas
    - Mostrar mensaje de error si start_date > end_date
    - _Requirements: 1.2, 1.3, 1.4_

- [x] 8. Crear componente de tabla de resultados
  - [x] 8.1 Crear `components/dashboard/inventory-report-table.tsx`
    - Columnas: Producto, Variante, Categoría, Existencia Inicial (unidades/valor), Compras (unidades/valor), Ventas (unidades/valor), Existencia Final (unidades/valor)
    - Formatear valores monetarios con símbolo de moneda
    - Mostrar indicador de carga mientras se genera reporte
    - Mostrar mensaje si no hay datos
    - _Requirements: 2.4, 3.4, 4.4, 5.4, 6.1, 6.3, 6.4_
  
  - [x] 8.2 Implementar ordenamiento alfabético
    - Ordenar productos por nombre
    - Ordenar variantes por nombre dentro de cada producto
    - _Requirements: 6.4_
  
  - [ ]* 8.3 Escribir property test para ordenamiento
    - **Property 11: Alphabetical Sorting**
    - **Validates: Requirements 6.4**

- [x] 9. Crear componente principal del reporte
  - [x] 9.1 Crear `components/dashboard/inventory-liquidation-report.tsx`
    - Integrar InventoryReportFilters y InventoryReportTable
    - Manejar estado: fechas, filtros, datos del reporte, loading, errores
    - Llamar a generateInventoryReport cuando usuario hace clic en "Generar Reporte"
    - Llamar a exportInventoryReport con formato seleccionado (excel/csv/pdf)
    - Mostrar indicador de carga durante exportación
    - _Requirements: 1.1, 6.1, 8.1, 8.5, 10.3_
  
  - [x] 9.2 Implementar manejo de errores
    - Mostrar mensajes de error de validación
    - Mostrar mensaje si no hay datos en el período
    - Mostrar indicador de carga durante generación
    - _Requirements: 1.3, 10.4_

- [x] 10. Crear página del reporte
  - [x] 10.1 Crear `app/dashboard/inventory-report/page.tsx`
    - Renderizar InventoryLiquidationReport
    - Obtener companyId del usuario autenticado
    - Agregar título y descripción de la página
    - _Requirements: 10.1, 10.2, 10.3_
  
  - [x] 10.2 Agregar enlace en el sidebar del dashboard
    - Agregar "Liquidación de Inventario" en sección de reportes
    - Link a /dashboard/inventory-report
    - _Requirements: 10.1, 10.2_

- [ ] 11. Checkpoint - Verificar integración completa
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 12. Implementar property tests adicionales de integridad
  - [ ]* 12.1 Escribir property test para consistencia con stock actual
    - **Property 8: Current Period Consistency**
    - **Validates: Requirements 5.2**
  
  - [ ]* 12.2 Escribir property test para inclusión completa de productos
    - **Property 9: Product Inclusion Completeness**
    - **Validates: Requirements 6.1, 6.2**
  
  - [ ]* 12.3 Escribir property test para estructura de filas por variante
    - **Property 10: Variant Row Structure**
    - **Validates: Requirements 6.3**
  
  - [ ]* 12.4 Escribir property test para prevención de duplicados
    - **Property 18: No Duplicate Movements**
    - **Validates: Requirements 9.4**

- [ ] 13. Testing final y refinamiento
  - [ ]* 13.1 Ejecutar todos los property tests (mínimo 100 iteraciones cada uno)
    - Verificar que todos los tests pasen
    - Ajustar generadores si es necesario
  
  - [ ]* 13.2 Ejecutar todos los unit tests
    - Verificar casos edge y ejemplos específicos
    - Agregar tests adicionales si se encuentran bugs
  
  - [ ] 13.3 Pruebas manuales de UI
    - Verificar flujo completo: seleccionar fechas → generar reporte → exportar
    - Probar exportación en los 3 formatos: Excel, CSV, PDF
    - Verificar que el PDF se vea profesional y sea imprimible
    - Probar filtros de categoría y producto
    - Verificar responsive design en mobile
    - _Requirements: 1.1, 7.4, 8.1, 8.4, 8.5, 10.3_

- [ ] 14. Checkpoint final - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness across randomized inputs (minimum 100 iterations)
- Unit tests validate specific examples and edge cases
- The implementation uses TypeScript with React for UI and fast-check for property-based testing
- SQL queries should be optimized with proper indexes on stock_movements, purchase_orders, and sales tables
- For PDF generation, consider using jsPDF or pdfmake libraries
- PDF should include company logo from company settings if available
- All three export formats (Excel, CSV, PDF) should contain identical data
