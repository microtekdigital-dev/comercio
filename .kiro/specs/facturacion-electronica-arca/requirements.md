# Requirements Document: Facturación Electrónica ARCA

## Introduction

Este documento especifica los requisitos para integrar el sistema de facturación electrónica ARCA (Argentina) en el ERP existente. El sistema permitirá generar comprobantes electrónicos válidos ante AFIP, obtener CAE (Código de Autorización Electrónico), y gestionar el ciclo completo de facturación electrónica incluyendo facturas, notas de crédito y débito.

## Glossary

- **ARCA**: Agencia de Recaudación y Control Aduanero (anteriormente AFIP)
- **CAE**: Código de Autorización Electrónico - código único que autoriza un comprobante
- **CUIT**: Clave Única de Identificación Tributaria
- **CUIL**: Código Único de Identificación Laboral
- **Sistema**: El módulo de facturación electrónica del ERP
- **Comprobante**: Documento fiscal (factura, nota de crédito, nota de débito)
- **Punto_de_Venta**: Número asignado por AFIP para identificar el punto de emisión
- **Certificado_Digital**: Archivo .pfx que contiene la clave privada para autenticación con ARCA
- **API_ARCA**: Interfaz de programación de ARCA para facturación electrónica
- **QR_ARCA**: Código QR generado por ARCA que contiene datos del comprobante
- **Condicion_Fiscal**: Categoría tributaria del cliente (responsable inscripto, consumidor final, monotributista, exento)
- **Alicuota_IVA**: Porcentaje de IVA aplicable (21%, 10.5%, 27%, 5%, 2.5%, 0%)
- **Ambiente**: Entorno de ejecución (testing o producción)

## Requirements

### Requirement 1: Configuración de Certificados y Credenciales

**User Story:** Como administrador del sistema, quiero configurar los certificados digitales y credenciales de ARCA, para que el sistema pueda autenticarse correctamente con la API de ARCA.

#### Acceptance Criteria

1. THE Sistema SHALL almacenar el Certificado_Digital en formato .pfx de forma segura
2. THE Sistema SHALL almacenar la clave privada del certificado de forma encriptada
3. THE Sistema SHALL almacenar el CUIT de la empresa
4. THE Sistema SHALL almacenar el número de Punto_de_Venta asignado por AFIP
5. THE Sistema SHALL permitir configurar el Ambiente (testing o producción)
6. WHEN se carga un Certificado_Digital, THE Sistema SHALL validar que el formato sea .pfx válido
7. WHEN se configura el CUIT, THE Sistema SHALL validar que tenga formato válido (11 dígitos)
8. THE Sistema SHALL permitir actualizar las credenciales sin perder datos históricos

### Requirement 2: Validación de Datos Fiscales del Cliente

**User Story:** Como usuario del sistema, quiero que se validen automáticamente los datos fiscales de los clientes, para asegurar que los comprobantes se generen correctamente.

#### Acceptance Criteria

1. WHEN se crea o edita un cliente, THE Sistema SHALL validar el formato del CUIT/CUIL
2. THE Sistema SHALL almacenar la Condicion_Fiscal del cliente
3. THE Sistema SHALL almacenar el domicilio fiscal del cliente
4. THE Sistema SHALL almacenar el tipo de documento del cliente
5. WHEN un cliente no tiene CUIT/CUIL, THE Sistema SHALL permitir usar otros tipos de documento
6. THE Sistema SHALL validar que la Condicion_Fiscal sea una opción válida
7. WHEN se intenta facturar a un cliente sin datos fiscales completos, THE Sistema SHALL mostrar error descriptivo

### Requirement 3: Generación de Facturas Electrónicas

**User Story:** Como usuario del sistema, quiero generar facturas electrónicas desde una venta, para cumplir con las obligaciones fiscales argentinas.

#### Acceptance Criteria

1. WHEN se completa una venta, THE Sistema SHALL permitir generar un Comprobante electrónico
2. THE Sistema SHALL determinar automáticamente el tipo de factura (A, B, C) según la Condicion_Fiscal del cliente
3. WHEN el cliente es responsable inscripto, THE Sistema SHALL generar Factura A
4. WHEN el cliente es consumidor final, THE Sistema SHALL generar Factura B
5. WHEN el cliente es monotributista, THE Sistema SHALL generar Factura C
6. THE Sistema SHALL incluir todos los ítems de la venta en el Comprobante
7. THE Sistema SHALL calcular correctamente las Alicuota_IVA según el tipo de factura
8. THE Sistema SHALL incluir el concepto del comprobante (productos, servicios, o productos y servicios)
9. THE Sistema SHALL generar un número de comprobante único y secuencial por Punto_de_Venta y tipo
10. WHEN una factura A incluye IVA, THE Sistema SHALL discriminar el IVA por alícuota

### Requirement 4: Comunicación con API de ARCA

**User Story:** Como sistema, quiero comunicarme con la API_ARCA para obtener autorización de comprobantes, para que las facturas sean válidas fiscalmente.

#### Acceptance Criteria

