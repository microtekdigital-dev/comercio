# 💬 Sistema de Chat de Soporte - Guía de Instalación

**Fecha:** 8 de Febrero 2026  
**Estado:** ✅ Listo para instalar

---

## 📋 Resumen

Sistema completo de chat de soporte integrado con Supabase Realtime que incluye:

- ✅ Chat en tiempo real
- ✅ Sistema de tickets
- ✅ Botón flotante en el dashboard
- ✅ Página completa de gestión de tickets
- ✅ Estadísticas de soporte
- ✅ Notificaciones de mensajes no leídos
- ✅ Categorías y prioridades
- ✅ Row Level Security (RLS)

---

## 🚀 Instalación Paso a Paso

### Paso 1: Crear las Tablas en Supabase

Ejecuta el script SQL en Supabase SQL Editor:

```bash
scripts/100_create_support_chat.sql
```

Este script crea:
- Tabla `support_tickets` - Tickets de soporte
- Tabla `support_messages` - Mensajes del chat
- Índices para performance
- Triggers para actualización automática
- Políticas RLS para seguridad
- Función de estadísticas
- Habilita Supabase Realtime

### Paso 2: Verificar la Instalación

Después de ejecutar el script, deberías ver:

```
✅ Sistema de chat de soporte creado exitosamente
```

Verifica que las tablas existan:
```sql
SELECT * FROM public.support_tickets LIMIT 1;
SELECT * FROM public.support_messages LIMIT 1;
```

### Paso 3: Agregar el Botón Flotante al Dashboard

Actualiza `app/dashboard/layout.tsx` para incluir el botón flotante:

```typescript
import { SupportChatButton } from "@/components/dashboard/support-chat-button";
import { getUnreadMessageCount } from "@/lib/actions/support";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // ... código existente ...
  
  const unreadCount = await getUnreadMessageCount();

  return (
    <SubscriptionGuard subscriptionStatus={subscriptionStatus} userRole={profile?.role || null}>
      <div className="min-h-screen flex flex-col md:flex-row">
        <DashboardSidebarServer />
        <div className="flex-1 flex flex-col">
          <DashboardHeader />
          <main className="flex-1 bg-muted/30 overflow-x-hidden">
            {children}
          </main>
        </div>
        <Toaster position="top-right" richColors />
        
        {/* Botón flotante de soporte */}
        <SupportChatButton unreadCount={unreadCount} />
      </div>
    </SubscriptionGuard>
  );
}
```

### Paso 4: Agregar Enlace en el Sidebar

Actualiza `components/dashboard/sidebar.tsx` para agregar el enlace de soporte:

```typescript
import { MessageCircle } from "lucide-react";

const navigation = [
  // ... enlaces existentes ...
  {
    name: "Soporte",
    href: "/dashboard/support",
    icon: MessageCircle,
  },
];

// Para admins, agregar también:
const adminNavigation = [
  {
    name: "Soporte Admin",
    href: "/dashboard/admin/support",
    icon: MessageCircle,
  },
];
```

---

## 📍 Dónde Ver y Responder los Mensajes

### Panel de Administración

**URL:** `/dashboard/admin/support`

Como administrador, puedes:
- ✅ Ver todos los tickets de todos los usuarios
- ✅ Responder en tiempo real
- ✅ Cambiar el estado de los tickets (Abierto → En Progreso → Resuelto → Cerrado)
- ✅ Ver información del usuario y empresa
- ✅ Filtrar por estado
- ✅ Recibir mensajes en tiempo real

### Acceso al Panel de Admin

Solo usuarios con rol `admin` o `owner` pueden acceder. El sistema verifica automáticamente y redirige si no tienes permisos.

### Flujo de Trabajo Recomendado

1. Usuario crea ticket desde el botón flotante
2. Admin recibe notificación (aparece en `/dashboard/admin/support`)
3. Admin cambia estado a "En Progreso"
4. Admin responde al usuario
5. Usuario recibe respuesta en tiempo real
6. Admin marca como "Resuelto" cuando termina
7. Usuario puede cerrar el ticket

---

## 📁 Archivos Creados

### Scripts SQL
- `scripts/100_create_support_chat.sql` - Creación de tablas y configuración

### Types
- `lib/types/support.ts` - Tipos TypeScript para el sistema

### Server Actions
- `lib/actions/support.ts` - Acciones del servidor (crear tickets, enviar mensajes, etc.)

### Componentes
- `components/dashboard/support-chat-button.tsx` - Botón flotante
- `components/dashboard/support-chat-widget.tsx` - Widget del chat (tiempo real)
- `components/dashboard/support-stats-cards.tsx` - Tarjetas de estadísticas
- `components/dashboard/support-tickets-list.tsx` - Lista de tickets

