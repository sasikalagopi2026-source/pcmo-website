import { ArrowRight, BarChart3, BookOpen, BrainCircuit, BriefcaseBusiness, Building2, CheckCircle2, ChevronDown, FileSearch, Globe2, Lightbulb, MessageSquareQuote, Scale, ShieldCheck, Sparkles, Target, TrendingUp, Users } from "lucide-react";
import { Link } from "react-router-dom";
import PublicFooter from "@/components/PublicFooter";
import PublicNavigation from "@/components/PublicNavigation";

const themes = [
  [TrendingUp, "Future of Project Delivery", "Adaptive governance, delivery models, productivity, complexity, resilience, and value realisation."],
  [Scale, "Contracts & Commercial Strategy", "Contracting models, negotiation, risk allocation, claims avoidance, supplier performance, and commercial outcomes."],
  [BrainCircuit, "Digital Transformation & AI", "Responsible automation, decision intelligence, data quality, digital controls, cybersecurity, and human oversight."],
  [ShieldCheck, "Governance, Risk & Assurance", "Executive oversight, integrated assurance, ethical leadership, transparent decisions, and control effectiveness."],
  [Globe2, "Sustainability & Social Value", "Climate-aware delivery, responsible procurement, whole-life value, inclusion, and stakeholder outcomes."],
  [Users, "Leadership & Professional Capability", "Culture, judgement, influence, talent pipelines, mentoring, learning, and communities of practice."],
] as const;

const featured = [
  ["Executive Brief", "From reporting activity to governing outcomes", "A leadership perspective on turning dashboards, forecasts, and assurance evidence into timely executive decisions.", "Governance"],
  ["Research Insight", "Why contract data must become delivery intelligence", "How obligations, notices, changes, performance, and commercial exposure can form one reliable management picture.", "Contracts"],
  ["Practice Paper", "Responsible AI in project and contract environments", "A practical model for human accountability, data controls, validation, confidentiality, and transparent AI-assisted decisions.", "Digital practice"],
] as const;

const formats = [
  [BookOpen, "Research papers", "Evidence-led analysis of significant challenges, emerging practices, and professional implications."],
  [FileSearch, "Practice notes", "Focused guidance that converts experience and research into practical management actions."],
  [MessageSquareQuote, "Executive interviews", "Direct perspectives from leaders responsible for complex projects, contracts, portfolios, and organisations."],
  [BarChart3, "Industry outlooks", "Trends, scenarios, signals, risks, and opportunities shaping future professional practice."],
  [BriefcaseBusiness, "Case insights", "Structured lessons from delivery decisions, controls, recoveries, disputes, and transformation programmes."],
  [Lightbulb, "Opinion and debate", "Constructive, clearly identified viewpoints that challenge assumptions and invite professional discussion."],
] as const;

const editorial = [
  ["Relevance", "Addresses a material project, contract, commercial, leadership, or professional-practice issue."],
  ["Evidence", "Distinguishes facts, professional experience, interpretation, assumptions, and opinion."],
  ["Originality", "Offers a useful framework, insight, synthesis, lesson, or perspective rather than repeating familiar claims."],
  ["Practical value", "Explains what leaders and practitioners can consider, test, implement, measure, or improve."],
  ["Integrity", "Discloses interests, respects confidentiality, attributes sources, and avoids unsupported promotional claims."],
  ["Accessibility", "Uses clear language, structured reasoning, meaningful examples, and an appropriate level of technical detail."],
] as const;

const process = [
  ["01", "Frame the question", "Define the decision, challenge, audience, professional context, and why the issue matters now."],
  ["02", "Gather evidence", "Use credible data, research, documented experience, expert insight, and relevant counterarguments."],
  ["03", "Develop the insight", "Explain patterns, implications, trade-offs, limitations, and the practical meaning for professionals."],
  ["04", "Peer review", "Test accuracy, reasoning, clarity, ethics, confidentiality, and usefulness with appropriate reviewers."],
  ["05", "Publish and discuss", "Share the work in a suitable format and invite constructive professional dialogue."],
  ["06", "Measure influence", "Track engagement, feedback, adoption, decisions, learning, and opportunities for further research."],
] as const;

const faqs = [
  ["Who can contribute to PCMO thought leadership?", "Practitioners, researchers, executives, educators, members, partners, and subject-matter specialists may propose content where they can provide credible, relevant, and ethically shareable insight."],
  ["Does PCMO accept opinion articles?", "Yes, when opinion is clearly identified, professionally reasoned, relevant to the PCMO community, respectful of alternative views, and not presented as verified fact."],
  ["Can project or contract case studies be submitted?", "Yes, provided the contributor has authority to share the information and removes or protects confidential, personal, commercially sensitive, privileged, and client-restricted material."],
  ["How are sources and AI-assisted content handled?", "Sources should be attributable and verifiable. Any AI assistance must remain under human professional responsibility, with facts checked, confidential data protected, and misleading authorship or fabricated citations prohibited."],
  ["Is publication guaranteed after submission?", "No. Proposals and drafts are assessed for fit, quality, evidence, originality, ethics, clarity, and editorial capacity. PCMO may request revision, peer review, or a different format."],
  ["How can readers respond to published ideas?", "Readers can use relevant community discussions, events, webinars, or contact channels to offer evidence, alternative perspectives, implementation lessons, and suggestions for future research."],
] as const;

