import React, { useEffect, useMemo, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import axios from "@/lib/axios";
import Sidebar from "@/components/Sidebar";
import {
  Search, ChevronLeft, ChevronRight, ArrowUpDown, MapPin, FileText,
} from "lucide-react";

export default function OpnameDetail() {
  const { id } = useParams();
  const location = useLocation();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  // filters & pagination
  const [search, setSearch] = useState("");
  const [locFilter, setLocFilter] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [sortField, setSortField] = useState(null);
  const [sortOrder, setSortOrder] = useState("asc");

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        const isPublic = location.pathname.includes("/public");
        const endpoint = isPublic ? `/api/opname/public/${id}` : `/api/opname/${id}`;
        const res = await axios.get(endpoint, { headers: isPublic ? {} : undefined });
        setReport(res.data);
      } catch (err) { console.error("❌ Gagal ambil detail report:", err.message); }
      finally { setLoading(false); }
    };
    fetchReport();
  }, [id, location.pathname]);

  const handleSort = (field) => {
    const order = sortField === field && sortOrder === "asc" ? "desc" : "asc";
    setSortField(field); setSortOrder(order);
  };

  const filtered = useMemo(() => {
    if (!report?.items) return [];
    const q = search.trim().toLowerCase();
    const loc = locFilter.trim().toLowerCase();

    let result = report.items.filter((item) => {
      const searchOk = !q || [item.pic, item.pcId, item.serialNumber, item.assetNumber, item.updatedBy]
        .some((v) => v?.toLowerCase().includes(q));
      const locOk = !loc || item.location?.toLowerCase().includes(loc);
      return searchOk && locOk;
    });

    if (sortField) {
      result = [...result].sort((a, b) => {
        let valA = (a[sortField] || "").toString().toLowerCase();
        let valB = (b[sortField] || "").toString().toLowerCase();
        if (valA < valB) return sortOrder === "asc" ? -1 : 1;
        if (valA > valB) return sortOrder === "asc" ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [report, search, locFilter, sortField, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / limit));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * limit;
  const paginated = filtered.slice(start, start + limit);

  const thBase = "text-left text-[11px] font-semibold text-zinc-400 uppercase tracking-wider px-3 py-2.5 whitespace-nowrap";

  const SortHeader = ({ field, label }) => (
    <th onClick={() => handleSort(field)} className={`${thBase} cursor-pointer select-none hover:text-zinc-600 transition-colors`}>
      <span className="inline-flex items-center gap-1">
        {label}
        {sortField === field ? <span className="text-primary-500">{sortOrder === "asc" ? "↑" : "↓"}</span> : <ArrowUpDown className="w-3 h-3 opacity-40" />}
      </span>
    </th>
  );

  if (loading) {
    return (
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex-1 bg-slate-50 flex items-center justify-center">
          <div className="text-sm text-zinc-400 animate-pulse">Loading report...</div>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex-1 bg-slate-50 flex items-center justify-center">
          <div className="text-sm text-zinc-400">Report tidak ditemukan</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 bg-slate-50 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-zinc-200/60 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary-50 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-800">Laporan: {report.reportName}</h2>
              <p className="text-xs text-zinc-400">{filtered.length} items found</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input placeholder="Cari PIC, Serial, Asset..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-8 pr-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-sm w-52 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" />
            </div>
            <div className="relative">
              <MapPin className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input placeholder="Filter lokasi..." value={locFilter} onChange={(e) => { setLocFilter(e.target.value); setPage(1); }}
                className="pl-8 pr-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-sm w-40 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" />
            </div>
            <div className="ml-auto">
              <select value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                className="bg-white border border-zinc-200 rounded-lg px-2.5 py-1.5 text-sm text-zinc-600 focus:outline-none focus:ring-2 focus:ring-primary-500/20">
                {[10, 20, 50, 100].map((n) => <option key={n} value={n}>{n} / page</option>)}
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white border border-zinc-200/60 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full table-fixed">
                <colgroup>
                  <col style={{ width: "9%" }} />   {/* PIC */}
                  <col style={{ width: "10%" }} />  {/* PC ID */}
                  <col style={{ width: "10%" }} />  {/* Serial */}
                  <col style={{ width: "9%" }} />   {/* Asset */}
                  <col style={{ width: "13%" }} />  {/* Lokasi */}
                  <col style={{ width: "5%" }} />   {/* RAM */}
                  <col style={{ width: "16%" }} />  {/* Storage */}
                  <col style={{ width: "6%" }} />   {/* Status */}
                  <col style={{ width: "7%" }} />   {/* Kondisi */}
                  <col style={{ width: "9%" }} />   {/* Keterangan */}
                  <col style={{ width: "6%" }} />   {/* Teknisi */}
                </colgroup>
                <thead>
                  <tr className="border-b border-zinc-100 bg-zinc-50/50">
                    <SortHeader field="pic" label="PIC" />
                    <SortHeader field="pcId" label="PC ID" />
                    <SortHeader field="serialNumber" label="Serial" />
                    <SortHeader field="assetNumber" label="Asset" />
                    <SortHeader field="location" label="Lokasi" />
                    <th className={thBase}>RAM</th>
                    <th className={thBase}>Storage</th>
                    <SortHeader field="status" label="Status" />
                    <SortHeader field="kondisi" label="Kondisi" />
                    <th className={thBase}>Keterangan</th>
                    <SortHeader field="updatedBy" label="Teknisi" />
                  </tr>
                </thead>
                <tbody>
                  {paginated.length === 0 ? (
                    <tr><td colSpan={11} className="text-center py-12 text-sm text-zinc-400">Tidak ada data ditemukan</td></tr>
                  ) : (
                    paginated.map((item, idx) => (
                      <tr key={item.pcId || idx} className="border-b border-zinc-50 hover:bg-zinc-50/50 transition-colors">
                        <td className="px-3 py-2.5 text-sm font-medium text-zinc-700 truncate">{item.pic || "-"}</td>
                        <td className="px-3 py-2.5 text-sm text-zinc-600 truncate">{item.pcId}</td>
                        <td className="px-3 py-2.5 text-sm text-zinc-600 truncate">{item.serialNumber}</td>
                        <td className="px-3 py-2.5 text-sm text-zinc-600 truncate">{item.assetNumber}</td>
                        <td className="px-3 py-2.5 text-sm text-zinc-600 truncate">{item.location || "-"}</td>
                        <td className="px-3 py-2.5 text-sm text-zinc-600">{item.ram || "-"}</td>
                        <td className="px-3 py-2.5 text-sm text-zinc-500 truncate" title={item.storage || "-"}>{item.storage || "-"}</td>
                        <td className="px-3 py-2.5 text-sm text-zinc-600">{item.status || "-"}</td>
                        <td className="px-3 py-2.5 text-sm text-zinc-600">{item.kondisi && item.kondisi !== "-" ? item.kondisi : "-"}</td>
                        <td className="px-3 py-2.5 text-sm text-zinc-500 truncate" title={item.keterangan || "-"}>{item.keterangan && item.keterangan !== "-" ? item.keterangan : "-"}</td>
                        <td className="px-3 py-2.5 text-sm text-zinc-500 truncate">{item.updatedBy || "-"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-zinc-400">
              Showing {filtered.length > 0 ? Math.min(start + 1, filtered.length) : 0}–{Math.min(start + limit, filtered.length)} of {filtered.length}
            </span>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-zinc-600 font-medium px-2">{currentPage} / {totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
