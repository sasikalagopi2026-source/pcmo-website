import { ArrowRight, Award, BookOpen, CheckCircle2, ChevronDown, ClipboardCheck, FileText, Lightbulb, ShieldCheck, Target, Users } from "lucide-react";
import { Link } from "react-router-dom";
import PublicFooter from "@/components/PublicFooter";
import PublicNavigation from "@/components/PublicNavigation";

const projectCertifications = [
  ["APMC", "apmc"], ["Project Management Essentials", "project_management_essentials"], ["Introduction to Project Management", "introduction_project_management"],
  ["Project Management Fundamentals", "project_management_fundamentals"], ["Agile Project Management", "agile_project_management"], ["Advanced Project Management", "advanced_project_management"],
  ["Strategic Project Management", "strategic_project_management"], ["CPM Preparation", "cpm_preparation"], ["Program Management", "program_management"], ["PMO Implementation", "pmo_implementation"],
] as const;

const contractCertifications = [
  ["Project Management Leadership", "project_management_leadership"], ["Introduction to Contract Management", "introduction_contract_management"], ["Contract Administration Fundamentals", "contract_administration_fundamentals"],
  ["Contract Negotiation Skills", "contract_negotiation_skills"], ["Advanced Contract Management", "advanced_contract_management"], ["Legal Aspects of Contract Management", "legal_aspects_contract_management"],
  ["Relationship Management in Contracts", "relationship_management_contracts"], ["Strategic Contract Management", "strategic_contract_management"], ["Contract Ethics & Compliance", "contract_ethics_compliance"],
  ["International Contract Management", "international_contract_management"],
] as const;

const benefits = [
  [Award, "Professional recognition", "Demonstrate structured knowledge and commitment to project or contract management practice."],
  [Target, "Career progression", "Strengthen your professional profile and support conversations about new responsibilities and roles."],
  [Lightbulb, "Practical capability", "Apply useful frameworks, tools, controls, and decision-making approaches in real work."],
  [Users, "Community connection", "Learn alongside professionals and participate in PCMO knowledge-sharing opportunities."],
] as const;

const journey = [
  ["01", "Explore", "Compare certification pathways and select the level and subject that match your goals."],
  ["02", "Prepare", "Review requirements, read the handbook, enrol, and follow the recommended learning plan."],
  ["03", "Learn", "Complete course modules, practical activities, revision, and any required experience evidence."],
  ["04", "Assess", "Complete the applicable assessment under the stated rules and achieve the required pass mark."],
  ["05", "Certify", "Receive your PCMO credential when all programme requirements have been successfully verified."],
  ["06", "Maintain", "Keep your profile current and follow any continuing-development or renewal requirements."],
] as const;

const faqs = [
  ["Which certification should I choose?", "Start with your current role, experience, and career goal. Introductory and fundamentals programmes suit newer practitioners, while advanced, strategic, programme, PMO, legal, and international pathways suit more specialised development."],
  ["Do I need to be a PCMO member?", "Membership and enrolment requirements can differ by programme. Open the certification page you are interested in and review its current eligibility and access information."],
  ["Are certifications completed online?", "Learning and assessments may be delivered online through your PCMO account. Check the individual programme page for the current delivery method and any scheduled requirements."],
  ["How long does certification take?", "Duration depends on the programme, your study pace, assessment schedule, and any evidence requirements. Build a realistic plan from the published syllabus and handbook."],
  ["What happens if I do not pass?", "The programme rules explain feedback, waiting periods, and reassessment options. Review the handbook before attempting an assessment."],
  ["How do I validate a certificate?", "Use the Validate Certificate page and enter the requested credential details to check the certificate record."],
  ["Can I download my certificate?", "Issued certificates available to your account can be viewed and downloaded from My Certifications in the member dashboard."],
  ["Where can I get help?", "Use the Contact page for programme, enrolment, assessment, or technical support. Include the programme name and your account email, but never send your password."],
] as const;

