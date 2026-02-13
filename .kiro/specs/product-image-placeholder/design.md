# Design Document: Product Image Placeholder

## Overview

Este diseño implementa un sistema centralizado para manejar imágenes de productos con soporte automático para placeholders. La solución utiliza un componente reutilizable que detecta cuando un producto no tiene imagen y muestra automáticamente una imagen placeholder consistente en toda la aplicación.

La implementación se basa en:
- Un componente React reutilizable `ProductImage` que encapsula toda la lógica de detección y renderizado
- Uso de Next.js Image component para optimización automática
- Manejo de errores de carga de imagen con fallback a placeholder
- Imagen placeholder existente en `/placeholder.jpg`

## Architecture

### Component-Based Architecture

```
┌─────────────────────────────────────┐
│   Product Display Components       │
│  (Products Page, Sales, Quotes,    │
│   Purchase Orders, etc.)           │
└──────────────┬──────────────────────┘
               │
               │ uses
               ▼
┌─────────────────────────────────────┐
│      ProductImage Component         │
│  - Detects missing/invalid images   │
│  - Handles loading errors           │
│  - Shows placeholder when needed    │
│  - Consistent styling               │
└──────────────┬──────────────────────┘
               │
               │ renders
               ▼
┌─────────────────────────────────────┐
│    Next.js Image Component          │
│  - Optimized image loading          │
│  - Automatic responsive sizing      │
│  - Built-in error handling          │
└─────────────────────────────────────┘
```

### Data Flow

```
Product Data → ProductImage Component → Validation Logic → Render Decision
                                              │
                                              ├─→ Valid image_url → Display product image
                                              ├─→ Null/empty/whitespace → Display placeholder
                                              └─→ Load error → Display placeholder
```

## Components and Interfaces

### ProductImage Component

**Location**: `components/dashboard/product-image.tsx`

**Purpose**: Componente reutilizable que maneja la lógica de detección de imágenes faltantes y renderizado de placeholders.

**Props Interface**:
```typescript
interface ProductImageProps {
  imageUrl: string | null | undefined;
  productName: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  fill?: boolean;
  width?: number;
  height?: number;
}
```

**Key Features**:
- Detección automática de imágenes faltantes o inválidas
- Manejo de errores de carga con fallback a placeholder
- Soporte para todos los props de Next.js Image
- Estilos consistentes y personalizables
- Optimización de rendimiento con lazy loading

**Implementation Logic**:
```typescript
function isValidImageUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  if (typeof url !== 'string') return false;
  if (url.trim() === '') return false;
  return true;
}

function ProductImage({ imageUrl, productName, ...props }) {
  const [hasError, setHasError] = useState(false);
  const shouldShowPlaceholder = !isValidImageUrl(imageUrl) || hasError;
  
  if (shouldShowPlaceholder) {
    return <Image src="/placeholder.jpg" alt="Sin imagen" {...props} />;
  }
  
  return (
    <Image 
      src={imageUrl} 
      alt={productName}
      onError={() => setHasError(true)}
      {...props}
    />
  );
}
```

### Integration Points

**Files to Update**:
1. `app/dashboard/products/page.tsx` - Product listing grid
2. `app/dashboard/products/[id]/page.tsx` - Product detail view
3. `app/dashboard/sales/new/page.tsx` - Sales form product selection
4. `app/dashboard/purchase-orders/new/page.tsx` - Purchase order form
5. `app/dashboard/quotes/new/quote-form.tsx` - Quote form product selection

**Migration Pattern**:
```typescript
// Before
{product.image_url && (
  <Image src={product.image_url} alt={product.name} />
)}

// After
<ProductImage 
  imageUrl={product.image_url} 
  productName={product.name}
  fill
  className="object-cover"
  sizes="..."
/>
```

## Data Models

### Product Type (Existing)

```typescript
interface Product {
  id: string;
  name: string;
  sku: string | null;
  description: string | null;
  price: number;
  cost: number;
  stock_quantity: number;
  min_stock_level: number;
  type: "product" | "service";
  category_id: string | null;
  supplier_id: string | null;
  tax_rate: number;
  track_inventory: boolean;
  is_active: boolean;
  image_url: string | null;  // ← Campo relevante
  has_variants: boolean;
  variant_type: VariantType | null;
  // ... otros campos
}
```

**No se requieren cambios en el modelo de datos**. El campo `image_url` ya soporta valores `null`, que es el comportamiento esperado.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: Invalid Image URL Detection

*For any* product with an image_url that is null, empty string, or contains only whitespace characters, the system should identify it as having no image and return false from the validation function.

**Validates: Requirements 1.1, 1.2, 1.3**

### Property 2: Placeholder Rendering for Missing Images

