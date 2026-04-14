import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import Sidebar from "@/components/Sidebar";
import axios from "@/lib/axios";
import {
  Monitor,
  Wifi,
  WifiOff,
  Clock,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  MapPin,
} from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const [pcList, setPcList] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    online: 0,
    idle: 0,
    offline: 0,
  });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [siteFilter, setSiteFilter] = useState("");
  const [roomFilter, setRoomFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const showPic = (row) =>
    (row?.pic && (row.pic.name || row.pic.email)) || row?.picName || "-";

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/pc/list-full");
      const data = res.data;

      const total = data.length;
      const online = data.filter((pc) => pc.status === "online").length;
      const idle = data.filter((pc) => pc.status === "idle").length;
      const offline = total - online - idle;

      setPcList(data);
      setStats({ total, online, idle, offline });
    } catch (err) {
      console.error("❌ Failed to fetch PC list", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = pcList.filter(
    (pc) =>
      (!siteFilter ||
        pc.site
          ?.toLowerCase()
          .includes(siteFilter.toLowerCase())) &&
      (!roomFilter ||
        pc.location?.room?.toLowerCase().includes(roomFilter.toLowerCase()))
  );

  const paginated = filtered.slice((page - 1) * limit, page * limit);
  const totalPages = Math.max(1, Math.ceil(filtered.length / limit));

  const statCards = [
    {
      label: "Total PCs",
      value: stats.total,
      icon: Monitor,
      color: "text-primary-600",
      bg: "bg-primary-50",
      iconColor: "text-primary-600",
    },
    {
      label: "Online",
      value: stats.online,
      icon: Wifi,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      iconColor: "text-emerald-500",
    },
    {
      label: "Idle",
      value: stats.idle,
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50",
      iconColor: "text-amber-500",
    },
    {
      label: "Offline",
      value: stats.offline,
      icon: WifiOff,
      color: "text-red-600",
      bg: "bg-red-50",
      iconColor: "text-red-500",
    },
  ];

  const statusBadge = (status) => {
    const styles = {
      online: "bg-emerald-50 text-emerald-700 border-emerald-200",
      idle: "bg-amber-50 text-amber-700 border-amber-200",
      offline: "bg-red-50 text-red-700 border-red-200",
    };
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
          styles[status] || styles.offline
        }`}
      >
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            status === "online"
              ? "bg-emerald-500"
              : status === "idle"
              ? "bg-amber-500"
              : "bg-red-500"
          }`}
        />
        {status === "online" ? "Active" : status === "idle" ? "Idle" : "Offline"}
      </span>
    );
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />

      <div className="flex-1 bg-slate-50 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-zinc-200/60 px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-zinc-800">Dashboard</h2>
              <p className="text-xs text-zinc-400">
                Hey welcome back, {user?.username} 👋
              </p>
            </div>
            <button
              onClick={fetchData}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 rounded-xl text-sm font-medium text-zinc-600 hover:bg-zinc-50 hover:border-zinc-300 transition-all duration-200 shadow-sm"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        <div className="p-8 space-y-6">
          {/* Stat cards */}
          <div className="grid grid-cols-4 gap-5">
            {statCards.map((item, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-zinc-200/60 p-5 shadow-sm hover:shadow-md transition-shadow duration-300"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[13px] text-zinc-400 font-medium">
                    {item.label}
                  </span>
                  <div className={`w-9 h-9 ${item.bg} rounded-xl flex items-center justify-center`}>
                    <item.icon className={`w-[18px] h-[18px] ${item.iconColor}`} />
                  </div>
                </div>
                <div className={`text-2xl font-bold ${item.color}`}>
                  {item.value}
                </div>
              </div>
            ))}
          </div>

          {/* Recent Activity header + filter */}
          <div className="flex items-center justify-between">
            <h3 className="text-[15px] font-semibold text-zinc-800">
              Recent Activity
            </h3>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter site..."
                  className="pl-9 pr-4 py-2 bg-white border border-zinc-200 rounded-xl text-sm w-44 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                  value={siteFilter}
                  onChange={(e) => { setSiteFilter(e.target.value); setPage(1); }}
                />
              </div>
              <div className="relative">
                <MapPin className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter room..."
                  className="pl-9 pr-4 py-2 bg-white border border-zinc-200 rounded-xl text-sm w-44 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                  value={roomFilter}
                  onChange={(e) => { setRoomFilter(e.target.value); setPage(1); }}
                />
              </div>
              <select
                value={limit}
                onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                className="bg-white border border-zinc-200 rounded-xl px-3 py-2 text-sm text-zinc-600 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              >
                {[5, 10, 20, 50].map((num) => (
                  <option key={num} value={num}>
                    {num} / page
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white border border-zinc-200/60 rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-100">
                  <th className="text-left text-[12px] font-semibold text-zinc-400 uppercase tracking-wider px-5 py-3.5">PIC</th>
                  <th className="text-left text-[12px] font-semibold text-zinc-400 uppercase tracking-wider px-5 py-3.5">Computer</th>
                  <th className="text-left text-[12px] font-semibold text-zinc-400 uppercase tracking-wider px-5 py-3.5">User Login</th>
                  <th className="text-left text-[12px] font-semibold text-zinc-400 uppercase tracking-wider px-5 py-3.5">Location</th>
                  <th className="text-left text-[12px] font-semibold text-zinc-400 uppercase tracking-wider px-5 py-3.5">Activity</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="border-b border-zinc-50">
                      {[...Array(5)].map((_, j) => (
                        <td key={j} className="px-5 py-4">
                          <div className="h-4 bg-zinc-100 rounded-lg animate-pulse" style={{ width: `${60 + Math.random() * 40}%` }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-sm text-zinc-400">
                      Tidak ada data ditemukan
                    </td>
                  </tr>
                ) : (
                  paginated.map((pc) => (
                    <tr key={pc._id} className="border-b border-zinc-50 hover:bg-zinc-50/50 transition-colors">
                      <td className="px-5 py-3.5 text-sm font-medium text-zinc-700">{showPic(pc)}</td>
                      <td className="px-5 py-3.5 text-sm text-zinc-600">{pc.serialNumber}</td>
                      <td className="px-5 py-3.5 text-sm text-zinc-600">{pc.userLogin || "-"}</td>
                      <td className="px-5 py-3.5 text-sm text-zinc-600">
                        {pc.site || pc.location?.campus || "Unknown"}, {pc.location?.room || "-"}
                      </td>
                      <td className="px-5 py-3.5">{statusBadge(pc.status)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-zinc-400">
              Showing {Math.min((page - 1) * limit + 1, filtered.length)}–{Math.min(page * limit, filtered.length)} of {filtered.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-zinc-600 font-medium px-3">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
