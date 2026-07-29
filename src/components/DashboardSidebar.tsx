import {
  Award,
  BellRing,
  BookOpen,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  Clock,
  CreditCard,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Library,
  LogOut,
  MessageSquare,
  Settings,
  Sparkles,
  User,
  Users,
  Video,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import PcmoLogo from "@/components/PcmoLogo";
import { resourceApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

const studentNavItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: CreditCard, label: "Membership", path: "/membership" },
  { icon: Award, label: "My Certifications", path: "/certifications", hasArrow: true },
  { icon: GraduationCap, label: "Certification Quiz", path: "/certification-quiz" },
  { icon: CalendarDays, label: "My Events", path: "/events" },
  { icon: Users, label: "Networking Events", path: "/networking-events" },
  { icon: Video, label: "Webinars", path: "/webinars" },
  { icon: BookOpen, label: "Bookstore", path: "/bookstore" },
  { icon: Library, label: "Library", path: "/library" },
  { icon: CreditCard, label: "Subscriptions", path: "/subscriptions" },
  { icon: Users, label: "Career Navigator", path: "/career-navigator" },
  { icon: Settings, label: "Account", path: "/account", hasArrow: true },
  { icon: User, label: "Community Profile", path: "/community-profile" },
  { icon: MessageSquare, label: "Volunteer", path: "/volunteer" },
];

const customAdminSections = [
  {
    label: "Admin",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
    ],
  },
  {
    label: "Education",
    items: [
      { icon: BookOpen, label: "Courses", path: "/admin/education/courses" },
      { icon: GraduationCap, label: "Quizzes", path: "/admin/quizzes" },
      { icon: Award, label: "Certificates", path: "/admin/certificates" },
      { icon: Users, label: "Enrollment", path: "/admin/enrollment" },
      { icon: BellRing, label: "Course Reminders", path: "/admin/reminders" },
      { icon: GraduationCap, label: "Learning Tracker", path: "/admin/incorrect-answers" },
    ],
  },
  {
    label: "Users",
    items: [
      { icon: Users, label: "Users", path: "/admin/users" },
      { icon: Users, label: "Memberships", path: "/admin/manage/memberships" },
      { icon: User, label: "Member Projects", path: "/admin/manage/member-projects" },
      { icon: Award, label: "Member Badges", path: "/admin/manage/member-badges" },
      { icon: MessageSquare, label: "Recommendations", path: "/admin/manage/member-recommendations" },
      { icon: Users, label: "Connections", path: "/admin/manage/member-connections" },
      { icon: Sparkles, label: "Volunteer Opportunities", path: "/admin/manage/volunteering" },
      { icon: ClipboardList, label: "Volunteer Applications", path: "/admin/manage/volunteer-applications" },
      { icon: Clock, label: "Volunteer Hours", path: "/admin/manage/volunteer-hour-logs" },
    ],
  },
  {
    label: "CRM",
    items: [
      { icon: MessageSquare, label: "Contact Messages", path: "/admin/contacts" },
    ],
  },
  {
    label: "Content",
    items: [
      { icon: Library, label: "Library Management", path: "/admin/library" },
      { icon: FileText, label: "Blog", path: "/admin/content/blog" },
      { icon: FileText, label: "Pages", path: "/admin/content/pages" },
      { icon: FileText, label: "Homepage", path: "/admin/content/homepage" },
      { icon: Settings, label: "Website Settings", path: "/admin/content/settings" },
      { icon: FileText, label: "Menus & Navigation", path: "/admin/content/navigation" },
      { icon: FileText, label: "Content Blocks", path: "/admin/content/blocks" },
      { icon: FileText, label: "FAQs", path: "/admin/content/faqs" },
      { icon: MessageSquare, label: "Community Conversations", path: "/admin/manage/community-posts" },
      { icon: MessageSquare, label: "Conversation Replies", path: "/admin/manage/post-comments" },
      { icon: FileText, label: "Navigation & Detail Pages", path: "/admin/content/additional_pages" },
      { icon: Users, label: "Testimonials", path: "/admin/content/testimonials" },
      { icon: Settings, label: "Localization", path: "/admin/content/localization" },
    ],
  },
  {
    label: "Financial",
    items: [
      { icon: CreditCard, label: "Balances", path: "/admin/financial/balances" },
      { icon: CreditCard, label: "Sales List", path: "/admin/financial/sales" },
      { icon: CreditCard, label: "Subscribe", path: "/admin/financial/subscribe" },
      { icon: CreditCard, label: "Membership Plans", path: "/admin/manage/membership-plans" },
      { icon: Users, label: "Expert Rooms", path: "/admin/manage/expert-rooms" },
      { icon: CalendarDays, label: "Room Reservations", path: "/admin/manage/expert-room-reservations" },
      { icon: Users, label: "Community Chat Rooms", path: "/admin/community-chat" },
      { icon: MessageSquare, label: "Chat Moderation", path: "/admin/manage/community-chat-messages" },
      { icon: Sparkles, label: "AI Reply Audit", path: "/admin/manage/ai-chat-replies" },
      { icon: CreditCard, label: "Subscriptions", path: "/admin/manage/subscriptions" },
      { icon: CreditCard, label: "Invoices", path: "/admin/manage/invoices" },
    ],
  },
  {
    label: "Marketing",
    items: [
      { icon: CreditCard, label: "Course Discounts", path: "/admin/marketing/course-discounts" },
      { icon: BellRing, label: "Advertising Modal", path: "/admin/advertising_modal" },
    ],
  },
  {
    label: "Settings",
    items: [
      { icon: Settings, label: "Settings", path: "/admin/settings" },
      { icon: Settings, label: "Admin Modules", path: "/admin/modules" },
      { icon: LogOut, label: "Logout", path: "/admin/logout" },
    ],
  },
];

