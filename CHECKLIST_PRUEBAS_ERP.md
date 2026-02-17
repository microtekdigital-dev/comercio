# Checklist de Pruebas del ERP

## 1. Autenticación y Usuarios
- [ ] Registro de nuevo usuario
- [ ] Login con credenciales correctas
- [ ] Login con credenciales incorrectas (debe fallar)
- [ ] Recuperación de contraseña
- [ ] Logout

## 2. Gestión de Productos
- [ ] Crear producto sin variantes
- [ ] Crear producto con variantes (remeras/pantalones)
- [ ] Editar producto existente
- [ ] Cambiar precio de producto (verificar historial de precios)
- [ ] Ajustar stock manualmente
- [ ] Verificar alerta de stock bajo
- [ ] Eliminar/desactivar producto

## 3. Gestión de Clientes
- [ ] Crear nuevo cliente
- [ ] Editar cliente existente
- [ ] Ver cuenta corriente del cliente
- [ ] Registrar pago de cliente
- [ ] Verificar saldo actualizado

## 4. Gestión de Proveedores
- [ ] Crear nuevo proveedor
- [ ] Editar proveedor existente
- [ ] Ver cuenta corriente del proveedor
- [ ] Registrar pago a proveedor
- [ ] Verificar saldo actualizado

## 5. Órdenes de Compra
- [ ] Crear orden de compra
- [ ] Agregar productos con variantes
- [ ] Marcar como recibida
- [ ] Verificar que el stock aumentó correctamente
- [ ] Verificar historial de stock
- [ ] Registrar pago parcial
- [ ] Registrar pago total

## 6. Ventas
- [ ] Crear venta en efectivo
- [ ] Crear venta con tarjeta
- [ ] Crear venta con transferencia
- [ ] Venta con productos con variantes
- [ ] Venta con descuento
- [ ] Verificar que el stock disminuyó
- [ ] Registrar pago parcial (cuenta corriente)
- [ ] Completar pago de venta pendiente
- [ ] Imprimir/exportar factura

## 7. Presupuestos
- [ ] Crear presupuesto
- [ ] Enviar presupuesto por email
- [ ] Convertir presupuesto a venta
- [ ] Rechazar presupuesto

## 8. Caja (Cash Register)

### Apertura de Caja
- [ ] Abrir caja con monto inicial
- [ ] Verificar que "Caja Actual" muestra el monto inicial

### Operaciones Durante el Turno
- [ ] Realizar venta en efectivo
- [ ] Verificar que "Caja Actual" aumentó
- [ ] Registrar ingreso de dinero
- [ ] Verificar que "Caja Actual" aumentó
- [ ] Registrar retiro de dinero
- [ ] Verificar que "Caja Actual" disminuyó
- [ ] Pagar a proveedor en efectivo
- [ ] Verificar que "Caja Actual" disminuyó

### Cierre de Caja
- [ ] Cerrar caja del turno
- [ ] Contar efectivo físico
- [ ] Verificar diferencia de caja (si hay)
- [ ] Verificar que "Caja Actual" muestra $0 después del cierre
- [ ] Ver reporte de cierre

## 9. Reportes y Estadísticas

### Dashboard Principal
- [ ] Verificar "Ventas del Día"
- [ ] Verificar "Caja Actual" (debe ser 0 si no hay apertura)
- [ ] Verificar "Cuentas por Cobrar"
- [ ] Verificar "Cuentas por Pagar"
- [ ] Verificar "Ganancia Mensual"

### Reporte de Inventario
- [ ] Generar reporte de inventario
- [ ] Filtrar por categoría
- [ ] Filtrar por proveedor
- [ ] Exportar a Excel/CSV
- [ ] Verificar productos con stock bajo

### Liquidación de Inventario
- [ ] Generar reporte de liquidación
- [ ] Verificar "Valor Total de Compras" (debe ser diferente a ventas)
- [ ] Verificar "Valor Total de Ventas"
- [ ] Verificar "Ganancia Total"
- [ ] Verificar "Margen de Ganancia %"
- [ ] Ver liquidación por categoría
- [ ] Ver liquidación por proveedor
- [ ] Ver top movers (productos más vendidos)
- [ ] Ver slow movers (productos menos vendidos)

