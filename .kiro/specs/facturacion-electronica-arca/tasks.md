# Implementation Plan: Facturación Electrónica ARCA

## Overview

Este plan implementa el módulo de facturación electrónica ARCA para Argentina en el ERP existente. La implementación sigue una arquitectura en capas con separación clara entre lógica de negocio, integración con ARCA, y persistencia de datos. Se incluye manejo robusto de errores, reintentos automáticos, y property-based testing para garantizar correctitud.

## Tasks

- [x] 1. Configurar infraestructura base y dependencias
  - Instalar dependencias: fast-check para property testing, biblioteca de encriptación (crypto), cliente HTTP (axios)
  - Crear estructura de carpetas: lib/actions/arca/, lib/types/arca.ts, components/dashboard/arca/
  - Configurar variables de entorno para ARCA (URL API testing/producción)
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 2. Implementar modelos de datos y migraciones SQL
  - [x] 2.1 Crear script de migración con tablas de ARCA
    - Crear scripts/220_create_arca_tables.sql con todas las tablas del diseño
    - Incluir: arca_configurations, arca_certificates, electronic_invoices, electronic_invoice_items, electronic_invoice_vat_breakdown, arca_audit_logs, arca_retry_queue, arca_sequences
    - Agregar índices para optimización de consultas
    - Configurar RLS policies para multi-tenancy
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9_
  
  - [x] 2.2 Crear tipos TypeScript para modelos de datos
    - Crear lib/types/arca.ts con todas las interfaces y enums del diseño
    - Incluir: ElectronicInvoice, InvoiceType, InvoiceStatus, FiscalCondition, VATRate, ARCAConfig, etc.
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_


- [x] 3. Implementar Configuration Manager
  - [x] 3.1 Crear lib/actions/arca/configuration.ts
    - Implementar saveCertificate() con encriptación AES-256
    - Implementar getCertificate() con desencriptación
    - Implementar saveARCAConfig() y getARCAConfig()
    - Implementar validateCertificate() para validar formato .pfx
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8_
  
  - [ ]* 3.2 Escribir property test para configuración round-trip
    - **Property 1: Configuración Round-Trip**
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.8**
  
  - [ ]* 3.3 Escribir property test para validación de CUIT
    - **Property 2: Validación de Formato CUIT/CUIL**
    - **Validates: Requirements 1.7, 2.1**
  
  - [ ]* 3.4 Escribir property test para validación de certificado
    - **Property 3: Validación de Certificado Digital**
    - **Validates: Requirements 1.6**

- [x] 4. Implementar Sequence Manager
  - [x] 4.1 Crear lib/actions/arca/sequences.ts
    - Implementar getNextNumber() con manejo de concurrencia
    - Implementar validateSequence() para detectar saltos
    - Implementar syncWithARCA() para sincronizar numeración
    - Usar transacciones SQL para prevenir race conditions
    - _Requirements: 3.9, 14.1, 14.2, 14.3, 14.4, 14.5, 14.6_
  
  - [ ]* 4.2 Escribir property test para numeración secuencial
    - **Property 7: Numeración Secuencial Única**
    - **Validates: Requirements 3.9, 14.1, 14.2, 14.3**
  
  - [ ]* 4.3 Escribir property test para independencia de contadores
    - **Property 19: Independencia de Contadores**
    - **Validates: Requirements 14.5, 14.6**

- [x] 5. Implementar Invoice Generator
  - [x] 5.1 Crear lib/actions/arca/invoice-generator.ts
    - Implementar determineInvoiceType() según condición fiscal
    - Implementar calculateVATByRate() para calcular IVA por alícuota
    - Implementar generateInvoiceFromSale() para crear comprobante desde venta
    - Implementar generateCreditNote() y generateDebitNote()
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.10, 8.1, 8.2, 8.3, 8.4, 8.5_
  
  - [ ]* 5.2 Escribir property test para determinación de tipo de factura
    - **Property 4: Determinación de Tipo de Factura**
    - **Validates: Requirements 3.2, 3.3, 3.4, 3.5**
  
  - [ ]* 5.3 Escribir property test para inclusión completa de ítems
    - **Property 5: Inclusión Completa de Ítems**
    - **Validates: Requirements 3.6**
  
  - [ ]* 5.4 Escribir property test para cálculo de IVA
    - **Property 6: Cálculo Correcto de IVA**
    - **Validates: Requirements 3.7**
  
  - [ ]* 5.5 Escribir property test para desglose de IVA en Factura A
    - **Property 8: Desglose de IVA en Factura A**
    - **Validates: Requirements 3.10**
  
  - [ ]* 5.6 Escribir property test para coincidencia de tipo en notas
    - **Property 13: Coincidencia de Tipo en Notas**
    - **Validates: Requirements 8.4**

