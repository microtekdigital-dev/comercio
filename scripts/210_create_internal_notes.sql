-- ============================================================================
-- SISTEMA DE NOTAS INTERNAS
-- ============================================================================
-- Este script crea la tabla y configuración necesaria para el sistema de
-- notas internas del dashboard, con soporte para Realtime y RLS multi-tenant
-- ============================================================================

-- 1. Tabla de notas internas
CREATE TABLE IF NOT EXISTS public.internal_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (length(trim(content)) > 0),
  note_type TEXT NOT NULL CHECK (note_type IN ('general', 'cliente', 'stock', 'proveedor', 'urgente')),
  is_resolved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Índices para optimizar queries
CREATE INDEX IF NOT EXISTS idx_internal_notes_company_id 
  ON public.internal_notes(company_id);

CREATE INDEX IF NOT EXISTS idx_internal_notes_created_at 
  ON public.internal_notes(company_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_internal_notes_is_resolved 
  ON public.internal_notes(company_id, is_resolved);

CREATE INDEX IF NOT EXISTS idx_internal_notes_note_type 
  ON public.internal_notes(company_id, note_type);

-- 3. Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION public.update_internal_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_internal_notes_updated_at
  BEFORE UPDATE ON public.internal_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_internal_notes_updated_at();

-- 4. Row Level Security (RLS)
ALTER TABLE public.internal_notes ENABLE ROW LEVEL SECURITY;

-- Política SELECT: Los usuarios pueden ver notas de su empresa
CREATE POLICY "Users can view notes from their company"
  ON public.internal_notes
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id 
      FROM public.company_users 
      WHERE user_id = auth.uid()
    )
  );

-- Política INSERT: Los usuarios pueden crear notas para su empresa
CREATE POLICY "Users can create notes for their company"
  ON public.internal_notes
  FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id 
      FROM public.company_users 
      WHERE user_id = auth.uid()
    )
    AND user_id = auth.uid()
  );

-- Política UPDATE: Los usuarios pueden actualizar sus propias notas o admins pueden actualizar cualquiera
CREATE POLICY "Users can update their own notes or admins can update any"
  ON public.internal_notes
  FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id 
      FROM public.company_users 
      WHERE user_id = auth.uid()
    )
    AND (
      user_id = auth.uid()
      OR EXISTS (
        SELECT 1 
        FROM public.company_users
        WHERE user_id = auth.uid()
          AND company_id = internal_notes.company_id
          AND role = 'admin'
      )
    )
  );

-- Política DELETE: Los usuarios pueden eliminar sus propias notas o admins pueden eliminar cualquiera
CREATE POLICY "Users can delete their own notes or admins can delete any"
  ON public.internal_notes
  FOR DELETE
  USING (
    company_id IN (
      SELECT company_id 
      FROM public.company_users 
      WHERE user_id = auth.uid()
    )
    AND (
      user_id = auth.uid()
      OR EXISTS (
        SELECT 1 
        FROM public.company_users
        WHERE user_id = auth.uid()
          AND company_id = internal_notes.company_id
          AND role = 'admin'
      )
    )
  );

-- 5. Habilitar Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.internal_notes;

-- 6. Comentarios para documentación
COMMENT ON TABLE public.internal_notes IS 'Notas internas del equipo para comunicación y recordatorios';
COMMENT ON COLUMN public.internal_notes.note_type IS 'Tipo de nota: general, cliente, stock, proveedor, urgente';
COMMENT ON COLUMN public.internal_notes.is_resolved IS 'Indica si la nota ha sido marcada como resuelta/completada';
COMMENT ON COLUMN public.internal_notes.content IS 'Contenido de la nota (no puede estar vacío)';

-- 7. Verificación final
SELECT 
  '=== TABLA CREADA ===' as info,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'internal_notes') as internal_notes_table;

SELECT 
  '=== ÍNDICES CREADOS ===' as info,
  COUNT(*) as total_indices
FROM pg_indexes 
WHERE tablename = 'internal_notes';

SELECT 
  '=== POLÍTICAS RLS ===' as info,
  COUNT(*) as total_policies
FROM pg_policies 
WHERE tablename = 'internal_notes';

SELECT 
  '=== TRIGGER CREADO ===' as info,
  COUNT(*) as total_triggers
FROM pg_trigger 
WHERE tgname = 'update_internal_notes_updated_at';

SELECT '✅ Sistema de notas internas creado exitosamente' as resultado;
