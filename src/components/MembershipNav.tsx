import { ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

const fallbackPlans = [
  { name: "Student Membership", slug: "student-membership" }, { name: "Individual Professional", slug: "individual-membership" },
  { name: "Premium Professional", slug: "premium-membership" }, { name: "Team Membership", slug: "team-membership" },
  { name: "Corporate Membership", slug: "corporate-membership" }, { name: "Lifetime Membership", slug: "lifetime-membership" },
];

const networking = [
  ["Membership & Networking", "/pages/membership_and_networking"],
  ["Membership Community", "/pages/membership_community"],
  ["Job Community", "/pages/job_community"],
  ["Community Chat Rooms", "/pages/community_chat_rooms"],
  ["Upcoming Networking Events", "/pages/upcoming_networking_events"],
  ["Join the Conversation", "/pages/join_the_conversation"],
] as const;

const MembershipNav = ({ active = false }: { active?: boolean }) => {
  const query = useQuery({ queryKey: ["public-membership-plans"], queryFn: async () => { const response = await fetch("/api/public/membership-plans"); if (!response.ok) throw new Error("Plans unavailable"); return response.json() as Promise<Array<{ name: string; slug: string }>>; }, staleTime: 60_000 });
  const plans = query.data ?? fallbackPlans;
  return (
  <div className="group relative">
    <Link to="/pages/membership_and_networking" className={`inline-flex items-center gap-1 py-3 transition hover:text-red-600 ${active ? "text-red-600" : ""}`}>Membership <ChevronDown className="h-3.5 w-3.5 transition group-hover:rotate-180"/></Link>
    <div className="invisible absolute left-1/2 top-full z-50 w-[620px] max-w-[90vw] -translate-x-1/2 translate-y-2 rounded-xl border border-slate-100 bg-white p-5 opacity-0 shadow-2xl transition duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
      <div className="grid gap-6 sm:grid-cols-2">
        <div><p className="px-3 text-xs font-extrabold uppercase tracking-[.16em] text-red-600">Become a member</p><div className="mt-2 grid gap-1"><Link to="/pages/compare_all_memberships" className="rounded-lg bg-[#0b3764] px-3 py-2.5 text-sm font-bold text-white transition hover:bg-red-600">Compare All Memberships</Link>{plans.map((plan) => <Link key={plan.slug} to={`/membership-plans/${plan.slug}`} className="rounded-lg px-3 py-2 text-sm text-[#0b3764] transition hover:bg-red-50 hover:text-red-600">{plan.name}</Link>)}</div></div>
        <div><p className="px-3 text-xs font-extrabold uppercase tracking-[.16em] text-red-600">Networking at PCMO</p><div className="mt-2 grid gap-1">{networking.map(([name, href]) => <Link key={href} to={href} className="rounded-lg px-3 py-2 text-sm text-[#0b3764] transition hover:bg-red-50 hover:text-red-600">{name}</Link>)}</div></div>
      </div>
    </div>
  </div>
  );
};

export default MembershipNav;
