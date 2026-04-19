import React, { useEffect, useMemo, useState } from "react";
import axios from "@/lib/axios";
import { io } from "socket.io-client";
import UploadAgentZip from "./UploadAgentZip";
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, Trash2, Send, Package, Clock, Monitor, RefreshCw } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export default function AgentUpdateDashboard() {
  const [versions, setVersions] = useState([]);
  const [pcs, setPcs] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState("");
  const [selectedPcs, setSelectedPcs] = useState(new Set());
  const [logs, setLogs] = useState([]);
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(true);

  // Pagination for PC table
  const [pcPage, setPcPage] = useState(1);
  const [pcLimit, setPcLimit] = useState(10);
  const [pcSearch, setPcSearch] = useState("");

  // Pagination for logs
  const [logPage, setLogPage] = useState(1);
  const logLimit = 10;

  // Pagination for versions
  const [versionPage, setVersionPage] = useState(1);
  const versionLimit = 5;

  const safeText = (v) => v == null ? "-" : typeof v === "object" ? "-" : String(v).trim() === "" ? "-" : String(v);

  const getDisplayPcId = (mongoId) => {
    const pc = pcs.find(p => p._id === mongoId);
    return pc ? pc.pcId : mongoId;
  };

  const allSelected = useMemo(() => pcs.length > 0 && selectedPcs.size === pcs.length, [pcs.length, selectedPcs]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [vRes, pcRes, logRes] = await Promise.all([
        axios.get("/api/agent/versions"),
        axios.get("/api/pc"),
        axios.get("/api/agent/logs?limit=50"),
      ]);
      setVersions(vRes.data || []);
      setPcs(pcRes.data || []);
      setLogs(logRes.data || []);
      if ((vRes.data || []).length) setSelectedVersion(vRes.data[0].version);
    } catch (err) { console.error("❌ Gagal fetch data awal:", err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchAllData();
    const sock = io(API_BASE);
    sock.on("agent-update-result", (data) => setLogs((prev) => [data, ...prev.slice(0, 49)]));
    setSocket(sock);
    return () => sock.disconnect();
  }, []);

  const togglePc = (pcId) => setSelectedPcs((prev) => { const next = new Set(prev); next.has(pcId) ? next.delete(pcId) : next.add(pcId); return next; });
  const toggleAll = () => setSelectedPcs((prev) => prev.size === pcs.length ? new Set() : new Set(pcs.map((p) => p._id)));

  const pushAction = async (action) => {
    if (!selectedVersion || selectedPcs.size === 0 || !socket) return;
    
    const pcsList = Array.from(selectedPcs);
    const textAction = action === "update" ? "Update" : "Rollback";

    // 🔹 Pengecekan apakah PC sudah di versi yang sama
    const alreadyUpdatedPcs = pcsList
      .map((id) => pcs.find((p) => p._id === id))
      .filter((p) => p && (p.agentVersion === selectedVersion || p.version === selectedVersion));

    if (alreadyUpdatedPcs.length > 0) {
      if (!window.confirm(`⚠️ PERHATIAN!\nAda ${alreadyUpdatedPcs.length} PC yang sudah berada di versi ${selectedVersion}.\nAgen akan secara otomatis melewati (skip) update pada PC tersebut agar efisien.\n\nTetap lanjutkan ${textAction} untuk seluruh ${pcsList.length} PC yang Anda centang?`)) {
        return;
      }
    } else {
      if (!window.confirm(`Yakin ingin melakukan ${textAction} ${pcsList.length} PC ke versi ${selectedVersion}?`)) {
        return;
      }
    }

    try {
      const versionObj = versions.find((v) => v.version === selectedVersion);
      const versionHash = versionObj ? versionObj.hash : null;
      
      // 🔹 Inject optimistic log entries
      const optimisticLogs = pcsList.map((pcId) => ({
        _id: `temp-${Date.now()}-${pcId}`,
        pcId,
        version: selectedVersion,
        action,
        status: "processing",
        message: `Memproses instruksi ${action}...`,
        timestamp: new Date().toISOString()
      }));
      setLogs((prev) => [...optimisticLogs, ...prev].slice(0, 50));
      
      // Kosongkan seleksi setelah dipush
      setSelectedPcs(new Set());

      await axios.post("/api/agent/push", { action, version: selectedVersion, pcIds: pcsList });
      pcsList.forEach((pcId) => socket.emit("agent-update", { pcId, version: selectedVersion, hash: versionHash, silent: true, force: false, action }));
    } catch (err) { 
      console.error("❌ Gagal push action:", err);
      alert("Gagal melakukan aksi push!");
    }
  };

  // Filtered PCs
  const filteredPcs = useMemo(() => {
    if (!pcSearch) return pcs;
    const q = pcSearch.toLowerCase();
    return pcs.filter((pc) =>
      (pc.pcId || "").toLowerCase().includes(q) ||
      (pc.serialNumber || "").toLowerCase().includes(q) ||
      (pc.assetNumber || "").toLowerCase().includes(q)
    );
  }, [pcs, pcSearch]);

  const versionTotalPages = Math.max(1, Math.ceil(versions.length / versionLimit));
  const versionCurrentPage = Math.min(versionPage, versionTotalPages);
  const versionPaginated = versions.slice((versionCurrentPage - 1) * versionLimit, versionCurrentPage * versionLimit);

  const pcTotalPages = Math.max(1, Math.ceil(filteredPcs.length / pcLimit));
  const pcCurrentPage = Math.min(pcPage, pcTotalPages);
  const pcPaginated = filteredPcs.slice((pcCurrentPage - 1) * pcLimit, pcCurrentPage * pcLimit);

  const logTotalPages = Math.max(1, Math.ceil(logs.length / logLimit));
  const logCurrentPage = Math.min(logPage, logTotalPages);
  const logPaginated = logs.slice((logCurrentPage - 1) * logLimit, logCurrentPage * logLimit);

  const thClass = "text-left text-[12px] font-semibold text-zinc-400 uppercase tracking-wider px-5 py-3.5";
  const tdClass = "px-5 py-3.5 text-sm text-zinc-600";
  const selectClass = "bg-white border border-zinc-200 rounded-xl px-3 py-2 text-sm text-zinc-600 focus:outline-none focus:ring-2 focus:ring-primary-500/20";

  return (
    <div className="space-y-6">
      {/* Upload */}
      <UploadAgentZip onUploaded={fetchAllData} />

      {/* Versions Table */}
      <div className="bg-white border border-zinc-200/60 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-primary-500" />
            <h3 className="text-sm font-semibold text-zinc-700">Available Versions</h3>
          </div>
        </div>
        <table className="w-full">
          <thead><tr className="border-b border-zinc-100">
            <th className={thClass}>Version</th>
            <th className={thClass}>Upload Date</th>
            <th className={thClass}>Changelog</th>
            <th className={`${thClass} text-center`}>Action</th>
          </tr></thead>
          <tbody>
            {(versionPaginated || []).length === 0 ? (
              <tr><td colSpan={4} className="text-center py-8 text-sm text-zinc-400">Tidak ada versi tersimpan</td></tr>
            ) : versionPaginated.map((v) => (
              <tr key={v.version} className="border-b border-zinc-50 hover:bg-zinc-50/50 transition-colors">
                <td className={`${tdClass} font-medium text-zinc-700`}>{safeText(v.version)}</td>
                <td className={tdClass}>{v.uploadDate ? new Date(v.uploadDate).toLocaleString() : "-"}</td>
                <td className={`${tdClass} max-w-[200px] truncate`}>{safeText(v.changelog)}</td>
                <td className={`${tdClass} text-center`}>
                  <button onClick={async () => { if (confirm(`Hapus versi ${v.version}?`)) { await axios.delete(`/api/agent/versions/${v.version}`); fetchAllData(); } }} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-all" title="Delete"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {versions.length > versionLimit && (
          <div className="px-5 py-3 border-t border-zinc-100 flex justify-between items-center bg-zinc-50/50">
            <span className="text-sm text-zinc-400">Showing {Math.min((versionCurrentPage - 1) * versionLimit + 1, versions.length)}–{Math.min(versionCurrentPage * versionLimit, versions.length)} of {versions.length}</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setVersionPage((p) => Math.max(1, p - 1))} disabled={versionCurrentPage === 1} className="p-2 rounded-lg border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"><ChevronLeft className="w-4 h-4" /></button>
              <span className="text-sm text-zinc-600 font-medium px-3">{versionCurrentPage} / {versionTotalPages}</span>
              <button onClick={() => setVersionPage((p) => Math.min(versionTotalPages, p + 1))} disabled={versionCurrentPage === versionTotalPages} className="p-2 rounded-lg border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>

      {/* Select Version + Push */}
      <div className="bg-white border border-zinc-200/60 rounded-2xl shadow-sm p-5">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-zinc-600">Target Version:</span>
            <select value={selectedVersion} onChange={(e) => setSelectedVersion(e.target.value)} className={selectClass}>
              {(versions || []).map((v) => <option key={v.version} value={v.version}>{v.version}</option>)}
            </select>
          </div>
          <button onClick={() => pushAction("update")} disabled={!selectedVersion || selectedPcs.size === 0 || !socket} className="inline-flex items-center gap-2 px-5 py-2 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed">
            <Send className="w-4 h-4" /> Push Update ({selectedPcs.size})
          </button>
        </div>
      </div>

      {/* PC Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Monitor className="w-4 h-4 text-zinc-500" />
            <h3 className="text-sm font-semibold text-zinc-700">Select PCs</h3>
            <span className="text-xs text-zinc-400 ml-2">{selectedPcs.size} / {filteredPcs.length} selected</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input placeholder="Search PC..." value={pcSearch} onChange={(e) => { setPcSearch(e.target.value); setPcPage(1); }} className="pl-9 pr-4 py-2 bg-white border border-zinc-200 rounded-xl text-sm w-48 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" />
            </div>
            <select value={pcLimit} onChange={(e) => { setPcLimit(Number(e.target.value)); setPcPage(1); }} className={selectClass}>
              {[5, 10, 20, 50].map((n) => <option key={n} value={n}>{n} / page</option>)}
            </select>
          </div>
        </div>
        <div className="bg-white border border-zinc-200/60 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead><tr className="border-b border-zinc-100">
                <th className="px-5 py-3.5 w-10"><input type="checkbox" checked={allSelected} onChange={toggleAll} className="w-3.5 h-3.5 rounded border-zinc-300 text-primary-600 focus:ring-primary-500/20" /></th>
                <th className={thClass}>PC ID</th>
                <th className={thClass}>Serial</th>
                <th className={thClass}>Asset</th>
                <th className={thClass}>Location</th>
                <th className={thClass}>PIC</th>
                <th className={thClass}>Agent Ver.</th>
                <th className={thClass}>RAM</th>
                <th className={thClass}>Storage</th>
              </tr></thead>
              <tbody>
                {loading ? [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-zinc-50">{[...Array(9)].map((_, j) => <td key={j} className="px-5 py-4"><div className="h-4 bg-zinc-100 rounded-lg animate-pulse" style={{ width: `${50 + Math.random() * 40}%` }} /></td>)}</tr>
                )) : pcPaginated.length === 0 ? (
                  <tr><td colSpan={9} className="text-center py-12 text-sm text-zinc-400">Tidak ada data PC</td></tr>
                ) : pcPaginated.map((pc) => (
                  <tr key={pc._id} className="border-b border-zinc-50 hover:bg-zinc-50/50 transition-colors">
                    <td className="px-5 py-3.5"><input type="checkbox" checked={selectedPcs.has(pc._id)} onChange={() => togglePc(pc._id)} className="w-3.5 h-3.5 rounded border-zinc-300 text-primary-600 focus:ring-primary-500/20" /></td>
                    <td className={`${tdClass} font-medium text-zinc-700`}>{safeText(pc.pcId)}</td>
                    <td className={tdClass}>{safeText(pc.serialNumber)}</td>
                    <td className={tdClass}>{safeText(pc.assetNumber)}</td>
                    <td className={tdClass}>{`${safeText(pc.location?.category)} - ${safeText(pc.location?.room)}`}</td>
                    <td className={tdClass}>{pc.picName ?? (typeof pc.pic === "object" ? pc.pic?.name : safeText(pc.pic))}</td>
                    <td className={tdClass}>{safeText(pc.agentVersion ?? pc.version)}</td>
                    <td className={tdClass}>{pc.spec?.ram != null ? `${pc.spec.ram}` : "-"}</td>
                    <td className={tdClass}>{pc.spec?.storage ? `${pc.spec.storage?.size ?? "-"} ${pc.spec.storage?.type ?? ""}`.trim() : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {filteredPcs.length > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-zinc-400">Showing {Math.min((pcCurrentPage - 1) * pcLimit + 1, filteredPcs.length)}–{Math.min(pcCurrentPage * pcLimit, filteredPcs.length)} of {filteredPcs.length}</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setPcPage((p) => Math.max(1, p - 1))} disabled={pcCurrentPage === 1} className="p-2 rounded-lg border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"><ChevronLeft className="w-4 h-4" /></button>
              <span className="text-sm text-zinc-600 font-medium px-3">{pcCurrentPage} / {pcTotalPages}</span>
              <button onClick={() => setPcPage((p) => Math.min(pcTotalPages, p + 1))} disabled={pcCurrentPage === pcTotalPages} className="p-2 rounded-lg border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>

      {/* Logs Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-zinc-500" />
            <h3 className="text-sm font-semibold text-zinc-700">Recent Logs</h3>
          </div>
          <button onClick={fetchAllData} className="p-1.5 rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-50 focus:outline-none transition-colors" title="Refresh Logs"><RefreshCw className="w-4 h-4" /></button>
        </div>
        <div className="bg-white border border-zinc-200/60 rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead><tr className="border-b border-zinc-100">
              <th className={thClass}>Time</th>
              <th className={thClass}>PC ID</th>
              <th className={thClass}>Version</th>
              <th className={thClass}>Action</th>
              <th className={thClass}>Status</th>
              <th className={thClass}>Message</th>
            </tr></thead>
            <tbody>
              {logPaginated.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-sm text-zinc-400">Belum ada log</td></tr>
              ) : logPaginated.map((log) => (
                <tr key={log._id || `${log.timestamp}-${log.pcId}`} className="border-b border-zinc-50 hover:bg-zinc-50/50 transition-colors">
                  <td className={`${tdClass} text-zinc-500`}>{log.timestamp ? new Date(log.timestamp).toLocaleString() : "-"}</td>
                  <td className={`${tdClass} font-medium text-zinc-700`}>{safeText(getDisplayPcId(log.pcId))}</td>
                  <td className={tdClass}>{safeText(log.version)}</td>
                  <td className={tdClass}>{safeText(log.action)}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${
                      log.status === "success" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : 
                      log.status === "processing" ? "bg-amber-50 text-amber-700 border-amber-200" : 
                      log.status === "error" || log.status === "failed" ? "bg-red-50 text-red-700 border-red-200" : 
                      "bg-zinc-100 text-zinc-600 border-zinc-200"
                    }`}>
                      {safeText(log.status)}
                    </span>
                  </td>
                  <td className={`${tdClass} max-w-[200px] truncate`}>{safeText(log.message)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {logs.length > logLimit && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-zinc-400">Showing {Math.min((logCurrentPage - 1) * logLimit + 1, logs.length)}–{Math.min(logCurrentPage * logLimit, logs.length)} of {logs.length}</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setLogPage((p) => Math.max(1, p - 1))} disabled={logCurrentPage === 1} className="p-2 rounded-lg border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"><ChevronLeft className="w-4 h-4" /></button>
              <span className="text-sm text-zinc-600 font-medium px-3">{logCurrentPage} / {logTotalPages}</span>
              <button onClick={() => setLogPage((p) => Math.min(logTotalPages, p + 1))} disabled={logCurrentPage === logTotalPages} className="p-2 rounded-lg border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
