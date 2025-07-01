import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function Sidebar() {
  const { logout, user } = useAuth();
  const location = useLocation();

  const [pendingCount, setPendingCount] = useState(0);
  const [isOpnameOpen, setIsOpnameOpen] = useState(
    location.pathname.startsWith("/opname")
  );
  const [isHistoriOpen, setIsHistoriOpen] = useState(
    location.pathname.startsWith("/logs") ||
      location.pathname.startsWith("/spec-history")
  );

  const menuItems = [
    { label: "Dashboard", path: "/dashboard", icon: "🏠" },
    { label: "Computers", path: "/computers", icon: "👤" },
    { label: "Analytics", path: "/analytics", icon: "📊" },
    // { label: "Settings", path: "/settings", icon: "⚙️" },
    { label: "Update Timeout", path: "/update-timeout", icon: "⏱️" },
    { label: "Agent Updates", path: "/agent-updates", icon: "🔄" },
  ];

  useEffect(() => {
    const fetchPending = async () => {
      if (!user || (user.role !== "admin" && user.role !== "superadmin"))
        return;

      try {
        const token = localStorage.getItem("token");
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/spec-history`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const data = await res.json();
        if (Array.isArray(data)) {
          const pending = data.filter(
            (item) => !item.approved && !item.rejected
          );
          setPendingCount(pending.length);
        } else {
          console.warn("❌ Data spec-history bukan array:", data);
        }
      } catch (err) {
        console.error("❌ Gagal fetch spec history:", err);
      }
    };

    fetchPending();
  }, [user]);

  return (
    <div className="w-64 h-screen overflow-y-auto bg-zinc-900 text-white p-4 space-y-6">
      <h1 className="text-xl font-bold">SMART MONITORING</h1>
      <nav className="space-y-2">
        {/* Menu umum */}
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex justify-between items-center p-2 rounded ${
              location.pathname === item.path
                ? "bg-zinc-800 font-semibold"
                : "hover:bg-zinc-800"
            }`}
          >
            <span>
              {item.icon} {item.label}
            </span>
          </Link>
        ))}

        {/* Dropdown Histori (Log + Spec) */}
        {(user?.role === "admin" || user?.role === "superadmin") && (
          <div className="space-y-1">
            <button
              onClick={() => setIsHistoriOpen(!isHistoriOpen)}
              className="w-full flex justify-between items-center p-2 rounded hover:bg-zinc-800"
            >
              <span>📂 History</span>
              <span>{isHistoriOpen ? "▾" : "▸"}</span>
            </button>

            {isHistoriOpen && (
              <div className="ml-4 space-y-1">
                {user?.role === "superadmin" && (
                  <Link
                    to="/logs"
                    className={`block p-2 rounded ${
                      location.pathname === "/logs"
                        ? "bg-zinc-800 font-semibold"
                        : "hover:bg-zinc-800"
                    }`}
                  >
                    📜 Log History
                  </Link>
                )}

                <Link
                  to="/spec-history"
                  className={`flex justify-between items-center p-2 rounded ${
                    location.pathname === "/spec-history"
                      ? "bg-zinc-800 font-semibold"
                      : "hover:bg-zinc-800"
                  }`}
                >
                  <span>📝 Spec History</span>
                  {pendingCount > 0 && (
                    <span className="ml-2 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      {pendingCount}
                    </span>
                  )}
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Dropdown Opname */}
        {(user?.role === "admin" || user?.role === "superadmin") && (
          <div className="space-y-1">
            <button
              onClick={() => setIsOpnameOpen(!isOpnameOpen)}
              className="w-full flex justify-between items-center p-2 rounded hover:bg-zinc-800"
            >
              <span>📁 Opname</span>
              <span>{isOpnameOpen ? "▾" : "▸"}</span>
            </button>

            {isOpnameOpen && (
              <div className="ml-4 space-y-1">
                <Link
                  to="/opname"
                  className={`block p-2 rounded ${
                    location.pathname === "/opname"
                      ? "bg-zinc-800 font-semibold"
                      : "hover:bg-zinc-800"
                  }`}
                >
                  📄 Laporan Opname
                </Link>
                <Link
                  to="/opname/create"
                  className={`block p-2 rounded ${
                    location.pathname === "/opname/create"
                      ? "bg-zinc-800 font-semibold"
                      : "hover:bg-zinc-800"
                  }`}
                >
                  ➕ Buat Laporan
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Users only for superadmin */}
        {user?.role === "superadmin" && (
          <Link
            to="/users"
            className={`flex items-center p-2 rounded ${
              location.pathname === "/users"
                ? "bg-zinc-800 font-semibold"
                : "hover:bg-zinc-800"
            }`}
          >
            <span>👥 Users</span>
          </Link>
        )}

        {/* Logout */}
        <button
          onClick={logout}
          className="w-full text-left p-2 rounded hover:bg-zinc-800"
        >
          ⏻ Logout
        </button>
      </nav>
    </div>
  );
}
