import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/DashboardLayout";
import AdminDataTable from "@/components/AdminDataTable";
import { Badge } from "@/components/ui/badge";
import { api, resourceApi } from "@/lib/api";

type AdminDashboardResponse = {
  overview: {
    totalMembers: number;
    monthlyRevenue: number;
    contentViews: number;
    activeSubscriptions: number;
    totalCourses: number;
    unreadNotifications: number;
  };
  recentUsers: Array<Record<string, string | number | null>>;
  recentCourses: Array<Record<string, string | number | null>>;
  recentAudit: Array<Record<string, string | number | null>>;
  memberSegments: Array<Record<string, string | number | null>>;
  reportRows: Array<Record<string, string | number | null>>;
  activityAccess: Array<Record<string, string | number | null>>;
};

type AdminModule = {
  id: string;
  section: string;
  title: string;
  slug: string;
  description: string;
  active: number;
};

const chartColors = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--info))", "hsl(var(--success))", "hsl(var(--warning))"];

const toNumber = (value: unknown) => {
  if (typeof value === "number") return value;
  const parsed = Number(String(value ?? "").replace(/[%,$,\s]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
};

const countBy = (rows: Array<Record<string, string | number | null>>, key: string) => {
  const counts = new Map<string, number>();
  rows.forEach((row) => {
    const label = String(row[key] ?? "Unknown");
    counts.set(label, (counts.get(label) ?? 0) + 1);
  });
  return Array.from(counts, ([label, count]) => ({ label, count }));
};

const aggregateBy = (
  rows: Array<Record<string, string | number | null>>,
  groupKey: string,
  valueKeys: string[],
) => {
  const groups = new Map<string, Record<string, string | number>>();
  rows.forEach((row) => {
    const label = String(row[groupKey] ?? "Unknown");
    const current = groups.get(label) ?? { label };
    valueKeys.forEach((key) => {
      current[key] = toNumber(current[key]) + toNumber(row[key]);
    });
    groups.set(label, current);
  });
  return Array.from(groups.values());
};

const countByPair = (
  rows: Array<Record<string, string | number | null>>,
  groupKey: string,
  seriesKey: string,
) => {
  const series = Array.from(new Set(rows.map((row) => String(row[seriesKey] ?? "Unknown"))));
  const groups = new Map<string, Record<string, string | number>>();
  rows.forEach((row) => {
    const label = String(row[groupKey] ?? "Unknown");
    const seriesLabel = String(row[seriesKey] ?? "Unknown");
    const current = groups.get(label) ?? { label };
    current[seriesLabel] = toNumber(current[seriesLabel]) + 1;
    groups.set(label, current);
  });
  return {
    data: Array.from(groups.values()),
    series: series.map((label, index) => ({
      key: label,
      label,
      color: chartColors[index % chartColors.length],
    })),
  };
};

const AdminDashboard = () => {
  const dashboard = useQuery({ queryKey: ["admin-dashboard"], queryFn: () => api<AdminDashboardResponse>("/api/admin/dashboard") });
  const modules = useQuery({ queryKey: ["resource", "admin-modules"], queryFn: () => resourceApi.list<AdminModule>("admin-modules", { limit: 100 }) });

  if (dashboard.isLoading) return <DashboardLayout><p className="text-sm text-muted-foreground">Loading live admin data…</p></DashboardLayout>;
  if (dashboard.error || !dashboard.data) return <DashboardLayout><p className="text-sm text-destructive">{dashboard.error?.message || "Unable to load admin dashboard"}</p></DashboardLayout>;

  const overview = Object.entries(dashboard.data.overview).map(([metric, value]) => ({
    metric: metric.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase()),
    value,
  }));
  const reportBySection = aggregateBy(dashboard.data.reportRows ?? [], "section", ["freeMembers", "paidMembers", "total"]);
  const activityAccessChart = countByPair(dashboard.data.activityAccess ?? [], "section", "accessLevel");
  const moduleRows = modules.data?.rows ?? [];
  const modulesBySection = Array.from(moduleRows.reduce((groups, row) => {
    const current = groups.get(row.section) ?? { label: row.section, modules: 0, active: 0 };
    current.modules += 1;
    current.active += toNumber(row.active);
    groups.set(row.section, current);
    return groups;
  }, new Map<string, { label: string; modules: number; active: number }>()).values());

  return (
    <DashboardLayout>
      <div className="max-w-7xl space-y-6">
        <div>
          <Badge variant="secondary">Live MySQL data</Badge>
          <h1 className="mt-3 font-heading text-2xl font-bold">PCMO Admin Console</h1>
          <p className="mt-1 text-sm text-muted-foreground">All tables below are loaded through authenticated TypeScript APIs.</p>
        </div>
        <AdminDataTable title="Platform Overview" description="Current aggregate values calculated from MySQL." exportName="platform-overview" rows={overview} columns={[
          { key: "metric", label: "Metric" }, { key: "value", label: "Value" },
        ]} chart={{
          data: overview.map((row) => ({ metric: row.metric, value: toNumber(row.value) })),
          xKey: "metric",
          series: [{ key: "value", label: "Value", color: chartColors[0] }],
        }} />
        <AdminDataTable title="Free Vs Paid Members" description="Live membership segments calculated from subscriptions, enrollments, invoices, and account activity." exportName="member-segments" rows={dashboard.data.memberSegments ?? []} columns={[
          { key: "segment", label: "Member Type" }, { key: "members", label: "Members" }, { key: "activeThisMonth", label: "Active This Month" }, { key: "courseEnrollments", label: "Enrollments" }, { key: "revenue", label: "Revenue" },
        ]} chart={{
          data: dashboard.data.memberSegments ?? [],
          xKey: "segment",
          series: [
            { key: "members", label: "Members", color: chartColors[0] },
            { key: "activeThisMonth", label: "Active This Month", color: chartColors[1] },
            { key: "courseEnrollments", label: "Enrollments", color: chartColors[2] },
            { key: "revenue", label: "Revenue", color: chartColors[3] },
          ],
        }} />
        <AdminDataTable title="Marketing, Admin, Revenue And Analytics" description="Section reports with separate free and paid member values." exportName="admin-section-reports" rows={dashboard.data.reportRows ?? []} columns={[
          { key: "section", label: "Section" }, { key: "metric", label: "Metric" }, { key: "freeMembers", label: "Free Members" }, { key: "paidMembers", label: "Paid Members" }, { key: "total", label: "Total" }, { key: "databaseSource", label: "Database Source" },
        ]} chart={{
          data: reportBySection,
          xKey: "label",
          series: [
            { key: "freeMembers", label: "Free Members", color: chartColors[0] },
            { key: "paidMembers", label: "Paid Members", color: chartColors[1] },
            { key: "total", label: "Total", color: chartColors[2] },
          ],
        }} />
        <AdminDataTable title="Admin Access By Activity" description="Database-managed access ownership for every controlled admin activity." exportName="admin-activity-access" rows={dashboard.data.activityAccess ?? []} columns={[
          { key: "activity", label: "Activity" }, { key: "section", label: "Section" }, { key: "ownerRole", label: "Owner Role" }, { key: "accessLevel", label: "Access Level" }, { key: "databaseTable", label: "Database Table" }, { key: "updatedAt", label: "Updated" },
        ]} chart={{
          data: activityAccessChart.data,
          xKey: "label",
          series: activityAccessChart.series,
        }} />
        <AdminDataTable title="Recent Users" description="Newest registered accounts." exportName="recent-users" rows={dashboard.data.recentUsers ?? []} columns={[
          { key: "display_name", label: "Name" }, { key: "email", label: "Email" }, { key: "role", label: "Role" }, { key: "status", label: "Status" }, { key: "created_at", label: "Created" },
        ]} chart={{
          data: countBy(dashboard.data.recentUsers ?? [], "role"),
          xKey: "label",
          series: [{ key: "count", label: "Users", color: chartColors[0] }],
        }} />
        <AdminDataTable title="Recent Courses" description="Latest course changes." exportName="recent-courses" rows={dashboard.data.recentCourses ?? []} columns={[
          { key: "title", label: "Title" }, { key: "level", label: "Level" }, { key: "category", label: "Category" }, { key: "instructor", label: "Instructor" }, { key: "status", label: "Status" }, { key: "updated_at", label: "Updated" },
        ]} chart={{
          data: countBy(dashboard.data.recentCourses ?? [], "level"),
          xKey: "label",
          series: [{ key: "count", label: "Courses", color: chartColors[2] }],
        }} />
        <AdminDataTable title="Admin Modules" description="Database-managed admin navigation and module definitions." exportName="admin-modules" rows={moduleRows} columns={[
          { key: "section", label: "Section" }, { key: "title", label: "Module" }, { key: "slug", label: "Slug" }, { key: "description", label: "Description" }, { key: "active", label: "Active" },
        ]} chart={{
          data: modulesBySection,
          xKey: "label",
          series: [
            { key: "modules", label: "Modules", color: chartColors[0] },
            { key: "active", label: "Active", color: chartColors[3] },
          ],
        }} />
        <AdminDataTable title="Audit Log" description="Recent create, update, delete, and workflow actions." exportName="audit-log" rows={dashboard.data.recentAudit ?? []} columns={[
          { key: "action", label: "Action" }, { key: "resource", label: "Resource" }, { key: "resource_id", label: "Record" }, { key: "user_name", label: "User" }, { key: "user_email", label: "Email" }, { key: "created_at", label: "Time" },
        ]} chart={{
          data: countBy(dashboard.data.recentAudit ?? [], "action"),
          xKey: "label",
          series: [{ key: "count", label: "Actions", color: chartColors[1] }],
        }} />
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
