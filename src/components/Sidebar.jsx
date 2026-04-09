import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useSidebar } from "@/context/SidebarContext";
import {
  LayoutDashboard, Monitor, BarChart3, Timer, RefreshCw,
  FolderOpen, History, FileText, FilePlus, ScrollText,
  ClipboardList, Users, LogOut, ChevronDown, ChevronRight, X, Menu,
  Package, Database, Wrench, MapPin, Settings, TerminalSquare,
} from "lucide-react";

export default function Sidebar() {
  const { logout, user } = useAuth();
  const location = useLocation();
  const { isOpen, toggle } = useSidebar();

  const [pendingCount, setPendingCount] = useState(0);
  const [isOpnameOpen, setIsOpnameOpen] = useState(location.pathname.startsWith("/opname"));
  const [isHistoriOpen, setIsHistoriOpen] = useState(location.pathname.startsWith("/logs") || location.pathname.startsWith("/spec-history"));
  const [isMasterOpen, setIsMasterOpen] = useState(location.pathname.startsWith("/master-data"));

  const allMenuItems = [
    { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { label: "Computers", path: "/computers", icon: Monitor },
    { label: "Analytics", path: "/analytics", icon: BarChart3, roles: ["admin", "superadmin"] },
    { label: "Update Timeout", path: "/update-timeout", icon: Timer, roles: ["admin", "superadmin"] },
    { label: "Agent Updates", path: "/agent-updates", icon: RefreshCw, roles: ["admin", "superadmin"] },
    { label: "Scripts", path: "/scripts", icon: TerminalSquare, roles: ["admin", "superadmin"] },
    { label: "Assets", path: "/assets", icon: Package },
    { label: "Settings", path: "/settings", icon: Settings },
  ];

  const menuItems = allMenuItems.filter(
      (item) => !item.roles || item.roles.includes(user?.role)
  );

  useEffect(() => {
    const fetchPending = async () => {
      if (!user || (user.role !== "admin" && user.role !== "superadmin")) return;
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/spec-history`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (Array.isArray(data)) setPendingCount(data.filter((item) => !item.approved && !item.rejected).length);
      } catch (err) { console.error("❌ Gagal fetch spec history:", err); }
    };
    fetchPending();
  }, [user]);

  const isActive = (path) => location.pathname === path;

  const linkClass = (path) =>
    `flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-all duration-200 ${isActive(path)
      ? "bg-primary-600 text-white shadow-sm shadow-primary-600/25"
      : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
    }`;

  const iconClass = (path) =>
    `w-4 h-4 flex-shrink-0 ${isActive(path) ? "text-white" : "text-zinc-400"}`;

  // When sidebar is closed, render a floating hamburger button
  if (!isOpen) {
    return (
      <div className="w-12 h-screen bg-white border-r border-zinc-200/80 flex flex-col items-center pt-4 flex-shrink-0">
        <button
          onClick={toggle}
          className="p-2 rounded-lg hover:bg-zinc-100 transition-colors"
          title="Open sidebar"
        >
          <Menu className="w-5 h-5 text-zinc-600" />
        </button>
      </div>
    );
  }

  return (
    <div className="w-[200px] h-screen bg-white border-r border-zinc-200/80 flex flex-col flex-shrink-0">
      {/* Brand + Close */}
      <div className="px-3 pt-4 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-primary-600 rounded-lg flex items-center justify-center shadow-sm shadow-primary-600/25">
              <Monitor className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-[13px] font-bold text-zinc-800 leading-tight">Smart Monitor</h1>
              <p className="text-[10px] text-zinc-400">Monitoring System</p>
            </div>
          </div>
          <button onClick={toggle} className="p-1 rounded-md hover:bg-zinc-100 transition-colors" title="Collapse sidebar">
            <X className="w-4 h-4 text-zinc-400" />
          </button>
        </div>
      </div>

      {/* Menu label */}
      <div className="px-3 pt-3 pb-1.5">
        <span className="text-[10px] font-semibold tracking-wider text-zinc-400 uppercase">Menu</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto">
        {menuItems.map((item) => (
          <Link key={item.path} to={item.path} className={linkClass(item.path)}>
            <item.icon className={iconClass(item.path)} />
            <span className="truncate">{item.label}</span>
          </Link>
        ))}

        {/* Master Data */}
        <div>
          <button onClick={() => setIsMasterOpen(!isMasterOpen)}
            className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-[13px] font-medium text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 transition-all duration-200">
            <span className="flex items-center gap-2.5">
              <Database className="w-4 h-4 text-zinc-400" /> Master Data
            </span>
            {isMasterOpen ? <ChevronDown className="w-3.5 h-3.5 text-zinc-400" /> : <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />}
          </button>
          {isMasterOpen && (
            <div className="ml-4 pl-2.5 border-l-2 border-zinc-100 space-y-0.5 mt-0.5">
              <Link to="/master-data/category" className={linkClass("/master-data/category")}>
                <Wrench className={iconClass("/master-data/category")} /> Category
              </Link>
              <Link to="/master-data/location" className={linkClass("/master-data/location")}>
                <MapPin className={iconClass("/master-data/location")} /> Location
              </Link>
            </div>
          )}
        </div>

        {/* History */}
        {(user?.role === "admin" || user?.role === "superadmin") && (
          <div>
            <button onClick={() => setIsHistoriOpen(!isHistoriOpen)}
              className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-[13px] font-medium text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 transition-all duration-200">
              <span className="flex items-center gap-2.5">
                <History className="w-4 h-4 text-zinc-400" /> History
              </span>
              {isHistoriOpen ? <ChevronDown className="w-3.5 h-3.5 text-zinc-400" /> : <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />}
            </button>
            {isHistoriOpen && (
              <div className="ml-4 pl-2.5 border-l-2 border-zinc-100 space-y-0.5 mt-0.5">
                {user?.role === "superadmin" && (
                  <Link to="/logs" className={linkClass("/logs")}>
                    <ScrollText className={iconClass("/logs")} /> Log History
                  </Link>
                )}
                <Link to="/spec-history" className={`${linkClass("/spec-history")} relative`}>
                  <ClipboardList className={iconClass("/spec-history")} />
                  <span className="truncate">Spec Reviews</span>
                  {pendingCount > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0">{pendingCount}</span>
                  )}
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Opname */}
        {(user?.role === "admin" || user?.role === "superadmin") && (
          <div>
            <button onClick={() => setIsOpnameOpen(!isOpnameOpen)}
              className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-[13px] font-medium text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 transition-all duration-200">
              <span className="flex items-center gap-2.5">
                <FolderOpen className="w-4 h-4 text-zinc-400" /> Opname
              </span>
              {isOpnameOpen ? <ChevronDown className="w-3.5 h-3.5 text-zinc-400" /> : <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />}
            </button>
            {isOpnameOpen && (
              <div className="ml-4 pl-2.5 border-l-2 border-zinc-100 space-y-0.5 mt-0.5">
                <Link to="/opname" className={linkClass("/opname")}>
                  <FileText className={iconClass("/opname")} /> Laporan
                </Link>
                <Link to="/opname/create" className={linkClass("/opname/create")}>
                  <FilePlus className={iconClass("/opname/create")} /> Buat Laporan
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Users */}
        {user?.role === "superadmin" && (
          <Link to="/users" className={linkClass("/users")}>
            <Users className={iconClass("/users")} /> Users
          </Link>
        )}
      </nav>

      {/* Logout */}
      <div className="p-2 border-t border-zinc-100">
        <button onClick={logout}
          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium text-red-500 hover:bg-red-50 transition-all duration-200">
          <LogOut className="w-4 h-4" /> Log out
        </button>
      </div>
    </div>
  );
}
