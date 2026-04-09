import React, { useState, useEffect, useMemo } from "react";
import Sidebar from "@/components/Sidebar";
import axios from "@/lib/axios";
import { Plus, Edit2, Trash2, X, Search, Wrench, ChevronRight } from "lucide-react";

const CATEGORY_TABS = [
    { id: "productCategory", label: "Product Category" },
    { id: "subCategory", label: "Sub Category", hasParent: "productCategory" },
    { id: "productName", label: "Product Name" },
    { id: "manufacturer", label: "Manufacturer" },
    { id: "supplierName", label: "Supplier" },
];

export default function MasterCategory() {
    const [activeTab, setActiveTab] = useState(CATEGORY_TABS[0].id);
    const [options, setOptions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null);
    const [search, setSearch] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [form, setForm] = useState({ value: "", parent: "" });

    const showToast = (msg, type = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const fetchAll = async () => {
        try {
            setLoading(true);
            const res = await axios.get("/api/field-options");
            setOptions(res.data);
        } catch { showToast("Gagal mengambil data", "error"); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchAll(); }, []);

    const currentTabData = useMemo(() => {
        let data = options.filter(o => o.type === activeTab);
        if (search.trim()) {
            const q = search.toLowerCase();
            data = data.filter(o => (o.value || "").toLowerCase().includes(q));
        }
        return data;
    }, [options, activeTab, search]);

    const activeTabConfig = CATEGORY_TABS.find(t => t.id === activeTab);
    const parentOptions = useMemo(() => {
        if (!activeTabConfig?.hasParent) return [];
        return options.filter(o => o.type === activeTabConfig.hasParent);
    }, [options, activeTabConfig]);

    const openAdd = () => { setForm({ value: "", parent: "" }); setEditItem(null); setShowModal(true); };

    const openEdit = (item) => {
        setForm({ value: item.value || "", parent: item.parent || "" });
        setEditItem(item);
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!form.value) return showToast("Value tidak boleh kosong", "error");
        
        // Handle multiple values (comma separated)
        const values = form.value.split(",").map(v => v.trim()).filter(Boolean);
        
        try {
            if (editItem?._id) {
                await axios.put(`/api/field-options/${editItem._id}`, { ...form, value: values[0] });
                showToast("Data diperbarui");
            } else {
                for (const val of values) {
                    await axios.post("/api/field-options", { type: activeTab, value: val, parent: form.parent });
                }
                showToast("Data disimpan");
            }
            setShowModal(false);
            fetchAll();
        } catch { showToast("Gagal menyimpan", "error"); }
    };

    const handleDelete = async (id) => {
        if (!confirm("Hapus item ini?")) return;
        try {
            await axios.delete(`/api/field-options/${id}`);
            showToast("Item dihapus");
            fetchAll();
        } catch { showToast("Gagal menghapus", "error"); }
    };

    const inputClass = "w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all";
    const labelClass = "block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1";
    const tabClass = (id) => `px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === id ? "border-primary-500 text-primary-600" : "border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300"}`;

    return (
        <div className="flex bg-slate-50 h-screen overflow-hidden">
            <Sidebar />
            <div className="flex-1 overflow-y-auto w-full">
                {toast && (
                    <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg text-sm font-medium shadow-lg transition-all ${toast.type === "error" ? "bg-red-500 text-white" : "bg-emerald-500 text-white"}`}>
                        {toast.msg}
                    </div>
                )}

                <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-zinc-200/60 px-6 pt-4">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-lg font-bold text-zinc-800 flex items-center gap-2">
                                <Wrench className="w-5 h-5 text-primary-600" /> Master Data — Category
                            </h2>
                            <p className="text-xs text-zinc-400">Manage separate lists for each category field</p>
                        </div>
                        <button onClick={openAdd} className="flex items-center gap-1.5 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors shadow-sm">
                            <Plus className="w-4 h-4" /> Add {activeTabConfig?.label}
                        </button>
                    </div>

                    <div className="flex gap-4 overflow-x-auto no-scrollbar border-b border-zinc-200">
                        {CATEGORY_TABS.map(tab => (
                            <button key={tab.id} onClick={() => { setActiveTab(tab.id); setSearch(""); }} className={tabClass(tab.id)}>
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="p-6 max-w-5xl mx-auto space-y-4">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder={`Search ${activeTabConfig?.label}...`} className="w-full pl-10 pr-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" />
                    </div>

                    {loading ? <p className="text-sm text-zinc-400">Loading...</p> : (
                        <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
                            <table className="w-full text-left text-sm text-zinc-600">
                                <thead className="bg-zinc-50 border-b border-zinc-200 text-xs uppercase text-zinc-500">
                                    <tr>
                                        <th className="px-4 py-3 w-10">No</th>
                                        <th className="px-4 py-3">Value</th>
                                        {activeTabConfig?.hasParent && <th className="px-4 py-3">Parent ({CATEGORY_TABS.find(t => t.id === activeTabConfig.hasParent)?.label})</th>}
                                        <th className="px-4 py-3 text-right w-24">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-100">
                                    {currentTabData.length === 0 ? (
                                        <tr><td colSpan={4} className="px-4 py-6 text-center text-sm text-zinc-400">Belum ada data</td></tr>
                                    ) : currentTabData.map((item, i) => (
                                        <tr key={item._id} className="hover:bg-zinc-50">
                                            <td className="px-4 py-3 text-zinc-400">{i + 1}</td>
                                            <td className="px-4 py-3 font-medium text-zinc-800">{item.value}</td>
                                            {activeTabConfig?.hasParent && <td className="px-4 py-3">
                                                {item.parent ? <span className="bg-zinc-100 text-zinc-600 px-2.5 py-1 rounded-md text-xs font-medium border border-zinc-200">{item.parent}</span> : "-"}
                                            </td>}
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex justify-end gap-1">
                                                    <button onClick={() => openEdit(item)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg" title="Edit"><Edit2 className="w-4 h-4" /></button>
                                                    <button onClick={() => handleDelete(item._id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg" title="Delete"><Trash2 className="w-4 h-4" /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                        <div className="bg-white rounded-2xl shadow-xl w-[480px] overflow-hidden">
                            <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
                                <h3 className="text-base font-bold text-zinc-800">{editItem ? `Edit ${activeTabConfig?.label}` : `Add ${activeTabConfig?.label}`}</h3>
                                <button onClick={() => setShowModal(false)} className="p-1 hover:bg-zinc-200 rounded-lg transition-colors"><X className="w-5 h-5 text-zinc-500" /></button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className={labelClass}>Value</label>
                                    <input value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} className={inputClass} placeholder="Enter value (comma separated for multiple)" autoFocus />
                                    {!editItem && <p className="text-[10px] text-zinc-400 mt-1">Gunakan koma (,) untuk input lebih dari satu sekaligus.</p>}
                                </div>
                                {activeTabConfig?.hasParent && (
                                    <div>
                                        <label className={labelClass}>Parent ({CATEGORY_TABS.find(t => t.id === activeTabConfig.hasParent)?.label}) <span className="text-[10px] text-emerald-500 font-normal normal-case float-right mt-0.5">Dependent Dropdown Link</span></label>
                                        <select value={form.parent} onChange={e => setForm({ ...form, parent: e.target.value })} className={inputClass}>
                                            <option value="">- No Parent -</option>
                                            {parentOptions.map(p => (
                                                <option key={p._id} value={p.value}>{p.value}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>
                            <div className="px-6 py-4 border-t border-zinc-100 bg-zinc-50/50 flex items-center justify-end gap-2">
                                <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-600 hover:bg-zinc-200 transition-colors">Cancel</button>
                                <button onClick={handleSave} className="px-5 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 shadow-sm transition-colors">Save</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
