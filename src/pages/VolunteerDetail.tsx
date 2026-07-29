import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, CheckCircle2, Clock, ClipboardList, MapPin, Tag, Users } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";

type Opportunity = {
  id: string;
  title: string;
  description?: string;
  category?: string;
  location?: string;
  time_commitment?: string;
  spots_available: number;
  status: string;
  created_at?: string;
  updated_at?: string;
};

type Application = {
  id: string;
  opportunity_id: string;
  status: string;
  hours_logged: number;
  created_at?: string;
  updated_at?: string;
};
type HourLog = { id: string; opportunity_id: string; service_date: string; hours: number; activity: string; status: string; admin_notes?: string };
type VolunteerDashboard = { opportunities: Opportunity[]; applications: Application[]; hourLogs: HourLog[] };

const formatDate = (value?: string) => {
  if (!value) return "Not available";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
};

const VolunteerDetail = () => {
  const { id = "" } = useParams();
  const queryClient = useQueryClient();
  const [hourForm, setHourForm] = useState({ service_date: new Date().toISOString().slice(0, 10), hours: "1", activity: "", evidence_url: "" });

  const dashboard = useQuery({
    queryKey: ["volunteer-dashboard"],
    queryFn: () => api<VolunteerDashboard>("/api/volunteer/dashboard"),
    enabled: Boolean(id),
  });
  const opportunity = dashboard.data?.opportunities.find((item) => item.id === id);
  const application = dashboard.data?.applications.find((item) => item.opportunity_id === id);
  const hourLogs = dashboard.data?.hourLogs.filter((item) => item.opportunity_id === id) ?? [];
  const isOpen = opportunity?.status === "open";
  const hoursLogged = Number(application?.hours_logged ?? 0);
  const hoursGoal = Math.max(1, Number(String(opportunity?.time_commitment ?? "").match(/\d+/)?.[0] ?? 10));

  const refreshApplications = () => {
    void queryClient.invalidateQueries({ queryKey: ["volunteer-dashboard"] });
  };

  const apply = useMutation({
    mutationFn: () => api(`/api/volunteer/opportunities/${id}/apply`, { method: "POST" }),
    onSuccess: refreshApplications,
  });

  const logHours = useMutation({
    mutationFn: () => api(`/api/volunteer/applications/${application!.id}/hours`, { method: "POST", body: JSON.stringify({ ...hourForm, hours: Number(hourForm.hours) }) }),
    onSuccess: () => { setHourForm((current) => ({ ...current, hours: "1", activity: "", evidence_url: "" })); refreshApplications(); },
  });

  return (
    <DashboardLayout>
      <div className="max-w-5xl space-y-6">
        <Button asChild variant="ghost" size="sm">
          <Link to="/volunteer"><ArrowLeft className="h-4 w-4" />Back to volunteer</Link>
        </Button>

        <section className="rounded-xl border border-border bg-card p-6 md:p-8">
          {dashboard.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading volunteer opportunity...</p>
          ) : dashboard.error ? (
            <p className="text-sm text-destructive">{dashboard.error.message}</p>
          ) : (
            <>
              <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                <div className="max-w-3xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={isOpen ? "default" : "secondary"}>{opportunity?.status}</Badge>
                    {application && <Badge variant="outline">{application.status}</Badge>}
                    {opportunity?.category && <Badge variant="secondary">{opportunity.category}</Badge>}
                  </div>
                  <h1 className="mt-4 font-heading text-3xl font-bold">{opportunity?.title}</h1>
                  <p className="mt-4 whitespace-pre-line leading-7 text-muted-foreground">
                    {opportunity?.description || "Details for this volunteer opportunity will be published soon."}
                  </p>
                </div>
                <Button
                  disabled={Boolean(application) || apply.isPending || !isOpen}
                  onClick={() => apply.mutate()}
                >
                  {application ? <CheckCircle2 className="h-4 w-4" /> : <ClipboardList className="h-4 w-4" />}
                  {application ? "Applied" : isOpen ? "Apply now" : "Closed"}
                </Button>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg border border-border bg-secondary/30 p-4">
                  <MapPin className="h-4 w-4 text-primary" />
                  <p className="mt-3 text-xs text-muted-foreground">Location</p>
                  <p className="font-medium">{opportunity?.location || "Flexible"}</p>
                </div>
                <div className="rounded-lg border border-border bg-secondary/30 p-4">
                  <Clock className="h-4 w-4 text-primary" />
                  <p className="mt-3 text-xs text-muted-foreground">Time Commitment</p>
                  <p className="font-medium">{opportunity?.time_commitment || "To be confirmed"}</p>
                </div>
                <div className="rounded-lg border border-border bg-secondary/30 p-4">
                  <Users className="h-4 w-4 text-primary" />
                  <p className="mt-3 text-xs text-muted-foreground">Spots Available</p>
                  <p className="font-medium">{opportunity?.spots_available ?? 0}</p>
                </div>
                <div className="rounded-lg border border-border bg-secondary/30 p-4">
                  <Tag className="h-4 w-4 text-primary" />
                  <p className="mt-3 text-xs text-muted-foreground">Last Updated</p>
                  <p className="font-medium">{formatDate(opportunity?.updated_at)}</p>
                </div>
              </div>
            </>
          )}
        </section>

        <section className="rounded-xl border border-border bg-card p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-heading text-xl font-bold">Your Volunteer Progress</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Track your application status and logged hours for this opportunity.
              </p>
            </div>
            <Badge variant={application ? "default" : "secondary"}>{application ? application.status : "Not applied"}</Badge>
          </div>

          {application ? (
            <div className="mt-5 rounded-lg border border-border bg-secondary/30 p-4">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span>Hours logged</span>
                <strong>{hoursLogged} / {hoursGoal}</strong>
              </div>
              <Progress value={Math.min(100, (hoursLogged / hoursGoal) * 100)} className="h-2" />
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">Applied on {formatDate(application.created_at)}</p>
                {['approved','active'].includes(application.status) && <span className="text-xs font-medium text-primary">Hour logging enabled</span>}
              </div>
            </div>
          ) : (
            <p className="mt-5 rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
              Apply to this opportunity to begin tracking your volunteer hours.
            </p>
          )}
        </section>

        {application && ['approved','active'].includes(application.status) && <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border bg-card p-6">
            <h2 className="font-heading text-xl font-bold">Submit volunteer hours</h2>
            <p className="mt-1 text-sm text-muted-foreground">Entries remain pending until an administrator verifies them.</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium">Service date<Input className="mt-2" type="date" value={hourForm.service_date} onChange={(e) => setHourForm({...hourForm,service_date:e.target.value})}/></label>
              <label className="text-sm font-medium">Hours<Input className="mt-2" type="number" min="0.25" max="24" step="0.25" value={hourForm.hours} onChange={(e) => setHourForm({...hourForm,hours:e.target.value})}/></label>
              <label className="text-sm font-medium sm:col-span-2">Work completed<Textarea className="mt-2" rows={4} placeholder="Describe your contribution, outcome, and who verified it." value={hourForm.activity} onChange={(e) => setHourForm({...hourForm,activity:e.target.value})}/></label>
              <label className="text-sm font-medium sm:col-span-2">Evidence URL (optional)<Input className="mt-2" placeholder="https://…" value={hourForm.evidence_url} onChange={(e) => setHourForm({...hourForm,evidence_url:e.target.value})}/></label>
            </div>
            <Button className="mt-4" disabled={logHours.isPending || hourForm.activity.trim().length < 10} onClick={() => logHours.mutate()}>{logHours.isPending ? "Submitting…" : "Submit for approval"}</Button>
            {logHours.error && <p className="mt-3 text-sm text-destructive">{logHours.error.message}</p>}
          </div>
          <div className="rounded-xl border bg-card p-6"><h2 className="font-heading text-xl font-bold">Hour history</h2><div className="mt-4 space-y-3">{hourLogs.map((log)=><div key={log.id} className="rounded-lg border p-4"><div className="flex justify-between"><strong>{Number(log.hours)} hours</strong><Badge variant="outline">{log.status}</Badge></div><p className="mt-2 text-sm text-muted-foreground">{log.activity}</p><p className="mt-2 text-xs text-muted-foreground">{formatDate(log.service_date)}</p>{log.admin_notes&&<p className="mt-2 text-xs">Admin: {log.admin_notes}</p>}</div>)}{!hourLogs.length&&<p className="text-sm text-muted-foreground">No hour entries submitted yet.</p>}</div></div>
        </section>}
      </div>
    </DashboardLayout>
  );
};

export default VolunteerDetail;
