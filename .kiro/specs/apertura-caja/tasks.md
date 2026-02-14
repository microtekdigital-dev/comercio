# Implementation Plan: Apertura de Caja

## Overview

Este plan implementa la funcionalidad de "Apertura de Caja" integrándose con el sistema existente de cierre de caja. La implementación se realizará en pasos incrementales, comenzando con la capa de base de datos, luego las acciones del servidor, y finalmente la interfaz de usuario.

## Tasks

- [x] 1. Crear esquema de base de datos para aperturas
  - Crear script SQL `scripts/140_create_cash_register_openings.sql`
  - Definir tabla `cash_register_openings` con todos los campos requeridos
  - Crear índices: company_id, (company_id, opening_date, shift), created_at
  - Configurar RLS policies para SELECT, INSERT, UPDATE, DELETE
  - Agregar trigger para updated_at
  - Agregar comentarios a tabla y columnas
  - _Requirements: 1.1, 1.2, 1.3, 5.1, 5.2, 5.3, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

- [x] 2. Agregar tipos TypeScript para aperturas
  - Agregar interfaces en `lib/types/erp.ts`:
    - `CashRegisterOpening`
    - `CashRegisterOpeningFormData`
  - Modificar `CashRegisterClosureFormData` para incluir `opening_id` opcional
  - _Requirements: 1.1_

- [x] 3. Implementar acciones del servidor para aperturas
  - [x] 3.1 Implementar `getCashRegisterOpenings()` en `lib/actions/cash-register.ts`
    - Obtener company_id del usuario autenticado
    - Consultar aperturas de la empresa
    - Aplicar filtros opcionales: dateFrom, dateTo, shift
    - Ordenar por created_at DESC
    - Manejar errores y retornar array vacío en caso de fallo
    - _Requirements: 4.1, 4.2, 4.3, 4.5, 4.6_

  - [ ]* 3.2 Escribir property test para getCashRegisterOpenings()
    - **Property 12: Aislamiento de datos por empresa**
    - **Property 13: Campos completos en listado**
    - **Property 14: Orden descendente por fecha**
    - **Property 15: Filtrado por rango de fechas**
    - **Property 16: Filtrado por turno**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.5, 4.6**

  - [x] 3.3 Implementar `getCashRegisterOpening()` en `lib/actions/cash-register.ts`
    - Obtener company_id del usuario autenticado
    - Consultar apertura específica por ID
    - Verificar que pertenezca a la empresa del usuario
    - Retornar null si no existe o no pertenece a la empresa
    - _Requirements: 5.2_

  - [x] 3.4 Implementar `createCashRegisterOpening()` en `lib/actions/cash-register.ts`
    - Validar que el usuario esté autenticado
    - Obtener company_id, full_name y email del perfil del usuario
    - Validar que initial_cash_amount > 0
    - Validar que shift esté en lista válida
    - Insertar registro en cash_register_openings
    - Revalidar path `/dashboard/cash-register`
    - Retornar data o error
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 5.3, 5.5_

  - [ ]* 3.5 Escribir property tests para createCashRegisterOpening()
    - **Property 1: Apertura completa con campos requeridos**
    - **Property 2: Registro automático de timestamps**
    - **Property 3: Asociación automática de company_id**
    - **Property 4: Registro de usuario que abre**
    - **Property 5: Validación de monto positivo**
    - **Property 6: Almacenamiento de turnos válidos**
    - **Property 7: Almacenamiento opcional de notas**
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7**

  - [x] 3.6 Implementar `deleteCashRegisterOpening()` en `lib/actions/cash-register.ts`
    - Validar autenticación
    - Obtener company_id del usuario
    - Eliminar apertura verificando que pertenezca a la empresa
    - Revalidar path `/dashboard/cash-register`
    - Retornar success o error
    - _Requirements: 5.2_

  - [x] 3.7 Implementar `findOpeningForClosure()` en `lib/actions/cash-register.ts`
    - Buscar apertura con mismo company_id, fecha y turno
    - Retornar apertura encontrada o null
    - _Requirements: 2.1, 8.1_

  - [ ]* 3.8 Escribir property test para findOpeningForClosure()
    - **Property 8: Búsqueda de apertura correspondiente**
    - **Validates: Requirements 2.1, 8.1**

- [ ] 4. Checkpoint - Verificar acciones del servidor
  - Asegurar que todas las funciones de apertura funcionen correctamente
  - Verificar que los tests pasen
  - Preguntar al usuario si hay dudas o ajustes necesarios

