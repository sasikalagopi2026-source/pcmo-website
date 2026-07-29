import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Bell, CheckCircle2 } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { resourceApi } from "@/lib/api";
import { Button } from "@/components/ui/button";

type Notification = {
  id: string;
  title: string;
  message: string;
  type: string;
  action_url?: string | null;
  read_at?: string | null;
  created_at: string;
};

const Notifications = () => {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => resourceApi.list<Notification>("notifications", { limit: 100 }),
  });
  const markRead = useMutation({
    mutationFn: (id: string) => resourceApi.update("notifications", id, { read_at: new Date().toISOString().slice(0, 19).replace("T", " ") }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  return (
    <DashboardLayout>
      <div className="max-w-4xl space-y-6">
        <div className="flex items-center gap-3"><Bell className="h-7 w-7 text-primary" /><h1 className="font-heading text-3xl font-bold">Notifications</h1></div>
        {isLoading && <p className="text-sm text-muted-foreground">Loading notifications...</p>}
        {error && <p className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive">{error.message}</p>}
        <div className="space-y-3">
          {data?.rows.map((notification) => (
            <article key={notification.id} className={`rounded-xl border border-border p-5 ${notification.read_at ? "bg-card/60" : "bg-card"}`}>
              <div className="flex items-start gap-3">
                <CheckCircle2 className={`mt-1 h-5 w-5 ${notification.read_at ? "text-muted-foreground" : "text-success"}`} />
                <div className="flex-1">
                  <h2 className="font-semibold">{notification.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{notification.message}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{new Date(notification.created_at).toLocaleString()}</p>
                  {notification.action_url && <Button asChild size="sm" variant="link" className="mt-2 h-auto p-0"><Link to={notification.action_url}>Open</Link></Button>}
                </div>
                {!notification.read_at && <Button size="sm" variant="outline" onClick={() => markRead.mutate(notification.id)}>Mark read</Button>}
              </div>
            </article>
          ))}
          {!isLoading && !data?.rows.length && <p className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">No notifications.</p>}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Notifications;
