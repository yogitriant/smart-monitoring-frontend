import React, { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import axios from "@/lib/axios";
import { Play, Plus, Edit2, Trash2, X, Check, Code, TerminalSquare } from "lucide-react";
import { format } from "date-fns";

export default function Scripts() {
    const [scripts, setScripts] = useState([]);
    const [pcs, setPcs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null);

    const [form, setForm] = useState(null);
    const [execModal, setExecModal] = useState(null);
    const [logs, setLogs] = useState([]);
    const [searchPc, setSearchPc] = useState("");

    const showToast = (msg, type = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    useEffect(() => {
        fetchScripts();
        fetchPcs();
    }, []);

    const fetchScripts = async () => {
        try {
            setLoading(true);
            const res = await axios.get("/api/scripts");
            setScripts(res.data);
        } catch (err) {
            showToast("Gagal mengambil data scripts", "error");
        } finally {
            setLoading(false);
        }
    };

    const fetchPcs = async () => {
        try {
            const res = await axios.get("/api/pc/list-full");
            setPcs(res.data || []);
        } catch (err) {
            console.error(err);
        }
    };

    const showPic = (row) => (row?.pic && (row.pic.name || row.pic.email)) || row?.picName || "-";

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (form._id) {
                await axios.put(`/api/scripts/${form._id}`, form);
                showToast("Script berhasil diupdate");
            } else {
                await axios.post("/api/scripts", form);
                showToast("Script berhasil ditambahkan");
            }
            setForm(null);
            fetchScripts();
        } catch (err) {
            showToast("Gagal menyimpan script", "error");
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Hapus script ini?")) return;
        try {
            await axios.delete(`/api/scripts/${id}`);
            showToast("Script dihapus");
            fetchScripts();
        } catch (err) {
            showToast("Gagal menghapus script", "error");
        }
    };

    const handleExecute = async () => {
        if (!execModal.selectedPcs || execModal.selectedPcs.length === 0) {
            showToast("Pilih minimal 1 PC target", "error");
            return;
        }
        try {
            await axios.post("/api/scripts/execute", {
                scriptId: execModal.script._id,
                pcIds: execModal.selectedPcs
            });
            showToast("Perintah eksekusi berhasil dikirim!");
            setExecModal(null);
            // Optionally auto-fetch logs if there's a view logs feature
        } catch (err) {
            showToast("Gagal mengirim eksekusi script", "error");
        }
    };

    const fetchLogs = async (scriptId) => {
        try {
            const res = await axios.get(`/api/scripts/logs/${scriptId}`);
            setLogs(res.data);
        } catch (err) {
            showToast("Gagal mengambil log", "error");
        }
    };

    const filteredPcs = pcs.filter(pc => {
        const term = searchPc.toLowerCase();
        const pcName = (pc.pcId || pc.hostname || pc.userLogin || "").toLowerCase();
        const owner = showPic(pc).toLowerCase();
        return pcName.includes(term) || owner.includes(term);
    });

    const isAllSelected = filteredPcs.length > 0 && filteredPcs.every(pc => execModal?.selectedPcs.includes(pc._id));

    const toggleSelectAll = () => {
        if (isAllSelected) {
            const filteredIds = filteredPcs.map(p => p._id);
            const newSelected = execModal.selectedPcs.filter(id => !filteredIds.includes(id));
            setExecModal(prev => ({ ...prev, selectedPcs: newSelected }));
        } else {
            const filteredIds = filteredPcs.map(p => p._id);
            const newSelected = [...new Set([...execModal.selectedPcs, ...filteredIds])];
            setExecModal(prev => ({ ...prev, selectedPcs: newSelected }));
        }
    };

    const btnClass = "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5";
    const inputClass = "w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none";

    return (
        <div className="flex bg-slate-50 h-screen overflow-hidden">
            <Sidebar />
            <div className="flex-1 overflow-y-auto w-full relative">
                {toast && (
                    <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg text-sm font-medium shadow-lg transition-all ${toast.type === "error" ? "bg-red-500 text-white" : "bg-emerald-500 text-white"}`}>
                        {toast.msg}
                    </div>
                )}

                <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-zinc-200 px-6 py-4">
                    <h2 className="text-lg font-bold text-zinc-800 flex items-center gap-2">
                        <TerminalSquare className="w-5 h-5 text-primary-600" /> Scripts Management
                    </h2>
                    <p className="text-xs text-zinc-500">Kelola dan eksekusi skrip ke PC secara remote</p>
                </div>

                <div className="p-6 max-w-6xl mx-auto space-y-6">
                    <div className="flex justify-end">
                        <button onClick={() => setForm({ name: "", description: "", type: "bat", content: "" })} className={`${btnClass} bg-primary-600 text-white hover:bg-primary-700`}>
                            <Plus className="w-4 h-4" /> Add Script
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {scripts.map(script => (
                            <div key={script._id} className="bg-white border text-left border-zinc-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-semibold text-zinc-800 text-lg">{script.name}</h3>
                                    <span className="px-2 py-0.5 rounded text-xs font-mono bg-zinc-100 text-zinc-600 border border-zinc-200 uppercase">{script.type}</span>
                                </div>
                                <p className="text-sm text-zinc-500 mb-4 flex-1">{script.description || "Tidak ada deskripsi"}</p>

                                <div className="flex justify-between items-center pt-4 border-t border-zinc-100">
                                    <button onClick={() => fetchLogs(script._id)} className="text-xs text-blue-600 hover:underline">Lihat Logs</button>
                                    <div className="flex gap-2">
                                        <button onClick={() => setForm(script)} className="p-1.5 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg shrink-0" title="Edit">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDelete(script._id)} className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg shrink-0" title="Hapus">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => { setSearchPc(""); setExecModal({ script, selectedPcs: [] }); }} className={`${btnClass} bg-emerald-100 text-emerald-700 hover:bg-emerald-200 ml-1`}>
                                            <Play className="w-4 h-4" /> Execute
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {logs.length > 0 && (
                        <div className="mt-8 bg-white border border-zinc-200 rounded-xl shadow-sm p-4 overflow-x-auto">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-semibold text-zinc-800">Execution Logs</h3>
                                <button onClick={() => setLogs([])} className="text-xs text-zinc-500 hover:text-zinc-800"><X className="w-4 h-4" /></button>
                            </div>
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead className="bg-zinc-50 text-zinc-500 text-xs uppercase border-b border-zinc-200">
                                    <tr>
                                        <th className="px-4 py-2">Waktu</th>
                                        <th className="px-4 py-2">PC</th>
                                        <th className="px-4 py-2">Status</th>
                                        <th className="px-4 py-2">Output</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.map(lg => (
                                        <tr key={lg._id} className="border-b last:border-0 hover:bg-zinc-50">
                                            <td className="px-4 py-2 text-zinc-500">{format(new Date(lg.createdAt), "dd MMM yyyy HH:mm")}</td>
                                            <td className="px-4 py-2 font-medium">{lg.pcId ? (lg.pcId.pcId || lg.pcId.hostname || "Unknown PC") : "Unknown PC"}</td>
                                            <td className="px-4 py-2">
                                                <span className={`px-2 py-0.5 rounded text-xs truncate ${lg.status === "success" ? "bg-emerald-100 text-emerald-700" : lg.status === "failed" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                                                    {lg.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2 max-w-xs truncate text-xs font-mono text-zinc-600" title={lg.output}>{lg.output || "-"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Form Modal */}
                {form && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-xl shadow-xl w-full max-w-xl max-h-[90vh] flex flex-col">
                            <div className="px-6 py-4 border-b flex justify-between items-center shrink-0">
                                <h3 className="font-bold text-lg">{form._id ? "Edit Script" : "Buat Script Baru"}</h3>
                                <button onClick={() => setForm(null)} className="text-zinc-400 hover:text-zinc-600"><X className="w-5 h-5" /></button>
                            </div>
                            <div className="p-6 overflow-y-auto w-full">
                                <form onSubmit={handleSave} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Nama Script</label>
                                        <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inputClass} placeholder="Contoh: Shutdown Semua PC Biasa" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Deskripsi</label>
                                        <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className={inputClass} placeholder="Opsional" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Tipe</label>
                                        <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className={inputClass}>
                                            <option value="bat">Batch (.bat)</option>
                                            <option value="cmd">Command (.cmd)</option>
                                            <option value="ps1">PowerShell (.ps1)</option>
                                            <option value="sh">Shell (.sh)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Konten Script</label>
                                        <textarea required rows={6} value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} className={`${inputClass} font-mono`} placeholder="@echo off\necho Hello World" />
                                    </div>
                                    <div className="flex justify-end gap-2 pt-4">
                                        <button type="button" onClick={() => setForm(null)} className="px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-100 rounded-lg">Batal</button>
                                        <button type="submit" className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700">Simpan Script</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {/* Execute Modal */}
                {execModal && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                            <div className="px-6 py-4 border-b flex justify-between items-center shrink-0 w-full relative">
                                <div>
                                    <h3 className="font-bold text-lg text-zinc-800">Execute: {execModal.script.name}</h3>
                                    <p className="text-sm text-zinc-500 mt-1">Pilih PC target untuk dieksekusi secara remote. Pastikan status PC Online.</p>
                                </div>
                                <button onClick={() => setExecModal(null)} className="text-zinc-400 hover:text-zinc-600 self-start"><X className="w-5 h-5" /></button>
                            </div>
                            <div className="p-6 overflow-hidden flex flex-col flex-1">
                                <div className="flex gap-4 items-center mb-4">
                                    <input
                                        type="text"
                                        placeholder="Cari nama PC atau Owner..."
                                        value={searchPc}
                                        onChange={(e) => setSearchPc(e.target.value)}
                                        className={inputClass}
                                    />
                                    <label className="flex items-center gap-2 cursor-pointer shrink-0 font-medium text-sm text-zinc-700">
                                        <input
                                            type="checkbox"
                                            className="rounded border-zinc-300 w-4 h-4 text-primary-600 focus:ring-primary-500"
                                            checked={isAllSelected}
                                            onChange={toggleSelectAll}
                                        />
                                        Select All Filtered
                                    </label>
                                </div>

                                <div className="text-sm font-medium text-zinc-500 mb-2">{execModal.selectedPcs.length} PC Terpilih</div>

                                <div className="border border-zinc-200 bg-zinc-50 rounded-lg overflow-y-auto flex-1" style={{ maxHeight: "45vh" }}>
                                    {filteredPcs.map(pc => (
                                        <label key={pc._id} className="flex items-center gap-3 p-3 hover:bg-zinc-50 border-b border-zinc-100 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="rounded border-zinc-300 text-primary-600 focus:ring-primary-500"
                                                checked={execModal.selectedPcs.includes(pc._id)}
                                                onChange={(e) => {
                                                    const checked = e.target.checked;
                                                    setExecModal(prev => ({
                                                        ...prev,
                                                        selectedPcs: checked
                                                            ? [...prev.selectedPcs, pc._id]
                                                            : prev.selectedPcs.filter(id => id !== pc._id)
                                                    }));
                                                }}
                                            />
                                            <div>
                                                <div className="font-medium text-sm flex gap-2 items-center text-zinc-800">
                                                    {pc.pcId || pc.hostname || pc.userLogin || "-"}
                                                    <span className={`w-2 h-2 rounded-full ${pc.status === 'online' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                                                </div>
                                                <div className="text-xs text-zinc-500 mt-0.5">
                                                    Owner: <span className="font-semibold">{showPic(pc)}</span> |
                                                    FA/SN: <span className="font-semibold">{pc.assetNumber || pc.serialNumber || "-"}</span> |
                                                    IP: {pc.ipAddress || "-"}
                                                </div>
                                            </div>
                                        </label>
                                    ))}
                                    {filteredPcs.length === 0 && <div className="p-8 text-center text-sm text-zinc-500">Tidak ada PC yang sesuai pencarian</div>}
                                </div>
                            </div>
                            <div className="p-4 border-t border-zinc-100 bg-white flex justify-end gap-3 shrink-0 rounded-b-xl">
                                <button onClick={() => setExecModal(null)} className="px-5 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors">Batal</button>
                                <button onClick={handleExecute} className="px-5 py-2.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center gap-2 transition-colors">
                                    <Play className="w-4 h-4" /> Push Script ({execModal.selectedPcs.length})
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
