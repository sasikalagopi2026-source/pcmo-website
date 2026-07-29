import { ArrowRight, Award, BarChart3, BookOpen, BrainCircuit, BriefcaseBusiness, CheckCircle2, ChevronDown, ClipboardCheck, Clock3, FileCheck2, GraduationCap, Lightbulb, Network, PlayCircle, ShieldCheck, Target, Users, Video } from "lucide-react";
import { Link } from "react-router-dom";
import PublicFooter from "@/components/PublicFooter";
import PublicNavigation from "@/components/PublicNavigation";

const pathways = [
  [GraduationCap, "Foundation", "Build core language, concepts, lifecycle awareness, professional behaviours, and confidence for project and contract environments."],
  [Target, "Project Management", "Develop capability across initiation, scope, planning, schedule, cost, risk, quality, stakeholders, delivery, and closeout."],
  [FileCheck2, "Contract Management", "Strengthen strategy, formation, negotiation, administration, obligations, variations, payment, claims, relationships, and closeout."],
  [BarChart3, "Project Controls", "Advance planning, scheduling, cost control, progress measurement, forecasting, change control, reporting, and performance insight."],
  [Users, "Leadership & Governance", "Improve sponsorship, decision-making, influence, ethics, team leadership, assurance, governance, and executive communication."],
  [BrainCircuit, "Digital & Emerging Practice", "Explore data, AI, automation, digital controls, sustainability, new delivery models, and responsible professional adaptation."],
] as const;

const formats = [
  [PlayCircle, "Self-paced courses", "Learn flexibly through structured modules, examples, activities, knowledge checks, and progress tracking."],
  [Video, "Live webinars", "Engage with experts, explore current topics, ask questions, and learn from professional discussion."],
  [Users, "Community learning", "Exchange perspectives, compare experience, solve practical problems, and learn through peer contribution."],
  [BriefcaseBusiness, "Case-based practice", "Apply concepts to realistic delivery, contract, stakeholder, risk, commercial, and governance situations."],
  [ClipboardCheck, "Assessments", "Check understanding, identify gaps, demonstrate required knowledge, and prepare for certification."],
  [BookOpen, "Publications & tools", "Use guides, templates, checklists, references, and member publications to support application at work."],
] as const;

const journey = [
  ["01", "Set the outcome", "Define the capability, responsibility, career goal, or workplace challenge your learning should support."],
  ["02", "Assess your starting point", "Identify existing knowledge, experience, confidence, evidence, gaps, and preferred learning methods."],
  ["03", "Choose a pathway", "Select suitable courses, resources, community activity, practice, assessment, and certification."],
  ["04", "Learn actively", "Take notes, ask questions, practise retrieval, compare examples, and connect ideas to real situations."],
  ["05", "Apply and evidence", "Use the learning in a safe context, seek feedback, measure results, and document professional evidence."],
  ["06", "Review and continue", "Reflect on progress, close remaining gaps, share lessons, and define the next development objective."],
] as const;

const competencies = [
  ["Technical knowledge", "Processes, tools, methods, terminology, standards, and subject-specific understanding."],
  ["Professional judgement", "Analysing context, uncertainty, trade-offs, ethics, consequences, and appropriate escalation."],
  ["Delivery application", "Using knowledge to plan, coordinate, control, decide, communicate, and improve outcomes."],
  ["Commercial awareness", "Understanding value, obligations, cost, risk allocation, suppliers, change, claims, and business impact."],
  ["Leadership behaviour", "Influence, listening, collaboration, accountability, inclusion, resilience, and constructive challenge."],
  ["Evidence and reflection", "Demonstrating outcomes, accepting feedback, learning from experience, and improving future practice."],
] as const;

const plan = [
  ["Weekly objective", "One clear capability or learning outcome to complete."],
  ["Focused sessions", "Short, scheduled periods with distractions removed."],
  ["Active recall", "Questions, summaries, flashcards, and practice without relying on notes."],
  ["Practical connection", "A current or past work situation where the concept applies."],
  ["Feedback", "A peer, mentor, manager, instructor, or assessment result that tests understanding."],
  ["Learning record", "What was learned, applied, evidenced, and selected for the next cycle."],
] as const;

const faqs = [
  ["Where should a new learner start?", "Begin with a foundation or introductory pathway relevant to your goal. Review the course description, expected level, learning outcomes, and any prerequisites before enrolling."],
  ["Can I learn at my own pace?", "Self-paced courses and resources can normally be completed flexibly, while webinars, events, cohorts, and assessments may have scheduled dates or access periods."],
  ["How is course progress tracked?", "Signed-in learners can use their dashboard and course pages to review enrolment, module progress, completed activities, assessment access, and available certificates."],
  ["Does completing a course automatically provide certification?", "Not always. A course may provide learning completion, assessment preparation, or a certification pathway. Review the programme requirements for assessment, pass marks, evidence, and credential issue."],
  ["How can I apply learning at work?", "Choose a suitable real task, confirm authority and risk, apply the method proportionately, seek feedback, record the result, and reflect on what should change next time."],
  ["What if I do not pass an assessment?", "Use the result to identify gaps, review the relevant content, practise actively, and follow the programme rules for feedback, waiting periods, and reassessment."],
  ["Are free learning resources available?", "Yes. Free members can access published Library resources marked for free membership. Course, publication, event, and certification access may vary by membership or enrolment."],
] as const;

