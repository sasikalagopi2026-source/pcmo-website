import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const RequireAuth = ({ children, admin = false, student = false }: { children: React.ReactNode; admin?: boolean; student?: boolean }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">Loading account…</div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (admin && !["admin", "super_admin"].includes(user.role)) return <Navigate to="/dashboard" replace />;
  if (student && ["admin", "super_admin"].includes(user.role)) return <Navigate to="/admin" replace />;
  return children;
};

export default RequireAuth;
