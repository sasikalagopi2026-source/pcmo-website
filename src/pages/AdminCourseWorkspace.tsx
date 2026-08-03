import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, BellRing, BookOpen, GripVertical, Plus, Save, Upload } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import AdminDataTable from "@/components/AdminDataTable";
import { api, getToken, resourceApi } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Workspace = {
  course: Record<string, any>;
  modules: Array<Record<string, any>>;
  assessments: Array<Record<string, any>>;
  questions: Array<Record<string, any>>;
  members: Array<Record<string, any>>;
  campaigns: Array<Record<string, any>>;
  revenue: Array<Record<string, any>>;
};

const sections = ["details", "edit", "modules", "assessments", "questions", "members", "reports", "notifications"] as const;
const baseCourse = {
  title: "", slug: "", description: "", level: "Beginner", duration: "", credits: 0, category: "",
  instructor: "", price: 0, capacity: 0, status: "draft", expiry_date: "", certificate_template: "",
  coupon_code: "", discount_percent: 0, thumbnail_url: "",
};
const sampleQuestions = `module_index,question_text,option_a,option_b,option_c,option_d,correct_option,explanation,active
0,What is the main purpose of project control?,Track and guide delivery,Replace governance,Remove stakeholders,Ignore baselines,Track and guide delivery,Project control helps teams compare progress against baselines.,true`;

type BulkQuestion = {
  id?: string;
  module_index: number;
  question_text: string;
  options: string[];
  correct_option: string;
  explanation?: string;
  sort_order?: number;
  active?: boolean;
};

const parseCsvLine = (line: string) => {
  const cells: string[] = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"' && line[index + 1] === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      cells.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current.trim());
  return cells;
};

const parseBulkQuestions = (value: string): BulkQuestion[] => {
  const text = value.trim();
  if (!text) return [];
  if (text.startsWith("[")) {
    return JSON.parse(text).map((row: any, index: number) => ({
      ...row,
      module_index: Number(row.module_index ?? row.moduleIndex ?? 0),
      options: Array.isArray(row.options) ? row.options.map(String) : String(row.options ?? "").split("|").map((item) => item.trim()).filter(Boolean),
      sort_order: row.sort_order === undefined ? index : Number(row.sort_order),
      active: row.active === undefined ? true : ["true", "1", "yes", "on"].includes(String(row.active).toLowerCase()),
    }));
  }
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  const headers = parseCsvLine(lines[0]).map((header) => header.trim().toLowerCase());
  return lines.slice(1).map((line, index) => {
    const values = parseCsvLine(line);
    const row = Object.fromEntries(headers.map((header, headerIndex) => [header, values[headerIndex] ?? ""]));
    const options = [row.option_a, row.option_b, row.option_c, row.option_d, row.option_e]
      .filter(Boolean)
      .map(String);
    const pipeOptions = String(row.options ?? "").split("|").map((item) => item.trim()).filter(Boolean);
    return {
      id: row.id || undefined,
      module_index: Number(row.module_index || 0),
      question_text: String(row.question_text || row.question || ""),
      options: options.length ? options : pipeOptions,
      correct_option: String(row.correct_option || row.answer || ""),
      explanation: String(row.explanation || ""),
      sort_order: row.sort_order ? Number(row.sort_order) : index,
      active: row.active ? ["true", "1", "yes", "on"].includes(String(row.active).toLowerCase()) : true,
    };
  });
};

