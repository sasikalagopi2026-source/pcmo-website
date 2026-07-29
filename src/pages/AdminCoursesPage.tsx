import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookCopy, BookOpen, CheckCircle2, CircleDollarSign, Eye, Pencil, Plus, Power, Trash2, Users } from "lucide-react";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import AdminDataTable from "@/components/AdminDataTable";
import { api, resourceApi } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

type CourseRow = {
  id: string; title: string; category?: string; price: number; duration?: string; status: string;
  totalModules: number; enrolledMembers: number; completionPercentage: number;
  completedMembers: number; pendingMembers: number; averageCompletionHours: number;
};
type CourseDashboard = {
  overview: Record<"totalCourses" | "activeCourses" | "inactiveCourses" | "freeCourses" | "paidCourses" | "completionPercentage", number>;
  courses: CourseRow[];
  modules: Array<Record<string, string | number | null>>;
  assessments: Array<Record<string, string | number | null>>;
  questions: Array<Record<string, string | number | null>>;
  members: Array<Record<string, string | number | null>>;
};
type CourseForm = {
  title: string; slug: string; description: string; level: string; duration: string;
  credits: number; category: string; instructor: string; price: number; capacity: number; status: string;
};

const emptyForm: CourseForm = {
  title: "", slug: "", description: "", level: "Beginner", duration: "", credits: 0,
  category: "", instructor: "", price: 0, capacity: 0, status: "draft",
};

