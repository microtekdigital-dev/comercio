# Fix: URL del Email de Bienvenida

## Problema
El email de bienvenida enviaba a los usuarios a `https://vsbet.help/dashboard` en lugar de `https://www.negociopymes.com.ar/dashboard`.

## Causa
La URL del botón "Ir al Dashboard" en el email de bienvenida usaba la variable de entorno `NEXT_PUBLIC_APP_URL` que no estaba configurada correctamente, o usaba un fallback incorrecto.

## Solución Implementada

### 1. Actualización del Template de Email (`lib/email/resend.ts`)

**Antes:**
```typescript
href="${process.env.NEXT_PUBLIC_APP_URL || 'https://tu-dominio.com'}/dashboard"
```

**Después:**
```typescript
href="${process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://www.negociopymes.com.ar'}/dashboard"
```

**Cambios:**
- Prioriza `NEXT_PUBLIC_SITE_URL` (variable ya existente en el proyecto)
- Fallback a `NEXT_PUBLIC_APP_URL` como segunda opción
- Fallback final a `https://www.negociopymes.com.ar` (URL correcta de producción)

### 2. Actualización de Variables de Entorno

**Archivo `.env.local`:**
```env
NEXT_PUBLIC_SITE_URL=https://www.negociopymes.com.ar
NEXT_PUBLIC_APP_URL=https://www.negociopymes.com.ar
```

**Archivo `.env.example`:**
```env
NEXT_PUBLIC_SITE_URL=https://www.negociopymes.com.ar
NEXT_PUBLIC_APP_URL=https://www.negociopymes.com.ar
```

## Verificación

Para verificar que el cambio funciona correctamente:

1. Registrar un nuevo usuario
2. Revisar el email de bienvenida recibido
3. Hacer click en el botón "Ir al Dashboard"
4. Verificar que redirige a `https://www.negociopymes.com.ar/dashboard`

## Notas Importantes

- **Producción**: Asegúrate de que las variables de entorno en Vercel estén configuradas correctamente:
  - `NEXT_PUBLIC_SITE_URL=https://www.negociopymes.com.ar`
  - `NEXT_PUBLIC_APP_URL=https://www.negociopymes.com.ar`

- **Desarrollo Local**: Para desarrollo local, puedes usar:
  - `NEXT_PUBLIC_SITE_URL=http://localhost:3000`
  - `NEXT_PUBLIC_APP_URL=http://localhost:3000`

## Archivos Modificados

1. `lib/email/resend.ts` - Template del email de bienvenida
2. `.env.local` - Variables de entorno locales
3. `.env.example` - Ejemplo de variables de entorno

## Deployment

Después de hacer push de estos cambios:

1. Verificar que las variables de entorno en Vercel estén correctas
2. Hacer redeploy si es necesario
3. Probar con un nuevo registro

## Fecha
17 de febrero de 2026