- [ ] 6. Checkpoint - Validar generación de comprobantes
  - Ejecutar tests de propiedades para generación de facturas
  - Verificar que se generan correctamente facturas A, B, C
  - Verificar cálculos de IVA y totales
  - Preguntar al usuario si hay dudas o ajustes necesarios

- [x] 7. Implementar ARCA API Client
  - [x] 7.1 Crear lib/actions/arca/api-client.ts
    - Implementar authenticate() con certificado digital
    - Implementar requestCAE() para solicitar autorización
    - Implementar queryInvoiceStatus() para consultar estado
    - Implementar cancelInvoice() para anular comprobantes
    - Implementar getLastAuthorizedNumber() para sincronizar numeración
    - Configurar timeout de 30 segundos
    - Manejar errores de red y timeouts
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 6.1, 6.2, 6.3, 7.2_
  
  - [ ]* 7.2 Escribir unit tests para manejo de errores de API
    - Test: timeout después de 30 segundos
    - Test: error de red
    - Test: respuesta exitosa con CAE
    - Test: respuesta con error de validación
    - _Requirements: 4.7, 4.8_

- [x] 8. Implementar Retry Manager
  - [x] 8.1 Crear lib/actions/arca/retry-manager.ts
    - Implementar scheduleRetry() para programar reintentos
    - Implementar processRetries() para procesar cola de reintentos
    - Implementar calculateNextRetry() con backoff exponencial (1s, 2s, 4s, 8s, 16s)
    - Implementar cancelRetries() para cancelar reintentos pendientes
    - Limitar a máximo 5 intentos
    - _Requirements: 10.5, 10.6, 11.1, 11.2, 11.3, 11.4_
  
  - [ ]* 8.2 Escribir property test para backoff exponencial
    - **Property 16: Backoff Exponencial en Reintentos**
    - **Validates: Requirements 10.5, 11.2**
  
  - [ ]* 8.3 Escribir property test para límite de reintentos
    - **Property 17: Límite de Reintentos**
    - **Validates: Requirements 10.6**

- [x] 9. Implementar Invoice Processor
  - [x] 9.1 Crear lib/actions/arca/invoice-processor.ts
    - Implementar processInvoice() para enviar a ARCA y obtener CAE
    - Implementar retryInvoice() para reintentar facturas fallidas
    - Implementar cancelInvoice() para anular comprobantes
    - Implementar syncInvoiceStatus() para sincronizar estado con ARCA
    - Integrar con Retry Manager para reintentos automáticos
    - Implementar máquina de estados (DRAFT → PENDING → AUTHORIZED/REJECTED → CANCELLED)
    - _Requirements: 4.1, 4.4, 4.5, 4.6, 6.1, 6.3, 7.1, 7.2, 7.3, 7.4, 10.2, 10.3, 11.1_
  
  - [ ]* 9.2 Escribir property test para persistencia de datos fiscales
    - **Property 9: Persistencia de Datos Fiscales**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.9**
  
  - [ ]* 9.3 Escribir property test para vinculación con venta
    - **Property 10: Vinculación con Venta Original**
    - **Validates: Requirements 5.8**
  
  - [ ]* 9.4 Escribir property test para actualización de estado
    - **Property 23: Actualización de Estado por Sincronización**
    - **Validates: Requirements 10.3**

- [x] 10. Implementar Audit Logger
  - [x] 10.1 Crear lib/actions/arca/audit-logger.ts
    - Implementar logOperation() para registrar operaciones
    - Implementar queryLogs() para consultar logs con filtros
    - Implementar exportLogs() para exportar a PDF/Excel/CSV
    - Registrar todas las operaciones: CREATE, UPDATE, AUTHORIZE, CANCEL, QUERY, SYNC, RETRY
    - Incluir timestamp, usuario, tipo de operación, entidad, detalles, éxito/error
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8_
  
  - [ ]* 10.2 Escribir property test para registro completo de auditoría
    - **Property 18: Registro Completo de Auditoría**
    - **Validates: Requirements 12.1, 12.2, 12.3, 12.4, 12.5, 12.6**
  
  - [ ]* 10.3 Escribir property test para registro de sincronización
    - **Property 24: Registro de Sincronización**
    - **Validates: Requirements 10.4**

