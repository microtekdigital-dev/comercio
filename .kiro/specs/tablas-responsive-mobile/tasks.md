# Tasks: Tablas Responsive con Tarjetas en Móvil

## 1. Implementar Vista de Tarjetas en Órdenes de Compra
**Archivo**: `app/dashboard/purchase-orders/page.tsx`

### 1.1 Agregar vista de tarjetas móvil
- [ ] Duplicar la sección de renderizado de órdenes
- [ ] Aplicar clase `hidden md:block` a la tabla existente
- [ ] Crear nueva sección con clase `block md:hidden` para tarjetas
- [ ] Implementar estructura de tarjeta según diseño:
  - Header con número de orden y proveedor
  - Badges de estado y pago alineados a la derecha
  - Grid 2 columnas con fecha y total
  - Botón "Ver detalles" de ancho completo

### 1.2 Probar vista de órdenes de compra
- [ ] Verificar que tabla se oculta en móvil (< 768px)
- [ ] Verificar que tarjetas se ocultan en escritorio (≥ 768px)
- [ ] Probar con nombres de proveedor largos
- [ ] Verificar que todos los badges se muestran correctamente
- [ ] Confirmar que el botón "Ver detalles" funciona

---

## 2. Optimizar Vista de Productos para Móvil
**Archivo**: `app/dashboard/products/page.tsx`