const LearningHub = () => <div className="min-h-screen bg-white text-slate-800"><PublicNavigation active="resources"/><main>
  <section className="relative overflow-hidden bg-[#071f3b] px-6 py-24 text-white"><div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(220,38,38,.27),transparent_35%)]"/><div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.1fr_.9fr] lg:items-center"><div><p className="text-sm font-bold uppercase tracking-[.22em] text-red-300">Learn. Apply. Demonstrate. Grow.</p><h1 className="mt-4 font-heading text-6xl font-extrabold">Professional learning for projects and contracts</h1><p className="mt-6 max-w-3xl text-lg leading-8 text-white/70">Build practical knowledge, professional judgement, workplace capability, and evidence through structured pathways designed for continuous development.</p><div className="mt-8 flex flex-wrap gap-3"><Link to="/courses" className="rounded bg-red-600 px-6 py-3 font-bold">Browse courses</Link><a href="#pathways" className="rounded border border-white/25 px-6 py-3 font-bold">Explore pathways</a></div></div><div className="rounded-3xl border border-white/15 bg-white/5 p-9 backdrop-blur"><Lightbulb className="h-14 w-14 text-red-400"/><h2 className="mt-5 text-2xl font-bold">Learning that transfers to practice</h2><p className="mt-4 leading-7 text-white/65">Knowledge becomes professional capability when it is understood, practised, applied responsibly, evidenced, reviewed, and improved.</p><div className="mt-6 grid grid-cols-2 gap-3">{["Understand","Practise","Apply","Reflect"].map(item => <span key={item} className="rounded-lg bg-white/10 p-3 text-center text-sm font-bold">{item}</span>)}</div></div></div></section>

  <section id="pathways" className="mx-auto max-w-7xl px-6 py-20"><div className="text-center"><GraduationCap className="mx-auto h-12 w-12 text-red-600"/><h2 className="mt-4 font-heading text-4xl font-extrabold text-[#0b3764]">Learning pathways</h2><p className="mx-auto mt-4 max-w-3xl leading-7 text-slate-600">Choose a pathway based on the capability you need now, then connect it with practical application and longer-term career direction.</p></div><div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">{pathways.map(([Icon,title,text],index) => <article key={title} className="group relative overflow-hidden rounded-2xl border p-7 shadow-sm transition hover:-translate-y-2 hover:border-red-300 hover:shadow-xl"><span className="absolute right-5 top-3 text-6xl font-black text-slate-50">0{index+1}</span><div className="relative grid h-12 w-12 place-items-center rounded-xl bg-[#0b3764] text-white group-hover:bg-red-600"><Icon className="h-6 w-6"/></div><h3 className="relative mt-5 text-xl font-extrabold text-[#0b3764]">{title}</h3><p className="relative mt-3 leading-7 text-slate-600">{text}</p></article>)}</div></section>

  <section className="bg-slate-50 px-6 py-20"><div className="mx-auto max-w-7xl"><p className="text-center text-sm font-bold uppercase tracking-widest text-red-600">Flexible learning ecosystem</p><h2 className="mt-3 text-center font-heading text-4xl font-extrabold text-[#0b3764]">Learn in different ways</h2><div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">{formats.map(([Icon,title,text]) => <article key={title} className="rounded-2xl bg-white p-7 shadow-sm"><Icon className="h-10 w-10 text-red-600"/><h3 className="mt-5 text-xl font-bold text-[#0b3764]">{title}</h3><p className="mt-3 leading-7 text-slate-600">{text}</p></article>)}</div><div className="mt-9 flex flex-wrap justify-center gap-3"><Link to="/library" className="rounded bg-[#0b3764] px-6 py-3 font-bold text-white">Open Library</Link><Link to="/pages/webinars" className="rounded border border-[#0b3764] px-6 py-3 font-bold text-[#0b3764]">Explore webinars</Link></div></div></section>

  <section className="bg-[#0b3764] px-6 py-20 text-white"><div className="mx-auto max-w-7xl"><p className="text-center text-sm font-bold uppercase tracking-widest text-red-300">Learning journey</p><h2 className="mt-3 text-center font-heading text-4xl font-extrabold">A cycle of purposeful development</h2><div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{journey.map(([number,title,text]) => <article key={number} className="rounded-2xl border border-white/10 bg-white/5 p-7"><span className="text-4xl font-black text-red-400">{number}</span><h3 className="mt-3 text-xl font-bold">{title}</h3><p className="mt-3 leading-7 text-white/65">{text}</p></article>)}</div></div></section>

  <section className="mx-auto max-w-7xl px-6 py-20"><div className="grid gap-12 lg:grid-cols-[.75fr_1.25fr]"><div><BrainCircuit className="h-12 w-12 text-red-600"/><h2 className="mt-5 font-heading text-4xl font-extrabold text-[#0b3764]">Capability, not completion alone</h2><p className="mt-5 leading-8 text-slate-600">A completed module is a milestone. Professional development also requires judgement, application, behaviour, evidence, and reflection.</p><Link to="/pages/career_resources" className="mt-7 inline-flex items-center gap-2 rounded bg-[#0b3764] px-5 py-3 font-bold text-white">Connect learning to your career<ArrowRight className="h-4 w-4"/></Link></div><div className="grid gap-4 sm:grid-cols-2">{competencies.map(([title,text]) => <article key={title} className="rounded-xl border bg-slate-50 p-5"><CheckCircle2 className="h-6 w-6 text-emerald-600"/><h3 className="mt-3 font-bold text-[#0b3764]">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{text}</p></article>)}</div></div></section>

  <section className="bg-red-50 px-6 py-20"><div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-2"><article className="rounded-3xl bg-white p-8 shadow-sm"><Clock3 className="h-11 w-11 text-red-600"/><h2 className="mt-5 font-heading text-3xl font-extrabold text-[#0b3764]">Weekly learning plan</h2><div className="mt-6 space-y-4">{plan.map(([title,text]) => <div key={title}><h3 className="font-bold text-[#0b3764]">{title}</h3><p className="mt-1 text-sm leading-6 text-slate-600">{text}</p></div>)}</div></article><article className="rounded-3xl bg-[#071f3b] p-8 text-white"><Award className="h-11 w-11 text-red-400"/><h2 className="mt-5 font-heading text-3xl font-extrabold">Assessment and certification</h2><p className="mt-4 leading-8 text-white/65">Assessments help confirm understanding and identify gaps. Certification may require specified learning, assessment performance, evidence, conduct, and other programme requirements.</p><div className="mt-6 space-y-3">{["Review the syllabus and handbook", "Practise active recall and application", "Confirm assessment rules and technology", "Protect academic and professional integrity", "Use feedback to plan further development"].map(item => <p key={item} className="flex gap-3"><ShieldCheck className="h-5 w-5 shrink-0 text-red-400"/>{item}</p>)}</div><Link to="/pages/certifications" className="mt-7 inline-flex rounded bg-red-600 px-5 py-3 font-bold">Explore certification pathways</Link></article></div></section>

  <section className="mx-auto max-w-7xl px-6 py-20"><div className="grid gap-7 md:grid-cols-3">{[[Network,"Learn with the community","Ask questions, compare approaches, explain concepts, and learn from the experience of other professionals."],[ClipboardCheck,"Track your progress","Use your dashboard, learning record, assessments, feedback, and workplace evidence to monitor development."],[BookOpen,"Use trusted resources","Combine course content with standards, publications, templates, webinars, and properly evaluated external sources."]].map(([Icon,title,text]) => { const CardIcon=Icon as typeof Network; return <article key={String(title)} className="rounded-2xl border p-7 shadow-sm"><CardIcon className="h-10 w-10 text-red-600"/><h2 className="mt-5 text-xl font-bold text-[#0b3764]">{String(title)}</h2><p className="mt-3 leading-7 text-slate-600">{String(text)}</p></article>})}</div></section>

  <section className="bg-slate-50 px-6 py-20"><div className="mx-auto max-w-4xl"><h2 className="text-center font-heading text-4xl font-extrabold text-[#0b3764]">Learning FAQs</h2><div className="mt-10 space-y-4">{faqs.map(([question,answer]) => <details key={question} className="group rounded-xl border bg-white shadow-sm"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 font-bold text-[#0b3764]">{question}<ChevronDown className="h-5 w-5 transition group-open:rotate-180"/></summary><p className="border-t px-5 py-5 leading-7 text-slate-600">{answer}</p></details>)}</div></div></section>

  <section className="bg-red-600 px-6 py-16 text-center text-white"><h2 className="font-heading text-4xl font-extrabold">Start your next learning goal</h2><p className="mx-auto mt-4 max-w-2xl text-white/75">Choose a pathway, make time for focused learning, apply it responsibly, and build evidence of professional growth.</p><div className="mt-7 flex flex-wrap justify-center gap-3"><Link to="/courses" className="rounded bg-white px-6 py-3 font-bold text-red-600">Browse courses</Link><Link to="/pages/membership_packages" className="rounded border border-white/40 px-6 py-3 font-bold">Explore membership</Link></div></section>
</main><PublicFooter/></div>;

export default LearningHub;
