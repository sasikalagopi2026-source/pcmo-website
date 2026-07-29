import { useState } from "react";
import { ArrowRight, BookOpen, BriefcaseBusiness, CalendarDays, Download, FileText, Headphones, Library, LockKeyhole, Newspaper, ShieldCheck, Sparkles, Video } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import PublicFooter from "@/components/PublicFooter";
import PublicNavigation from "@/components/PublicNavigation";
import { getToken } from "@/lib/api";

const topics = [
  [Library, "Knowledge Centre", "Practical guidance, reference material, ebooks, templates, and professional resources.", "/library"],
  [ShieldCheck, "Standards", "Explore governance, controls, ethics, quality, and recognised professional practice.", "/pages/standards"],
  [Newspaper, "Thought Leadership", "Perspectives on delivery, contracts, commercial strategy, leadership, and emerging practice.", "/pages/thought_leadership"],
  [BriefcaseBusiness, "Career Resources", "Career planning, capability development, professional profiles, interviews, and opportunities.", "/pages/career_resources"],
  [BookOpen, "Learning", "Structured learning pathways for project and contract management professionals.", "/pages/learning"],
  [Headphones, "Podcasts", "Conversations with practitioners, specialists, and leaders from the PCMO community.", "/pages/podcasts"],
  [Video, "Webinars", "Expert-led online sessions, recordings, and practical professional discussions.", "/pages/webinars"],
  [CalendarDays, "Events", "Upcoming learning, networking, certification, and professional community events.", "/pages/events"],
] as const;

const books = [
  ["project-management-field-guide", "PCMO Project Management Field Guide", "100 focused practice notes covering initiation, planning, controls, leadership, delivery, and closeout.", "Project management"],
  ["contract-management-practice-handbook", "PCMO Contract Management Practice Handbook", "A practical reference for strategy, formation, administration, change, claims, compliance, and closeout.", "Contract management"],
  ["integrated-project-contract-playbook", "PCMO Integrated Project and Contract Playbook", "Integrated guidance for governance, commercial alignment, controls, assurance, recovery, and value.", "Integrated delivery"],
] as const;

const ResourcesHub = () => {
  const navigate = useNavigate();
  const [downloading, setDownloading] = useState("");
  const [message, setMessage] = useState("");
  const download = async (slug: string, title: string) => {
    const token = getToken();
    if (!token) { navigate("/login", { state: { from: "/pages/resources" } }); return; }
    setDownloading(slug); setMessage("");
    try {
      const response = await fetch(`/api/member-publications/${slug}/download`, { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) { const body = await response.json(); throw new Error(body.error || "Download unavailable"); }
      const blob = await response.blob(); const url = URL.createObjectURL(blob); const anchor = document.createElement("a");
      anchor.href = url; anchor.download = `${slug}.pdf`; anchor.click(); URL.revokeObjectURL(url);
      setMessage(`${title} is ready.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Download unavailable"); }
    finally { setDownloading(""); }
  };
  return <div className="min-h-screen bg-white text-slate-800"><PublicNavigation active="resources"/><main>
    <section className="relative overflow-hidden bg-[#071f3b] px-6 py-24 text-white"><div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_20%,rgba(220,38,38,.28),transparent_35%)]"/><div className="relative mx-auto max-w-7xl"><p className="text-sm font-bold uppercase tracking-[.22em] text-red-300">PCMO knowledge ecosystem</p><h1 className="mt-4 max-w-4xl font-heading text-6xl font-extrabold">Resources for stronger professional decisions</h1><p className="mt-6 max-w-3xl text-lg leading-8 text-white/70">Explore advanced knowledge, practical tools, professional learning, publications, events, and insights across project and contract management.</p><a href="#topics" className="mt-8 inline-flex items-center gap-2 rounded bg-red-600 px-6 py-3 font-bold">Explore all resources<ArrowRight className="h-4 w-4"/></a></div></section>
    <section id="topics" className="mx-auto max-w-7xl px-6 py-20"><div className="text-center"><Sparkles className="mx-auto h-10 w-10 text-red-600"/><h2 className="mt-4 font-heading text-4xl font-extrabold text-[#0b3764]">Explore by topic</h2><p className="mx-auto mt-4 max-w-2xl text-slate-600">Every topic leads to a dedicated page or interactive area of the PCMO website.</p></div><div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">{topics.map(([Icon,title,text,href]) => <Link key={title} to={href} className="group rounded-2xl border border-slate-200 p-7 shadow-sm transition duration-300 hover:-translate-y-2 hover:border-red-300 hover:shadow-xl"><div className="grid h-12 w-12 place-items-center rounded-xl bg-[#0b3764] text-white transition group-hover:bg-red-600"><Icon className="h-6 w-6"/></div><h3 className="mt-5 text-xl font-extrabold text-[#0b3764]">{title}</h3><p className="mt-3 min-h-24 text-sm leading-7 text-slate-600">{text}</p><span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-red-600">Open topic<ArrowRight className="h-4 w-4 transition group-hover:translate-x-1"/></span></Link>)}</div></section>
    <section className="bg-slate-50 px-6 py-20"><div className="mx-auto max-w-7xl"><div className="flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="text-sm font-bold uppercase tracking-widest text-red-600">PCMO Publications</p><h2 className="mt-3 font-heading text-4xl font-extrabold text-[#0b3764]">Members-only professional books</h2><p className="mt-4 max-w-3xl leading-7 text-slate-600">Three original 100-page publications, branded by PCMO and available to active subscribed members.</p></div><span className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-2 text-sm font-bold text-amber-800"><LockKeyhole className="h-4 w-4"/>Membership access</span></div>{message && <div className="mt-6 rounded-xl border bg-white p-4 text-sm font-semibold text-[#0b3764]">{message}</div>}<div className="mt-10 grid gap-7 lg:grid-cols-3">{books.map(([slug,title,text,category], index) => <article key={slug} className="overflow-hidden rounded-2xl border bg-white shadow-lg"><div className="relative grid h-64 place-items-center bg-[#0b3764] p-7 text-center text-white"><div className="absolute inset-x-0 top-0 h-2 bg-red-600"/><img src="/pcmo-logo.png" alt="PCMO" className="w-48 rounded bg-white p-3"/><div className="absolute bottom-5 left-5 right-5"><p className="text-xs font-bold uppercase tracking-widest text-red-300">{category}</p><p className="mt-2 font-heading text-xl font-extrabold">{title}</p></div><span className="absolute right-4 top-5 text-6xl font-black text-white/5">0{index+1}</span></div><div className="p-6"><div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500"><span>PDF publication</span><span>100 pages</span></div><p className="mt-4 min-h-24 leading-7 text-slate-600">{text}</p><button onClick={() => download(slug,title)} disabled={downloading === slug} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 font-bold text-white disabled:opacity-60"><Download className="h-5 w-5"/>{downloading === slug ? "Preparing..." : "Member download"}</button></div></article>)}</div></div></section>
    <section className="bg-[#0b3764] px-6 py-16 text-center text-white"><FileText className="mx-auto h-10 w-10 text-red-400"/><h2 className="mt-4 font-heading text-3xl font-extrabold">Build your professional library</h2><p className="mx-auto mt-4 max-w-2xl text-white/65">Join PCMO membership to access publications, learning, community opportunities, and professional development resources.</p><Link to="/pages/membership_packages" className="mt-7 inline-flex rounded bg-red-600 px-6 py-3 font-bold">Explore membership</Link></section>
  </main><PublicFooter/></div>;
};
export default ResourcesHub;