const CertificationHub = () => <div className="min-h-screen bg-white text-slate-800">
  <PublicNavigation active="certifications" />
  <main>
    <section className="relative overflow-hidden bg-[#071f3b] px-6 py-24 text-white"><div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(220,38,38,.25),transparent_35%)]"/><div className="relative mx-auto max-w-7xl"><p className="text-sm font-bold uppercase tracking-[.22em] text-red-400">PCMO professional credentials</p><h1 className="mt-4 max-w-4xl font-heading text-5xl font-extrabold md:text-6xl">Project & Contract Management Certifications</h1><p className="mt-6 max-w-3xl text-lg leading-8 text-white/70">Choose a structured pathway to develop practical capability, validate your knowledge, and demonstrate professional commitment.</p><div className="mt-8 flex flex-wrap gap-3"><a href="#certifications" className="rounded bg-red-600 px-6 py-3 font-bold">Explore certifications</a><Link to="/pages/validate_certificate" className="rounded border border-white/25 px-6 py-3 font-bold">Validate a certificate</Link></div></div></section>

    <section id="certifications" className="mx-auto max-w-7xl px-6 py-20"><div className="text-center"><p className="text-sm font-bold uppercase tracking-widest text-red-600">Certification catalogue</p><h2 className="mt-3 font-heading text-4xl font-extrabold text-[#0b3764]">Find your professional pathway</h2></div><div className="mt-12 grid gap-8 lg:grid-cols-2">{[["Project Management Certifications", projectCertifications, Target], ["Contract Management Certifications", contractCertifications, FileText]].map(([title, items, Icon]) => { const SectionIcon = Icon as typeof Target; return <section key={String(title)} className="rounded-2xl border border-slate-200 bg-slate-50 p-7"><SectionIcon className="h-10 w-10 text-red-600"/><h3 className="mt-4 text-2xl font-extrabold text-[#0b3764]">{String(title)}</h3><div className="mt-6 grid gap-3 sm:grid-cols-2">{(items as typeof projectCertifications).map(([name, slug]) => <Link key={slug} to={`/pages/${slug}`} className="group flex items-center justify-between rounded-xl border bg-white p-4 text-sm font-bold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-red-300 hover:text-red-600">{name}<ArrowRight className="h-4 w-4 transition group-hover:translate-x-1"/></Link>)}</div></section>})}</div></section>

    <section className="bg-slate-50 px-6 py-20"><div className="mx-auto max-w-7xl"><h2 className="text-center font-heading text-4xl font-extrabold text-[#0b3764]">Benefits of PCMO certification</h2><div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">{benefits.map(([Icon,title,text]) => <article key={title} className="rounded-2xl bg-white p-7 shadow-sm"><Icon className="h-10 w-10 text-red-600"/><h3 className="mt-5 text-xl font-bold text-[#0b3764]">{title}</h3><p className="mt-3 leading-7 text-slate-600">{text}</p></article>)}</div></div></section>

    <section className="bg-[#0b3764] px-6 py-20 text-white"><div className="mx-auto max-w-7xl"><p className="text-center text-sm font-bold uppercase tracking-widest text-red-300">Certification journey</p><h2 className="mt-3 text-center font-heading text-4xl font-extrabold">From exploration to certification</h2><div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{journey.map(([number,title,text]) => <article key={number} className="rounded-2xl border border-white/10 bg-white/5 p-7"><span className="text-3xl font-black text-red-400">{number}</span><h3 className="mt-3 text-xl font-bold">{title}</h3><p className="mt-3 leading-7 text-white/65">{text}</p></article>)}</div></div></section>

    <section className="mx-auto grid max-w-7xl gap-8 px-6 py-20 lg:grid-cols-2"><article className="rounded-3xl border border-slate-200 p-8"><BookOpen className="h-11 w-11 text-red-600"/><h2 className="mt-5 font-heading text-3xl font-extrabold text-[#0b3764]">Certification Handbook</h2><p className="mt-4 leading-8 text-slate-600">Before enrolling or taking an assessment, review the programme handbook for eligibility, syllabus, assessment rules, pass requirements, conduct, reassessment, certificate use, and renewal guidance.</p><div className="mt-6 space-y-3">{["Programme requirements and syllabus", "Assessment and candidate conduct", "Results, reassessment, and appeals", "Credential use and maintenance"].map(item => <p key={item} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600"/>{item}</p>)}</div><Link to="/contact" className="mt-7 inline-flex items-center gap-2 rounded bg-[#0b3764] px-5 py-3 font-bold text-white">Request the current handbook<ArrowRight className="h-4 w-4"/></Link></article><article className="rounded-3xl bg-red-50 p-8"><ClipboardCheck className="h-11 w-11 text-red-600"/><h2 className="mt-5 font-heading text-3xl font-extrabold text-[#0b3764]">General preparation tips</h2><ul className="mt-6 space-y-4 text-slate-700">{["Read the programme requirements before enrolling.", "Create a weekly study plan with clear milestones.", "Connect concepts to real project and contract scenarios.", "Use practice questions to identify knowledge gaps.", "Review terminology, processes, ethics, and professional judgement.", "Confirm technical requirements before an online assessment.", "Rest well and manage your assessment time carefully."].map(item => <li key={item} className="flex gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-red-600"/>{item}</li>)}</ul></article></section>

    <section className="bg-slate-50 px-6 py-20"><div className="mx-auto max-w-4xl"><h2 className="text-center font-heading text-4xl font-extrabold text-[#0b3764]">Certification FAQs</h2><div className="mt-10 space-y-4">{faqs.map(([question,answer]) => <details key={question} className="group rounded-xl border bg-white shadow-sm"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 font-bold text-[#0b3764]">{question}<ChevronDown className="h-5 w-5 transition group-open:rotate-180"/></summary><p className="border-t px-5 py-5 leading-7 text-slate-600">{answer}</p></details>)}</div></div></section>
  </main>
  <PublicFooter />
</div>;

export default CertificationHub;
