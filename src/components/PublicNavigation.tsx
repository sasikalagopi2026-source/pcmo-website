import { useQuery } from "@tanstack/react-query";
import { ChevronDown, Menu, X } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import PcmoLogo from "@/components/PcmoLogo";
import PublicAccountNav from "@/components/PublicAccountNav";
import { navigationGroups, type PublicPageSummary } from "@/lib/publicNavigation";

const PublicNavigation = ({ active = "" }: { active?: string }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileGroup, setMobileGroup] = useState<string | null>(null);
  const query = useQuery({
    queryKey: ["public-navigation-pages"],
    queryFn: async () => {
      const response = await fetch("/api/public/pages");
      if (!response.ok) throw new Error("Navigation is unavailable");
      return response.json() as Promise<PublicPageSummary[]>;
    },
    staleTime: 60_000,
  });
  const pageBySlug = new Map((query.data ?? []).map((page) => [page.slug, page]));
  const closeMobileMenu = () => {
    setMobileOpen(false);
    setMobileGroup(null);
  };

  return <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
    <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-4 px-5 py-3">
      <Link to="/" aria-label="PCMO home"><PcmoLogo className="h-12 w-48" /></Link>
      <button type="button" className="grid h-10 w-10 place-items-center rounded-lg border text-[#0b3764] lg:hidden" onClick={() => { setMobileOpen((open) => !open); setMobileGroup(null); }} aria-label="Toggle navigation" aria-expanded={mobileOpen}>{mobileOpen ? <X className="h-5 w-5"/> : <Menu className="h-5 w-5"/>}</button>
      <nav className={`${mobileOpen ? "flex" : "hidden"} absolute inset-x-0 top-full z-40 max-h-[calc(100dvh-5rem)] flex-col overflow-y-auto overscroll-contain border-t bg-white p-5 shadow-xl lg:static lg:flex lg:max-h-none lg:flex-row lg:items-center lg:gap-1 lg:overflow-visible lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none`}>
        <Link to="/" onClick={closeMobileMenu} className={`rounded px-4 py-3 text-sm font-bold transition hover:bg-[#082b5c] hover:text-white ${active === "home" ? "bg-[#082b5c] text-white" : "text-slate-900"}`}>Home</Link>
        <Link to="/pages/about" onClick={closeMobileMenu} className={`rounded px-4 py-3 text-sm font-bold transition hover:bg-[#082b5c] hover:text-white ${active === "about" ? "bg-[#082b5c] text-white" : "text-slate-900"}`}>About Us</Link>
        {navigationGroups.map((group) => <div key={group.label} className="group/nav relative">
          <div className={`flex items-center rounded transition hover:bg-[#082b5c] hover:text-white ${active === group.label.toLowerCase() ? "bg-[#082b5c] text-white" : "text-slate-900"}`}><Link to={group.href} onClick={closeMobileMenu} className="flex-1 px-4 py-3 text-sm font-bold">{group.label}</Link><button type="button" className="grid h-11 w-12 place-items-center lg:hidden" onClick={() => setMobileGroup((current) => current === group.label ? null : group.label)} aria-label={`Toggle ${group.label} menu`} aria-expanded={mobileGroup === group.label}><ChevronDown className={`h-4 w-4 transition ${mobileGroup === group.label ? "rotate-180" : ""}`}/></button><ChevronDown className="mr-3 hidden h-3.5 w-3.5 transition group-hover/nav:rotate-180 lg:block"/></div>
          <div className={`${mobileGroup === group.label ? "block" : "hidden"} z-50 mt-1 rounded-xl border bg-slate-50 p-4 lg:invisible lg:absolute lg:left-1/2 lg:top-full lg:mt-0 lg:block lg:max-h-[calc(100dvh-5rem)] lg:max-w-[calc(100vw-2rem)] lg:translate-y-2 lg:overflow-y-auto lg:overscroll-contain lg:rounded-b-xl lg:border-t-4 lg:border-[#082b5c] lg:bg-white lg:p-7 lg:opacity-0 lg:shadow-2xl lg:transition lg:duration-200 lg:group-hover/nav:visible lg:group-hover/nav:translate-y-0 lg:group-hover/nav:opacity-100 ${group.label === "Resources" || group.label === "Connect" ? "lg:left-auto lg:right-0 lg:translate-x-0" : "lg:-translate-x-1/2"} ${group.sections.length === 3 ? "lg:w-[1080px]" : "lg:w-[760px]"}`}>
            <div className={`grid gap-8 ${group.sections.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-2"}`}>
              {group.sections.map((section) => <section key={section.title}>
                <h2 className="border-b-2 border-slate-100 pb-3 text-sm font-extrabold capitalize text-slate-900">{section.title}</h2>
                <div className="mt-2 grid">{section.slugs.map((slug) => { const page = pageBySlug.get(slug); if (!page) return null; return <Link key={slug} to={`/pages/${slug}`} onClick={closeMobileMenu} className="group/item border-b border-dashed border-slate-200 px-3 py-3 text-sm leading-5 text-slate-700 transition hover:bg-white hover:pl-5 hover:text-red-600 lg:hover:bg-slate-50"><span className="font-semibold">{page.menu_label || page.title}</span>{page.summary && <span className="mt-1 hidden line-clamp-1 text-xs font-normal text-slate-400 xl:block">{page.summary}</span>}</Link>; })}</div>
              </section>)}
            </div>
          </div>
        </div>)}
        <PublicAccountNav />
      </nav>
    </div>
  </header>;
};

export default PublicNavigation;
