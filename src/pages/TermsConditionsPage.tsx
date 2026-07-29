import { CheckCircle2, FileText, Mail, Scale, ShieldCheck } from "lucide-react";
import PublicFooter from "@/components/PublicFooter";
import PublicNavigation from "@/components/PublicNavigation";

const sections = [
  {
    title: "Acceptance of these terms",
    content: "These Terms and Conditions govern access to and use of the Project & Contracts Management Organisation (PCMO) website, membership services, learning resources, events, certifications, community spaces, and related digital services. By using PCMO services or creating an account, you agree to these terms and any policies referenced within them.",
  },
  {
    title: "Accounts and membership",
    content: "You are responsible for providing accurate, current information and for keeping your account credentials confidential. Membership, enrolment, certification, and event access may be subject to eligibility requirements, fees, approval processes, and programme-specific rules. PCMO may suspend or restrict access where an account is used unlawfully, fraudulently, or in breach of these terms.",
  },
  {
    title: "Payments, renewals, and cancellations",
    content: "Prices, payment schedules, renewal arrangements, and cancellation conditions are presented for the relevant service before payment is completed. You must review the applicable checkout or programme information before confirming a purchase. Refunds, transfers, and cancellations are handled in accordance with the terms supplied for the relevant membership, course, event, or service and any applicable law.",
  },
  {
    title: "Acceptable use",
    content: "You must use PCMO services respectfully, lawfully, and only for their intended professional purpose. Do not upload harmful content, interfere with platform security, impersonate another person, misuse community features, infringe intellectual property rights, or use the service to send unsolicited or misleading communications. Keep confidential information, including client and employer information, out of public community spaces unless you have the required authority to share it.",
  },
  {
    title: "Professional content and intellectual property",
    content: "PCMO content, including learning materials, publications, branding, assessments, and platform design, is protected by applicable intellectual property laws. Unless PCMO gives written permission, you may use materials for your personal professional development only and may not reproduce, distribute, sell, publish, or create derivative works from them. Content contributed by users remains the contributor's responsibility; by sharing it, you confirm you have the right to do so.",
  },
  {
    title: "Disclaimers and liability",
    content: "PCMO provides professional education, information, and community resources for general guidance. Content is not legal, financial, engineering, procurement, or other specialist advice, and it should not replace advice tailored to your circumstances. To the extent permitted by law, PCMO does not guarantee that services will always be uninterrupted, error-free, or suitable for every purpose. Nothing in these terms limits liability that cannot lawfully be limited or excluded.",
  },
  {
    title: "Privacy and data protection",
    content: "PCMO handles personal information in line with its Privacy Policy and applicable data protection requirements. By using the service, you acknowledge that limited account, transaction, usage, and communication information may be processed to deliver, secure, improve, and support PCMO services. Please review the Privacy Policy for more information about your data rights and how to contact us.",
  },
  {
    title: "Changes to services or terms",
    content: "PCMO may update services, programmes, fees, policies, and these terms where reasonably necessary. Material changes will be published on this page or otherwise communicated where appropriate. Continued use after an updated version takes effect indicates acceptance of the revised terms.",
  },
];

const TermsConditionsPage = () => (
  <div className="min-h-screen bg-white text-slate-800">
    <PublicNavigation active="" />
    <main>
      <section className="relative overflow-hidden bg-[#071f3b] px-6 py-24 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_15%,rgba(220,38,38,.34),transparent_32%)]" />
        <div className="relative mx-auto max-w-5xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-red-300/30 bg-red-600/15 px-4 py-2 text-xs font-bold uppercase tracking-[.18em] text-red-200"><Scale className="h-4 w-4" />PCMO legal information</span>
          <h1 className="mt-6 font-heading text-5xl font-extrabold md:text-6xl">Terms &amp; Conditions</h1>
          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-white/75">The terms governing your use of PCMO's website, membership services, learning resources, and professional community.</p>
          <p className="mt-6 text-sm text-white/55">Last updated: July 2026</p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-16">
        <div className="grid gap-5 md:grid-cols-3">
          {[[ShieldCheck, "Use responsibly", "Protect your account, professional community, and confidential information."], [FileText, "Review before purchase", "Check service-specific fees, eligibility, and cancellation information."], [CheckCircle2, "Stay informed", "Review this page periodically for updates to these terms."]].map(([Icon, title, content]) => {
            const CardIcon = Icon as typeof ShieldCheck;
            return <article key={String(title)} className="rounded-2xl border border-slate-200 bg-slate-50 p-6"><CardIcon className="h-8 w-8 text-red-600" /><h2 className="mt-4 font-heading text-xl font-extrabold text-[#0b3764]">{String(title)}</h2><p className="mt-3 text-sm leading-6 text-slate-600">{String(content)}</p></article>;
          })}
        </div>

        <div className="mt-14 space-y-6">
          {sections.map((section, index) => <article key={section.title} className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm"><div className="flex gap-4"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-red-50 text-sm font-bold text-red-600">{index + 1}</span><div><h2 className="font-heading text-2xl font-extrabold text-[#0b3764]">{section.title}</h2><p className="mt-4 leading-8 text-slate-600">{section.content}</p></div></div></article>)}
        </div>

        <aside className="mt-12 rounded-2xl bg-[#0b3764] p-8 text-white"><Mail className="h-8 w-8 text-red-300" /><h2 className="mt-4 font-heading text-2xl font-extrabold">Questions about these terms?</h2><p className="mt-3 max-w-2xl leading-7 text-white/70">Contact PCMO before using a service if you need clarification about membership, payments, programmes, or your account.</p><a href="mailto:info@pcmo.world" className="mt-6 inline-flex rounded bg-red-600 px-5 py-3 font-bold transition hover:bg-red-700">Contact PCMO</a></aside>
      </section>
    </main>
    <PublicFooter />
  </div>
);

export default TermsConditionsPage;
