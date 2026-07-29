import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Building2, Check, Crown, GraduationCap, HeartHandshake, Sparkles, UserRound, Users } from "lucide-react";
import { Link } from "react-router-dom";
import PublicNavigation from "@/components/PublicNavigation";
import PublicFooter from "@/components/PublicFooter";

type Audience = "all" | "student" | "individual" | "retiree" | "group";
type Plan = { id: string; slug: string; name: string; description?: string; price: number; currency: string; billing_period: string; benefits?: string[] | string; featured_image?: string };

const audienceData = {
  all: { title: "Membership that grows with you", eyebrow: "Membership & Networking", text: "Choose a pathway built for your goals—from a free student start to permanent lifetime access and organisation-wide development.", image: "https://www.pcmo.world/website/spicimg/membership/3.jpeg", slugs: [] as string[] },
  student: { title: "Start your professional journey", eyebrow: "Student Membership", text: "Build practical knowledge, career direction, and professional connections while you study—at no membership cost.", image: "https://www.pcmo.world/website/spicimg/membership/1.jpeg", slugs: ["student-membership"] },
  individual: { title: "Invest in your professional growth", eyebrow: "Individual Membership", text: "Choose the depth of learning, certification, networking, and career support that fits your ambitions.", image: "https://www.pcmo.world/website/spicimg/membership/2.jpeg", slugs: ["individual-membership", "premium-membership", "lifetime-membership"] },
  retiree: { title: "Stay connected. Keep contributing.", eyebrow: "Retiree Membership", text: "Continue learning, mentoring, and sharing your experience through our flexible individual or lifetime pathways.", image: "https://www.pcmo.world/website/spicimg/membership/retiree_membership.png", slugs: ["individual-membership", "lifetime-membership"] },
  group: { title: "Develop your team and organisation", eyebrow: "Group Membership", text: "Give teams shared learning paths, progress visibility, premium resources, analytics, and administrative control.", image: "https://www.pcmo.world/website/spicimg/membership/3.jpeg", slugs: ["team-membership", "corporate-membership"] },
};

const audiences = [
  { id: "student" as const, label: "Students", icon: GraduationCap, description: "Free career foundation" },
  { id: "individual" as const, label: "Individuals", icon: UserRound, description: "Professional advancement" },
  { id: "retiree" as const, label: "Retirees", icon: HeartHandshake, description: "Connection and legacy" },
  { id: "group" as const, label: "Groups", icon: Users, description: "Team development" },
];

const accents: Record<string, string> = {
  "student-membership": "border-sky-400",
  "individual-membership": "border-emerald-400",
  "premium-membership": "border-[#0b3764]",
  "team-membership": "border-violet-400",
  "corporate-membership": "border-amber-400",
  "lifetime-membership": "border-red-400",
};