const AdminCoursesPage = () => {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<CourseRow | null>(null);
  const [form, setForm] = useState<CourseForm | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const dashboard = useQuery({
    queryKey: ["admin-course-dashboard"],
    queryFn: () => api<CourseDashboard>("/api/admin/course-dashboard"),
  });
  const detail = useQuery({
    queryKey: ["resource-course", editing?.id],
    queryFn: () => resourceApi.get<CourseForm & { id: string }>("courses", editing!.id),
    enabled: Boolean(editing),
  });

  const save = useMutation({
    mutationFn: () => editing
      ? resourceApi.update("courses", editing.id, form ?? {})
      : resourceApi.create("courses", form ?? {}),
    onSuccess: () => {
      setEditing(null);
      setForm(null);
      void queryClient.invalidateQueries({ queryKey: ["admin-course-dashboard"] });
      void queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
  });
  const remove = useMutation({
    mutationFn: (id: string) => resourceApi.remove("courses", id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["admin-course-dashboard"] }),
  });
  const duplicate = useMutation({
    mutationFn: (id: string) => api<{ id: string }>(`/api/admin/courses/${id}/duplicate`, { method: "POST" }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["admin-course-dashboard"] }),
  });
  const toggleStatus = useMutation({
    mutationFn: (course: CourseRow) => api(`/api/admin/courses/${course.id}/status`, { method: "PUT", body: JSON.stringify({ status: course.status === "published" ? "draft" : "published" }) }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["admin-course-dashboard"] }),
  });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
  };
  const openEdit = async (course: CourseRow) => {
    setEditing(course);
    const record = await resourceApi.get<CourseForm>("courses", course.id);
    setForm({ ...emptyForm, ...record });
  };
  const cards = useMemo(() => {
    const values = dashboard.data?.overview;
    return [
      { label: "Total courses", value: values?.totalCourses ?? 0, icon: BookOpen },
      { label: "Active / inactive", value: `${values?.activeCourses ?? 0} / ${values?.inactiveCourses ?? 0}`, icon: CheckCircle2 },
      { label: "Free / paid", value: `${values?.freeCourses ?? 0} / ${values?.paidCourses ?? 0}`, icon: CircleDollarSign },
      { label: "Average completion", value: `${values?.completionPercentage ?? 0}%`, icon: Users },
    ];
  }, [dashboard.data]);
  const filteredCourses = dashboard.data?.courses.filter((course) =>
    course.title.toLowerCase().includes(search.toLowerCase()) &&
    (statusFilter === "all" || course.status === statusFilter)
  ) ?? [];

  return (
    <DashboardLayout>
      <div className="max-w-[1500px] space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Badge variant="secondary">Live course intelligence</Badge>
            <h1 className="mt-3 font-heading text-2xl font-bold">Courses Dashboard</h1>
            <p className="mt-1 text-sm text-muted-foreground">Courses, modules, assessments, questions, and member progress in one place.</p>
          </div>
          <Button asChild><Link to="/admin/education/courses/create"><Plus className="h-4 w-4" /> Add course</Link></Button>
        </div>

        {dashboard.error && <p className="text-sm text-destructive">{dashboard.error.message}</p>}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => (
            <article key={card.label} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between"><p className="text-sm text-muted-foreground">{card.label}</p><card.icon className="h-5 w-5 text-primary" /></div>
              <p className="mt-3 text-2xl font-bold">{card.value}</p>
            </article>
          ))}
        </div>

        <Tabs defaultValue="courses">
          <TabsList className="h-auto flex-wrap justify-start">
            <TabsTrigger value="courses">Course list</TabsTrigger>
            <TabsTrigger value="modules">Module tracking</TabsTrigger>
            <TabsTrigger value="assessments">Assessments</TabsTrigger>
            <TabsTrigger value="questions">Question tracker</TabsTrigger>
            <TabsTrigger value="members">Member progress</TabsTrigger>
          </TabsList>

          <TabsContent value="courses" className="mt-4">
            <div className="mb-4 flex flex-wrap gap-3"><Input className="max-w-sm" placeholder="Search courses" value={search} onChange={(e) => setSearch(e.target.value)} /><select className="rounded-md border bg-background px-3" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="all">All statuses</option><option value="published">Published</option><option value="draft">Draft</option><option value="waiting">Waiting</option><option value="archived">Archived</option></select></div>
            <section className="overflow-x-auto rounded-xl border border-border bg-card">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Course</TableHead><TableHead>Category</TableHead><TableHead>Free/Paid</TableHead>
                  <TableHead>Duration</TableHead><TableHead>Modules</TableHead><TableHead>Enrolled</TableHead>
                  <TableHead>Completion</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {filteredCourses.map((course) => (
                    <TableRow key={course.id}>
                      <TableCell className="font-medium">{course.title}</TableCell>
                      <TableCell>{course.category || "—"}</TableCell>
                      <TableCell>{Number(course.price) > 0 ? "Paid" : "Free"}</TableCell>
                      <TableCell>{course.duration || "—"}</TableCell>
                      <TableCell>{course.totalModules}</TableCell>
                      <TableCell>{course.enrolledMembers}</TableCell>
                      <TableCell className="min-w-[150px]"><div className="flex items-center gap-2"><Progress value={course.completionPercentage} className="h-2" /><span className="text-xs">{course.completionPercentage}%</span></div></TableCell>
                      <TableCell><Badge variant={course.status === "published" ? "default" : "secondary"}>{course.status}</Badge></TableCell>
                      <TableCell><div className="flex gap-1">
                        <Button asChild size="icon" variant="ghost" title="View"><Link to={`/admin/education/courses/${course.id}/details`}><Eye className="h-4 w-4" /></Link></Button>
                        <Button asChild size="icon" variant="ghost" title="Edit"><Link to={`/admin/education/courses/${course.id}/edit`}><Pencil className="h-4 w-4" /></Link></Button>
                        <Button asChild size="icon" variant="ghost" title="Manage modules"><Link to={`/admin/education/courses/${course.id}/modules`}><BookOpen className="h-4 w-4" /></Link></Button>
                        <Button size="icon" variant="ghost" title="Publish/unpublish" onClick={() => toggleStatus.mutate(course)}><Power className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" title="Duplicate" onClick={() => duplicate.mutate(course.id)}><BookCopy className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" title="Delete" onClick={() => window.confirm(`Delete ${course.title}?`) && remove.mutate(course.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </section>
          </TabsContent>

          <TabsContent value="modules" className="mt-4">
            <AdminDataTable title="Module Tracking" description="Live module completion, pending members, progress, and average completion time." exportName="course-modules" rows={dashboard.data?.modules ?? []} columns={[
              { key: "courseTitle", label: "Course" }, { key: "moduleTitle", label: "Module" }, { key: "duration", label: "Duration" },
              { key: "enrolledMembers", label: "Enrolled" }, { key: "completedMembers", label: "Completed" }, { key: "pendingMembers", label: "Pending" },
              { key: "completionPercentage", label: "Completion %" }, { key: "averageCompletionHours", label: "Avg Hours" },
            ]} />
          </TabsContent>
          <TabsContent value="assessments" className="mt-4">
            <AdminDataTable title="Assessment Tracking" description="Questions, attempts, pass/fail results, retakes, and admin-only incorrect-answer totals." exportName="course-assessments" rows={dashboard.data?.assessments ?? []} columns={[
              { key: "courseTitle", label: "Course" }, { key: "totalQuestions", label: "Questions" }, { key: "attemptedMembers", label: "Attempted Members" },
              { key: "passedCount", label: "Passed" }, { key: "failedCount", label: "Failed" }, { key: "retakeCount", label: "Retakes" }, { key: "incorrectAnswers", label: "Incorrect Answers" },
            ]} />
          </TabsContent>
          <TabsContent value="questions" className="mt-4">
            <AdminDataTable title="Question Tracker" description="Correct answers, wrong-attempt totals, most-failed ordering, and course/module relationships." exportName="question-tracker" rows={dashboard.data?.questions ?? []} columns={[
              { key: "courseTitle", label: "Course" }, { key: "moduleIndex", label: "Module" }, { key: "question", label: "Question" },
              { key: "correctAnswer", label: "Correct Answer" }, { key: "wrongAttempts", label: "Wrong Attempts" },
            ]} />
          </TabsContent>
          <TabsContent value="members" className="mt-4">
            <AdminDataTable title="Member Progress" description="Includes every registered student, including members with no enrollment yet." exportName="member-course-progress" rows={dashboard.data?.members ?? []} columns={[
              { key: "memberName", label: "Member" }, { key: "email", label: "Email" }, { key: "memberType", label: "Free/Paid" },
              { key: "courseEnrollments", label: "Enrollments" }, { key: "averageProgress", label: "Progress %" },
              { key: "pendingCourses", label: "Pending Courses" }, { key: "completedCourses", label: "Completed Courses" },
              { key: "completedCertifications", label: "Certifications" },
            ]} />
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={Boolean(form)} onOpenChange={(open) => { if (!open) { setForm(null); setEditing(null); } }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader><DialogTitle>{editing ? "Edit course" : "Add course"}</DialogTitle></DialogHeader>
          {detail.isLoading && editing && !form ? <p>Loading…</p> : form && (
            <div className="grid gap-4 sm:grid-cols-2">
              {([
                ["title", "Title"], ["slug", "Slug"], ["level", "Level"], ["duration", "Duration"],
                ["category", "Category"], ["instructor", "Instructor"], ["credits", "Credits"],
                ["price", "Price"], ["capacity", "Capacity"], ["status", "Status"],
              ] as Array<[keyof CourseForm, string]>).map(([key, label]) => (
                <label key={key} className="space-y-2"><Label>{label}</Label><Input type={["credits", "price", "capacity"].includes(key) ? "number" : "text"} value={String(form[key])} onChange={(event) => setForm({ ...form, [key]: ["credits", "price", "capacity"].includes(key) ? Number(event.target.value) : event.target.value })} /></label>
              ))}
              <label className="space-y-2 sm:col-span-2"><Label>Description</Label><Textarea rows={4} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
            </div>
          )}
          {save.error && <p className="text-sm text-destructive">{save.error.message}</p>}
          <DialogFooter><Button variant="outline" onClick={() => { setForm(null); setEditing(null); }}>Cancel</Button><Button disabled={!form?.title || !form?.slug || save.isPending} onClick={() => save.mutate()}>Save course</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminCoursesPage;
