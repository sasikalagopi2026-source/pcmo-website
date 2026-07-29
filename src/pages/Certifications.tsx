import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import jsPDF from "jspdf";
import { Award, CalendarDays, Download, Eye, FileText, Medal, ShieldCheck } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import PcmoLogo from "@/components/PcmoLogo";
import { api, resourceApi } from "@/lib/api";
import type { LiveCourse } from "@/components/MyCoursesSection";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Certification = {
  id: string;
  user_id?: string;
  course_id?: string;
  title: string;
  recipient_name?: string;
  designation?: string;
  issuer: string;
  credential_id?: string;
  issue_date?: string;
  expiry_date?: string;
  status: string;
};

type PreviewMode = "certificate" | "badge" | "brochure";

const formatDate = (value?: string) => value ? new Date(value).toLocaleDateString() : "Pending";
const safeFileName = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "pcmo-certificate";
const recipient = (certificate: Certification) => certificate.recipient_name || "PCMO Member";
const designation = (certificate: Certification) => certificate.designation || "Certified Professional";

const downloadBlob = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

let logoDataUrlPromise: Promise<string> | null = null;

const getLogoDataUrl = () => {
  logoDataUrlPromise ??= fetch("/pcmo-logo.png")
    .then((response) => {
      if (!response.ok) throw new Error("Unable to load the PCMO logo");
      return response.blob();
    })
    .then((blob) => new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    }));
  return logoDataUrlPromise;
};

const drawPcmoPdfLogo = (pdf: jsPDF, logoDataUrl: string, x: number, y: number, width: number) => {
  pdf.addImage(logoDataUrl, "PNG", x, y, width, width * (352 / 1120));
};

const downloadCertificatePdf = async (certificate: Certification) => {
  const logoDataUrl = await getLogoDataUrl();
  const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const width = pdf.internal.pageSize.getWidth();
  const height = pdf.internal.pageSize.getHeight();
  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, width, height, "F");
  pdf.setDrawColor(26, 58, 107);
  pdf.setLineWidth(4);
  pdf.rect(34, 34, width - 68, height - 68);
  pdf.setDrawColor(214, 166, 63);
  pdf.setLineWidth(1.5);
  pdf.rect(54, 54, width - 108, height - 108);
  drawPcmoPdfLogo(pdf, logoDataUrl, width / 2 - 126, 68, 252);
  pdf.setTextColor(26, 58, 107);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(34);
  pdf.text("Certificate of Completion", width / 2, 160, { align: "center" });
  pdf.setTextColor(88, 96, 112);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(13);
  pdf.text("This certificate is proudly presented to", width / 2, 202, { align: "center" });
  pdf.setTextColor(26, 58, 107);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(36);
  pdf.text(recipient(certificate), width / 2, 255, { align: "center", maxWidth: width - 140 });
  pdf.setTextColor(44, 51, 65);
  pdf.setFontSize(15);
  pdf.text(designation(certificate), width / 2, 285, { align: "center", maxWidth: width - 160 });
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(13);
  pdf.setTextColor(88, 96, 112);
  pdf.text("for successfully completing the requirements and assessment for", width / 2, 330, { align: "center" });
  pdf.setTextColor(17, 24, 39);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(22);
  pdf.text(certificate.title, width / 2, 365, { align: "center", maxWidth: width - 140 });
  pdf.setFontSize(10);
  pdf.setTextColor(88, 96, 112);
  pdf.text(`Issued by: ${certificate.issuer || "PCMO"}`, 78, height - 112);
  pdf.text(`Credential ID: ${certificate.credential_id || "Pending"}`, width / 2, height - 112, { align: "center" });
  pdf.text(`Issue date: ${formatDate(certificate.issue_date)}`, width - 78, height - 112, { align: "right" });
  pdf.setDrawColor(88, 96, 112);
  pdf.line(78, height - 72, 250, height - 72);
  pdf.setTextColor(17, 24, 39);
  pdf.setFont("helvetica", "bold");
  pdf.text("Authorized Signature", 78, height - 52);
  pdf.save(`${safeFileName(certificate.title)}-certificate.pdf`);
};

