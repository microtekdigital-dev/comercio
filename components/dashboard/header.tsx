import { NotificationsPopover } from "./notifications-popover";
import { InternalNotesButton } from "./internal-notes-button";

export function DashboardHeader() {
  return (
    <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-end px-4 md:px-6 gap-4">
        {/* Espacio para el botón de menú móvil (está en el sidebar) */}
        <div className="md:hidden flex-1" />
        <InternalNotesButton />
        <NotificationsPopover />
      </div>
    </header>
  );
}
