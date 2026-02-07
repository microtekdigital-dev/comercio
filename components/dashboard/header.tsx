import { NotificationsPopover } from "./notifications-popover";

export function DashboardHeader() {
  return (
    <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-end px-6 gap-4">
        <NotificationsPopover />
      </div>
    </header>
  );
}
