# Plan de Implementación: Registro Rápido de Pagos

## Resumen

Este plan desglosa la implementación del modal de registro rápido de pagos en tareas incrementales. Cada tarea construye sobre las anteriores y termina con la integración completa del sistema.

## Tareas

- [-] 1. Crear componente QuickPaymentModal
  - Crear archivo `components/dashboard/quick-payment-modal.tsx`
  - Implementar estructura básica del componente con props (sale, open, onOpenChange, onPaymentSuccess)
  - Usar componentes de shadcn/ui (Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription)
  - Renderizar información de la venta (número, cliente, monto total)
  - Implementar formulario con campos: monto, método de pago, número de referencia, notas
  - Pre-llenar el campo de monto con el total de la venta
  - Agregar botones "Registrar después" y "Registrar Pago"
  - _Requisitos: 1.2, 2.1, 2.2, 2.3, 2.4, 4.1, 4.2, 5.1_

- [ ] 1.1 Escribir property test para pre-llenado correcto
  - **Property 2: Pre-llenado correcto de información**
  - **Valida: Requisitos 1.2, 2.1, 2.2, 2.3, 2.4**
  - Generar ventas aleatorias con fast-check
  - Renderizar modal con cada venta generada
  - Verificar que todos los campos contienen los datos correctos de la venta
  - Configurar 100 iteraciones mínimo

- [ ] 2. Implementar validación de formulario en QuickPaymentModal
  - Agregar estado local para el formulario (amount, paymentMethod, referenceNumber, notes)
  - Implementar validación: monto debe ser mayor a 0
  - Implementar validación: método de pago debe estar seleccionado
  - Mostrar advertencia (no error) si monto excede el total de la venta
  - Deshabilitar botón de confirmación si hay errores de validación
  - Mostrar mensajes de error usando toast de sonner
  - _Requisitos: 9.1, 9.2, 9.3_

- [ ] 2.1 Escribir unit tests para validación de formulario
  - Test: monto cero muestra error y previene envío
  - Test: monto negativo muestra error y previene envío
  - Test: sin método de pago deshabilita botón
  - Test: monto mayor al total muestra advertencia pero permite envío
  - _Requisitos: 9.1, 9.2, 9.3_

- [ ] 3. Implementar lógica de registro de pago en QuickPaymentModal
  - Importar server action `addSalePayment` desde `lib/actions/sales`
  - Implementar función handleSubmit que llama a addSalePayment con los datos del formulario
  - Agregar estado de carga (loading) durante el registro
  - Manejar respuesta exitosa: mostrar toast de éxito, llamar a onPaymentSuccess, cerrar modal
  - Manejar respuesta con error: mostrar toast de error, mantener modal abierto
  - Deshabilitar botones y mostrar "Registrando..." durante la carga
  - _Requisitos: 3.1, 3.2, 3.4, 3.5_

- [ ] 3.1 Escribir property test para persistencia de pago
  - **Property 3: Persistencia de pago en base de datos**
  - **Valida: Requisitos 3.2, 12.1, 12.2, 12.3**
  - Generar pagos aleatorios con fast-check
  - Crear venta de prueba
  - Registrar pago usando addSalePayment
  - Verificar que el pago existe en la base de datos con todos los campos correctos
  - Configurar 100 iteraciones mínimo

- [ ] 3.2 Escribir property test para cálculo de estado de pago
  - **Property 4: Cálculo correcto de estado de pago**
  - **Valida: Requisitos 3.3, 7.1, 7.2, 7.3, 7.4**
  - Generar combinaciones aleatorias de total de venta y monto de pago
  - Crear venta con total específico
  - Registrar pago con monto específico
  - Verificar que el estado de pago es correcto (pending/partial/paid) según la lógica
  - Configurar 100 iteraciones mínimo

