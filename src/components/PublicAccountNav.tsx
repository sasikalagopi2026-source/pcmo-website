import { Bell, ChevronDown, LogOut, UserRound } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const studentLinks = [
  ["Dashboard", "/dashboard"], ["Certifications", "/certifications"], ["Learning", "/courses"],
  ["Membership", "/membership"], ["Events", "/events"], ["Community", "/community-profile"],
  ["Volunteer", "/volunteer"], ["Account Settings", "/account"],
] as const;
const adminLinks = [
  ["Admin Dashboard", "/admin"], ["Users", "/admin/users"], ["Courses", "/admin/education/courses"],
  ["Community Chat", "/admin/community-chat"], ["Community Conversations", "/admin/manage/community-posts"],
  ["Content Management", "/admin/content/pages"], ["Notifications", "/notifications"],
] as const;

const PublicAccountNav = () => {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  if (loading) return <div className="h-10 w-36 animate-pulse rounded-lg bg-slate-100"/>;
  if (!user) return <><Link to="/login" className="rounded border border-[#0b3764] px-4 py-2">Log in</Link><Link to="/login?mode=register" className="rounded bg-[#0b3764] px-4 py-2 text-white transition hover:bg-red-600">Register</Link></>;

  const name = user.display_name || user.email.split("@")[0];
  const isAdmin = user.role === "admin" || user.role === "super_admin";
  const portalLinks = isAdmin ? adminLinks : studentLinks;
  const initials = name.split(/\s+/).map(part => part[0]).join("").slice(0, 2).toUpperCase();
  return <div className="flex items-center gap-2">
    <Link to="/notifications" aria-label="Notifications" className="relative rounded-full p-2 transition hover:bg-slate-100"><Bell className="h-5 w-5"/><span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-600"/></Link>
    <div className="group/account relative py-2">
      <button type="button" className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition hover:bg-slate-50">
        {user.avatar_url ? <img src={user.avatar_url} alt={name} className="h-9 w-9 rounded-full border-2 border-slate-200 object-cover"/> : <span className="grid h-9 w-9 place-items-center rounded-full bg-[#0b3764] text-xs font-bold text-white">{initials || <UserRound className="h-4 w-4"/>}</span>}
        <span className="hidden max-w-32 truncate font-bold text-[#0b3764] lg:block">{name}</span><ChevronDown className="h-4 w-4 transition group-hover/account:rotate-180"/>
      </button>
      <div className="invisible absolute right-0 top-full z-[70] w-64 translate-y-2 rounded-2xl border border-slate-100 bg-white p-3 opacity-0 shadow-2xl transition duration-200 group-hover/account:visible group-hover/account:translate-y-0 group-hover/account:opacity-100">
        <div className="border-b px-3 pb-3"><p className="truncate font-bold text-[#0b3764]">{name}</p><p className="truncate text-xs font-normal text-slate-500">{user.email}</p><span className="mt-2 inline-flex rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">{isAdmin ? "Administrator" : "Student member"}</span></div>
        <div className="mt-2 grid gap-1">{portalLinks.map(([label, href]) => <Link key={href} to={href} className="rounded-lg px-3 py-2.5 font-medium text-slate-600 transition hover:bg-red-50 hover:text-red-600">{label}</Link>)}</div>
        <button type="button" onClick={() => { logout(); navigate("/"); }} className="mt-2 flex w-full items-center gap-2 border-t px-3 pt-3 text-left font-semibold text-red-600"><LogOut className="h-4 w-4"/>Log Out</button>
      </div>
    </div>
  </div>;
};

export default PublicAccountNav;
