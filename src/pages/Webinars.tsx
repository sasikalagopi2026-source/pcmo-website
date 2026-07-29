import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Download, PlayCircle, Video } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Webinar = {
  id: string; title: string; description?: string; event_type: string; category?: string;
  event_date: string; event_time?: string; status: string; meeting_url?: string; recording_url?: string;
  registration_status?: string | null;
};

const recordedSeries = [
  { number: "01", title: "Why Project Management and Contracts Management Must Work Together", duration: "1:53", audience: "All professionals", file: "01-pm-and-contracts-together.mp4", topics: ["Why projects fail", "PM-CM silos", "Integrated delivery", "Future careers"] },
  { number: "02", title: "The Complete Project Lifecycle Explained", duration: "1:58", audience: "Beginners", file: "02-complete-project-lifecycle.mp4", topics: ["Initiation", "Planning", "Execution", "Monitoring", "Closeout"] },
  { number: "03", title: "Building Successful Projects Through Effective Scope Management", duration: "1:44", audience: "Project and contract professionals", file: "03-effective-scope-management.mp4", topics: ["Scope definition", "WBS", "Scope creep", "Scope control"] },
  { number: "04", title: "Project Scheduling Masterclass", duration: "1:44", audience: "Project controls professionals", file: "04-project-scheduling-masterclass.mp4", topics: ["CPM", "Float", "Baselines", "Recovery schedules"] },
  { number: "05", title: "Cost Control and Commercial Awareness for Project Professionals", duration: "1:46", audience: "Project and commercial teams", file: "05-cost-control-commercial-awareness.mp4", topics: ["Budgeting", "Forecasting", "EVM", "Commercial decisions"] },
  { number: "06", title: "Risk Management That Actually Works", duration: "1:47", audience: "All professionals", file: "06-risk-management-that-works.mp4", topics: ["Risk registers", "Ownership", "Responses", "Practical examples"] },
] as const;

const Webinars = () => {
  const queryClient = useQueryClient();
  const events = useQuery({ queryKey: ["events"], queryFn: () => api<Webinar[]>("/api/events") });
  const registration = useMutation({ mutationFn: (id: string) => api(`/api/events/${id}/register`, { method: "POST" }), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["events"] }) });
  const webinars = events.data?.filter((item) => item.event_type.toLowerCase() === "webinar") ?? [];
  return (
    <DashboardLayout>
      <div className="max-w-6xl space-y-10">
        <div><h1 className="font-heading text-3xl font-bold">Webinars</h1><p className="mt-1 text-muted-foreground">Watch PCMO learning videos and manage your live webinar registrations.</p></div>
        {(events.isLoading || webinars.length > 0) && <section><div className="mb-4"><p className="text-xs font-bold uppercase tracking-widest text-primary">Live programme</p><h2 className="mt-1 font-heading text-xl font-bold">Scheduled webinars</h2></div><div className="grid gap-4 sm:grid-cols-2">
          {webinars.map((webinar) => (
            <article key={webinar.id} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between"><Video className="h-5 w-5 text-primary" /><Badge>{webinar.status}</Badge></div>
              <h2 className="mt-3 font-heading font-semibold">{webinar.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{webinar.description}</p>
              <p className="mt-3 flex items-center gap-1 text-xs text-muted-foreground"><CalendarDays className="h-3 w-3" /> {webinar.event_date} {webinar.event_time}</p>
              <div className="mt-4 flex gap-2">
                {webinar.recording_url ? <Button asChild size="sm"><a href={webinar.recording_url} target="_blank" rel="noreferrer"><PlayCircle className="h-4 w-4" /> Watch</a></Button> : webinar.meeting_url && webinar.registration_status ? <Button asChild size="sm"><a href={webinar.meeting_url} target="_blank" rel="noreferrer">Join</a></Button> : <Button size="sm" disabled={Boolean(webinar.registration_status)} onClick={() => registration.mutate(webinar.id)}>{webinar.registration_status ? "Registered" : "Register"}</Button>}
              </div>
            </article>
          ))}
          {events.isLoading && <p className="text-sm text-muted-foreground">Loading scheduled webinars…</p>}
        </div></section>}

        <section>
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-widest text-primary">Series 1</p><h2 className="mt-1 font-heading text-2xl font-bold">Project Management Fundamentals</h2><p className="mt-1 text-sm text-muted-foreground">Six narrated PCMO video lessons available to play now.</p></div><Badge variant="secondary">6 videos</Badge></div>
          <div className="grid gap-6 lg:grid-cols-2">
            {recordedSeries.map((item) => (
              <article key={item.number} className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                <video controls preload="metadata" className="aspect-video w-full bg-black" aria-label={item.title}>
                  <source src={`/webinars/series-1/${item.file}`} type="video/mp4" />
                  Your browser does not support HTML5 video.
                </video>
                <div className="p-5">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-muted-foreground"><Badge>Webinar {item.number}</Badge><span>{item.duration}</span><span>•</span><span>{item.audience}</span></div>
                  <h3 className="mt-3 font-heading text-lg font-bold leading-6">{item.title}</h3>
                  <div className="mt-3 flex flex-wrap gap-2">{item.topics.map((topic) => <span key={topic} className="rounded-full bg-secondary px-2.5 py-1 text-xs">{topic}</span>)}</div>
                  <Button asChild variant="outline" size="sm" className="mt-4"><a href={`/webinars/series-1/${item.file}`} download><Download className="h-4 w-4" />Download MP4</a></Button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
};

export default Webinars;
