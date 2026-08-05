import { useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "@/components/DashboardLayout";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";

type EventRecord = {
  id: string;
  title: string;
  description?: string;
  event_type: string;
  category?: string;
  event_date: string;
  event_time?: string;
  location?: string;
  capacity: number;
  status: string;
  registration_status?: string | null;
};

const EventDetail = () => {
  const { id = "" } = useParams();
  const queryClient = useQueryClient();
  const event = useQuery({
    queryKey: ["event", id],
    queryFn: async () => {
      const events = await api<EventRecord[]>("/api/events");
      const match = events.find((item) => item.id === id);
      if (!match) throw new Error("Event not found");
      return match;
    },
    enabled: Boolean(id),
  });
  const registered = Boolean(event.data?.registration_status);
  const registration = useMutation({
    mutationFn: () => api(`/api/events/${id}/register`, { method: registered ? "DELETE" : "POST" }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["event", id] });
      void queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });

  return <DashboardLayout><div className="max-w-4xl rounded-xl border border-border bg-card p-7">
    {event.isLoading ? <p>Loading...</p> : event.error ? <p className="text-destructive">{event.error.message}</p> : <>
      <p className="text-sm text-muted-foreground">{event.data?.event_type} - {event.data?.category}</p>
      <h1 className="mt-2 font-heading text-3xl font-bold">{event.data?.title}</h1>
      <p className="mt-4 leading-7 text-muted-foreground">{event.data?.description}</p>
      <div className="mt-5 space-y-1 text-sm"><p>{event.data?.event_date} {event.data?.event_time}</p><p>{event.data?.location}</p><p>Capacity: {event.data?.capacity}</p></div>
      <Button className="mt-6" variant={registered ? "outline" : "default"} onClick={() => registration.mutate()} disabled={registration.isPending}>{registered ? "Cancel registration" : "Register"}</Button>
    </>}
  </div></DashboardLayout>;
};

export default EventDetail;
