import type { ReactNode } from "react";
import { requireDashboardAdminUser } from "@/lib/auth/dashboardSession";
import { AdminShell } from "@/app/dashboard/admin/AdminShell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireDashboardAdminUser();

  return <AdminShell>{children}</AdminShell>;
}
