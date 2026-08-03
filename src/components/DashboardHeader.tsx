import { useNavigate } from "react-router-dom";
import { Bell, Search, LogOut, Home } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { resourceApi } from "@/lib/api";
import PcmoLogo from "@/components/PcmoLogo";
import ThemeSwitcher from "@/components/ThemeSwitcher";

type Notification = { id: string; read_at?: string | null };

const DashboardHeader = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";
  const displayName = user?.display_name || user?.email?.split("@")[0] || "User";
  const initials = displayName.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  const notifications = useQuery({
    queryKey: ["notifications", "header"],
    queryFn: () => resourceApi.list<Notification>("notifications", { limit: 100 }),
    enabled: Boolean(user),
  });
  const unreadCount = notifications.data?.rows.filter((notification) => !notification.read_at).length ?? 0;

  return (
    <header className="bg-primary px-6 py-0 flex flex-col">
      <div className="flex items-center justify-between h-14">
        <div className="flex items-center gap-2">
          <PcmoLogo light showTagline={false} className="h-8 w-32" />
          <span className="hidden sm:inline-flex rounded-md bg-primary-foreground/10 px-2 py-1 text-xs font-medium text-primary-foreground/80">
            {isAdmin ? "Admin Console" : "Student Portal"}
          </span>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="ml-1 inline-flex items-center gap-1.5 rounded-md border border-primary-foreground/15 px-2.5 py-1.5 text-xs font-medium text-primary-foreground/80 transition hover:bg-primary-foreground/10 hover:text-primary-foreground"
            title="Visit PCMO website"
          >
            <Home className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Visit Website</span>
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-primary-foreground/40" />
            <input
              placeholder="Search..."
              className="pl-9 pr-3 py-2 text-xs rounded-lg bg-primary-foreground/10 border border-primary-foreground/15 text-primary-foreground placeholder:text-primary-foreground/40 outline-none focus:border-primary-foreground/30 w-44"
            />
          </div>

          <button
            className="relative p-2 rounded-lg hover:bg-primary-foreground/10 transition-colors"
            type="button"
            onClick={() => navigate("/notifications")}
            aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
          >
            <Bell className="w-4.5 h-4.5 text-primary-foreground/80" />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-foreground">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          <div className="flex items-center gap-4 ml-1">
            <div className="hidden sm:block">
              <ThemeSwitcher />
            </div>

            <div className="flex items-center gap-2">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt={displayName} className="h-8 w-8 rounded-full border border-primary-foreground/20 object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary-foreground/20 flex items-center justify-center text-xs font-semibold text-primary-foreground">{initials}</div>
              )}

              <span className="text-sm text-primary-foreground hidden md:block">{displayName}</span>

              <button
                type="button"
                title="Sign out"
                onClick={() => {
                  logout();
                  navigate("/login");
                }}
                className="rounded p-1 text-primary-foreground/70 hover:bg-primary-foreground/10"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
