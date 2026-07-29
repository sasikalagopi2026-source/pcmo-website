import { ChevronDown, CircleHelp, CreditCard, GraduationCap, MessagesSquare, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import PublicFooter from "@/components/PublicFooter";
import PublicNavigation from "@/components/PublicNavigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { membershipFaqs } from "@/lib/membershipFaqs";

const categories = [
  { id: "membership", label: "Membership", icon: UserRound, questions: membershipFaqs.slice(0, 6) },
  { id: "billing", label: "Billing & Account", icon: CreditCard, questions: membershipFaqs.slice(6, 13) },
  { id: "learning", label: "Learning & Certification", icon: GraduationCap, questions: membershipFaqs.slice(13, 16) },
  { id: "community", label: "Community & Support", icon: MessagesSquare, questions: membershipFaqs.slice(16) },
] as const;

const FaqList = ({ questions }: { questions: readonly { question: string; answer: string }[] }) => (
  <div className="space-y-4">
    {questions.map((faq, index) => <details key={faq.question} className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition open:border-red-200 open:shadow-md">
      <summary className="flex cursor-pointer list-none items-center gap-4 px-6 py-5 font-bold text-[#0b3764]"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-red-50 text-sm text-red-600">{index + 1}</span><span className="flex-1">{faq.question}</span><ChevronDown className="h-5 w-5 shrink-0 text-red-600 transition group-open:rotate-180" /></summary>
      <p className="border-t border-slate-100 px-6 py-5 pl-[4.5rem] leading-7 text-slate-600">{faq.answer}</p>
    </details>)}
  </div>
);

const FaqsPage = () => (
  <div className="min-h-screen bg-white text-slate-800">
    <PublicNavigation active="" />
    <main>
      <section className="relative overflow-hidden bg-[#071f3b] px-6 py-24 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_20%,rgba(220,38,38,.32),transparent_35%)]" />
        <div className="relative mx-auto max-w-4xl text-center"><CircleHelp className="mx-auto h-12 w-12 text-red-300" /><p className="mt-5 text-xs font-bold uppercase tracking-[.2em] text-red-300">PCMO help centre</p><h1 className="mt-4 font-heading text-5xl font-extrabold md:text-6xl">Frequently Asked Questions</h1><p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-white/75">Find answers about membership, your account, payments, learning, certifications, and the PCMO community.</p></div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-16">
        <Tabs defaultValue="all">
          <TabsList className="grid h-auto w-full grid-cols-1 gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:grid-cols-2 lg:grid-cols-5">
            <TabsTrigger value="all" className="group relative h-auto justify-start gap-3 overflow-hidden rounded-xl border border-transparent px-4 py-3 text-left text-slate-600 transition-all hover:border-red-100 hover:bg-red-50/70 hover:text-[#0b3764] data-[state=active]:border-red-600 data-[state=active]:bg-[#0b3764] data-[state=active]:text-white data-[state=active]:shadow-md"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-[#0b3764] transition group-data-[state=active]:bg-red-600 group-data-[state=active]:text-white"><CircleHelp className="h-4 w-4" /></span><span className="min-w-0 flex-1"><span className="block font-bold">All FAQs</span><span className="mt-0.5 block text-xs text-slate-400 group-data-[state=active]:text-white/65">{membershipFaqs.length} answers</span></span></TabsTrigger>
            {categories.map(({ id, label, icon: Icon, questions }) => <TabsTrigger key={id} value={id} className="group relative h-auto justify-start gap-3 overflow-hidden rounded-xl border border-transparent px-4 py-3 text-left text-slate-600 transition-all hover:border-red-100 hover:bg-red-50/70 hover:text-[#0b3764] data-[state=active]:border-red-600 data-[state=active]:bg-[#0b3764] data-[state=active]:text-white data-[state=active]:shadow-md"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-[#0b3764] transition group-data-[state=active]:bg-red-600 group-data-[state=active]:text-white"><Icon className="h-4 w-4" /></span><span className="min-w-0 flex-1"><span className="block truncate font-bold">{label}</span><span className="mt-0.5 block text-xs text-slate-400 group-data-[state=active]:text-white/65">{questions.length} answers</span></span></TabsTrigger>)}
          </TabsList>
          <TabsContent value="all" className="mt-8"><div className="mb-6"><h2 className="font-heading text-3xl font-extrabold text-[#0b3764]">All questions</h2><p className="mt-2 text-slate-600">Browse every answer in one place, or use a category tab to narrow your search.</p></div><FaqList questions={membershipFaqs} /></TabsContent>
          {categories.map(({ id, label, questions }) => <TabsContent key={id} value={id} className="mt-8"><div className="mb-6"><h2 className="font-heading text-3xl font-extrabold text-[#0b3764]">{label}</h2><p className="mt-2 text-slate-600">{questions.length} commonly asked questions.</p></div><FaqList questions={questions} /></TabsContent>)}
        </Tabs>
        <div className="mt-14 rounded-2xl bg-red-50 p-8 text-center"><h2 className="font-heading text-2xl font-extrabold text-[#0b3764]">Still need help?</h2><p className="mx-auto mt-3 max-w-2xl leading-7 text-slate-600">Contact PCMO with your question and include the email address associated with your account where relevant.</p><Link to="/contact" className="mt-6 inline-flex rounded bg-red-600 px-5 py-3 font-bold text-white transition hover:bg-red-700">Contact PCMO</Link></div>
      </section>
    </main>
    <PublicFooter />
  </div>
);

export default FaqsPage;
