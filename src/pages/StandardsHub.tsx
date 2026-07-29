import { ArrowRight, BookOpenCheck, CheckCircle2, ChevronDown, ClipboardCheck, FileCheck2, FileSearch, Gauge, Landmark, Scale, ShieldCheck, Target, Users } from "lucide-react";
import { Link } from "react-router-dom";
import PublicFooter from "@/components/PublicFooter";
import PublicNavigation from "@/components/PublicNavigation";

const domains = [
  [Target, "Project Governance", "Decision rights, sponsorship, stage gates, tolerances, accountability, escalation, and benefits oversight."],
  [FileCheck2, "Project Controls", "Scope, schedule, cost, progress, forecasting, change, risk, reporting, and baseline integrity."],
  [Scale, "Contract Governance", "Contract strategy, authority, obligations, notices, variations, payments, claims, records, and closeout."],
  [ShieldCheck, "Risk & Assurance", "Risk ownership, control design, independent review, audit evidence, issue management, and corrective action."],
  [BookOpenCheck, "Quality Management", "Quality planning, acceptance criteria, verification, non-conformance, lessons, and continual improvement."],
  [Landmark, "Ethics & Compliance", "Integrity, conflicts of interest, confidentiality, fair dealing, anti-bribery controls, and professional conduct."],
] as const;

const lifecycle = [
  ["01", "Establish", "Define the mandate, applicable obligations, governance model, policies, and accountable owners."],
  ["02", "Tailor", "Scale controls to complexity, value, delivery model, risk exposure, and contractual environment."],
  ["03", "Implement", "Embed requirements in processes, roles, templates, systems, training, and decision forums."],
  ["04", "Evidence", "Retain reliable records showing approvals, performance, compliance, decisions, and corrective actions."],
  ["05", "Assure", "Review control effectiveness through monitoring, audits, health checks, and independent challenge."],
  ["06", "Improve", "Use results, incidents, feedback, and lessons learned to strengthen the management system."],
] as const;

const controls = [
  ["Governance charter", "Purpose, authority, roles, forums, thresholds, escalation, reporting, and review cycle."],
  ["Integrated management plan", "How scope, schedule, cost, quality, risk, resources, procurement, and communications will be controlled."],
  ["Contract obligation register", "Key duties, notices, deliverables, dates, approvals, records, and responsible owners."],
  ["Change-control procedure", "Initiation, impact assessment, authority, approval, baseline updates, implementation, and closure."],
  ["Risk and opportunity register", "Causes, events, effects, ratings, controls, actions, owners, dates, and residual exposure."],
  ["Assurance plan", "Reviews, audits, hold points, evidence, findings, corrective actions, and reporting arrangements."],
  ["Document-control protocol", "Naming, classification, review, approval, revision, distribution, retention, and disposal."],
  ["Performance dashboard", "Measures, definitions, sources, owners, targets, tolerances, trends, forecasts, and commentary."],
] as const;

const maturity = [
  ["1", "Initial", "Practices are reactive, inconsistent, and dependent on individuals."],
  ["2", "Defined", "Core processes and responsibilities are documented but applied unevenly."],
  ["3", "Controlled", "Standards are embedded, measured, evidenced, and actively governed."],
  ["4", "Integrated", "Project, commercial, contract, risk, quality, and assurance information is connected."],
  ["5", "Optimising", "Predictive insight, benchmarking, learning, and continual improvement shape decisions."],
] as const;

const faqs = [
  ["Are PCMO standards a substitute for law or contract terms?", "No. Applicable law, regulation, contract conditions, client requirements, and formally adopted organisational policies take priority. PCMO guidance should be tailored and reviewed by qualified professionals where necessary."],
  ["How should a small project apply these standards?", "Use proportional controls. Keep the same management intent and accountability while simplifying documents, forums, reporting frequency, and approval levels to match risk and complexity."],
  ["Who owns standards compliance?", "Management establishes accountability, but every assigned owner is responsible for applying requirements, maintaining evidence, escalating exceptions, and completing corrective actions."],
  ["What evidence demonstrates effective implementation?", "Approved plans, current registers, traceable decisions, controlled records, performance trends, completed reviews, closed actions, and evidence that lessons changed future practice."],
  ["How often should standards be reviewed?", "Review them on a planned cycle and whenever material changes occur in law, contracts, strategy, delivery model, risk exposure, systems, organisational structure, or lessons learned."],
] as const;

