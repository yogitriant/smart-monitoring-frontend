import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import Sidebar from "@/components/Sidebar";
import { Search, ChevronLeft, ChevronRight, Check, X, Clock, ClipboardList } from "lucide-react";

export default function SpecHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQ, setSearchQ] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/spec-history`, { headers: { Authorization: `Bearer ${token}` } });
      setHistory(res.data);
    } catch (err) { console.error("❌ Gagal ambil riwayat:", err.response?.data || err.message); }
    finally { setLoading(false); }
  };

  const handleApprove = async (id) => {
    try { await axios.put(`${import.meta.env.VITE_API_BASE_URL}/api/spec-history/${id}/approve`, { adminName: user.username }, { headers: { Authorization: `Bearer ${token}` } }); fetchHistory(); }
    catch { alert("❌ Gagal approve"); }
  };

  const handleReject = async (id) => {
    try { await axios.put(`${import.meta.env.VITE_API_BASE_URL}/api/spec-history/${id}/reject`, { adminName: user.username }, { headers: { Authorization: `Bearer ${token}` } }); fetchHistory(); }
    catch { alert("❌ Gagal reject"); }
  };

  const parseGB = (str) => { if (!str) return 0; const [num, unit] = str.split(" "); return unit?.toLowerCase().includes("tb") ? parseFloat(num) * 1024 : parseFloat(num); };
  const getDiskSizeDiff = (oldDisk = [], newDisk = []) => Math.abs(newDisk.reduce((s, d) => s + parseGB(d.total), 0) - oldDisk.reduce((s, d) => s + parseGB(d.total), 0));
  const getDiskTotal = (arr, type) => (arr || []).filter((d) => d.type === type).reduce((s, d) => s + parseFloat(d.total), 0);
  const formatDisk = (disk) => {
    const ssd = getDiskTotal(disk, "SSD"), hdd = getDiskTotal(disk, "HDD");
    const fmt = (v) => v >= 1000 ? `${(v / 1000).toFixed(1)} TB` : `${v} GB`;
    return [ssd ? `SSD: ${fmt(ssd)}` : null, hdd ? `HDD: ${fmt(hdd)}` : null].filter(Boolean).join(" + ");
  };

  useEffect(() => { fetchHistory(); }, []);

  const filtered = useMemo(() => {
    let result = history;
    if (statusFilter === "pending") result = result.filter((i) => !i.approved && !i.rejected);
    else if (statusFilter === "approved") result = result.filter((i) => i.approved);
    else if (statusFilter === "rejected") result = result.filter((i) => i.rejected);
    if (searchQ) {
      result = result.filter((i) => {
        const q = searchQ.toLowerCase();
        return (
          (i.pc?.pcId || "").toLowerCase().includes(q) ||
          (i.pc?.serialNumber || "").toLowerCase().includes(q) ||
          (i.pc?.pic?.name || "").toLowerCase().includes(q)
        );
      });
    }
    return result;
  }, [history, statusFilter, searchQ]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / limit));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * limit, currentPage * limit);

  const EXCLUDED = ["bios", "macAddress", "uuid", "hostname", "resolution"];
  const selectClass = "bg-white border border-zinc-200 rounded-xl px-3 py-2 text-sm text-zinc-600 focus:outline-none focus:ring-2 focus:ring-primary-500/20";

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 bg-slate-50 overflow-y-auto">
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-zinc-200/60 px-8 py-5">
          <h2 className="text-xl font-bold text-zinc-800">Spec Reviews</h2>
          <p className="text-sm text-zinc-400 mt-0.5">Approval untuk perubahan spesifikasi Hardware · {filtered.length} entries</p>
        </div>
        <div className="p-8 space-y-5">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input placeholder="Search PC..." value={searchQ} onChange={(e) => { setSearchQ(e.target.value); setPage(1); }} className="pl-9 pr-4 py-2 bg-white border border-zinc-200 rounded-xl text-sm w-48 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" />
            </div>
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className={selectClass}>
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <div className="ml-auto">
              <select value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }} className={selectClass}>
                {[5, 10, 20, 50].map((n) => <option key={n} value={n}>{n} / page</option>)}
              </select>
            </div>
          </div>

          {/* Entries */}
          <div className="space-y-3">
            {loading ? [...Array(3)].map((_, i) => (
              <div key={i} className="bg-white border border-zinc-200/60 rounded-2xl p-5 animate-pulse space-y-3">
                <div className="h-4 bg-zinc-100 rounded w-1/3" />
                <div className="h-3 bg-zinc-100 rounded w-2/3" />
              </div>
            )) : paginated.length === 0 ? (
              <div className="text-center py-16 text-sm text-zinc-400">Tidak ada data riwayat</div>
            ) : paginated.map((item) => {
              const statusStyle = item.approved ? "border-emerald-100 bg-emerald-50/50" : item.rejected ? "border-red-100 bg-red-50/50" : "border-amber-100 bg-amber-50/50";
              const changedKeys = Object.keys(item.newSpec).filter((key) => {
                if (EXCLUDED.includes(key)) return false;
                if (key === "disk") return getDiskSizeDiff(item.oldSpec[key], item.newSpec[key]) >= 100;
                return JSON.stringify(item.oldSpec[key]) !== JSON.stringify(item.newSpec[key]);
              });

              return (
                <div key={item._id} className="bg-white border border-zinc-200/60 rounded-2xl shadow-sm overflow-hidden">
                  <div className={`flex items-center gap-3 px-5 py-3 border-b ${statusStyle}`}>
                    <ClipboardList className="w-4 h-4 text-zinc-500" />
                    <span className="text-sm font-medium text-zinc-700">
                      PC: <span className="text-primary-600">{item.pc?.pcId || "-"}</span>
                      <span className="text-zinc-300 mx-1.5">·</span>
                      SN: <span className="text-zinc-600">{item.pc?.serialNumber || "-"}</span>
                      <span className="text-zinc-300 mx-1.5">·</span>
                      PIC: <span className="text-zinc-600">{item.pc?.pic?.name || "-"}</span>
                    </span>
                    <span className="ml-auto text-xs text-zinc-400 flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(item.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="px-5 py-4">
                    {changedKeys.length === 0 ? (
                      <p className="text-sm text-zinc-400 italic">Tidak ada perubahan signifikan.</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 bg-zinc-50 p-3 rounded-xl text-sm">
                        {changedKeys.map((key) => (
                          <div key={key} className="bg-white border border-zinc-100 px-3 py-2 rounded-lg">
                            <span className="font-medium text-zinc-700">{key}</span>:{" "}
                            {key === "disk" ? (
                              <><span className="line-through text-red-400">{formatDisk(item.oldSpec.disk)}</span> → <span className="text-emerald-600 font-medium">{formatDisk(item.newSpec.disk)}</span></>
                            ) : key === "pic" && typeof item.oldSpec.pic === "object" && typeof item.newSpec.pic === "object" ? (
                              <div className="mt-1 space-y-0.5 text-xs">
                                {["name", "email", "department", "phone"].map((k) => (
                                  <div key={k}><span className="font-medium">{k}:</span> <span className="line-through text-red-400">{item.oldSpec.pic?.[k] || "-"}</span> → <span className="text-emerald-600">{item.newSpec.pic?.[k] || "-"}</span></div>
                                ))}
                              </div>
                            ) : (
                              <><span className="line-through text-red-400">{item.oldSpec[key] || "-"}</span> → <span className="text-emerald-600 font-medium">{item.newSpec[key]}</span></>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="mt-4 flex items-center gap-2">
                      {item.approved ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-medium border border-emerald-200"><Check className="w-3.5 h-3.5" />Disetujui oleh {item.approvedBy}</span>
                      ) : item.rejected ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-xs font-medium border border-red-200"><X className="w-3.5 h-3.5" />Ditolak oleh {item.approvedBy}</span>
                      ) : (
                        <>
                          <button onClick={() => handleApprove(item._id)} className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 transition-all shadow-sm"><Check className="w-3.5 h-3.5" />Approve</button>
                          <button onClick={() => handleReject(item._id)} className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600 transition-all shadow-sm"><X className="w-3.5 h-3.5" />Reject</button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {filtered.length > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-zinc-400">Showing {Math.min((currentPage - 1) * limit + 1, filtered.length)}–{Math.min(currentPage * limit, filtered.length)} of {filtered.length}</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded-lg border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"><ChevronLeft className="w-4 h-4" /></button>
                <span className="text-sm text-zinc-600 font-medium px-3">{currentPage} / {totalPages}</span>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 rounded-lg border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
