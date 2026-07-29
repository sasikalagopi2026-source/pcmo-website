import DashboardLayout from "@/components/DashboardLayout";
import ProfileCard from "@/components/ProfileCard";
import StatsCards from "@/components/StatsCards";
import MembershipOverview from "@/components/MembershipOverview";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowRight, Award, BookOpen, CalendarDays, Clock, Layers3, MessageCircle, ShieldCheck, TrendingUp, UserRound, Video } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { ProfileData } from "@/components/ProfileCard";
import MyCoursesSection, { type LiveCourse } from "@/components/MyCoursesSection";
import { Button } from "@/components/ui/button";
import { groupForPage, type PublicPageSummary } from "@/lib/publicNavigation";

type DashboardCertificate = {
  id: string;
  title: string;
  recipient_name?: string | null;
  designation?: string | null;
  issuer: string;
  credential_id?: string | null;
  issue_date?: string | null;
  status: string;
};

type StudentDashboardData = {
  profile: ProfileData;
  stats: Record<string, number>;
  membership: {
    plan_name: string;
    status: string;
    starts_at: string;
    ends_at?: string | null;
  } | null;
  courses: LiveCourse[];
  certificates: DashboardCertificate[];
};

type ExpertRoomReservation = { reservation_id: string; room_id: string; title: string; topic?: string; expert_name: string; expert_role?: string; format: string; scheduled_at: string; duration_minutes: number; meeting_url?: string | null };

const formatDate = (value?: string | null) => value ? new Date(value).toLocaleDateString() : "Pending";

const DashboardCertificates = ({ certificates }: { certificates: DashboardCertificate[] }) => (
  <section className="rounded-xl border border-border bg-card p-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="font-heading text-lg font-bold text-foreground">Certificates</h2>
        <p className="mt-1 text-sm text-muted-foreground">Completed courses and earned credentials.</p>
      </div>
      <Button asChild variant="outline" size="sm"><Link to="/certifications">View all</Link></Button>
    </div>
    <div className="mt-4 space-y-3">
      {certificates.map((certificate) => (
        <article key={certificate.id} className="flex flex-wrap items-center gap-4 rounded-lg border border-border p-4">
          <div className="grid h-11 w-11 place-items-center rounded-lg bg-warning/10"><Award className="h-5 w-5 text-warning" /></div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-foreground">{certificate.title}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{certificate.credential_id || "Credential pending"}</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground"><CalendarDays className="h-4 w-4" />{formatDate(certificate.issue_date)}</div>
          <div className="flex items-center gap-2 rounded-full border border-success/20 px-3 py-1 text-xs font-semibold text-success"><ShieldCheck className="h-3.5 w-3.5" />Completed</div>
        </article>
      ))}
      {!certificates.length && <p className="rounded-lg border border-border p-4 text-sm text-muted-foreground">Completed course certificates will appear here.</p>}
    </div>
  </section>
);

