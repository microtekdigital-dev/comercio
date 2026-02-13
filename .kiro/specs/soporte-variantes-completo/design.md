# Diseño: Soporte Completo de Variantes en Todas las Áreas

## 1. Resumen Ejecutivo

Este diseño detalla las soluciones técnicas para completar el soporte de variantes en todas las áreas del sistema: filtros, estadísticas, exportaciones y emails.

## 2. Arquitectura de Solución

### 2.1 Principios de Diseño
- Mantener compatibilidad con productos sin variantes
- Reutilizar lógica existente donde sea posible
- Optimizar queries para evitar N+1 problems
- Mantener consistencia en el formato de presentación de variantes

### 2.2 Formato Estándar de Variantes
En todo el sistema, las variantes se mostrarán con el formato:
```
{Nombre Producto} - {Nombre Variante}
```
Ejemplo: "Remera Básica - Talle M / Color Rojo"

## 3. Soluciones por Área

### 3.1 Filtro de Stock Bajo en Lista de Productos

**Problema Actual:**
El filtro `lowStock` en `getProducts()` solo verifica el stock del producto padre, no considera variantes.

**Solución:**

Modificar la query en `lib/actions/products.ts` para incluir una subquery que verifique variantes:

```typescript
// En getProducts()
if (lowStock) {
  query = query.or(
    `and(track_inventory.eq.true,stock_quantity.lte.min_stock_level),` +
    `and(has_variants.eq.true,variants.stock_quantity.lte.variants.min_stock_level)`
  );
}
```

**Alternativa más robusta:**
Usar una función de base de datos que retorne productos con stock bajo considerando variantes:

```sql
CREATE OR REPLACE FUNCTION get_products_with_low_stock(p_company_id uuid)
RETURNS TABLE (product_id uuid) AS $$
BEGIN
  RETURN QUERY
  -- Productos simples con stock bajo
  SELECT p.id
  FROM products p
  WHERE p.company_id = p_company_id
    AND p.track_inventory = true
    AND p.has_variants = false
    AND p.stock_quantity <= p.min_stock_level
    AND p.is_active = true
  
  UNION
  
  -- Productos con variantes que tienen al menos una variante con stock bajo
  SELECT DISTINCT p.id
  FROM products p
  INNER JOIN product_variants pv ON pv.product_id = p.id
  WHERE p.company_id = p_company_id
    AND p.has_variants = true
    AND pv.is_active = true
    AND pv.stock_quantity <= pv.min_stock_level
    AND p.is_active = true;
END;
$$ LANGUAGE plpgsql;
```

**Implementación en TypeScript:**
```typescript
if (lowStock) {
  const { data: lowStockIds } = await supabase
    .rpc('get_products_with_low_stock', { p_company_id: companyId });
  
  if (lowStockIds && lowStockIds.length > 0) {
    query = query.in('id', lowStockIds.map(item => item.product_id));
  } else {
    // Si no hay productos con stock bajo, retornar query vacía
    query = query.eq('id', '00000000-0000-0000-0000-000000000000');
  }
}
```

---

### 3.2 Productos Más Vendidos con Variantes

**Problema Actual:**
`getTopProducts()` agrupa por `product_id`, perdiendo información de qué variante específica se vendió más.

**Solución:**

Modificar la agregación para considerar variantes cuando existan:

```typescript
export async function getTopProducts(limit: number = 5) {
  const supabase = await createClient();
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) return [];

    const { data } = await supabase
      .from("sale_items")
      .select(`
        product_id,
        product_name,
        variant_id,
        variant_name,
        quantity,
        total,
        sale:sales!inner(company_id, status)
      `)
      .eq("sale.company_id", profile.company_id)
      .in("sale.status", ["confirmed", "completed"]);

    if (!data) return [];

    // Aggregate by product + variant combination
    const itemMap = new Map();
    data.forEach(item => {
      // Use variant_id if exists, otherwise use product_id
      const key = item.variant_id 
        ? `variant-${item.variant_id}` 
        : `product-${item.product_id}`;
      
      const displayName = item.variant_name
        ? `${item.product_name} - ${item.variant_name}`
        : item.product_name;
      
      if (itemMap.has(key)) {
        const existing = itemMap.get(key);
        existing.total_quantity += item.quantity;
        existing.total_revenue += item.total;
      } else {
        itemMap.set(key, {
          product_id: item.product_id,
          variant_id: item.variant_id,
          product_name: displayName,
          total_quantity: item.quantity,
          total_revenue: item.total,
        });
      }
    });

    return Array.from(itemMap.values())
      .sort((a, b) => b.total_revenue - a.total_revenue)
      .slice(0, limit);
  } catch (error) {
    console.error("Error fetching top products:", error);
    return [];
  }
}
```

