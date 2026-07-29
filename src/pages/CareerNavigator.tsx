import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Briefcase, Target, TrendingUp, Trash2 } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { resourceApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

type Goal = { id: string; title: string; progress: number; status: string; target_date?: string };
type Skill = { id: string; name: string; category?: string; proficiency: number };
type Milestone = { id: string; title: string; status: string; target_date?: string };
type Job = { id: string; title: string; company?: string; location?: string; employment_type?: string; description?: string };

const CareerNavigator = () => {
  const queryClient = useQueryClient();
  const goals = useQuery({ queryKey: ["career-goals"], queryFn: () => resourceApi.list<Goal>("career-goals", { limit: 100 }) });
  const skills = useQuery({ queryKey: ["skills"], queryFn: () => resourceApi.list<Skill>("skills", { limit: 100 }) });
  const milestones = useQuery({ queryKey: ["milestones"], queryFn: () => resourceApi.list<Milestone>("milestones", { limit: 100 }) });
  const jobs = useQuery({ queryKey: ["jobs"], queryFn: () => resourceApi.list<Job>("jobs", { limit: 100 }) });
  const refresh = () => queryClient.invalidateQueries();
  const create = useMutation({ mutationFn: ({ resource, data }: { resource: string; data: Record<string, unknown> }) => resourceApi.create(resource, data), onSuccess: refresh });
  const remove = useMutation({ mutationFn: ({ resource, id }: { resource: string; id: string }) => resourceApi.remove(resource, id), onSuccess: refresh });
  const addSkill = () => {
    const name = window.prompt("Skill name");
    if (!name) return;
    const proficiency = Number(window.prompt("Proficiency (0-100)", "50"));
    create.mutate({ resource: "skills", data: { name, proficiency: Number.isFinite(proficiency) ? proficiency : 0, category: "Professional" } });
  };
  const addGoal = () => {
    const title = window.prompt("Career goal");
    if (title) create.mutate({ resource: "career-goals", data: { title, progress: 0, status: "active" } });
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl space-y-6">
        <div className="flex items-center justify-between"><h1 className="font-heading text-2xl font-bold">Career Navigator</h1><Button onClick={addGoal}><Target className="h-4 w-4" /> Add goal</Button></div>
        <section className="grid gap-4 sm:grid-cols-2">
          {goals.data?.rows.map((goal) => <article key={goal.id} className="rounded-xl border border-border bg-card p-5"><div className="flex justify-between"><h2 className="font-semibold">{goal.title}</h2><button onClick={() => remove.mutate({ resource: "career-goals", id: goal.id })}><Trash2 className="h-4 w-4 text-destructive" /></button></div><Progress value={goal.progress} className="mt-4" /><p className="mt-2 text-xs text-muted-foreground">{goal.progress}% · {goal.status}</p></article>)}
          {!goals.isLoading && !goals.data?.rows.length && <p className="text-sm text-muted-foreground">No career goals yet.</p>}
        </section>
        <section className="rounded-xl border border-border bg-card p-6">
          <div className="flex justify-between"><h2 className="flex items-center gap-2 font-heading text-lg font-bold"><TrendingUp className="h-5 w-5" /> Skills</h2><Button size="sm" variant="outline" onClick={addSkill}>Add skill</Button></div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">{skills.data?.rows.map((skill) => <div key={skill.id}><div className="flex justify-between text-sm"><span>{skill.name}</span><span>{skill.proficiency}%</span></div><Progress value={skill.proficiency} className="mt-2" /></div>)}</div>
        </section>
        <section className="rounded-xl border border-border bg-card p-6"><h2 className="font-heading text-lg font-bold">Milestones</h2><div className="mt-4 space-y-3">{milestones.data?.rows.map((item) => <div key={item.id} className="rounded-lg border border-border p-3"><p className="font-medium">{item.title}</p><p className="text-xs text-muted-foreground">{item.status} · {item.target_date || "No target date"}</p></div>)}</div></section>
        <section><h2 className="mb-4 flex items-center gap-2 font-heading text-lg font-bold"><Briefcase className="h-5 w-5" /> Recommended roles</h2><div className="space-y-3">{jobs.data?.rows.map((job) => <article key={job.id} className="rounded-xl border border-border bg-card p-5"><h3 className="font-semibold">{job.title}</h3><p className="mt-1 text-xs text-muted-foreground">{job.company} · {job.location} · {job.employment_type}</p><p className="mt-2 text-sm text-muted-foreground">{job.description}</p></article>)}{!jobs.isLoading && !jobs.data?.rows.length && <p className="text-sm text-muted-foreground">No job recommendations have been published.</p>}</div></section>
      </div>
    </DashboardLayout>
  );
};

export default CareerNavigator;
