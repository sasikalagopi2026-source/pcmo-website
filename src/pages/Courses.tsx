import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Filter, Search } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import MyCoursesSection, { type LiveCourse } from "@/components/MyCoursesSection";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import CurrencySelector from "@/components/CurrencySelector";
import { useCurrency } from "@/hooks/useCurrency";

const Courses = () => {
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState("all");
  const { format } = useCurrency();
  const queryClient = useQueryClient();
  const { data: courses = [], isLoading, error } = useQuery({
    queryKey: ["courses"],
    queryFn: () => api<LiveCourse[]>("/api/courses"),
  });
  const enrollment = useMutation({
    mutationFn: ({ id, enrolled, price }: { id: string; enrolled: boolean; price: number }) => {
      if (enrolled) return api<{ checkoutUrl?: string; status?: string }>(`/api/courses/${id}/enroll`, { method: "DELETE" });
      if (price > 0) return api<{ checkoutUrl?: string; status?: string }>(`/api/courses/${id}/checkout`, { method: "POST" });
      return api<{ checkoutUrl?: string; status?: string }>(`/api/courses/${id}/enroll`, { method: "POST" });
    },
    onSuccess: (result, variables) => {
      if (result?.checkoutUrl) {
        window.location.href = result.checkoutUrl;
        return;
      }
      void queryClient.invalidateQueries({ queryKey: ["courses"] });
      if (!variables.enrolled) {
        void queryClient.invalidateQueries({ queryKey: ["student-dashboard"] });
      }
    },
  });

  const enrolled = courses.filter((course) => course.enrollment_status);
  const available = courses.filter((course) =>
    course.title.toLowerCase().includes(search.toLowerCase()) &&
    (level === "all" || course.level === level),
  );

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4"><h1 className="font-heading text-2xl font-bold">Courses</h1><CurrencySelector /></div>
      <div className="max-w-5xl space-y-8">
        <MyCoursesSection courses={enrolled} />
        <section>
          <h2 className="mb-4 font-heading text-lg font-bold">Course Catalogue</h2>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="relative min-w-[220px] flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search courses" className="w-full rounded-lg border border-border bg-card py-2.5 pl-10 pr-4 text-sm" />
            </div>
            <Filter className="h-4 w-4 text-muted-foreground" />
            {["all", "Beginner", "Intermediate", "Advanced"].map((item) => (
              <button key={item} onClick={() => setLevel(item)} className={`rounded-lg px-3 py-2 text-xs ${level === item ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>
                {item === "all" ? "All" : item}
              </button>
            ))}
          </div>
          {isLoading && <p className="text-sm text-muted-foreground">Loading courses…</p>}
          {error && <p className="text-sm text-destructive">{error.message}</p>}
          <div className="grid gap-4 sm:grid-cols-2">
            {available.map((course) => (
              <article key={course.id} className="rounded-xl border border-border bg-card p-5">
                <div className="flex gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-info/10"><BookOpen className="h-5 w-5 text-info" /></div>
                  <div className="flex-1">
                    <h3 className="font-heading text-sm font-semibold">{course.title}</h3>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{course.description}</p>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground"><span>{course.level}</span><span>{course.credits} credits</span><span>{course.duration}</span><span className="font-semibold text-primary">{Number(course.price ?? 0) > 0 ? `Paid · ${format(Number(course.price))}` : "Free"}</span></div>
                  </div>
                </div>
                <Button className="mt-4 w-full" variant={course.enrollment_status ? "outline" : "default"} disabled={enrollment.isPending} onClick={() => enrollment.mutate({ id: course.id, enrolled: Boolean(course.enrollment_status), price: Number(course.price ?? 0) })}>
                  {course.enrollment_status ? "Leave course" : Number(course.price ?? 0) > 0 ? "Buy now" : "Enroll now"}
                </Button>
                {course.enrollment_status && (
                  <Button asChild className="mt-2 w-full">
                    <Link to={`/courses/${course.id}`}>Open enrolled course</Link>
                  </Button>
                )}
                {course.preview_content?.sourceUrl && (
                  <Button asChild className="mt-2 w-full" variant="ghost">
                    <a href={course.preview_content.sourceUrl} target="_blank" rel="noreferrer">View course on PCMO</a>
                  </Button>
                )}
              </article>
            ))}
          </div>
          {!isLoading && available.length === 0 && <p className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">No courses found. An administrator can create and publish courses from the admin console.</p>}
        </section>
      </div>
    </DashboardLayout>
  );
};

export default Courses;