const DashboardSidebar = () => {
  const location = useLocation();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";
  const modules = useQuery({
    queryKey: ["resource", "admin-modules", "navigation"],
    queryFn: () => resourceApi.list<{ id: string; section: string; title: string; slug: string; active: number }>("admin-modules", { limit: 100 }),
    enabled: isAdmin,
  });
  const configuredSections = Object.values(
    (modules.data?.rows ?? []).filter((module) => Boolean(module.active)).reduce<Record<string, { label: string; items: Array<{ icon: typeof BookOpen; label: string; path: string }> }>>((sections, module) => {
      const section = sections[module.section] ?? { label: module.section, items: [] };
      section.items.push({ icon: BookOpen, label: module.title, path: `/admin/${module.slug}` });
      sections[module.section] = section;
      return sections;
    }, {}),
  );
  const configuredPaths = new Set(customAdminSections.flatMap((section) => section.items.map((item) => item.path)));
  const extraConfiguredSections = configuredSections
    .map((section) => ({ ...section, items: section.items.filter((item) => !configuredPaths.has(item.path)) }))
    .filter((section) => section.items.length > 0);
  const adminNavSections = [...customAdminSections, ...extraConfiguredSections];

  return (
    <aside className="w-60 bg-card min-h-screen flex flex-col border-r border-border hidden md:flex">
      <div className="px-5 pt-6 pb-4">
        <PcmoLogo showTagline={false} className="h-9 w-36" />
        <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">{isAdmin ? "Admin" : "Student"}</p>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 pb-6">
        {!isAdmin &&
          studentNavItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) =>
                `w-full flex items-center justify-between px-3 py-2.5 text-sm transition-all rounded-lg mb-0.5 group ${
                  isActive
                    ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                    : "text-foreground/70 hover:bg-secondary hover:text-foreground"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className="flex items-center gap-3">
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </span>
                  {item.hasArrow && <ChevronRight className={`w-3.5 h-3.5 ${isActive ? "text-primary-foreground/70" : "text-muted-foreground"}`} />}
                </>
              )}
            </NavLink>
          ))}

        {isAdmin &&
          adminNavSections.map((section) => (
            <div key={section.label} className="mb-5">
              <p className="px-3 pb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">{section.label}</p>
              {section.items.map((item) => (
                <NavLink
                  key={item.label}
                  to={item.path}
                  end={item.path === "/admin"}
                  className={({ isActive }) =>
                    `w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-all rounded-lg mb-0.5 group ${
                      isActive || (item.path.includes("#") && location.hash && item.path.endsWith(location.hash))
                        ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                        : "text-foreground/70 hover:bg-secondary hover:text-foreground"
                    }`
                  }
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
      </nav>
    </aside>
  );
};

export default DashboardSidebar;
