import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, CalendarDays, Clock, MapPin, Users } from "lucide-react";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";

type LiveEvent = {
  id: string; title: string; description?: string; event_type: string; category?: string;
  event_date: string; event_time?: string; location?: string; status: string;
  registration_status?: string | null; attendees: number; capacity: number;
};

const Events = ({ networkingOnly = false }: { networkingOnly?: boolean }) => {
  const queryClient = useQueryClient();
  const { data: events = [], isLoading, error } = useQuery({ queryKey: ["events"], queryFn: () => api<LiveEvent[]>("/api/events") });
  const registration = useMutation({
    mutationFn: ({ id, registered }: { id: string; registered: boolean }) => api(`/api/events/${id}/register`, { method: registered ? "DELETE" : "POST" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["events"] }),
  });
  const today = new Date().toISOString().slice(0, 10);
  const visibleEvents = networkingOnly ? events.filter((event) => /network|roundtable|forum|meetup/i.test(`${event.event_type} ${event.title}`)) : events;

  return <DashboardLayout>
    <div className="mb-7"><p className="text-xs font-bold uppercase tracking-widest text-primary">{networkingOnly ? "Connect · Learn · Grow" : "Professional programme"}</p><h1 className="mt-1 font-heading text-3xl font-bold">{networkingOnly ? "Networking Events" : "My Events"}</h1><p className="mt-1 text-sm text-muted-foreground">{networkingOnly ? "Find networking labs, roundtables, forums, and meetups, then manage your registration." : "Discover upcoming PCMO events, manage registration, and review programme details."}</p></div>
    <div className="max-w-6xl space-y-4">
      {isLoading && <p className="text-sm text-muted-foreground">Loading events…</p>}
      {error && <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error.message}</p>}
      {registration.error && <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{registration.error.message}</p>}
      {visibleEvents.map((event) => {
        const past = event.event_date < today;
        const registered = Boolean(event.registration_status);
        const full = event.capacity > 0 && event.attendees >= event.capacity;
        return <article key={event.id} className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4"><div className="max-w-3xl"><div className="flex flex-wrap items-center gap-2"><h2 className="font-heading text-lg font-semibold">{event.title}</h2><span className={`rounded-lg px-2 py-1 text-xs font-semibold ${registered ? "bg-emerald-100 text-emerald-700" : "bg-secondary"}`}>{past ? "Past" : registered ? "Registered" : event.status}</span></div><p className="mt-2 text-sm leading-6 text-muted-foreground">{event.description}</p></div>{!past && <Button variant={registered ? "outline" : "default"} disabled={registration.isPending || (!registered && full)} onClick={() => registration.mutate({ id: event.id, registered })}>{registered ? "Cancel registration" : full ? "Event full" : "Register"}</Button>}</div>
          <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground"><span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5"/>{new Date(`${event.event_date}T00:00:00`).toLocaleDateString()}</span><span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5"/>{event.event_time || "TBA"}</span><span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5"/>{event.location || "Online"}</span><span className="flex items-center gap-1"><Users className="h-3.5 w-3.5"/>{event.attendees} registered</span></div>
          {event.capacity > 0 && <div className="mt-4"><div className="mb-1 flex justify-between text-xs text-muted-foreground"><span>Registration</span><span>{event.attendees} / {event.capacity}</span></div><div className="h-1.5 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-primary transition-all" style={{width:`${Math.min(100,(event.attendees/event.capacity)*100)}%`}}/></div></div>}
          <Button asChild variant="link" className="mt-3 h-auto p-0"><Link to={`/events/${event.id}`}>View event details<ArrowRight className="h-4 w-4"/></Link></Button>
        </article>;
      })}
      {!isLoading && visibleEvents.length === 0 && <p className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">{networkingOnly ? "No networking events are currently available." : "No events have been published."}</p>}
    </div>
  </DashboardLayout>;
};

export default Events;
