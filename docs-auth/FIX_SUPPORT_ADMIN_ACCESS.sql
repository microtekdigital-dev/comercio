-- Fix: Permitir acceso completo al super admin basado en email
-- Ejecuta esto en Supabase SQL Editor

-- IMPORTANTE: Reemplaza 'tu-email@ejemplo.com' con tu email real
-- Este debe ser el mismo email que configuraste en NEXT_PUBLIC_SUPER_ADMIN_EMAIL

-- 1. Eliminar políticas existentes que causan conflicto
DROP POLICY IF EXISTS "Users can view their own tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Users can view messages from their tickets" ON public.support_messages;
DROP POLICY IF EXISTS "Admins can create messages in any ticket" ON public.support_messages;

-- 2. Crear nuevas políticas con acceso para super admin

-- Política para ver tickets (usuarios ven los suyos, super admin ve todos)
CREATE POLICY "Users and super admin can view tickets"
  ON public.support_tickets
  FOR SELECT
  USING (
    -- El usuario puede ver sus propios tickets
    auth.uid() = user_id
    -- O es un admin/owner de la empresa
    OR auth.uid() IN (
      SELECT p.id FROM public.profiles p
      WHERE p.role IN ('admin', 'owner')
      AND p.company_id = support_tickets.company_id
    )
    -- O es el super admin (por email)
    OR auth.email() = 'tu-email@ejemplo.com'
  );

-- Política para ver mensajes (usuarios ven los de sus tickets, super admin ve todos)
CREATE POLICY "Users and super admin can view messages"
  ON public.support_messages
  FOR SELECT
  USING (
    -- El usuario puede ver mensajes de sus tickets
    ticket_id IN (
      SELECT id FROM public.support_tickets 
      WHERE user_id = auth.uid()
    )
    -- O es un admin/owner de la empresa del ticket
    OR ticket_id IN (
      SELECT t.id FROM public.support_tickets t
      INNER JOIN public.profiles p ON p.company_id = t.company_id
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'owner')
    )
    -- O es el super admin (por email)
    OR auth.email() = 'tu-email@ejemplo.com'
  );

-- Política para que super admin pueda crear mensajes en cualquier ticket
CREATE POLICY "Super admin can create messages in any ticket"
  ON public.support_messages
  FOR INSERT
  WITH CHECK (
    -- Usuario normal: solo en sus propios tickets
    (
      auth.uid() = user_id
      AND ticket_id IN (
        SELECT id FROM public.support_tickets 
        WHERE user_id = auth.uid()
      )
    )
    -- O es el super admin
    OR auth.email() = 'tu-email@ejemplo.com'
  );

-- Política para que super admin pueda actualizar mensajes
CREATE POLICY "Super admin can update messages"
  ON public.support_messages
  FOR UPDATE
  USING (
    auth.uid() = user_id
    OR auth.email() = 'tu-email@ejemplo.com'
  );

-- 3. Verificar que las políticas se crearon correctamente
SELECT 
  '=== POLÍTICAS ACTUALIZADAS ===' as resultado,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename IN ('support_tickets', 'support_messages')
ORDER BY tablename, policyname;

-- 4. Probar acceso (esto debería mostrar todos los tickets si eres super admin)
SELECT 
  '=== PRUEBA DE ACCESO ===' as resultado,
  COUNT(*) as total_tickets_visibles
FROM support_tickets;

-- NOTA IMPORTANTE:
-- Después de ejecutar este script, reemplaza 'tu-email@ejemplo.com' 
-- con tu email real en las 4 políticas creadas arriba.
-- Puedes hacerlo con un simple Find & Replace en este archivo antes de ejecutarlo.
