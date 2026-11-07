import type { ReactNode } from "react";
import { AdminSidebarShell } from "./components/AdminSidebarShell";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminSidebarShell>{children}</AdminSidebarShell>;
}
