import { ArrowRight, Facebook, Instagram, Linkedin, Mail, Phone, Youtube } from "lucide-react";
import { Link } from "react-router-dom";
import PcmoLogo from "@/components/PcmoLogo";

const PinterestIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 16 16" fill="currentColor" className={className} aria-hidden="true">
    <path d="M8 0a8 8 0 0 0-2.915 15.452c-.07-.633-.132-1.606.027-2.297.145-.625.938-3.977.938-3.977s-.239-.479-.239-1.187c0-1.113.645-1.943 1.448-1.943.682 0 1.012.512 1.012 1.127 0 .686-.437 1.713-.663 2.664-.188.797.399 1.446 1.185 1.446 1.423 0 2.517-1.5 2.517-3.664 0-1.915-1.377-3.254-3.342-3.254-2.276 0-3.61 1.707-3.61 3.471 0 .688.265 1.425.595 1.826.065.079.075.148.055.228-.061.252-.196.796-.223.907-.035.146-.116.177-.268.107-1.001-.466-1.627-1.931-1.627-3.108 0-2.53 1.839-4.852 5.302-4.852 2.783 0 4.946 1.983 4.946 4.63 0 2.761-1.741 4.984-4.159 4.984-.812 0-1.576-.422-1.837-.92l-.498 1.902c-.181.695-.669 1.566-.995 2.097A8 8 0 1 0 8 0z" />
  </svg>
);

const XIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.451-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
  </svg>
);

const socialLinks = [
  { label: "LinkedIn", href: "https://www.linkedin.com/company/project-contracts-management-organisation/", icon: Linkedin },
  { label: "X (formerly Twitter)", href: "https://twitter.com/PCMO155970", icon: XIcon },
  { label: "YouTube", href: "https://youtube.com/@PCMOTRENDS?si=vkF1YTBq6W-BjpKn", icon: Youtube },
  { label: "Facebook", href: "https://www.facebook.com/profile.php?id=61561685613263", icon: Facebook },
  { label: "Instagram", href: "https://www.instagram.com/infopcmoworld/", icon: Instagram },
  { label: "Pinterest", href: "https://in.pinterest.com/infopcmoworld/", icon: PinterestIcon },
];

const groups = [
  { title: "Explore", links: [["About PCMO", "/pages/about"], ["Certifications", "/pages/certifications"], ["Events & Webinars", "/pages/events"], ["Resources", "/library"]] },
  { title: "Membership", links: [["Membership Packages", "/pages/membership_packages"], ["Student Membership", "/pages/student_membership"], ["Individual Membership", "/pages/individual_membership"], ["Group Membership", "/pages/group_membership"]] },
  { title: "Support", links: [["Contact Us", "/contact"], ["Frequently Asked Questions", "/pages/faqs"], ["Sitemap", "/pages/sitemap"], ["Privacy Policy", "/pages/privacy"], ["Terms & Conditions", "/pages/terms"]] },
];

const PublicFooter = () => (
  <footer className="relative overflow-hidden bg-[#061c35] text-white">
    <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full border-[60px] border-red-600/10" />
    <div className="border-b border-white/10 bg-[#0b3764]">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 py-8 text-center md:flex-row md:text-left">
        <div><p className="text-xs font-bold uppercase tracking-[.22em] text-red-400">Advance your career</p><h2 className="mt-2 text-2xl font-extrabold">Become part of the global PCMO community.</h2></div>
        <Link to="/login?mode=register" className="inline-flex shrink-0 items-center gap-2 rounded bg-red-600 px-6 py-3 font-bold shadow-lg transition hover:-translate-y-1 hover:bg-red-700">Join PCMO <ArrowRight className="h-4 w-4" /></Link>
      </div>
    </div>
    <div className="relative mx-auto grid max-w-7xl gap-10 px-6 py-14 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
      <div><PcmoLogo light className="h-14 w-52"/><p className="mt-5 max-w-sm text-sm leading-7 text-white/60">Supporting professional excellence through globally relevant learning, certification, membership, collaboration, and practical industry knowledge.</p><div className="mt-6 flex flex-wrap gap-3">{socialLinks.map(({ label, href, icon: Icon }) => <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={`PCMO on ${label}`} title={label} className="grid h-9 w-9 place-items-center rounded-full border border-white/15 text-white/65 transition hover:border-red-500 hover:bg-red-600 hover:text-white"><Icon className="h-4 w-4"/></a>)}</div></div>
      {groups.map(group => <div key={group.title}><h3 className="font-bold">{group.title}</h3><div className="mt-5 grid gap-3 text-sm text-white/55">{group.links.map(([label, to]) => <Link key={label} to={to} className="transition hover:translate-x-1 hover:text-red-400">{label}</Link>)}</div></div>)}
    </div>
    <div className="relative border-t border-white/10"><div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-6 text-xs text-white/55 sm:flex-row sm:justify-between"><a href="tel:+447534256469" className="flex items-center gap-2"><Phone className="h-4 w-4 text-red-500"/>+44 753 425 6469</a><a href="mailto:info@pcmo.world" className="flex items-center gap-2"><Mail className="h-4 w-4 text-red-500"/>info@pcmo.world</a></div></div>
    <div className="border-t border-white/10 bg-black/15"><div className="mx-auto flex max-w-7xl flex-col justify-between gap-2 px-6 py-5 text-center text-[11px] text-white/40 sm:flex-row"><span>Copyright © 2026 PCMO. All Rights Reserved.</span><span>Project & Contracts Management Organisation</span></div></div>
  </footer>
);

export default PublicFooter;
