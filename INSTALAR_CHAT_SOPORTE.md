# 💬 Instalar Chat de Soporte - 3 Pasos

## 1️⃣ Ejecuta el Script SQL
En Supabase SQL Editor:
```
scripts/100_create_support_chat.sql
```

## 2️⃣ Configura tu Email
En `.env.local`:
```bash
NEXT_PUBLIC_SUPER_ADMIN_EMAIL=tu-email@ejemplo.com
```

## 3️⃣ Agrega el Botón al Dashboard
En `app/dashboard/layout.tsx`, agrega estas líneas:

```typescript
// Al inicio del archivo
import { SupportChatButton } from "@/components/dashboard/support-chat-button";
import { getUnreadMessageCount } from "@/lib/actions/support";

// Dentro de la función, antes del return
const unreadCount = await getUnreadMessageCount();

// En el JSX, antes de </SubscriptionGuard>
<SupportChatButton unreadCount={unreadCount} />
```

## ✅ ¡Listo!

- **Usuarios:** Botón flotante 💬 en el dashboard
- **Tú:** Panel admin en `/dashboard/admin/support`

**Documentación completa:** `docs-auth/SUPPORT_CHAT_RESUMEN_FINAL.md`