### 2.1 Ajustar grid responsive
- [ ] Cambiar grid de `grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5`
- [ ] A: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`
- [ ] Verificar que el grid se adapta correctamente en todos los breakpoints

### 2.2 Mejorar manejo de texto largo
- [ ] Cambiar nombre de producto de `line-clamp-1` a `line-clamp-2`
- [ ] Agregar clase `break-words` al nombre del producto
- [ ] Ajustar tamaño de fuente: `text-sm md:text-base` para el nombre
- [ ] Ajustar tamaño de precio: `text-lg md:text-xl` para el precio

### 2.3 Optimizar elementos responsive
- [ ] Verificar que SKU se muestra correctamente en móvil
- [ ] Ajustar badges para que no se desborden
- [ ] Verificar que la imagen mantiene aspect ratio
- [ ] Confirmar que el stock se muestra legible en móvil

### 2.4 Probar vista de productos
- [ ] Probar con nombres de 35 caracteres
- [ ] Verificar que no hay scroll horizontal
- [ ] Confirmar que las tarjetas son clickeables
- [ ] Probar con múltiples badges simultáneos

---

## 3. Optimizar Vista de Ventas para Móvil
**Archivo**: `app/dashboard/sales/page.tsx`

### 3.1 Mejorar estructura de tarjetas existentes
- [ ] Agregar `space-y-3` al contenedor de tarjetas
- [ ] Mejorar el header con mejor manejo de wrap
- [ ] Aplicar `truncate` al número de venta
- [ ] Aplicar `truncate` al nombre del cliente

### 3.2 Optimizar layout de información
- [ ] Reorganizar badges con `flex-wrap` y `gap-1`
- [ ] Mejorar separación visual entre secciones
- [ ] Hacer el total más prominente en móvil
- [ ] Ajustar espaciado entre elementos

### 3.3 Ajustar tamaños responsive
- [ ] Número de venta: `text-sm md:text-base`
- [ ] Información secundaria: `text-xs md:text-sm`
- [ ] Total: `text-base md:text-lg`
- [ ] Padding de tarjeta: `p-4`

### 3.4 Probar vista de ventas
- [ ] Verificar que las tarjetas se ven bien en móvil
- [ ] Probar con nombres de cliente largos
- [ ] Confirmar que los badges no se desbordan
- [ ] Verificar que el total es legible

---

## 4. Testing Responsive en Todas las Páginas

### 4.1 Probar breakpoints críticos
- [ ] 320px - iPhone SE (móvil pequeño)
- [ ] 375px - iPhone estándar
- [ ] 768px - Tablet (punto de transición)
- [ ] 1024px - Desktop pequeño
- [ ] 1440px - Desktop estándar

### 4.2 Probar escenarios de datos
- [ ] Listas vacías (empty state)
- [ ] Lista con 1 item
- [ ] Lista con 10 items
- [ ] Lista con 50+ items
- [ ] Nombres de 35 caracteres
- [ ] Múltiples filtros activos

### 4.3 Verificar transiciones
- [ ] Cambiar tamaño de ventana de móvil a escritorio
- [ ] Cambiar tamaño de escritorio a móvil
- [ ] Verificar que no hay flash de contenido
- [ ] Confirmar que los filtros se mantienen

---

## 5. Validación de Propiedades de Correctness

### 5.1 Propiedad: Visibilidad Exclusiva
- [ ] En móvil (< 768px), solo tarjetas visibles
- [ ] En escritorio (≥ 768px), solo tabla visible (o grid en productos)
- [ ] Nunca ambas vistas visibles simultáneamente
- [ ] Verificar en los 3 archivos modificados

### 5.2 Propiedad: Paridad de Datos
- [ ] Mismo número de items en tabla y tarjetas
- [ ] Mismos datos mostrados en ambas vistas
- [ ] Mismo orden de items
- [ ] Filtros aplicados correctamente en ambas vistas

### 5.3 Propiedad: Accesibilidad de Acciones
- [ ] Todos los botones presentes en tarjetas
- [ ] Links funcionando correctamente
- [ ] Touch targets ≥ 44px en móvil
- [ ] Espaciado mínimo 8px entre elementos interactivos

### 5.4 Propiedad: Manejo de Overflow
- [ ] Nombres de 35 caracteres no causan scroll horizontal
- [ ] Truncate o line-clamp aplicado correctamente
- [ ] break-words funcionando donde necesario
- [ ] No hay desbordamiento en ninguna tarjeta

### 5.5 Propiedad: Transición Fluida
- [ ] No hay flash al cambiar tamaño de ventana
- [ ] Transición suave entre vistas
- [ ] Estado de filtros se mantiene
- [ ] Posición de scroll se preserva (cuando posible)

---

## 6. Refinamiento y Ajustes Finales

### 6.1 Revisar consistencia visual
- [ ] Espaciado consistente entre tarjetas (space-y-3)
- [ ] Padding consistente en tarjetas (p-4)
- [ ] Tamaños de fuente consistentes
- [ ] Colores y badges consistentes

### 6.2 Optimizar rendimiento
- [ ] Verificar que no hay re-renders innecesarios
- [ ] Confirmar que las transiciones son suaves
- [ ] Verificar tiempo de carga en móvil

### 6.3 Documentar cambios
- [ ] Agregar comentarios en código donde necesario
- [ ] Documentar clases responsive utilizadas
- [ ] Actualizar README si es necesario

---

## Notas de Implementación

### Orden Recomendado
1. Empezar con Órdenes de Compra (más simple)
2. Continuar con Productos (ajustes menores)
3. Finalizar con Ventas (optimización)
4. Testing completo al final

### Clases Tailwind Clave
```css
/* Visibilidad condicional */
hidden md:block
block md:hidden

/* Espaciado responsive */
space-y-3
p-4
gap-2

/* Texto responsive */
text-sm md:text-base
text-base md:text-lg

/* Manejo de overflow */
truncate
line-clamp-2
break-words
```

### Testing Manual
- Usar DevTools para simular dispositivos
- Probar en dispositivo real si es posible
- Verificar en Chrome, Firefox y Safari
- Probar orientación portrait y landscape en tablet

### Criterios de Completitud
- ✅ Todas las vistas responsive implementadas
- ✅ No hay scroll horizontal en móvil
- ✅ Todas las propiedades de correctness validadas
- ✅ Testing en todos los breakpoints completado
- ✅ Consistencia visual verificada
