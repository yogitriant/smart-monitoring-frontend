import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import Sidebar from "@/components/Sidebar";
import { Search, ChevronLeft, ChevronRight, Clock, Pencil, Trash } from "lucide-react";

export default function LogHistory() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ action: "", adminName: "", startDate: "", endDate: "", serialNumber: "" });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/logs`, { headers: { Authorization: `Bearer ${token}` } });
        setLogs(res.data);
      } catch (err) { console.error("❌ Gagal fetch logs:", err.message); }
      finally { setLoading(false); }
    })();
  }, []);

  const filteredLogs = useMemo(() => {
    const { action, adminName, startDate, endDate, serialNumber } = filters;
    return logs.filter((log) => {
      const ts = new Date(log.timestamp || log.createdAt);
      return (
        (!action || log.action === action) &&
        (!adminName || log.adminName?.toLowerCase().includes(adminName.toLowerCase())) &&
        (!serialNumber || log.oldData?.serialNumber?.includes(serialNumber)) &&
        (!startDate || ts >= new Date(startDate)) &&
        (!endDate || ts <= new Date(endDate))
      );
    });
  }, [logs, filters]);

  const edits = filteredLogs.filter((log) => log.action === "edit");
  const deletes = filteredLogs.filter((log) => log.action === "delete");
  const allItems = [...edits.map(l => ({ ...l, _type: "edit" })), ...deletes.map(l => ({ ...l, _type: "delete" }))].sort((a, b) => new Date(b.timestamp || b.createdAt) - new Date(a.timestamp || a.createdAt));

  const totalPages = Math.max(1, Math.ceil(allItems.length / limit));
  const currentPage = Math.min(page, totalPages);
  const paginated = allItems.slice((currentPage - 1) * limit, currentPage * limit);

  const renderField = (label, oldVal, newVal) => (
    <div className="text-sm"><span className="font-medium text-zinc-700">{label}:</span> <span className="line-through text-red-400">{oldVal || "-"}</span> → <span className="text-emerald-600 font-medium">{newVal || "-"}</span></div>
  );

  const getPicVal = (pic, key) => { if (!pic) return "-"; if (typeof pic === "string") return key === "name" ? pic : "-"; return pic[key] || "-"; };

  const selectClass = "bg-white border border-zinc-200 rounded-xl px-3 py-2 text-sm text-zinc-600 focus:outline-none focus:ring-2 focus:ring-primary-500/20";

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 bg-slate-50 overflow-y-auto">
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-zinc-200/60 px-8 py-5">
          <h2 className="text-xl font-bold text-zinc-800">Log History</h2>
          <p className="text-sm text-zinc-400 mt-0.5">{allItems.length} entries found</p>
        </div>
        <div className="p-8 space-y-5">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input placeholder="Admin name..." value={filters.adminName} onChange={(e) => { setFilters({ ...filters, adminName: e.target.value }); setPage(1); }} className="pl-9 pr-4 py-2 bg-white border border-zinc-200 rounded-xl text-sm w-44 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" />
            </div>
            <input placeholder="Serial Number..." value={filters.serialNumber} onChange={(e) => { setFilters({ ...filters, serialNumber: e.target.value }); setPage(1); }} className="px-3 py-2 bg-white border border-zinc-200 rounded-xl text-sm w-40 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all" />
            <input type="date" value={filters.startDate} onChange={(e) => { setFilters({ ...filters, startDate: e.target.value }); setPage(1); }} className={selectClass} />
            <input type="date" value={filters.endDate} onChange={(e) => { setFilters({ ...filters, endDate: e.target.value }); setPage(1); }} className={selectClass} />
            <div className="ml-auto">
              <select value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }} className={selectClass}>
                {[5, 10, 20, 50].map((n) => <option key={n} value={n}>{n} / page</option>)}
              </select>
            </div>
          </div>

          {/* Log entries */}
          <div className="space-y-3">
            {loading ? [...Array(3)].map((_, i) => (
              <div key={i} className="bg-white border border-zinc-200/60 rounded-2xl p-5 animate-pulse space-y-3">
                <div className="h-4 bg-zinc-100 rounded w-1/3" />
                <div className="h-3 bg-zinc-100 rounded w-2/3" />
                <div className="h-3 bg-zinc-100 rounded w-1/2" />
              </div>
            )) : paginated.length === 0 ? (
              <div className="text-center py-16 text-sm text-zinc-400">Tidak ada log ditemukan</div>
            ) : paginated.map((log) => {
              const isEdit = log._type === "edit";
              const changedFields = [];
              if (isEdit) {
                const keysToCheck = [
                  "serialNumber", "assetNumber", "location", "isAdmin", "lifecycleStatus",
                  "productCategory", "subCategory", "productName", "manufacturer", "supplierName",
                  "site", "region", "division", "department", "lokasiRoom", "ownerSite", "faNumber", "brand", "model"
                ];
                
                keysToCheck.forEach(key => {
                  if (log.oldData?.[key] !== log.newData?.[key]) changedFields.push(key);
                });
                
                ["name", "email", "department", "phone"].forEach((k) => {
                  if (getPicVal(log.oldData?.pic, k) !== getPicVal(log.newData?.pic, k)) changedFields.push(`pic.${k}`);
                });
                
                if (changedFields.length === 0) return null;
              }

              return (
                <div key={log._id || Math.random()} className="bg-white border border-zinc-200/60 rounded-2xl shadow-sm overflow-hidden">
                  <div className={`flex items-center gap-3 px-5 py-3 border-b ${isEdit ? "border-amber-100 bg-amber-50/50" : "border-red-100 bg-red-50/50"}`}>
                    {isEdit ? <Pencil className="w-4 h-4 text-amber-500" /> : <Trash className="w-4 h-4 text-red-500" />}
                    <span className="text-sm font-medium text-zinc-700">{isEdit ? "Edit" : "Delete"} — <span className="text-primary-600">{log.adminName}</span></span>
                    <span className="ml-auto text-xs text-zinc-400 flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(log.timestamp || log.updatedAt).toLocaleString()}</span>
                  </div>
                  <div className="px-5 py-4">
                    <div className="text-sm text-zinc-600 mb-2">Target: <span className="font-medium text-zinc-800">{log.pcId || log.oldData?.serialNumber || "-"}</span></div>
                    {isEdit && changedFields.length > 0 && (
                      <div className="grid grid-cols-2 gap-2 bg-zinc-50 p-3 rounded-xl">
                        {changedFields.map(field => {
                           if (field.startsWith("pic.")) {
                             const picKey = field.split(".")[1];
                             return <div key={field}>{renderField(`PIC ${picKey}`, getPicVal(log.oldData?.pic, picKey), getPicVal(log.newData?.pic, picKey))}</div>;
                           }
                           const label = field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                           return <div key={field}>{renderField(label, log.oldData?.[field], log.newData?.[field])}</div>;
                        })}
                      </div>
                    )}
                    {!isEdit && (
                      <div className="text-sm text-zinc-500">Data Terhapus: {log.oldData?.serialNumber} · {log.oldData?.assetNumber || "-"}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {allItems.length > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-zinc-400">Showing {Math.min((currentPage - 1) * limit + 1, allItems.length)}–{Math.min(currentPage * limit, allItems.length)} of {allItems.length}</span>
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
