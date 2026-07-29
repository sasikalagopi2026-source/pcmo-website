import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { LockKeyhole } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { api } from "@/lib/api";
import type { LiveCourse } from "@/components/MyCoursesSection";
import { Button } from "@/components/ui/button";

type Question = { id: string; course_id: string; module_index: number; question_text: string; options: string[]; explanation?: string };
type Result = { score: number; passed: boolean; incorrectCount: number; total: number; certificateId?: string | null };

const CertificationQuiz = () => {
  const [searchParams] = useSearchParams();
  const [courseId, setCourseId] = useState(searchParams.get("course") ?? "");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<Result | null>(null);
  const courses = useQuery({ queryKey: ["courses"], queryFn: () => api<LiveCourse[]>("/api/courses") });
  const enrolledCourses = courses.data?.filter((course) => Boolean(course.enrollment_status)) ?? [];
  const questions = useQuery({ queryKey: ["quiz", courseId], queryFn: () => api<Question[]>(`/api/courses/${courseId}/quiz`), enabled: Boolean(courseId) });
  const submit = useMutation({
    mutationFn: () => api<Result>(`/api/courses/${courseId}/quiz/submit`, { method: "POST", body: JSON.stringify({ answers }) }),
    onSuccess: setResult,
  });

  return (
    <DashboardLayout>
      <div className="max-w-3xl space-y-6">
        <h1 className="font-heading text-2xl font-bold">Certification Quiz</h1>
        <select value={courseId} onChange={(event) => { setCourseId(event.target.value); setAnswers({}); setResult(null); }} className="w-full rounded-lg border border-border bg-card p-3 text-sm">
          <option value="">Select an enrolled course</option>{enrolledCourses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}
        </select>
        {!courses.isLoading && enrolledCourses.length === 0 && <p className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">Enroll in a course before accessing its assessment.</p>}
        {questions.error && <div className="flex gap-3 rounded-xl border border-warning/30 bg-warning/10 p-5 text-sm"><LockKeyhole className="h-5 w-5 shrink-0" /><div><p className="font-semibold">Assessment locked</p><p className="mt-1">{questions.error.message}</p></div></div>}
        <div className="space-y-4">
          {questions.data?.map((question, index) => (
            <article key={question.id} className="rounded-xl border border-border bg-card p-5">
              <h2 className="font-semibold">{index + 1}. {question.question_text}</h2>
              <div className="mt-3 space-y-2">{question.options.map((option) => <label key={option} className="flex items-center gap-2 rounded-lg border border-border p-3 text-sm"><input type="radio" name={question.id} checked={answers[question.id] === option} onChange={() => setAnswers((current) => ({ ...current, [question.id]: option }))} />{option}</label>)}</div>
            </article>
          ))}
        </div>
        {questions.data?.length ? <Button onClick={() => submit.mutate()} disabled={submit.isPending}>Submit answers</Button> : courseId && !questions.isLoading && !questions.error ? <p className="text-sm text-muted-foreground">No quiz questions are configured for this course.</p> : null}
        {submit.error && <p className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive">{submit.error.message}</p>}
        {result && <div className={`rounded-xl p-5 ${result.passed ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}><p className="text-2xl font-bold">{result.score.toFixed(1)}%</p><p>{result.passed ? "Passed" : "Not passed"} - {result.incorrectCount} incorrect of {result.total}</p>{result.passed && <Button asChild className="mt-4" variant="outline"><Link to="/certifications">View certificate</Link></Button>}</div>}
      </div>
    </DashboardLayout>
  );
};

export default CertificationQuiz;
