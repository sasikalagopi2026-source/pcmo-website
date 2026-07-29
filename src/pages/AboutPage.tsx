import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Award,
  BookOpenCheck,
  CheckCircle2,
  Eye,
  Globe2,
  GraduationCap,
  Handshake,
  HeartHandshake,
  Lightbulb,
  Network,
  Rocket,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import PublicFooter from "@/components/PublicFooter";
import PublicNavigation from "@/components/PublicNavigation";

type AboutContent = {
  title: string;
  summary?: string;
  body?: string;
  hero_image?: string;
  reference_image_url?: string;
  call_to_action_label?: string;
  call_to_action_url?: string;
  seo_title?: string;
  seo_description?: string;
};

const values = [
  { icon: Award, title: "Excellence", text: "The highest standards across our programs, resources, and professional services." },
  { icon: HeartHandshake, title: "Inclusion", text: "A global community where varied perspectives, backgrounds, and experiences belong." },
  { icon: Lightbulb, title: "Innovation", text: "Continually improving how professional knowledge and practical skills are shared." },
  { icon: Network, title: "Community", text: "Meaningful opportunities for collaboration, mentorship, and lifelong connection." },
];

const advantages = [
  { icon: GraduationCap, title: "Expert-led learning", text: "Interactive webinars, in-depth courses, and workshops led by industry practitioners." },
  { icon: ShieldCheck, title: "Recognised certification", text: "Rigorous certification pathways that validate knowledge and professional capability." },
  { icon: Users, title: "Global networking", text: "Connect with peers, mentors, and leaders through events, forums, and communities." },
  { icon: Rocket, title: "Career advancement", text: "Develop the practical skills, confidence, and visibility needed for your next opportunity." },
];

const stats = [
  { value: "15+", label: "Countries represented", icon: Globe2 },
  { value: "500+", label: "Industry experts", icon: Users },
  { value: "20+", label: "Learning pathways", icon: BookOpenCheck },
  { value: "1", label: "Global community", icon: Handshake },
];

