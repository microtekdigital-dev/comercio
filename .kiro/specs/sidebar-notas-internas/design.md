# Design Document: Sidebar de Notas Internas

## Overview

El sistema de notas internas se implementará como un sidebar flotante accesible desde cualquier página del dashboard. Utilizará Supabase Realtime para actualizaciones en tiempo real, RLS policies para seguridad multi-tenant, y componentes de shadcn/ui para mantener consistencia con el resto del ERP.

La arquitectura seguirá el patrón establecido en el proyecto: componentes React Server/Client, server actions para mutaciones, y optimistic updates para mejor UX.

## Architecture

### Component Structure

```
components/dashboard/
  ├── internal-notes-sidebar.tsx      (Client Component - Main sidebar)
  ├── internal-notes-button.tsx       (Client Component - Floating button)
  ├── internal-note-item.tsx          (Client Component - Individual note)
  ├── internal-note-form.tsx          (Client Component - Create note form)
  └── internal-notes-filters.tsx      (Client Component - Filter controls)

lib/actions/
  └── internal-notes.ts                (Server Actions)

lib/types/
  └── erp.ts                           (Add InternalNote types)

scripts/
  └── 210_create_internal_notes.sql   (Database schema)
```

### Data Flow

1. **Initial Load**: Sidebar opens → fetch notes via server action → display in UI
2. **Create Note**: User submits → optimistic update → server action → Realtime broadcast
3. **Real-time Updates**: Supabase Realtime → subscription callback → update UI state
4. **Mark Resolved**: User clicks → optimistic update → server action → Realtime broadcast
5. **Delete Note**: User clicks → optimistic update → server action → Realtime broadcast

### Technology Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **UI Components**: shadcn/ui (Button, Input, Select, Badge, ScrollArea, Separator, etc.)
- **Styling**: Tailwind CSS
- **Database**: Supabase PostgreSQL with RLS
- **Real-time**: Supabase Realtime subscriptions
- **State Management**: React hooks (useState, useEffect, useOptimistic)

## Components and Interfaces

### Database Schema

```sql
-- Table: internal_notes
CREATE TABLE internal_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (length(trim(content)) > 0),
  note_type TEXT NOT NULL CHECK (note_type IN ('general', 'cliente', 'stock', 'proveedor', 'urgente')),
  is_resolved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_internal_notes_company_id ON internal_notes(company_id);
CREATE INDEX idx_internal_notes_created_at ON internal_notes(company_id, created_at DESC);
CREATE INDEX idx_internal_notes_is_resolved ON internal_notes(company_id, is_resolved);

-- RLS Policies
ALTER TABLE internal_notes ENABLE ROW LEVEL SECURITY;

-- Users can view notes from their company
CREATE POLICY "Users can view notes from their company"
  ON internal_notes FOR SELECT
  USING (company_id IN (
    SELECT company_id FROM company_users WHERE user_id = auth.uid()
  ));

-- Users can create notes for their company
CREATE POLICY "Users can create notes for their company"
  ON internal_notes FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM company_users WHERE user_id = auth.uid()
    )
    AND user_id = auth.uid()
  );

-- Users can update their own notes or admins can update any
CREATE POLICY "Users can update their own notes or admins can update any"
  ON internal_notes FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM company_users WHERE user_id = auth.uid()
    )
    AND (
      user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM company_users
        WHERE user_id = auth.uid()
        AND company_id = internal_notes.company_id
        AND role = 'admin'
      )
    )
  );

-- Users can delete their own notes or admins can delete any
CREATE POLICY "Users can delete their own notes or admins can delete any"
  ON internal_notes FOR DELETE
  USING (
    company_id IN (
      SELECT company_id FROM company_users WHERE user_id = auth.uid()
    )
    AND (
      user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM company_users
        WHERE user_id = auth.uid()
        AND company_id = internal_notes.company_id
        AND role = 'admin'
      )
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_internal_notes_updated_at
  BEFORE UPDATE ON internal_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### TypeScript Types

```typescript
// Add to lib/types/erp.ts

export type NoteType = 'general' | 'cliente' | 'stock' | 'proveedor' | 'urgente';

export interface InternalNote {
  id: string;
  company_id: string;
  user_id: string;
  content: string;
  note_type: NoteType;
  is_resolved: boolean;
  created_at: string;
  updated_at: string;
  // Joined fields
  user_name?: string;
  user_email?: string;
}

export interface CreateInternalNoteInput {
  content: string;
  note_type: NoteType;
}

export interface UpdateInternalNoteInput {
  id: string;
  is_resolved?: boolean;
}

export interface InternalNotesFilters {
  note_type?: NoteType | 'all';
  show_resolved: boolean;
}
```

### Server Actions

```typescript
// lib/actions/internal-notes.ts

