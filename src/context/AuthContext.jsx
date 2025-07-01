import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // ⬅️ baru ditambah

  useEffect(() => {
    try {
      const saved = localStorage.getItem("user");
      const parsed = saved ? JSON.parse(saved) : null;
      setUser(parsed);
    } catch {
      setUser(null);
    } finally {
      setLoading(false); // ⬅️ loading selesai
    }
  }, []);

  useEffect(() => {
    if (
      !loading &&
      !user &&
      location.pathname !== "/login" &&
      location.pathname !== "/register"
    ) {
      navigate("/login", { replace: true });
    }
  }, [user, loading, location.pathname, navigate]);

  const login = (userData, token) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    navigate("/login", { replace: true });
  };

  // ⏳ Tampilkan splash saat masih loading user
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        {/* Logo Institusi (opsional) */}
        <img
          src="/logo.svg" // ⬅️ Ganti dengan logo institusi kamu
          alt="Smart Monitoring"
          className="w-16 h-16 mb-4 animate-pulse"
        />

        {/* Spinner */}
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />

        <p className="mt-3 text-sm text-zinc-600">Memuat aplikasi...</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
