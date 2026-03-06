# Configuración de Google OAuth en Supabase

Este documento explica cómo configurar la autenticación con Google en tu proyecto de Supabase.

## Pasos de Configuración

### 1. Crear Credenciales en Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Navega a **APIs & Services** > **Credentials**
4. Haz clic en **Create Credentials** > **OAuth 2.0 Client ID**
5. Si es la primera vez, configura la pantalla de consentimiento OAuth:
   - Tipo de usuario: **External**
   - Nombre de la aplicación: Tu nombre de aplicación
   - Correo de soporte: Tu correo
   - Dominios autorizados: Tu dominio (opcional)
   - Correo de contacto del desarrollador: Tu correo

### 2. Configurar OAuth Client ID

1. Tipo de aplicación: **Web application**
2. Nombre: "Supabase Auth"
3. **Authorized JavaScript origins**:
   - `http://localhost:3000` (para desarrollo)
   - `https://tudominio.com` (para producción)
4. **Authorized redirect URIs**:
   - `https://[TU-PROYECTO-REF].supabase.co/auth/v1/callback`
   - Reemplaza `[TU-PROYECTO-REF]` con tu referencia de proyecto de Supabase

5. Guarda y copia:
   - **Client ID**
   - **Client Secret**

### 3. Configurar en Supabase Dashboard

1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com/)
2. Navega a **Authentication** > **Providers**
3. Busca **Google** en la lista de proveedores
4. Habilita el proveedor de Google
5. Pega las credenciales:
   - **Client ID**: El Client ID de Google
   - **Client Secret**: El Client Secret de Google
6. Guarda los cambios

### 4. Configurar URLs de Redirección

**IMPORTANTE**: La URL de callback de Google SIEMPRE debe apuntar a Supabase, no a tu dominio.

En tu archivo `.env.local`, asegúrate de tener:

```env
NEXT_PUBLIC_SUPABASE_URL=https://[TU-PROYECTO-REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Para producción:

```env
NEXT_PUBLIC_SUPABASE_URL=https://[TU-PROYECTO-REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
NEXT_PUBLIC_SITE_URL=https://tudominio.com
```

**NO uses** `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL` - esto causa el error de OAuth state parameter.

### 5. Configurar Site URL en Supabase

**CRÍTICO**: Esta configuración es la más importante para que OAuth funcione. El error `bad_oauth_callback` ocurre cuando estas URLs no están configuradas correctamente.

1. En Supabase Dashboard, ve a **Authentication** > **URL Configuration**
2. Configura **Site URL** (solo UNA URL principal):
   - Para producción: `https://www.negociopymes.com.ar`
   - Para desarrollo: `http://localhost:3000`

3. Configura **Redirect URLs** (agrega TODAS estas URLs, una por línea):
   ```
   http://localhost:3000/**
   https://negociopymes.com.ar/**
   https://www.negociopymes.com.ar/**
   https://www.negociopymes.com.ar/dashboard
   https://www.negociopymes.com.ar/auth/callback
   ```

4. **MUY IMPORTANTE**: 
   - Haz clic en "Save" después de agregar cada URL
   - Espera 2-3 minutos para que los cambios se propaguen
   - NO uses wildcards en Site URL, solo en Redirect URLs

### 6. Verificar Authorized Redirect URIs en Google Cloud Console

Vuelve a Google Cloud Console y verifica que tengas:

**Authorized redirect URIs**:
- `https://[TU-PROYECTO-REF].supabase.co/auth/v1/callback`

**NO agregues** tu dominio aquí. Google debe redirigir a Supabase, y Supabase redirige a tu dominio.

## Verificación

1. Inicia tu aplicación en modo desarrollo: `npm run dev`
2. Ve a la página de registro: `http://localhost:3000/auth/sign-up`
3. Haz clic en "Continuar con Google"
4. Deberías ser redirigido a la pantalla de consentimiento de Google
5. Después de autorizar, serás redirigido al dashboard

## Manejo de Usuarios OAuth

Cuando un usuario se registra con Google:

1. Supabase crea automáticamente un usuario en `auth.users`
2. El trigger `handle_new_user` se ejecuta automáticamente
3. Se crea un perfil en la tabla `profiles`
4. Se crea una empresa si no existe
5. Se asigna una suscripción de prueba

## Notas Importantes

- Los usuarios de Google OAuth no tienen contraseña en Supabase
- El email del usuario de Google se usa como identificador único
- Si un usuario ya existe con ese email (registro manual), Google OAuth fallará
- Para producción, asegúrate de verificar tu dominio en Google Cloud Console

## Solución de Problemas

### ⚠️ Error: "bad_oauth_callback" o "OAuth state parameter missing" (MÁS COMÚN EN PRODUCCIÓN)

**Síntoma**: Al hacer clic en "Continuar con Google", eres redirigido a tu dominio con el error:
```
https://www.negociopymes.com.ar/?error=invalid_request&error_code=bad_oauth_callback&error_description=OAuth+state+parameter+missing
```

**Causa**: Las URLs de redirección no están configuradas correctamente en Supabase.

**Solución paso a paso**:

