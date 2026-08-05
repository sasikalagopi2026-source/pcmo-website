import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { AlertTriangle, LockKeyhole, ShieldCheck } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { api } from "@/lib/api";
import type { LiveCourse } from "@/components/MyCoursesSection";
import { Button } from "@/components/ui/button";

type Question = { id: string; course_id: string; module_index: number; question_text: string; options: string[]; explanation?: string };
type AssessmentConfig = {
  id: string | null;
  title: string;
  instructions: string;
  passing_score: number;
  max_attempts: number;
  timer_minutes: number;
  totalQuestions?: number;
};
type AttemptInfo = { usedAttempts: number; attemptNumber: number; remainingAttempts: number; maxAttempts: number };
type QuizResponse = { assessment: AssessmentConfig; questions: Question[]; attemptInfo: AttemptInfo };
type Result = { score: number; passed: boolean; incorrectCount: number; total: number; certificateId?: string | null; maxAttempts: number; remainingAttempts: number; attemptNumber: number };

type QuizCourse = LiveCourse & { has_certificate?: boolean };

const CertificationQuiz = () => {
  const [searchParams] = useSearchParams();
  const [courseId, setCourseId] = useState(searchParams.get("course") ?? "");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<Result | null>(null);
  const [tabWarnings, setTabWarnings] = useState(0);
  const courses = useQuery({ queryKey: ["courses"], queryFn: () => api<QuizCourse[]>("/api/courses") });
  const enrolledCourses = courses.data?.filter((course) => Boolean(course.enrollment_status)) ?? [];
  const selectedCourse = enrolledCourses.find((course) => course.id === courseId);
  const quiz = useQuery({
    queryKey: ["quiz", courseId],
    queryFn: () => api<QuizResponse>(`/api/courses/${courseId}/quiz`),
    enabled: Boolean(courseId) && !selectedCourse?.has_certificate,
  });
  const assessment = quiz.data?.assessment;
  const questions = quiz.data?.questions ?? [];
  const attemptInfo = quiz.data?.attemptInfo;
  const quizDurationSeconds = assessment ? assessment.timer_minutes * 60 : 0;
  const [secondsLeft, setSecondsLeft] = useState<number>(quizDurationSeconds);

  useEffect(() => {
    if (!assessment) return;
    setSecondsLeft(assessment.timer_minutes * 60);
  }, [assessment]);

  useEffect(() => {
    if (!assessment || !questions.length) return;
    const interval = setInterval(() => {
      setSecondsLeft((current) => Math.max(0, current - 1));
    }, 1000);
    if (secondsLeft <= 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [assessment, questions.length, secondsLeft]);

  const [navigationBlocked, setNavigationBlocked] = useState(false);
  const [navigationWarnings, setNavigationWarnings] = useState(0);

  useEffect(() => {
    if (!assessment || !courseId) return;

    const onCopy = (event: ClipboardEvent) => {
      event.preventDefault();
      event.clipboardData?.setData("text/plain", "Copying is disabled during the assessment.");
    };
    const onContextMenu = (event: MouseEvent) => event.preventDefault();
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && ["p", "P", "c", "C", "x", "X"].includes(event.key)) {
        event.preventDefault();
      }
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        setTabWarnings((count) => count + 1);
      }
    };
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "You have an active assessment. Leaving before submission may invalidate your attempt.";
      return event.returnValue;
    };
    const blockBackNavigation = () => {
      if (!navigationBlocked) {
        window.history.pushState(null, "", window.location.href);
        setNavigationBlocked(true);
      }
    };
    const onPopState = () => {
      window.history.pushState(null, "", window.location.href);
      setNavigationWarnings((count) => count + 1);
      setTabWarnings((count) => count + 1);
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    window.addEventListener("popstate", onPopState);
    document.addEventListener("copy", onCopy);
    document.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("visibilitychange", onVisibilityChange);
    blockBackNavigation();

    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.removeEventListener("popstate", onPopState);
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("contextmenu", onContextMenu);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [assessment, courseId, navigationBlocked]);

  const formattedTime = useMemo(() => {
    const minutes = Math.floor(secondsLeft / 60).toString().padStart(2, "0");
    const seconds = (secondsLeft % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  }, [secondsLeft]);

  const totalSeconds = assessment ? assessment.timer_minutes * 60 : 0;
  const elapsedPercent = totalSeconds ? Math.round(((totalSeconds - secondsLeft) / totalSeconds) * 100) : 0;

  const submit = useMutation({
    mutationFn: () => api<Result>(`/api/courses/${courseId}/quiz/submit`, { method: "POST", body: JSON.stringify({ answers }) }),
    onSuccess: setResult,
  });

  const quizActive = Boolean(quiz.data && !result && !quiz.error && questions.length);

  return (
    <DashboardLayout>
      <div className="max-w-3xl space-y-6">
        <div className="rounded-xl bg-gradient-to-r from-primary/8 to-accent/6 p-6 shadow-sm">
          <h1 className="font-heading text-2xl font-bold">Certification Quiz</h1>
          <p className="mt-2 text-sm text-muted-foreground">Quickly complete the assessment to earn your certificate. Stay focused — copying, printing and switching tabs are monitored.</p>
        </div>
        {quizActive && (
          <div className="sticky top-24 z-20 rounded-b-xl border border-primary/20 bg-primary/10 p-4 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-primary">Quiz in progress — do not leave before submission.</p>
                <p className="text-xs text-muted-foreground">Back navigation is blocked and tab switching is monitored during the active assessment.</p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-primary-foreground">
                <span className="rounded-full bg-primary text-primary-foreground px-2 py-1">{formattedTime} remaining</span>
                <span className="rounded-full bg-secondary text-secondary-foreground px-2 py-1">{Object.keys(answers).length}/{questions.length} answered</span>
              </div>
            </div>
          </div>
        )}
        <select value={courseId} onChange={(event) => { setCourseId(event.target.value); setAnswers({}); setResult(null); }} className="w-full rounded-lg border border-border bg-card p-3 text-sm focus:ring-2 focus:ring-primary/30">
          <option value="">Select an enrolled course</option>{enrolledCourses.map((course) => <option key={course.id} value={course.id}>{course.title}{course.has_certificate ? " (Certificate issued)" : ""}</option>)}
        </select>
        {courseId && quiz.isLoading && <div className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">Loading your assessment questions…</div>}
        {courseId && !quiz.isLoading && !quiz.error && !quiz.data && <div className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">No assessment questions are available for this course. Please check back once the course materials are complete.</div>}
        {!courses.isLoading && enrolledCourses.length === 0 && <p className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">Enroll in a course before accessing its assessment.</p>}
{selectedCourse?.has_certificate && <div className="rounded-xl border border-success/30 bg-success/10 p-5 text-sm text-success">
          <div className="flex items-center gap-2"><ShieldCheck className="h-5 w-5" /><p className="font-semibold">Certificate already issued</p></div>
          <p className="mt-1">You have already earned the course certificate, so the certification quiz is no longer available.</p>
          <Button asChild variant="outline" className="mt-4"><Link to="/certifications">View certificate</Link></Button>
        </div>}
        {quiz.error && !selectedCourse?.has_certificate && <div className="flex gap-3 rounded-xl border border-warning/30 bg-warning/10 p-5 text-sm"><AlertTriangle className="h-5 w-5 shrink-0" /><div><p className="font-semibold">Assessment unavailable</p><p className="mt-1">{quiz.error.message}</p></div></div>}
        {quiz.data && !result && (
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-primary mb-4">
              <p className="font-semibold">Stay focused — monitoring is active during this quiz.</p>
              <p className="mt-2 text-sm text-muted-foreground">Copying, printing, switching tabs, or navigating away before submission may be logged and could invalidate your attempt.</p>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{assessment?.title}</p>
                <p className="mt-2 text-sm text-muted-foreground whitespace-pre-line">{assessment?.instructions}</p>
              </div>
              <div className="rounded-lg border border-border bg-secondary/10 p-3 text-sm text-muted-foreground w-40">
                <p>Time remaining</p>
                <p className="mt-1 text-lg font-bold">{formattedTime}</p>
                <div className="mt-2 h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${Math.min(100, Math.max(0, elapsedPercent))}%` }} />
                </div>
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-border p-3 text-sm"><p className="text-muted-foreground">Pass mark</p><p className="mt-1 font-semibold">{assessment?.passing_score}%</p></div>
              <div className="rounded-lg border border-border p-3 text-sm"><p className="text-muted-foreground">Remaining attempts</p><p className="mt-1 font-semibold">{attemptInfo?.remainingAttempts ?? 0}</p></div>
              <div className="rounded-lg border border-border p-3 text-sm"><p className="text-muted-foreground">Answered</p><p className="mt-1 font-semibold">{Object.keys(answers).length}/{questions.length}</p></div>
            </div>
            {tabWarnings > 0 && <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"><p className="font-semibold">Attention</p><p className="mt-1">You switched tabs or attempted to leave the page while the assessment was active. This is logged as a potential security event.</p></div>}
          </div>
        )}
        <div className="space-y-4">
          {questions.map((question, index) => (
            <article key={question.id} className="rounded-xl border border-border bg-card p-5" onCopy={(event) => event.preventDefault()} onContextMenu={(event) => event.preventDefault()}>
              <h2 className="font-semibold">{index + 1}. {question.question_text}</h2>
              <div className="mt-3 space-y-2">
                {question.options.map((option) => (
                  <label key={option} className="flex items-center gap-2 rounded-lg border border-border p-3 text-sm">
                    <input type="radio" name={question.id} checked={answers[question.id] === option} onChange={() => setAnswers((current) => ({ ...current, [question.id]: option }))} />
                    {option}
                  </label>
                ))}
              </div>
            </article>
          ))}
        </div>
        {questions.length ? (
          <div className="flex items-center gap-3">
            <Button size="lg" onClick={() => submit.mutate()} disabled={submit.isPending || Object.keys(answers).length !== questions.length || secondsLeft <= 0}>
              Submit answers
            </Button>
            <Button variant="outline" onClick={() => { setAnswers({}); }} disabled={submit.isPending}>Reset</Button>
          </div>
        ) : courseId && !quiz.isLoading && !quiz.error ? <p className="text-sm text-muted-foreground">No quiz questions are configured for this course.</p> : null}
        {submit.error && <p className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive">{submit.error.message}</p>}
        {result && <div className={`rounded-xl p-5 ${result.passed ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}><p className="text-2xl font-bold">{result.score.toFixed(1)}%</p><p>{result.passed ? "Passed" : "Not passed"} - {result.incorrectCount} incorrect of {result.total}</p>{result.passed && <Button asChild className="mt-4" variant="outline"><Link to="/certifications">View certificate</Link></Button>}</div>}
      </div>
    </DashboardLayout>
  );
};

export default CertificationQuiz;