- [x] 5. Modificar función de cierre para integrar aperturas
  - [x] 5.1 Agregar columna `opening_id` a tabla `cash_register_closures`
    - Crear migration SQL para agregar columna UUID nullable
    - Agregar foreign key a cash_register_openings(id)
    - _Requirements: 8.3_

  - [x] 5.2 Modificar `createCashRegisterClosure()` en `lib/actions/cash-register.ts`
    - Llamar a `findOpeningForClosure()` antes de calcular totales
    - Si existe apertura:
      - Calcular cash_difference = cash_counted - (cash_sales + initial_cash_amount)
      - Guardar opening_id en el cierre
    - Si no existe apertura:
      - Calcular cash_difference = cash_counted - cash_sales (comportamiento actual)
      - Dejar opening_id como null
      - Incluir advertencia en respuesta
    - Mantener compatibilidad con cierres sin apertura
    - _Requirements: 2.1, 2.5, 3.1, 3.2, 3.3, 8.1, 8.3_

  - [ ]* 5.3 Escribir property tests para cálculo de diferencia
    - **Property 9: Creación de cierre sin apertura**
    - **Property 10: Cálculo de diferencia con apertura**
    - **Property 11: Cálculo de diferencia sin apertura**
    - **Property 18: Compatibilidad con cierres antiguos**
    - **Validates: Requirements 2.5, 3.1, 3.2, 3.3, 8.3**

- [x] 6. Crear página de formulario para nueva apertura
  - Crear archivo `app/dashboard/cash-register/opening/new/page.tsx`
  - Implementar formulario con campos:
    - Fecha de apertura (pre-llenada con fecha actual)
    - Selector de turno (Mañana, Tarde, Noche)
    - Campo numérico para monto inicial
    - Campo de texto para notas opcionales
  - Validar monto inicial > 0 en el cliente
  - Llamar a `createCashRegisterOpening()` al enviar
  - Mostrar toast de éxito o error
  - Redirigir a `/dashboard/cash-register` después de crear
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

- [ ]* 6.1 Escribir unit tests para formulario de apertura
  - Verificar que fecha se pre-llene con fecha actual
  - Verificar validación de monto positivo
  - Verificar opciones de selector de turno
  - _Requirements: 7.2, 7.3, 7.4_

- [x] 7. Actualizar página principal de caja registradora
  - [x] 7.1 Modificar `app/dashboard/cash-register/page.tsx`
    - Agregar llamada a `getCashRegisterOpenings()` para obtener aperturas
    - Agregar sección "Aperturas Recientes" mostrando últimas 5 aperturas
    - Agregar botón "Nueva Apertura" que redirija a `/dashboard/cash-register/opening/new`
    - Mostrar para cada apertura: fecha, turno, usuario, monto inicial
    - Mantener sección existente de "Cierres de Caja"
    - _Requirements: 4.1, 4.2, 8.4_

  - [x] 7.2 Agregar indicadores visuales
    - Mostrar badge o indicador cuando una apertura no tiene cierre correspondiente
    - Usar iconos para diferenciar aperturas de cierres
    - _Requirements: 8.4_

- [x] 8. Modificar página de nuevo cierre para mostrar advertencias
  - Modificar `app/dashboard/cash-register/new/page.tsx`
  - Al cargar, llamar a `findOpeningForClosure()` con fecha y turno seleccionados
  - Si no existe apertura:
    - Mostrar advertencia: "No se encontró apertura para esta fecha y turno"
    - Informar que el cálculo no incluirá monto inicial
  - Si existe apertura:
    - Mostrar información de la apertura en el resumen
    - Mostrar monto inicial en el cálculo de diferencia
  - Actualizar cálculo de preview para incluir monto inicial cuando aplique
  - _Requirements: 2.2, 2.3, 3.4, 8.2_

- [ ] 9. Checkpoint final - Verificar integración completa
  - Ejecutar todos los tests
  - Verificar flujo completo: crear apertura → crear cierre → verificar cálculo
  - Verificar que cierres antiguos sin apertura sigan funcionando
  - Verificar que RLS funcione correctamente
  - Preguntar al usuario si hay ajustes finales necesarios

- [ ]* 10. Escribir integration tests
  - Test de flujo completo: apertura → cierre con cálculo correcto
  - Test de cierre sin apertura con advertencia
  - Test de RLS: empresas no ven datos de otras empresas
  - Test de compatibilidad con cierres antiguos
  - _Requirements: 2.1, 3.1, 3.3, 5.2, 8.3_

## Notes

- Las tareas marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido
- Cada tarea referencia los requirements específicos que implementa
- Los checkpoints permiten validación incremental y ajustes tempranos
- Los property tests validan propiedades universales de correctness
- Los unit tests validan ejemplos específicos y casos edge
- La implementación mantiene compatibilidad con el sistema existente de cierre de caja