const AboutPage = () => {
  const query = useQuery({
    queryKey: ["website-page", "about"],
    queryFn: async () => {
      const response = await fetch("/api/pages/about");
      if (!response.ok) throw new Error("About page is unavailable");
      return response.json() as Promise<AboutContent>;
    },
  });
  const page = query.data;

  useEffect(() => {
    if (!page) return;
    document.title = page.seo_title || page.title;
    const meta = document.querySelector('meta[name="description"]') ?? document.head.appendChild(document.createElement("meta"));
    meta.setAttribute("name", "description");
    meta.setAttribute("content", page.seo_description || page.summary || "About PCMO");
  }, [page]);

  if (query.isLoading) return <div className="grid min-h-screen place-items-center bg-white text-[#0b3764]">Loading About PCMO…</div>;
  if (query.error || !page) return <div className="grid min-h-screen place-items-center bg-white text-red-600">About page is currently unavailable.</div>;

  const paragraphs = (page.body || "").split(/\n\n+/).filter(Boolean);
  const introduction = paragraphs.find((paragraph) => paragraph.startsWith("Welcome to")) || page.summary;

  return (
    <div className="min-h-screen overflow-hidden bg-white text-slate-800">
      <PublicNavigation active="about" />

      <main>
        <section className="relative min-h-[540px] overflow-hidden bg-[#071f3b] text-white">
          {page.hero_image && <img src={page.hero_image} alt="PCMO professional community" className="absolute inset-0 h-full w-full object-cover opacity-35" />}
          <div className="absolute inset-0 bg-gradient-to-r from-[#071f3b] via-[#0b3764]/90 to-red-950/55" />
          <div className="absolute -right-28 -top-28 h-96 w-96 animate-pulse rounded-full border-[60px] border-red-600/15" />
          <div className="absolute -bottom-36 -left-24 h-96 w-96 rounded-full border-[50px] border-white/5" />
          <div className="relative mx-auto grid min-h-[540px] max-w-7xl items-center gap-12 px-6 py-20 lg:grid-cols-[1.15fr_.85fr]">
            <div className="animate-in fade-in slide-in-from-left-8 duration-700">
              <div className="inline-flex items-center gap-2 rounded-full border border-red-400/40 bg-red-600/15 px-4 py-2 text-xs font-bold uppercase tracking-[.2em] text-red-200"><Sparkles className="h-4 w-4" /> Who we are</div>
              <h1 className="mt-6 max-w-3xl font-heading text-5xl font-extrabold leading-tight md:text-6xl">Building capability.<br/><span className="text-red-500">Connecting professionals.</span></h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-white/75">{page.summary}</p>
              <div className="mt-8 flex flex-wrap gap-3"><Link to={page.call_to_action_url || "/login?mode=register"} className="inline-flex items-center gap-2 rounded bg-red-600 px-6 py-3 font-bold shadow-xl transition hover:-translate-y-1 hover:bg-red-700">{page.call_to_action_label || "Join PCMO"}<ArrowRight className="h-4 w-4" /></Link><a href="#story" className="rounded border border-white/30 px-6 py-3 font-bold transition hover:bg-white/10">Discover our story</a></div>
            </div>
            <div className="relative hidden lg:block"><div className="absolute -inset-5 rotate-3 rounded-3xl border-2 border-red-500/40"/><div className="relative rounded-3xl border border-white/20 bg-white/10 p-8 shadow-2xl backdrop-blur"><Target className="h-14 w-14 text-red-500"/><p className="mt-6 text-2xl font-bold">Project & Contracts Management Organisation</p><p className="mt-4 leading-7 text-white/65">Knowledge · Certification · Collaboration · Professional growth</p></div></div>
          </div>
        </section>

        <section className="relative z-10 mx-auto -mt-10 grid max-w-6xl grid-cols-2 gap-3 px-6 md:grid-cols-4">
          {stats.map(({ value, label, icon: Icon }, index) => <div key={label} className="animate-in fade-in slide-in-from-bottom-5 rounded-xl border border-slate-100 bg-white p-6 text-center shadow-xl duration-700" style={{ animationDelay: `${index * 100}ms` }}><Icon className="mx-auto h-7 w-7 text-red-600"/><p className="mt-3 text-3xl font-extrabold text-[#0b3764]">{value}</p><p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p></div>)}
        </section>

        <section id="story" className="mx-auto grid max-w-7xl gap-14 px-6 py-24 lg:grid-cols-2 lg:items-center">
          <div className="group relative"><div className="absolute -left-5 -top-5 h-32 w-32 border-l-4 border-t-4 border-dotted border-red-600"/>{page.reference_image_url ? <img src={page.reference_image_url} alt="PCMO community working together" className="relative h-[440px] w-full rounded-2xl object-cover shadow-2xl transition duration-700 group-hover:scale-[1.02]"/> : <div className="h-[440px] rounded-2xl bg-[#0b3764]"/>}<div className="absolute -bottom-7 -right-4 max-w-xs rounded-xl bg-red-600 p-6 text-white shadow-xl"><p className="text-3xl font-extrabold">Together</p><p className="mt-1 text-sm text-white/80">we improve lives through shared knowledge.</p></div></div>
          <div><p className="text-sm font-bold uppercase tracking-[.2em] text-red-600">About PCMO</p><h2 className="mt-3 font-heading text-4xl font-extrabold leading-tight text-[#0b3764]">A global platform for professional excellence</h2><p className="mt-6 text-base leading-8 text-slate-600">{introduction}</p><div className="mt-8 grid gap-4 sm:grid-cols-2"><div className="flex gap-3"><CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-red-600"/><p className="text-sm leading-6">World-class research and practical industry insight</p></div><div className="flex gap-3"><CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-red-600"/><p className="text-sm leading-6">Collaboration, mentorship, and best-practice forums</p></div><div className="flex gap-3"><CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-red-600"/><p className="text-sm leading-6">Globally relevant training and certifications</p></div><div className="flex gap-3"><CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-red-600"/><p className="text-sm leading-6">A diverse and inclusive professional community</p></div></div></div>
        </section>

        <section className="bg-slate-50 px-6 py-20"><div className="mx-auto max-w-6xl"><div className="text-center"><p className="text-sm font-bold uppercase tracking-[.2em] text-red-600">Our direction</p><h2 className="mt-3 font-heading text-4xl font-extrabold text-[#0b3764]">Mission, Vision & Values</h2></div><div className="mt-12 grid gap-6 lg:grid-cols-2"><article className="group relative overflow-hidden rounded-2xl bg-[#0b3764] p-9 text-white shadow-xl transition hover:-translate-y-2"><Target className="h-12 w-12 text-red-500"/><h3 className="mt-5 text-2xl font-bold">Our Mission</h3><p className="mt-4 leading-8 text-white/70">Empower professionals and students with the knowledge, practical skills, and networks they need to excel in project and contract management.</p><div className="absolute -bottom-20 -right-20 h-56 w-56 rounded-full border-[35px] border-white/5"/></article><article className="group relative overflow-hidden rounded-2xl bg-red-600 p-9 text-white shadow-xl transition hover:-translate-y-2"><Eye className="h-12 w-12"/><h3 className="mt-5 text-2xl font-bold">Our Vision</h3><p className="mt-4 leading-8 text-white/80">A world where project and contract management professionals lead innovation and efficiency across every sector.</p><div className="absolute -bottom-20 -right-20 h-56 w-56 rounded-full border-[35px] border-white/10"/></article></div><div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{values.map(({ icon: Icon, title, text }) => <article key={title} className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-2 hover:border-red-300 hover:shadow-xl"><div className="grid h-12 w-12 place-items-center rounded-lg bg-red-50 text-red-600 transition group-hover:bg-red-600 group-hover:text-white"><Icon className="h-6 w-6"/></div><h3 className="mt-5 text-lg font-bold text-[#0b3764]">{title}</h3><p className="mt-3 text-sm leading-6 text-slate-600">{text}</p></article>)}</div></div></section>

        <section className="px-6 py-20"><div className="mx-auto max-w-6xl"><div className="mx-auto max-w-3xl text-center"><p className="text-sm font-bold uppercase tracking-[.2em] text-red-600">The PCMO advantage</p><h2 className="mt-3 font-heading text-4xl font-extrabold text-[#0b3764]">Why professionals choose us</h2><p className="mt-5 leading-7 text-slate-600">A connected ecosystem designed to support every stage of your professional journey.</p></div><div className="relative mt-14 grid gap-8 md:grid-cols-4"><div className="absolute left-[12%] right-[12%] top-10 hidden border-t-2 border-dashed border-red-200 md:block"/>{advantages.map(({ icon: Icon, title, text }, index) => <article key={title} className="relative text-center"><div className="relative z-10 mx-auto grid h-20 w-20 place-items-center rounded-full border-4 border-white bg-[#0b3764] text-white shadow-lg transition duration-300 hover:rotate-6 hover:scale-110"><Icon className="h-8 w-8"/></div><div className="mx-auto mt-5 grid h-7 w-7 place-items-center rounded-full bg-red-600 text-xs font-bold text-white">{index + 1}</div><h3 className="mt-4 font-bold text-[#0b3764]">{title}</h3><p className="mt-3 text-sm leading-6 text-slate-600">{text}</p></article>)}</div></div></section>

        <section className="relative overflow-hidden bg-[#0b3764] px-6 py-20 text-center text-white"><div className="absolute inset-0 opacity-10 [background-image:radial-gradient(circle_at_center,white_1px,transparent_1px)] [background-size:28px_28px]"/><div className="relative mx-auto max-w-3xl"><Sparkles className="mx-auto h-10 w-10 text-red-500"/><h2 className="mt-5 font-heading text-4xl font-extrabold">Join the PCMO community today</h2><p className="mt-5 text-lg leading-8 text-white/70">Be part of a community driving excellence, innovation, and meaningful professional growth across the industry.</p><Link to={page.call_to_action_url || "/login?mode=register"} className="mt-8 inline-flex items-center gap-2 rounded bg-red-600 px-7 py-4 font-bold shadow-xl transition hover:-translate-y-1 hover:bg-red-700">Become a member <ArrowRight className="h-5 w-5"/></Link></div></section>
      </main>

      <PublicFooter />
    </div>
  );
};

export default AboutPage;