const MyExpertRooms = () => {
  const queryClient = useQueryClient();
  const rooms = useQuery({ queryKey: ["my-expert-rooms"], queryFn: () => api<{ rows: ExpertRoomReservation[] }>("/api/expert-rooms/mine") });
  const cancel = useMutation({ mutationFn: (roomId: string) => api(`/api/expert-rooms/${roomId}/reserve`, { method: "DELETE" }), onSuccess: () => { toast.success("Expert room reservation cancelled"); void queryClient.invalidateQueries({ queryKey: ["my-expert-rooms"] }); void queryClient.invalidateQueries({ queryKey: ["public-expert-rooms"] }); }, onError: (error: Error) => toast.error(error.message) });
  return <section className="overflow-hidden rounded-xl border border-border bg-card">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-5"><div><div className="flex items-center gap-2"><Video className="h-5 w-5 text-primary"/><h2 className="font-heading text-lg font-bold text-foreground">My Expert Rooms</h2></div><p className="mt-1 text-sm text-muted-foreground">Your confirmed community sessions and joining details.</p></div><Button asChild variant="outline" size="sm"><Link to="/pages/membership_community">Explore rooms</Link></Button></div>
    <div className="space-y-3 p-5">{rooms.isLoading ? <div className="h-28 animate-pulse rounded-lg bg-muted"/> : rooms.error ? <p className="text-sm text-destructive">Unable to load your expert rooms.</p> : rooms.data?.rows.length ? rooms.data.rows.map(room => { const date = new Date(room.scheduled_at); return <article key={room.reservation_id} className="grid gap-4 rounded-xl border border-border p-4 transition hover:border-primary/30 hover:shadow-sm md:grid-cols-[auto_1fr_auto] md:items-center"><div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10"><Video className="h-6 w-6 text-primary"/></div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold text-foreground">{room.title}</h3><span className="rounded-full bg-success/10 px-2.5 py-1 text-[11px] font-bold text-success">Reserved</span></div><p className="mt-1 text-sm text-muted-foreground">{room.topic}</p><div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground"><span className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5"/>{date.toLocaleDateString([], { dateStyle: "medium" })}</span><span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5"/>{date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · {room.duration_minutes} min</span><span className="flex items-center gap-1.5"><UserRound className="h-3.5 w-3.5"/>{room.expert_name}</span></div></div><div className="flex flex-wrap gap-2 md:justify-end">{room.meeting_url ? <Button asChild size="sm"><a href={room.meeting_url} target="_blank" rel="noreferrer">Join session <ArrowRight className="ml-1 h-4 w-4"/></a></Button> : <span className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">Joining link coming soon</span>}<Button variant="ghost" size="sm" disabled={cancel.isPending} onClick={() => cancel.mutate(room.room_id)} className="text-destructive hover:text-destructive">Cancel</Button></div></article>}) : <div className="rounded-lg border border-dashed border-border p-6 text-center"><Video className="mx-auto h-8 w-8 text-muted-foreground/50"/><p className="mt-3 text-sm font-semibold">No upcoming expert rooms reserved</p><p className="mt-1 text-xs text-muted-foreground">Reserve a seat to see the session here.</p><Button asChild variant="link" size="sm" className="mt-2"><Link to="/pages/membership_community">Browse expert rooms</Link></Button></div>}</div>
  </section>;
};