- [ ] 11. Checkpoint - Validar integración con ARCA
  - Ejecutar tests de integración con ambiente de testing de ARCA
  - Verificar flujo completo: autenticación → solicitud CAE → almacenamiento
  - Verificar manejo de errores y reintentos
  - Verificar logs de auditoría
  - Preguntar al usuario si hay dudas o ajustes necesarios

- [x] 12. Implementar PDF Generator
  - [x] 12.1 Crear lib/actions/arca/pdf-generator.ts
    - Implementar generateInvoicePDF() para generar PDF de comprobante
    - Implementar embedQRCode() para incluir código QR de ARCA
    - Implementar formatARCACompliant() para formatear según especificaciones
    - Incluir: CAE, fecha vencimiento CAE, QR, datos fiscales, ítems, totales
    - Usar biblioteca de generación de PDF (pdf-lib o similar)
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.7, 9.8_
  
  - [ ]* 12.2 Escribir property test para generación de PDF con datos completos
    - **Property 15: Generación de PDF con Datos Completos**
    - **Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5**

- [x] 13. Implementar Report Generator
  - [x] 13.1 Crear lib/actions/arca/report-generator.ts
    - Implementar generateIssuedInvoicesReport() para reporte de comprobantes emitidos
    - Implementar generateByTypeReport() para reporte por tipo de comprobante
    - Implementar generateCancelledReport() para reporte de anulados
    - Implementar generateErrorReport() para reporte de errores
    - Implementar exportReport() para exportar a PDF/Excel
    - Incluir desglose de IVA por alícuota en reportes
    - Calcular tasa de éxito de autorización
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7, 13.8_
  
  - [ ]* 13.2 Escribir property test para contenido de reportes
    - **Property 27: Contenido de Reportes**
    - **Validates: Requirements 13.1**
  
  - [ ]* 13.3 Escribir property test para desglose de IVA en reportes
    - **Property 28: Desglose de IVA en Reportes**
    - **Validates: Requirements 13.6**

- [ ] 14. Implementar componentes UI - Configuración
  - [x] 14.1 Crear components/dashboard/arca/arca-configuration.tsx
    - Formulario para cargar certificado digital (.pfx)
    - Campos para CUIT, punto de venta, ambiente (testing/producción)
    - Validación de formato de CUIT (11 dígitos)
    - Validación de certificado digital
    - Mostrar fecha de vencimiento del certificado
    - Botón para guardar configuración
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8_

- [ ] 15. Implementar componentes UI - Generación de Facturas
  - [x] 15.1 Crear components/dashboard/arca/generate-invoice-modal.tsx
    - Modal para generar factura desde venta
    - Mostrar tipo de factura determinado automáticamente
    - Mostrar datos fiscales del cliente
    - Mostrar ítems y totales
    - Botón para generar y enviar a ARCA
    - Mostrar estado del proceso (pendiente, autorizado, rechazado)
    - Mostrar CAE cuando sea autorizado
    - _Requirements: 3.1, 3.2, 3.6, 3.7, 4.1, 4.4_
  
  - [x] 15.2 Crear components/dashboard/arca/invoice-status-badge.tsx
    - Badge para mostrar estado del comprobante
    - Colores: gris (draft), amarillo (pending), verde (authorized), rojo (rejected), negro (cancelled)
    - _Requirements: 5.9_

- [ ] 16. Implementar componentes UI - Listado de Facturas
  - [x] 16.1 Crear app/dashboard/arca/invoices/page.tsx
    - Tabla con listado de facturas electrónicas
    - Columnas: número, tipo, fecha, cliente, total, CAE, estado
    - Filtros: rango de fechas, tipo de factura, estado, punto de venta
    - Acciones: ver detalle, descargar PDF, anular, reintentar (si falló)
    - Paginación
    - _Requirements: 6.1, 6.4, 7.1, 9.7, 9.8, 11.4_
  
  - [x] 16.2 Crear app/dashboard/arca/invoices/[id]/page.tsx
    - Página de detalle de factura
    - Mostrar todos los datos fiscales
    - Mostrar ítems con desglose de IVA
    - Mostrar CAE y fecha de vencimiento
    - Mostrar código QR
    - Botón para descargar PDF
    - Botón para anular (si está autorizado)
    - Historial de reintentos (si los hubo)
    - _Requirements: 6.1, 6.3, 6.5, 6.6, 7.1, 9.7_

