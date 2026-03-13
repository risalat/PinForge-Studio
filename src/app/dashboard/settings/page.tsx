import { redirect } from "next/navigation";
import { requireAuthenticatedDashboardUser } from "@/lib/auth/dashboardSession";

export default async function DashboardSettingsPage() {
  await requireAuthenticatedDashboardUser();
  redirect("/dashboard/integrations");
}