const CommunityConversations = () => {
  type Conversation = { id: string; title: string; contributor_count: number; reply_count: number };
  const query = useQuery({ queryKey: ["public-conversations"], queryFn: () => api<{ featured: Conversation | null; trending: Conversation[] }>("/api/public/conversations") });
  const items = [query.data?.featured, ...(query.data?.trending ?? [])].filter(Boolean).slice(0, 4) as Conversation[];
  return <section className="rounded-xl border border-border bg-card p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><div className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-accent"/><h2 className="font-heading text-lg font-bold">Community Conversations</h2></div><p className="mt-1 text-sm text-muted-foreground">Featured prompts and discussions gaining momentum.</p></div><Button asChild variant="outline" size="sm"><Link to="/pages/join_the_conversation">View all</Link></Button></div><div className="mt-4 grid gap-3 md:grid-cols-2">{query.isLoading ? [1,2,3,4].map(item => <div key={item} className="h-24 animate-pulse rounded-lg bg-muted"/>) : items.map(item => <Link key={item.id} to={`/community/post/${item.id}`} className="group flex gap-3 rounded-lg border p-4 transition hover:border-primary/30 hover:shadow-sm"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10"><MessageCircle className="h-5 w-5 text-primary"/></div><div><h3 className="line-clamp-2 text-sm font-bold leading-5 group-hover:text-primary">{item.title}</h3><p className="mt-2 text-xs text-muted-foreground">{Number(item.contributor_count)} contributors · {Number(item.reply_count)} replies</p></div></Link>)}</div></section>;
};

const PageKnowledgeHub = () => {
  const query = useQuery({ queryKey: ["public-navigation-pages"], queryFn: async () => { const response = await fetch("/api/public/pages"); if (!response.ok) throw new Error("Knowledge hub unavailable"); return response.json() as Promise<PublicPageSummary[]>; }, staleTime: 60_000 });
  const groups = ["Membership", "Certifications", "Resources", "Connect"].map((label) => ({ label, pages: (query.data ?? []).filter((page) => groupForPage(page.slug) === label) }));
  const total = Math.max(1, groups.reduce((sum, group) => sum + group.pages.length, 0));
  return <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
    <div className="relative overflow-hidden bg-gradient-to-r from-[#071f3b] via-[#0b3764] to-[#123f70] p-6 text-white"><div className="absolute -right-16 -top-20 h-48 w-48 animate-pulse rounded-full border-[32px] border-red-500/15"/><div className="relative flex flex-wrap items-center justify-between gap-4"><div><div className="flex items-center gap-2"><Layers3 className="h-5 w-5 text-red-400"/><p className="text-xs font-bold uppercase tracking-[.18em] text-red-300">PCMO knowledge hub</p></div><h2 className="mt-2 font-heading text-2xl font-extrabold">Explore every professional pathway</h2><p className="mt-2 max-w-2xl text-sm text-white/65">Published content is managed by PCMO administrators and updates here automatically.</p></div><div className="grid h-20 w-20 place-items-center rounded-full border-8 border-white/10 bg-white/5 text-center"><span><strong className="block text-2xl">{query.data?.length ?? 0}</strong><small className="text-[10px] uppercase text-white/60">Pages</small></span></div></div></div>
    <div className="grid gap-5 p-5 md:grid-cols-2">{query.isLoading ? [1,2,3,4].map((item) => <div key={item} className="h-44 animate-pulse rounded-xl bg-muted"/>) : groups.map((group, groupIndex) => <article key={group.label} className="group rounded-xl border border-border p-5 transition duration-500 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg"><div className="flex items-center justify-between"><div className="flex items-center gap-3"><div className={`grid h-11 w-11 place-items-center rounded-xl ${groupIndex % 2 ? "bg-red-500/10 text-red-600" : "bg-primary/10 text-primary"}`}><BookOpen className="h-5 w-5"/></div><div><h3 className="font-bold">{group.label}</h3><p className="text-xs text-muted-foreground">{group.pages.length} detailed pages</p></div></div><span className="text-xs font-black text-muted-foreground">{Math.round((group.pages.length / total) * 100)}%</span></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full animate-in slide-in-from-left bg-gradient-to-r from-primary to-red-500 duration-1000" style={{ width: `${Math.max(12, (group.pages.length / total) * 100)}%` }}/></div><div className="mt-4 grid gap-2 sm:grid-cols-2">{group.pages.map((page) => <Link key={page.slug} to={`/pages/${page.slug}`} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-xs font-semibold transition hover:bg-primary hover:text-primary-foreground"><span className="line-clamp-1">{page.menu_label || page.title}</span><ArrowRight className="h-3.5 w-3.5 shrink-0"/></Link>)}</div></article>)}</div>
  </section>;
};

const Index = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["student-dashboard"],
    queryFn: () => api<StudentDashboardData>("/api/student/dashboard"),
  });

  if (isLoading) return <DashboardLayout><p className="text-sm text-muted-foreground">Loading dashboard…</p></DashboardLayout>;
  if (error || !data?.profile) return <DashboardLayout><p className="text-sm text-destructive">{error instanceof Error ? error.message : "Unable to load dashboard"}</p></DashboardLayout>;

  return (
    <DashboardLayout>
      <h1 className="font-heading font-bold text-2xl text-foreground mb-6">Dashboard</h1>
      <div className="space-y-6 max-w-5xl">
        <ProfileCard profile={data.profile} />
        <StatsCards values={data.stats} />
        <MembershipOverview membership={data.membership} memberName={data.profile.display_name || data.profile.email} memberNumber={data.profile.member_number} />
        <PageKnowledgeHub />
        <MyExpertRooms />
        <CommunityConversations />
        <MyCoursesSection courses={data.courses ?? []} />
        <DashboardCertificates certificates={data.certificates ?? []} />
      </div>
    </DashboardLayout>
  );
};

export default Index;
