"use client";

import dynamic from "next/dynamic";
import type { SidebarProps } from "./sidebar";

const DashboardSidebar = dynamic(
  () => import("./sidebar").then((m) => ({ default: m.DashboardSidebar })),
  { ssr: false }
);

export function SidebarClientWrapper(props: SidebarProps) {
  return <DashboardSidebar {...props} />;
}
