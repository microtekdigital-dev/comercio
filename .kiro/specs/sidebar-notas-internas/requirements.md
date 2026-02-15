# Requirements Document

## Introduction

Este documento define los requisitos para implementar un sidebar de notas internas en el dashboard del ERP. El sistema permitirá a empleados y administradores crear, visualizar y gestionar notas internas para comunicación del equipo, como recordatorios de stock, información de clientes, llegada de mercadería, etc.

## Glossary

- **Internal_Notes_System**: El sistema completo de notas internas que incluye UI, almacenamiento y gestión
- **Note**: Una nota interna creada por un usuario con texto, tipo, autor y timestamp
- **Sidebar**: Panel lateral deslizable que contiene la interfaz de notas
- **Floating_Button**: Botón flotante en la esquina inferior derecha que abre el sidebar
- **Note_Type**: Categoría de la nota (General, Cliente, Stock, Proveedor, Urgente)
- **Active_Note**: Nota que no ha sido marcada como resuelta/completada
- **Resolved_Note**: Nota marcada como completada
- **Company_Scope**: Las notas son visibles solo para usuarios de la misma empresa (company_id)
- **Realtime_Updates**: Actualizaciones instantáneas usando Supabase Realtime
- **RLS_Policy**: Row Level Security policy para seguridad multi-tenant

## Requirements

### Requirement 1: Sidebar UI y Accesibilidad

**User Story:** Como usuario del ERP, quiero acceder rápidamente a las notas internas desde cualquier página del dashboard, para poder ver y crear notas sin interrumpir mi flujo de trabajo.

#### Acceptance Criteria

1. THE Internal_Notes_System SHALL display a Floating_Button in the bottom-right corner of all dashboard pages
2. WHEN a user clicks the Floating_Button, THE Internal_Notes_System SHALL open a sliding Sidebar from the right side
3. WHEN the Sidebar is open, THE Internal_Notes_System SHALL display a semi-transparent overlay on the rest of the page
4. WHEN a user clicks outside the Sidebar or presses ESC, THE Internal_Notes_System SHALL close the Sidebar
5. THE Sidebar SHALL be responsive and adapt to mobile screen sizes
6. WHEN there are Active_Notes, THE Floating_Button SHALL display a counter badge with the number of active notes

### Requirement 2: Crear Notas

**User Story:** Como empleado o administrador, quiero crear notas internas con categorías específicas, para comunicar información importante al equipo de manera organizada.

#### Acceptance Criteria

1. WHEN the Sidebar is open, THE Internal_Notes_System SHALL display a text input field for note content
2. WHEN the Sidebar is open, THE Internal_Notes_System SHALL display a selector with Note_Type options (General, Cliente, Stock, Proveedor, Urgente)
3. WHEN a user submits a note, THE Internal_Notes_System SHALL capture the user_id automatically
4. WHEN a user submits a note, THE Internal_Notes_System SHALL capture the current timestamp automatically
5. WHEN a user submits a note, THE Internal_Notes_System SHALL capture the company_id automatically
6. WHEN a user submits an empty note, THE Internal_Notes_System SHALL prevent submission and display a validation message
7. WHEN a note is successfully created, THE Internal_Notes_System SHALL clear the input field and show the new note immediately
8. WHEN a note is created, THE Internal_Notes_System SHALL broadcast the update via Realtime_Updates to all connected users of the same company

### Requirement 3: Visualizar Notas

**User Story:** Como usuario del ERP, quiero ver todas las notas internas del equipo ordenadas por fecha, para estar al tanto de la información más reciente.

#### Acceptance Criteria

1. WHEN the Sidebar is open, THE Internal_Notes_System SHALL display a list of notes ordered by creation date (most recent first)
2. FOR ALL displayed notes, THE Internal_Notes_System SHALL show the note text, author name, creation timestamp, and Note_Type
3. FOR ALL Note_Types, THE Internal_Notes_System SHALL display a visual indicator (color and/or icon) to distinguish the type
4. WHEN there are more than 20 notes, THE Internal_Notes_System SHALL implement pagination or infinite scroll
5. WHEN a note is created by another user, THE Internal_Notes_System SHALL update the list in real-time via Realtime_Updates
6. WHEN there are no notes, THE Internal_Notes_System SHALL display an empty state message

### Requirement 4: Gestión de Notas

**User Story:** Como usuario del ERP, quiero marcar notas como resueltas y eliminar notas cuando sea necesario, para mantener la lista organizada y relevante.

#### Acceptance Criteria

1. FOR ALL Active_Notes, THE Internal_Notes_System SHALL display a button to mark the note as resolved
2. WHEN a user marks a note as resolved, THE Internal_Notes_System SHALL update the note status and remove it from the active count
3. WHEN a user is the author of a note, THE Internal_Notes_System SHALL display a delete button for that note
4. WHEN a user has admin role, THE Internal_Notes_System SHALL display a delete button for all notes
5. WHEN a user deletes a note, THE Internal_Notes_System SHALL remove it permanently and broadcast the update via Realtime_Updates
6. THE Internal_Notes_System SHALL provide a filter to toggle between showing all notes or only Active_Notes
7. THE Internal_Notes_System SHALL provide a filter dropdown to filter notes by Note_Type

### Requirement 5: Permisos y Seguridad Multi-tenant

**User Story:** Como administrador del sistema, quiero que las notas sean seguras y aisladas por empresa, para garantizar que cada empresa solo vea sus propias notas.

#### Acceptance Criteria

1. THE Internal_Notes_System SHALL enforce Company_Scope using RLS_Policy on the database level
2. WHEN a user queries notes, THE Internal_Notes_System SHALL return only notes where company_id matches the user's company_id
3. WHEN a user creates a note, THE Internal_Notes_System SHALL automatically set the company_id to the user's company_id
4. WHEN a user attempts to delete a note, THE Internal_Notes_System SHALL verify the user is either the author or has admin role
5. THE Internal_Notes_System SHALL prevent any user from accessing notes from other companies via RLS_Policy

### Requirement 6: Optimistic Updates y UX

**User Story:** Como usuario del ERP, quiero que la interfaz responda instantáneamente a mis acciones, para tener una experiencia fluida sin esperas.

#### Acceptance Criteria

1. WHEN a user creates a note, THE Internal_Notes_System SHALL display the note immediately in the UI before server confirmation (optimistic update)
2. WHEN a user marks a note as resolved, THE Internal_Notes_System SHALL update the UI immediately before server confirmation
3. WHEN a user deletes a note, THE Internal_Notes_System SHALL remove it from the UI immediately before server confirmation
4. IF a server operation fails, THE Internal_Notes_System SHALL revert the optimistic update and display an error message
5. WHEN the Sidebar is opened, THE Internal_Notes_System SHALL show a loading state while fetching notes

### Requirement 7: Componentes Reutilizables

**User Story:** Como desarrollador, quiero que el sistema use componentes de shadcn/ui y siga las convenciones del proyecto, para mantener consistencia y facilitar el mantenimiento.

#### Acceptance Criteria

1. THE Internal_Notes_System SHALL use shadcn/ui components for all UI elements (Button, Input, Select, Badge, ScrollArea, etc.)
2. THE Internal_Notes_System SHALL follow the existing project structure and naming conventions
3. THE Internal_Notes_System SHALL use Tailwind CSS for styling
4. THE Internal_Notes_System SHALL use TypeScript with proper type definitions
5. THE Internal_Notes_System SHALL implement proper error handling using the existing error-handler utility
