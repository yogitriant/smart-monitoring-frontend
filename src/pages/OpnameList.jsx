import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import api from "@/lib/axios";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import Swal from "sweetalert2";
import { Search, ChevronLeft, ChevronRight, Download, Link2, ExternalLink, Pencil, Trash2, ArrowUpDown } from "lucide-react";

export default function OpnameList() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortField, setSortField] = useState(null);
  const [sortOrder, setSortOrder] = useState("asc");

  useEffect(() => {
    (async () => {
      try { const res = await api.get("/api/opname"); setReports(res.data); }
      catch (err) { setError("Gagal mengambil laporan."); }
      finally { setLoading(false); }
    })();
  }, []);

  const handleCopyLink = async (token) => {
    const url = `${window.location.origin}/opname/public/${token}`;
    try {
      if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(url); }
      else { const ta = document.createElement("textarea"); ta.value = url; ta.style.cssText = "position:fixed;opacity:0"; document.body.appendChild(ta); ta.focus(); ta.select(); document.execCommand("copy"); document.body.removeChild(ta); }
      Swal.fire({ icon: "success", title: "Link Disalin!", text: "Link publik telah disalin ke clipboard.", timer: 2000, showConfirmButton: false });
    } catch { Swal.fire({ icon: "error", title: "Gagal Menyalin", text: "Silakan salin manual." }); }
  };

  const handleDownloadExcel = () => {
    const ws = XLSX.utils.json_to_sheet(reports.map((r) => ({ Nama: r.reportName, "Dibuat Oleh": r.createdBy, Tanggal: new Date(r.createdAt).toLocaleString("id-ID"), Token: r.publicToken })));
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Laporan Opname");
    saveAs(new Blob([XLSX.write(wb, { bookType: "xlsx", type: "array" })], { type: "application/octet-stream" }), `laporan-opname-${Date.now()}.xlsx`);
  };

  const handleDownloadDetail = (report) => {
    const ws = XLSX.utils.json_to_sheet(report.items.map((i) => ({ "PC ID": i.pcId, Serial: i.serialNumber, Asset: i.assetNumber, Lokasi: i.location?.replace(/^(?:\s*-\s*)+/, '') || "-", Status: i.status || "-", Kondisi: i.kondisi || "-", Keterangan: i.keterangan || "-", Teknisi: i.updatedBy || "-" })));
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, report.reportName);
    saveAs(new Blob([XLSX.write(wb, { bookType: "xlsx", type: "array" })], { type: "application/octet-stream" }), `opname-${report.reportName}-${Date.now()}.xlsx`);
  };

  const handleDelete = async (id) => {
    if (!confirm("Yakin ingin menghapus laporan ini?")) return;
    try { await api.delete(`/api/opname/${id}`); setReports((prev) => prev.filter((r) => r._id !== id)); }
    catch { alert("❌ Gagal menghapus laporan."); }
  };

  const handleSort = (field) => { setSortOrder(sortField === field && sortOrder === "asc" ? "desc" : "asc"); setSortField(field); };

  const filtered = useMemo(() => {
    let result = reports.filter((r) => r.reportName.toLowerCase().includes(filter.toLowerCase()) || r.createdBy.toLowerCase().includes(filter.toLowerCase()));
    if (sortField) {
      result = [...result].sort((a, b) => {
        const va = sortField === "createdAt" ? new Date(a[sortField]) : (a[sortField] || "").toString().toLowerCase();
        const vb = sortField === "createdAt" ? new Date(b[sortField]) : (b[sortField] || "").toString().toLowerCase();
        return sortOrder === "asc" ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
      });
    }
    return result;
  }, [reports, filter, sortField, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / limit));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * limit, currentPage * limit);

  const SortHeader = ({ field, label }) => (
    <th onClick={() => handleSort(field)} className="text-left text-[12px] font-semibold text-zinc-400 uppercase tracking-wider px-5 py-3.5 cursor-pointer select-none hover:text-zinc-600 transition-colors">
      <span className="inline-flex items-center gap-1">{label} {sortField === field ? <span className="text-primary-500">{sortOrder === "asc" ? "↑" : "↓"}</span> : <ArrowUpDown className="w-3 h-3 opacity-40" />}</span>
    </th>
  );

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 bg-slate-50 overflow-y-auto">
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-zinc-200/60 px-8 py-5">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-zinc-800">Laporan Opname</h2>
              <p className="text-sm text-zinc-400 mt-0.5">{filtered.length} reports</p>
            </div>
            <button onClick={handleDownloadExcel} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-all shadow-sm">
              <Download className="w-4 h-4" /> Export Excel
            </button>
          </div>
        </div>
        <div className="p-8 space-y-5">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input placeholder="Search report name or author..." value={filter} onChange={(e) => { setFilter(e.target.value); setPage(1); }} className="w-full pl-9 pr-4 py-2 bg-white border border-zinc-200 rounded-xl text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" />
            </div>
            <div className="ml-auto">
              <select value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }} className="bg-white border border-zinc-200 rounded-xl px-3 py-2 text-sm text-zinc-600 focus:outline-none focus:ring-2 focus:ring-primary-500/20">
                {[5, 10, 20, 50].map((n) => <option key={n} value={n}>{n} / page</option>)}
              </select>
            </div>
          </div>

          <div className="bg-white border border-zinc-200/60 rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-100">
                  <SortHeader field="reportName" label="Name" />
                  <SortHeader field="createdBy" label="Author" />
                  <SortHeader field="createdAt" label="Date" />
                  <th className="text-center text-[12px] font-semibold text-zinc-400 uppercase tracking-wider px-5 py-3.5">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? [...Array(3)].map((_, i) => (
                  <tr key={i} className="border-b border-zinc-50">{[...Array(4)].map((_, j) => <td key={j} className="px-5 py-4"><div className="h-4 bg-zinc-100 rounded-lg animate-pulse" style={{ width: `${50 + Math.random() * 40}%` }} /></td>)}</tr>
                )) : error ? (
                  <tr><td colSpan={4} className="text-center py-12 text-sm text-red-500">{error}</td></tr>
                ) : paginated.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-12 text-sm text-zinc-400">Tidak ada laporan ditemukan</td></tr>
                ) : paginated.map((r) => (
                  <tr key={r._id} className="border-b border-zinc-50 hover:bg-zinc-50/50 transition-colors">
                    <td className="px-5 py-3.5 text-sm font-medium text-zinc-700">{r.reportName}</td>
                    <td className="px-5 py-3.5 text-sm text-zinc-600">{r.createdBy}</td>
                    <td className="px-5 py-3.5 text-sm text-zinc-500">{new Date(r.createdAt).toLocaleDateString("id-ID")}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-center gap-1">
                        <Link to={`/opname/${r._id}`} className="p-1.5 rounded-lg text-primary-600 hover:bg-primary-50 transition-all" title="Detail"><ExternalLink className="w-4 h-4" /></Link>
                        <button onClick={() => handleCopyLink(r.publicToken)} className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-all" title="Copy Link"><Link2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDownloadDetail(r)} className="p-1.5 rounded-lg text-purple-600 hover:bg-purple-50 transition-all" title="Download"><Download className="w-4 h-4" /></button>
                        <Link to={`/opname/edit/${r._id}`} className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 transition-all" title="Edit"><Pencil className="w-4 h-4" /></Link>
                        <button onClick={() => handleDelete(r._id)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-all" title="Delete"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

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