### Liquidación de Cuentas
- [ ] Generar reporte de cuentas por cobrar
- [ ] Generar reporte de cuentas por pagar
- [ ] Filtrar por rango de fechas
- [ ] Exportar reporte

### Historial de Stock
- [ ] Ver movimientos de stock de un producto
- [ ] Filtrar por tipo de movimiento (compra/venta/ajuste)
- [ ] Filtrar por fecha
- [ ] Verificar que los movimientos son correctos

### Historial de Precios
- [ ] Ver cambios de precio de un producto
- [ ] Verificar que se registró quién cambió el precio
- [ ] Verificar fecha y hora del cambio

## 10. Categorías
- [ ] Crear categoría
- [ ] Editar categoría
- [ ] Asignar productos a categoría
- [ ] Eliminar categoría vacía

## 11. Notas Internas
- [ ] Crear nota interna
- [ ] Filtrar por tipo de nota
- [ ] Marcar nota como resuelta
- [ ] Ver historial de notas

## 12. Configuración
- [ ] Cambiar configuración de empresa
- [ ] Configurar monto inicial de caja
- [ ] Cambiar prefijos de numeración
- [ ] Configurar tasa de impuesto

## 13. Planes y Suscripciones
- [ ] Verificar plan actual
- [ ] Ver límites del plan
- [ ] Verificar restricciones por plan

## 14. Pruebas de Integridad

### Consistencia de Stock
- [ ] Crear orden de compra → Verificar stock aumenta
- [ ] Crear venta → Verificar stock disminuye
- [ ] Verificar que historial de stock coincide

### Consistencia de Cuentas Corrientes
- [ ] Crear venta a crédito → Verificar deuda aumenta
- [ ] Registrar pago → Verificar deuda disminuye
- [ ] Verificar saldo final es correcto

### Consistencia de Caja
- [ ] Abrir caja con $X
- [ ] Realizar operaciones
- [ ] Cerrar caja
- [ ] Verificar que el cálculo es correcto

### Consistencia de Reportes
- [ ] Comparar "Ventas del Día" con suma de ventas
- [ ] Comparar "Caja Actual" con cálculo manual
- [ ] Comparar reportes de liquidación con datos reales

## 15. Pruebas de Variantes
- [ ] Crear producto con variantes
- [ ] Comprar variantes específicas
- [ ] Vender variantes específicas
- [ ] Verificar stock por variante
- [ ] Cambiar precio de variante
- [ ] Ver historial de precio por variante
- [ ] Ver historial de stock por variante

## 16. Pruebas de Permisos (si aplica)
- [ ] Empleado puede ver productos
- [ ] Empleado puede crear ventas
- [ ] Empleado NO puede ver reportes financieros (según plan)
- [ ] Admin puede ver todo

## 17. Pruebas de Exportación
- [ ] Exportar reporte de inventario
- [ ] Exportar reporte de ventas
- [ ] Exportar reporte de liquidación
- [ ] Verificar que los datos exportados son correctos

## 18. Pruebas de Búsqueda y Filtros
- [ ] Buscar producto por nombre
- [ ] Buscar producto por SKU
- [ ] Filtrar ventas por fecha
- [ ] Filtrar ventas por cliente
- [ ] Filtrar ventas por método de pago

## 19. Pruebas de Validación
- [ ] Intentar vender más stock del disponible (debe fallar)
- [ ] Intentar crear producto sin nombre (debe fallar)
- [ ] Intentar crear venta sin items (debe fallar)
- [ ] Intentar cerrar caja sin apertura (debe fallar)

## 20. Pruebas de Rendimiento
- [ ] Cargar página con muchos productos
- [ ] Generar reporte con muchos datos
- [ ] Verificar que no hay lentitud excesiva

---

## Notas de Prueba

### Bugs Encontrados
- Anotar aquí cualquier bug que encuentres durante las pruebas

### Mejoras Sugeridas
- Anotar aquí cualquier mejora que se te ocurra

### Fecha de Última Prueba
- Fecha: ___________
- Probado por: ___________
- Resultado: ___________
