# Solución: Error "Unable to exchange external code" en Google OAuth

## El Problema

El error que estás viendo en la URL:
```
error=server_error&error_code=500&error_description=Unable+to+exchange+external+code
```

**NO es un problema de base de datos**. Tu base de datos está perfecta (suscripción activa, company_id correcto, etc.).

**ES un problema de configuración en Google Cloud Console**. La URL de redirección (redirect URI) no coincide con la configurada en tu aplicación OAuth de Google.

## Solución: Configurar Google Cloud Console

### Paso 1: Obtener la URL de Callback de Supabase

1. Ve a tu proyecto en Supabase Dashboard
2. Ve a **Authentication** → **Providers**
3. Busca **Google** en la lista
4. Copia la URL que dice **"Callback URL (for OAuth)"**
   - Debería verse algo así: `https://[tu-proyecto].supabase.co/auth/v1/callback`

### Paso 2: Ir a Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Selecciona tu proyecto (o créalo si no existe)
3. En el menú lateral, ve a **APIs & Services** → **Credentials**

### Paso 3: Configurar OAuth 2.0 Client ID

#### Si ya tienes un OAuth Client ID:

1. Busca tu **OAuth 2.0 Client ID** en la lista
2. Haz clic en el nombre para editarlo
3. En la sección **"Authorized redirect URIs"**, agrega estas URLs:
   ```
   https://[tu-proyecto].supabase.co/auth/v1/callback
   https://www.negociopymes.com.ar/auth/callback
   https://negociopymes.com.ar/auth/callback
   ```
   **IMPORTANTE**: Reemplaza `[tu-proyecto]` con el nombre real de tu proyecto Supabase

4. Haz clic en **Save**

#### Si NO tienes un OAuth Client ID:

1. Haz clic en **"+ CREATE CREDENTIALS"**
2. Selecciona **"OAuth client ID"**
3. Si te pide configurar la pantalla de consentimiento, hazlo primero:
   - Application type: **External**
   - App name: **NegocioPymes** (o el nombre que prefieras)
   - User support email: tu email
   - Developer contact: tu email
   - Guarda y continúa
4. Vuelve a **Credentials** → **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
5. Application type: **Web application**
6. Name: **NegocioPymes Web Client** (o el nombre que prefieras)
7. En **"Authorized redirect URIs"**, agrega:
   ```
   https://[tu-proyecto].supabase.co/auth/v1/callback
   https://www.negociopymes.com.ar/auth/callback
   https://negociopymes.com.ar/auth/callback
   ```
8. Haz clic en **Create**
9. **IMPORTANTE**: Copia el **Client ID** y **Client Secret** que aparecen

### Paso 4: Configurar Supabase con las Credenciales de Google

1. Ve a Supabase Dashboard
2. Ve a **Authentication** → **Providers**
3. Busca **Google** y haz clic para expandir
4. Activa el toggle **"Enable Sign in with Google"**
5. Pega el **Client ID** de Google
6. Pega el **Client Secret** de Google
7. Haz clic en **Save**

### Paso 5: Esperar Propagación

Los cambios en Google Cloud Console pueden tardar **5-10 minutos** en propagarse.

### Paso 6: Probar el Login

1. Cierra todas las pestañas de tu aplicación
2. Abre una nueva pestaña en modo incógnito (Ctrl+Shift+N)
3. Ve a tu aplicación: https://www.negociopymes.com.ar
4. Intenta hacer login con Google
5. Deberías poder acceder sin problemas

## Verificación de URLs Correctas

### URLs que DEBES tener en Google Cloud Console:

```
✓ https://[proyecto-supabase].supabase.co/auth/v1/callback
✓ https://www.negociopymes.com.ar/auth/callback
✓ https://negociopymes.com.ar/auth/callback
```

### URLs comunes que causan errores:

```
✗ http://localhost:3000/auth/callback (solo para desarrollo local)
✗ https://negociopymes.com.ar (sin /auth/callback)
✗ URLs con espacios o caracteres especiales
```

## Cómo Encontrar el Nombre de tu Proyecto Supabase

Si no sabes cuál es `[tu-proyecto]` en la URL de Supabase:

1. Ve a Supabase Dashboard
2. Mira la URL del navegador, debería ser algo como:
   ```
   https://supabase.com/dashboard/project/[ID-DEL-PROYECTO]
   ```
3. O ve a **Settings** → **General** → **Reference ID**
4. La URL de callback será:
   ```
   https://[REFERENCE-ID].supabase.co/auth/v1/callback
   ```

## Problemas Comunes

### "Aún no funciona después de 10 minutos"

1. Verifica que las URLs estén escritas EXACTAMENTE como se muestran arriba
2. No debe haber espacios al inicio o final
3. Debe incluir `https://` (no `http://`)
4. Debe terminar en `/auth/v1/callback` para Supabase

### "Error: redirect_uri_mismatch"

Este error significa que la URL no coincide. Verifica:
1. Que hayas guardado los cambios en Google Cloud Console
2. Que la URL esté escrita correctamente (sin espacios, con https://)
3. Que hayas esperado 5-10 minutos para la propagación

### "No encuentro mi OAuth Client ID"

1. Ve a Google Cloud Console
2. Asegúrate de estar en el proyecto correcto (arriba a la izquierda)
3. Ve a **APIs & Services** → **Credentials**
4. Busca en la sección **"OAuth 2.0 Client IDs"**

## Alternativa: Usar Email/Password

Si necesitas acceso urgente mientras configuras Google OAuth:

1. Ve a la página de registro
2. Usa **"Registrarse con Email"** en lugar de Google
3. Crea una cuenta con email y contraseña
4. Podrás acceder inmediatamente

Luego puedes vincular tu cuenta de Google más tarde.

## Resumen

El problema NO está en tu base de datos (que está perfecta), sino en la configuración de Google Cloud Console.

**Pasos clave:**
1. ✓ Obtener URL de callback de Supabase
2. ✓ Agregar URL en Google Cloud Console → Credentials → OAuth Client ID
3. ✓ Configurar Client ID y Secret en Supabase
4. ✓ Esperar 5-10 minutos
5. ✓ Probar login en modo incógnito

## ¿Necesitas Ayuda?

Si después de seguir estos pasos aún no funciona, comparte:
1. Captura de pantalla de las "Authorized redirect URIs" en Google Cloud Console
2. Captura de pantalla de la configuración de Google en Supabase
3. El error exacto que aparece en la URL