'use server'

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { CreateInternalNoteInput, UpdateInternalNoteInput, InternalNote } from '@/lib/types/erp';

export async function getInternalNotes(): Promise<InternalNote[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('internal_notes')
    .select(`
      *,
      profiles:user_id (
        full_name,
        email
      )
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data.map(note => ({
    ...note,
    user_name: note.profiles?.full_name || 'Usuario',
    user_email: note.profiles?.email
  }));
}

export async function createInternalNote(input: CreateInternalNoteInput) {
  const supabase = await createClient();
  
  // Get user's company_id
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const { data: companyUser } = await supabase
    .from('company_users')
    .select('company_id')
    .eq('user_id', user.id)
    .single();

  if (!companyUser) throw new Error('Usuario sin empresa');

  const { data, error } = await supabase
    .from('internal_notes')
    .insert({
      company_id: companyUser.company_id,
      user_id: user.id,
      content: input.content.trim(),
      note_type: input.note_type
    })
    .select(`
      *,
      profiles:user_id (
        full_name,
        email
      )
    `)
    .single();

  if (error) throw error;

  revalidatePath('/dashboard');
  
  return {
    ...data,
    user_name: data.profiles?.full_name || 'Usuario',
    user_email: data.profiles?.email
  };
}

export async function updateInternalNote(input: UpdateInternalNoteInput) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('internal_notes')
    .update({ is_resolved: input.is_resolved })
    .eq('id', input.id)
    .select()
    .single();

  if (error) throw error;

  revalidatePath('/dashboard');
  return data;
}

export async function deleteInternalNote(id: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('internal_notes')
    .delete()
    .eq('id', id);

  if (error) throw error;

  revalidatePath('/dashboard');
}

export async function getActiveNotesCount(): Promise<number> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from('internal_notes')
    .select('*', { count: 'exact', head: true })
    .eq('is_resolved', false);

  if (error) throw error;
  return count || 0;
}
```

### React Components

#### Floating Button Component

```typescript
// components/dashboard/internal-notes-button.tsx
'use client'

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare } from 'lucide-react';
import { InternalNotesSidebar } from './internal-notes-sidebar';
import { getActiveNotesCount } from '@/lib/actions/internal-notes';
import { createClient } from '@/lib/supabase/client';

export function InternalNotesButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCount, setActiveCount] = useState(0);

  useEffect(() => {
    loadActiveCount();
    subscribeToNotes();
  }, []);

  async function loadActiveCount() {
    const count = await getActiveNotesCount();
    setActiveCount(count);
  }

  function subscribeToNotes() {
    const supabase = createClient();
    
    const channel = supabase
      .channel('internal_notes_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'internal_notes' },
        () => loadActiveCount()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 h-14 w-14 rounded-full shadow-lg z-40"
        size="icon"
      >
        <MessageSquare className="h-6 w-6" />
        {activeCount > 0 && (
          <Badge className="absolute -top-1 -right-1 h-6 w-6 rounded-full p-0 flex items-center justify-center">
            {activeCount > 99 ? '99+' : activeCount}
          </Badge>
        )}
      </Button>

      <InternalNotesSidebar 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
      />
    </>
  );
}
```

#### Main Sidebar Component

```typescript
// components/dashboard/internal-notes-sidebar.tsx
'use client'

import { useState, useEffect, useOptimistic } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { InternalNoteForm } from './internal-note-form';
import { InternalNoteItem } from './internal-note-item';
import { InternalNotesFilters } from './internal-notes-filters';
import { getInternalNotes } from '@/lib/actions/internal-notes';
import { createClient } from '@/lib/supabase/client';
import type { InternalNote, InternalNotesFilters as Filters } from '@/lib/types/erp';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function InternalNotesSidebar({ isOpen, onClose }: Props) {
  const [notes, setNotes] = useState<InternalNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>({
    note_type: 'all',
    show_resolved: false
  });

  const [optimisticNotes, addOptimisticNote] = useOptimistic(
    notes,
    (state, newNote: InternalNote) => [newNote, ...state]
  );

  useEffect(() => {
    if (isOpen) {
      loadNotes();
      subscribeToNotes();
    }
  }, [isOpen]);

  async function loadNotes() {
    setIsLoading(true);
    try {
      const data = await getInternalNotes();
      setNotes(data);
    } catch (error) {
      console.error('Error loading notes:', error);
    } finally {
      setIsLoading(false);
    }
  }

  function subscribeToNotes() {
    const supabase = createClient();
    
    const channel = supabase
      .channel('internal_notes_realtime')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'internal_notes' },
        () => loadNotes()
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'internal_notes' },
        () => loadNotes()
      )
      .on('postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'internal_notes' },
        () => loadNotes()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  const filteredNotes = optimisticNotes.filter(note => {
    if (!filters.show_resolved && note.is_resolved) return false;
    if (filters.note_type !== 'all' && note.note_type !== filters.note_type) return false;
    return true;
  });

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-full sm:w-96 bg-background border-l shadow-xl z-50 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold">Notas Internas</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Form */}
        <div className="p-4 border-b">
          <InternalNoteForm onNoteCreated={addOptimisticNote} />
        </div>

        {/* Filters */}
        <div className="p-4 border-b">
          <InternalNotesFilters filters={filters} onFiltersChange={setFilters} />
        </div>

        {/* Notes List */}
        <ScrollArea className="flex-1 p-4">
          {isLoading ? (
            <div className="text-center text-muted-foreground py-8">
              Cargando notas...
            </div>
          ) : filteredNotes.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No hay notas para mostrar
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotes.map(note => (
                <InternalNoteItem key={note.id} note={note} />
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    </>
  );
}
```

## Data Models

### Internal Note Entity

- **id**: UUID, primary key
- **company_id**: UUID, foreign key to companies table
- **user_id**: UUID, foreign key to auth.users
- **content**: TEXT, not null, must be non-empty after trim
- **note_type**: ENUM ('general', 'cliente', 'stock', 'proveedor', 'urgente')
- **is_resolved**: BOOLEAN, default false
- **created_at**: TIMESTAMPTZ, auto-generated
- **updated_at**: TIMESTAMPTZ, auto-updated via trigger

### Relationships

- **internal_notes.company_id** → **companies.id** (many-to-one)
- **internal_notes.user_id** → **auth.users.id** (many-to-one)
- Join with **profiles** table to get user display name

### Indexes

- Primary index on **id**
- Index on **company_id** for filtering
- Composite index on **(company_id, created_at DESC)** for ordered queries
- Composite index on **(company_id, is_resolved)** for filtering active notes

## Correctness Properties


*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Sidebar Toggle Interaction

*For any* user interaction with the floating button, clicking it should toggle the sidebar from closed to open state.

**Validates: Requirements 1.2**

### Property 2: Sidebar Close Actions

*For any* sidebar in open state, both clicking outside the sidebar and pressing the ESC key should close the sidebar.

**Validates: Requirements 1.4**

### Property 3: Active Notes Counter

*For any* number of active (unresolved) notes greater than zero, the floating button badge should display the exact count of active notes.

**Validates: Requirements 1.6**

### Property 4: Automatic Metadata Capture

*For any* note creation, the system should automatically capture and store the correct user_id, company_id, and a timestamp within 1 second of the current time.

**Validates: Requirements 2.3, 2.4, 2.5**

### Property 5: Empty Note Validation

*For any* string that is empty or contains only whitespace characters, attempting to create a note with that content should be rejected and prevent submission.

**Validates: Requirements 2.6**

### Property 6: Note Creation UI Update

*For any* successful note creation, the input field should be cleared and the new note should appear at the top of the notes list immediately.

**Validates: Requirements 2.7**

### Property 7: Notes Ordering

*For any* set of notes displayed in the sidebar, they should be ordered by created_at timestamp in descending order (most recent first).

**Validates: Requirements 3.1**

### Property 8: Note Display Completeness

*For any* note displayed in the list, the rendered output should contain the note content, author name, creation timestamp, and note type indicator.

**Validates: Requirements 3.2**

### Property 9: Note Type Visual Indicators

*For any* note type (general, cliente, stock, proveedor, urgente), there should be a distinct visual indicator (color or icon) associated with that type.

**Validates: Requirements 3.3**

### Property 10: Resolve Button Visibility

*For any* note where is_resolved is false, a button to mark the note as resolved should be visible in the UI.

**Validates: Requirements 4.1**

### Property 11: Resolve Action Effect

*For any* note that is marked as resolved, the note's is_resolved field should be set to true and the active notes count should decrease by one.

**Validates: Requirements 4.2**

### Property 12: Delete Button Authorization

*For any* note, a delete button should be visible if and only if the current user is either the note's author (user_id matches) or has admin role.

**Validates: Requirements 4.3, 4.4**

### Property 13: Note Deletion Permanence

*For any* note that is deleted, the note should no longer exist in the database and should not appear in any subsequent queries.

**Validates: Requirements 4.5**

### Property 14: Resolved Notes Filter

*For any* filter state (show_resolved = true or false), the displayed notes should match the filter criteria: if false, only notes with is_resolved = false should be shown.

**Validates: Requirements 4.6**

### Property 15: Note Type Filter

*For any* selected note type filter (or 'all'), the displayed notes should only include notes matching that type, or all notes if 'all' is selected.

**Validates: Requirements 4.7**

### Property 16: Company Isolation

*For any* user query for notes, all returned notes should have a company_id that matches the user's company_id, ensuring complete isolation between companies.

**Validates: Requirements 5.1, 5.2, 5.5**

### Property 17: Delete Authorization Enforcement

*For any* delete attempt, the operation should only succeed if the user is either the note's author or has admin role for that company.

**Validates: Requirements 5.4**

### Property 18: Optimistic UI Updates

*For any* user action (create, resolve, delete), the UI should update immediately to reflect the change before receiving server confirmation.

**Validates: Requirements 6.1, 6.2, 6.3**

### Property 19: Optimistic Update Rollback

*For any* failed server operation after an optimistic update, the UI should revert to its previous state and display an error message to the user.

**Validates: Requirements 6.4**

## Error Handling

### Client-Side Errors

1. **Network Failures**: Display toast notification with retry option
2. **Validation Errors**: Show inline validation messages on form fields
3. **Authorization Errors**: Display appropriate message and prevent action
4. **Optimistic Update Failures**: Revert UI state and show error toast

### Server-Side Errors

1. **Database Errors**: Log error, return generic error message to client
2. **RLS Policy Violations**: Return 403 Forbidden with appropriate message
3. **Invalid Input**: Return 400 Bad Request with validation details
4. **Missing Company**: Return 404 Not Found

### Error Messages

```typescript
const ERROR_MESSAGES = {
  CREATE_FAILED: 'No se pudo crear la nota. Por favor, intenta nuevamente.',
  UPDATE_FAILED: 'No se pudo actualizar la nota. Por favor, intenta nuevamente.',
  DELETE_FAILED: 'No se pudo eliminar la nota. Por favor, intenta nuevamente.',
  LOAD_FAILED: 'No se pudieron cargar las notas. Por favor, recarga la página.',
  EMPTY_CONTENT: 'El contenido de la nota no puede estar vacío.',
  UNAUTHORIZED: 'No tienes permisos para realizar esta acción.',
  NO_COMPANY: 'No se encontró la empresa asociada a tu usuario.',
};
```

## Testing Strategy

### Dual Testing Approach

The system will use both unit tests and property-based tests for comprehensive coverage:

- **Unit tests**: Verify specific examples, edge cases, and error conditions
- **Property tests**: Verify universal properties across all inputs using randomized testing

### Unit Testing Focus

Unit tests should focus on:
- Specific UI component rendering examples
- Integration between components
- Edge cases (empty states, error states)
- Specific user flows (create → display → resolve → delete)

Avoid writing too many unit tests for scenarios that property tests can cover with randomization.

### Property-Based Testing

We will use **fast-check** (for TypeScript/JavaScript) to implement property-based tests.

**Configuration**:
- Minimum 100 iterations per property test
- Each property test must reference its design document property
- Tag format: `Feature: sidebar-notas-internas, Property {number}: {property_text}`

**Example Property Test Structure**:

```typescript
import fc from 'fast-check';

// Feature: sidebar-notas-internas, Property 5: Empty Note Validation
test('empty or whitespace-only content should be rejected', () => {
  fc.assert(
    fc.property(
      fc.string().filter(s => s.trim().length === 0),
      (emptyContent) => {
        const result = validateNoteContent(emptyContent);
        expect(result.isValid).toBe(false);
      }
    ),
    { numRuns: 100 }
  );
});

// Feature: sidebar-notas-internas, Property 7: Notes Ordering
test('notes should be ordered by created_at descending', () => {
  fc.assert(
    fc.property(
      fc.array(fc.record({
        id: fc.uuid(),
        content: fc.string({ minLength: 1 }),
        created_at: fc.date(),
      })),
      (notes) => {
        const sorted = sortNotesByDate(notes);
        for (let i = 0; i < sorted.length - 1; i++) {
          expect(sorted[i].created_at >= sorted[i + 1].created_at).toBe(true);
        }
      }
    ),
    { numRuns: 100 }
  );
});
```

### Integration Testing

Integration tests should cover:
- Supabase Realtime subscriptions and broadcasts
- RLS policy enforcement at database level
- Server actions with actual database operations
- End-to-end user flows with real components

### Testing Tools

- **Unit Tests**: Vitest + React Testing Library
- **Property Tests**: fast-check
- **Integration Tests**: Playwright or Cypress
- **Database Tests**: Supabase local development environment

### Test Coverage Goals

- Unit test coverage: >80% for business logic
- Property tests: All 19 correctness properties implemented
- Integration tests: Critical user flows (create, resolve, delete, realtime sync)
- RLS policies: Verified with database-level tests
