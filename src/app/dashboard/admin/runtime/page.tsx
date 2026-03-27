import { getAdminDashboardData } from "@/lib/admin/dashboard";
import { AdminSection, RuntimeColumn } from "@/app/dashboard/admin/AdminUi";

export default async function DashboardAdminRuntimePage() {
  const data = await getAdminDashboardData();

  return (
    <AdminSection
      title="Runtime"
      subtitle="Heartbeat-backed status for the web surface, workers, and scheduler."
    >
      <div className="grid gap-4 xl:grid-cols-3">
        <RuntimeColumn title="Web" items={data.runtimeByKind.web} />
        <RuntimeColumn title="Workers" items={data.runtimeByKind.worker} />
        <RuntimeColumn title="Scheduler" items={data.runtimeByKind.scheduler} />
      </div>
    </AdminSection>
  );
}
