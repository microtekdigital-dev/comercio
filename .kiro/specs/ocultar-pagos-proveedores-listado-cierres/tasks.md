# Tasks: Ocultar Pagos a Proveedores en Listado de Cierres

## 1. Modificar Componente de Listado de Cierres

### 1.1 Eliminar sección de pagos a proveedores del listado
- [ ] Abrir el archivo `components/dashboard/cash-register-client.tsx`
- [ ] Localizar la sección "Supplier Payments Summary" (aproximadamente líneas 267-280)
- [ ] Eliminar el bloque completo que renderiza los pagos a proveedores:
  ```tsx
  {/* Supplier Payments Summary */}
  {closure.supplier_payments_cash > 0 && (
    <div className="mt-4 pt-4 border-t">
      <h4 className="text-sm font-semibold mb-3 text-red-600">Pagos a Proveedores</h4>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-muted-foreground mb-1">Total Pagos</p>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(closure.supplier_payments_cash)}</p>
        </div>
        <div className="border rounded-lg p-3">
          <p className="text-sm text-muted-foreground mb-1">Efectivo</p>
          <p className="text-lg font-semibold text-red-600">{formatCurrency(closure.supplier_payments_cash)}</p>
        </div>
      </div>
    </div>
  )}
  ```
- [ ] Verificar que no quedan referencias o comentarios huérfanos
- [ ] Guardar el archivo

## 2. Pruebas de Verificación

### 2.1 Prueba visual del listado
- [ ] Iniciar el servidor de desarrollo
- [ ] Navegar a `/dashboard/cash-register`
- [ ] Verificar que el listado de cierres NO muestra la sección "Pagos a Proveedores"
- [ ] Confirmar que el espaciado y diseño se ven correctos
- [ ] Verificar que todos los demás elementos se muestran correctamente:
  - Fecha y hora del cierre
  - Usuario que realizó el cierre
  - Total de ventas y cantidad
  - Desglose de métodos de pago
  - Efectivo esperado, contado y diferencia
  - Notas (si existen)
  - Botón "Ver Informe Detallado"

### 2.2 Prueba del informe detallado
- [ ] Desde el listado, hacer clic en "Ver Informe Detallado" de un cierre
- [ ] Verificar que el informe detallado SÍ muestra la sección de pagos a proveedores
- [ ] Confirmar que toda la información se muestra correctamente:
  - Total de pagos a proveedores
  - Desglose por método de pago (Efectivo, Tarjeta, Transferencia)
  - Todos los demás datos del cierre

### 2.3 Prueba con diferentes escenarios
- [ ] Verificar un cierre SIN pagos a proveedores (comportamiento debe ser igual que antes)
- [ ] Verificar un cierre CON pagos a proveedores (no debe mostrar la sección en el listado)
- [ ] Verificar múltiples cierres en el listado
- [ ] Verificar la responsividad en diferentes tamaños de pantalla

## 3. Validación Final

### 3.1 Checklist de calidad
- [ ] El código no tiene errores de sintaxis
- [ ] No hay warnings en la consola del navegador
- [ ] El componente se renderiza correctamente
- [ ] No hay regresiones en otras funcionalidades
- [ ] El informe detallado mantiene toda su funcionalidad
- [ ] La navegación entre listado e informe detallado funciona correctamente

### 3.2 Verificación de propiedades
- [ ] Propiedad 1: La sección "Pagos a Proveedores" NO aparece en el listado
- [ ] Propiedad 2: La sección "Pagos a Proveedores" SÍ aparece en el informe detallado
- [ ] Propiedad 3: Los datos de pagos a proveedores no se modifican

## 4. Documentación

### 4.1 Actualizar documentación (si aplica)
- [ ] Verificar si hay documentación que mencione la visualización de pagos en el listado
- [ ] Actualizar capturas de pantalla si existen
- [ ] Documentar el cambio en el changelog o notas de versión (si aplica)

## Resumen de Tareas

Total de tareas: 4 principales
- 1 tarea de implementación
- 3 tareas de pruebas y validación

Tiempo estimado total: 15-20 minutos