1. WHEN se genera un Comprobante, THE Sistema SHALL enviar una solicitud a la API_ARCA
2. THE Sistema SHALL autenticarse usando el Certificado_Digital configurado
3. THE Sistema SHALL incluir todos los datos fiscales requeridos en la solicitud
4. WHEN la API_ARCA responde exitosamente, THE Sistema SHALL almacenar el CAE recibido
5. WHEN la API_ARCA responde exitosamente, THE Sistema SHALL almacenar la fecha de vencimiento del CAE
6. WHEN la API_ARCA responde con error, THE Sistema SHALL almacenar el mensaje de error
7. THE Sistema SHALL implementar timeout de 30 segundos para solicitudes a la API_ARCA
8. WHEN la solicitud falla por timeout, THE Sistema SHALL registrar el error para reintento

### Requirement 5: Almacenamiento de Datos Fiscales

**User Story:** Como sistema, quiero almacenar todos los datos fiscales de los comprobantes, para mantener trazabilidad y cumplir con auditorías.

#### Acceptance Criteria

1. THE Sistema SHALL almacenar el CAE de cada Comprobante autorizado
2. THE Sistema SHALL almacenar la fecha de vencimiento del CAE
3. THE Sistema SHALL almacenar el número de comprobante asignado
4. THE Sistema SHALL almacenar el tipo de comprobante (Factura A, B, C, etc.)
5. THE Sistema SHALL almacenar la fecha de emisión del comprobante
6. THE Sistema SHALL almacenar el CUIT del cliente
7. THE Sistema SHALL almacenar los importes totales y discriminados por alícuota
8. THE Sistema SHALL vincular cada Comprobante con la venta original del ERP
9. THE Sistema SHALL almacenar el estado del comprobante (pendiente, autorizado, rechazado, anulado)

### Requirement 6: Consulta de Estado de Comprobantes

**User Story:** Como usuario del sistema, quiero consultar el estado de comprobantes en ARCA, para verificar su validez y estado actual.

#### Acceptance Criteria

1. THE Sistema SHALL permitir consultar el estado de un Comprobante en la API_ARCA
2. WHEN se consulta un comprobante, THE Sistema SHALL enviar el CAE y número de comprobante
3. WHEN la API_ARCA responde, THE Sistema SHALL mostrar el estado actual del comprobante
4. THE Sistema SHALL permitir consultar comprobantes por rango de fechas
5. THE Sistema SHALL mostrar la fecha de autorización del comprobante
6. THE Sistema SHALL mostrar si el comprobante fue anulado

### Requirement 7: Anulación de Comprobantes

**User Story:** Como usuario del sistema, quiero anular comprobantes electrónicos, para corregir errores o cancelar operaciones.

#### Acceptance Criteria

1. THE Sistema SHALL permitir anular un Comprobante autorizado
2. WHEN se anula un comprobante, THE Sistema SHALL enviar solicitud de anulación a la API_ARCA
3. WHEN la anulación es exitosa, THE Sistema SHALL actualizar el estado del comprobante a "anulado"
4. WHEN la anulación es exitosa, THE Sistema SHALL registrar la fecha y usuario que realizó la anulación
5. THE Sistema SHALL prevenir la anulación de comprobantes ya anulados
6. WHEN se intenta anular un comprobante con CAE vencido, THE Sistema SHALL mostrar advertencia
7. THE Sistema SHALL mantener el registro histórico del comprobante anulado

### Requirement 8: Generación de Notas de Crédito y Débito

**User Story:** Como usuario del sistema, quiero generar notas de crédito y débito electrónicas, para ajustar comprobantes previamente emitidos.

#### Acceptance Criteria

1. THE Sistema SHALL permitir generar notas de crédito electrónicas (tipos A, B, C)
2. THE Sistema SHALL permitir generar notas de débito electrónicas (tipos A, B, C)
3. WHEN se genera una nota de crédito/débito, THE Sistema SHALL requerir el comprobante original asociado
4. THE Sistema SHALL validar que el tipo de nota coincida con el tipo del comprobante original
5. WHEN se genera una nota de crédito, THE Sistema SHALL permitir crédito parcial o total
6. THE Sistema SHALL obtener CAE para notas de crédito y débito igual que para facturas
7. THE Sistema SHALL almacenar la referencia al comprobante original en la nota

### Requirement 9: Generación de PDF con QR

**User Story:** Como usuario del sistema, quiero generar PDFs de comprobantes con el código QR de ARCA, para entregar a los clientes.

#### Acceptance Criteria

1. WHEN un Comprobante es autorizado, THE Sistema SHALL generar un PDF del comprobante
2. THE Sistema SHALL incluir el QR_ARCA en el PDF generado
3. THE Sistema SHALL incluir el CAE en el PDF
4. THE Sistema SHALL incluir la fecha de vencimiento del CAE en el PDF
5. THE Sistema SHALL incluir todos los datos fiscales requeridos por ARCA en el PDF
6. THE Sistema SHALL formatear el PDF según las especificaciones de ARCA
7. THE Sistema SHALL permitir descargar el PDF generado
8. THE Sistema SHALL permitir reimprimir PDFs de comprobantes históricos

