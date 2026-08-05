import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Circle,
  Clock,
  FileText,
  LockKeyhole,
  PlayCircle,
  ShieldCheck,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { api, resourceApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

type Course = {
  id: string;
  title: string;
  description?: string;
  level: string;
  duration?: string;
  credits: number;
  category?: string;
  instructor?: string;
  quiz_question_count: number;
  progress: number;
  module_count: number;
  completed_module_count: number;
  enrollment_status?: string | null;
  has_certificate?: boolean;
  price?: number | null;
};

type CourseMaterial = {
  locked?: boolean;
  id: string;
  material_type: "video" | "study_guide" | "reading" | "worksheet" | "case_study";
  title: string;
  description?: string;
  content_url?: string | null;
  body?: string;
  duration?: string | null;
};

type CourseAssessment = {
  id: string;
  title: string;
  assessment_type: string;
  instructions: string;
  passing_score: number;
  max_attempts: number;
};

type AssessmentConfig = {
  id: string | null;
  title: string;
  instructions: string;
  passing_score: number;
  max_attempts: number;
  timer_minutes: number;
  totalQuestions?: number;
};

type AttemptInfo = {
  usedAttempts: number;
  attemptNumber: number;
  remainingAttempts: number;
  maxAttempts: number;
};

type AssessmentAccess = {
  totalMaterials: number;
  completedMaterials: number;
  unlocked: boolean;
  hasCertificate?: boolean;
  assessment: AssessmentConfig;
  attemptInfo: AttemptInfo;
  lockedReason?: string;
};

const materialLabels: Record<CourseMaterial["material_type"], string> = {
  video: "Video",
  study_guide: "Study Guide",
  reading: "Reading",
  worksheet: "Worksheet",
  case_study: "Case Study",
};

const materialOrder: CourseMaterial["material_type"][] = ["video", "study_guide", "reading", "worksheet", "case_study"];

const materialIcon = (type?: CourseMaterial["material_type"]) => {
  if (type === "video") return PlayCircle;
  return FileText;
};

const previewText = (value?: string, limit = 150) => {
  if (!value) return "";
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length > limit ? `${normalized.slice(0, limit)}...` : normalized;
};

const CourseDetail = () => {
  const { id = "" } = useParams();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [selectedMaterialId, setSelectedMaterialId] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  const course = useQuery({
    queryKey: ["course", id],
    queryFn: () => api<Course>(`/api/courses/${id}`),
    enabled: Boolean(id),
  });
  const materials = useQuery({
    queryKey: ["course-materials", id],
    queryFn: () => api<{ rows: CourseMaterial[]; unlocked: boolean }>(`/api/courses/${id}/materials`),
    enabled: Boolean(id) && Boolean(course.data),
  });
  const assessments = useQuery({
    queryKey: ["course-assessments", id],
    queryFn: () => resourceApi.list<CourseAssessment>("course-assessments", { course_id: id, status: "published", limit: 100 }),
    enabled: Boolean(id) && Boolean(course.data),
  });
  const moduleProgress = useQuery({
    queryKey: ["module-progress", id],
    queryFn: () => api<Array<{ material_id: string; completed_at: string }>>(`/api/courses/${id}/module-progress`),
    enabled: Boolean(id) && Boolean(course.data) && Boolean(course.data?.enrollment_status),
  });
  const assessmentAccess = useQuery({
    queryKey: ["assessment-access", id],
    queryFn: () => api<AssessmentAccess>(`/api/courses/${id}/assessment-access`),
    enabled: Boolean(id) && Boolean(course.data) && Boolean(course.data?.enrollment_status),
  });
  const courseAction = useMutation({
    mutationFn: () => {
      if (!id) throw new Error("Course id is missing");
      const price = Number(course.data?.price ?? 0);
      if (price > 0) {
        return api<{ checkoutUrl?: string; status?: string }>(`/api/courses/${id}/checkout`, { method: "POST" });
      }
      return api<{ checkoutUrl?: string; status?: string }>(`/api/courses/${id}/enroll`, { method: "POST" });
    },
    onSuccess: (result) => {
      if (result?.checkoutUrl) {
        window.location.href = result.checkoutUrl;
        return;
      }
      void queryClient.invalidateQueries({ queryKey: ["course", id] });
      void queryClient.invalidateQueries({ queryKey: ["courses"] });
      void queryClient.invalidateQueries({ queryKey: ["student-dashboard"] });
      setStatusMessage("You are now enrolled in this course. Start learning whenever you are ready.");
    },
  });

  const toggleModule = useMutation({
    mutationFn: ({ materialId, completed }: { materialId: string; completed: boolean }) =>
      api(`/api/courses/${id}/modules/${materialId}/progress`, {
        method: "PUT",
        body: JSON.stringify({ completed }),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["module-progress", id] });
      void queryClient.invalidateQueries({ queryKey: ["course", id] });
      void queryClient.invalidateQueries({ queryKey: ["courses"] });
      void queryClient.invalidateQueries({ queryKey: ["student-dashboard"] });
      void queryClient.invalidateQueries({ queryKey: ["assessment-access", id] });
      setJustCompleted(true);
    },
  });

  const [justCompleted, setJustCompleted] = useState(false);
  const [unlockedNow, setUnlockedNow] = useState(false);

  useEffect(() => {
    if (searchParams.get("payment") === "success") {
      const sessionId = searchParams.get("session_id");
      if (!sessionId) {
        setStatusMessage("Payment confirmation is missing. Please refresh or contact support.");
        return;
      }
      setStatusMessage("Confirming your payment and unlocking your course...");
      void api<{ success: boolean }>("/api/stripe/confirm-session", { method: "POST", body: JSON.stringify({ sessionId }) })
        .then(() => {
          setStatusMessage("Payment received. Your course enrollment has been activated.");
          void queryClient.invalidateQueries({ queryKey: ["course", id] });
          void queryClient.invalidateQueries({ queryKey: ["courses"] });
          void queryClient.invalidateQueries({ queryKey: ["student-dashboard"] });
          void queryClient.invalidateQueries({ queryKey: ["course-materials", id] });
        })
        .catch((error: Error) => setStatusMessage(error.message || "We could not confirm your payment yet. Please refresh shortly."));
    }
    if (searchParams.get("payment") === "cancelled") {
      setStatusMessage("Payment was cancelled. You can try again at any time.");
    }
  }, [id, queryClient, searchParams]);

  useEffect(() => {
    if (assessmentAccess.data?.unlocked && justCompleted) {
      setUnlockedNow(true);
      setJustCompleted(false);
      const t = setTimeout(() => setUnlockedNow(false), 10_000);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [assessmentAccess.data?.unlocked, justCompleted]);

  const materialRows = useMemo(() => {
    const rows = materials.data?.rows ?? [];
    return [...rows].sort((a, b) => materialOrder.indexOf(a.material_type) - materialOrder.indexOf(b.material_type));
  }, [materials.data?.rows]);
  const canViewContent = Boolean(course.data?.enrollment_status);
  const completedIds = useMemo(() => new Set(moduleProgress.data?.map((item) => item.material_id) ?? []), [moduleProgress.data]);
  const nextIncomplete = materialRows.find((material) => !completedIds.has(material.id));
  const selectedMaterial = materialRows.find((material) => material.id === selectedMaterialId) ?? nextIncomplete ?? materialRows[0];
  const selectedIndex = selectedMaterial ? materialRows.findIndex((material) => material.id === selectedMaterial.id) : -1;
  const previousMaterial = selectedIndex > 0 ? materialRows[selectedIndex - 1] : null;
  const nextMaterial = selectedIndex >= 0 && selectedIndex < materialRows.length - 1 ? materialRows[selectedIndex + 1] : null;
  const selectedComplete = selectedMaterial ? completedIds.has(selectedMaterial.id) : false;
  const verifiedCount = assessmentAccess.data?.completedMaterials ?? course.data?.completed_module_count ?? 0;
  const totalRequired = assessmentAccess.data?.totalMaterials ?? course.data?.module_count ?? materialRows.length;
  const assessmentConfig = assessmentAccess.data?.assessment;
  const attemptInfo = assessmentAccess.data?.attemptInfo;
  const remainingForAssessment = Math.max(0, totalRequired - verifiedCount);
  const assessmentUnlocked = Boolean(course.data?.enrollment_status && assessmentAccess.data?.unlocked);
  const coursePrice = Number(course.data?.price ?? 0);
  const isEnrolled = Boolean(course.data?.enrollment_status);

  useEffect(() => {
    if (!selectedMaterialId && materialRows.length) {
      setSelectedMaterialId(nextIncomplete?.id ?? materialRows[0].id);
    }
  }, [materialRows, nextIncomplete?.id, selectedMaterialId]);

  useEffect(() => {
    if (!canViewContent && materialRows.length) {
      setSelectedMaterialId("");
    }
  }, [canViewContent, materialRows.length]);

  return (
    <DashboardLayout>
      <div className="max-w-7xl space-y-6">
        {course.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading course...</p>
        ) : course.error ? (
          <p className="rounded-lg border border-border bg-card p-5 text-sm text-destructive">{course.error.message}</p>
        ) : course.data ? (
          <>
            <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    {course.data.category && <Badge variant="secondary">{course.data.category}</Badge>}
                    <Badge variant="outline">{course.data.level}</Badge>
                  </div>
                  <h1 className="mt-3 font-heading text-3xl font-bold">{course.data.title}</h1>
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">{course.data.description}</p>
                  <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span>{course.data.credits} credits</span>
                    {course.data.duration && <span>{course.data.duration}</span>}
                    {course.data.instructor && <span>{course.data.instructor}</span>}
                  </div>
                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    {statusMessage && <p className="w-full rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">{statusMessage}</p>}
                    {courseAction.error && <p className="w-full rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{courseAction.error.message}</p>}
                    {!isEnrolled ? (
                      <Button disabled={courseAction.isPending} onClick={() => courseAction.mutate()}>
                        {coursePrice > 0 ? "Buy now" : "Enroll free"}
                      </Button>
                    ) : (
                      <Button asChild>
                        <Link to={`/courses/${id}`}>Continue learning</Link>
                      </Button>
                    )}
                    <p className="text-sm text-muted-foreground">
                      {coursePrice > 0 ? `Secure checkout via Stripe. Access unlocks after payment confirmation.` : "Free course — enroll to start immediately."}
                    </p>
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-secondary/30 p-4 shadow-sm">
                  <div className="flex items-center justify-between text-sm">
                    <span>Course completion</span>
                    <strong>{Number(course.data.progress ?? 0)}%</strong>
                  </div>
                  <Progress value={Number(course.data.progress ?? 0)} className="mt-3 h-2" />
                  <p className="mt-2 text-xs text-muted-foreground">{verifiedCount} of {totalRequired} learning materials completed</p>
                  <Button className="mt-4 w-full" onClick={() => selectedMaterial && setSelectedMaterialId(selectedMaterial.id)} disabled={!selectedMaterial}>
                    Continue learning
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-[360px_1fr]">
              <aside className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase text-primary">Step 1</p>
                    <h2 className="font-heading text-lg font-bold">Course Outline</h2>
                  </div>
                  <Badge variant="outline">{materialRows.length} modules</Badge>
                </div>
                <div className="mt-4 space-y-2">
                  {materialRows.map((material, index) => {
                    const Icon = materialIcon(material.material_type);
                    const complete = completedIds.has(material.id);
                    const active = selectedMaterial?.id === material.id;
                      return (
                      <button
                        key={material.id}
                        type="button"
                        onClick={() => canViewContent ? setSelectedMaterialId(material.id) : setStatusMessage("Please purchase this course to unlock all learning materials, assessments, and certification.")}
                        className={`w-full rounded-lg border p-3 text-left transition hover:scale-[1.01] hover:shadow-sm ${active ? "border-primary bg-primary/5" : "border-border bg-background"}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full ${complete ? "bg-success/10 text-success" : active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                            {complete ? <CheckCircle2 className="h-4 w-4" /> : !canViewContent ? <LockKeyhole className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs text-muted-foreground">Module {index + 1}</p>
                              {material.duration && <span className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3 w-3" />{material.duration}</span>}
                            </div>
                            <p className="mt-1 font-medium">{material.title}</p>
                            <p className="mt-1 text-xs text-muted-foreground">{materialLabels[material.material_type]}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </aside>

              <div className="space-y-6">
                <section className="rounded-xl border border-border bg-card p-6">
                  {canViewContent && selectedMaterial ? (
                    <>
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="secondary">{materialLabels[selectedMaterial.material_type]}</Badge>
                            {selectedMaterial.duration && <span className="text-sm text-muted-foreground">{selectedMaterial.duration}</span>}
                            {selectedComplete && <Badge className="bg-success text-success-foreground">Completed</Badge>}
                          </div>
                          <h2 className="mt-3 font-heading text-2xl font-bold">{selectedMaterial.title}</h2>
                          {selectedMaterial.description && <p className="mt-2 text-sm text-muted-foreground">{selectedMaterial.description}</p>}
                        </div>
                        <Button
                          variant={selectedComplete ? "secondary" : "default"}
                          disabled={toggleModule.isPending}
                          onClick={() => toggleModule.mutate({ materialId: selectedMaterial.id, completed: !selectedComplete })}
                        >
                          {selectedComplete ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                          {selectedComplete ? "Mark pending" : "Mark complete"}
                        </Button>
                      </div>

                      <div className="mt-6 rounded-lg border border-border bg-secondary/20 p-5">
                        {selectedMaterial.body ? (
                          <p className="whitespace-pre-line text-sm leading-7">{selectedMaterial.body}</p>
                        ) : (
                          <p className="text-sm leading-7 text-muted-foreground">{previewText(selectedMaterial.description) || "No lesson body has been added yet."}</p>
                        )}
                        {selectedMaterial.content_url && (
                          <Button asChild variant="outline" className="mt-5">
                            <a href={selectedMaterial.content_url} target="_blank" rel="noreferrer">Open material</a>
                          </Button>
                        )}
                      </div>

                      <div className="mt-5 flex flex-wrap justify-between gap-3">
                        <Button variant="outline" disabled={!previousMaterial} onClick={() => previousMaterial && setSelectedMaterialId(previousMaterial.id)}>
                          <ArrowLeft className="h-4 w-4" />
                          Previous
                        </Button>
                        <Button variant="outline" disabled={!nextMaterial} onClick={() => nextMaterial && setSelectedMaterialId(nextMaterial.id)}>
                          Next
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">Please purchase this course to unlock all learning materials, assessments, and certification.</p>
                  )}
                </section>

                <section className={`rounded-xl border p-5 ${assessmentUnlocked ? "border-success/30 bg-success/5" : "border-border bg-secondary/50"}`}>
                  <div className="flex items-start gap-3">
                    <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${assessmentUnlocked ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                      {assessmentUnlocked ? <ShieldCheck className="h-5 w-5" /> : <LockKeyhole className="h-5 w-5" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold uppercase text-primary">Step 2</p>
                      <h2 className="font-heading text-xl font-bold">{assessmentUnlocked ? "Assessment Unlocked" : "Assessment Locked"}</h2>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {course.data.has_certificate || assessmentAccess.data?.hasCertificate
                          ? "A certificate has already been issued for this course. The assessment is no longer available."
                          : assessmentUnlocked
                            ? assessmentConfig
                              ? `Learning materials verified. ${assessmentConfig.totalQuestions ?? (course.data.quiz_question_count || 0)} questions configured. ${attemptInfo?.remainingAttempts ?? assessmentConfig?.max_attempts} attempt(s) left.`
                              : `Learning materials verified. ${course.data.quiz_question_count || 0} assessment questions are ready.`
                            : `Complete ${remainingForAssessment} more learning material${remainingForAssessment === 1 ? "" : "s"} to unlock the quiz. ${verifiedCount} of ${totalRequired} verified.`}
                      </p>
                      {assessmentConfig && !course.data.has_certificate && !assessmentAccess.data?.hasCertificate && (
                        <div className="mt-2 rounded-lg border border-border bg-background p-3 text-sm text-muted-foreground">
                          Timer: {assessmentConfig.timer_minutes} minutes · Pass mark: {assessmentConfig.passing_score}% · Max attempts: {assessmentConfig.max_attempts}
                        </div>
                      )}
                      {unlockedNow && (
                        <div className="mt-3 rounded-lg border border-primary bg-primary/5 p-3 text-sm text-primary">
                          <div className="flex items-center justify-between">
                            <div>Congratulations — you completed the required materials. The assessment is now unlocked.</div>
                            <div className="flex items-center gap-2">
                              <Button asChild size="sm"><Link to={`/certification-quiz?course=${id}`}>Open assessment</Link></Button>
                            </div>
                          </div>
                        </div>
                      )}
                      <Progress value={totalRequired ? Math.min(100, (verifiedCount / totalRequired) * 100) : 0} className="mt-4 h-2" />
                      {course.data.has_certificate || assessmentAccess.data?.hasCertificate ? (
                        <Button asChild className="mt-4"><Link to="/certifications">View certificate</Link></Button>
                      ) : assessmentUnlocked ? (
                        <Button asChild className="mt-4"><Link to={`/certification-quiz?course=${id}`}>Open assessment</Link></Button>
                      ) : (
                        <Button className="mt-4" disabled><LockKeyhole className="h-4 w-4" />Complete materials first</Button>
                      )}
                    </div>
                  </div>
                </section>
              </div>
            </section>

            <section className="rounded-xl border border-border bg-card p-6">
              <h2 className="font-heading text-xl font-bold">Other Assessments</h2>
              <div className="mt-4 grid gap-3">
                {assessments.data?.rows.map((assessment) => (
                  <article key={assessment.id} className="rounded-lg border border-border p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="font-heading font-semibold">{assessment.title}</h3>
                      <Badge>{assessment.assessment_type.replace("_", " ")}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{assessment.instructions}</p>
                    <p className="mt-3 text-xs text-muted-foreground">Pass mark: {assessment.passing_score}% - Maximum attempts: {assessment.max_attempts}</p>
                  </article>
                ))}
                {!assessments.isLoading && !assessments.data?.rows.length && (
                  <p className="text-sm text-muted-foreground">No additional assessments are available.</p>
                )}
              </div>
            </section>
          </>
        ) : null}
      </div>
    </DashboardLayout>
  );
};

export default CourseDetail;
