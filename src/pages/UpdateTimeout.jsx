import React, { useEffect, useState, useMemo } from "react";
import axios from "@/lib/axios";
import Sidebar from "@/components/Sidebar";
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, Timer, Activity } from "lucide-react";

export default function UpdateTimeout() {
  const [pcs, setPcs] = useState([]);
  const [filteredPcs, setFilteredPcs] = useState([]);
  const [selected, setSelected] = useState([]);
  const [timeout, setTimeout] = useState("");
  const [performanceInterval, setPerformanceInterval] = useState("");

  const [siteList, setSiteList] = useState([]);
  const [roomList, setRoomList] = useState([]);
  const [categoryList, setCategoryList] = useState([]);
  const [selectedSite, setSelectedSite] = useState("");
  const [selectedRoom, setSelectedRoom] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  // Pagination + sort
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortField, setSortField] = useState(null);
  const [sortOrder, setSortOrder] = useState("asc");
  const [searchQ, setSearchQ] = useState("");

  const showPic = (row) => row?.pic?.name || row?.picName || row?.pic?.email || "-";

  const fetchData = async () => {
    try {
      const res = await axios.get("/api/pc/list-with-location");
      const data = Array.isArray(res.data) ? res.data : [];
      setPcs(data);
      setSiteList([...new Set(data.map((pc) => pc.site).filter(Boolean))]);
      setRoomList([...new Set(data.map((pc) => pc.location?.room).filter(Boolean))]);
      setCategoryList([...new Set(data.map((pc) => pc.location?.category).filter(Boolean))]);
    } catch (e) { console.error("Gagal ambil list-with-location:", e); }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    let result = pcs;
    if (selectedSite) result = result.filter((pc) => pc.site === selectedSite);
    if (selectedRoom) result = result.filter((pc) => pc.location?.room === selectedRoom);
    if (selectedCategory) result = result.filter((pc) => pc.location?.category === selectedCategory);
    if (searchQ) {
      const q = searchQ.toLowerCase();
      result = result.filter((pc) =>
        (pc.serialNumber || "").toLowerCase().includes(q) ||
        (pc.userLogin || "").toLowerCase().includes(q) ||
        showPic(pc).toLowerCase().includes(q)
      );
    }
    setFilteredPcs(result);
    setSelected((prev) => prev.filter((id) => result.some((pc) => pc.pcId === id)));
    setPage(1);
  }, [pcs, selectedSite, selectedRoom, selectedCategory, searchQ]);

  const handleSort = (field) => {
    setSortOrder(sortField === field && sortOrder === "asc" ? "desc" : "asc");
    setSortField(field);
  };

  const sorted = useMemo(() => {
    if (!sortField) return filteredPcs;
    return [...filteredPcs].sort((a, b) => {
      let va = "", vb = "";
      switch (sortField) {
        case "pic": va = showPic(a); vb = showPic(b); break;
        case "serialNumber": va = a.serialNumber || ""; vb = b.serialNumber || ""; break;
        case "location": va = (a.site || "") + " " + (a.location?.room || ""); vb = (b.site || "") + " " + (b.location?.room || ""); break;
        case "idleTimeout": return sortOrder === "asc" ? (a.idleTimeout || 0) - (b.idleTimeout || 0) : (b.idleTimeout || 0) - (a.idleTimeout || 0);
        default: va = ""; vb = "";
      }
      return sortOrder === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
    });
  }, [filteredPcs, sortField, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / limit));
  const currentPage = Math.min(page, totalPages);
  const paginated = sorted.slice((currentPage - 1) * limit, currentPage * limit);

  const toggleSelect = (pcId) => setSelected((prev) => prev.includes(pcId) ? prev.filter((id) => id !== pcId) : [...prev, pcId]);
  const toggleAll = (checked) => setSelected(checked ? sorted.map((pc) => pc.pcId) : []);

  const handleSubmit = async () => {
    if (!timeout || selected.length === 0) { alert("⛔ Pilih PC dan isi timeout terlebih dahulu!"); return; }
    try {
      await axios.patch("/api/pc/timeout", { pcIds: selected, idleTimeout: parseInt(timeout) });
      alert("✅ Timeout berhasil diupdate!"); fetchData(); setSelected([]); setTimeout("");
    } catch (err) { alert("❌ Gagal update timeout"); }
  };

  const handleUpdatePerformance = async () => {
    if (!performanceInterval || selected.length === 0) { alert("⛔ Pilih PC dan isi interval terlebih dahulu!"); return; }
    try {
      await axios.patch("/api/pc/performance-interval", { pcIds: selected, performanceInterval: parseInt(performanceInterval) });
      alert("✅ Performance interval berhasil diupdate!"); fetchData(); setSelected([]); setPerformanceInterval("");
    } catch (err) { alert("❌ Gagal update performance interval"); }
  };

  const SortHeader = ({ field, label }) => (
    <th onClick={() => handleSort(field)} className="text-left text-[12px] font-semibold text-zinc-400 uppercase tracking-wider px-5 py-3.5 cursor-pointer select-none hover:text-zinc-600 transition-colors">
      <span className="inline-flex items-center gap-1">{label} {sortField === field ? <span className="text-primary-500">{sortOrder === "asc" ? "↑" : "↓"}</span> : <ArrowUpDown className="w-3 h-3 opacity-40" />}</span>
    </th>
  );

  const selectClass = "bg-white border border-zinc-200 rounded-xl px-3 py-2 text-sm text-zinc-600 focus:outline-none focus:ring-2 focus:ring-primary-500/20";

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 bg-slate-50 overflow-y-auto">
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-zinc-200/60 px-8 py-5">
          <h2 className="text-xl font-bold text-zinc-800">Update Timeout</h2>
          <p className="text-sm text-zinc-400 mt-0.5">Manage idle timeout & performance interval · {selected.length} selected</p>
        </div>
        <div className="p-8 space-y-5">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input placeholder="Search..." value={searchQ} onChange={(e) => setSearchQ(e.target.value)} className="pl-9 pr-4 py-2 bg-white border border-zinc-200 rounded-xl text-sm w-48 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" />
            </div>
            <select value={selectedSite} onChange={(e) => setSelectedSite(e.target.value)} className={selectClass}>
              <option value="">All Site</option>
              {siteList.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={selectedRoom} onChange={(e) => setSelectedRoom(e.target.value)} className={selectClass}>
              <option value="">All Room</option>
              {roomList.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className={selectClass}>
              <option value="">All Category</option>
              {categoryList.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <div className="ml-auto">
              <select value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }} className={selectClass}>
                {[5, 10, 20, 50].map((n) => <option key={n} value={n}>{n} / page</option>)}
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white border border-zinc-200/60 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="border-b border-zinc-100">
                    <th className="px-5 py-3.5 w-10">
                      <input type="checkbox" checked={sorted.length > 0 && selected.length === sorted.length} onChange={(e) => toggleAll(e.target.checked)} className="w-3.5 h-3.5 rounded border-zinc-300 text-primary-600 focus:ring-primary-500/20" />
                    </th>
                    <SortHeader field="pic" label="PIC" />
                    <th className="text-left text-[12px] font-semibold text-zinc-400 uppercase tracking-wider px-5 py-3.5">User</th>
                    <SortHeader field="serialNumber" label="Serial" />
                    <th className="text-left text-[12px] font-semibold text-zinc-400 uppercase tracking-wider px-5 py-3.5">Asset</th>
                    <SortHeader field="location" label="Location" />
                    <th className="text-left text-[12px] font-semibold text-zinc-400 uppercase tracking-wider px-5 py-3.5">Category</th>
                    <SortHeader field="idleTimeout" label="Timeout" />
                    <th className="text-left text-[12px] font-semibold text-zinc-400 uppercase tracking-wider px-5 py-3.5">Perf. Int.</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((pc) => (
                    <tr key={pc._id} className="border-b border-zinc-50 hover:bg-zinc-50/50 transition-colors">
                      <td className="px-5 py-3.5"><input type="checkbox" checked={selected.includes(pc.pcId)} onChange={() => toggleSelect(pc.pcId)} className="w-3.5 h-3.5 rounded border-zinc-300 text-primary-600 focus:ring-primary-500/20" /></td>
                      <td className="px-5 py-3.5 text-sm font-medium text-zinc-700">{showPic(pc)}</td>
                      <td className="px-5 py-3.5 text-sm text-zinc-600">{pc.lastLoginUser || pc.userLogin || "-"}</td>
                      <td className="px-5 py-3.5 text-sm text-zinc-600">{pc.serialNumber}</td>
                      <td className="px-5 py-3.5 text-sm text-zinc-600">{pc.assetNumber || "-"}</td>
                      <td className="px-5 py-3.5 text-sm text-zinc-600">{[pc.site, pc.location?.room].filter(Boolean).join(" - ") || "-"}</td>
                      <td className="px-5 py-3.5 text-sm text-zinc-600">{pc.location?.category || "-"}</td>
                      <td className="px-5 py-3.5 text-sm text-zinc-600">{pc.idleTimeout ?? "-"}</td>
                      <td className="px-5 py-3.5 text-sm text-zinc-600">{pc.performanceInterval ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-zinc-400">Showing {Math.min((currentPage - 1) * limit + 1, sorted.length)}–{Math.min(currentPage * limit, sorted.length)} of {sorted.length}</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded-lg border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"><ChevronLeft className="w-4 h-4" /></button>
              <span className="text-sm text-zinc-600 font-medium px-3">{currentPage} / {totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 rounded-lg border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>

          {/* Action footer */}
          <div className="bg-white border border-zinc-200/60 rounded-2xl shadow-sm p-5 space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 min-w-[180px]">
                <Timer className="w-4 h-4 text-zinc-400" />
                <span className="text-sm font-medium text-zinc-600">Idle Timeout (min)</span>
              </div>
              <input type="number" placeholder="e.g. 60" value={timeout} onChange={(e) => setTimeout(e.target.value)} className="w-32 px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" />
              <button onClick={handleSubmit} className="px-5 py-2 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-all shadow-sm">Update Timeout</button>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 min-w-[180px]">
                <Activity className="w-4 h-4 text-zinc-400" />
                <span className="text-sm font-medium text-zinc-600">Perf. Interval (sec)</span>
              </div>
              <input type="number" placeholder="e.g. 300" value={performanceInterval} onChange={(e) => setPerformanceInterval(e.target.value)} className="w-32 px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" />
              <button onClick={handleUpdatePerformance} className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-all shadow-sm">Update Performance</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
