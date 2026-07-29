import { Map, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import PublicFooter from "@/components/PublicFooter";
import PublicNavigation from "@/components/PublicNavigation";

type SitemapItem = { name: string; route?: string; note?: string };
type SitemapSection = { title: string; description: string; items: SitemapItem[] };

const publicSections: SitemapSection[] = [
  { title: "Home & About", description: "Public marketing and organisation information.", items: [
    { name: "Home", route: "/" }, { name: "About PCMO", route: "/pages/about" }, { name: "Membership & Networking", route: "/pages/membership_and_networking" }, { name: "Membership Packages", route: "/pages/membership_packages" }, { name: "Membership Plans", route: "/membership-plans/:slug" }, { name: "Certifications", route: "/pages/certifications" }, { name: "Certificate Validation", route: "/pages/validate_certificate" },
  ] },
  { title: "Resources & Learning", description: "Knowledge, development, and professional insight.", items: [
    { name: "Resources", route: "/pages/resources" }, { name: "Standards", route: "/pages/standards" }, { name: "Thought Leadership", route: "/pages/thought_leadership" }, { name: "Career Resources", route: "/pages/career_resources" }, { name: "Learning", route: "/pages/learning" }, { name: "Podcasts", route: "/pages/podcasts" }, { name: "Webinars", route: "/pages/webinars" }, { name: "Events", route: "/pages/events" },
  ] },
  { title: "Community & Networking", description: "Ways to connect, collaborate, and contribute.", items: [
    { name: "Membership Community", route: "/pages/membership_community" }, { name: "Job Community", route: "/pages/job_community" }, { name: "Community Chat Rooms", route: "/pages/community_chat_rooms" }, { name: "Upcoming Networking Events", route: "/pages/upcoming_networking_events" }, { name: "Join the Conversation", route: "/pages/join_the_conversation" }, { name: "Get Involved", route: "/pages/get_involved" }, { name: "Organizations", route: "/pages/organizations" },
  ] },
  { title: "Support & Policies", description: "Help, contact, and legal information.", items: [
    { name: "Contact", route: "/contact" }, { name: "Contact Page", route: "/pages/contact" }, { name: "FAQs", route: "/pages/faqs" }, { name: "Terms & Conditions", route: "/pages/terms" }, { name: "Privacy Policy", route: "/pages/privacy" }, { name: "Dynamic CMS Pages", route: "/pages/:slug" },
  ] },
];

const SitemapList = ({ items }: { items: SitemapItem[] }) => <ul className="mt-5 grid gap-2 text-sm">{items.map(item => <li key={item.name} className="flex items-baseline justify-between gap-3 rounded-lg px-3 py-2 transition hover:bg-slate-50"><span className="font-semibold text-[#0b3764]">{item.route && !item.route.includes(":") ? <Link className="hover:text-red-600" to={item.route}>{item.name}</Link> : item.name}</span><span className="shrink-0 font-mono text-[11px] text-slate-400">{item.route || item.note}</span></li>)}</ul>;

const PcmoSitemapPage = () => <div className="min-h-screen bg-slate-50 text-slate-800">
  <PublicNavigation active="" />
  <main>
    <section className="relative overflow-hidden bg-[#071f3b] px-6 py-24 text-white"><div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_20%,rgba(220,38,38,.32),transparent_35%)]" /><div className="relative mx-auto max-w-4xl text-center"><Map className="mx-auto h-12 w-12 text-red-300" /><p className="mt-5 text-xs font-bold uppercase tracking-[.2em] text-red-300">Platform directory</p><h1 className="mt-4 font-heading text-5xl font-extrabold md:text-6xl">PCMO Sitemap</h1><p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-white/75">A detailed guide to PCMO’s public website, member portal, and administrator platform.</p></div></section>
    <section className="mx-auto max-w-7xl px-6 py-16"><div className="mb-10 flex items-start gap-4 rounded-2xl border border-blue-100 bg-blue-50 p-5 text-sm leading-6 text-slate-600"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#0b3764]" /><p>This directory brings together all public PCMO pages for membership, learning, certifications, resources, community, and support.</p></div><h2 className="font-heading text-3xl font-extrabold text-[#0b3764]">Public website pages</h2><div className="mt-7 grid gap-5 md:grid-cols-2">{publicSections.map(section => <article key={section.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h3 className="text-xl font-extrabold text-[#0b3764]">{section.title}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{section.description}</p><SitemapList items={section.items} /></article>)}</div></section>
  </main>
  <PublicFooter />
</div>;

export default PcmoSitemapPage;
