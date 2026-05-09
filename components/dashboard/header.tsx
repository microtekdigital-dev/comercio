import { NotificationsPopover } from "./notifications-popover";
import { InternalNotesButton } from "./internal-notes-button";
import Link from "next/link";

export function DashboardHeader() {
  return (
    <header className="shrink-0 bg-[#000080] border-b-2 border-[#808080]">
      <div className="flex h-8 items-center justify-between px-3 gap-2">
        <Link
          href="/pos"
          className="flex items-center gap-1.5 text-white text-xs font-bold hover:text-blue-200"
        >
          ← Volver al POS
        </Link>
        <div className="flex items-center gap-1 [&_button]:text-white [&_button]:hover:bg-[#0000aa] [&_svg]:text-white">
          <InternalNotesButton />
          <NotificationsPopover />
        </div>
      </div>
    </header>
  );
}
