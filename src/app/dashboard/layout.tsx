import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { requireAuthenticatedDashboardUser } from "@/lib/auth/dashboardSession";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await requireAuthenticatedDashboardUser();

  return <DashboardShell userEmail={user.email ?? "Signed-in user"}>{children}</DashboardShell>;
}
