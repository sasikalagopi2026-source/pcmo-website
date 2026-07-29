import { Cookie, Eye, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import PublicFooter from "@/components/PublicFooter";
import PublicNavigation from "@/components/PublicNavigation";

const sections = [
  {
    title: "Information we collect",
    content: "PCMO may collect information you provide when creating an account, joining as a member, registering for a course or event, making a payment, contacting us, or contributing to community services. This can include your name, contact details, professional profile, account credentials, membership and learning records, payment-related information, and communications with PCMO.",
  },
  {
    title: "How we use your information",
    content: "We use personal information to provide and administer PCMO services, process registrations and payments, verify access to learning and membership benefits, communicate service updates, respond to enquiries, maintain platform security, improve our services, and meet legal or regulatory obligations. We only use information where we have an appropriate legal basis to do so.",
  },
  {
    title: "Community and profile information",
    content: "Some professional profile information may be visible to other members when you use community features. You can manage relevant profile and privacy settings through your account where available. Please avoid sharing confidential client, employer, project, or personal information in public or shared community spaces unless you are authorised to do so.",
  },
  {
    title: "Sharing and service providers",
    content: "PCMO may share information with carefully selected providers that support services such as hosting, communications, payments, learning delivery, analytics, and customer support. These providers may access information only as needed to perform their services and must protect it appropriately. We may also disclose information where required by law or to protect rights, safety, and platform integrity.",
  },
  {
    title: "Data security and retention",
    content: "We apply reasonable technical and organisational measures to protect personal information against unauthorised access, loss, misuse, alteration, or disclosure. Information is retained only for as long as needed for the purposes described in this policy, to maintain appropriate professional records, or to comply with legal, accounting, or reporting obligations.",
  },
  {
    title: "Cookies and similar technologies",
    content: "PCMO may use cookies and similar technologies to keep the website functioning, remember preferences, understand how services are used, and improve performance. You can manage cookies through your browser settings; however, disabling essential cookies may affect parts of the website or account experience.",
  },
  {
    title: "Your privacy rights",
    content: "Depending on applicable law, you may have rights to request access to, correction of, deletion of, restriction of, or objection to the processing of your personal information. You may also have a right to data portability and to withdraw consent where processing is based on consent. To exercise a right, please contact PCMO using the details below.",
  },
  {
    title: "Policy updates",
    content: "PCMO may update this Privacy Policy to reflect changes to our services, practices, or legal requirements. The current version will be published on this page with its updated date. We encourage you to review it periodically.",
  },
];

const PrivacyPolicyPage = () => (
  <div className="min-h-screen bg-white text-slate-800">
    <PublicNavigation active="" />
    <main>
      <section className="relative overflow-hidden bg-[#071f3b] px-6 py-24 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(220,38,38,.34),transparent_32%)]" />
        <div className="relative mx-auto max-w-5xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-red-300/30 bg-red-600/15 px-4 py-2 text-xs font-bold uppercase tracking-[.18em] text-red-200"><ShieldCheck className="h-4 w-4" />PCMO privacy information</span>
          <h1 className="mt-6 font-heading text-5xl font-extrabold md:text-6xl">Privacy Policy</h1>
          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-white/75">How PCMO collects, uses, protects, and manages personal information across our website and professional services.</p>
          <p className="mt-6 text-sm text-white/55">Last updated: July 2026</p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-16">
        <div className="grid gap-5 md:grid-cols-3">
          {[[LockKeyhole, "Protected with care", "We apply safeguards designed to protect your personal information."], [Eye, "You stay informed", "This policy explains what we collect and why we use it."], [Cookie, "Manage preferences", "Use account and browser controls to manage available privacy choices."]].map(([Icon, title, content]) => {
            const CardIcon = Icon as typeof ShieldCheck;
            return <article key={String(title)} className="rounded-2xl border border-slate-200 bg-slate-50 p-6"><CardIcon className="h-8 w-8 text-red-600" /><h2 className="mt-4 font-heading text-xl font-extrabold text-[#0b3764]">{String(title)}</h2><p className="mt-3 text-sm leading-6 text-slate-600">{String(content)}</p></article>;
          })}
        </div>

        <div className="mt-14 space-y-6">
          {sections.map((section, index) => <article key={section.title} className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm"><div className="flex gap-4"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-red-50 text-sm font-bold text-red-600">{index + 1}</span><div><h2 className="font-heading text-2xl font-extrabold text-[#0b3764]">{section.title}</h2><p className="mt-4 leading-8 text-slate-600">{section.content}</p></div></div></article>)}
        </div>

        <aside className="mt-12 rounded-2xl bg-[#0b3764] p-8 text-white"><Mail className="h-8 w-8 text-red-300" /><h2 className="mt-4 font-heading text-2xl font-extrabold">Privacy questions or requests</h2><p className="mt-3 max-w-2xl leading-7 text-white/70">Contact PCMO to ask about this policy or make a request regarding your personal information.</p><a href="mailto:info@pcmo.world" className="mt-6 inline-flex rounded bg-red-600 px-5 py-3 font-bold transition hover:bg-red-700">Contact PCMO</a></aside>
      </section>
    </main>
    <PublicFooter />
  </div>
);

export default PrivacyPolicyPage;