const StandardsHub = () => <div className="min-h-screen bg-white text-slate-800"><PublicNavigation active="resources"/><main>
  <section className="relative overflow-hidden bg-[#071f3b] px-6 py-24 text-white"><div className="absolute inset-0 bg-[linear-gradient(120deg,transparent_45%,rgba(220,38,38,.22))]"/><div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.15fr_.85fr] lg:items-center"><div><p className="text-sm font-bold uppercase tracking-[.22em] text-red-300">PCMO standards and professional practice</p><h1 className="mt-4 font-heading text-6xl font-extrabold">Standards that turn governance into reliable delivery</h1><p className="mt-6 max-w-3xl text-lg leading-8 text-white/70">A practical framework for governing projects, administering contracts, controlling performance, managing risk, and demonstrating accountable professional practice.</p><div className="mt-8 flex flex-wrap gap-3"><a href="#framework" className="rounded bg-red-600 px-6 py-3 font-bold">Explore the framework</a><Link to="/pages/resources" className="rounded border border-white/25 px-6 py-3 font-bold">Resource centre</Link></div></div><div className="rounded-3xl border border-white/15 bg-white/5 p-8 backdrop-blur"><ShieldCheck className="h-16 w-16 text-red-400"/><h2 className="mt-5 text-2xl font-bold">Professional practice principles</h2><div className="mt-5 space-y-3 text-white/75">{["Clear accountability", "Proportionate governance", "Evidence-based decisions", "Transparent controls", "Ethical professional conduct", "Continual improvement"].map(item => <p key={item} className="flex gap-3"><CheckCircle2 className="h-5 w-5 shrink-0 text-red-400"/>{item}</p>)}</div></div></div></section>

  <section id="framework" className="mx-auto max-w-7xl px-6 py-20"><div className="text-center"><p className="text-sm font-bold uppercase tracking-widest text-red-600">Standards framework</p><h2 className="mt-3 font-heading text-4xl font-extrabold text-[#0b3764]">Six connected practice domains</h2><p className="mx-auto mt-4 max-w-3xl leading-7 text-slate-600">Apply these domains as an integrated management system rather than isolated procedures.</p></div><div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">{domains.map(([Icon,title,text],index) => <article key={title} className="group relative overflow-hidden rounded-2xl border p-7 shadow-sm transition hover:-translate-y-2 hover:border-red-300 hover:shadow-xl"><span className="absolute right-5 top-3 text-6xl font-black text-slate-50">0{index+1}</span><div className="relative grid h-12 w-12 place-items-center rounded-xl bg-[#0b3764] text-white group-hover:bg-red-600"><Icon className="h-6 w-6"/></div><h3 className="relative mt-5 text-xl font-extrabold text-[#0b3764]">{title}</h3><p className="relative mt-3 leading-7 text-slate-600">{text}</p></article>)}</div></section>

  <section className="bg-[#0b3764] px-6 py-20 text-white"><div className="mx-auto max-w-7xl"><p className="text-center text-sm font-bold uppercase tracking-widest text-red-300">Implementation lifecycle</p><h2 className="mt-3 text-center font-heading text-4xl font-extrabold">From requirement to continual improvement</h2><div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{lifecycle.map(([number,title,text]) => <article key={number} className="rounded-2xl border border-white/10 bg-white/5 p-7"><span className="text-4xl font-black text-red-400">{number}</span><h3 className="mt-3 text-xl font-bold">{title}</h3><p className="mt-3 leading-7 text-white/65">{text}</p></article>)}</div></div></section>

  <section className="mx-auto max-w-7xl px-6 py-20"><div className="grid gap-12 lg:grid-cols-[.8fr_1.2fr]"><div><ClipboardCheck className="h-12 w-12 text-red-600"/><h2 className="mt-5 font-heading text-4xl font-extrabold text-[#0b3764]">Essential control set</h2><p className="mt-5 leading-8 text-slate-600">A strong standards system makes expectations visible, assigns ownership, and produces evidence. These controls provide a practical starting point.</p><Link to="/library" className="mt-7 inline-flex items-center gap-2 rounded bg-[#0b3764] px-5 py-3 font-bold text-white">Open templates and tools<ArrowRight className="h-4 w-4"/></Link></div><div className="grid gap-4 sm:grid-cols-2">{controls.map(([title,text]) => <article key={title} className="rounded-xl border bg-slate-50 p-5"><FileSearch className="h-6 w-6 text-red-600"/><h3 className="mt-3 font-bold text-[#0b3764]">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{text}</p></article>)}</div></div></section>

  <section className="bg-slate-50 px-6 py-20"><div className="mx-auto max-w-7xl"><div className="text-center"><Gauge className="mx-auto h-12 w-12 text-red-600"/><h2 className="mt-4 font-heading text-4xl font-extrabold text-[#0b3764]">Standards maturity model</h2><p className="mx-auto mt-4 max-w-2xl text-slate-600">Assess current capability and define a realistic improvement target.</p></div><div className="mt-12 grid gap-4 lg:grid-cols-5">{maturity.map(([level,title,text]) => <article key={level} className="rounded-2xl border bg-white p-6 shadow-sm"><span className="grid h-10 w-10 place-items-center rounded-full bg-red-600 text-lg font-black text-white">{level}</span><h3 className="mt-4 text-lg font-bold text-[#0b3764]">{title}</h3><p className="mt-3 text-sm leading-6 text-slate-600">{text}</p></article>)}</div></div></section>

  <section className="mx-auto grid max-w-7xl gap-8 px-6 py-20 lg:grid-cols-2"><article className="rounded-3xl bg-red-50 p-8"><Users className="h-11 w-11 text-red-600"/><h2 className="mt-5 font-heading text-3xl font-extrabold text-[#0b3764]">Roles and accountability</h2><div className="mt-6 space-y-4">{[["Governing body","Sets direction, appetite, authority, and oversight."],["Sponsor or executive owner","Owns the business outcome and critical decisions."],["Project and contract leaders","Implement controls, coordinate delivery, and escalate exceptions."],["Assurance functions","Provide independent review and track corrective action."],["Team members","Follow requirements, maintain records, and raise concerns promptly."]].map(([role,text]) => <div key={role}><h3 className="font-bold text-[#0b3764]">{role}</h3><p className="mt-1 text-sm leading-6 text-slate-600">{text}</p></div>)}</div></article><article className="rounded-3xl border p-8"><BookOpenCheck className="h-11 w-11 text-red-600"/><h2 className="mt-5 font-heading text-3xl font-extrabold text-[#0b3764]">Using external standards</h2><p className="mt-4 leading-8 text-slate-600">Organisations may also adopt relevant international, national, industry, client, and regulatory standards. Maintain an obligations register showing what applies, why it applies, the responsible owner, implementation evidence, review date, and any approved deviation.</p><div className="mt-6 rounded-xl bg-slate-50 p-5"><p className="font-bold text-[#0b3764]">Important</p><p className="mt-2 text-sm leading-6 text-slate-600">This page provides professional-practice guidance. It does not reproduce or replace copyrighted standards, laws, regulations, contract terms, or specialist legal advice.</p></div></article></section>

  <section className="bg-slate-50 px-6 py-20"><div className="mx-auto max-w-4xl"><h2 className="text-center font-heading text-4xl font-extrabold text-[#0b3764]">Standards FAQs</h2><div className="mt-10 space-y-4">{faqs.map(([question,answer]) => <details key={question} className="group rounded-xl border bg-white shadow-sm"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 font-bold text-[#0b3764]">{question}<ChevronDown className="h-5 w-5 transition group-open:rotate-180"/></summary><p className="border-t px-5 py-5 leading-7 text-slate-600">{answer}</p></details>)}</div></div></section>

  <section className="bg-red-600 px-6 py-16 text-center text-white"><h2 className="font-heading text-4xl font-extrabold">Turn standards into daily practice</h2><p className="mx-auto mt-4 max-w-2xl text-white/75">Use PCMO learning, templates, publications, and professional community resources to strengthen implementation.</p><div className="mt-7 flex flex-wrap justify-center gap-3"><Link to="/pages/resources" className="rounded bg-white px-6 py-3 font-bold text-red-600">Explore resources</Link><Link to="/pages/certifications" className="rounded border border-white/40 px-6 py-3 font-bold">View certifications</Link></div></section>
</main><PublicFooter/></div>;

export default StandardsHub;
