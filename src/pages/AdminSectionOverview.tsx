import { useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import AdminDataTable from "@/components/AdminDataTable";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";

type SectionReport = {
  section: string;
  rows: Array<Record<string, string | number | null>>;
  memberSegments: Array<Record<string, string | number | null>>;
  activityAccess: Array<Record<string, string | number | null>>;
};

const AdminSectionOverview = () => {
  const location = useLocation();
  const slug = location.pathname.replace("/admin/", "");
  const report = useQuery({
    queryKey: ["admin-section-report", slug],
    queryFn: () => api<SectionReport>(`/api/admin/reports/${slug}`),
  });

  if (report.isLoading) {
    return <DashboardLayout><p className="text-sm text-muted-foreground">Loading live section data...</p></DashboardLayout>;
  }
  if (report.error || !report.data) {
    return <DashboardLayout><p className="text-sm text-destructive">{report.error?.message || "Unable to load section report"}</p></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl space-y-6">
        <div>
          <Badge variant="secondary">Live MySQL report</Badge>
          <h1 className="mt-3 font-heading text-2xl font-bold">{report.data.section}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Separate operational data, member segments, access controls, and exports for this admin section.
          </p>
        </div>

        <AdminDataTable
          title={`${report.data.section} Metrics`}
          description="Live section values separated for free and paid members."
          exportName={`${slug}-metrics`}
          rows={report.data.rows}
          columns={[
            { key: "metric", label: "Metric" },
            { key: "freeMembers", label: "Free Members" },
            { key: "paidMembers", label: "Paid Members" },
            { key: "total", label: "Total" },
            { key: "databaseSource", label: "Database Source" },
          ]}
        />
        <AdminDataTable
          title="Free Vs Paid Members"
          description="Current database totals for membership, activity, enrollments, and revenue."
          exportName={`${slug}-member-segments`}
          rows={report.data.memberSegments}
          columns={[
            { key: "segment", label: "Member Type" },
            { key: "members", label: "Members" },
            { key: "activeThisMonth", label: "Active This Month" },
            { key: "courseEnrollments", label: "Enrollments" },
            { key: "revenue", label: "Revenue" },
          ]}
        />
        <AdminDataTable
          title="Activity Access"
          description="Roles and access levels stored for activities in this section."
          exportName={`${slug}-activity-access`}
          rows={report.data.activityAccess}
          columns={[
            { key: "activity", label: "Activity" },
            { key: "ownerRole", label: "Owner Role" },
            { key: "accessLevel", label: "Access Level" },
            { key: "databaseTable", label: "Database Table" },
            { key: "updatedAt", label: "Updated" },
          ]}
        />
      </div>
    </DashboardLayout>
  );
};

export default AdminSectionOverview;