*For any* product without a valid image_url, when rendered through the ProductImage component, the component should display the placeholder image located at `/placeholder.jpg`.

**Validates: Requirements 2.1, 2.3**

### Property 3: Actual Image Rendering for Valid URLs

*For any* product with a valid image_url (non-null, non-empty, non-whitespace string), when rendered through the ProductImage component, the component should display the actual product image using that URL.

**Validates: Requirements 2.2**

### Property 4: Error Handling with Placeholder Fallback

*For any* product image that fails to load (network error, invalid URL, 404, etc.), the ProductImage component should catch the error and display the placeholder image without breaking the UI or throwing unhandled exceptions.

**Validates: Requirements 5.1, 5.2, 5.3**

## Error Handling

### Image Loading Errors

**Strategy**: Use React state and Next.js Image `onError` callback to handle loading failures gracefully.

```typescript
const [hasError, setHasError] = useState(false);

<Image 
  src={imageUrl}
  onError={() => setHasError(true)}
  // ... other props
/>
```

**Error Scenarios**:
1. **Network failures**: Image server unreachable
2. **404 errors**: Image file not found
3. **Invalid URLs**: Malformed URL strings
4. **CORS errors**: Cross-origin restrictions
5. **Timeout errors**: Slow loading images

**Handling Approach**:
- All errors trigger the same fallback: display placeholder
- No error messages shown to user (graceful degradation)
- Component continues to render normally
- No console errors or exceptions thrown

### Validation Errors

**Invalid URL Detection**:
```typescript
function isValidImageUrl(url: string | null | undefined): boolean {
  // Handle null/undefined
  if (!url) return false;
  
  // Handle non-string types
  if (typeof url !== 'string') return false;
  
  // Handle empty or whitespace-only strings
  if (url.trim() === '') return false;
  
  return true;
}
```

**Edge Cases**:
- `null` → Invalid
- `undefined` → Invalid
- `""` → Invalid
- `"   "` → Invalid (whitespace only)
- `"\t\n"` → Invalid (whitespace characters)
- `"https://example.com/image.jpg"` → Valid

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests to ensure comprehensive coverage:

**Unit Tests** focus on:
- Specific examples of invalid URLs (null, empty, whitespace)
- Integration with Next.js Image component
- React component rendering
- Error boundary behavior
- Specific page integrations (products page, sales page, etc.)

**Property-Based Tests** focus on:
- Universal validation logic across all possible inputs
- Comprehensive coverage of whitespace variations
- Error handling across different failure scenarios
- Component behavior consistency

### Property-Based Testing Configuration

**Library**: Use `fast-check` for TypeScript/React property-based testing

**Configuration**:
- Minimum 100 iterations per property test
- Each test tagged with feature name and property number
- Tag format: `Feature: product-image-placeholder, Property {N}: {description}`

**Test Organization**:
```
__tests__/
  components/
    dashboard/
      product-image.unit.test.tsx        # Unit tests
      product-image.property.test.tsx    # Property tests
  lib/
    utils/
      image-validation.unit.test.ts      # Unit tests
      image-validation.property.test.ts  # Property tests
```

### Unit Test Examples

**Component Rendering Tests**:
```typescript
describe('ProductImage Component', () => {
  it('should render placeholder for null image_url', () => {
    render(<ProductImage imageUrl={null} productName="Test" />);
    expect(screen.getByAltText('Sin imagen')).toBeInTheDocument();
  });

  it('should render actual image for valid URL', () => {
    render(<ProductImage imageUrl="https://example.com/image.jpg" productName="Test" />);
    expect(screen.getByAltText('Test')).toHaveAttribute('src', expect.stringContaining('image.jpg'));
  });

  it('should render placeholder on image load error', () => {
    const { rerender } = render(
      <ProductImage imageUrl="https://example.com/broken.jpg" productName="Test" />
    );
    
    // Simulate image load error
    fireEvent.error(screen.getByRole('img'));
    
    expect(screen.getByAltText('Sin imagen')).toBeInTheDocument();
  });
});
```

**Integration Tests**:
```typescript
describe('Product Listing Integration', () => {
  it('should display placeholder for products without images', async () => {
    const products = [
      { id: '1', name: 'Product 1', image_url: null },
      { id: '2', name: 'Product 2', image_url: '' },
    ];
    
    render(<ProductsPage products={products} />);
    
    const placeholders = screen.getAllByAltText('Sin imagen');
    expect(placeholders).toHaveLength(2);
  });
});
```

### Property-Based Test Examples

