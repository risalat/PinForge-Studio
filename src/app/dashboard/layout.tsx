import { requireAuthenticatedDashboardUser } from "@/lib/auth/dashboardSession";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireAuthenticatedDashboardUser();

  return children;
}
