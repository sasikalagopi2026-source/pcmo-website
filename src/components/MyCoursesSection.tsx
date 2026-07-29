import { BookOpen, Clock } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useCurrency } from "@/hooks/useCurrency";
import { Link } from "react-router-dom";

export type LiveCourse = {
  id: string;
  title: string;
  description?: string | null;
  credits: number;
  progress?: number | null;
  level: string;
  duration?: string | null;
  last_viewed_at?: string | null;
  enrollment_status?: string | null;
  price?: number;
  preview_content?: {
    sourceUrl?: string;
    featuredImage?: string | null;
    syncedFrom?: string;
  } | null;
};

const MyCoursesSection = ({ courses }: { courses: LiveCourse[] }) => {
  const { format } = useCurrency();
  const courseState = (course: LiveCourse) => {
    const progress = Number(course.progress ?? 0);
    if (course.enrollment_status === "completed" || progress >= 100) return "Completed";
    if (course.last_viewed_at) return `Last viewed ${new Date(course.last_viewed_at).toLocaleDateString()}`;
    return "Not started";
  };

  return (
  <div className="animate-fade-in">
    <h2 className="mb-4 font-heading text-lg font-bold text-foreground">My Courses</h2>
    <div className="space-y-3">
      {courses.length === 0 && <div className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">You have not enrolled in a course yet.</div>}
      {courses.map((course) => (
        <Link
          key={course.id}
          to={`/courses/${course.id}`}
          aria-label={`Open ${course.title}`}
          className="block rounded-xl border border-border bg-card p-5 transition hover:border-primary/40 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <h3 className="font-heading text-sm font-semibold text-foreground">{course.title}</h3>
              <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{course.description}</p>
              <p className="mt-1 text-[11px] font-medium text-primary">{Number(course.price ?? 0) > 0 ? `Paid · ${format(Number(course.price))}` : "Free course"}</p>
            </div>
            <span className="rounded-lg bg-secondary px-2.5 py-1 text-xs">{course.level}</span>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1 text-xs text-muted-foreground"><BookOpen className="h-3 w-3" /> {course.credits} Credits</span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3 w-3" /> {courseState(course)}</span>
            <div className="ml-auto flex min-w-[140px] flex-1 items-center gap-2">
              <Progress value={Number(course.progress ?? 0)} className="h-2 flex-1" />
              <span className="text-xs font-medium">{Number(course.progress ?? 0)}%</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  </div>
  );
};

export default MyCoursesSection;
