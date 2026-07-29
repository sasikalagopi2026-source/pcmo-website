import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { resourceApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import RichCommentEditor, { RichTextPreview } from "@/components/RichCommentEditor";

export type CrudField = {
  key: string;
  label: string;
  type?: "text" | "number" | "date" | "datetime-local" | "textarea" | "json" | "richtext";
  required?: boolean;
};

type CrudRecord = { id: string; [key: string]: unknown };

const AdminCrudPage = ({
  title,
  description,
  resource,
  fields,
  hiddenValues,
}: {
  title: string;
  description: string;
  resource: string;
  fields: CrudField[];
  hiddenValues?: Record<string, unknown>;
}) => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<CrudRecord | null>(null);
  const [form, setForm] = useState<Record<string, unknown>>({});
  const queryKey = ["resource", resource, hiddenValues, search];
  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: () => resourceApi.list<CrudRecord>(resource, { search, limit: 100, ...(hiddenValues as Record<string, string>) }),
  });
  const rows = data?.rows ?? [];

  const save = useMutation({
    mutationFn: () => editing
      ? resourceApi.update(resource, editing.id, { ...form, ...hiddenValues })
      : resourceApi.create(resource, { ...form, ...hiddenValues }),
    onSuccess: () => {
      setEditing(null);
      setForm({});
      void queryClient.invalidateQueries({ queryKey: ["resource", resource] });
    },
  });
  const remove = useMutation({
    mutationFn: (id: string) => resourceApi.remove(resource, id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["resource", resource] }),
  });

  const openCreate = () => {
    setEditing(null);
    setForm(Object.fromEntries(fields.map((field) => [field.key, ""])));
  };
  const openEdit = (row: CrudRecord) => {
    setEditing(row);
    setForm(Object.fromEntries(fields.map((field) => [field.key, row[field.key] ?? ""])));
  };
  const dialogOpen = editing !== null || Object.keys(form).length > 0;
  const setValue = (field: CrudField, raw: string) => {
    let value: unknown = field.type === "number" ? Number(raw) : raw;
    if (field.type === "json") {
      try { value = JSON.parse(raw); } catch { value = raw; }
    }
    setForm((current) => ({ ...current, [field.key]: value }));
  };
  const printable = useMemo(() => (value: unknown) => typeof value === "object" ? JSON.stringify(value) : String(value ?? ""), []);

  return (
    <DashboardLayout>
      <div className="max-w-7xl space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div><h1 className="font-heading text-2xl font-bold">{title}</h1><p className="mt-1 text-sm text-muted-foreground">{description}</p></div>
          <Button onClick={openCreate}><Plus className="h-4 w-4" /> Add record</Button>
        </div>
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search records" className="pl-9" />
        </div>
        {error && <p className="text-sm text-destructive">{error.message}</p>}
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <Table>
            <TableHeader><TableRow>{fields.map((field) => <TableHead key={field.key}>{field.label}</TableHead>)}<TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  {fields.map((field) => <TableCell key={field.key} className="max-w-[280px]">{field.type === "richtext" ? <RichTextPreview value={String(row[field.key] ?? "")} compact/> : <span className="block truncate">{field.key === "user_id" && row.user_name ? `${String(row.user_name)}${row.user_email ? ` (${String(row.user_email)})` : ""}` : printable(row[field.key])}</span>}</TableCell>)}
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(row)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => window.confirm("Delete this record?") && remove.mutate(row.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && rows.length === 0 && <TableRow><TableCell colSpan={fields.length + 1} className="py-8 text-center text-muted-foreground">No records yet. Create the first one.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) { setEditing(null); setForm({}); } }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader><DialogTitle>{editing ? "Edit record" : "Create record"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            {fields.map((field) => {
              const value = field.type === "json"
                ? (typeof form[field.key] === "string" ? form[field.key] : JSON.stringify(form[field.key] ?? {}, null, 2))
                : String(form[field.key] ?? "");
              return (
                <label key={field.key} className={`space-y-2 ${["textarea", "json", "richtext"].includes(field.type ?? "") ? "sm:col-span-2" : ""}`}>
                  <Label>{field.label}</Label>
                  {field.type === "richtext" ? <RichCommentEditor value={value} onChange={(next) => setValue(field, next)} minHeight="180px" /> : ["textarea", "json"].includes(field.type ?? "")
                    ? <Textarea rows={field.type === "json" ? 6 : 4} value={value} onChange={(event) => setValue(field, event.target.value)} required={field.required} />
                    : <Input type={field.type ?? "text"} value={value} onChange={(event) => setValue(field, event.target.value)} required={field.required} />}
                </label>
              );
            })}
          </div>
          {save.error && <p className="text-sm text-destructive">{save.error.message}</p>}
          <DialogFooter><Button variant="outline" onClick={() => { setEditing(null); setForm({}); }}>Cancel</Button><Button onClick={() => save.mutate()} disabled={save.isPending}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminCrudPage;
