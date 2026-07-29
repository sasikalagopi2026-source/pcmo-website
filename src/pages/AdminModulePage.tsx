import { useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import AdminCrudPage from "@/components/AdminCrudPage";
import DashboardLayout from "@/components/DashboardLayout";
import { resourceApi } from "@/lib/api";

type AdminModule = {
  id: string;
  section: string;
  title: string;
  slug: string;
  description?: string;
};

const moduleFields = [
  { key: "section", label: "Section", required: true },
  { key: "title", label: "Title", required: true },
  { key: "slug", label: "Slug", required: true },
  { key: "description", label: "Description", type: "textarea" as const },
  { key: "icon", label: "Icon" },
  { key: "sort_order", label: "Sort order", type: "number" as const },
  { key: "active", label: "Active (1/0)", type: "number" as const },
];

const AdminModulePage = () => {
  const location = useLocation();
  const isModuleManagementPage = location.pathname === "/admin/modules";
  const pathSlug = location.pathname.replace(/^\/admin\//, "");
  const lastSlug = pathSlug.split("/").pop() ?? pathSlug;
  const modules = useQuery({
    queryKey: ["resource", "admin-modules"],
    queryFn: () => resourceApi.list<AdminModule>("admin-modules", { limit: 100 }),
    enabled: !isModuleManagementPage,
  });
  if (isModuleManagementPage) {
    return <AdminCrudPage title="Admin Modules" description="Create the admin sections and modules shown across the console." resource="admin-modules" fields={moduleFields} />;
  }
  const module = modules.data?.rows.find((item) => item.slug === pathSlug || item.slug === lastSlug);

  if (modules.isLoading) return <DashboardLayout><p className="text-sm text-muted-foreground">Loading module…</p></DashboardLayout>;
  if (!module) {
    return (
      <DashboardLayout>
        <div className="rounded-xl border border-border bg-card p-8">
          <h1 className="font-heading text-2xl font-bold">Module not configured</h1>
          <p className="mt-2 text-sm text-muted-foreground">Create a module with slug <code>{pathSlug}</code> from the Admin Modules page.</p>
          <a href="/admin/modules" className="mt-4 inline-block text-sm text-primary hover:underline">Manage admin modules</a>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <AdminCrudPage
      title={module.title}
      description={module.description || `${module.section} records`}
      resource="admin-records"
      hiddenValues={{ module_id: module.id }}
      fields={[
        { key: "name", label: "Name", required: true },
        { key: "status", label: "Status", required: true },
        { key: "owner", label: "Owner" },
        { key: "details", label: "Details (JSON)", type: "json" },
      ]}
    />
  );
};

export default AdminModulePage;