**Property 1: Invalid URL Detection**
```typescript
// Feature: product-image-placeholder, Property 1: Invalid Image URL Detection
describe('Image URL Validation Properties', () => {
  it('should identify all invalid URLs as having no image', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant(null),
          fc.constant(undefined),
          fc.constant(''),
          fc.stringOf(fc.constantFrom(' ', '\t', '\n', '\r')),
        ),
        (invalidUrl) => {
          const result = isValidImageUrl(invalidUrl);
          expect(result).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

**Property 2: Placeholder Rendering**
```typescript
// Feature: product-image-placeholder, Property 2: Placeholder Rendering for Missing Images
describe('ProductImage Placeholder Properties', () => {
  it('should render placeholder for any product without valid image', () => {
    fc.assert(
      fc.property(
        fc.record({
          name: fc.string(),
          image_url: fc.oneof(
            fc.constant(null),
            fc.constant(''),
            fc.stringOf(fc.constantFrom(' ', '\t', '\n'))
          ),
        }),
        (product) => {
          const { container } = render(
            <ProductImage 
              imageUrl={product.image_url} 
              productName={product.name}
              width={100}
              height={100}
            />
          );
          
          const img = container.querySelector('img');
          expect(img?.src).toContain('placeholder.jpg');
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

**Property 3: Actual Image Rendering**
```typescript
// Feature: product-image-placeholder, Property 3: Actual Image Rendering for Valid URLs
describe('ProductImage Valid URL Properties', () => {
  it('should render actual image for any valid URL', () => {
    fc.assert(
      fc.property(
        fc.webUrl(),
        (validUrl) => {
          const { container } = render(
            <ProductImage 
              imageUrl={validUrl} 
              productName="Test Product"
              width={100}
              height={100}
            />
          );
          
          const img = container.querySelector('img');
          expect(img?.src).toContain(encodeURIComponent(validUrl));
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

**Property 4: Error Handling**
```typescript
// Feature: product-image-placeholder, Property 4: Error Handling with Placeholder Fallback
describe('ProductImage Error Handling Properties', () => {
  it('should handle any image load error gracefully', () => {
    fc.assert(
      fc.property(
        fc.webUrl(),
        (imageUrl) => {
          const { container } = render(
            <ProductImage 
              imageUrl={imageUrl} 
              productName="Test"
              width={100}
              height={100}
            />
          );
          
          // Simulate load error
          const img = container.querySelector('img');
          fireEvent.error(img!);
          
          // Should not throw and should show placeholder
          expect(() => {
            const updatedImg = container.querySelector('img');
            expect(updatedImg?.src).toContain('placeholder.jpg');
          }).not.toThrow();
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Test Coverage Goals

- **Unit Test Coverage**: 100% of ProductImage component code
- **Property Test Coverage**: All validation and rendering logic
- **Integration Test Coverage**: All pages that display products
- **Edge Case Coverage**: All error scenarios and invalid inputs

### Testing Notes

- Property tests use `fast-check` generators to create comprehensive test inputs
- Each property test runs minimum 100 iterations to catch edge cases
- Unit tests focus on specific examples and React component behavior
- Integration tests verify consistent behavior across all product display pages
- Error handling tests verify graceful degradation without exceptions

## Implementation Notes

### Performance Considerations

1. **Lazy Loading**: Use Next.js Image default lazy loading for off-screen images
2. **Priority Loading**: Use `priority` prop for above-the-fold product images
3. **Responsive Sizing**: Use `sizes` prop to optimize image loading for different viewports
4. **Caching**: Leverage Next.js automatic image optimization and caching

### Accessibility

1. **Alt Text**: Always provide descriptive alt text
   - For products with images: Use product name
   - For placeholders: Use "Sin imagen" or "Imagen no disponible"
2. **Semantic HTML**: Use proper image elements, not background images
3. **Keyboard Navigation**: Ensure images don't interfere with keyboard navigation

### Migration Strategy

**Phase 1**: Create ProductImage component
1. Implement component with all validation logic
2. Write comprehensive tests
3. Verify component works in isolation

**Phase 2**: Update product listing page
1. Replace existing image rendering with ProductImage
2. Test thoroughly
3. Deploy and monitor

**Phase 3**: Update remaining pages
1. Sales forms
2. Purchase orders
3. Quotes
4. Product details
5. Any other product display locations

**Phase 4**: Cleanup
1. Remove old image rendering code
2. Update documentation
3. Final testing across all pages

### Future Enhancements

Potential improvements for future iterations:
1. **Custom Placeholders**: Support different placeholders per product category
2. **Image Optimization**: Add automatic image resizing and format conversion
3. **Lazy Loading Improvements**: Implement progressive image loading
4. **Error Reporting**: Add optional error reporting for broken images
5. **Image Variants**: Support multiple image sizes for different contexts
