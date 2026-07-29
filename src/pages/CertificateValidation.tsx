import { FormEvent, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CheckCircle2, Clipboard, ExternalLink, FileSearch, Printer, Search, ShieldAlert, ShieldCheck } from "lucide-react";
import PublicFooter from "@/components/PublicFooter";
import PublicNavigation from "@/components/PublicNavigation";

type Result = { credential_id: string; title: string; recipient_name?: string; designation?: string; issuer: string; issue_date?: string; expiry_date?: string; status: string; verification_status: string; verified_at: string };
const displayDate = (value?: string) => value ? new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }) : "Not specified";

const CertificateValidation = () => {
  const [params, setParams] = useSearchParams();
  const [credentialId, setCredentialId] = useState(params.get("credential") || "");
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const validate = async (event?: FormEvent) => {
    event?.preventDefault();
    const value = credentialId.trim();
    if (value.length < 4) { setError("Enter the credential ID printed on the certificate."); return; }
    setLoading(true); setError(""); setResult(null);
    try {
      const response = await fetch(`/api/public/certificates/validate/${encodeURIComponent(value)}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to verify this certificate");
      setResult(data); setParams({ credential: value }, { replace: true });
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to verify this certificate"); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (params.get("credential")) void validate(); }, []);
  const valid = result?.verification_status === "valid";

  return <div className="min-h-screen bg-slate-50 text-slate-800">
    <PublicNavigation active="certifications" />
    <main>
      <section className="bg-[#071f3b] px-6 py-20 text-white"><div className="mx-auto max-w-5xl text-center"><ShieldCheck className="mx-auto h-16 w-16 text-red-400"/><p className="mt-5 text-sm font-bold uppercase tracking-[.22em] text-red-300">Secure credential verification</p><h1 className="mt-3 font-heading text-5xl font-extrabold">Validate a PCMO Certificate</h1><p className="mx-auto mt-5 max-w-2xl leading-8 text-white/70">Confirm the authenticity and current status of a PCMO credential using the unique ID printed on the certificate.</p></div></section>

      <section className="mx-auto max-w-5xl px-6 py-14"><form onSubmit={validate} className="rounded-2xl border bg-white p-7 shadow-xl"><label htmlFor="credential" className="font-bold text-[#0b3764]">Certificate credential ID</label><div className="mt-3 flex flex-col gap-3 sm:flex-row"><div className="relative flex-1"><FileSearch className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"/><input id="credential" value={credentialId} onChange={event => setCredentialId(event.target.value)} placeholder="Example: PCMO-2026-001234" autoComplete="off" className="h-14 w-full rounded-xl border border-slate-300 pl-12 pr-4 font-mono uppercase outline-none transition focus:border-red-500 focus:ring-4 focus:ring-red-100"/></div><button disabled={loading} className="inline-flex h-14 items-center justify-center gap-2 rounded-xl bg-red-600 px-7 font-bold text-white disabled:opacity-60"><Search className="h-5 w-5"/>{loading ? "Verifying..." : "Verify certificate"}</button></div><p className="mt-3 text-sm text-slate-500">Enter the ID exactly as shown. Verification does not require sign-in.</p></form>

        {error && <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-7"><div className="flex gap-4"><ShieldAlert className="h-9 w-9 shrink-0 text-red-600"/><div><h2 className="text-xl font-bold text-red-800">Verification unsuccessful</h2><p className="mt-2 text-red-700">{error}</p><p className="mt-3 text-sm text-red-700/80">Check for typing errors. If the ID is correct, contact PCMO and provide a copy of the certificate for review.</p></div></div></div>}

        {result && <article className={`mt-8 overflow-hidden rounded-2xl border-2 bg-white shadow-xl ${valid ? "border-emerald-300" : "border-amber-300"}`}><header className={`flex flex-col gap-4 p-7 text-white sm:flex-row sm:items-center sm:justify-between ${valid ? "bg-emerald-700" : "bg-amber-600"}`}><div className="flex items-center gap-4">{valid ? <CheckCircle2 className="h-12 w-12"/> : <ShieldAlert className="h-12 w-12"/>}<div><p className="text-sm font-bold uppercase tracking-widest opacity-80">Verification result</p><h2 className="text-3xl font-extrabold capitalize">Certificate {result.verification_status}</h2></div></div><span className="rounded-full bg-white/15 px-4 py-2 text-sm font-bold">Live registry match</span></header><div className="p-7"><div className="grid gap-5 sm:grid-cols-2">{[["Credential ID", result.credential_id], ["Certificate", result.title], ["Recipient", result.recipient_name || "PCMO Member"], ["Designation", result.designation || "Certified Professional"], ["Issuer", result.issuer], ["Issue date", displayDate(result.issue_date)], ["Expiry date", displayDate(result.expiry_date)], ["Registry status", result.status]].map(([label,value]) => <div key={label} className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p><p className="mt-2 font-semibold text-slate-900">{value}</p></div>)}</div><div className="mt-7 flex flex-wrap gap-3 border-t pt-6"><button onClick={() => navigator.clipboard.writeText(window.location.href)} className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 font-bold text-[#0b3764]"><Clipboard className="h-4 w-4"/>Copy verification link</button><button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 font-bold text-[#0b3764]"><Printer className="h-4 w-4"/>Print result</button><a href="/contact" className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 font-bold text-[#0b3764]">Report a concern<ExternalLink className="h-4 w-4"/></a></div><p className="mt-5 text-xs text-slate-500">Checked against the live PCMO credential registry on {displayDate(result.verified_at)}.</p></div></article>}

        <div className="mt-12 grid gap-5 md:grid-cols-3">{[[ShieldCheck,"Registry verification","Results are checked directly against current PCMO certification records."],[CheckCircle2,"Status awareness","Validation identifies active, expired, and other credential states."],[FileSearch,"Privacy conscious","Only professional credential details needed for verification are displayed."]].map(([Icon,title,text]) => { const CardIcon = Icon as typeof ShieldCheck; return <div key={String(title)} className="rounded-xl border bg-white p-6"><CardIcon className="h-8 w-8 text-red-600"/><h3 className="mt-4 font-bold text-[#0b3764]">{String(title)}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{String(text)}</p></div>})}</div>
      </section>
    </main><PublicFooter />
  </div>;
};
export default CertificateValidation;
