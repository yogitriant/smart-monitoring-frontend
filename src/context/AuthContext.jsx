import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [justLoggedIn, setJustLoggedIn] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("user");
      const parsed = saved ? JSON.parse(saved) : null;
      setUser(parsed);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (
      !loading &&
      !justLoggedIn &&
      (!user || !token) &&
      location.pathname !== "/login" &&
      location.pathname !== "/register"
    ) {
      navigate("/login", { replace: true });
    }
  }, [user, loading, location.pathname, navigate, justLoggedIn]);

  useEffect(() => {
    if (justLoggedIn) {
      const timer = setTimeout(() => setJustLoggedIn(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [justLoggedIn]);

  const login = (userData, token) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
    setJustLoggedIn(true);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    navigate("/login", { replace: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <img src="/logo.svg" alt="Smart Monitoring" className="w-16 h-16 mb-4 animate-pulse" />
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="mt-3 text-sm text-zinc-600">Memuat aplikasi...</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
