import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function PrivateRoute({ children }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    // ⛔ Belum login: redirect ke /login, simpan lokasi terakhir
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // ✅ Sudah login: izinkan akses
  return children;
}
