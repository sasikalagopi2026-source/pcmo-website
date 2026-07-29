import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, BriefcaseBusiness, Building2, CheckCircle2, Clock, MapPin } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { api } from "@/lib/api";
import PublicNavigation from "@/components/PublicNavigation";
import PublicFooter from "@/components/PublicFooter";

type Job = { id: string; slug: string; title: string; company?: string; location?: string; employment_type?: string; description?: string; salary?: string; skills?: string[]; requirements?: string[]; responsibilities?: string[]; apply_url?: string };

const JobDetail = () => {
  const { slug = "" } = useParams();
  const job = useQuery({ queryKey: ["public-job", slug], queryFn: () => api<Job>(`/api/public/jobs/${slug}`) });
  if (job.isLoading) return <div className="grid min-h-screen place-items-center"><p>Loading opportunity…</p></div>;
  if (!job.data) return <div className="grid min-h-screen place-items-center text-center"><div><h1 className="text-3xl font-bold text-[#0b3764]">Opportunity not found</h1><Link to="/pages/job_community" className="mt-5 inline-block text-red-600">Return to Job Community</Link></div></div>;
  const item = job.data;
  return <div className="min-h-screen bg-slate-50">
    <PublicNavigation active="connect" />
    <main><section className="bg-[#071f3b] px-6 py-16 text-white"><div className="mx-auto max-w-6xl"><Link to="/pages/job_community" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white"><ArrowLeft className="h-4 w-4"/>Job Community</Link><div className="mt-8 flex flex-col justify-between gap-8 md:flex-row md:items-end"><div><span className="rounded-full bg-red-600/20 px-3 py-1 text-xs font-bold text-red-300">PCMO Opportunity</span><h1 className="mt-5 font-heading text-4xl font-extrabold md:text-5xl">{item.title}</h1><p className="mt-4 flex items-center gap-2 text-lg text-white/75"><Building2 className="h-5 w-5"/>{item.company}</p><div className="mt-5 flex flex-wrap gap-5 text-sm text-white/60"><span className="flex items-center gap-2"><MapPin className="h-4 w-4"/>{item.location}</span><span className="flex items-center gap-2"><Clock className="h-4 w-4"/>{item.employment_type}</span><span className="flex items-center gap-2"><BriefcaseBusiness className="h-4 w-4"/>{item.salary || "Competitive"}</span></div></div><a href={item.apply_url || "https://talentspecialist.org/all-job-search.html"} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded bg-red-600 px-7 py-4 font-bold shadow-lg hover:bg-red-700">Apply for this role <ArrowRight className="h-5 w-5"/></a></div></div></section>
      <section className="px-6 py-16"><div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_320px]"><article className="space-y-10 rounded-2xl border bg-white p-8 shadow-sm"><div><h2 className="text-2xl font-extrabold text-[#0b3764]">About the opportunity</h2><p className="mt-4 leading-8 text-slate-600">{item.description}</p></div><List title="Key responsibilities" items={item.responsibilities}/><List title="What you’ll bring" items={item.requirements}/></article><aside className="h-fit rounded-2xl border bg-white p-7 shadow-sm"><h2 className="text-lg font-extrabold text-[#0b3764]">Skills for this role</h2><div className="mt-5 flex flex-wrap gap-2">{item.skills?.map(skill => <span key={skill} className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-600">{skill}</span>)}</div><a href={item.apply_url || "https://talentspecialist.org/all-job-search.html"} target="_blank" rel="noreferrer" className="mt-7 flex items-center justify-center gap-2 rounded bg-[#0b3764] px-5 py-3 font-bold text-white hover:bg-red-600">Apply now <ArrowRight className="h-4 w-4"/></a><p className="mt-4 text-center text-xs leading-5 text-slate-400">Applications are completed securely on the employer’s recruitment site.</p></aside></div></section>
    </main><PublicFooter/>
  </div>;
};

const List = ({ title, items = [] }: { title: string; items?: string[] }) => <div><h2 className="text-2xl font-extrabold text-[#0b3764]">{title}</h2><div className="mt-5 space-y-3">{items.map(item => <p key={item} className="flex gap-3 leading-7 text-slate-600"><CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-emerald-600"/>{item}</p>)}</div></div>;
export default JobDetail;
