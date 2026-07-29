import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Archive, Mail, MessageSquare, Search, Trash2 } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type ContactMessage = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  subject: string;
  message: string;
  enquiry_type?: string | null;
  audience?: string | null;
  organization?: string | null;
  role_title?: string | null;
  membership_status?: string | null;
  preferred_contact_method?: string | null;
  urgency?: string | null;
  consent?: boolean | number;
  metadata?: Record<string, unknown> | string | null;
  status: "new" | "read" | "replied" | "archived";
  admin_notes?: string | null;
  created_at: string;
  responded_at?: string | null;
};

const statusStyles: Record<ContactMessage["status"], string> = {
  new: "bg-blue-100 text-blue-700",
  read: "bg-slate-100 text-slate-700",
  replied: "bg-green-100 text-green-700",
  archived: "bg-amber-100 text-amber-700",
};

const Field = ({ label, value }: { label: string; value?: unknown }) => (
  <p><span className="font-semibold">{label}:</span> {value ? String(value) : "Not provided"}</p>
);

const AdminContactMessages = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [selected, setSelected] = useState<ContactMessage | null>(null);
  const [notes, setNotes] = useState("");
  const query = useQuery({
    queryKey: ["admin-contact-messages", search, status],
    queryFn: () => api<ContactMessage[]>(`/api/admin/contact-messages?search=${encodeURIComponent(search)}&status=${encodeURIComponent(status)}`),
  });
  useEffect(() => setNotes(selected?.admin_notes ?? ""), [selected]);
  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Pick<ContactMessage, "status" | "admin_notes">> }) =>
      api(`/api/admin/contact-messages/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-contact-messages"] }),
  });
  const remove = useMutation({
    mutationFn: (id: string) => api(`/api/admin/contact-messages/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      setSelected(null);
      queryClient.invalidateQueries({ queryKey: ["admin-contact-messages"] });
    },
  });
  const openMessage = (message: ContactMessage) => {
    setSelected(message);
    if (message.status === "new") update.mutate({ id: message.id, data: { status: "read" } });
  };

  return <DashboardLayout>
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Contact Messages</h1>
        <p className="text-sm text-muted-foreground">Review structured website and student enquiries.</p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative max-w-lg flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, email, subject, or message" />
        </div>
        <select className="rounded-md border border-border bg-background px-3 py-2 text-sm" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">All statuses</option>
          <option value="new">New</option>
          <option value="read">Read</option>
          <option value="replied">Replied</option>
          <option value="archived">Archived</option>
        </select>
      </div>
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {query.data?.map((message) => <button key={message.id} onClick={() => openMessage(message)} className="grid w-full gap-2 border-b border-border p-4 text-left transition-colors last:border-0 hover:bg-secondary/50 md:grid-cols-[1fr_1.5fr_auto] md:items-center">
          <div>
            <p className="font-medium">{message.name}</p>
            <p className="text-xs text-muted-foreground">{message.email}</p>
            {message.organization && <p className="text-xs text-muted-foreground">{message.organization}</p>}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className={message.status === "new" ? "font-semibold" : "font-medium"}>{message.subject}</p>
              {message.enquiry_type && <span className="rounded-full bg-secondary px-2 py-0.5 text-xs">{message.enquiry_type}</span>}
              {message.urgency && message.urgency !== "Normal" && <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">{message.urgency}</span>}
            </div>
            <p className="line-clamp-1 text-sm text-muted-foreground">{message.message}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${statusStyles[message.status]}`}>{message.status}</span>
            <span className="text-xs text-muted-foreground">{new Date(message.created_at).toLocaleDateString()}</span>
          </div>
        </button>)}
        {!query.isLoading && !query.data?.length && <div className="grid place-items-center p-12 text-center"><MessageSquare className="mb-3 h-9 w-9 text-muted-foreground" /><p className="font-medium">No contact messages</p><p className="text-sm text-muted-foreground">New website enquiries will appear here.</p></div>}
      </div>
    </div>
    <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-3xl max-h-[calc(100dvh-2rem)] overflow-y-auto p-4 sm:p-6">
        <DialogHeader><DialogTitle>{selected?.subject}</DialogTitle></DialogHeader>
        {selected && <div className="space-y-5">
          <div className="rounded-lg bg-secondary p-4 text-sm">
            <p className="font-semibold">{selected.name}</p>
            <p><a className="text-primary hover:underline" href={`mailto:${selected.email}`}>{selected.email}</a>{selected.phone ? ` · ${selected.phone}` : ""}</p>
            <p className="mt-1 text-xs text-muted-foreground">Received {new Date(selected.created_at).toLocaleString()}</p>
          </div>
          <div className="grid gap-3 rounded-lg border p-4 text-sm sm:grid-cols-2">
            <Field label="Enquiry" value={selected.enquiry_type} />
            <Field label="Audience" value={selected.audience} />
            <Field label="Organisation" value={selected.organization} />
            <Field label="Role" value={selected.role_title} />
            <Field label="Membership" value={selected.membership_status} />
            <Field label="Preferred contact" value={selected.preferred_contact_method} />
            <Field label="Urgency" value={selected.urgency || "Normal"} />
            <Field label="Consent" value={selected.consent ? "Yes" : "No"} />
          </div>
          {selected.metadata && <pre className="max-h-44 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-muted p-4 text-xs">{typeof selected.metadata === "string" ? selected.metadata : JSON.stringify(selected.metadata, null, 2)}</pre>}
          <p className="whitespace-pre-wrap break-words text-sm leading-6">{selected.message}</p>
          <label className="block space-y-2"><span className="text-sm font-medium">Admin notes</span><Textarea rows={4} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Internal follow-up notes" /></label>
        </div>}
        <DialogFooter className="flex-wrap sm:justify-between">
          <div className="flex gap-2">
            {selected && <Button variant="destructive" size="sm" onClick={() => remove.mutate(selected.id)}><Trash2 className="h-4 w-4" /> Delete</Button>}
            {selected && <Button variant="outline" size="sm" onClick={() => update.mutate({ id: selected.id, data: { status: "archived" } })}><Archive className="h-4 w-4" /> Archive</Button>}
          </div>
          <div className="flex gap-2">
            {selected && <Button variant="outline" onClick={() => update.mutate({ id: selected.id, data: { admin_notes: notes } })}>Save notes</Button>}
            {selected && <Button asChild onClick={() => update.mutate({ id: selected.id, data: { status: "replied", admin_notes: notes } })}><a href={`mailto:${selected.email}?subject=${encodeURIComponent(`Re: ${selected.subject}`)}`}><Mail className="h-4 w-4" /> Reply</a></Button>}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </DashboardLayout>;
};

export default AdminContactMessages;
