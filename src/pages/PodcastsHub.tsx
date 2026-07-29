import { useRef, useState } from "react";
import { ArrowRight, AudioLines, BookOpen, BriefcaseBusiness, CheckCircle2, ChevronDown, Clock3, Download, FileText, Headphones, Lightbulb, MessageCircle, Mic2, Network, Pause, Play, Radio, Scale, ShieldCheck, Sparkles, Target, Users, Volume2 } from "lucide-react";
import { Link } from "react-router-dom";
import PublicFooter from "@/components/PublicFooter";
import PublicNavigation from "@/components/PublicNavigation";

const series = [
  [Target, "Project Delivery Conversations", "Planning, controls, leadership, recovery, governance, and lessons from complex delivery environments."],
  [Scale, "Contracts in Practice", "Strategy, negotiation, administration, notices, change, claims, relationships, ethics, and closeout."],
  [BriefcaseBusiness, "Career Journeys", "Professional pathways, pivotal assignments, capability development, setbacks, mentoring, and leadership growth."],
  [Lightbulb, "Future Practice", "AI, data, automation, sustainability, new delivery models, emerging risks, and responsible innovation."],
  [Users, "Community Voices", "Perspectives from members, students, volunteers, educators, specialists, and professional communities."],
  [ShieldCheck, "Governance & Assurance", "Decision quality, risk, ethics, audit, sponsorship, control effectiveness, and organisational learning."],
] as const;

const episodes = [
  ["Featured conversation", "Why reliable forecasts require honest professional judgement", "Project Controls", "A useful forecast does more than repeat a date. It explains progress evidence, remaining work, assumptions, uncertainty, dependencies, risk exposure, corrective action, and confidence. Leaders should ask what changed, what evidence supports the forecast, which assumptions are most sensitive, and what decision is required now. Forecast integrity depends on a culture where professionals can report difficult facts early.", "episode-01-forecast-judgement"],
  ["Contracts in practice", "Notices, records, and the discipline of protecting contractual position", "Contract Management", "Effective administration begins with understanding the contract, assigning obligations, monitoring time limits, and communicating clearly. A notice should identify the event, relevant facts, contractual basis, known effect, required response, and supporting evidence. Good records are created during delivery, not reconstructed after disagreement begins.", "episode-02-contract-records"],
  ["Leadership briefing", "How sponsors create clarity before delivery pressure increases", "Governance", "Strong sponsorship connects the business outcome with authority, priorities, risk appetite, resources, governance, and timely decisions. Sponsors should define what success means, confirm who can decide, establish tolerances, remove organisational barriers, and challenge unreliable optimism.", "episode-03-sponsor-clarity"],
  ["Future practice", "Responsible AI for project and contract decisions", "Digital Practice", "Artificial intelligence can support analysis, drafting, classification, forecasting, and knowledge retrieval, but professional accountability remains human. Teams need approved use cases, protected data, validated outputs, clear limitations, traceable records, bias awareness, and escalation for high impact decisions.", "episode-04-responsible-ai"],
  ["Career journey", "From project coordinator to programme leader", "Professional Growth", "Career progress is built through reliable delivery, curiosity, feedback, broader responsibility, and evidence of outcomes. Early roles develop coordination and control discipline. Later roles require integration, judgement, stakeholder influence, governance, commercial awareness, and leadership across uncertainty.", "episode-05-career-journey"],
  ["Case reflection", "What recovery teams learn when the baseline is no longer credible", "Delivery Recovery", "Recovery starts by separating facts from assumptions, confirming actual progress, identifying uncontrolled changes, reviewing remaining scope, validating productivity, and rebuilding forecast logic. The purpose is not to create a more attractive date. It is to restore a decision useful control system.", "episode-06-baseline-recovery"],
] as const;

