# Asignación Masiva de Proveedores a Productos

## Implementación Completada

### Backend ✅
Se agregó la función `bulkUpdateSupplier` en `lib/actions/products.ts` que permite actualizar el proveedor de múltiples productos a la vez.

### Frontend - Pendiente de Implementación

Para completar la funcionalidad, necesitas modificar `app/dashboard/products/page.tsx` agregando:

#### 1. Estados para selección masiva

```typescript
const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
const [showBulkActions, setShowBulkActions] = useState(false);
const [showSupplierModal, setShowSupplierModal] = useState(false);
const [suppliers, setSuppliers] = useState<any[]>([]);
```

#### 2. Cargar proveedores

```typescript
const loadSuppliers = async () => {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", user.id)
    .single();

  if (profile?.company_id) {
    const { data } = await supabase
      .from("suppliers")
      .select("*")
      .eq("company_id", profile.company_id)
      .eq("is_active", true)
      .order("name");
    
    setSuppliers(data || []);
  }
};

// Agregar en useEffect
useEffect(() => {
  loadSuppliers();
}, []);
```

#### 3. Funciones de selección

```typescript
const toggleProductSelection = (productId: string) => {
  setSelectedProducts(prev =>
    prev.includes(productId)
      ? prev.filter(id => id !== productId)
      : [...prev, productId]
  );
};

const toggleSelectAll = () => {
  if (selectedProducts.length === products.length) {
    setSelectedProducts([]);
  } else {
    setSelectedProducts(products.map(p => p.id));
  }
};

const handleBulkAssignSupplier = async (supplierId: string | null) => {
  const result = await bulkUpdateSupplier(selectedProducts, supplierId);
  
  if (result.error) {
    toast.error(result.error);
  } else {
    toast.success(result.message);
    setSelectedProducts([]);
    setShowSupplierModal(false);
    loadProducts();
  }
};
```

#### 4. UI - Barra de acciones masivas

Agregar después del CardHeader y antes de CardContent:

```tsx
{selectedProducts.length > 0 && (
  <div className="px-6 py-3 bg-primary/10 border-b flex items-center justify-between">
    <span className="text-sm font-medium">
      {selectedProducts.length} producto(s) seleccionado(s)
    </span>
    <div className="flex gap-2">
      <Button
        size="sm"
        variant="outline"
        onClick={() => setShowSupplierModal(true)}
      >
        Asignar Proveedor
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setSelectedProducts([])}
      >
        Cancelar
      </Button>
    </div>
  </div>
)}
```

#### 5. UI - Checkbox en cada producto

Modificar el Card de cada producto para agregar un checkbox:

```tsx
<Card className="hover:bg-muted/50 transition-colors h-full relative">
  <div className="absolute top-2 left-2 z-10">
    <input
      type="checkbox"
      checked={selectedProducts.includes(product.id)}
      onChange={(e) => {
        e.preventDefault();
        toggleProductSelection(product.id);
      }}
      onClick={(e) => e.stopPropagation()}
      className="h-4 w-4 rounded border-gray-300"
    />
  </div>
  <CardContent className="p-3 md:p-4">
    {/* Resto del contenido */}
  </CardContent>
</Card>
```

#### 6. UI - Modal de selección de proveedor

Agregar al final del componente, antes del cierre:

```tsx
{showSupplierModal && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Asignar Proveedor</CardTitle>
        <p className="text-sm text-muted-foreground">
          Selecciona un proveedor para {selectedProducts.length} producto(s)
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select onValueChange={(value) => handleBulkAssignSupplier(value === "none" ? null : value)}>
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar proveedor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Sin proveedor</SelectItem>
            {suppliers.map((supplier) => (
              <SelectItem key={supplier.id} value={supplier.id}>
                {supplier.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setShowSupplierModal(false)}
          >
            Cancelar
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
)}
```

#### 7. Importar la función

Agregar al inicio del archivo:

```typescript
import { getProducts, bulkUpdateSupplier } from "@/lib/actions/products";
```

## Resultado Final

Con esta implementación, los usuarios podrán:

1. Ver checkboxes en cada producto
2. Seleccionar múltiples productos
3. Ver una barra de acciones cuando hay productos seleccionados
4. Hacer clic en "Asignar Proveedor"
5. Seleccionar un proveedor del dropdown
6. Actualizar todos los productos seleccionados de una vez

## Alternativa Más Simple

Si prefieres una implementación más rápida y simple, puedo crear un componente separado que maneje toda esta lógica. ¿Quieres que proceda con eso?