### Páginas
- `app/dashboard/support/page.tsx` - Página principal de soporte

---

## 🎨 Características del Sistema

### Para Usuarios

1. **Botón Flotante**
   - Siempre visible en el dashboard
   - Muestra contador de mensajes no leídos
   - Abre el widget de chat

2. **Widget de Chat**
   - Lista de tickets
   - Chat en tiempo real
   - Crear nuevos tickets
   - Cerrar tickets resueltos

3. **Página de Soporte**
   - Vista completa de todos los tickets
   - Estadísticas de soporte
   - Filtros y búsqueda

### Para Administradores

Los administradores pueden:
- Ver todos los tickets de todas las empresas
- Responder a cualquier ticket
- Asignar tickets a otros admins
- Ver estadísticas globales

---

## 🔒 Seguridad (RLS)

El sistema incluye políticas de seguridad:

- ✅ Los usuarios solo ven sus propios tickets
- ✅ Los admins ven todos los tickets
- ✅ Los mensajes están protegidos por ticket
- ✅ Solo el creador puede cerrar su ticket
- ✅ Los admins pueden responder en cualquier ticket

---

## 🔄 Tiempo Real

El sistema usa Supabase Realtime para:

- Nuevos mensajes aparecen instantáneamente
- No necesita recargar la página
- Notificaciones en tiempo real
- Sincronización automática

---

## 📊 Estadísticas Disponibles

El sistema calcula automáticamente:

- Total de tickets
- Tickets abiertos
- Tickets en progreso
- Tickets resueltos/cerrados
- Tiempo promedio de respuesta

---

## 🎯 Categorías de Tickets

- **General** - Consultas generales
- **Técnico** - Problemas técnicos
- **Facturación** - Temas de pagos y planes
- **Solicitud de Función** - Nuevas características
- **Bug** - Reportar errores

---

## 🚦 Prioridades

- **Baja** - No urgente
- **Media** - Normal (por defecto)
- **Alta** - Importante
- **Urgente** - Requiere atención inmediata

---

## 🔧 Personalización

### Cambiar Colores del Chat

Edita `components/dashboard/support-chat-widget.tsx`:

```typescript
// Mensajes del usuario
className="bg-primary text-primary-foreground"

// Mensajes del staff
className="bg-muted"
```

### Agregar Más Categorías

Actualiza el enum en `scripts/100_create_support_chat.sql`:

```sql
category TEXT DEFAULT 'general' CHECK (category IN ('general', 'technical', 'billing', 'feature_request', 'bug', 'nueva_categoria'))
```

Y en `lib/types/support.ts`:

```typescript
export type TicketCategory = 'general' | 'technical' | 'billing' | 'feature_request' | 'bug' | 'nueva_categoria';
```

---

## 🐛 Troubleshooting

### El chat no se actualiza en tiempo real

1. Verifica que Realtime esté habilitado en Supabase
2. Revisa que las tablas estén en la publicación:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_messages;
```

### Error de permisos (RLS)

Verifica que las políticas RLS estén activas:
```sql
SELECT * FROM pg_policies WHERE tablename IN ('support_tickets', 'support_messages');
```

### Los mensajes no se guardan

Revisa los logs del servidor y verifica que el usuario esté autenticado.

---

## 📈 Próximas Mejoras

Ideas para expandir el sistema:

- [ ] Adjuntar archivos a los tickets
- [ ] Notificaciones por email
- [ ] Panel de admin dedicado
- [ ] Búsqueda y filtros avanzados
- [ ] Etiquetas personalizadas
- [ ] Integración con Slack/Discord
- [ ] Chatbot con IA
- [ ] Encuestas de satisfacción

---

## ✅ Checklist de Instalación

- [ ] Ejecutar `scripts/100_create_support_chat.sql` en Supabase
- [ ] Verificar que las tablas se crearon correctamente
- [ ] Agregar `SupportChatButton` al layout del dashboard
- [ ] Agregar enlace "Soporte" al sidebar
- [ ] Probar crear un ticket
- [ ] Probar enviar mensajes
- [ ] Verificar que el tiempo real funciona
- [ ] Probar cerrar un ticket

---

## 🎉 ¡Listo!

Tu sistema de chat de soporte está instalado y funcionando. Los usuarios ahora pueden:

1. Hacer clic en el botón flotante 💬
2. Crear tickets de soporte
3. Chatear en tiempo real
4. Ver el historial de tickets
5. Recibir ayuda rápidamente

**¡Disfruta de tu nuevo sistema de soporte!** 🚀