const AdminCourseWorkspace = ({ mode }: { mode: typeof sections[number] | "create" }) => {
  const { courseId = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const workspace = useQuery({
    queryKey: ["course-workspace", courseId],
    queryFn: () => api<Workspace>(`/api/admin/courses/${courseId}/workspace`),
    enabled: Boolean(courseId),
  });
  const [form, setForm] = useState<Record<string, any> | null>(mode === "create" ? baseCourse : null);
  const [draft, setDraft] = useState({ campaignType: "pending_reminder", title: "Pending course reminder", message: "Please continue your course and complete the remaining modules.", channels: ["in_app"], targetStatus: "active", status: "draft" });
  const [dragged, setDragged] = useState<string | null>(null);
  const [bulkMode, setBulkMode] = useState<"append" | "upsert" | "replace">("upsert");
  const [bulkText, setBulkText] = useState(sampleQuestions);
  const [bulkError, setBulkError] = useState("");
  const course = workspace.data?.course;
  const editForm = form ?? (course ? { ...baseCourse, ...course } : null);
  const refresh = () => void queryClient.invalidateQueries({ queryKey: ["course-workspace", courseId] });

  const saveCourse = useMutation({
    mutationFn: () => mode === "create" ? resourceApi.create<{ id: string }>("courses", form ?? {}) : resourceApi.update("courses", courseId, editForm ?? {}),
    onSuccess: (result: any) => navigate(`/admin/education/courses/${result.id ?? courseId}/details`),
  });
  const createRecord = useMutation({
    mutationFn: ({ resource, body }: { resource: string; body: Record<string, any> }) => resourceApi.create(resource, { ...body, course_id: courseId }),
    onSuccess: refresh,
  });
  const removeRecord = useMutation({
    mutationFn: ({ resource, id }: { resource: string; id: string }) => resourceApi.remove(resource, id),
    onSuccess: refresh,
  });
  const sendCampaign = useMutation({
    mutationFn: (status: "draft" | "sent") => api(`/api/admin/courses/${courseId}/campaigns`, { method: "POST", body: JSON.stringify({ ...draft, status }) }),
    onSuccess: refresh,
  });
  const reorder = useMutation({
    mutationFn: (ids: string[]) => api(`/api/admin/courses/${courseId}/modules/order`, { method: "PUT", body: JSON.stringify({ ids }) }),
    onSuccess: refresh,
  });
  const bulkQuestions = useMutation({
    mutationFn: () => {
      const questions = parseBulkQuestions(bulkText);
      if (!questions.length) throw new Error("Add at least one question.");
      const invalid = questions.find((question) => !question.question_text || question.options.length < 2 || !question.correct_option);
      if (invalid) throw new Error("Each question needs question_text, at least two options, and correct_option.");
      setBulkError("");
      return api(`/api/admin/courses/${courseId}/questions/bulk`, { method: "POST", body: JSON.stringify({ mode: bulkMode, questions }) });
    },
    onSuccess: refresh,
    onError: (error) => setBulkError(error.message),
  });
  const upload = async (file?: File) => {
    if (!file) return;
    const body = new FormData();
    body.append("thumbnail", file);
    const response = await fetch(`/api/admin/courses/${courseId}/thumbnail`, { method: "POST", headers: { Authorization: `Bearer ${getToken()}` }, body });
    if (!response.ok) throw new Error("Thumbnail upload failed");
    refresh();
  };
  const nav = courseId ? sections.map((section) => ({ section, href: `/admin/education/courses/${courseId}/${section}` })) : [];
  let bulkPreview = 0;
  try {
    bulkPreview = parseBulkQuestions(bulkText).length;
  } catch {
    bulkPreview = 0;
  }

  if (workspace.error) return <DashboardLayout><p className="text-destructive">{workspace.error.message}</p></DashboardLayout>;

  const CourseForm = () => editForm && (
    <div className="grid gap-4 rounded-xl border border-border bg-card p-6 sm:grid-cols-2">
      {[
        ["title", "Title"], ["slug", "Slug"], ["level", "Level"], ["duration", "Duration"], ["category", "Category"],
        ["instructor", "Instructor"], ["credits", "Credits"], ["price", "Price"], ["capacity", "Capacity"],
        ["expiry_date", "Expiry date"], ["certificate_template", "Certificate template"], ["coupon_code", "Coupon code"],
        ["discount_percent", "Discount %"], ["status", "Status"],
      ].map(([key, label]) => <label key={key} className="space-y-2"><Label>{label}</Label><Input type={["credits", "price", "capacity", "discount_percent"].includes(key) ? "number" : key === "expiry_date" ? "date" : "text"} value={editForm[key] ?? ""} onChange={(event) => setForm({ ...editForm, [key]: ["credits", "price", "capacity", "discount_percent"].includes(key) ? Number(event.target.value) : event.target.value })} /></label>)}
      <label className="space-y-2 sm:col-span-2"><Label>Description</Label><Textarea rows={5} value={editForm.description ?? ""} onChange={(event) => setForm({ ...editForm, description: event.target.value })} /></label>
      <div className="sm:col-span-2"><Button onClick={() => saveCourse.mutate()} disabled={!editForm.title || !editForm.slug || saveCourse.isPending}><Save className="h-4 w-4" /> Save course</Button></div>
    </div>
  );

  return <DashboardLayout><div className="max-w-7xl space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><Button asChild size="sm" variant="ghost"><Link to="/admin/education/courses"><ArrowLeft className="h-4 w-4" /> Courses</Link></Button><h1 className="mt-2 font-heading text-2xl font-bold">{mode === "create" ? "Create Course" : course?.title ?? "Course"}</h1></div>
      {course && <Badge>{course.status}</Badge>}
    </div>
    {nav.length > 0 && <nav className="flex flex-wrap gap-2">{nav.map(({ section, href }) => <Button key={section} asChild size="sm" variant={mode === section ? "default" : "outline"}><Link to={href}>{section[0].toUpperCase() + section.slice(1)}</Link></Button>)}</nav>}

    {(mode === "create" || mode === "edit") && <CourseForm />}

    {mode === "details" && course && <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <div className="space-y-3 rounded-xl border border-border bg-card p-4">
        {course.thumbnail_url ? <img src={course.thumbnail_url} alt="" className="aspect-video w-full rounded-lg object-cover" /> : <div className="grid aspect-video place-items-center rounded-lg bg-secondary"><BookOpen /></div>}
        <Label className="flex cursor-pointer items-center gap-2 rounded-md border p-2 text-sm"><Upload className="h-4 w-4" /> Upload thumbnail<Input type="file" accept="image/*" className="hidden" onChange={(event) => void upload(event.target.files?.[0])} /></Label>
      </div>
      <div className="rounded-xl border border-border bg-card p-6"><p className="text-sm text-muted-foreground">{course.category} · {course.level}</p><p className="mt-3 leading-7">{course.description || "No description."}</p><div className="mt-5 grid gap-3 sm:grid-cols-3"><div>Price<br/><strong>{Number(course.price) ? `$${course.price}` : "Free"}</strong></div><div>Expiry<br/><strong>{course.expiry_date || "None"}</strong></div><div>Certificate<br/><strong>{course.certificate_template || "Not mapped"}</strong></div></div><Button asChild className="mt-6" variant="outline"><Link to={`/courses/${courseId}`}>Preview course as member</Link></Button></div>
    </div>}

    {mode === "modules" && <div className="space-y-4"><QuickCreate title="Add Module" fields={["title", "material_type", "duration", "description"]} onCreate={(body) => createRecord.mutate({ resource: "course-materials", body: { ...body, sort_order: workspace.data?.modules.length ?? 0, status: "published" } })} />
      <div className="space-y-2">{workspace.data?.modules.map((module) => <div key={module.id} draggable onDragStart={() => setDragged(module.id)} onDragOver={(e) => e.preventDefault()} onDrop={() => { if (!dragged || dragged === module.id) return; const ids = [...(workspace.data?.modules.map((item) => item.id) ?? [])]; const from = ids.indexOf(dragged); const to = ids.indexOf(module.id); ids.splice(to, 0, ids.splice(from, 1)[0]); reorder.mutate(ids); setDragged(null); }} className="flex items-center gap-3 rounded-lg border bg-card p-4"><GripVertical className="h-4 w-4 text-muted-foreground" /><div className="flex-1"><strong>{module.title}</strong><p className="text-xs text-muted-foreground">{module.material_type} · {module.completed_members} completed</p></div><Button size="sm" variant="destructive" onClick={() => removeRecord.mutate({ resource: "course-materials", id: module.id })}>Delete</Button></div>)}</div>
    </div>}

    {mode === "assessments" && <><QuickCreate title="Add Assessment" fields={["title", "assessment_type", "instructions", "passing_score", "max_attempts"]} onCreate={(body) => createRecord.mutate({ resource: "course-assessments", body: { ...body, sort_order: workspace.data?.assessments.length ?? 0, status: "published" } })} /><AdminDataTable title="Assessments" description="Course assessment configuration." exportName="assessments" rows={workspace.data?.assessments ?? []} columns={[{key:"title",label:"Title"},{key:"assessment_type",label:"Type"},{key:"passing_score",label:"Pass %"},{key:"max_attempts",label:"Attempts"},{key:"status",label:"Status"}]} /></>}
    {mode === "questions" && <div className="space-y-4">
      <section className="rounded-xl border bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-heading text-lg font-semibold">Bulk Question Upload / Update</h2>
            <p className="mt-1 text-sm text-muted-foreground">Paste JSON or CSV, or upload a `.csv` / `.json` file. Use matching `id` or `question_text` to update existing questions.</p>
          </div>
          <Badge variant="secondary">{bulkPreview} parsed</Badge>
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-[220px_1fr]">
          <div className="space-y-3">
            <label className="space-y-2 block">
              <Label>Mode</Label>
              <select className="w-full rounded-md border bg-background p-2 text-sm" value={bulkMode} onChange={(event) => setBulkMode(event.target.value as "append" | "upsert" | "replace")}>
                <option value="upsert">Update matching, add new</option>
                <option value="append">Append only</option>
                <option value="replace">Replace course bank</option>
              </select>
            </label>
            <label className="space-y-2 block">
              <Label>Upload CSV / JSON</Label>
              <Input type="file" accept=".csv,.json,text/csv,application/json" onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => setBulkText(String(reader.result ?? ""));
                reader.readAsText(file);
              }} />
            </label>
            <Button className="w-full" onClick={() => bulkQuestions.mutate()} disabled={bulkQuestions.isPending || !bulkPreview}>
              <Upload className="h-4 w-4" /> Apply bulk questions
            </Button>
            {bulkQuestions.data && <p className="text-sm text-success">Bulk update complete.</p>}
            {(bulkError || bulkQuestions.error) && <p className="text-sm text-destructive">{bulkError || bulkQuestions.error?.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Question data</Label>
            <Textarea rows={12} value={bulkText} onChange={(event) => setBulkText(event.target.value)} />
            <p className="text-xs text-muted-foreground">CSV headers: `id`, `module_index`, `question_text`, `option_a`, `option_b`, `option_c`, `option_d`, `correct_option`, `explanation`, `active`. JSON should be an array of question objects with `options` as an array or pipe-separated string.</p>
          </div>
        </div>
      </section>
      <QuickCreate title="Add Question" fields={["question_text", "options", "correct_option", "module_index", "explanation"]} onCreate={(body) => createRecord.mutate({ resource: "quiz-questions", body: { ...body, options: String(body.options).split("|").map((x) => x.trim()), sort_order: workspace.data?.questions.length ?? 0, active: 1 } })} />
      <AdminDataTable title="Question Tracker" description="Questions, correct answers, and wrong attempts." exportName="questions" rows={workspace.data?.questions ?? []} columns={[{key:"module_index",label:"Module"},{key:"question_text",label:"Question"},{key:"correct_option",label:"Correct Answer"},{key:"wrong_attempts",label:"Wrong Attempts"}]} />
    </div>}
    {mode === "members" && <AdminDataTable title="Members" description="Filterable in-browser course enrollment report." exportName="course-members" rows={workspace.data?.members ?? []} columns={[{key:"display_name",label:"Member"},{key:"email",label:"Email"},{key:"member_type",label:"Free/Paid"},{key:"progress",label:"Progress %"},{key:"status",label:"Status"},{key:"enrolled_at",label:"Enrolled"}]} />}
    {mode === "reports" && workspace.data && <CourseReports workspace={workspace.data} courseId={courseId} />}
    {mode === "notifications" && <div className="grid gap-6 lg:grid-cols-2"><div className="space-y-4 rounded-xl border bg-card p-6"><h2 className="font-heading text-lg font-semibold"><BellRing className="mr-2 inline h-5 w-5" />Notification Campaign</h2><Input value={draft.title} onChange={(e) => setDraft({...draft,title:e.target.value})} placeholder="Title" /><Textarea value={draft.message} onChange={(e) => setDraft({...draft,message:e.target.value})} /><select className="w-full rounded-md border bg-background p-2" value={draft.campaignType} onChange={(e) => setDraft({...draft,campaignType:e.target.value})}><option value="course_reminder">Course reminder</option><option value="pending_reminder">Pending course reminder</option><option value="newsletter">Newsletter campaign</option></select><div className="flex flex-wrap gap-3">{["in_app","email","whatsapp"].map((channel) => <label key={channel} className="text-sm"><input type="checkbox" checked={draft.channels.includes(channel)} onChange={(e) => setDraft({...draft,channels:e.target.checked?[...draft.channels,channel]:draft.channels.filter((x)=>x!==channel)})} /> {channel}</label>)}</div><div className="flex gap-2"><Button variant="outline" onClick={() => sendCampaign.mutate("draft")}>Save draft</Button><Button onClick={() => sendCampaign.mutate("sent")}>Send now</Button></div></div><AdminDataTable title="Campaign History" description="Database-backed drafts and sent campaigns." exportName="course-campaigns" rows={workspace.data?.campaigns ?? []} columns={[{key:"title",label:"Title"},{key:"campaign_type",label:"Type"},{key:"status",label:"Status"},{key:"recipient_count",label:"Recipients"},{key:"updated_at",label:"Updated"}]} /></div>}
  </div></DashboardLayout>;
};

const QuickCreate = ({ title, fields, onCreate }: { title: string; fields: string[]; onCreate: (body: Record<string, any>) => void }) => {
  const [body, setBody] = useState<Record<string, any>>({});
  return <div className="rounded-xl border bg-card p-5"><h2 className="font-semibold">{title}</h2><div className="mt-3 grid gap-3 sm:grid-cols-2">{fields.map((field) => <Input key={field} placeholder={field.replaceAll("_"," ")} value={body[field] ?? ""} onChange={(e) => setBody({...body,[field]:["passing_score","max_attempts","timer_minutes","module_index"].includes(field)?Number(e.target.value):e.target.value})} />)}</div><Button className="mt-3" onClick={() => { onCreate(body); setBody({}); }}><Plus className="h-4 w-4" /> Add</Button></div>;
};
const ReportCard = ({ label, value }: { label: string; value: string }) => <div className="rounded-xl border bg-card p-5"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-bold">{value}</p></div>;
const CourseReports = ({ workspace, courseId }: { workspace: Workspace; courseId: string }) => {
  const [month, setMonth] = useState("");
  const [member, setMember] = useState("");
  const [status, setStatus] = useState("all");
  const revenue = workspace.revenue.filter((row) => !month || row.month === month);
  const members = workspace.members.filter((row) =>
    (!member || `${row.display_name} ${row.email}`.toLowerCase().includes(member.toLowerCase())) &&
    (status === "all" || row.status === status) &&
    (!month || String(row.enrolled_at ?? "").startsWith(month))
  );
  const total = revenue.reduce((sum, row) => sum + Number(row.course_revenue ?? 0), 0);
  return <div className="space-y-5">
    <div className="grid gap-3 rounded-xl border bg-card p-4 sm:grid-cols-3"><label className="text-sm">Date/month<Input type="month" className="mt-1" value={month} onChange={(e) => setMonth(e.target.value)} /></label><label className="text-sm">Member<Input className="mt-1" placeholder="Name or email" value={member} onChange={(e) => setMember(e.target.value)} /></label><label className="text-sm">Status<select className="mt-1 w-full rounded-md border bg-background p-2" value={status} onChange={(e) => setStatus(e.target.value)}><option value="all">All</option><option value="active">Pending</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></label></div>
    <div className="grid gap-4 sm:grid-cols-3"><ReportCard label="Paid course revenue" value={`$${total.toFixed(2)}`} /><ReportCard label="Subscription revenue" value="See Revenue Analytics" /><ReportCard label="Course-wise earnings" value={`$${total.toFixed(2)}`} /></div>
    <AdminDataTable title="Monthly Revenue Report" description="Filtered by course and date. Excel and PDF downloads use the filtered rows." exportName={`course-${courseId}-revenue`} rows={revenue} columns={[{key:"month",label:"Month"},{key:"enrollments",label:"Enrollments"},{key:"course_revenue",label:"Course Revenue"}]} />
    <AdminDataTable title="Filtered Member Report" description="Filtered by date, course, member, and status." exportName={`course-${courseId}-members`} rows={members} columns={[{key:"display_name",label:"Member"},{key:"email",label:"Email"},{key:"member_type",label:"Free/Paid"},{key:"progress",label:"Progress %"},{key:"status",label:"Status"},{key:"enrolled_at",label:"Enrolled"}]} />
  </div>;
};

export default AdminCourseWorkspace;