const badgeSvg = (certificate: Certification, logoDataUrl: string) => {
  const title = certificate.title.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const name = recipient(certificate).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="900" viewBox="0 0 900 900">
  <rect width="900" height="900" rx="64" fill="#f8fafc"/>
  <circle cx="450" cy="330" r="230" fill="#ffffff" stroke="#d6a63f" stroke-width="16"/>
  <image href="${logoDataUrl}" x="190" y="225" width="520" height="164" preserveAspectRatio="xMidYMid meet"/>
  <text x="450" y="640" text-anchor="middle" font-family="Arial, sans-serif" font-size="42" font-weight="700" fill="#1a3a6b">Certified</text>
  <text x="450" y="694" text-anchor="middle" font-family="Arial, sans-serif" font-size="26" fill="#334155">${title}</text>
  <text x="450" y="748" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" font-weight="700" fill="#111827">${name}</text>
  <text x="450" y="800" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" fill="#64748b">${certificate.credential_id || "Credential pending"}</text>
</svg>`;
};

const downloadBadgeSvg = async (certificate: Certification) => {
  const logoDataUrl = await getLogoDataUrl();
  downloadBlob(new Blob([badgeSvg(certificate, logoDataUrl)], { type: "image/svg+xml" }), `${safeFileName(certificate.title)}-badge.svg`);
};

const downloadBrochurePdf = async (certificate: Certification) => {
  const logoDataUrl = await getLogoDataUrl();
  const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const width = pdf.internal.pageSize.getWidth();
  pdf.setFillColor(26, 58, 107);
  pdf.rect(0, 0, width, 170, "F");
  drawPcmoPdfLogo(pdf, logoDataUrl, 42, 28, 210);
  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(24);
  pdf.text("Certification Brochure", 48, 112);
  pdf.setFontSize(16);
  pdf.text(certificate.title, 48, 142, { maxWidth: width - 96 });
  pdf.setTextColor(17, 24, 39);
  pdf.setFontSize(18);
  pdf.text("Recipient", 48, 225);
  pdf.setFontSize(24);
  pdf.text(recipient(certificate), 48, 260, { maxWidth: width - 96 });
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(13);
  pdf.setTextColor(71, 85, 105);
  pdf.text(designation(certificate), 48, 286, { maxWidth: width - 96 });
  pdf.setTextColor(17, 24, 39);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  pdf.text("Credential Details", 48, 350);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(12);
  pdf.text(`Issuer: ${certificate.issuer || "PCMO"}`, 48, 382);
  pdf.text(`Credential ID: ${certificate.credential_id || "Pending"}`, 48, 406);
  pdf.text(`Issue date: ${formatDate(certificate.issue_date)}`, 48, 430);
  pdf.text(`Expiry: ${certificate.expiry_date ? formatDate(certificate.expiry_date) : "No expiry"}`, 48, 454);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  pdf.text("What This Recognizes", 48, 520);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(12);
  pdf.text(
    "This credential recognizes successful completion of the course requirements and assessment. It may be shared with employers, clients, and professional networks as evidence of learning achievement.",
    48,
    550,
    { maxWidth: width - 96, lineHeightFactor: 1.5 },
  );
  pdf.setFillColor(214, 166, 63);
  pdf.rect(48, 705, width - 96, 54, "F");
  pdf.setTextColor(17, 24, 39);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(13);
  pdf.text("Verification", 68, 738);
  pdf.setFont("helvetica", "normal");
  pdf.text(certificate.credential_id || "Credential pending", width - 68, 738, { align: "right" });
  pdf.save(`${safeFileName(certificate.title)}-brochure.pdf`);
};

const CertificatePreview = ({ certificate }: { certificate: Certification }) => (
  <div className="overflow-hidden rounded-lg border border-primary/20 bg-white text-slate-950 shadow-sm">
    <div className="relative min-h-[520px] p-8 sm:p-12">
      <div className="absolute inset-4 border-2 border-primary/70" />
      <div className="absolute inset-7 border border-warning/70" />
      <PcmoLogo className="pointer-events-none absolute left-1/2 top-1/2 h-40 w-[34rem] max-w-[80%] -translate-x-1/2 -translate-y-1/2 opacity-[0.04]" />
      <div className="relative z-10 flex h-full min-h-[440px] flex-col items-center text-center">
        <PcmoLogo className="h-24 w-80 max-w-full" />
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.35em] text-primary">Professional Certificate</p>
        <h2 className="mt-3 font-heading text-3xl font-bold text-slate-950 sm:text-4xl">Certificate of Completion</h2>
        <p className="mt-6 text-sm text-slate-600">This certificate is proudly presented to</p>
        <div className="mt-4 w-full max-w-xl border-b border-slate-300 pb-3"><p className="font-heading text-3xl font-bold text-primary sm:text-5xl">{recipient(certificate)}</p></div>
        <p className="mt-3 text-base font-medium text-slate-700">{designation(certificate)}</p>
        <p className="mt-8 max-w-2xl text-sm leading-7 text-slate-600">for successfully completing the requirements and assessment for</p>
        <h3 className="mt-2 max-w-2xl font-heading text-2xl font-bold text-slate-950">{certificate.title}</h3>
        <div className="mt-auto grid w-full gap-6 pt-10 text-left sm:grid-cols-3">
          <div><p className="text-xs uppercase tracking-widest text-slate-500">Issued by</p><p className="mt-2 font-semibold text-slate-900">{certificate.issuer || "PCMO"}</p></div>
          <div><p className="text-xs uppercase tracking-widest text-slate-500">Credential ID</p><p className="mt-2 break-all font-semibold text-slate-900">{certificate.credential_id || "Pending"}</p></div>
          <div><p className="text-xs uppercase tracking-widest text-slate-500">Issue date</p><p className="mt-2 font-semibold text-slate-900">{formatDate(certificate.issue_date)}</p></div>
        </div>
        <div className="mt-8 flex w-full flex-wrap items-end justify-between gap-6">
          <div className="text-left"><div className="h-px w-48 bg-slate-400" /><p className="mt-2 text-sm font-semibold text-slate-900">Authorized Signature</p><p className="text-xs text-slate-500">PCMO Certification Office</p></div>
          <div className="flex items-center gap-2 rounded-full border border-success/30 px-4 py-2 text-sm font-semibold text-success"><ShieldCheck className="h-4 w-4" />{certificate.status}</div>
        </div>
      </div>
    </div>
  </div>
);

const BadgePreview = ({ certificate }: { certificate: Certification }) => (
  <div className="grid place-items-center rounded-lg border border-border bg-slate-50 p-8">
    <div className="grid aspect-square w-full max-w-sm place-items-center rounded-[2rem] bg-white p-8 text-center shadow-sm">
      <div className="grid h-56 w-56 place-items-center rounded-full bg-white p-5 ring-[12px] ring-warning/80">
        <PcmoLogo compact className="h-44 w-44" />
      </div>
      <div>
        <p className="mt-6 font-heading text-3xl font-bold text-primary">Certified</p>
        <p className="mt-2 text-sm font-semibold text-slate-900">{certificate.title}</p>
        <p className="mt-3 text-sm text-slate-600">{recipient(certificate)}</p>
        <p className="mt-2 text-xs text-slate-500">{certificate.credential_id || "Credential pending"}</p>
      </div>
    </div>
  </div>
);

const BrochurePreview = ({ certificate }: { certificate: Certification }) => (
  <div className="overflow-hidden rounded-lg border border-border bg-white text-slate-950 shadow-sm">
    <div className="bg-primary p-8 text-primary-foreground">
      <PcmoLogo light className="h-20 w-80 max-w-full" />
      <p className="mt-5 text-xs font-semibold uppercase tracking-[0.3em] opacity-80">PCMO Credential</p>
      <h2 className="mt-3 font-heading text-3xl font-bold">Certification Brochure</h2>
      <p className="mt-2 text-sm opacity-90">{certificate.title}</p>
    </div>
    <div className="grid gap-8 p-8 sm:grid-cols-[1.2fr_0.8fr]">
      <div>
        <p className="text-xs uppercase tracking-widest text-slate-500">Awarded to</p>
        <h3 className="mt-2 font-heading text-3xl font-bold text-primary">{recipient(certificate)}</h3>
        <p className="mt-2 font-medium text-slate-700">{designation(certificate)}</p>
        <p className="mt-6 text-sm leading-7 text-slate-600">This credential recognizes successful completion of the course requirements and assessment. It may be shared with employers, clients, and professional networks as evidence of learning achievement.</p>
      </div>
      <div className="rounded-lg border border-border bg-slate-50 p-5">
        <p className="text-sm font-semibold text-slate-900">Credential Details</p>
        <dl className="mt-4 space-y-3 text-sm">
          <div><dt className="text-slate-500">Issuer</dt><dd className="font-semibold">{certificate.issuer || "PCMO"}</dd></div>
          <div><dt className="text-slate-500">Credential ID</dt><dd className="break-all font-semibold">{certificate.credential_id || "Pending"}</dd></div>
          <div><dt className="text-slate-500">Issue date</dt><dd className="font-semibold">{formatDate(certificate.issue_date)}</dd></div>
          <div><dt className="text-slate-500">Expiry</dt><dd className="font-semibold">{certificate.expiry_date ? formatDate(certificate.expiry_date) : "No expiry"}</dd></div>
        </dl>
      </div>
    </div>
  </div>
);

const PreviewContent = ({ mode, certificate }: { mode: PreviewMode; certificate: Certification }) => {
  if (mode === "badge") return <BadgePreview certificate={certificate} />;
  if (mode === "brochure") return <BrochurePreview certificate={certificate} />;
  return <CertificatePreview certificate={certificate} />;
};

const Certifications = () => {
  const [preview, setPreview] = useState<{ mode: PreviewMode; certificate: Certification } | null>(null);
  const queryClient = useQueryClient();
  const certifications = useQuery({ queryKey: ["certifications"], queryFn: () => resourceApi.list<Certification>("certifications", { limit: 100 }) });
  const courses = useQuery({ queryKey: ["courses"], queryFn: () => api<LiveCourse[]>("/api/courses") });
  const enroll = useMutation({
    mutationFn: (id: string) => api(`/api/courses/${id}/enroll`, { method: "POST" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["courses"] }),
  });

  const openPreview = (mode: PreviewMode, certificate: Certification) => setPreview({ mode, certificate });

  return (
    <DashboardLayout>
      <div className="max-w-5xl space-y-6">
        <h1 className="font-heading text-2xl font-bold">Certifications</h1>
        <section className="space-y-3">
          <h2 className="font-heading text-lg font-bold">My certificates</h2>
          {certifications.data?.rows.map((certificate) => (
            <article key={certificate.id} className="rounded-xl border border-border bg-card p-5">
              <div className="flex flex-wrap items-center gap-4">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-warning/10"><Award className="h-5 w-5 text-warning" /></div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold">{certificate.title}</h3>
                  <p className="mt-1 text-sm text-foreground">{recipient(certificate)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{designation(certificate)} - {certificate.credential_id || "Credential pending"} - {certificate.status}</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground"><CalendarDays className="h-4 w-4" />{formatDate(certificate.issue_date)}</div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => openPreview("certificate", certificate)}><Eye className="h-4 w-4" /> Certificate</Button>
                <Button variant="outline" size="sm" onClick={() => downloadCertificatePdf(certificate)}><Download className="h-4 w-4" /> Certificate</Button>
                <Button variant="outline" size="sm" onClick={() => openPreview("badge", certificate)}><Medal className="h-4 w-4" /> Badge</Button>
                <Button variant="outline" size="sm" onClick={() => downloadBadgeSvg(certificate)}><Download className="h-4 w-4" /> Badge</Button>
                <Button variant="outline" size="sm" onClick={() => openPreview("brochure", certificate)}><FileText className="h-4 w-4" /> Brochure</Button>
                <Button variant="outline" size="sm" onClick={() => downloadBrochurePdf(certificate)}><Download className="h-4 w-4" /> Brochure</Button>
              </div>
            </article>
          ))}
          {!certifications.isLoading && !certifications.data?.rows.length && <p className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">No certificates have been issued to your account.</p>}
        </section>
        <section className="rounded-xl border border-border bg-card p-6">
          <h2 className="font-heading text-lg font-bold">Available certification courses</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {courses.data?.map((course) => (
              <article key={course.id} className="rounded-xl border border-border p-4">
                <h3 className="font-semibold">{course.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{course.level} - {course.credits} credits - {course.duration}</p>
                <Button className="mt-3" size="sm" disabled={Boolean(course.enrollment_status) || enroll.isPending} onClick={() => enroll.mutate(course.id)}>
                  {course.enrollment_status ? "Enrolled" : "Enroll"}
                </Button>
              </article>
            ))}
            {!courses.isLoading && !courses.data?.length && <p className="text-sm text-muted-foreground">No certification courses are currently published.</p>}
          </div>
        </section>
      </div>
      <Dialog open={Boolean(preview)} onOpenChange={(open) => !open && setPreview(null)}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-5xl">
          <DialogHeader><DialogTitle>{preview?.mode === "badge" ? "Badge" : preview?.mode === "brochure" ? "Brochure" : "Certificate"}</DialogTitle></DialogHeader>
          {preview && <PreviewContent mode={preview.mode} certificate={preview.certificate} />}
          {preview && (
            <div className="flex flex-wrap justify-end gap-2">
              {preview.mode === "certificate" && <Button onClick={() => downloadCertificatePdf(preview.certificate)}><Download className="h-4 w-4" /> Download certificate</Button>}
              {preview.mode === "badge" && <Button onClick={() => downloadBadgeSvg(preview.certificate)}><Download className="h-4 w-4" /> Download badge</Button>}
              {preview.mode === "brochure" && <Button onClick={() => downloadBrochurePdf(preview.certificate)}><Download className="h-4 w-4" /> Download brochure</Button>}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Certifications;
