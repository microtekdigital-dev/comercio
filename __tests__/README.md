# Tests para Sistema de Variantes de Productos

Este directorio contiene los tests para el sistema de variantes de productos (tallas) para tiendas de ropa.

## Estructura de Tests

```
__tests__/
├── setup.ts                                    # Configuración global de tests
├── lib/
│   └── actions/
│       ├── product-variants.property.test.ts  # Property-based tests
│       └── product-variants.unit.test.ts      # Unit tests
└── README.md                                   # Este archivo
```

## Tipos de Tests

### Property-Based Tests (PBT)
Los property-based tests verifican propiedades universales del sistema usando generación automática de datos de prueba con `fast-check`.

**Propiedades probadas:**
- **Property 1**: Stock total es suma de variantes
- **Property 4**: Tipos predefinidos crean todas las variantes

### Unit Tests
Los unit tests verifican ejemplos específicos y casos edge.

**Casos probados:**
- Crear variantes tipo shirts (7 variantes)
- Crear variantes tipo pants (10 variantes)
- Crear variantes custom
- Actualizar stock de variante
- Eliminar variante con stock = 0 (éxito)
- Eliminar variante con stock > 0 (error)
- Validación de nombres únicos
- Validación de stock no negativo

## Instalación

Para ejecutar los tests, primero instala las dependencias necesarias:

```bash
npm install --save-dev vitest fast-check @vitest/ui @types/node
```

O con pnpm:

```bash
pnpm add -D vitest fast-check @vitest/ui @types/node
```

## Ejecución de Tests

### Ejecutar todos los tests
```bash
npm test
```

### Ejecutar tests en modo watch
```bash
npm test -- --watch
```

### Ejecutar tests con UI
```bash
npm test -- --ui
```

### Ejecutar solo property tests
```bash
npm test -- product-variants.property
```

### Ejecutar solo unit tests
```bash
npm test -- product-variants.unit
```

### Generar reporte de cobertura
```bash
npm test -- --coverage
```

## Configuración

La configuración de vitest se encuentra en `vitest.config.ts` en la raíz del proyecto.

### Configuración de fast-check

Los property tests están configurados para ejecutar:
- **100 iteraciones mínimas** por propiedad
- Modo verbose para debugging
- Seed basado en timestamp para reproducibilidad

## Scripts de package.json

Agrega estos scripts a tu `package.json`:

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

## Debugging

### Ver detalles de un test fallido
```bash
npm test -- --reporter=verbose
```

### Ejecutar un test específico
```bash
npm test -- -t "Property 1"
```

### Modo debug con breakpoints
```bash
node --inspect-brk ./node_modules/.bin/vitest
```

## Integración Continua

Para CI/CD, usa:

```bash
npm test -- --run --coverage
```

Esto ejecuta los tests una sola vez (sin watch mode) y genera reporte de cobertura.

## Notas Importantes

1. **Mocking de Supabase**: Los tests actuales son tests de lógica pura. Para tests de integración con Supabase, necesitarás configurar mocks o una base de datos de prueba.

2. **Property-Based Testing**: Los PBT pueden encontrar casos edge que no consideraste. Si un test falla, el framework te mostrará el caso específico que causó el fallo.

3. **Cobertura**: Apunta a >80% de cobertura de código para funciones críticas.

4. **Mantenimiento**: Actualiza los tests cuando cambies la lógica de negocio.

## Recursos

- [Vitest Documentation](https://vitest.dev/)
- [fast-check Documentation](https://fast-check.dev/)
- [Property-Based Testing Guide](https://fast-check.dev/docs/introduction/)

## Troubleshooting

### Error: Cannot find module '@/lib/types/erp'
Asegúrate de que el path alias `@` está configurado en `vitest.config.ts` y `tsconfig.json`.

### Tests muy lentos
Reduce `numRuns` en la configuración de fast-check para desarrollo rápido, pero mantenlo en 100+ para CI.

### Errores de tipos TypeScript
Verifica que `@types/node` esté instalado y que `tsconfig.json` incluya los archivos de test.