---

### 3.3 Exportaciones de Productos

**Problema Actual:**
Las funciones `exportProductsToExcel()` y `exportProductsToCSV()` solo exportan productos padre, sin expandir variantes.

**Solución:**

Crear función helper que expande productos con variantes:

```typescript
// Helper function to expand products with variants
function expandProductsWithVariants(products: Product[]) {
  const expandedProducts: any[] = [];
  
  products.forEach(product => {
    if (product.has_variants && product.variants && product.variants.length > 0) {
      // Add each active variant as a separate row
      product.variants
        .filter(v => v.is_active)
        .forEach(variant => {
          expandedProducts.push({
            "SKU": variant.sku || product.sku || "",
            "Nombre": `${product.name} - ${variant.variant_name}`,
            "Descripción": product.description || "",
            "Tipo": product.type === "product" ? "Producto" : "Servicio",
            "Categoría": product.category?.name || "",
            "Precio": variant.price || product.price,
            "Costo": product.cost,
            "Moneda": product.currency,
            "Tasa de Impuesto": product.tax_rate,
            "Stock": variant.stock_quantity,
            "Stock Mínimo": variant.min_stock_level,
            "Controla Inventario": product.track_inventory ? "Sí" : "No",
            "Activo": "Sí",
            "Es Variante": "Sí",
            "Producto Padre": product.name,
          });
        });
    } else {
      // Add simple product as single row
      expandedProducts.push({
        "SKU": product.sku || "",
        "Nombre": product.name,
        "Descripción": product.description || "",
        "Tipo": product.type === "product" ? "Producto" : "Servicio",
        "Categoría": product.category?.name || "",
        "Precio": product.price,
        "Costo": product.cost,
        "Moneda": product.currency,
        "Tasa de Impuesto": product.tax_rate,
        "Stock": product.stock_quantity,
        "Stock Mínimo": product.min_stock_level,
        "Controla Inventario": product.track_inventory ? "Sí" : "No",
        "Activo": product.is_active ? "Sí" : "No",
        "Es Variante": "No",
        "Producto Padre": "",
      });
    }
  });
  
  return expandedProducts;
}

// Updated export functions
export function exportProductsToExcel(products: Product[]) {
  const data = expandProductsWithVariants(products);
  exportToExcel(data, `productos-${new Date().toISOString().split("T")[0]}`, "Productos");
}

export function exportProductsToCSV(products: Product[]) {
  const data = expandProductsWithVariants(products);
  exportToCSV(data, `productos-${new Date().toISOString().split("T")[0]}`);
}
```

---

### 3.4 Reportes PDF de Inventario

**Problema Actual:**
`exportProductsReportToPDF()` no muestra variantes en la tabla.

**Solución:**

Modificar la generación de tabla para incluir variantes:

```typescript
export function exportProductsReportToPDF(
  products: Product[],
  stats: {
    totalProducts: number;
    lowStockProducts: number;
    totalValue: number;
  },
  companyName: string = "Mi Empresa"
) {
  const doc = new jsPDF();

  // Title, company, date (sin cambios)
  doc.setFontSize(20);
  doc.text("Reporte de Productos", 14, 20);
  doc.setFontSize(12);
  doc.text(companyName, 14, 28);
  doc.setFontSize(10);
  doc.text(`Fecha: ${new Date().toLocaleDateString("es-AR")}`, 14, 35);

  // Stats (sin cambios)
  doc.setFontSize(12);
  doc.text("Resumen", 14, 45);
  doc.setFontSize(10);
  doc.text(`Total de Productos: ${stats.totalProducts}`, 14, 52);
  doc.text(`Productos con Stock Bajo: ${stats.lowStockProducts}`, 14, 59);
  doc.text(`Valor Total de Inventario: ${stats.totalValue.toFixed(2)}`, 14, 66);

  // Expand products with variants for table
  const tableData: any[] = [];
  
  products.forEach(product => {
    if (product.has_variants && product.variants && product.variants.length > 0) {
      product.variants
        .filter(v => v.is_active)
        .forEach(variant => {
          tableData.push([
            variant.sku || product.sku || "-",
            `${product.name}\n${variant.variant_name}`,
            product.type === "product" ? "Producto" : "Servicio",
            `${(variant.price || product.price).toFixed(2)}`,
            product.track_inventory ? variant.stock_quantity.toString() : "N/A",
          ]);
        });
    } else {
      tableData.push([
        product.sku || "-",
        product.name,
        product.type === "product" ? "Producto" : "Servicio",
        `${product.price.toFixed(2)}`,
        product.track_inventory ? product.stock_quantity.toString() : "N/A",
      ]);
    }
  });

  autoTable(doc, {
    startY: 75,
    head: [["SKU", "Nombre", "Tipo", "Precio", "Stock"]],
    body: tableData,
    theme: "grid",
    headStyles: { fillColor: [59, 130, 246] },
    styles: { fontSize: 7, cellPadding: 2 },
    columnStyles: {
      1: { cellWidth: 60 }, // Nombre column wider for variants
    },
  });

  doc.save(`reporte-productos-${new Date().toISOString().split("T")[0]}.pdf`);
}
```