const PublicMembership = ({ audience = "all" }: { audience?: Audience }) => {
  const query = useQuery({
    queryKey: ["public-membership-plans"],
    queryFn: async () => {
      const response = await fetch("/api/public/membership-plans");
      if (!response.ok) throw new Error("Membership plans are unavailable");
      return response.json() as Promise<Plan[]>;
    },
  });
  const content = audienceData[audience];
  const plans = (query.data ?? []).filter(plan => !content.slugs.length || content.slugs.includes(plan.slug));
  const benefits = (plan: Plan) => Array.isArray(plan.benefits) ? plan.benefits : (() => { try { return JSON.parse(plan.benefits || "[]") as string[]; } catch { return []; } })();

  return <div className="min-h-screen bg-slate-50 text-slate-800">
    <PublicNavigation active="membership" />

    <main>
      <section className="relative min-h-[510px] overflow-hidden bg-[#071f3b] text-white"><img src={content.image} alt={content.eyebrow} className="absolute inset-0 h-full w-full object-cover opacity-30"/><div className="absolute inset-0 bg-gradient-to-r from-[#071f3b] via-[#0b3764]/90 to-red-950/50"/><div className="absolute -right-28 -top-28 h-96 w-96 animate-pulse rounded-full border-[60px] border-red-600/15"/><div className="relative mx-auto flex min-h-[510px] max-w-7xl items-center px-6 py-20"><div className="max-w-3xl animate-in fade-in slide-in-from-left-6 duration-700"><p className="inline-flex items-center gap-2 rounded-full border border-red-400/30 bg-red-600/15 px-4 py-2 text-xs font-bold uppercase tracking-[.2em] text-red-100"><Sparkles className="h-4 w-4"/>{content.eyebrow}</p><h1 className="mt-6 font-heading text-5xl font-extrabold leading-tight md:text-6xl">{content.title}</h1><p className="mt-6 max-w-2xl text-lg leading-8 text-white/75">{content.text}</p><a href="#plans" className="mt-8 inline-flex items-center gap-2 rounded bg-red-600 px-6 py-3 font-bold shadow-xl transition hover:-translate-y-1 hover:bg-red-700">Compare plans <ArrowRight className="h-4 w-4"/></a></div></div></section>

      <section className="relative z-10 mx-auto -mt-12 max-w-7xl px-6"><div className="grid gap-3 rounded-2xl border bg-white p-4 shadow-2xl sm:grid-cols-2 lg:grid-cols-4">{audiences.map(({ id, label, icon: Icon, description }) => <Link key={id} to={`/pages/${id === "student" ? "student_membership" : id === "individual" ? "individual_membership" : id === "retiree" ? "retiree_membership" : "group_membership"}`} className={`group flex items-center gap-4 rounded-xl border p-5 transition hover:-translate-y-1 hover:shadow-lg ${audience === id ? "border-red-500 bg-red-50" : "border-slate-200"}`}><span className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${audience === id ? "bg-red-600 text-white" : "bg-[#0b3764]/5 text-[#0b3764] group-hover:bg-[#0b3764] group-hover:text-white"}`}><Icon className="h-6 w-6"/></span><span><strong className="block text-[#0b3764]">{label}</strong><small className="text-slate-500">{description}</small></span></Link>)}</div></section>

      <section id="plans" className="mx-auto max-w-7xl scroll-mt-24 px-6 py-20"><div className="mx-auto max-w-3xl text-center"><p className="text-sm font-bold uppercase tracking-[.2em] text-red-600">Clear, flexible pricing</p><h2 className="mt-3 font-heading text-4xl font-extrabold text-[#0b3764]">{audience === "all" ? "Choose the plan that fits you" : `${content.eyebrow} plans`}</h2><p className="mt-4 text-slate-600">All prices are in USD. Yearly plans renew annually; Lifetime Membership is a one-time payment.</p></div>
        {query.isLoading ? <p className="py-20 text-center">Loading membership plans…</p> : query.error ? <p className="py-20 text-center text-red-600">Membership plans are currently unavailable.</p> : <div className={`mt-12 grid gap-6 md:grid-cols-2 ${plans.length > 2 ? "xl:grid-cols-3" : "mx-auto max-w-4xl"}`}>{plans.map(plan => { const price = Number(plan.price || 0); const monthly = plan.billing_period === "yearly" && price ? price / 12 : null; const premium = plan.slug === "premium-membership"; return <article key={plan.id} className={`relative flex flex-col rounded-2xl border-2 bg-white p-7 shadow-sm transition duration-300 hover:-translate-y-2 hover:shadow-2xl ${accents[plan.slug] || "border-slate-200"}`}>{premium && <span className="absolute -top-3 left-6 inline-flex items-center gap-1 rounded-full bg-[#0b3764] px-3 py-1 text-xs font-bold text-white"><Crown className="h-3.5 w-3.5"/>Most popular</span>}<h3 className="font-heading text-2xl font-extrabold text-[#0b3764]">{plan.name}</h3><p className="mt-2 min-h-12 text-sm leading-6 text-slate-500">{plan.description}</p><div className="mt-6"><span className="text-4xl font-extrabold text-slate-900">{price === 0 ? "Free" : `$${price.toLocaleString()}`}</span>{price > 0 && plan.billing_period === "yearly" && <span className="text-sm text-slate-500"> / year</span>}<p className="mt-1 text-xs text-slate-500">{plan.billing_period === "one-time" ? "Pay once, no renewal" : monthly ? `$${monthly.toFixed(2)} per month, billed yearly` : "No membership fee"}</p></div><div className="my-6 h-px bg-slate-200"/><p className="text-sm font-bold text-[#0b3764]">What you get</p><ul className="mt-4 flex-1 space-y-3">{benefits(plan).map(item => <li key={item} className="flex gap-3 text-sm"><span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-600"><Check className="h-3.5 w-3.5"/></span>{item}</li>)}</ul><Link to={`/login?mode=register&plan=${plan.slug}`} className={`mt-8 flex items-center justify-center gap-2 rounded px-5 py-3 font-bold transition ${premium || price === 0 ? "bg-[#0b3764] text-white hover:bg-red-600" : "border border-[#0b3764] text-[#0b3764] hover:bg-[#0b3764] hover:text-white"}`}>{price === 0 ? "Start free" : "Choose this plan"}<ArrowRight className="h-4 w-4"/></Link></article>})}</div>}
      </section>

      {audience === "retiree" && <section className="bg-white px-6 py-16"><div className="mx-auto grid max-w-6xl gap-8 rounded-2xl bg-[#0b3764] p-8 text-white shadow-xl md:grid-cols-[auto_1fr] md:items-center"><HeartHandshake className="h-16 w-16 text-red-400"/><div><h2 className="text-2xl font-bold">Your experience still shapes the profession</h2><p className="mt-3 leading-7 text-white/70">Retirees select from our Individual or Lifetime plans and receive the same professional resources, community access, mentoring opportunities, and member pricing included in that plan.</p></div></div></section>}
      {audience === "group" && <section className="bg-white px-6 py-16"><div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2"><div className="rounded-2xl border p-7"><Users className="h-10 w-10 text-red-600"/><h2 className="mt-4 text-xl font-bold text-[#0b3764]">Team Membership</h2><p className="mt-3 leading-7 text-slate-600">Designed for teams of up to 10 professionals with shared learning goals and manager reporting.</p></div><div className="rounded-2xl border p-7"><Building2 className="h-10 w-10 text-red-600"/><h2 className="mt-4 text-xl font-bold text-[#0b3764]">Corporate Membership</h2><p className="mt-3 leading-7 text-slate-600">For organisations of up to 50 members requiring analytics, branded pathways, admin controls, and priority support.</p></div></div></section>}
    </main>
    <PublicFooter />
  </div>;
};

export default PublicMembership;
