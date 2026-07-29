import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";

const AdminLogout = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    logout();
    navigate("/login", { replace: true });
  }, [logout, navigate]);

  return (
    <DashboardLayout>
      <p className="text-sm text-muted-foreground">Signing out...</p>
    </DashboardLayout>
  );
};

export default AdminLogout;
