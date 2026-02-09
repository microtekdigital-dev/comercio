-- ============================================================================
-- SISTEMA DE CHAT DE SOPORTE
-- ============================================================================
-- Este script crea las tablas necesarias para un sistema de chat de soporte
-- integrado con Supabase Realtime
-- ============================================================================

-- 1. Tabla de tickets de soporte
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  category TEXT DEFAULT 'general' CHECK (category IN ('general', 'technical', 'billing', 'feature_request', 'bug')),
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ
);

-- 2. Tabla de mensajes del chat
CREATE TABLE IF NOT EXISTS public.support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_staff BOOLEAN NOT NULL DEFAULT false,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_support_tickets_company ON public.support_tickets(company_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON public.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned ON public.support_tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created ON public.support_tickets(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_support_messages_ticket ON public.support_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_user ON public.support_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_created ON public.support_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_support_messages_unread ON public.support_messages(is_read) WHERE is_read = false;

-- 4. Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION public.update_support_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_support_updated_at();

CREATE TRIGGER update_support_messages_updated_at
  BEFORE UPDATE ON public.support_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_support_updated_at();

-- 5. Trigger para actualizar el ticket cuando hay un nuevo mensaje
CREATE OR REPLACE FUNCTION public.update_ticket_on_new_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.support_tickets
  SET updated_at = NOW()
  WHERE id = NEW.ticket_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ticket_on_message
  AFTER INSERT ON public.support_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_ticket_on_new_message();

-- 6. Row Level Security (RLS)
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- Políticas para support_tickets
-- Los usuarios pueden ver sus propios tickets
CREATE POLICY "Users can view their own tickets"
  ON public.support_tickets
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR auth.uid() IN (
      SELECT id FROM public.profiles WHERE role IN ('admin', 'owner')
    )
  );

-- Los usuarios pueden crear tickets
CREATE POLICY "Users can create tickets"
  ON public.support_tickets
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Los usuarios pueden actualizar sus propios tickets
CREATE POLICY "Users can update their own tickets"
  ON public.support_tickets
  FOR UPDATE
  USING (
    auth.uid() = user_id
    OR auth.uid() IN (
      SELECT id FROM public.profiles WHERE role IN ('admin', 'owner')
    )
  );

-- Políticas para support_messages
-- Los usuarios pueden ver mensajes de sus tickets
CREATE POLICY "Users can view messages from their tickets"
  ON public.support_messages
  FOR SELECT
  USING (
    ticket_id IN (
      SELECT id FROM public.support_tickets 
      WHERE user_id = auth.uid()
    )
    OR auth.uid() IN (
      SELECT id FROM public.profiles WHERE role IN ('admin', 'owner')
    )
  );

-- Los usuarios pueden crear mensajes en sus tickets
CREATE POLICY "Users can create messages in their tickets"
  ON public.support_messages
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND ticket_id IN (
      SELECT id FROM public.support_tickets 
      WHERE user_id = auth.uid()
    )
  );

-- Los admins pueden crear mensajes en cualquier ticket
CREATE POLICY "Admins can create messages in any ticket"
  ON public.support_messages
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE role IN ('admin', 'owner')
    )
  );

-- Los usuarios pueden actualizar sus propios mensajes
CREATE POLICY "Users can update their own messages"
  ON public.support_messages
  FOR UPDATE
  USING (auth.uid() = user_id);

-- 7. Habilitar Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_messages;

-- 8. Comentarios para documentación
COMMENT ON TABLE public.support_tickets IS 'Tickets de soporte creados por los usuarios';
COMMENT ON TABLE public.support_messages IS 'Mensajes del chat de soporte';

COMMENT ON COLUMN public.support_tickets.status IS 'Estado del ticket: open, in_progress, resolved, closed';
COMMENT ON COLUMN public.support_tickets.priority IS 'Prioridad: low, medium, high, urgent';
COMMENT ON COLUMN public.support_tickets.category IS 'Categoría: general, technical, billing, feature_request, bug';

-- 9. Función para obtener estadísticas de soporte
CREATE OR REPLACE FUNCTION public.get_support_stats(p_company_id UUID DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
  v_stats JSON;
BEGIN
  SELECT json_build_object(
    'total_tickets', COUNT(*),
    'open_tickets', COUNT(*) FILTER (WHERE status = 'open'),
    'in_progress_tickets', COUNT(*) FILTER (WHERE status = 'in_progress'),
    'resolved_tickets', COUNT(*) FILTER (WHERE status = 'resolved'),
    'closed_tickets', COUNT(*) FILTER (WHERE status = 'closed'),
    'avg_response_time_hours', AVG(
      EXTRACT(EPOCH FROM (
        SELECT MIN(created_at) 
        FROM public.support_messages sm 
        WHERE sm.ticket_id = st.id AND sm.is_staff = true
      ) - st.created_at) / 3600
    )
  ) INTO v_stats
  FROM public.support_tickets st
  WHERE p_company_id IS NULL OR st.company_id = p_company_id;
  
  RETURN v_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Verificación final
SELECT 
  '=== TABLAS CREADAS ===' as info,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'support_tickets') as support_tickets,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'support_messages') as support_messages;

SELECT 
  '=== ÍNDICES CREADOS ===' as info,
  COUNT(*) as total_indices
FROM pg_indexes 
WHERE tablename IN ('support_tickets', 'support_messages');

SELECT 
  '=== POLÍTICAS RLS ===' as info,
  COUNT(*) as total_policies
FROM pg_policies 
WHERE tablename IN ('support_tickets', 'support_messages');

SELECT '✅ Sistema de chat de soporte creado exitosamente' as resultado;
