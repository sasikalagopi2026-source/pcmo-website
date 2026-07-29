import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, Clock, ClipboardList, MapPin, Search, ShieldCheck, Sparkles, Users } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

type Opportunity = {
  id: string;
  title: string;
  description?: string;
  category?: string;
  location?: string;
  time_commitment?: string;
  spots_available: number;
  status: string;
};

type Application = {
  id: string;
  opportunity_id: string;
  status: string;
  hours_logged: number;
};

type HourLog = { id: string; opportunity_title: string; service_date: string; hours: number; activity: string; status: string };
type VolunteerDashboard = {
  opportunities: Opportunity[];
  applications: Application[];
  hourLogs: HourLog[];
  summary: { approvedHours: number; pendingHours: number; applications: number; approvedApplications: number; openOpportunities: number };
};

const getHoursGoal = (commitment?: string) => {
  const parsed = Number(String(commitment ?? "").match(/\d+/)?.[0]);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 10;
};

const Volunteer = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");

  const dashboard = useQuery({ queryKey: ["volunteer-dashboard"], queryFn: () => api<VolunteerDashboard>("/api/volunteer/dashboard") });
  const apply = useMutation({
    mutationFn: (opportunityId: string) => api(`/api/volunteer/opportunities/${opportunityId}/apply`, { method: "POST" }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["volunteer-dashboard"] }),
  });

  const rows = dashboard.data?.opportunities ?? [];
  const applicationRows = dashboard.data?.applications ?? [];
  const byOpportunity = useMemo(() => new Map(applicationRows.map((item) => [item.opportunity_id, item])), [applicationRows]);
  const categories = useMemo(() => Array.from(new Set(rows.map((item) => item.category).filter(Boolean))).sort() as string[], [rows]);
  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter((item) => {
      const matchesSearch = !query || [item.title, item.description, item.category, item.location]
        .some((value) => String(value ?? "").toLowerCase().includes(query));
      const matchesCategory = category === "all" || item.category === category;
      const matchesStatus = status === "all" || item.status === status || byOpportunity.get(item.id)?.status === status;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [byOpportunity, category, rows, search, status]);

  const hours = dashboard.data?.summary.approvedHours ?? 0;
  const pendingHours = dashboard.data?.summary.pendingHours ?? 0;
  const openCount = dashboard.data?.summary.openOpportunities ?? 0;
  const appliedCount = applicationRows.length;
  const totalSpots = rows.reduce((sum, item) => sum + Number(item.spots_available ?? 0), 0);
  const activeApplications = applicationRows
    .map((application) => ({ application, opportunity: rows.find((item) => item.id === application.opportunity_id) }))
    .filter((item) => item.opportunity);

  return (
    <DashboardLayout>
      <div className="max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <Badge variant="secondary"><Sparkles className="mr-1 h-3 w-3" />Community impact</Badge>
            <h1 className="mt-3 font-heading text-3xl font-bold">Turn your experience into impact.</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Find active PCMO service opportunities, apply in one step, and track hours from your volunteer record.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link to="/community-profile">Community Profile<ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <Clock className="h-5 w-5 text-primary" />
            <p className="mt-3 text-2xl font-bold">{hours}</p>
            <p className="text-xs text-muted-foreground">Approved hours · {pendingHours} pending</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <ClipboardList className="h-5 w-5 text-primary" />
            <p className="mt-3 text-2xl font-bold">{appliedCount}</p>
            <p className="text-xs text-muted-foreground">Applications submitted</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            <p className="mt-3 text-2xl font-bold">{openCount}</p>
            <p className="text-xs text-muted-foreground">Open opportunities</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <Users className="h-5 w-5 text-primary" />
            <p className="mt-3 text-2xl font-bold">{totalSpots}</p>
            <p className="text-xs text-muted-foreground">Available spots</p>
          </div>
        </div>

        <section className="rounded-xl border border-border bg-card p-5">
          <div className="grid gap-3 md:grid-cols-[1fr_180px_180px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search title, category, location"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <select className="rounded-md border border-input bg-background px-3 py-2 text-sm" value={category} onChange={(event) => setCategory(event.target.value)}>
              <option value="all">All categories</option>
              {categories.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <select className="rounded-md border border-input bg-background px-3 py-2 text-sm" value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="all">All statuses</option>
              <option value="open">Open</option>
              <option value="submitted">Submitted</option>
              <option value="approved">Approved</option>
              <option value="completed">Completed</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </section>

        {activeApplications.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-lg font-semibold">Your Applications</h2>
              <span className="text-xs text-muted-foreground">{activeApplications.length} active</span>
            </div>
            <div className="grid gap-3 lg:grid-cols-2">
              {activeApplications.map(({ application, opportunity }) => {
                const goal = getHoursGoal(opportunity?.time_commitment);
                const logged = Number(application.hours_logged ?? 0);
                return (
                  <article key={application.id} className="rounded-xl border border-border bg-card p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold">{opportunity?.title}</h3>
                        <p className="mt-1 text-xs text-muted-foreground">{opportunity?.location || "Flexible"} · {opportunity?.time_commitment || "Time to be confirmed"}</p>
                      </div>
                      <Badge variant="outline">{application.status}</Badge>
                    </div>
                    <div className="mt-4">
                      <div className="mb-2 flex items-center justify-between text-sm"><span>Hours</span><strong>{logged} / {goal}</strong></div>
                      <Progress value={Math.min(100, (logged / goal) * 100)} className="h-2" />
                    </div>
                    <Button asChild className="mt-4 w-full" variant="outline">
                      <Link to={`/volunteer/${opportunity?.id}`}>Open details</Link>
                    </Button>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg font-semibold">Opportunities</h2>
            <span className="text-xs text-muted-foreground">{filteredRows.length} shown</span>
          </div>
          {dashboard.isLoading && <p className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">Loading volunteer opportunities...</p>}
          {dashboard.error && <p className="rounded-xl border border-border bg-card p-5 text-sm text-destructive">{dashboard.error.message}</p>}
          <div className="grid gap-4 lg:grid-cols-2">
          {filteredRows.map((item) => {
            const application = byOpportunity.get(item.id);
            return (
              <article key={item.id} className="rounded-xl border border-border bg-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{item.title}</h3>
                      <Badge variant={item.status === "open" ? "default" : "secondary"}>{application?.status || item.status}</Badge>
                      {item.category && <Badge variant="outline">{item.category}</Badge>}
                    </div>
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">{item.description || "Volunteer details will be available soon."}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button asChild size="sm" variant="outline">
                      <Link to={`/volunteer/${item.id}`}>Details</Link>
                    </Button>
                    <Button size="sm" disabled={Boolean(application) || apply.isPending || item.status !== "open"} onClick={() => apply.mutate(item.id)}>{application ? "Applied" : "Apply"}</Button>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {item.time_commitment || "Time to be confirmed"}</span>
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {item.location || "Flexible"}</span>
                  <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {item.spots_available} spots</span>
                </div>
              </article>
            );
          })}
          </div>
          {!dashboard.isLoading && !filteredRows.length && !dashboard.error && (
            <p className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">No volunteer opportunities match the current filters.</p>
          )}
          {apply.error && <p className="text-sm text-destructive">{apply.error.message}</p>}
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
          <div className="rounded-xl border bg-card p-5">
            <div className="flex items-center justify-between"><h2 className="font-heading text-lg font-semibold">Recent hour submissions</h2><ShieldCheck className="h-5 w-5 text-primary" /></div>
            <div className="mt-4 space-y-3">
              {dashboard.data?.hourLogs.slice(0, 5).map((log) => <div key={log.id} className="flex items-start justify-between gap-4 rounded-lg border p-3"><div><p className="text-sm font-medium">{log.opportunity_title}</p><p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{log.activity}</p></div><div className="text-right"><p className="font-bold">{Number(log.hours)}h</p><Badge variant="outline">{log.status}</Badge></div></div>)}
              {!dashboard.data?.hourLogs.length && <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">Approved volunteers can submit dated hour records from an opportunity detail page.</p>}
            </div>
          </div>
          <div className="rounded-xl bg-primary p-6 text-primary-foreground">
            <Sparkles className="h-6 w-6" /><h2 className="mt-4 font-heading text-xl font-bold">Your impact record</h2><p className="mt-2 text-sm text-primary-foreground/75">Every application, submitted hour, approval, and completed assignment is stored in your PCMO volunteer history and available to administrators for verification.</p>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
};

export default Volunteer;
