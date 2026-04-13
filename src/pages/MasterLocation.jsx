import React, { useState, useEffect, useMemo } from "react";
import Sidebar from "@/components/Sidebar";
import axios from "@/lib/axios";
import { Plus, Edit2, Trash2, X, Search, MapPin, Globe } from "lucide-react";

const REGION_SITE_TABS = [
    { id: "region", label: "Region" },
    { id: "siteGroup", label: "Site Group", hasParent: "region" },
    { id: "site", label: "Site", hasParent: "siteGroup" },
    { id: "division", label: "Division" },
    { id: "department", label: "Department" },
    { id: "ownerSite", label: "Owner Site" },
];

export default function MasterLocation() {
    const [activeMainTab, setActiveMainTab] = useState("location"); // "location" or "regionSite"
    const [activeFieldTab, setActiveFieldTab] = useState(REGION_SITE_TABS[0].id);

    const [locations, setLocations] = useState([]);
    const [fieldOptions, setFieldOptions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null);
    const [search, setSearch] = useState("");

    // Location modal
    const [showLocModal, setShowLocModal] = useState(false);
    const [editLoc, setEditLoc] = useState(null);
    const [locForm, setLocForm] = useState({ room: "", floor: "", category: "Unassigned" });

    // Region & Site Field modal
    const [showFieldModal, setShowFieldModal] = useState(false);
    const [editField, setEditField] = useState(null);
    const [fieldForm, setFieldForm] = useState({ value: "", parent: "" });

    const showToast = (msg, type = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const [locRes, optRes] = await Promise.all([
                axios.get("/api/location"),
                axios.get("/api/field-options"),
            ]);
            setLocations(locRes.data);
            setFieldOptions(optRes.data);
        } catch { showToast("Gagal mengambil data", "error"); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    // --- Location Data ---
    const filteredLoc = useMemo(() => {
        if (!search.trim()) return locations;
        const q = search.toLowerCase();
        return locations.filter(l =>
            (l.room || "").toLowerCase().includes(q) ||
            (l.category || "").toLowerCase().includes(q) ||
            (l.floor || "").toLowerCase().includes(q)
        );
    }, [locations, search]);

    const openAddLoc = () => { setLocForm({ room: "", floor: "", category: "Unassigned" }); setEditLoc(null); setShowLocModal(true); };
    const openEditLoc = (loc) => { setLocForm({ room: loc.room || "", floor: loc.floor || "", category: loc.category || "" }); setEditLoc(loc); setShowLocModal(true); };

    const handleSaveLoc = async () => {
        try {
            if (editLoc?._id) {
                await axios.put(`/api/location/${editLoc._id}`, locForm);
                showToast("Lokasi diperbarui");
            } else {
                await axios.post("/api/location", locForm);
                showToast("Lokasi ditambahkan");
            }
            setShowLocModal(false);
            fetchData();
        } catch { showToast("Gagal menyimpan lokasi", "error"); }
    };

    const handleDeleteLoc = async (id) => {
        if (!confirm("Hapus lokasi ini?")) return;
        try { await axios.delete(`/api/location/${id}`); showToast("Lokasi dihapus"); fetchData(); }
        catch { showToast("Gagal menghapus", "error"); }
    };

    // --- Region & Site Fields Data ---
    const currentFieldData = useMemo(() => {
        let data = fieldOptions.filter(o => o.type === activeFieldTab);
        if (search.trim()) {
            const q = search.toLowerCase();
            data = data.filter(o => (o.value || "").toLowerCase().includes(q));
        }
        return data;
    }, [fieldOptions, activeFieldTab, search]);

    const activeFieldConfig = REGION_SITE_TABS.find(t => t.id === activeFieldTab);
    const parentOptions = useMemo(() => {
        if (!activeFieldConfig?.hasParent) return [];
        return fieldOptions.filter(o => o.type === activeFieldConfig.hasParent);
    }, [fieldOptions, activeFieldConfig]);

    const openAddField = () => { setFieldForm({ value: "", parent: "" }); setEditField(null); setShowFieldModal(true); };
    const openEditField = (item) => { setFieldForm({ value: item.value || "", parent: item.parent || "" }); setEditField(item); setShowFieldModal(true); };

    const handleSaveField = async () => {
        if (!fieldForm.value) return showToast("Value tidak boleh kosong", "error");
        
        const values = fieldForm.value.split(",").map(v => v.trim()).filter(Boolean);
        
        try {
            if (editField?._id) {
                await axios.put(`/api/field-options/${editField._id}`, { ...fieldForm, value: values[0] });
                showToast("Data diperbarui");
            } else {
                for (const val of values) {
                    await axios.post("/api/field-options", { type: activeFieldTab, value: val, parent: fieldForm.parent });
                }
                showToast("Data disimpan");
            }
            setShowFieldModal(false);
            fetchData();
        } catch { showToast("Gagal menyimpan", "error"); }
    };

    const handleDeleteField = async (id) => {
        if (!confirm("Hapus item ini?")) return;
        try { await axios.delete(`/api/field-options/${id}`); showToast("Item dihapus"); fetchData(); }
        catch { showToast("Gagal menghapus", "error"); }
    };

    const inputClass = "w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all";
    const labelClass = "block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1";
    const mainTabClass = (t) => `px-5 py-2 text-sm font-medium rounded-lg transition-colors ${activeMainTab === t ? "bg-primary-600 text-white shadow-sm" : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700"}`;
    const fieldTabClass = (id) => `px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeFieldTab === id ? "border-primary-500 text-primary-600" : "border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300"}`;

    return (
        <div className="flex bg-slate-50 h-screen overflow-hidden">
            <Sidebar />
            <div className="flex-1 overflow-y-auto w-full">
                {toast && (
                    <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg text-sm font-medium shadow-lg transition-all ${toast.type === "error" ? "bg-red-500 text-white" : "bg-emerald-500 text-white"}`}>
                        {toast.msg}
                    </div>
                )}

                <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-zinc-200/60 px-6 pt-4 pb-0">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-lg font-bold text-zinc-800 flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-primary-600" /> Master Data — Location
                            </h2>
                            <p className="text-xs text-zinc-400">Manage Physical Locations and Region/Site Fields</p>
                        </div>
                        <button
                            onClick={activeMainTab === "location" ? openAddLoc : openAddField}
                            className="flex items-center gap-1.5 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors shadow-sm"
                        >
                            <Plus className="w-4 h-4" /> {activeMainTab === "location" ? "Add Location" : `Add ${activeFieldConfig?.label}`}
                        </button>
                    </div>

                    <div className="flex gap-2 mb-4">
                        <button onClick={() => { setActiveMainTab("location"); setSearch(""); }} className={mainTabClass("location")}>
                            <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Physical Location</span>
                        </button>
                        <button onClick={() => { setActiveMainTab("regionSite"); setSearch(""); }} className={mainTabClass("regionSite")}>
                            <span className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" /> Region & Site Fields</span>
                        </button>
                    </div>

                    {activeMainTab === "regionSite" && (
                        <div className="flex gap-4 overflow-x-auto no-scrollbar border-b border-zinc-200">
                            {REGION_SITE_TABS.map(tab => (
                                <button key={tab.id} onClick={() => { setActiveFieldTab(tab.id); setSearch(""); }} className={fieldTabClass(tab.id)}>
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-6 max-w-5xl mx-auto space-y-4">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                        <input value={search} onChange={e => setSearch(e.target.value)}
                            placeholder={activeMainTab === "location" ? "Cari room, category..." : `Search ${activeFieldConfig?.label}...`}
                            className="w-full pl-10 pr-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                        />
                    </div>

                    {/* ===== LOCATION TAB ===== */}
                    {activeMainTab === "location" && (
                        loading ? <p className="text-sm text-zinc-400">Loading...</p> : (
                            <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
                                <table className="w-full text-left text-sm text-zinc-600">
                                    <thead className="bg-zinc-50 border-b border-zinc-200 text-xs uppercase text-zinc-500">
                                        <tr>
                                            <th className="px-4 py-3 w-10">No</th>
                                            <th className="px-4 py-3">Room</th>
                                            <th className="px-4 py-3">Floor</th>
                                            <th className="px-4 py-3">Category</th>
                                            <th className="px-4 py-3 text-right w-24">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-100">
                                        {filteredLoc.length === 0 ? (
                                            <tr><td colSpan={5} className="px-4 py-6 text-center text-sm text-zinc-400">Belum ada data lokasi</td></tr>
                                        ) : filteredLoc.map((loc, i) => (
                                            <tr key={loc._id} className="hover:bg-zinc-50">
                                                <td className="px-4 py-3 text-zinc-400">{i + 1}</td>
                                                <td className="px-4 py-3">{loc.room}</td>
                                                <td className="px-4 py-3">{loc.floor}</td>
                                                <td className="px-4 py-3">{loc.category}</td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex justify-end gap-1">
                                                        <button onClick={() => openEditLoc(loc)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                                                        <button onClick={() => handleDeleteLoc(loc._id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )
                    )}

                    {/* ===== REGION & SITE TAB ===== */}
                    {activeMainTab === "regionSite" && (
                        loading ? <p className="text-sm text-zinc-400">Loading...</p> : (
                            <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
                                <table className="w-full text-left text-sm text-zinc-600">
                                    <thead className="bg-zinc-50 border-b border-zinc-200 text-xs uppercase text-zinc-500">
                                        <tr>
                                            <th className="px-4 py-3 w-10">No</th>
                                            <th className="px-4 py-3">Value</th>
                                            {activeFieldConfig?.hasParent && <th className="px-4 py-3">Parent ({REGION_SITE_TABS.find(t => t.id === activeFieldConfig.hasParent)?.label})</th>}
                                            <th className="px-4 py-3 text-right w-24">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-100">
                                        {currentFieldData.length === 0 ? (
                                            <tr><td colSpan={4} className="px-4 py-6 text-center text-sm text-zinc-400">Belum ada data</td></tr>
                                        ) : currentFieldData.map((item, i) => (
                                            <tr key={item._id} className="hover:bg-zinc-50">
                                                <td className="px-4 py-3 text-zinc-400">{i + 1}</td>
                                                <td className="px-4 py-3 font-medium text-zinc-800">{item.value}</td>
                                                {activeFieldConfig?.hasParent && <td className="px-4 py-3">
                                                    {item.parent ? <span className="bg-zinc-100 text-zinc-600 px-2.5 py-1 rounded-md text-xs font-medium border border-zinc-200">{item.parent}</span> : "-"}
                                                </td>}
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex justify-end gap-1">
                                                        <button onClick={() => openEditField(item)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                                                        <button onClick={() => handleDeleteField(item._id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )
                    )}
                </div>

                {/* === Location Modal === */}
                {showLocModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                        <div className="bg-white rounded-2xl shadow-xl p-6 w-[500px] max-h-[90vh] overflow-y-auto space-y-5">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold text-zinc-800">{editLoc ? "Edit Location" : "Add New Location"}</h3>
                                <button onClick={() => setShowLocModal(false)} className="p-1 hover:bg-zinc-100 rounded-lg"><X className="w-5 h-5 text-zinc-400" /></button>
                                <h3></h3>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}>Room</label>
                                    <input value={locForm.room} onChange={e => setLocForm({ ...locForm, room: e.target.value })} className={inputClass} placeholder="R201" />
                                </div>
                                <div>
                                    <label className={labelClass}>Floor</label>
                                    <input value={locForm.floor} onChange={e => setLocForm({ ...locForm, floor: e.target.value })} className={inputClass} placeholder="2" />
                                </div>
                                <div>
                                    <label className={labelClass}>Category</label>
                                    <input value={locForm.category} onChange={e => setLocForm({ ...locForm, category: e.target.value })} className={inputClass} placeholder="Staff" />
                                </div>
                            </div>
                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
                                <button onClick={() => setShowLocModal(false)} className="px-4 py-2 border border-zinc-200 rounded-lg text-sm font-medium text-zinc-600 hover:bg-zinc-50">Cancel</button>
                                <button onClick={handleSaveLoc} className="px-5 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 shadow-sm">Save</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* === Region & Site Field Modal === */}
                {showFieldModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                        <div className="bg-white rounded-2xl shadow-xl w-[480px] overflow-hidden">
                            <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
                                <h3 className="text-base font-bold text-zinc-800">{editField ? `Edit ${activeFieldConfig?.label}` : `Add ${activeFieldConfig?.label}`}</h3>
                                <button onClick={() => setShowFieldModal(false)} className="p-1 hover:bg-zinc-200 rounded-lg transition-colors"><X className="w-5 h-5 text-zinc-500" /></button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className={labelClass}>Value</label>
                                    <input value={fieldForm.value} onChange={e => setFieldForm({ ...fieldForm, value: e.target.value })} className={inputClass} placeholder="Enter value (comma separated for multiple)" autoFocus />
                                    {!editField && <p className="text-[10px] text-zinc-400 mt-1">Gunakan koma (,) untuk input lebih dari satu sekaligus.</p>}
                                </div>
                                {activeFieldConfig?.hasParent && (
                                    <div>
                                        <label className={labelClass}>Parent ({REGION_SITE_TABS.find(t => t.id === activeFieldConfig.hasParent)?.label}) <span className="text-[10px] text-emerald-500 font-normal normal-case float-right mt-0.5">Dependent Dropdown Link</span></label>
                                        <select value={fieldForm.parent} onChange={e => setFieldForm({ ...fieldForm, parent: e.target.value })} className={inputClass}>
                                            <option value="">- No Parent -</option>
                                            {parentOptions.map(p => (
                                                <option key={p._id} value={p.value}>{p.value}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>
                            <div className="px-6 py-4 border-t border-zinc-100 bg-zinc-50/50 flex items-center justify-end gap-2">
                                <button onClick={() => setShowFieldModal(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-600 hover:bg-zinc-200 transition-colors">Cancel</button>
                                <button onClick={handleSaveField} className="px-5 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 shadow-sm transition-colors">Save</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