- [ ] 17. Implementar componentes UI - Notas de Crédito/Débito
  - [ ] 17.1 Crear components/dashboard/arca/generate-credit-note-modal.tsx
    - Modal para generar nota de crédito desde factura original
    - Seleccionar factura original
    - Validar que tipo de nota coincida con tipo de factura
    - Permitir monto parcial o total
    - Campo para motivo de la nota
    - _Requirements: 8.1, 8.3, 8.4, 8.5, 8.7_
  
  - [ ] 17.2 Crear components/dashboard/arca/generate-debit-note-modal.tsx
    - Modal para generar nota de débito desde factura original
    - Similar a nota de crédito pero para débitos
    - _Requirements: 8.2, 8.3, 8.4, 8.7_

- [ ] 18. Implementar componentes UI - Reportes
  - [ ] 18.1 Crear app/dashboard/arca/reports/page.tsx
    - Selector de tipo de reporte (emitidos, por tipo, anulados, errores)
    - Filtros: rango de fechas, tipo de factura, punto de venta
    - Botones para exportar a PDF y Excel
    - Visualización de reporte con tablas y gráficos
    - Mostrar desglose de IVA por alícuota
    - Mostrar tasa de éxito de autorización
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7, 13.8_

- [ ] 19. Implementar componentes UI - Logs de Auditoría
  - [ ] 19.1 Crear app/dashboard/arca/audit-logs/page.tsx
    - Tabla con logs de auditoría
    - Columnas: fecha/hora, usuario, operación, entidad, resultado
    - Filtros: rango de fechas, tipo de operación, usuario
    - Expandir fila para ver detalles completos
    - Botón para exportar logs
    - _Requirements: 12.7, 12.8_

- [x] 20. Implementar validaciones de datos fiscales en clientes
  - [x] 20.1 Actualizar lib/actions/customers.ts
    - Agregar validación de CUIT/CUIL en createCustomer() y updateCustomer()
    - Agregar campos: condición fiscal, domicilio fiscal, tipo de documento
    - Validar que condición fiscal sea una opción válida
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_
  
  - [x] 20.2 Actualizar components/dashboard/new-customer-modal.tsx
    - Agregar campos fiscales: CUIT/CUIL, condición fiscal, domicilio fiscal
    - Validación en tiempo real de formato de CUIT
    - Selector de condición fiscal
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.6_
  
  - [ ]* 20.3 Escribir property test para validación de datos fiscales completos
    - **Property 22: Validación de Datos Fiscales Completos**
    - **Validates: Requirements 2.7**

- [x] 21. Implementar integración con módulo de ventas
  - [x] 21.1 Actualizar app/dashboard/sales/[id]/page.tsx
    - Agregar botón "Generar Factura Electrónica" en detalle de venta
    - Mostrar si la venta ya tiene factura electrónica asociada
    - Mostrar CAE y estado de la factura si existe
    - Link para ver detalle de factura electrónica
    - _Requirements: 3.1, 5.8_
  
  - [x] 21.2 Actualizar lib/actions/sales.ts
    - Agregar función para verificar si venta tiene factura electrónica
    - Agregar función para obtener factura electrónica de una venta
    - _Requirements: 5.8_

- [x] 22. Implementar manejo de errores y modo degradado
  - [x] 22.1 Crear lib/actions/arca/error-handler.ts
    - Implementar categorización de errores (validation, communication, authorization, business, system)
    - Implementar circuit breaker para prevenir sobrecarga cuando ARCA está caído
    - Implementar modo degradado: permitir ventas aunque ARCA no esté disponible
    - Generar mensajes de error descriptivos y accionables
    - _Requirements: 11.5, 11.6, 11.7, 11.8_
  
  - [ ]* 22.2 Escribir property test para modo degradado
    - **Property 26: Modo Degradado Operacional**
    - **Validates: Requirements 11.8**
  
  - [ ]* 22.3 Escribir unit tests para manejo de errores
    - Test: error de validación muestra mensaje descriptivo
    - Test: error de certificado notifica al administrador
    - Test: circuit breaker abre después de 5 fallos consecutivos
    - _Requirements: 11.5, 11.7_

- [ ] 23. Implementar soporte multimoneda
  - [ ] 23.1 Actualizar lib/actions/arca/invoice-generator.ts
    - Agregar soporte para monedas ARS y USD
    - Incluir tipo de cambio en comprobantes en moneda extranjera
    - Convertir importes a la moneda del comprobante
    - Validar que tipo de cambio sea mayor a cero para moneda extranjera
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_
  
  - [ ]* 23.2 Escribir property test para conversión de moneda
    - **Property 20: Conversión de Moneda Consistente**
    - **Validates: Requirements 15.3, 15.5**
  
  - [ ]* 23.3 Escribir property test para inclusión de tipo de cambio
    - **Property 21: Inclusión de Tipo de Cambio**
    - **Validates: Requirements 15.3**
  
  - [ ] 23.4 Actualizar components/dashboard/arca/generate-invoice-modal.tsx
    - Mostrar moneda del comprobante
    - Mostrar tipo de cambio si es moneda extranjera
    - _Requirements: 15.6_