- [ ] 4. Implementar botón "Registrar después" en QuickPaymentModal
  - Agregar handler para el botón que llama a onOpenChange(false)
  - Verificar que no se llama a addSalePayment al cerrar
  - Asegurar que el modal se cierra sin registrar ningún pago
  - _Requisitos: 5.1, 5.2, 5.3_

- [ ] 4.1 Escribir property test para cerrar sin crear pagos
  - **Property 7: Cerrar modal sin crear pagos**
  - **Valida: Requisitos 5.2**
  - Generar ventas aleatorias
  - Abrir modal con cada venta
  - Cerrar modal sin confirmar pago
  - Verificar que no se creó ningún registro en sale_payments
  - Configurar 100 iteraciones mínimo

- [ ] 4.2 Escribir property test para estado pendiente al cerrar
  - **Property 8: Estado pendiente al cerrar modal**
  - **Valida: Requisitos 1.4, 5.3**
  - Generar ventas aleatorias con estado "pending"
  - Abrir y cerrar modal sin registrar pago
  - Verificar que el estado de pago sigue siendo "pending"
  - Configurar 100 iteraciones mínimo

- [-] 5. Integrar QuickPaymentModal en la página de nueva venta
  - Abrir archivo `app/dashboard/sales/new/page.tsx`
  - Importar componente QuickPaymentModal
  - Agregar estados: showPaymentModal (boolean) y createdSale (Sale | null)
  - Modificar handleSubmit para detectar creación exitosa de venta
  - Si la venta es "completed", establecer createdSale y showPaymentModal en true
  - Si la venta es "draft", redirigir directamente a /dashboard/sales
  - _Requisitos: 1.1_

- [ ] 5.1 Escribir property test para mostrar modal automáticamente
  - **Property 1: Modal automático después de crear venta**
  - **Valida: Requisitos 1.1**
  - Generar ventas aleatorias con estado "completed"
  - Simular creación exitosa de venta
  - Verificar que el modal se muestra automáticamente
  - Configurar 100 iteraciones mínimo

- [x] 6. Implementar callbacks de éxito y cierre en NewSalePage
  - Crear función handlePaymentSuccess que cierra el modal y redirige a /dashboard/sales
  - Crear función handleModalClose que maneja el cierre del modal
  - Si el modal se cierra sin pagar, redirigir a /dashboard/sales
  - Pasar callbacks como props a QuickPaymentModal
  - Llamar a router.refresh() después de redirigir para actualizar la lista
  - _Requisitos: 3.4, 5.2_

- [x] 7. Agregar diseño responsivo al QuickPaymentModal
  - Usar clases de Tailwind para responsive design
  - Mobile (< 640px): modal ocupa 95% del ancho, campos en una columna
  - Tablet (640px - 1024px): modal ocupa 80% del ancho, algunos campos en dos columnas
  - Desktop (> 1024px): modal con ancho máximo de 600px, campos optimizados
  - Agregar atributo inputMode="decimal" al campo de monto para teclado numérico en móvil
  - _Requisitos: 10.1, 10.2, 10.3, 10.4_

- [x] 8. Agregar atributos de accesibilidad
  - Agregar aria-label a todos los inputs
  - Agregar aria-required="true" a campos requeridos
  - Agregar aria-busy durante estados de carga
  - Asegurar que el modal es navegable con teclado
  - Verificar que los mensajes de error son anunciados por lectores de pantalla
  - _Requisitos: 10.2_

- [ ] 9. Checkpoint - Verificar funcionalidad básica
  - Crear una venta de prueba y verificar que el modal aparece
  - Registrar un pago completo y verificar que el estado cambia a "paid"
  - Registrar un pago parcial y verificar que el estado cambia a "partial"
  - Cerrar el modal sin pagar y verificar que la venta queda en "pending"
  - Verificar que el método existente desde la lista de ventas sigue funcionando
  - Preguntar al usuario si hay dudas o problemas

