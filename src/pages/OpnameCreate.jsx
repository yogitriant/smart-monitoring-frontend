import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import api from "@/lib/axios";
import { Search, ChevronLeft, ChevronRight, FilePlus, MapPin } from "lucide-react";

export default function OpnameCreate() {
  const navigate = useNavigate();
  const [reportName, setReportName] = useState("");
  const [pcList, setPcList] = useState([]);
  const [selectedPcIds, setSelectedPcIds] = useState([]);
  const [siteFilter, setSiteFilter] = useState("");
  const [roomFilter, setRoomFilter] = useState("");
  const [searchQ, setSearchQ] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try { const res = await api.get("/api/pc/list"); setPcList(res.data); }
      catch (err) { console.error("❌ Gagal ambil data PC:", err.message); }
    })();
  }, []);

  const togglePcSelection = (pcId) => setSelectedPcIds((prev) => prev.includes(pcId) ? prev.filter((id) => id !== pcId) : [...prev, pcId]);

  const siteList = [...new Set(pcList.map((pc) => pc.site).filter(Boolean))];
  const roomList = [...new Set(pcList.filter((pc) => !siteFilter || pc.site === siteFilter).map((pc) => pc.location?.room).filter(Boolean))];

  const filteredPcList = useMemo(() => {
    return pcList.filter((pc) => {
      const matchSite = siteFilter ? pc.site === siteFilter : true;
      const matchRoom = roomFilter ? pc.location?.room === roomFilter : true;
      const matchSearch = !searchQ || (pc.pcId || "").toLowerCase().includes(searchQ.toLowerCase()) || (pc.serialNumber || "").toLowerCase().includes(searchQ.toLowerCase());
      return matchSite && matchRoom && matchSearch;
    });
  }, [pcList, siteFilter, roomFilter, searchQ]);

  const totalPages = Math.max(1, Math.ceil(filteredPcList.length / limit));
  const currentPage = Math.min(page, totalPages);
  const paginated = filteredPcList.slice((currentPage - 1) * limit, currentPage * limit);

  const allFilteredSelected = filteredPcList.length > 0 && filteredPcList.every((pc) => selectedPcIds.includes(pc._id));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reportName.trim() || selectedPcIds.length === 0) return;
    try {
      setSubmitting(true);
      await api.post("/api/opname", { reportName, pcIds: selectedPcIds });
      navigate("/opname");
    } catch (err) { console.error("❌ Gagal buat laporan:", err.message); alert("Gagal membuat laporan."); }
    finally { setSubmitting(false); }
  };

  const selectClass = "bg-white border border-zinc-200 rounded-xl px-3 py-2 text-sm text-zinc-600 focus:outline-none focus:ring-2 focus:ring-primary-500/20";
  const thClass = "text-left text-[12px] font-semibold text-zinc-400 uppercase tracking-wider px-5 py-3.5";

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 bg-slate-50 overflow-y-auto">
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-zinc-200/60 px-8 py-5">
          <h2 className="text-xl font-bold text-zinc-800">Buat Laporan Opname</h2>
          <p className="text-sm text-zinc-400 mt-0.5">{selectedPcIds.length} PC selected</p>
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          {/* Report name */}
          <div className="bg-white border border-zinc-200/60 rounded-2xl shadow-sm p-5">
            <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Report Name</label>
            <input type="text" placeholder="Nama Laporan" value={reportName} onChange={(e) => setReportName(e.target.value)} required className="w-full max-w-md px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input placeholder="Search PC..." value={searchQ} onChange={(e) => { setSearchQ(e.target.value); setPage(1); }} className="pl-9 pr-4 py-2 bg-white border border-zinc-200 rounded-xl text-sm w-48 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" />
            </div>
            <select value={siteFilter} onChange={(e) => { setSiteFilter(e.target.value); setRoomFilter(""); setPage(1); }} className={selectClass}>
              <option value="">All Site</option>
              {siteList.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={roomFilter} onChange={(e) => { setRoomFilter(e.target.value); setPage(1); }} disabled={!siteFilter} className={`${selectClass} disabled:opacity-50`}>
              <option value="">All Room</option>
              {roomList.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <div className="ml-auto">
              <select value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }} className={selectClass}>
                {[5, 10, 20, 50].map((n) => <option key={n} value={n}>{n} / page</option>)}
              </select>
            </div>
          </div>

          {/* PC Table */}
          <div className="bg-white border border-zinc-200/60 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-zinc-100">
                  <th className="px-5 py-3.5 w-10">
                    <input type="checkbox" checked={allFilteredSelected} onChange={(e) => {
                      const filteredIds = filteredPcList.map((pc) => pc._id);
                      if (e.target.checked) {
                        setSelectedPcIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
                      } else {
                        setSelectedPcIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
                      }
                    }} className="w-3.5 h-3.5 rounded border-zinc-300 text-primary-600 focus:ring-primary-500/20" />
                  </th>
                  <th className={thClass}>PC ID</th>
                  <th className={thClass}>Serial</th>
                  <th className={thClass}>Asset</th>
                  <th className={thClass}>Location</th>
                </tr></thead>
                <tbody>
                  {paginated.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-12 text-sm text-zinc-400">Tidak ada PC ditemukan</td></tr>
                  ) : paginated.map((pc) => (
                    <tr key={pc._id} className="border-b border-zinc-50 hover:bg-zinc-50/50 transition-colors">
                      <td className="px-5 py-3.5"><input type="checkbox" checked={selectedPcIds.includes(pc._id)} onChange={() => togglePcSelection(pc._id)} className="w-3.5 h-3.5 rounded border-zinc-300 text-primary-600 focus:ring-primary-500/20" /></td>
                      <td className="px-5 py-3.5 text-sm font-medium text-zinc-700">{pc.pcId}</td>
                      <td className="px-5 py-3.5 text-sm text-zinc-600">{pc.serialNumber}</td>
                      <td className="px-5 py-3.5 text-sm text-zinc-600">{pc.assetNumber || "-"}</td>
                      <td className="px-5 py-3.5 text-sm text-zinc-600">{[pc.site, pc.location?.room].filter(Boolean).join(" - ") || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {filteredPcList.length > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-zinc-400">Showing {Math.min((currentPage - 1) * limit + 1, filteredPcList.length)}–{Math.min(currentPage * limit, filteredPcList.length)} of {filteredPcList.length}</span>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded-lg border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"><ChevronLeft className="w-4 h-4" /></button>
                <span className="text-sm text-zinc-600 font-medium px-3">{currentPage} / {totalPages}</span>
                <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 rounded-lg border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          )}

          {/* Submit */}
          <button type="submit" disabled={submitting || !reportName.trim() || selectedPcIds.length === 0} className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-all shadow-md shadow-primary-600/25 disabled:opacity-50 disabled:cursor-not-allowed">
            <FilePlus className="w-4 h-4" /> {submitting ? "Creating..." : "Buat Report"}
          </button>
        </form>
      </div>
    </div>
  );
}