- [ ] 24. Implementar job de sincronización automática
  - [ ] 24.1 Crear lib/jobs/arca-sync-job.ts
    - Job que se ejecuta cada 5 minutos
    - Consultar comprobantes en estado "pendiente" por más de 5 minutos
    - Sincronizar estado con ARCA
    - Procesar cola de reintentos
    - Registrar cada sincronización en logs de auditoría
    - _Requirements: 10.1, 10.2, 10.3, 10.4_
  
  - [ ] 24.2 Configurar cron job o scheduled task
    - Configurar ejecución periódica del job
    - Manejar errores y reintentos del job mismo
    - _Requirements: 10.1_

- [ ] 25. Implementar prevención de anulación duplicada
  - [ ] 25.1 Actualizar lib/actions/arca/invoice-processor.ts
    - Validar que comprobante no esté ya anulado antes de anular
    - Mostrar advertencia si CAE está vencido
    - Registrar fecha, usuario y motivo de anulación
    - Mantener datos históricos del comprobante anulado
    - _Requirements: 7.5, 7.6, 7.7_
  
  - [ ]* 25.2 Escribir property test para prevención de anulación duplicada
    - **Property 11: Prevención de Anulación Duplicada**
    - **Validates: Requirements 7.5**
  
  - [ ]* 25.3 Escribir property test para preservación de datos históricos
    - **Property 12: Preservación de Datos Históricos**
    - **Validates: Requirements 7.7**

- [ ] 26. Implementar referencia a comprobante original en notas
  - [ ] 26.1 Actualizar lib/actions/arca/invoice-generator.ts
    - Almacenar referencia al comprobante original en notas de crédito/débito
    - Validar que comprobante original exista y esté autorizado
    - _Requirements: 8.3, 8.7_
  
  - [ ]* 26.2 Escribir property test para referencia a comprobante original
    - **Property 14: Referencia a Comprobante Original**
    - **Validates: Requirements 8.7**

- [ ] 27. Implementar notificación después de reintentos agotados
  - [ ] 27.1 Actualizar lib/actions/arca/retry-manager.ts
    - Generar notificación al usuario cuando se agotan los 5 reintentos
    - Registrar notificación en sistema de notificaciones del ERP
    - _Requirements: 11.3_
  
  - [ ]* 27.2 Escribir property test para notificación
    - **Property 25: Notificación Después de Reintentos Agotados**
    - **Validates: Requirements 11.3**

- [ ] 28. Checkpoint final - Pruebas de integración completas
  - Ejecutar todas las property tests (mínimo 100 iteraciones cada una)
  - Ejecutar todas las unit tests
  - Probar flujo completo end-to-end: venta → factura → CAE → PDF
  - Probar flujo de errores: fallo → reintento → éxito
  - Probar flujo de anulación: factura autorizada → anular → verificar estado
  - Probar generación de notas de crédito y débito
  - Verificar reportes y logs de auditoría
  - Verificar que todos los tests pasan
  - Preguntar al usuario si hay dudas o ajustes finales

- [ ] 29. Documentación y guía de uso
  - [ ] 29.1 Crear documentación de configuración inicial
    - Guía para obtener certificado digital de AFIP
    - Guía para configurar punto de venta en AFIP
    - Guía para configurar el módulo en el ERP
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  
  - [ ] 29.2 Crear documentación de uso
    - Guía para generar facturas electrónicas
    - Guía para anular comprobantes
    - Guía para generar notas de crédito/débito
    - Guía para consultar reportes
    - Guía para resolver errores comunes
    - _Requirements: 3.1, 7.1, 8.1, 8.2, 13.1_

## Notes

- Las tareas marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido
- Cada tarea referencia los requisitos específicos que implementa
- Los checkpoints aseguran validación incremental del progreso
- Las property tests validan propiedades universales de correctitud
- Las unit tests validan casos específicos y condiciones de borde
- La implementación sigue el diseño de arquitectura en capas
- Se recomienda usar ambiente de testing de ARCA durante desarrollo
- El módulo se integra con el ERP existente sin modificar funcionalidad core
