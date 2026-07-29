import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/DashboardLayout";
import { api, resourceApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type Course = { id: string; title: string };
type Recipient = { user_id: string; email: string; display_name?: string; phone?: string; progress: number };

const AdminCourseReminders = () => {
  const [courseId, setCourseId] = useState("");
  const [threshold, setThreshold] = useState(100);
  const [message, setMessage] = useState("Please continue your course and complete the remaining modules.");
  const courses = useQuery({ queryKey: ["resource", "courses"], queryFn: () => resourceApi.list<Course>("courses", { limit: 100 }) });
  const recipients = useQuery({ queryKey: ["reminder-recipients", courseId, threshold], queryFn: () => api<Recipient[]>(`/api/admin/reminders/${courseId}?threshold=${threshold}`), enabled: Boolean(courseId) });
  const send = useMutation({
    mutationFn: () => api(`/api/admin/reminders/${courseId}`, { method: "POST", body: JSON.stringify({ userIds: recipients.data?.map((item) => item.user_id), channels: ["email", "whatsapp", "in_app"], title: "Course completion reminder", message }) }),
  });
  return <DashboardLayout><div className="max-w-4xl space-y-6"><h1 className="font-heading text-2xl font-bold">Course Reminders</h1><div className="grid gap-4 rounded-xl border border-border bg-card p-6 sm:grid-cols-2"><label className="text-sm">Course<select value={courseId} onChange={(event) => setCourseId(event.target.value)} className="mt-2 w-full rounded-md border border-border bg-background p-2"><option value="">Select course</option>{courses.data?.rows.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}</select></label><label className="text-sm">Progress below {threshold}%<input type="range" min="1" max="100" value={threshold} onChange={(event) => setThreshold(Number(event.target.value))} className="mt-3 w-full" /></label><Textarea className="sm:col-span-2" rows={4} value={message} onChange={(event) => setMessage(event.target.value)} /><div className="sm:col-span-2"><p className="mb-3 text-sm text-muted-foreground">{recipients.data?.length ?? 0} recipients match.</p><Button disabled={!recipients.data?.length || send.isPending} onClick={() => send.mutate()}>Send reminders</Button>{send.isSuccess && <p className="mt-2 text-sm text-success">Reminders created successfully.</p>}</div></div><div className="space-y-2">{recipients.data?.map((recipient) => <div key={recipient.user_id} className="rounded-lg border border-border bg-card p-3 text-sm">{recipient.display_name || recipient.email} · {recipient.progress}% · {recipient.phone || "No phone"}</div>)}</div></div></DashboardLayout>;
};

export default AdminCourseReminders;