---

### 3.5 Email de Presupuesto con Variantes

**Problema Actual:**
El template `quote-email.tsx` solo muestra `product_name`, sin información de variante.

**Solución:**

Modificar el template para mostrar variantes cuando existan:

```tsx
// En quote-email.tsx, modificar la tabla de items:

<tbody>
  {items.map((item, index) => (
    <tr
      key={index}
      style={{
        borderBottom: "1px solid #e5e7eb",
      }}
    >
      <td
        style={{
          padding: "12px 8px",
          fontSize: "14px",
        }}
      >
        {item.product_name}
        {item.variant_name && (
          <div style={{
            fontSize: "12px",
            color: "#6b7280",
            marginTop: "4px",
          }}>
            {item.variant_name}
          </div>
        )}
      </td>
      {/* resto de las columnas sin cambios */}
    </tr>
  ))}
</tbody>
```

**Actualizar interface:**
```typescript
interface QuoteEmailProps {
  // ... otros props
  items: Array<{
    product_name: string
    variant_name?: string | null  // Agregar este campo
    quantity: number
    unit_price: number
    total: number
  }>
}
```

**Actualizar función de envío en `lib/actions/quotes.ts`:**
```typescript
const emailResult = await sendQuoteEmail(email, subject, message, {
  // ... otros campos
  items: quote.items.map((item: any) => ({
    product_name: item.product_name,
    variant_name: item.variant_name || null,  // Incluir variante
    quantity: item.quantity,
    unit_price: item.unit_price,
    total: item.total,
  })),
})
```

---

### 3.6 Exportaciones de Ventas con Variantes

**Problema Actual:**
Las exportaciones de ventas no muestran qué variante se vendió.

**Solución:**

Modificar `exportSalesToExcel()` y `exportSalesToCSV()` para incluir detalles de items:

```typescript
export function exportSalesToExcel(sales: Sale[]) {
  const data: any[] = [];
  
  sales.forEach(sale => {
    if (sale.items && sale.items.length > 0) {
      // Una fila por cada item de la venta
      sale.items.forEach(item => {
        const productName = item.variant_name
          ? `${item.product_name} - ${item.variant_name}`
          : item.product_name;
        
        data.push({
          "Número de Venta": sale.sale_number,
          "Fecha": new Date(sale.sale_date).toLocaleDateString("es-AR"),
          "Cliente": sale.customer?.name || "Sin cliente",
          "Producto": productName,
          "SKU": item.product_sku || "",
          "Cantidad": item.quantity,
          "Precio Unitario": item.unit_price,
          "Subtotal Item": item.subtotal,
          "Total Item": item.total,
          "Estado Venta": sale.status,
          "Estado de Pago": sale.payment_status,
          "Total Venta": sale.total,
          "Moneda": sale.currency,
        });
      });
    } else {
      // Venta sin items (caso edge)
      data.push({
        "Número de Venta": sale.sale_number,
        "Fecha": new Date(sale.sale_date).toLocaleDateString("es-AR"),
        "Cliente": sale.customer?.name || "Sin cliente",
        "Producto": "",
        "SKU": "",
        "Cantidad": 0,
        "Precio Unitario": 0,
        "Subtotal Item": 0,
        "Total Item": 0,
        "Estado Venta": sale.status,
        "Estado de Pago": sale.payment_status,
        "Total Venta": sale.total,
        "Moneda": sale.currency,
      });
    }
  });

  exportToExcel(data, `ventas-${new Date().toISOString().split("T")[0]}`, "Ventas");
}
```

