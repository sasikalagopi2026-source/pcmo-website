import DashboardLayout from "@/components/DashboardLayout";

const DisabledStudentResource = () => (
  <DashboardLayout>
    <div className="max-w-xl rounded-xl border border-border bg-card p-7">
      <h1 className="font-heading text-2xl font-bold">Resource disabled</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Student access is limited to enrolled courses, their assessments, the dashboard, and account settings.
      </p>
    </div>
  </DashboardLayout>
);

export default DisabledStudentResource;
