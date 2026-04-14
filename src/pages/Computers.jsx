import React, { useEffect, useMemo, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { Link } from "react-router-dom";
import axios from "@/lib/axios";
import {
  Search, ChevronLeft, ChevronRight, ArrowUpDown,
  ExternalLink, MapPin, User, Hash,
} from "lucide-react";

export default function Computers() {
  const [computers, setComputers] = useState([]);
  const [filter, setFilter] = useState({ site: "", room: "", pic: "", snAsset: "" });
  const [page, setPage] = useState(1);
  const [showUnassignedOnly, setShowUnassignedOnly] = useState(false);
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState(null);
  const [sortOrder, setSortOrder] = useState("asc");

  const showPic = (row) =>
    (row?.pic && (row.pic.name || row.pic.email)) || row?.picName || "-";

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await axios.get("/api/pc/list-full");
        setComputers(res.data || []);
      } catch (err) { console.error("❌ Gagal ambil data komputer:", err); }
      finally { setLoading(false); }
    })();
  }, []);

  const handleSort = (field) => {
    const order = sortField === field && sortOrder === "asc" ? "desc" : "asc";
    setSortField(field); setSortOrder(order);
  };

  const filtered = useMemo(() => {
    const siteQ = filter.site.trim().toLowerCase();
    const roomQ = filter.room.trim().toLowerCase();
    const picQ = filter.pic.trim().toLowerCase();
    const snAssetQ = filter.snAsset.trim().toLowerCase();

    let result = (computers || []).filter((comp) => {
      if (showUnassignedOnly) return (!comp.location && !comp.site) || comp.site === "Unknown";
      const siteOk = !siteQ || comp.site?.toLowerCase().includes(siteQ);
      const roomOk = !roomQ || comp.location?.room?.toLowerCase().includes(roomQ);
      const picStr = showPic(comp).toLowerCase();
      const picOk = !picQ || picStr.includes(picQ);
      const snAssetOk = !snAssetQ || (comp.serialNumber || "").toLowerCase().includes(snAssetQ) || (comp.assetNumber || "").toLowerCase().includes(snAssetQ);
      return siteOk && roomOk && picOk && snAssetOk;
    });

    if (sortField) {
      result = [...result].sort((a, b) => {
        let valA, valB;
        switch (sortField) {
          case "pic": valA = showPic(a); valB = showPic(b); break;
          case "serialNumber": valA = a.serialNumber || ""; valB = b.serialNumber || ""; break;
          case "assetNumber": valA = a.assetNumber || ""; valB = b.assetNumber || ""; break;
          case "userLogin": valA = a.userLogin || ""; valB = b.userLogin || ""; break;
          case "location":
            valA = (a.site || "") + "," + (a.location?.room || "");
            valB = (b.site || "") + "," + (b.location?.room || "");
            break;
          case "status": valA = a.status || ""; valB = b.status || ""; break;
          case "lastActive":
            valA = a.lastActive ? new Date(a.lastActive) : new Date(0);
            valB = b.lastActive ? new Date(b.lastActive) : new Date(0);
            return sortOrder === "asc" ? valA - valB : valB - valA;
          default: valA = ""; valB = "";
        }
        if (typeof valA === "string") { valA = valA.toLowerCase(); valB = valB.toLowerCase(); }
        if (valA < valB) return sortOrder === "asc" ? -1 : 1;
        if (valA > valB) return sortOrder === "asc" ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [computers, filter, showUnassignedOnly, sortField, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / limit));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * limit;
  const paginated = filtered.slice(start, start + limit);

  const formatSpec = (pc) => {
    if (!pc.spec) return "-";
    const parts = [];
    if (pc.spec.cpu) parts.push(pc.spec.cpu);
    if (pc.spec.ram) parts.push(pc.spec.ram);
    if (pc.spec.disk?.length) {
      const diskStr = pc.spec.disk.map(d => `${d.drive}: ${d.total} ${d.type}`).join(", ");
      parts.push(diskStr);
    }
    return parts.join(" | ") || "-";
  };

  const formatLastActive = (lastActive) => {
    if (!lastActive) return "-";
    return new Date(lastActive).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" });
  };

  const thBase = "text-left text-[11px] font-semibold text-zinc-400 uppercase tracking-wider px-3 py-2.5 whitespace-nowrap";

  const SortHeader = ({ field, label, className = "" }) => (
    <th onClick={() => handleSort(field)} className={`${thBase} cursor-pointer select-none hover:text-zinc-600 transition-colors ${className}`}>
      <span className="inline-flex items-center gap-1">
        {label}
        {sortField === field ? <span className="text-primary-500">{sortOrder === "asc" ? "↑" : "↓"}</span> : <ArrowUpDown className="w-3 h-3 opacity-40" />}
      </span>
    </th>
  );

  const statusBadge = (status) => {
    const styles = { online: "bg-emerald-50 text-emerald-700 border-emerald-200", idle: "bg-amber-50 text-amber-700 border-amber-200", offline: "bg-red-50 text-red-700 border-red-200" };
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border whitespace-nowrap ${styles[status] || styles.offline}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${status === "online" ? "bg-emerald-500" : status === "idle" ? "bg-amber-500" : "bg-red-500"}`} />
        {status || "offline"}
      </span>
    );
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 bg-slate-50 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-zinc-200/60 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-zinc-800">Computers</h2>
            <p className="text-xs text-zinc-400">{filtered.length} computers found</p>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input placeholder="Site..." value={filter.site} onChange={(e) => { setFilter({ ...filter, site: e.target.value }); setPage(1); }}
                className="pl-8 pr-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-sm w-32 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" />
            </div>
            <div className="relative">
              <MapPin className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input placeholder="Room..." value={filter.room} onChange={(e) => { setFilter({ ...filter, room: e.target.value }); setPage(1); }}
                className="pl-8 pr-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-sm w-32 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" />
            </div>
            <div className="relative">
              <User className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input placeholder="PIC..." value={filter.pic} onChange={(e) => { setFilter({ ...filter, pic: e.target.value }); setPage(1); }}
                className="pl-8 pr-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-sm w-32 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" />
            </div>
            <div className="relative">
              <Hash className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input placeholder="SN / Asset..." value={filter.snAsset} onChange={(e) => { setFilter({ ...filter, snAsset: e.target.value }); setPage(1); }}
                className="pl-8 pr-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-sm w-36 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" />
            </div>
            <label className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-zinc-200 rounded-lg cursor-pointer hover:bg-zinc-50 transition-all">
              <input type="checkbox" checked={showUnassignedOnly} onChange={(e) => { setShowUnassignedOnly(e.target.checked); setPage(1); }}
                className="w-3 h-3 rounded border-zinc-300 text-primary-600 focus:ring-primary-500/20" />
              <span className="text-xs text-zinc-600 whitespace-nowrap">Unassigned only</span>
            </label>
            <div className="ml-auto">
              <select value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                className="bg-white border border-zinc-200 rounded-lg px-2.5 py-1.5 text-sm text-zinc-600 focus:outline-none focus:ring-2 focus:ring-primary-500/20">
                {[5, 10, 20, 50].map((n) => <option key={n} value={n}>{n} / page</option>)}
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white border border-zinc-200/60 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full table-fixed">
                <colgroup>
                  <col style={{ width: "9%" }} />   {/* PIC */}
                  <col style={{ width: "11%" }} />  {/* Serial Number */}
                  <col style={{ width: "10%" }} />  {/* Asset Number */}
                  <col style={{ width: "7%" }} />   {/* User Login */}
                  <col style={{ width: "13%" }} />  {/* Location */}
                  <col style={{ width: "12%" }} />  {/* Sistem Operasi */}
                  <col style={{ width: "18%" }} />  {/* Spec */}
                  <col style={{ width: "9%" }} />   {/* Last Active */}
                  <col style={{ width: "6%" }} />   {/* Status */}
                  <col style={{ width: "5%" }} />   {/* Action */}
                </colgroup>
                <thead>
                  <tr className="border-b border-zinc-100 bg-zinc-50/50">
                    <SortHeader field="pic" label="PIC" />
                    <SortHeader field="serialNumber" label="Serial Number" />
                    <SortHeader field="assetNumber" label="Asset Number" />
                    <SortHeader field="userLogin" label="User Login" />
                    <SortHeader field="location" label="Location" />
                    <th className={thBase}>Sistem Operasi</th>
                    <th className={thBase}>Spec</th>
                    <SortHeader field="lastActive" label="Last Active" />
                    <SortHeader field="status" label="Status" />
                    <th className={`${thBase} text-center`}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i} className="border-b border-zinc-50">{[...Array(10)].map((_, j) => <td key={j} className="px-3 py-2.5"><div className="h-3.5 bg-zinc-100 rounded animate-pulse" style={{ width: `${50 + Math.random() * 40}%` }} /></td>)}</tr>
                    ))
                  ) : paginated.length === 0 ? (
                    <tr><td colSpan={10} className="text-center py-12 text-sm text-zinc-400">Tidak ada data ditemukan</td></tr>
                  ) : (
                    paginated.map((pc) => (
                      <tr key={pc._id} className="border-b border-zinc-50 hover:bg-zinc-50/50 transition-colors">
                        <td className="px-3 py-2.5 text-sm font-medium text-zinc-700 truncate">{showPic(pc)}</td>
                        <td className="px-3 py-2.5 text-sm text-zinc-600 truncate">{pc.serialNumber || "-"}</td>
                        <td className="px-3 py-2.5 text-sm text-zinc-600 truncate">{pc.assetNumber || "-"}</td>
                        <td className="px-3 py-2.5 text-sm text-zinc-600 truncate">{pc.userLogin || "-"}</td>
                        <td className="px-3 py-2.5 text-sm text-zinc-600 truncate">
                          {(pc.site || pc.location?.campus) ? `${pc.site || pc.location?.campus}, ${pc.location?.room || ""}${pc.location?.category ? ` (${pc.location.category})` : ""}` : (pc.location?.room || "-")}
                        </td>
                        <td className="px-3 py-2.5 text-sm text-zinc-600 truncate">{pc.spec?.os || "-"}</td>
                        <td className="px-3 py-2.5 text-[11px] text-zinc-500 truncate" title={formatSpec(pc)}>{formatSpec(pc)}</td>
                        <td className="px-3 py-2.5 text-sm text-zinc-500 whitespace-nowrap">{formatLastActive(pc.lastActive)}</td>
                        <td className="px-3 py-2.5">{statusBadge(pc.status)}</td>
                        <td className="px-3 py-2.5 text-center">
                          <Link to={`/computers/${pc._id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 border border-zinc-200 rounded-lg text-xs font-medium text-zinc-600 hover:bg-zinc-50 hover:border-zinc-300 transition-all whitespace-nowrap">
                            Detail <ExternalLink className="w-3 h-3" />
                          </Link>
                        </td>
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
              Showing {Math.min(start + 1, filtered.length)}–{Math.min(start + limit, filtered.length)} of {filtered.length}
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