---

## 4. Estructura de Datos

### 4.1 Tipos TypeScript Actualizados

```typescript
// En lib/types/erp.ts - Asegurar que estos campos existan

export interface ProductVariant {
  id: string;
  product_id: string;
  company_id: string;
  variant_name: string;
  sku: string | null;
  price: number | null;
  stock_quantity: number;
  min_stock_level: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  // ... otros campos
  has_variants: boolean;
  variants?: ProductVariant[];
}

export interface SaleItem {
  id: string;
  // ... otros campos
  variant_id: string | null;
  variant_name: string | null;
}

export interface QuoteItem {
  id: string;
  // ... otros campos
  variant_id: string | null;
  variant_name: string | null;
}
```

---

## 5. Queries de Base de Datos

### 5.1 Función para Productos con Stock Bajo

```sql
-- Crear función en Supabase
CREATE OR REPLACE FUNCTION get_products_with_low_stock(p_company_id uuid)
RETURNS TABLE (product_id uuid) AS $$
BEGIN
  RETURN QUERY
  -- Productos simples con stock bajo
  SELECT p.id
  FROM products p
  WHERE p.company_id = p_company_id
    AND p.track_inventory = true
    AND p.has_variants = false
    AND p.stock_quantity <= p.min_stock_level
    AND p.is_active = true
  
  UNION
  
  -- Productos con variantes que tienen al menos una variante con stock bajo
  SELECT DISTINCT p.id
  FROM products p
  INNER JOIN product_variants pv ON pv.product_id = p.id
  WHERE p.company_id = p_company_id
    AND p.has_variants = true
    AND pv.is_active = true
    AND pv.stock_quantity <= pv.min_stock_level
    AND p.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 6. Consideraciones de Rendimiento

### 6.1 Optimizaciones
- Usar índices en `product_variants.product_id` y `product_variants.company_id`
- Limitar el número de variantes expandidas en exportaciones grandes
- Cachear resultados de productos más vendidos (considerar para futuro)

### 6.2 Límites
- Exportaciones: máximo 10,000 filas (considerando expansión de variantes)
- PDF: máximo 500 productos expandidos para evitar archivos muy grandes

---

## 7. Testing

### 7.1 Casos de Prueba

**Filtro de Stock Bajo:**
- Producto simple con stock bajo → debe aparecer
- Producto con variantes, todas con stock OK → no debe aparecer
- Producto con variantes, una con stock bajo → debe aparecer
- Producto sin track_inventory → no debe aparecer

**Productos Más Vendidos:**
- Venta de producto simple → aparece con nombre simple
- Venta de variante → aparece con formato "Producto - Variante"
- Múltiples ventas de misma variante → se agregan correctamente

**Exportaciones:**
- Producto simple → 1 fila
- Producto con 3 variantes activas → 3 filas
- Producto con variantes inactivas → solo variantes activas
- Mezcla de productos simples y con variantes → correcto

**Email de Presupuesto:**
- Item sin variante → solo nombre de producto
- Item con variante → nombre + variante en línea separada
- Formato legible y profesional

---

## 8. Migración y Rollout

### 8.1 Plan de Implementación
1. Crear función SQL `get_products_with_low_stock`
2. Actualizar `lib/actions/products.ts` (filtro stock bajo)
3. Actualizar `lib/actions/analytics.ts` (productos más vendidos)
4. Actualizar `lib/utils/export.ts` (todas las exportaciones)
5. Actualizar `lib/email/templates/quote-email.tsx`
6. Actualizar `lib/actions/quotes.ts` (envío de email)
7. Testing manual de cada área
8. Deploy

### 8.2 Rollback
Si hay problemas, cada cambio es independiente y puede revertirse sin afectar otros.

---

## 9. Documentación

### 9.1 Para Usuarios
- Actualizar documentación de exportaciones mencionando que incluyen variantes
- Agregar nota en emails de presupuesto sobre formato de variantes

### 9.2 Para Desarrolladores
- Documentar función `expandProductsWithVariants()`
- Documentar formato estándar de presentación de variantes
- Agregar comentarios en código sobre manejo de variantes

---

## 10. Métricas de Éxito

- Filtro de stock bajo funciona correctamente con variantes (100% precisión)
- Productos más vendidos muestra variantes individuales
- Exportaciones incluyen todas las variantes activas
- Emails de presupuesto muestran variantes claramente
- No hay degradación de rendimiento (< 500ms para exportaciones de 1000 productos)
