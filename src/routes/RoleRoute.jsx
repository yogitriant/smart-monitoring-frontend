import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function RoleRoute({ allowedRoles = [], children }) {
  const { user } = useAuth();
  const location = useLocation();

  // ⛔ Belum login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // ⛔ Login tapi tidak punya izin
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/forbidden" replace />;
  }

  // ✅ Role cocok
  return children;
}