- [ ] 10. Escribir property test para múltiples pagos
  - **Property 11: Suma correcta de múltiples pagos**
  - **Valida: Requisitos 8.4**
  - Generar arrays aleatorios de montos de pago
  - Crear venta con total específico
  - Registrar múltiples pagos secuencialmente
  - Verificar que el estado final refleja la suma correcta de todos los pagos
  - Configurar 100 iteraciones mínimo

- [ ] 11. Escribir property test para orden cronológico
  - **Property 14: Orden cronológico de pagos**
  - **Valida: Requisitos 12.4**
  - Generar múltiples pagos con delays aleatorios
  - Crear venta y registrar pagos con delays
  - Consultar pagos de la venta
  - Verificar que están ordenados cronológicamente por created_at
  - Configurar 100 iteraciones mínimo

- [ ] 12. Escribir property test para equivalencia entre métodos
  - **Property 9: Equivalencia entre métodos de registro**
  - **Valida: Requisitos 6.3**
  - Generar pagos aleatorios
  - Crear dos ventas idénticas
  - Registrar pago en una usando el modal (addSalePayment directo)
  - Registrar mismo pago en otra usando PaymentManager (mismo addSalePayment)
  - Verificar que ambas ventas tienen el mismo estado final
  - Configurar 100 iteraciones mínimo

- [ ] 13. Escribir property test para validación en servidor
  - **Property 12: Validación en servidor**
  - **Valida: Requisitos 11.2**
  - Generar datos de pago inválidos (monto 0, monto negativo, sin método)
  - Intentar registrar cada pago inválido
  - Verificar que el server action rechaza la operación
  - Verificar que no se crea ningún registro en la base de datos
  - Configurar 100 iteraciones mínimo

- [ ] 14. Escribir property test para mensajes de error
  - **Property 13: Mensajes de error descriptivos**
  - **Valida: Requisitos 11.4**
  - Generar diferentes tipos de errores (venta no encontrada, usuario no autenticado, etc.)
  - Intentar registrar pagos que causan cada tipo de error
  - Verificar que cada error retorna un mensaje descriptivo
  - Verificar que los mensajes no son genéricos
  - Configurar 100 iteraciones mínimo

- [ ] 15. Escribir unit tests de integración
  - Test: flujo completo de crear venta → mostrar modal → registrar pago → verificar estado
  - Test: crear venta → cerrar modal → registrar desde lista de ventas
  - Test: crear venta borrador → verificar que no se muestra modal
  - Test: crear venta completada → verificar que se muestra modal
  - Test: registrar pago que completa la venta → verificar estado "paid"

- [ ] 16. Checkpoint final - Ejecutar todos los tests
  - Ejecutar todos los unit tests y verificar que pasan
  - Ejecutar todos los property tests (mínimo 100 iteraciones cada uno)
  - Verificar cobertura de código (objetivo: > 80% líneas, > 75% ramas)
  - Corregir cualquier test que falle
  - Preguntar al usuario si hay dudas o problemas

- [ ] 17. Pruebas manuales en diferentes dispositivos
  - Probar en móvil: verificar diseño responsivo y teclado numérico
  - Probar en tablet: verificar diseño intermedio
  - Probar en desktop: verificar diseño completo
  - Probar navegación con teclado
  - Probar con lector de pantalla (accesibilidad)
  - _Requisitos: 10.1, 10.2, 10.3, 10.4_

- [ ] 18. Documentación y limpieza final
  - Agregar comentarios JSDoc a QuickPaymentModal
  - Documentar props y tipos TypeScript
  - Verificar que no hay console.logs de debug
  - Verificar que no hay código comentado
  - Actualizar README si es necesario

## Notas

- Todas las tareas son obligatorias para garantizar testing completo
- Cada tarea referencia los requisitos específicos que implementa
- Los checkpoints permiten validar el progreso y resolver dudas
- Los property tests usan fast-check con mínimo 100 iteraciones
- Los unit tests validan casos específicos y ejemplos concretos
- La implementación es incremental: cada tarea construye sobre las anteriores
