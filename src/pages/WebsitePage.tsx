import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BarChart3, ChevronDown, Compass, HelpCircle, Lightbulb, Network, Sparkles, Target } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import PcmoLogo from "@/components/PcmoLogo";
import PublicFooter from "@/components/PublicFooter";
import PublicNavigation from "@/components/PublicNavigation";
import { groupForPage } from "@/lib/publicNavigation";
import { membershipFaqs } from "@/lib/membershipFaqs";

type Page = { title: string; menu_label?: string; summary?: string; body?: string; hero_image?: string; reference_image_url?: string; call_to_action_label?: string; call_to_action_url?: string; seo_title?: string; seo_description?: string };

const WebsitePage = ({ slugOverride }: { slugOverride?: string }) => {
  const params = useParams();
  const slug = slugOverride || params.slug || "";
  const query = useQuery({
    queryKey: ["website-page", slug],
    queryFn: async () => {
      const response = await fetch(`/api/pages/${encodeURIComponent(slug)}`);
      if (!response.ok) throw new Error("Page unavailable");
      return response.json() as Promise<Page>;
    },
  });

  useEffect(() => {
    if (!query.data) return;
    document.title = query.data.seo_title || `${query.data.title} | PCMO`;
    const description = document.querySelector('meta[name="description"]') ?? document.head.appendChild(document.createElement("meta"));
    description.setAttribute("name", "description");
    description.setAttribute("content", query.data.seo_description || query.data.summary || query.data.title);
  }, [query.data]);

  const activeGroup = groupForPage(slug).toLowerCase();
  const bodySections = (query.data?.body || query.data?.summary || "").split(/\n\s*\n/).filter(Boolean);
  const journey = [
    { icon: Compass, label: "Explore", text: "Understand the opportunity and the professional context." },
    { icon: Lightbulb, label: "Learn", text: "Build practical knowledge through clear, focused guidance." },
    { icon: Target, label: "Apply", text: "Turn insight into confident action and measurable progress." },
    { icon: Network, label: "Connect", text: "Share experience and grow with the PCMO community." },
  ];

  return <div className="min-h-screen bg-white text-slate-800">
    <PublicNavigation active={slug === "about" ? "about" : activeGroup} />
    <main>{query.isLoading ? <div className="grid min-h-[500px] place-items-center text-[#0b3764]">Loading page…</div> : query.error || !query.data ? <div className="mx-auto min-h-[500px] max-w-5xl px-6 py-20"><h1 className="text-3xl font-bold text-[#0b3764]">Page not found</h1><p className="mt-3 text-slate-500">This page is unavailable or has not been published.</p></div> : <>
      <section className="relative min-h-[480px] overflow-hidden bg-[#071f3b] text-white">{query.data.hero_image && <img src={query.data.hero_image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30"/>}<div className="absolute inset-0 bg-gradient-to-r from-[#071f3b] via-[#0b3764]/90 to-red-950/45"/><div className="absolute -right-28 -top-28 h-96 w-96 animate-pulse rounded-full border-[60px] border-red-600/10"/><div className="relative mx-auto grid min-h-[480px] max-w-7xl gap-10 px-6 py-20 md:grid-cols-2 md:items-center"><div className="animate-in fade-in slide-in-from-left-6 duration-700"><p className="inline-flex items-center gap-2 rounded-full border border-red-400/30 bg-red-600/15 px-4 py-2 text-xs font-bold uppercase tracking-[.18em] text-red-200"><Sparkles className="h-4 w-4"/>Project & Contracts Management Organisation</p><h1 className="mt-6 font-heading text-5xl font-extrabold md:text-6xl">{query.data.title}</h1>{query.data.summary && <p className="mt-6 max-w-2xl text-lg leading-8 text-white/75">{query.data.summary}</p>}{query.data.call_to_action_label && query.data.call_to_action_url && <a href={query.data.call_to_action_url} className="mt-8 inline-flex items-center gap-2 rounded bg-red-600 px-6 py-3 font-bold shadow-lg transition hover:-translate-y-1 hover:bg-red-700">{query.data.call_to_action_label}<ArrowRight className="h-4 w-4"/></a>}</div>{query.data.hero_image ? <img src={query.data.hero_image} alt="" className="hidden max-h-80 w-full rotate-2 rounded-2xl border-4 border-white/15 object-cover shadow-2xl transition hover:rotate-0 md:block"/> : <div className="hidden rounded-2xl border border-white/15 bg-white/10 p-10 backdrop-blur md:block"><PcmoLogo light className="mx-auto h-24 w-full max-w-xs"/></div>}</div></section>
      {slug === "membership_faq" ? <section className="mx-auto max-w-5xl px-6 py-20"><div className="mb-10 text-center"><HelpCircle className="mx-auto h-12 w-12 text-red-600"/><h2 className="mt-4 font-heading text-3xl font-extrabold text-[#0b3764]">Membership questions, answered</h2><p className="mx-auto mt-3 max-w-2xl text-slate-600">Find quick guidance about joining PCMO and using your membership on this website.</p></div><div className="space-y-4">{membershipFaqs.map((faq, index) => <details key={faq.question} className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm open:border-red-200 open:shadow-md"><summary className="flex cursor-pointer list-none items-center gap-4 px-6 py-5 font-bold text-[#0b3764]"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-red-50 text-sm text-red-600">{index + 1}</span><span className="flex-1">{faq.question}</span><ChevronDown className="h-5 w-5 shrink-0 transition group-open:rotate-180"/></summary><p className="border-t border-slate-100 px-6 py-5 pl-[4.5rem] leading-7 text-slate-600">{faq.answer}</p></details>)}</div></section> : <section className="mx-auto max-w-7xl px-6 py-20"><div className="grid gap-12 lg:grid-cols-[1fr_340px]"><article className="space-y-7">{bodySections.map((section, index) => <div key={`${section.slice(0, 24)}-${index}`} className="animate-in fade-in slide-in-from-bottom-4 rounded-2xl border border-slate-100 bg-white p-7 leading-8 text-slate-700 shadow-sm duration-700" style={{ animationDelay: `${index * 90}ms` }}>{section}</div>)}</article><aside className="h-fit overflow-hidden rounded-2xl border bg-white shadow-xl lg:sticky lg:top-28">{query.data.reference_image_url && <img src={query.data.reference_image_url} alt="" className="h-48 w-full object-cover"/>}<div className="p-7"><div className="flex items-center gap-3"><BarChart3 className="h-6 w-6 text-red-600"/><h2 className="text-xl font-bold text-[#0b3764]">At a glance</h2></div><div className="mt-6 space-y-5">{journey.slice(0,3).map((item, index) => <div key={item.label}><div className="flex justify-between text-xs font-bold text-slate-600"><span>{item.label}</span><span>{(index + 1) * 25}%</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full animate-in slide-in-from-left bg-gradient-to-r from-[#0b3764] to-red-600 duration-1000" style={{ width: `${(index + 1) * 25}%` }}/></div></div>)}</div><Link to="/pages/membership_packages" className="mt-7 flex items-center justify-center gap-2 rounded bg-[#0b3764] px-4 py-3 text-sm font-bold text-white">Explore membership<ArrowRight className="h-4 w-4"/></Link></div></aside></div></section>}
      <section className="overflow-hidden bg-[#071f3b] px-6 py-20 text-white"><div className="mx-auto max-w-7xl"><div className="text-center"><p className="text-xs font-bold uppercase tracking-[.2em] text-red-400">Professional pathway</p><h2 className="mt-3 font-heading text-3xl font-extrabold">From insight to impact</h2></div><div className="relative mt-12 grid gap-5 md:grid-cols-4"><div className="absolute left-[12%] right-[12%] top-8 hidden h-px bg-gradient-to-r from-transparent via-red-500/60 to-transparent md:block"/>{journey.map(({ icon: Icon, label, text }, index) => <article key={label} className="group relative rounded-2xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur transition duration-500 hover:-translate-y-2 hover:border-red-500/50 hover:bg-white/10"><div className="mx-auto grid h-16 w-16 place-items-center rounded-full border-4 border-[#071f3b] bg-red-600 shadow-xl transition duration-500 group-hover:rotate-6 group-hover:scale-110"><Icon className="h-7 w-7"/></div><span className="mt-5 block text-xs font-black text-red-300">0{index + 1}</span><h3 className="mt-1 text-lg font-bold">{label}</h3><p className="mt-3 text-sm leading-6 text-white/60">{text}</p></article>)}</div></div></section>
      <section className="bg-slate-50 px-6 py-16 text-center"><h2 className="font-heading text-3xl font-extrabold text-[#0b3764]">Advance your professional journey</h2><p className="mx-auto mt-4 max-w-2xl text-slate-600">Join a community focused on stronger project delivery and contract management practice.</p><Link to="/login?mode=register" className="mt-7 inline-flex rounded bg-red-600 px-6 py-3 font-bold text-white">Join PCMO</Link></section>
    </>}</main>
    <PublicFooter />
  </div>;
};

export default WebsitePage;
