import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "@/components/DashboardLayout";
import AdminDataTable from "@/components/AdminDataTable";
import { resourceApi } from "@/lib/api";
import { Button } from "@/components/ui/button";

type IncorrectAnswer = { id: string; user_id: string; user_name?: string; user_email?: string; course_id: string; question_text: string; selected_option?: string; correct_option?: string; module_index?: number; reviewed: number; created_at: string };
type Attempt = { id: string; user_id: string; user_name?: string; user_email?: string; course_id: string; attempt_number: number; score: number; passed: number; answered_count: number; total_questions: number; created_at: string };

const AdminTracker = () => {
  const queryClient = useQueryClient();
  const incorrect = useQuery({ queryKey: ["resource", "incorrect-answers"], queryFn: () => resourceApi.list<IncorrectAnswer>("incorrect-answers", { limit: 100 }) });
  const attempts = useQuery({ queryKey: ["resource", "quiz-attempts"], queryFn: () => resourceApi.list<Attempt>("quiz-attempts", { limit: 100 }) });
  const review = useMutation({ mutationFn: (id: string) => resourceApi.update("incorrect-answers", id, { reviewed: true }), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["resource", "incorrect-answers"] }) });
  const rows = incorrect.data?.rows.map((row) => ({ ...row, user: row.user_name ? `${row.user_name}${row.user_email ? ` (${row.user_email})` : ""}` : row.user_id, action: row.reviewed ? "Reviewed" : "Pending" })) ?? [];
  const attemptRows = attempts.data?.rows.map((row) => ({ ...row, user: row.user_name ? `${row.user_name}${row.user_email ? ` (${row.user_email})` : ""}` : row.user_id })) ?? [];
  return <DashboardLayout><div className="max-w-7xl space-y-6"><h1 className="font-heading text-2xl font-bold">Learning Tracker</h1><AdminDataTable title="Incorrect Answers" description="Live incorrect-answer records from MySQL." exportName="incorrect-answers" rows={rows} columns={[
    { key: "user", label: "User" }, { key: "course_id", label: "Course" }, { key: "question_text", label: "Question" }, { key: "selected_option", label: "Selected" }, { key: "correct_option", label: "Correct" }, { key: "action", label: "Status" },
  ]} />{rows.filter((row) => !row.reviewed).map((row) => <Button key={row.id} size="sm" variant="outline" onClick={() => review.mutate(row.id)}>Mark {row.id.slice(0, 8)} reviewed</Button>)}<AdminDataTable title="Quiz Attempts" description="All student quiz submissions." exportName="quiz-attempts" rows={attemptRows} columns={[
    { key: "user", label: "User" }, { key: "course_id", label: "Course" }, { key: "attempt_number", label: "Attempt" }, { key: "score", label: "Score" }, { key: "passed", label: "Passed" }, { key: "answered_count", label: "Answered" }, { key: "total_questions", label: "Questions" }, { key: "created_at", label: "Created" },
  ]} /></div></DashboardLayout>;
};

export default AdminTracker;