const ThoughtLeadershipHub = () => <div className="min-h-screen bg-white text-slate-800"><PublicNavigation active="resources"/><main>
  <section className="relative overflow-hidden bg-[#071f3b] px-6 py-24 text-white"><div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(220,38,38,.26),transparent_34%)]"/><div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.1fr_.9fr] lg:items-center"><div><p className="text-sm font-bold uppercase tracking-[.22em] text-red-300">Ideas shaping professional practice</p><h1 className="mt-4 font-heading text-6xl font-extrabold">Thought leadership for complex projects and contracts</h1><p className="mt-6 max-w-3xl text-lg leading-8 text-white/70">Evidence, experience, informed challenge, and practical insight for professionals responsible for delivery, commercial outcomes, governance, and organisational change.</p><div className="mt-8 flex flex-wrap gap-3"><a href="#insights" className="rounded bg-red-600 px-6 py-3 font-bold">Explore insights</a><Link to="/contact" className="rounded border border-white/25 px-6 py-3 font-bold">Propose a contribution</Link></div></div><div className="relative rounded-3xl border border-white/15 bg-white/5 p-9 backdrop-blur"><MessageSquareQuote className="h-14 w-14 text-red-400"/><blockquote className="mt-6 text-2xl font-bold leading-10">“Thought leadership creates value when it improves the quality of professional decisions.”</blockquote><p className="mt-5 text-sm text-white/55">PCMO editorial principle</p></div></div></section>

  <section id="insights" className="mx-auto max-w-7xl px-6 py-20"><div className="text-center"><Sparkles className="mx-auto h-11 w-11 text-red-600"/><h2 className="mt-4 font-heading text-4xl font-extrabold text-[#0b3764]">Strategic themes</h2><p className="mx-auto mt-4 max-w-3xl leading-7 text-slate-600">PCMO thought leadership connects immediate professional challenges with the forces reshaping future practice.</p></div><div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">{themes.map(([Icon,title,text],index) => <article key={title} className="group relative overflow-hidden rounded-2xl border p-7 shadow-sm transition hover:-translate-y-2 hover:border-red-300 hover:shadow-xl"><span className="absolute right-5 top-3 text-6xl font-black text-slate-50">0{index+1}</span><div className="relative grid h-12 w-12 place-items-center rounded-xl bg-[#0b3764] text-white group-hover:bg-red-600"><Icon className="h-6 w-6"/></div><h3 className="relative mt-5 text-xl font-extrabold text-[#0b3764]">{title}</h3><p className="relative mt-3 leading-7 text-slate-600">{text}</p></article>)}</div></section>

  <section className="bg-slate-50 px-6 py-20"><div className="mx-auto max-w-7xl"><div className="flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><p className="text-sm font-bold uppercase tracking-widest text-red-600">Featured thinking</p><h2 className="mt-3 font-heading text-4xl font-extrabold text-[#0b3764]">Questions worth examining</h2></div><Link to="/library" className="inline-flex items-center gap-2 font-bold text-red-600">Open the knowledge centre<ArrowRight className="h-4 w-4"/></Link></div><div className="mt-10 grid gap-7 lg:grid-cols-3">{featured.map(([format,title,text,category],index) => <article key={title} className="group overflow-hidden rounded-2xl border bg-white shadow-lg"><div className="relative h-44 bg-[#0b3764] p-7 text-white"><span className="text-xs font-bold uppercase tracking-widest text-red-300">{format}</span><p className="absolute bottom-6 left-7 right-7 text-xs font-semibold uppercase tracking-wider text-white/50">{category}</p><span className="absolute right-5 top-4 text-7xl font-black text-white/5">0{index+1}</span></div><div className="p-7"><h3 className="text-2xl font-extrabold leading-8 text-[#0b3764]">{title}</h3><p className="mt-4 min-h-28 leading-7 text-slate-600">{text}</p><Link to="/library" className="mt-5 inline-flex items-center gap-2 font-bold text-red-600">Explore related resources<ArrowRight className="h-4 w-4 transition group-hover:translate-x-1"/></Link></div></article>)}</div></div></section>

  <section className="bg-[#0b3764] px-6 py-20 text-white"><div className="mx-auto max-w-7xl"><p className="text-center text-sm font-bold uppercase tracking-widest text-red-300">Editorial formats</p><h2 className="mt-3 text-center font-heading text-4xl font-extrabold">Different formats for different questions</h2><div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{formats.map(([Icon,title,text]) => <article key={title} className="rounded-2xl border border-white/10 bg-white/5 p-7 transition hover:bg-white/10"><Icon className="h-9 w-9 text-red-400"/><h3 className="mt-5 text-xl font-bold">{title}</h3><p className="mt-3 leading-7 text-white/65">{text}</p></article>)}</div></div></section>

  <section className="mx-auto max-w-7xl px-6 py-20"><div className="grid gap-12 lg:grid-cols-[.8fr_1.2fr]"><div><Target className="h-12 w-12 text-red-600"/><h2 className="mt-5 font-heading text-4xl font-extrabold text-[#0b3764]">Editorial standard</h2><p className="mt-5 leading-8 text-slate-600">Credible thought leadership is useful, transparent about evidence and limitations, respectful of professional obligations, and clear about what readers should consider next.</p><Link to="/pages/standards" className="mt-7 inline-flex items-center gap-2 rounded bg-[#0b3764] px-5 py-3 font-bold text-white">View professional standards<ArrowRight className="h-4 w-4"/></Link></div><div className="grid gap-4 sm:grid-cols-2">{editorial.map(([title,text]) => <article key={title} className="rounded-xl border bg-slate-50 p-5"><CheckCircle2 className="h-6 w-6 text-emerald-600"/><h3 className="mt-3 font-bold text-[#0b3764]">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{text}</p></article>)}</div></div></section>

  <section className="bg-red-50 px-6 py-20"><div className="mx-auto max-w-7xl"><div className="text-center"><Lightbulb className="mx-auto h-12 w-12 text-red-600"/><h2 className="mt-4 font-heading text-4xl font-extrabold text-[#0b3764]">Insight development journey</h2></div><div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{process.map(([number,title,text]) => <article key={number} className="rounded-2xl bg-white p-7 shadow-sm"><span className="text-4xl font-black text-red-600">{number}</span><h3 className="mt-3 text-xl font-bold text-[#0b3764]">{title}</h3><p className="mt-3 leading-7 text-slate-600">{text}</p></article>)}</div></div></section>

  <section className="mx-auto grid max-w-7xl gap-8 px-6 py-20 lg:grid-cols-2"><article className="rounded-3xl border p-8"><Building2 className="h-11 w-11 text-red-600"/><h2 className="mt-5 font-heading text-3xl font-extrabold text-[#0b3764]">For organisations and partners</h2><p className="mt-4 leading-8 text-slate-600">Collaborate with PCMO on practitioner research, industry roundtables, executive perspectives, anonymised case insights, professional surveys, and topic-focused knowledge programmes.</p><Link to="/contact" className="mt-7 inline-flex rounded bg-[#0b3764] px-5 py-3 font-bold text-white">Discuss collaboration</Link></article><article className="rounded-3xl bg-[#071f3b] p-8 text-white"><Users className="h-11 w-11 text-red-400"/><h2 className="mt-5 font-heading text-3xl font-extrabold">For contributors</h2><p className="mt-4 leading-8 text-white/65">Propose a clear question, intended audience, format, evidence base, practical contribution, author credentials, and any conflicts or confidentiality considerations.</p><Link to="/contact" className="mt-7 inline-flex rounded bg-red-600 px-5 py-3 font-bold">Submit an idea</Link></article></section>

  <section className="bg-slate-50 px-6 py-20"><div className="mx-auto max-w-4xl"><h2 className="text-center font-heading text-4xl font-extrabold text-[#0b3764]">Thought leadership FAQs</h2><div className="mt-10 space-y-4">{faqs.map(([question,answer]) => <details key={question} className="group rounded-xl border bg-white shadow-sm"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 font-bold text-[#0b3764]">{question}<ChevronDown className="h-5 w-5 transition group-open:rotate-180"/></summary><p className="border-t px-5 py-5 leading-7 text-slate-600">{answer}</p></details>)}</div></div></section>

  <section className="bg-red-600 px-6 py-16 text-center text-white"><h2 className="font-heading text-4xl font-extrabold">Join the professional conversation</h2><p className="mx-auto mt-4 max-w-2xl text-white/75">Read, question, contribute, and help turn better ideas into better project and contract outcomes.</p><div className="mt-7 flex flex-wrap justify-center gap-3"><Link to="/library" className="rounded bg-white px-6 py-3 font-bold text-red-600">Browse insights</Link><Link to="/pages/join_the_conversation" className="rounded border border-white/40 px-6 py-3 font-bold">Join the conversation</Link></div></section>
</main><PublicFooter/></div>;

export default ThoughtLeadershipHub;
