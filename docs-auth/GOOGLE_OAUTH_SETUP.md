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

En tu archivo `.env.local`, asegúrate de tener:

```env
NEXT_PUBLIC_SUPABASE_URL=https://[TU-PROYECTO-REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000/dashboard
```

Para producción, actualiza la URL de redirección:

```env
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=https://tudominio.com/dashboard
```

### 5. Configurar Site URL en Supabase

1. En Supabase Dashboard, ve a **Authentication** > **URL Configuration**
2. Configura:
   - **Site URL**: `http://localhost:3000` (desarrollo) o `https://tudominio.com` (producción)
   - **Redirect URLs**: Agrega las URLs permitidas:
     - `http://localhost:3000/**`
     - `https://tudominio.com/**`

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

## Referencias

- [Supabase Auth with Google](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