const EpisodeCard = ({ episode, index }: { episode: typeof episodes[number]; index: number }) => {
  const [playing, setPlaying] = useState(false);
  const utterance = useRef<SpeechSynthesisUtterance | null>(null);
  const toggle = async () => {
    if (!("speechSynthesis" in window)) return;
    if (playing) { window.speechSynthesis.pause(); setPlaying(false); return; }
    if (utterance.current && window.speechSynthesis.paused) { window.speechSynthesis.resume(); setPlaying(true); return; }
    window.speechSynthesis.cancel();
    const speech = new SpeechSynthesisUtterance(`${episode[1]}. ${episode[3]}`);
    speech.rate = 0.92; speech.pitch = 1; speech.onend = () => setPlaying(false); speech.onerror = () => setPlaying(false);
    utterance.current = speech; window.speechSynthesis.speak(speech); setPlaying(true);
  };
  return <article className="group flex flex-col gap-5 rounded-2xl border bg-white p-6 shadow-sm sm:flex-row sm:items-center"><button type="button" onClick={() => void toggle()} aria-label={`${playing ? "Pause" : "Play"} ${episode[1]}`} className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-[#0b3764] text-white transition group-hover:bg-red-600">{playing ? <Pause className="h-8 w-8 fill-current"/> : <Play className="ml-1 h-8 w-8 fill-current"/>}</button><div className="min-w-0 flex-1"><div className="flex flex-wrap gap-2 text-xs font-bold uppercase tracking-wider text-red-600"><span>{episode[0]}</span><span className="text-slate-300">•</span><span>{episode[2]}</span></div><h3 className="mt-2 text-xl font-extrabold leading-7 text-[#0b3764]">{episode[1]}</h3><p className="mt-2 flex items-center gap-1 text-xs text-slate-500"><Clock3 className="h-3.5 w-3.5"/>{playing ? "Playing browser narration" : "Playable audio preview"} · Episode {String(index+1).padStart(2,"0")}</p><div className="mt-4 flex flex-wrap gap-2"><a href={`/podcast-transcripts/${episode[4]}.docx`} download className="inline-flex items-center gap-1.5 rounded-lg border border-[#0b3764]/20 px-3 py-2 text-xs font-bold text-[#0b3764] transition hover:bg-[#0b3764] hover:text-white"><FileText className="h-4 w-4"/>Word transcript<Download className="h-3.5 w-3.5"/></a><a href={`/podcast-transcripts/${episode[4]}.pdf`} download className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-red-700"><FileText className="h-4 w-4"/>PDF transcript<Download className="h-3.5 w-3.5"/></a></div></div></article>;
};

const formats = [
  [Mic2, "Expert interviews", "Focused conversations with practitioners and specialists who can explain context, decisions, trade-offs, and lessons."],
  [MessageCircle, "Panel discussions", "Multiple perspectives on important questions, contested practices, and changing professional expectations."],
  [AudioLines, "Practice briefings", "Concise episodes that explain a control, method, professional issue, or useful management framework."],
  [Radio, "Case reflections", "Carefully framed delivery and contract experiences that protect confidentiality while preserving practical value."],
] as const;

const listen = [
  ["01", "Choose a question", "Select an episode that supports a current responsibility, decision, capability gap, or career goal."],
  ["02", "Listen actively", "Capture key claims, examples, assumptions, questions, and points you want to test further."],
  ["03", "Check the context", "Consider the sector, contract, scale, risk, law, culture, and limitations behind the speaker's experience."],
  ["04", "Explore further", "Use related standards, research, courses, publications, and professional advice where appropriate."],
  ["05", "Apply carefully", "Adapt the insight proportionately rather than copying a practice without evaluating your environment."],
  ["06", "Share and reflect", "Discuss the idea, compare experience, record learning, and identify what changed in your thinking or action."],
] as const;

const standards = [
  ["Professional relevance", "Episodes address meaningful project, contract, commercial, career, leadership, or community questions."],
  ["Speaker credibility", "Guests are selected for relevant responsibility, knowledge, experience, research, or professional contribution."],
  ["Transparent perspective", "Experience, opinion, evidence, sponsorship, uncertainty, and limitations should be distinguishable."],
  ["Confidentiality", "Protected, personal, privileged, client-sensitive, and commercially restricted information must not be disclosed."],
  ["Respectful discussion", "Conversations welcome informed challenge while avoiding discrimination, harassment, defamation, and personal attacks."],
  ["Responsible use", "Podcast content supports learning and discussion; it does not replace contracts, law, standards, or specialist advice."],
] as const;

const faqs = [
  ["Where can I listen to PCMO podcast episodes?", "Published episodes and related media will appear through the PCMO podcast, Library, webinar, or resource areas. Availability may vary by episode and membership access."],
  ["Are podcast episodes free?", "Some episodes and extracts may be available to free members, while selected recordings, transcripts, or companion resources may require an active membership or enrolment."],
  ["Can I suggest a topic or guest?", "Yes. Contact PCMO with the proposed question, why it matters to the community, the intended audience, suggested guest credentials, and any timing considerations."],
  ["How can I become a podcast guest?", "Submit a concise proposal describing your expertise, practical contribution, evidence or experience, potential discussion themes, and any conflicts, client restrictions, or commercial interests."],
  ["Are transcripts or learning notes available?", "Where produced, transcripts, summaries, references, and companion resources may be linked with the episode or published in the Library."],
  ["Can podcast content be quoted or reused?", "Use short attributed references where permitted and link to the original episode. Contact PCMO before substantial reproduction, commercial reuse, editing, rebroadcasting, or creating derivative materials."],
] as const;

const PodcastsHub = () => <div className="min-h-screen bg-white text-slate-800"><PublicNavigation active="resources"/><main>
  <section className="relative overflow-hidden bg-[#071f3b] px-6 py-24 text-white"><div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_22%,rgba(220,38,38,.28),transparent_34%)]"/><div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.05fr_.95fr] lg:items-center"><div><p className="text-sm font-bold uppercase tracking-[.22em] text-red-300">PCMO Podcasts</p><h1 className="mt-4 font-heading text-6xl font-extrabold">Listen to experience. Question assumptions. Improve practice.</h1><p className="mt-6 max-w-3xl text-lg leading-8 text-white/70">Professional conversations about project delivery, contracts, leadership, careers, governance, technology, and the lessons that shape better decisions.</p><div className="mt-8 flex flex-wrap gap-3"><a href="#episodes" className="inline-flex items-center gap-2 rounded bg-red-600 px-6 py-3 font-bold"><Play className="h-4 w-4 fill-current"/>Explore episodes</a><Link to="/contact" className="rounded border border-white/25 px-6 py-3 font-bold">Suggest a topic</Link></div></div><div className="relative rounded-full border-[28px] border-white/5 bg-white/5 p-14 text-center backdrop-blur"><Headphones className="mx-auto h-24 w-24 text-red-400"/><p className="mt-5 text-xl font-bold">Ideas for the journey</p><AudioLines className="mx-auto mt-5 h-12 w-44 text-white/35"/></div></div></section>

  <section className="mx-auto max-w-7xl px-6 py-20"><div className="text-center"><Sparkles className="mx-auto h-11 w-11 text-red-600"/><h2 className="mt-4 font-heading text-4xl font-extrabold text-[#0b3764]">Podcast series</h2><p className="mx-auto mt-4 max-w-3xl leading-7 text-slate-600">Follow a theme or combine episodes across disciplines to build a broader professional perspective.</p></div><div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">{series.map(([Icon,title,text],index) => <article key={title} className="group relative overflow-hidden rounded-2xl border p-7 shadow-sm transition hover:-translate-y-2 hover:border-red-300 hover:shadow-xl"><span className="absolute right-5 top-3 text-6xl font-black text-slate-50">0{index+1}</span><div className="relative grid h-12 w-12 place-items-center rounded-xl bg-[#0b3764] text-white group-hover:bg-red-600"><Icon className="h-6 w-6"/></div><h3 className="relative mt-5 text-xl font-extrabold text-[#0b3764]">{title}</h3><p className="relative mt-3 leading-7 text-slate-600">{text}</p></article>)}</div></section>

    <section id="episodes" className="bg-slate-50 px-6 py-20"><div className="mx-auto max-w-7xl"><div className="flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="text-sm font-bold uppercase tracking-widest text-red-600">Episode guide</p><h2 className="mt-3 font-heading text-4xl font-extrabold text-[#0b3764]">Conversations to explore</h2></div><Link to="/library" className="inline-flex items-center gap-2 font-bold text-red-600">Related resources<ArrowRight className="h-4 w-4"/></Link></div><div className="mt-10 grid gap-6 lg:grid-cols-2">{episodes.map((episode,index) => <EpisodeCard key={episode[1]} episode={episode} index={index}/>)}</div></div></section>

  <section className="bg-[#0b3764] px-6 py-20 text-white"><div className="mx-auto max-w-7xl"><p className="text-center text-sm font-bold uppercase tracking-widest text-red-300">Ways to listen</p><h2 className="mt-3 text-center font-heading text-4xl font-extrabold">Formats built around the question</h2><div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">{formats.map(([Icon,title,text]) => <article key={title} className="rounded-2xl border border-white/10 bg-white/5 p-7"><Icon className="h-9 w-9 text-red-400"/><h3 className="mt-5 text-xl font-bold">{title}</h3><p className="mt-3 leading-7 text-white/65">{text}</p></article>)}</div></div></section>

  <section className="mx-auto max-w-7xl px-6 py-20"><div className="text-center"><Volume2 className="mx-auto h-12 w-12 text-red-600"/><h2 className="mt-4 font-heading text-4xl font-extrabold text-[#0b3764]">Turn listening into learning</h2></div><div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{listen.map(([number,title,text]) => <article key={number} className="rounded-2xl border bg-slate-50 p-7"><span className="text-4xl font-black text-red-600">{number}</span><h3 className="mt-3 text-xl font-bold text-[#0b3764]">{title}</h3><p className="mt-3 leading-7 text-slate-600">{text}</p></article>)}</div></section>

  <section className="bg-red-50 px-6 py-20"><div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[.8fr_1.2fr]"><div><ShieldCheck className="h-12 w-12 text-red-600"/><h2 className="mt-5 font-heading text-4xl font-extrabold text-[#0b3764]">Editorial and production standards</h2><p className="mt-5 leading-8 text-slate-600">PCMO podcast content should be credible, professionally relevant, responsibly produced, and clear about context and limitations.</p><Link to="/pages/standards" className="mt-7 inline-flex items-center gap-2 rounded bg-[#0b3764] px-5 py-3 font-bold text-white">View PCMO standards<ArrowRight className="h-4 w-4"/></Link></div><div className="grid gap-4 sm:grid-cols-2">{standards.map(([title,text]) => <article key={title} className="rounded-xl bg-white p-5 shadow-sm"><CheckCircle2 className="h-6 w-6 text-emerald-600"/><h3 className="mt-3 font-bold text-[#0b3764]">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{text}</p></article>)}</div></div></section>

  <section className="mx-auto grid max-w-7xl gap-8 px-6 py-20 lg:grid-cols-2"><article className="rounded-3xl border p-8"><Mic2 className="h-11 w-11 text-red-600"/><h2 className="mt-5 font-heading text-3xl font-extrabold text-[#0b3764]">Become a guest</h2><p className="mt-4 leading-8 text-slate-600">Propose a useful professional question, explain your relevant experience or research, identify practical value for listeners, and disclose conflicts, sponsorship, confidentiality, or commercial interests.</p><Link to="/contact" className="mt-7 inline-flex rounded bg-[#0b3764] px-5 py-3 font-bold text-white">Propose an episode</Link></article><article className="rounded-3xl bg-[#071f3b] p-8 text-white"><Network className="h-11 w-11 text-red-400"/><h2 className="mt-5 font-heading text-3xl font-extrabold">Continue the conversation</h2><p className="mt-4 leading-8 text-white/65">Use community spaces to discuss the episode, compare contexts, challenge ideas constructively, and share relevant lessons without disclosing restricted information.</p><Link to="/pages/join_the_conversation" className="mt-7 inline-flex rounded bg-red-600 px-5 py-3 font-bold">Join the conversation</Link></article></section>

  <section className="bg-slate-50 px-6 py-20"><div className="mx-auto max-w-4xl"><h2 className="text-center font-heading text-4xl font-extrabold text-[#0b3764]">Podcast FAQs</h2><div className="mt-10 space-y-4">{faqs.map(([question,answer]) => <details key={question} className="group rounded-xl border bg-white shadow-sm"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 font-bold text-[#0b3764]">{question}<ChevronDown className="h-5 w-5 transition group-open:rotate-180"/></summary><p className="border-t px-5 py-5 leading-7 text-slate-600">{answer}</p></details>)}</div></div></section>

  <section className="bg-red-600 px-6 py-16 text-center text-white"><Headphones className="mx-auto h-11 w-11"/><h2 className="mt-4 font-heading text-4xl font-extrabold">Take professional insight with you</h2><p className="mx-auto mt-4 max-w-2xl text-white/75">Explore conversations, continue into related learning, and share the questions that matter to your work.</p><div className="mt-7 flex flex-wrap justify-center gap-3"><Link to="/library" className="rounded bg-white px-6 py-3 font-bold text-red-600">Open media library</Link><Link to="/pages/learning" className="rounded border border-white/40 px-6 py-3 font-bold">Explore learning</Link></div></section>
</main><PublicFooter/></div>;

export default PodcastsHub;
