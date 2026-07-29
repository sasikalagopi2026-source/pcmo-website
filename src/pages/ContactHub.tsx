import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ArrowRight, Building2, CheckCircle2, ClipboardList, Mail, MessageSquare, Phone, Send, ShieldCheck, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import PublicFooter from "@/components/PublicFooter";
import PublicNavigation from "@/components/PublicNavigation";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

const enquiryTypes = ["Membership", "Student support", "Certification", "Courses and learning", "Events and webinars", "Library resources", "Volunteering", "Organisation partnership", "Technical support", "General enquiry"];
const audiences = ["Student", "Individual professional", "Organisation", "Employer", "Partner", "Speaker or contributor", "Volunteer", "Other"];
const statuses = ["Not a member yet", "Free member", "Student member", "Individual member", "Group or corporate member", "Admin enquiry", "Not sure"];
const contactMethods = ["Email", "Phone", "WhatsApp", "Student portal notification"];
const urgencies = ["Normal", "Time-sensitive", "Urgent"];

const initialForm = {
  name: "",
  email: "",
  phone: "",
  organization: "",
  role_title: "",
  enquiry_type: "General enquiry",
  audience: "Student",
  membership_status: "Not sure",
  preferred_contact_method: "Email",
  urgency: "Normal",
  subject: "",
  message: "",
  student_id: "",
  course_or_certificate: "",
  page_url: "",
  best_time: "",
  consent: false,
};