1. **Ve a Supabase Dashboard**:
   - Abre [Supabase Dashboard](https://app.supabase.com/)
   - Selecciona tu proyecto
   - Ve a **Authentication** > **URL Configuration**

2. **Configura Site URL** (campo único):
   - Para producción: `https://www.negociopymes.com.ar`
   - **SIN barra final** (/)
   - Haz clic en "Save"

3. **Configura Redirect URLs** (lista de URLs permitidas):
   - Haz clic en "Add URL" para cada una de estas:
   ```
   http://localhost:3000/**
   https://negociopymes.com.ar/**
   https://www.negociopymes.com.ar/**
   https://www.negociopymes.com.ar/dashboard
   ```
   - Haz clic en "Save" después de agregar todas

4. **Verifica Google Cloud Console**:
   - Ve a [Google Cloud Console](https://console.cloud.google.com/)
   - Navega a **APIs & Services** > **Credentials**
   - Selecciona tu OAuth 2.0 Client ID
   - En **Authorized redirect URIs** debe estar:
     - `https://[TU-PROYECTO-REF].supabase.co/auth/v1/callback`
   - Encuentra tu `[TU-PROYECTO-REF]` en la URL de tu Supabase Dashboard
   - **NO agregues** `https://www.negociopymes.com.ar` aquí

5. **Verifica variables de entorno en producción**:
   - Si usas Vercel, ve a Settings > Environment Variables
   - Verifica que tengas:
     - `NEXT_PUBLIC_SUPABASE_URL` = tu URL de Supabase
     - `NEXT_PUBLIC_SITE_URL` = `https://www.negociopymes.com.ar`
   - **NO uses** `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL`
   - Redeploy después de cambiar variables

6. **Espera y prueba**:
   - Espera 2-3 minutos

1. **Verifica la URL de callback en Google Cloud Console**:
   - Ve a Google Cloud Console > Credentials > Tu OAuth Client
   - En "Authorized redirect URIs" debe estar SOLO:
     - `https://[TU-PROYECTO-REF].supabase.co/auth/v1/callback`
   - **NO agregues** tu dominio aquí (ni localhost ni producción)

2. **Verifica Site URL en Supabase**:
   - Ve a Supabase Dashboard > Authentication > URL Configuration
   - **Site URL** debe ser tu dominio de producción: `https://tudominio.com`
   - **Redirect URLs** debe incluir:
     - `http://localhost:3000/**`
     - `https://tudominio.com/**`
     - `https://www.tudominio.com/**` (si usas www)

3. **Verifica tus variables de entorno**:
   - NO uses `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL`
   - Usa solo: `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`

4. **Reinicia el servidor**:
   - Detén el servidor de desarrollo
   - Ejecuta `npm run dev` nuevamente
   - Prueba en ventana de incógnito

5. **Espera la propagación**:
   - Después de cambiar la configuración en Supabase, espera 2-3 minutos
   - Los cambios no son instantáneos

### Error: "Unsupported provider: provider is not enabled"

Este es el error más común. Sigue estos pasos en orden:

1. **Verifica que Google esté habilitado en Supabase**:
   - Ve a Supabase Dashboard > Authentication > Providers
   - Busca "Google" en la lista
   - Asegúrate de que el toggle esté en **ON** (verde)
   - Haz clic en "Save" aunque ya esté habilitado

2. **Verifica las credenciales**:
   - En el mismo panel de Google, verifica que:
     - Client ID esté completo (termina en `.apps.googleusercontent.com`)
     - Client Secret esté completo
   - Si hay algún espacio en blanco al inicio o final, elimínalo
   - Haz clic en "Save"

3. **Espera la propagación**:
   - Los cambios en Supabase pueden tardar 1-2 minutos en propagarse
   - Espera al menos 2 minutos después de guardar

4. **Verifica las variables de entorno**:
   - Abre tu archivo `.env.local`
   - Verifica que `NEXT_PUBLIC_SUPABASE_URL` sea correcta
   - Verifica que `NEXT_PUBLIC_SUPABASE_ANON_KEY` sea correcta
   - Reinicia el servidor de desarrollo después de cambiar variables de entorno

5. **Prueba en ventana de incógnito**:
   - Abre una ventana de incógnito/privada
   - Ve a la página de login
   - Intenta iniciar sesión con Google
   - Esto descarta problemas de caché

6. **Revisa la consola del navegador**:
   - Abre las herramientas de desarrollador (F12)
   - Ve a la pestaña "Console"
   - Intenta iniciar sesión con Google
   - Busca el mensaje "=== DIAGNÓSTICO GOOGLE OAUTH ==="
   - Copia toda la información y revísala

7. **Verifica la configuración de Site URL**:
   - Ve a Supabase Dashboard > Authentication > URL Configuration
   - Site URL debe ser: `http://localhost:3000` (desarrollo)
   - Redirect URLs debe incluir: `http://localhost:3000/**`

### Error: "redirect_uri_mismatch"
- Verifica que la URL de redirección en Google Cloud Console coincida exactamente con la de Supabase
- Formato correcto: `https://[TU-PROYECTO-REF].supabase.co/auth/v1/callback`

### Error: "Invalid redirect URL"
- Verifica que la URL esté en la lista de Redirect URLs permitidas en Supabase
- Asegúrate de que Site URL esté configurado correctamente

### El usuario no se crea correctamente
- Verifica que el trigger `handle_new_user` esté activo
- Revisa los logs de Supabase para ver errores en el trigger
- Asegúrate de que las tablas `profiles`, `companies` y `subscriptions` existan

### Código de Diagnóstico

El código actual incluye logs de diagnóstico en la consola del navegador. Cuando hagas clic en "Continuar con Google", verás:

```
=== DIAGNÓSTICO GOOGLE OAUTH ===
Supabase URL: https://xxxxx.supabase.co
Redirect URL: http://localhost:3000/dashboard
Window origin: http://localhost:3000
OAuth Response Data: {...}
OAuth Response Error: {...}
=== FIN DIAGNÓSTICO ===
```

Esta información es útil para identificar el problema. Comparte estos logs si necesitas ayuda adicional.

## Referencias

- [Supabase Auth with Google](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
