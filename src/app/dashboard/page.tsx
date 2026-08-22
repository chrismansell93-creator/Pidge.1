import { requireAdmin } from "@/lib/admin";
import { getSiteOverview } from "@/lib/admin-stats";
import { AdminDashboard } from "@/components/admin-dashboard";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const admin = await requireAdmin();
  const data = await getSiteOverview();

  return <AdminDashboard data={data} adminEmail={admin.email} />;
}