const ContactHub = () => {
  const { user } = useAuth();
  const [form, setForm] = useState(() => ({ ...initialForm, name: user?.display_name ?? "", email: user?.email ?? "" }));
  const [submitted, setSubmitted] = useState(false);
  const canSubmit = useMemo(() => form.name.trim().length > 1 && /\S+@\S+\.\S+/.test(form.email) && form.subject.trim().length > 1 && form.message.trim().length > 9 && form.consent, [form]);
  const update = (field: keyof typeof form, value: string | boolean) => setForm((current) => ({ ...current, [field]: value }));
  const submit = useMutation({
    mutationFn: () => api<{ id: string }>("/api/contact-messages", {
      method: "POST",
      body: JSON.stringify({
        name: form.name,
        email: form.email,
        phone: form.phone,
        subject: form.subject,
        message: form.message,
        enquiry_type: form.enquiry_type,
        audience: form.audience,
        organization: form.organization,
        role_title: form.role_title,
        membership_status: form.membership_status,
        preferred_contact_method: form.preferred_contact_method,
        urgency: form.urgency,
        consent: form.consent,
        metadata: {
          student_id: form.student_id,
          course_or_certificate: form.course_or_certificate,
          page_url: form.page_url,
          best_time: form.best_time,
          user_id: user?.id ?? null,
          user_role: user?.role ?? "guest",
        },
      }),
    }),
    onSuccess: () => {
      setSubmitted(true);
      setForm({ ...initialForm, name: user?.display_name ?? "", email: user?.email ?? "" });
    },
  });

  return <div className="min-h-screen bg-white text-slate-800"><PublicNavigation active="connect" /><main>
    <section className="bg-[#071f3b] px-6 py-20 text-white"><div className="mx-auto max-w-7xl"><p className="text-sm font-bold uppercase tracking-[.22em] text-red-300">Contact PCMO</p><h1 className="mt-4 max-w-4xl font-heading text-5xl font-extrabold leading-tight md:text-6xl">Tell us what you need, and we will route it properly.</h1><p className="mt-6 max-w-3xl text-lg leading-8 text-white/70">Use this form for student support, membership, certifications, learning, events, volunteering, organisations, technical issues, and general enquiries. Every submitted field is stored in the database and appears in the Admin Contact Messages panel.</p><div className="mt-8 flex flex-wrap gap-4 text-sm text-white/70"><span className="flex items-center gap-2"><Mail className="h-4 w-4 text-red-300" />Admin inbox</span><span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-red-300" />Tracked status</span><span className="flex items-center gap-2"><ClipboardList className="h-4 w-4 text-red-300" />Structured fields</span></div></div></section>

    <section className="mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-[1fr_360px]">
      <form onSubmit={(event) => { event.preventDefault(); if (canSubmit) submit.mutate(); }} className="space-y-6">
        {submitted && <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-800"><p className="flex items-start gap-2 text-sm"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" /><span>Thank you for contacting PCMO. Your enquiry has been received successfully. <strong>One of our representatives will contact you shortly</strong> to assist you with your request.</span></p></div>}
        {submit.error && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{submit.error.message}</div>}

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2"><span className="text-sm font-semibold">Full name</span><input minLength={2} className="w-full rounded-md border px-3 py-3" value={form.name} onChange={(e) => update("name", e.target.value)} required /></label>
          <label className="space-y-2"><span className="text-sm font-semibold">Email</span><input type="email" className="w-full rounded-md border px-3 py-3" value={form.email} onChange={(e) => update("email", e.target.value)} required /></label>
          <label className="space-y-2"><span className="text-sm font-semibold">Phone</span><input className="w-full rounded-md border px-3 py-3" value={form.phone} onChange={(e) => update("phone", e.target.value)} /></label>
          <label className="space-y-2"><span className="text-sm font-semibold">Organisation</span><input className="w-full rounded-md border px-3 py-3" value={form.organization} onChange={(e) => update("organization", e.target.value)} /></label>
          <label className="space-y-2"><span className="text-sm font-semibold">Role or title</span><input className="w-full rounded-md border px-3 py-3" value={form.role_title} onChange={(e) => update("role_title", e.target.value)} /></label>
          <label className="space-y-2"><span className="text-sm font-semibold">Student or member ID</span><input className="w-full rounded-md border px-3 py-3" value={form.student_id} onChange={(e) => update("student_id", e.target.value)} /></label>
          <label className="space-y-2"><span className="text-sm font-semibold">Enquiry type</span><select className="w-full rounded-md border px-3 py-3" value={form.enquiry_type} onChange={(e) => update("enquiry_type", e.target.value)}>{enquiryTypes.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="space-y-2"><span className="text-sm font-semibold">Audience</span><select className="w-full rounded-md border px-3 py-3" value={form.audience} onChange={(e) => update("audience", e.target.value)}>{audiences.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="space-y-2"><span className="text-sm font-semibold">Membership status</span><select className="w-full rounded-md border px-3 py-3" value={form.membership_status} onChange={(e) => update("membership_status", e.target.value)}>{statuses.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="space-y-2"><span className="text-sm font-semibold">Preferred contact</span><select className="w-full rounded-md border px-3 py-3" value={form.preferred_contact_method} onChange={(e) => update("preferred_contact_method", e.target.value)}>{contactMethods.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="space-y-2"><span className="text-sm font-semibold">Urgency</span><select className="w-full rounded-md border px-3 py-3" value={form.urgency} onChange={(e) => update("urgency", e.target.value)}>{urgencies.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="space-y-2"><span className="text-sm font-semibold">Course or certificate</span><input className="w-full rounded-md border px-3 py-3" value={form.course_or_certificate} onChange={(e) => update("course_or_certificate", e.target.value)} /></label>
        </div>

        <label className="block space-y-2"><span className="text-sm font-semibold">Related page or URL</span><input className="w-full rounded-md border px-3 py-3" value={form.page_url} onChange={(e) => update("page_url", e.target.value)} /></label>
        <label className="block space-y-2"><span className="text-sm font-semibold">Best time to contact</span><input className="w-full rounded-md border px-3 py-3" value={form.best_time} onChange={(e) => update("best_time", e.target.value)} /></label>
        <label className="block space-y-2"><span className="text-sm font-semibold">Subject</span><input minLength={2} className="w-full rounded-md border px-3 py-3" value={form.subject} onChange={(e) => update("subject", e.target.value)} required /></label>
        <label className="block space-y-2"><span className="text-sm font-semibold">Message</span><textarea rows={7} minLength={10} className="w-full rounded-md border px-3 py-3" value={form.message} onChange={(e) => update("message", e.target.value)} required /></label>
        <label className="flex gap-3 rounded-md border bg-slate-50 p-4 text-sm"><input type="checkbox" required checked={form.consent} onChange={(e) => update("consent", e.target.checked)} /><span>I confirm the information is accurate and may be used by PCMO administrators to respond to this enquiry.</span></label>
        {!canSubmit && <p className="text-sm text-slate-500">Complete your name, email, subject, message (at least 10 characters), and confirmation to submit.</p>}
        <button disabled={submit.isPending} className="inline-flex items-center gap-2 rounded-md bg-red-600 px-6 py-3 font-bold text-white disabled:opacity-50"><Send className="h-4 w-4" />{submit.isPending ? "Submitting..." : "Submit enquiry"}</button>
      </form>

      <aside className="space-y-5">
        {[[UserRound, "Student support", "Use your student or member ID when asking about dashboard, course, certificate, or membership records."], [Building2, "Organisation enquiries", "Include organisation name, role, cohort size, timing, and the result you want to achieve."], [Phone, "Response routing", "Admin can filter, read, reply, archive, and add internal notes from the Admin Panel."]].map(([Icon, title, text]) => { const CardIcon = Icon as typeof UserRound; return <div key={String(title)} className="rounded-md border bg-white p-5 shadow-sm"><CardIcon className="h-7 w-7 text-red-600" /><h2 className="mt-4 font-heading text-xl font-bold text-[#0b3764]">{String(title)}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{String(text)}</p></div>; })}
        <div className="rounded-md bg-[#071f3b] p-6 text-white"><MessageSquare className="h-8 w-8 text-red-300" /><h2 className="mt-4 text-xl font-bold">Need a portal action?</h2><p className="mt-2 text-sm leading-6 text-white/70">For events, volunteering, courses, library access, and certifications, using the linked dashboard page helps administrators locate your record faster.</p><Link to="/dashboard" className="mt-5 inline-flex items-center gap-2 font-bold text-red-300">Open dashboard<ArrowRight className="h-4 w-4" /></Link></div>
      </aside>
    </section>
  </main><PublicFooter /></div>;
};

export default ContactHub;
