# 💬 Chat de Soporte - Inicio Rápido

## 🚀 Instalación en 3 Pasos

### 1. Ejecuta el Script SQL
```bash
# En Supabase SQL Editor, ejecuta:
scripts/100_create_support_chat.sql
```

### 2. Agrega el Botón al Dashboard
En `app/dashboard/layout.tsx`, agrega al final (antes del cierre de `</SubscriptionGuard>`):

```typescript
import { SupportChatButton } from "@/components/dashboard/support-chat-button";
import { getUnreadMessageCount } from "@/lib/actions/support";

// Dentro de la función:
const unreadCount = await getUnreadMessageCount();

// En el JSX, antes de </div>:
<SupportChatButton unreadCount={unreadCount} />
```

### 3. Agrega el Enlace al Sidebar
En `components/dashboard/sidebar.tsx`:

```typescript
import { MessageCircle } from "lucide-react";

// Agrega al array de navigation:
{
  name: "Soporte",
  href: "/dashboard/support",
  icon: MessageCircle,
}
```

## ✅ ¡Listo!

Ahora tienes:
- 💬 Botón flotante de chat
- 📝 Sistema de tickets
- ⚡ Tiempo real con Supabase
- 📊 Estadísticas de soporte
- 👨‍💼 Panel de admin para responder

## 📍 Dónde Ver y Responder Mensajes

### Como Administrador:
Ve a: **`/dashboard/admin/support`**

Ahí podrás:
- Ver todos los tickets de todos los usuarios
- Responder mensajes en tiempo real
- Cambiar el estado de los tickets
- Ver información del usuario y empresa

### Agregar Enlace al Sidebar (Solo para Admins):
```typescript
{
  name: "Soporte Admin",
  href: "/dashboard/admin/support",
  icon: MessageCircle,
  // Solo mostrar para admins
}
```

**Documentación completa:** `docs-auth/SUPPORT_CHAT_SETUP.md`