### Requirement 10: Sincronización Automática

**User Story:** Como sistema, quiero sincronizar automáticamente con ARCA, para mantener actualizado el estado de los comprobantes.

#### Acceptance Criteria

1. THE Sistema SHALL verificar periódicamente el estado de comprobantes pendientes
2. WHEN un comprobante está en estado "pendiente" por más de 5 minutos, THE Sistema SHALL consultar su estado en ARCA
3. THE Sistema SHALL actualizar automáticamente el estado de comprobantes según respuesta de ARCA
4. THE Sistema SHALL registrar cada sincronización en el log de auditoría
5. WHEN la sincronización falla, THE Sistema SHALL reintentar con backoff exponencial
6. THE Sistema SHALL limitar los reintentos a un máximo de 5 intentos

### Requirement 11: Manejo de Errores y Reintentos

**User Story:** Como sistema, quiero manejar errores de comunicación con ARCA de forma robusta, para asegurar que no se pierdan comprobantes.

#### Acceptance Criteria

1. WHEN la API_ARCA no responde, THE Sistema SHALL marcar el comprobante como "pendiente de reintento"
2. THE Sistema SHALL implementar reintentos automáticos con backoff exponencial
3. WHEN un comprobante falla después de todos los reintentos, THE Sistema SHALL notificar al usuario
4. THE Sistema SHALL permitir reintento manual de comprobantes fallidos
5. WHEN hay error de validación de datos, THE Sistema SHALL mostrar mensaje descriptivo del error
6. THE Sistema SHALL registrar todos los errores en el log de auditoría
7. WHEN la API_ARCA devuelve error de certificado, THE Sistema SHALL notificar al administrador
8. THE Sistema SHALL continuar operando en modo degradado si ARCA no está disponible

### Requirement 12: Logs de Auditoría

**User Story:** Como administrador del sistema, quiero tener logs completos de todas las operaciones fiscales, para auditorías y resolución de problemas.

#### Acceptance Criteria

1. THE Sistema SHALL registrar cada solicitud enviada a la API_ARCA
2. THE Sistema SHALL registrar cada respuesta recibida de la API_ARCA
3. THE Sistema SHALL registrar el usuario que generó cada comprobante
4. THE Sistema SHALL registrar la fecha y hora de cada operación
5. THE Sistema SHALL registrar todos los errores y excepciones
6. THE Sistema SHALL registrar cambios en la configuración de certificados
7. THE Sistema SHALL permitir consultar logs por rango de fechas
8. THE Sistema SHALL permitir filtrar logs por tipo de operación
9. THE Sistema SHALL mantener logs por al menos 5 años

### Requirement 13: Reportes de Facturación Electrónica

**User Story:** Como usuario del sistema, quiero generar reportes de facturación electrónica, para análisis y control fiscal.

#### Acceptance Criteria

1. THE Sistema SHALL generar reporte de comprobantes emitidos por período
2. THE Sistema SHALL generar reporte de comprobantes por tipo (A, B, C)
3. THE Sistema SHALL generar reporte de comprobantes anulados
4. THE Sistema SHALL generar reporte de errores y reintentos
5. THE Sistema SHALL permitir exportar reportes a PDF y Excel
6. THE Sistema SHALL incluir totales por alícuota de IVA en los reportes
7. THE Sistema SHALL permitir filtrar reportes por Punto_de_Venta
8. THE Sistema SHALL mostrar estadísticas de tasa de éxito de autorización

### Requirement 14: Validación de Numeración Secuencial

**User Story:** Como sistema, quiero validar que la numeración de comprobantes sea secuencial, para cumplir con requisitos fiscales.

#### Acceptance Criteria

1. THE Sistema SHALL asignar números de comprobante de forma secuencial por tipo y Punto_de_Venta
2. WHEN se genera un comprobante, THE Sistema SHALL verificar que no existan saltos en la numeración
3. THE Sistema SHALL prevenir la generación de comprobantes con números duplicados
4. WHEN se detecta un salto en la numeración, THE Sistema SHALL alertar al usuario
5. THE Sistema SHALL mantener contadores independientes por cada tipo de comprobante
6. THE Sistema SHALL mantener contadores independientes por cada Punto_de_Venta

### Requirement 15: Soporte Multimoneda en Facturación

**User Story:** Como usuario del sistema, quiero emitir comprobantes en diferentes monedas, para ventas en moneda extranjera.

#### Acceptance Criteria

1. THE Sistema SHALL permitir emitir comprobantes en pesos argentinos (ARS)
2. THE Sistema SHALL permitir emitir comprobantes en dólares estadounidenses (USD)
3. WHEN se emite un comprobante en moneda extranjera, THE Sistema SHALL incluir el tipo de cambio
4. THE Sistema SHALL enviar el código de moneda correcto a la API_ARCA
5. THE Sistema SHALL convertir importes a la moneda del comprobante
6. THE Sistema SHALL mostrar la moneda claramente en el PDF generado
